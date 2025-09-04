/**
 * Enum of permissions mirroring backend.
 * Check: Domain/Enums/ChatRoomPermissions.cs
 */
export const CHATROOM_PERMISSIONS = {
  SendMessages: "Send Messages",
  CreateInviteLinks: "Create invite links",
} as const;

export type CHATROOM_PERMISSION =
  (typeof CHATROOM_PERMISSIONS)[keyof typeof CHATROOM_PERMISSIONS];
