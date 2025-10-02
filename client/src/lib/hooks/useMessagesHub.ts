import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { startMessagesHub, on, off, connection } from "../realtime/messagesHub";
import { useStore } from "./useStore";
import { useAccount } from "./useAccount";

import type {
  ChatAppearanceUpdatedPayload,
  ChatRoomUpdatedPayload,
  DirectChatUpdatedPayload,
} from "../types/messagesHub";
import type { RegisteredHandler } from "../types/hubHandlers";
import type { ChatChannel, ChatRoom } from "../types";

type ChannelDeletedPayload = {
  chatRoomId?: string;
  channelId?: string;
};

export function useMessagesHub() {
  const queryClient = useQueryClient();
  const handlersRef = useRef<RegisteredHandler[]>([]);
  const { messagesNotificationsStore } = useStore();
  const { currentUser } = useAccount();
  const currentUserIdRef = useRef<string | undefined>(undefined);
  currentUserIdRef.current = currentUser?.id;

  useEffect(() => {
    let mounted = true;

    const attachHandler = async () => {
      try {
        await startMessagesHub();
        if (!mounted) return;

        // Clean up any previous handlers before attaching new ones
        handlersRef.current.forEach(({ event, handler }) =>
          off(event, handler)
        );
        handlersRef.current = [];

        const appearanceHandler = (...args: unknown[]) => {
          const payload = args[0] as ChatAppearanceUpdatedPayload | undefined;
          if (!payload?.chatType || !payload?.chatId) return;

          interface ChatAppearance {
            id?: string;
            chatType: string;
            chatId: string;
            defaultEmoji: string;
            backgroundKey: string;
            backgroundCustomUrl?: string | null;
            backgroundCustomPublicId?: string | null;
            updatedAt: string;
            updatedByUserId?: string;
          }

          queryClient.setQueryData<ChatAppearance>(
            ["chat-appearance", payload.chatType, payload.chatId],
            (prev: ChatAppearance | undefined): ChatAppearance => ({
              id: prev?.id ?? "",
              chatType: payload.chatType!,
              chatId: payload.chatId!,
              defaultEmoji:
                payload.defaultEmoji ?? prev?.defaultEmoji ?? "\u{1F44D}",
              backgroundKey:
                payload.backgroundKey ?? prev?.backgroundKey ?? "default",
              backgroundCustomUrl:
                payload.backgroundCustomUrl ?? prev?.backgroundCustomUrl ?? null,
              backgroundCustomPublicId:
                payload.backgroundCustomPublicId ?? prev?.backgroundCustomPublicId ?? null,
              updatedAt: payload.updatedAt ?? new Date().toISOString(),
              updatedByUserId: payload.updatedByUserId ?? prev?.updatedByUserId,
            })
          );
        };

        const updateRoomChannels = (
          chatRoomId: string,
          updater: (channels: ChatChannel[]) => ChatChannel[]
        ) => {
          let updatedSnapshot: ChatRoom | undefined;

          const applyUpdate = (room: ChatRoom | undefined) => {
            if (!room) return room;
            const updatedChannels = updater([...(room.channels ?? [])])
              .slice()
              .sort((a, b) => a.position - b.position);
            updatedSnapshot = { ...room, channels: updatedChannels };
            return updatedSnapshot;
          };

          queryClient.setQueryData<ChatRoom>(["chatRooms", chatRoomId], applyUpdate);

          const snapshot = updatedSnapshot;
          const slug = snapshot?.slug;

          if (slug) {
            queryClient.setQueryData<ChatRoom>(["chatRooms", slug], (room) =>
              room?.id === chatRoomId ? snapshot ?? room : room
            );
          }

          queryClient.setQueryData<any>(["chatRooms"], (prev: any) => {
            if (!prev) return prev;
            return {
              ...prev,
              pages: prev.pages.map((page: any) => ({
                ...page,
                items: page.items.map((room: ChatRoom) => {
                  if (room.id !== chatRoomId) return room;
                  if (snapshot) return snapshot;
                  const updated = applyUpdate(room);
                  return updated ?? room;
                }),
              })),
            };
          });
        };

        const chatRoomHandler = (...args: unknown[]) => {
          const payload = args[0] as ChatRoomUpdatedPayload | undefined;
          queryClient.invalidateQueries({
            queryKey: ["chatRooms"],
            exact: false,
          });

          const chatRoomId = payload?.chatRoomId;
          const message = payload?.message;
          const currentUserId = currentUserIdRef.current;

          if (!chatRoomId || !message) return;
          if (currentUserId && message.userId === currentUserId) return;

          messagesNotificationsStore.incrementUnread(chatRoomId);
          messagesNotificationsStore.incrementChannelUnread(
            chatRoomId,
            message.channelId
          );
        };

        const channelCreatedHandler = (...args: unknown[]) => {
          const channel = args[0] as ChatChannel | undefined;
          if (!channel?.chatRoomId) return;

          updateRoomChannels(channel.chatRoomId, (channels) => {
            const filtered = channels.filter((c) => c.id !== channel.id);
            return [...filtered, channel];
          });
        };

        const channelUpdatedHandler = (...args: unknown[]) => {
          const channel = args[0] as ChatChannel | undefined;
          if (!channel?.chatRoomId) return;

          updateRoomChannels(channel.chatRoomId, (channels) =>
            channels.map((c) => (c.id === channel.id ? channel : c))
          );
        };

        const channelDeletedHandler = (...args: unknown[]) => {
          const payload = args[0] as ChannelDeletedPayload | undefined;
          if (!payload?.chatRoomId || !payload.channelId) return;

          updateRoomChannels(payload.chatRoomId, (channels) =>
            channels.filter((c) => c.id !== payload.channelId)
          );

          messagesNotificationsStore.markChannelRead(
            payload.chatRoomId,
            payload.channelId
          );
        };

        on("ChatRoomUpdated", chatRoomHandler);
        handlersRef.current.push({
          event: "ChatRoomUpdated",
          handler: chatRoomHandler,
        });

        on("ChannelCreated", channelCreatedHandler);
        handlersRef.current.push({
          event: "ChannelCreated",
          handler: channelCreatedHandler,
        });

        on("ChannelUpdated", channelUpdatedHandler);
        handlersRef.current.push({
          event: "ChannelUpdated",
          handler: channelUpdatedHandler,
        });

        on("ChannelDeleted", channelDeletedHandler);
        handlersRef.current.push({
          event: "ChannelDeleted",
          handler: channelDeletedHandler,
        });

        on("ChatAppearanceUpdated", appearanceHandler);
        handlersRef.current.push({
          event: "ChatAppearanceUpdated",
          handler: appearanceHandler,
        });

        const directChatHandler = (...args: unknown[]) => {
          const payload = args[0] as DirectChatUpdatedPayload | undefined;
          queryClient.invalidateQueries({
            queryKey: ["direct-chats"],
            exact: false,
          });

          const directChatId = payload?.directChatId;
          const message = payload?.message;
          const currentUserId = currentUserIdRef.current;

          if (!directChatId || !message) return;
          if (currentUserId && message.senderId === currentUserId) return;

          messagesNotificationsStore.incrementDirectUnread(directChatId);
        };

        on("DirectChatUpdated", directChatHandler);
        handlersRef.current.push({
          event: "DirectChatUpdated",
          handler: directChatHandler,
        });
      } catch (err) {
        if (import.meta.env.DEV)
          console.error("Messages hub connect error", err);
      }
    };

    attachHandler();

    return () => {
      mounted = false;
      handlersRef.current.forEach(({ event, handler }) => off(event, handler));
      handlersRef.current = [];
    };
  }, [queryClient, messagesNotificationsStore]);

  return { connection: connection() };
}
