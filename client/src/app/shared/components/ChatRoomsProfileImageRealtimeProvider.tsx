import { useChatRoomsProfileImageRealtime } from "../../../lib/hooks/useChatRoomsProfileImageRealtime";
import { useEffect } from "react";

export default function ChatRoomsProfileImageRealtimeProvider() {
  const { store } = useChatRoomsProfileImageRealtime();
  useEffect(() => {}, [store.hubConnection]);
  return null;
}
