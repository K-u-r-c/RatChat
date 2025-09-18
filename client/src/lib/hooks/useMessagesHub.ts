import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { startMessagesHub, on, off, connection } from "../realtime/messagesHub";

export function useMessagesHub() {
  const created = useRef(false);
  const queryClient = useQueryClient();
  const handlerRef = useRef<((payload: unknown) => void) | null>(null);

  useEffect(() => {
    let mounted = true;
    if (!created.current) {
      startMessagesHub()
        .then(() => {
          if (!mounted) return;
          const handler = () => {
            queryClient.invalidateQueries({
              queryKey: ["chatRooms"],
              exact: false,
            });
          };
          handlerRef.current = handler;
          on("ChatRoomUpdated", handler);
        })
        .catch((err) => {
          if (import.meta.env.DEV)
            console.error("Messages hub connect error", err);
        });
      created.current = true;
    }

    return () => {
      mounted = false;
      if (handlerRef.current) {
        off("ChatRoomUpdated", handlerRef.current);
        handlerRef.current = null;
      }
    };
  }, [queryClient]);

  return { connection: connection() };
}
