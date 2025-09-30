import { useLocalObservable } from "mobx-react-lite";
import { HubConnection } from "@microsoft/signalr";
import { useEffect, useRef } from "react";
import { useStore } from "./useStore";
import notificationsApi from "../api/notifications";
import type { ChatMessage, PagedList, MessageReaction } from "../types";
import type { MessagesPayload } from "../types/messagesHook";
import { runInAction } from "mobx";
import { toast } from "react-toastify";
import { calculatePageSizeForMessages } from "../util/util";
import {
  connection as messagesConnection,
  startMessagesHub,
  joinChatChannel,
  leaveChatRoom,
  on as onEvent,
  off as offEvent,
  loadMoreMessages as hubLoadMoreMessages,
} from "../realtime/messagesHub";

const toPagedPayload = (payload: MessagesPayload) => {
  if (typeof payload === "object" && payload !== null && "data" in payload) {
    const obj = payload as {
      chatRoomId?: string;
      channelId?: string;
      data?: PagedList<ChatMessage, Date>;
    };
    return {
      chatRoomId: obj.chatRoomId,
      channelId: obj.channelId,
      paged: obj.data ?? { items: [], nextCursor: null as unknown as Date },
    };
  }

  return {
    chatRoomId: undefined,
    channelId: undefined,
    paged: payload as PagedList<ChatMessage, Date>,
  };
};

export const useMessages = (chatRoomId?: string, channelId?: string) => {
  const created = useRef(false);
  const { messagesNotificationsStore } = useStore();

  useEffect(() => {
    if (!chatRoomId) {
      messagesNotificationsStore.setActiveChatRoom(null);
      return;
    }

    const shouldSync = messagesNotificationsStore.setActiveChatRoom(
      chatRoomId,
      channelId ?? null
    );
    if (shouldSync) {
      notificationsApi.markChatRoomRead(chatRoomId).catch(() => {});
    }

    return () => {
      messagesNotificationsStore.setActiveChatRoom(null);
    };
  }, [chatRoomId, channelId, messagesNotificationsStore]);

  const messageStore = useLocalObservable(() => ({
    messages: [] as ChatMessage[],
    hubConnection: null as HubConnection | null,
    hasOlderMessages: false,
    isLoadingOlder: false,
    oldestMessageCursor: null as Date | null,
    initialLoaded: false,
    currentChatRoomId: null as string | null,
    currentChannelId: null as string | null,
    loadingOlderFor: null as
      | { chatRoomId: string; channelId: string }
      | null,

    async createHubConnection(roomId: string, channel: string) {
      if (!roomId || !channel) return;

      await startMessagesHub();
      this.hubConnection = messagesConnection();
      this.currentChatRoomId = roomId;
      this.currentChannelId = channel;
      this.loadingOlderFor = null;
      this.messages = [];
      this.hasOlderMessages = false;
      this.isLoadingOlder = false;
      this.oldestMessageCursor = null;
      this.initialLoaded = false;

      offEvent("LoadMessages");
      offEvent("ReceiveOlderMessages");
      offEvent("ChatRoomMessage");
      offEvent("ReceiveReactionUpdate");
      offEvent("ReceiveError");

      const initialPageSize = calculatePageSizeForMessages();

      onEvent("LoadMessages", (payload: MessagesPayload) => {
        runInAction(() => {
          const {
            chatRoomId: targetChatId,
            channelId: targetChannelId,
            paged,
          } = toPagedPayload(payload);
          if (targetChatId && targetChatId !== this.currentChatRoomId) return;
          if (targetChannelId && targetChannelId !== this.currentChannelId) return;

          this.messages = paged.items;
          this.hasOlderMessages = !!paged.nextCursor;
          this.oldestMessageCursor = paged.nextCursor ?? null;
          this.initialLoaded = true;
        });
      });

      onEvent("ReceiveOlderMessages", (payload: MessagesPayload) => {
        runInAction(() => {
          const {
            chatRoomId: targetChatId,
            channelId: targetChannelId,
            paged,
          } = toPagedPayload(payload);
          if (
            (targetChatId && targetChatId !== this.currentChatRoomId) ||
            (targetChannelId && targetChannelId !== this.currentChannelId)
          ) {
            if (
              this.loadingOlderFor &&
              targetChatId === this.loadingOlderFor.chatRoomId &&
              targetChannelId === this.loadingOlderFor.channelId
            ) {
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
          if (message.channelId !== this.currentChannelId) return;
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
          channelId?: string;
          messageId: string;
          emoji: string;
          userId: string;
          displayName: string;
          createdAt?: string | Date;
        }) => {
          runInAction(() => {
            if (update.chatRoomId !== this.currentChatRoomId) return;
            if (update.channelId && update.channelId !== this.currentChannelId)
              return;
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

      await joinChatChannel(roomId, channel, initialPageSize);
    },

    loadOlderMessages() {
      if (!this.hubConnection || !this.hasOlderMessages || this.isLoadingOlder)
        return;

      const pageSize = Math.max(
        10,
        Math.floor(calculatePageSizeForMessages() / 2)
      );

      const targetRoomId = this.currentChatRoomId ?? chatRoomId;
      const targetChannelId = this.currentChannelId ?? channelId;

      if (!targetRoomId || !targetChannelId) {
        runInAction(() => {
          this.isLoadingOlder = false;
          this.loadingOlderFor = null;
        });
        return;
      }

      runInAction(() => {
        this.isLoadingOlder = true;
        this.loadingOlderFor = {
          chatRoomId: targetRoomId,
          channelId: targetChannelId,
        };
      });

      hubLoadMoreMessages(
        targetRoomId,
        targetChannelId,
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
        leaveChatRoom(this.currentChatRoomId, this.currentChannelId ?? undefined).catch(
          () => {}
        );
      }
      offEvent("LoadMessages");
      offEvent("ReceiveOlderMessages");
      offEvent("ChatRoomMessage");
      offEvent("ReceiveReactionUpdate");
      offEvent("ReceiveError");
      this.currentChatRoomId = null;
      this.currentChannelId = null;
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
      this.currentChannelId = null;
      this.loadingOlderFor = null;
    },
  }));

  useEffect(() => {
    if (!chatRoomId || !channelId) {
      messageStore.stopHubConnection();
      messageStore.reset();
      created.current = false;
      return;
    }

    let cancelled = false;

    messageStore.stopHubConnection();

    const connect = async () => {
      await messageStore.createHubConnection(chatRoomId, channelId);
      if (!cancelled) {
        created.current = true;
      }
    };

    connect().catch((error) => {
      if (import.meta.env.DEV) console.error("Failed to start messages hub", error);
    });

    return () => {
      cancelled = true;
      messageStore.stopHubConnection();
      messageStore.reset();
      created.current = false;
    };
  }, [chatRoomId, channelId, messageStore]);

  return {
    messageStore,
  };
};
