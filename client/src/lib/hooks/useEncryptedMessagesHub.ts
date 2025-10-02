import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  startEncryptedMessagesHub,
  onEncrypted,
  offEncrypted,
  encryptedConnection,
} from "../realtime/encryptedMessagesHub";
import { useStore } from "./useStore";
import { useAccount } from "./useAccount";

import type { EncryptedDirectChatUpdatedPayload } from "../types/encryptedMessagesHub";
import type { RegisteredHandler } from "../types/hubHandlers";

export function useEncryptedMessagesHub() {
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
        await startEncryptedMessagesHub();
        if (!mounted) return;

        handlersRef.current.forEach(({ event, handler }) =>
          offEncrypted(event, handler)
        );
        handlersRef.current = [];

        const encryptedChatHandler = (...args: unknown[]) => {
          const payload = args[0] as
            | EncryptedDirectChatUpdatedPayload
            | undefined;
          queryClient.invalidateQueries({
            queryKey: ["encrypted-direct-chats"],
            exact: false,
          });

          const chatId = payload?.encryptedDirectChatId;
          const message = payload?.message;
          const currentUserId = currentUserIdRef.current;

          if (!chatId || !message) return;
          if (currentUserId && message.senderId === currentUserId) return;

          messagesNotificationsStore.incrementEncryptedDirectUnread(chatId);
        };

        onEncrypted("EncryptedDirectChatUpdated", encryptedChatHandler);
        handlersRef.current.push({
          event: "EncryptedDirectChatUpdated",
          handler: encryptedChatHandler,
        });
      } catch (err) {
        if (import.meta.env.DEV)
          console.error("Encrypted messages hub connect error", err);
      }
    };

    attachHandler();

    return () => {
      mounted = false;
      handlersRef.current.forEach(({ event, handler }) =>
        offEncrypted(event, handler)
      );
      handlersRef.current = [];
    };
  }, [queryClient, messagesNotificationsStore]);

  return { connection: encryptedConnection() };
}
