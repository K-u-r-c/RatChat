import { useEffect } from "react";
import { autorun } from "mobx";
import { useMessagesHub } from "../../../lib/hooks/useMessagesHub";
import { useEncryptedMessagesHub } from "../../../lib/hooks/useEncryptedMessagesHub";
import { useStore } from "../../../lib/hooks/useStore";
import notificationsApi from "../../../lib/api/notifications";

export default function MessagesRealtimeProvider() {
  useMessagesHub();
  useEncryptedMessagesHub();
  const { messagesNotificationsStore } = useStore();

  useEffect(() => {
    let cancelled = false;

    notificationsApi
      .getCounters()
      .then((data) => {
        if (!cancelled) {
          messagesNotificationsStore.hydrate(data);
        }
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [messagesNotificationsStore]);

  useEffect(() => {
    if (typeof window === "undefined" || typeof document === "undefined") {
      return;
    }

    const handleFocus = () => {
      const activeChat = messagesNotificationsStore.activeChatRoomId;
      const activeDirect = messagesNotificationsStore.activeDirectChatId;
      const chatUnread = activeChat
        ? messagesNotificationsStore.unreadByRoom.get(activeChat) ?? 0
        : 0;
      const directUnread = activeDirect
        ? messagesNotificationsStore.directUnreadByChat.get(activeDirect) ?? 0
        : 0;
      const activeEncrypted =
        messagesNotificationsStore.activeEncryptedDirectChatId;
      const encryptedUnread = activeEncrypted
        ? messagesNotificationsStore.encryptedDirectUnreadByChat.get(
            activeEncrypted
          ) ?? 0
        : 0;

      messagesNotificationsStore.setWindowFocused(true);

      if (activeChat && chatUnread > 0) {
        notificationsApi.markChatRoomRead(activeChat).catch(() => {});
      }
      if (activeDirect && directUnread > 0) {
        notificationsApi.markDirectChatRead(activeDirect).catch(() => {});
      }
      if (activeEncrypted && encryptedUnread > 0) {
        notificationsApi
          .markEncryptedDirectChatRead(activeEncrypted)
          .catch(() => {});
      }
    };

    const handleBlur = () => messagesNotificationsStore.setWindowFocused(false);

    const syncFocusState = () => {
      const isFocused =
        document.visibilityState === "visible" && document.hasFocus();
      if (isFocused) {
        handleFocus();
      } else {
        handleBlur();
      }
    };

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

  useEffect(() => {
    if (typeof document === "undefined") return;

    const baseTitle = document.title || "RatChat";
    const dispose = autorun(() => {
      const total = messagesNotificationsStore.totalUnread;
      document.title = total > 0 ? `${baseTitle} (${total})` : baseTitle;
    });

    return () => {
      dispose();
      document.title = baseTitle;
    };
  }, [messagesNotificationsStore]);

  return null;
}
