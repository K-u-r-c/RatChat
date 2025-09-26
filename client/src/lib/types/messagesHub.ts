import type { ChatMessage, DirectMessage } from "./index";

export type ChatRoomUpdatedPayload = {
  chatRoomId?: string;
  message?: ChatMessage;
};

export type DirectChatUpdatedPayload = {
  directChatId?: string;
  message?: DirectMessage;
};

export type ChatAppearanceUpdatedPayload = {
  chatType?: string;
  chatId?: string;
  defaultEmoji?: string;
  backgroundKey?: string;
  backgroundCustomUrl?: string | null;
  backgroundCustomPublicId?: string | null;
  updatedAt?: string;
  updatedByUserId?: string;
};
