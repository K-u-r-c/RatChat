import type { ChatMessage, PagedList } from "./index";

export type MessagesPayload =
  | { chatRoomId?: string; data?: PagedList<ChatMessage, Date> }
  | PagedList<ChatMessage, Date>;
