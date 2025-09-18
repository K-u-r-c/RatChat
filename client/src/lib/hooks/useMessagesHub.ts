import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { startMessagesHub, on, off, connection } from "../realtime/messagesHub";
import { useStore } from "./useStore";
import { useAccount } from "./useAccount";
import type { ChatMessage } from "../types";

type ChatRoomUpdatedPayload = {
  chatRoomId?: string;
  message?: ChatMessage;
};

export function useMessagesHub() {
  const queryClient = useQueryClient();
  const handlerRef = useRef<((...args: unknown[]) => void) | null>(null);
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

        if (handlerRef.current) {
          off("ChatRoomUpdated", handlerRef.current);
        }

        const handler = (...args: unknown[]) => {
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

        handlerRef.current = handler;
        on("ChatRoomUpdated", handler);
      } catch (err) {
        if (import.meta.env.DEV)
          console.error("Messages hub connect error", err);
      }
    };

    attachHandler();

    return () => {
      mounted = false;
      if (handlerRef.current) {
        off("ChatRoomUpdated", handlerRef.current);
        handlerRef.current = null;
      }
    };
  }, [queryClient, messagesNotificationsStore]);

  return { connection: connection() };
}
