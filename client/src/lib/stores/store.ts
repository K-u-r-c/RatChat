import { createContext } from "react";
import { UiStore } from "./uiStore";
import { MessagesNotificationStore } from "./messagesNotificationStore";

interface Store {
  uiStore: UiStore;
  messagesNotificationsStore: MessagesNotificationStore;
}

export const store: Store = {
  uiStore: new UiStore(),
  messagesNotificationsStore: new MessagesNotificationStore(),
};

export const StoreContext = createContext(store);
