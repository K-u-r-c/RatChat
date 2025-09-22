import { useLocalObservable } from "mobx-react-lite";
import {
  HubConnection,
  HubConnectionBuilder,
  HubConnectionState,
} from "@microsoft/signalr";
import { useEffect, useRef } from "react";
import type {
  EncryptedDirectMessage,
  MessageReaction,
  PagedList,
} from "../types";
import { runInAction } from "mobx";
import { toast } from "react-toastify";
import { calculatePageSizeForMessages } from "../util/util";
import notificationsApi from "../api/notifications";
import { useStore } from "./useStore";
import { useAccount } from "./useAccount";

export const useEncryptedDirectMessages = (encryptedDirectChatId?: string) => {
  const { messagesNotificationsStore } = useStore();
  const { currentUser } = useAccount();
  const currentUserIdRef = useRef<string | undefined>(undefined);
  currentUserIdRef.current = currentUser?.id;

  const encryptedDirectMessageStore = useLocalObservable(() => ({
    messages: [] as EncryptedDirectMessage[],
    hubConnection: null as HubConnection | null,
    hasOlderMessages: false,
    isLoadingOlder: false,
    oldestMessageCursor: null as Date | null,
    currentChatId: null as string | null,

    async createHubConnection(encryptedDirectChatId: string) {
      if (!encryptedDirectChatId) return;

      if (
        this.hubConnection &&
        this.currentChatId === encryptedDirectChatId &&
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
            import.meta.env.VITE_CHATROOM_ENCRYPTED_DIRECT_MESSAGES_URL ||
            "https://localhost:5001/encrypted-direct-messages"
          }?encryptedDirectChatId=${encryptedDirectChatId}&initialPageSize=${initialPageSize}`,
          {
            withCredentials: true,
          }
        )
        .withAutomaticReconnect()
        .build();

      this.currentChatId = encryptedDirectChatId;

      this.hubConnection.start().catch((error) => {
        const isNegotiationAbort =
          error instanceof Error &&
          typeof error.message === "string" &&
          error.message.includes("stopped during negotiation");

        if (!isNegotiationAbort && import.meta.env.DEV) {
          console.log(
            "Error establishing encrypted direct message connection: ",
            error
          );
        }

        if (!isNegotiationAbort) {
          this.hubConnection?.stop().catch(() => {});
          this.hubConnection = null;
          this.currentChatId = null;
        }
      });

      this.hubConnection.on(
        "LoadEncryptedDirectMessages",
        (pagedResult: PagedList<EncryptedDirectMessage, Date>) => {
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
        "ReceiveOlderEncryptedMessages",
        (pagedResult: PagedList<EncryptedDirectMessage, Date>) => {
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
        "ReceiveEncryptedDirectMessage",
        (message: EncryptedDirectMessage) => {
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
            messagesNotificationsStore.markEncryptedDirectChatRead(
              encryptedDirectChatId
            );
          if (cleared) {
            notificationsApi
              .markEncryptedDirectChatRead(encryptedDirectChatId)
              .catch(() => {});
          }
        }
      );

      this.hubConnection.on(
        "ReceiveEncryptedReactionUpdate",
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
            const msg = this.messages[idx] as EncryptedDirectMessage & {
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
            this.messages[idx] = {
              ...(msg as EncryptedDirectMessage),
              reactions: list,
            };
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
          "LoadMoreEncryptedMessages",
          encryptedDirectChatId,
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
    if (!encryptedDirectChatId) {
      encryptedDirectMessageStore.stopHubConnection();
      encryptedDirectMessageStore.reset();
      return;
    }

    encryptedDirectMessageStore
      .createHubConnection(encryptedDirectChatId)
      .catch(() => {});
  }, [encryptedDirectChatId, encryptedDirectMessageStore]);

  useEffect(() => {
    if (!encryptedDirectChatId) {
      messagesNotificationsStore.setActiveEncryptedDirectChat(null);
      return;
    }

    const shouldSync = messagesNotificationsStore.setActiveEncryptedDirectChat(
      encryptedDirectChatId
    );
    if (shouldSync) {
      notificationsApi
        .markEncryptedDirectChatRead(encryptedDirectChatId)
        .catch(() => {});
    }

    return () => {
      messagesNotificationsStore.setActiveEncryptedDirectChat(null);
    };
  }, [encryptedDirectChatId, messagesNotificationsStore]);

  return {
    encryptedDirectMessageStore,
  };
};
