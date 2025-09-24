import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { startMessagesHub, on, off, connection } from "../realtime/messagesHub";
import { useStore } from "./useStore";
import { useAccount } from "./useAccount";
import type { ChatMessage, DirectMessage } from "../types";

type ChatRoomUpdatedPayload = {
  chatRoomId?: string;
  message?: ChatMessage;
};

type DirectChatUpdatedPayload = {
  directChatId?: string;
  message?: DirectMessage;
};

type ChatAppearanceUpdatedPayload = {
  chatType?: string;
  chatId?: string;
  defaultEmoji?: string;
  backgroundKey?: string;
  updatedAt?: string;
  updatedByUserId?: string;
};

type RegisteredHandler = {
  event: string;
  handler: (...args: unknown[]) => void;
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
              updatedAt: payload.updatedAt ?? new Date().toISOString(),
              updatedByUserId: payload.updatedByUserId ?? prev?.updatedByUserId,
            })
          );
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
        };

        on("ChatRoomUpdated", chatRoomHandler);
        handlersRef.current.push({
          event: "ChatRoomUpdated",
          handler: chatRoomHandler,
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
