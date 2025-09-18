import { useLocalObservable } from "mobx-react-lite";
import {
  HubConnection,
  HubConnectionBuilder,
  HubConnectionState,
} from "@microsoft/signalr";
import { useEffect, useRef } from "react";
import type { DirectMessage, MessageReaction, PagedList } from "../types";
import { runInAction } from "mobx";
import { toast } from "react-toastify";
import { calculatePageSizeForMessages } from "../util/util";
import { useStore } from "./useStore";
import { useAccount } from "./useAccount";

export const useDirectMessages = (directChatId?: string) => {
  const created = useRef(false);
  const { messagesNotificationsStore } = useStore();
  const { currentUser } = useAccount();
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
        await this.hubConnection.stop().catch(() => {});
        this.hubConnection = null;
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
        .withAutomaticReconnect()
        .build();

      this.currentChatId = directChatId;

      this.hubConnection
        .start()
        .catch((error) =>
          console.log("Error establishing direct message connection: ", error)
        );

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

          messagesNotificationsStore.markDirectChatRead(directChatId);
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
            this.messages[idx] = { ...(msg as DirectMessage), reactions: list };
          });
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
          console.log("Error loading older direct messages: ", error);
          toast.error("Failed to load older direct messages");
        });
    },

    async stopHubConnection() {
      if (this.hubConnection) {
        const connection = this.hubConnection;
        this.hubConnection = null;
        await connection.stop().catch(() => {});
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
    if (directChatId && !created.current) {
      directMessageStore
        .createHubConnection(directChatId)
        .catch((error) =>
          console.log("Error creating direct message connection: ", error)
        );
      created.current = true;
    }

    return () => {
      directMessageStore.stopHubConnection();
      directMessageStore.reset();
      created.current = false;
    };
  }, [directChatId, directMessageStore]);

  useEffect(() => {
    if (!directChatId) {
      messagesNotificationsStore.setActiveDirectChat(null);
      return;
    }

    messagesNotificationsStore.setActiveDirectChat(directChatId);

    return () => {
      messagesNotificationsStore.setActiveDirectChat(null);
    };
  }, [directChatId, messagesNotificationsStore]);

  return {
    directMessageStore,
  };
};
