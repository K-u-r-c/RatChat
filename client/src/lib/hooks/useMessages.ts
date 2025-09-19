import { useLocalObservable } from "mobx-react-lite";
import { HubConnection } from "@microsoft/signalr";
import { useEffect, useRef } from "react";
import { useStore } from "./useStore";
import notificationsApi from "../api/notifications";
import type { ChatMessage, PagedList, MessageReaction } from "../types";
import { runInAction } from "mobx";
import { toast } from "react-toastify";
import { calculatePageSizeForMessages } from "../util/util";
import {
  connection as messagesConnection,
  startMessagesHub,
  joinChatRoom,
  leaveChatRoom,
  on as onEvent,
  off as offEvent,
  loadMoreMessages as hubLoadMoreMessages,
} from "../realtime/messagesHub";

type MessagesPayload =
  | { chatRoomId?: string; data?: PagedList<ChatMessage, Date> }
  | PagedList<ChatMessage, Date>;

const toPagedPayload = (payload: MessagesPayload) => {
  if (typeof payload === "object" && payload !== null && "data" in payload) {
    const obj = payload as {
      chatRoomId?: string;
      data?: PagedList<ChatMessage, Date>;
    };
    return {
      chatRoomId: obj.chatRoomId,
      paged: obj.data ?? { items: [], nextCursor: null as unknown as Date },
    };
  }

  return {
    chatRoomId: undefined,
    paged: payload as PagedList<ChatMessage, Date>,
  };
};

export const useMessages = (chatRoomId?: string) => {
  const created = useRef(false);
  const { messagesNotificationsStore } = useStore();

  useEffect(() => {
    if (!chatRoomId) {
      messagesNotificationsStore.setActiveChatRoom(null);
      return;
    }

    const shouldSync = messagesNotificationsStore.setActiveChatRoom(chatRoomId);
    if (shouldSync) {
      notificationsApi.markChatRoomRead(chatRoomId).catch(() => {});
    }

    return () => {
      messagesNotificationsStore.setActiveChatRoom(null);
    };
  }, [chatRoomId, messagesNotificationsStore]);

  const messageStore = useLocalObservable(() => ({
    messages: [] as ChatMessage[],
    hubConnection: null as HubConnection | null,
    hasOlderMessages: false,
    isLoadingOlder: false,
    oldestMessageCursor: null as Date | null,
    initialLoaded: false,
    currentChatRoomId: null as string | null,
    loadingOlderFor: null as string | null,

    async createHubConnection(roomId: string) {
      if (!roomId) return;

      await startMessagesHub();
      this.hubConnection = messagesConnection();
      this.currentChatRoomId = roomId;
      this.loadingOlderFor = null;
      this.initialLoaded = false;

      offEvent("LoadMessages");
      offEvent("ReceiveOlderMessages");
      offEvent("ChatRoomMessage");
      offEvent("ReceiveReactionUpdate");
      offEvent("ReceiveError");

      const initialPageSize = calculatePageSizeForMessages();

      onEvent("LoadMessages", (payload: MessagesPayload) => {
        runInAction(() => {
          const { chatRoomId: targetChatId, paged } = toPagedPayload(payload);
          if (targetChatId && targetChatId !== this.currentChatRoomId) return;

          this.messages = paged.items;
          this.hasOlderMessages = !!paged.nextCursor;
          this.oldestMessageCursor = paged.nextCursor ?? null;
          this.initialLoaded = true;
        });
      });

      onEvent("ReceiveOlderMessages", (payload: MessagesPayload) => {
        runInAction(() => {
          const { chatRoomId: targetChatId, paged } = toPagedPayload(payload);
          if (targetChatId && targetChatId !== this.currentChatRoomId) {
            if (this.loadingOlderFor === targetChatId) {
              this.loadingOlderFor = null;
            }
            this.isLoadingOlder = false;
            return;
          }

          this.messages = [...paged.items, ...this.messages];
          this.hasOlderMessages = !!paged.nextCursor;
          this.oldestMessageCursor = paged.nextCursor ?? null;
          this.isLoadingOlder = false;
          this.loadingOlderFor = null;
        });
      });

      onEvent("ChatRoomMessage", (message: ChatMessage) => {
        runInAction(() => {
          if (!this.initialLoaded) return;
          const exists = this.messages.some((m) => m.id === message.id);
          if (!exists) {
            this.messages.push(message);
          }
        });
      });

      onEvent(
        "ReceiveReactionUpdate",
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
            const msg = this.messages[idx] as ChatMessage & {
              reactions?: MessageReaction[];
            };
            const list: MessageReaction[] = msg.reactions
              ? [...msg.reactions]
              : [];
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
            (
              this.messages as (ChatMessage & {
                reactions?: MessageReaction[];
              })[]
            )[idx] = { ...msg, reactions: list };
          });
        }
      );

      onEvent(
        "ReceiveError",
        (payload: { errorCode: number; message: string }) => {
          runInAction(() => {
            this.isLoadingOlder = false;
            this.loadingOlderFor = null;
          });
          if (import.meta.env.DEV)
            console.log(payload.errorCode, payload.message);
          toast.error(payload.message);
        }
      );

      await joinChatRoom(roomId, initialPageSize);
    },

    loadOlderMessages() {
      if (!this.hubConnection || !this.hasOlderMessages || this.isLoadingOlder)
        return;

      runInAction(() => {
        this.isLoadingOlder = true;
        this.loadingOlderFor = this.currentChatRoomId;
      });

      const pageSize = Math.max(
        10,
        Math.floor(calculatePageSizeForMessages() / 2)
      );

      const targetRoomId = this.currentChatRoomId ?? chatRoomId;
      if (!targetRoomId) {
        runInAction(() => {
          this.isLoadingOlder = false;
          this.loadingOlderFor = null;
        });
        return;
      }

      hubLoadMoreMessages(
        targetRoomId,
        this.oldestMessageCursor,
        pageSize
      ).catch((error) => {
        runInAction(() => {
          this.isLoadingOlder = false;
          this.loadingOlderFor = null;
        });
        if (import.meta.env.DEV)
          console.log("Error loading older messages: ", error);
        toast.error("Failed to load older messages");
      });
    },

    stopHubConnection() {
      if (this.currentChatRoomId) {
        leaveChatRoom(this.currentChatRoomId).catch(() => {});
      }
      offEvent("LoadMessages");
      offEvent("ReceiveOlderMessages");
      offEvent("ChatRoomMessage");
      offEvent("ReceiveReactionUpdate");
      offEvent("ReceiveError");
      this.currentChatRoomId = null;
      this.loadingOlderFor = null;
      this.initialLoaded = false;
    },

    reset() {
      this.messages = [];
      this.hasOlderMessages = false;
      this.isLoadingOlder = false;
      this.oldestMessageCursor = null;
      this.initialLoaded = false;
      this.currentChatRoomId = null;
      this.loadingOlderFor = null;
    },
  }));

  useEffect(() => {
    if (chatRoomId && !created.current) {
      messageStore.createHubConnection(chatRoomId);
      created.current = true;
    }

    return () => {
      messageStore.stopHubConnection();
      messageStore.reset();
      created.current = false;
    };
  }, [chatRoomId, messageStore]);

  return {
    messageStore,
  };
};
