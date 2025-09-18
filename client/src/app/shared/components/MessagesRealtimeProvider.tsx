import { useMessagesHub } from "../../../lib/hooks/useMessagesHub";

export default function MessagesRealtimeProvider() {
  useMessagesHub();
  return null;
}
