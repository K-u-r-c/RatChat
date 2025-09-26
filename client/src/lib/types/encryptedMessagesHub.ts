import type { EncryptedDirectMessage } from "./index";

export type EncryptedDirectChatUpdatedPayload = {
  encryptedDirectChatId?: string;
  message?: EncryptedDirectMessage;
};
