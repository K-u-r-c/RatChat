import { createContext } from "react";
import { UiStore } from "./uiStore";
import { ChatRoomsStore } from "./chatRoomsStore";

interface Store {
  uiStore: UiStore;
  chatRoomsStore: ChatRoomsStore;
}

export const store: Store = {
  uiStore: new UiStore(),
  chatRoomsStore: new ChatRoomsStore(),
};

export const StoreContext = createContext(store);
