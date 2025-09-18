import { useEffect } from "react";
import { useMessagesHub } from "../../../lib/hooks/useMessagesHub";
import { useStore } from "../../../lib/hooks/useStore";

export default function MessagesRealtimeProvider() {
  useMessagesHub();
  const { messagesNotificationsStore } = useStore();

  useEffect(() => {
    if (typeof window === "undefined" || typeof document === "undefined") {
      return;
    }

    const syncFocusState = () => {
      const isFocused =
        document.visibilityState === "visible" && document.hasFocus();
      messagesNotificationsStore.setWindowFocused(isFocused);
    };

    const handleFocus = () => messagesNotificationsStore.setWindowFocused(true);
    const handleBlur = () => messagesNotificationsStore.setWindowFocused(false);

    document.addEventListener("visibilitychange", syncFocusState);
    window.addEventListener("focus", handleFocus);
    window.addEventListener("blur", handleBlur);

    syncFocusState();

    return () => {
      document.removeEventListener("visibilitychange", syncFocusState);
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("blur", handleBlur);
    };
  }, [messagesNotificationsStore]);

  return null;
}
