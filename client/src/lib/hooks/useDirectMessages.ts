import {useLocalObservable} from "mobx-react-lite";
import {useQueryClient} from "@tanstack/react-query";
import {HubConnection, HubConnectionBuilder, HubConnectionState,} from "@microsoft/signalr";
import {useEffect, useRef} from "react";
import type {DirectMessage, MessageReaction, PagedList} from "../types";
import {runInAction} from "mobx";
import {toast} from "react-toastify";
import {calculatePageSizeForMessages} from "../util/util";
import notificationsApi from "../api/notifications";
import {useStore} from "./useStore";
import {useAccount} from "./useAccount";
import {hubLogger} from "../util/hubLogger.ts";

export const useDirectMessages = (directChatId?: string) => {
  const queryClient = useQueryClient();
  const {messagesNotificationsStore} = useStore();
  const {currentUser} = useAccount();
  const currentUserIdRef = useRef<string | undefined>(undefined);
  currentUserIdRef.current = currentUser?.id;

  const directMessageStore = useLocalObservable(() => ({
    messages: [] as DirectMessage[],
    hubConnection: null as HubConnection | null,
    hasOlderMessages: false,
    isLoadingOlder: false,
    oldestMessageCursor: null as Date | null,
    currentChatId: null as string | null,

    async createHubConnection(directChatId: string) {
      if (!directChatId) return;

      if (
        this.hubConnection &&
        this.currentChatId === directChatId &&
        this.hubConnection.state !== HubConnectionState.Disconnected
      ) {
        return;
      }

      if (this.hubConnection) {
        await this.hubConnection.stop().catch(() => {
        });
        this.hubConnection = null;
      }

      if (this.currentChatId !== directChatId) {
        runInAction(() => {
          this.reset();
        });
      }

      const initialPageSize = calculatePageSizeForMessages();

      this.hubConnection = new HubConnectionBuilder()
        .withUrl(
          `${
            import.meta.env.VITE_DIRECT_MESSAGE_URL ||
            "https://localhost:5001/direct-messages"
          }?directChatId=${directChatId}&initialPageSize=${initialPageSize}`,
          {
            withCredentials: true,
          }
        )
        .configureLogging(new hubLogger())
        .withAutomaticReconnect()
        .build();

      this.currentChatId = directChatId;

      this.hubConnection.start().catch((error) => {
        const isNegotiationAbort =
          error instanceof Error &&
          typeof error.message === "string" &&
          error.message.includes("stopped during negotiation");

        if (!isNegotiationAbort && import.meta.env.DEV) {
          console.log("Error establishing direct message connection: ", error);
        }

        if (!isNegotiationAbort) {
          this.hubConnection?.stop().catch(() => {
          });
          this.hubConnection = null;
          this.currentChatId = null;
        }
      });

      this.hubConnection.on(
        "LoadDirectMessages",
        (pagedResult: PagedList<DirectMessage, Date>) => {
          runInAction(() => {
            const existingIds = new Set(this.messages.map((m) => m.id));
            const merged = pagedResult.items.filter(
              (m) => !existingIds.has(m.id)
            );
            if (this.messages.length === 0) {
              this.messages = pagedResult.items;
            } else if (merged.length > 0) {
              this.messages.push(...merged);
            }
            this.hasOlderMessages = !!pagedResult.nextCursor;
            if (pagedResult.nextCursor) {
              this.oldestMessageCursor = pagedResult.nextCursor;
            }
          });
        }
      );

      this.hubConnection.on(
        "ReceiveOlderDirectMessages",
        (pagedResult: PagedList<DirectMessage, Date>) => {
          runInAction(() => {
            const existingIds = new Set(this.messages.map((m) => m.id));
            const merged = pagedResult.items.filter(
              (m) => !existingIds.has(m.id)
            );
            this.messages = [...merged, ...this.messages];
            this.hasOlderMessages = !!pagedResult.nextCursor;
            this.oldestMessageCursor = pagedResult.nextCursor;
            this.isLoadingOlder = false;
          });
        }
      );

      this.hubConnection.on(
        "ReceiveDirectMessage",
        (message: DirectMessage) => {
          runInAction(() => {
            const existingIndex = this.messages.findIndex(
              (m) => m.id === message.id
            );
            if (existingIndex === -1) {
              this.messages.push(message);
            } else {
              this.messages[existingIndex] = message;
            }
          });

          const cleared =
            messagesNotificationsStore.markDirectChatRead(directChatId);
          if (cleared) {
            notificationsApi.markDirectChatRead(directChatId).catch(() => {
            });
          }
        }
      );

      this.hubConnection.on(
        "ReceiveDirectReactionUpdate",
        (update: {
          action: "added" | "removed";
          chatRoomId: string;
          messageId: string;
          emoji: string;
          userId: string;
          displayName: string;
          createdAt?: string | Date;
        }) => {
          runInAction(() => {
            const idx = this.messages.findIndex(
              (m) => m.id === update.messageId
            );
            if (idx === -1) return;
            const msg = this.messages[idx] as DirectMessage & {
              reactions?: MessageReaction[];
            };
            const list = msg.reactions ? [...msg.reactions] : [];
            if (update.action === "added") {
              if (
                !list.some(
                  (r) => r.userId === update.userId && r.emoji === update.emoji
                )
              ) {
                list.push({
                  messageId: update.messageId,
                  emoji: update.emoji,
                  userId: update.userId,
                  displayName: update.displayName,
                  createdAt: update.createdAt
                    ? new Date(update.createdAt)
                    : new Date(),
                });
              }
            } else {
              const i = list.findIndex(
                (r) => r.userId === update.userId && r.emoji === update.emoji
              );
              if (i !== -1) list.splice(i, 1);
            }
            this.messages[idx] = {...(msg as DirectMessage), reactions: list};
          });
        }
      );

      this.hubConnection.on(
        "ChatAppearanceUpdated",
        (payload: {
          chatType?: string;
          chatId?: string;
          defaultEmoji?: string;
          backgroundKey?: string;
          backgroundCustomUrl?: string | null;
          backgroundCustomPublicId?: string | null;
          updatedAt?: string;
          updatedByUserId?: string;
        }) => {
          if (!payload?.chatType || !payload?.chatId) return;

          queryClient.setQueryData(
            ["chat-appearance", payload.chatType, payload.chatId],
            (prev) => ({
              id: (prev as { id?: string })?.id ?? "",
              chatType: payload.chatType!,
              chatId: payload.chatId!,
              defaultEmoji:
                payload.defaultEmoji ??
                (prev as { defaultEmoji?: string })?.defaultEmoji ??
                "\u{1F44D}",
              backgroundKey:
                payload.backgroundKey ??
                (prev as { backgroundKey?: string })?.backgroundKey ??
                "default",
              backgroundCustomUrl:
                payload.backgroundCustomUrl ??
                (prev as { backgroundCustomUrl?: string | null })?.backgroundCustomUrl ??
                null,
              backgroundCustomPublicId:
                payload.backgroundCustomPublicId ??
                (prev as { backgroundCustomPublicId?: string | null })?.backgroundCustomPublicId ??
                null,
              updatedAt: payload.updatedAt ?? new Date().toISOString(),
              updatedByUserId:
                payload.updatedByUserId ??
                (prev as { updatedByUserId?: string | undefined })
                  ?.updatedByUserId,
            })
          );
        }
      );

      this.hubConnection.on(
        "ReceiveError",
        (errorCode: number, message: string) => {
          runInAction(() => {
            this.isLoadingOlder = false;
          });
          if (import.meta.env.DEV) console.log(errorCode, message);
          toast.error(message);
        }
      );
    },

    loadOlderMessages() {
      if (!this.hubConnection || !this.hasOlderMessages || this.isLoadingOlder)
        return;

      runInAction(() => {
        this.isLoadingOlder = true;
      });

      const pageSize = Math.max(
        10,
        Math.floor(calculatePageSizeForMessages() / 2)
      );

      this.hubConnection
        .invoke(
          "LoadMoreDirectMessages",
          directChatId,
          this.oldestMessageCursor,
          pageSize
        )
        .catch((error) => {
          runInAction(() => {
            this.isLoadingOlder = false;
          });
          if (import.meta.env.DEV)
            console.log("Error loading older messages: ", error);
          toast.error("Failed to load older messages");
        });
    },

    async stopHubConnection() {
      if (this.hubConnection) {
        const connection = this.hubConnection;
        this.hubConnection = null;
        await connection.stop().catch(() => {
        });
      }
      this.currentChatId = null;
    },

    reset() {
      this.messages = [];
      this.hasOlderMessages = false;
      this.isLoadingOlder = false;
      this.oldestMessageCursor = null;
    },
  }));

  useEffect(() => {
    if (!directChatId) {
      directMessageStore.stopHubConnection();
      directMessageStore.reset();
      return;
    }

    directMessageStore.createHubConnection(directChatId).catch(() => {
    });
  }, [directChatId, directMessageStore]);

  useEffect(() => {
    if (!directChatId) {
      messagesNotificationsStore.setActiveDirectChat(null);
      return;
    }

    const shouldSync =
      messagesNotificationsStore.setActiveDirectChat(directChatId);
    if (shouldSync) {
      notificationsApi.markDirectChatRead(directChatId).catch(() => {
      });
    }

    return () => {
      messagesNotificationsStore.setActiveDirectChat(null);
    };
  }, [directChatId, messagesNotificationsStore]);

  return {
    directMessageStore,
  };
};
