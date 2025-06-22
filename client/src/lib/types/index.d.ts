export type PagedList<T, TCursor> = {
  items: T[];
  nextCursor: TCursor;
};

export type ResetPassword = {
  email: string;
  resetCode: string;
  newPassword: string;
};

export type User = {
  id: string;
  email: string;
  displayName: string;
  imageUrl?: string;
  bannerUrl?: string;
  friendCode: string;
  hasPassword: boolean;
  status: string;
  customStatusMessage?: string;
  lastSeen: Date;
};

export type ChatRoom = {
  id: string;
  title: string;
  date: Date;
  members: Profile[];
  isAdmin: boolean;
  adminId: string;
  adminDisplayName: string;
  adminImageUrl?: string;
};

export type ChatMessage = {
  id: string;
  createdAt: Date;
  body: string;
  userId: string;
  displayName: string;
  imageUrl?: string;
  type: MessageType;

  mediaUrl?: string;
  mediaPublicId?: string;
  mediaType?: string;
  mediaFileSize?: number;
  mediaOriginalFileName?: string;
};

export type MessageType = "Text" | "Image" | "Video" | "Document" | "Audio";

export type Profile = {
  id: string;
  displayName: string;
  bio?: string;
  imageUrl?: string;
  bannerUrl?: string;
  friendsCount?: number;
  isFriend?: boolean;
  isOnline?: boolean;
  lastSeen?: Date;
  status?: string;
  customStatusMessage?: string;
};

export type Friend = {
  id: string;
  displayName: string;
  bio?: string;
  imageUrl?: string;
  bannerUrl?: string;
  friendsSince: Date;
  isOnline: boolean;
  lastSeen?: Date;
  status?: string;
  customStatusMessage?: string;
};

export type FriendRequest = {
  id: string;
  senderId: string;
  senderDisplayName: string;
  senderImageUrl?: string;
  receiverId: string;
  receiverDisplayName: string;
  receiverImageUrl?: string;
  status: "Pending" | "Accepted" | "Declined" | "Cancelled";
  createdAt: Date;
  respondedAt?: Date;
  message?: string;
};

export type FriendRequestsResponse = {
  sent: FriendRequest[];
  received: FriendRequest[];
};

export type FriendSearch = {
  id: string;
  displayName: string;
  friendCode: string;
  imageUrl?: string;
  isAlreadyFriend: boolean;
  hasPendingRequest: boolean;
};

export type DirectChat = {
  id: string;
  otherUserId: string;
  otherUserDisplayName: string;
  otherUserImageUrl?: string;
  lastMessageAt: Date;
  lastMessageBody?: string;
  lastMessageSenderId?: string;
  unreadCount: number;
  isOnline: boolean;
  canSendMessages: boolean;
  status?: string;
  customStatusMessage?: string;
};

export type DirectMessage = {
  id: string;
  body: string;
  createdAt: Date;
  senderId: string;
  senderDisplayName: string;
  senderImageUrl?: string;
  isRead: boolean;
  isOwnMessage: boolean;
  type: MessageType;

  mediaUrl?: string;
  mediaPublicId?: string;
  mediaType?: string;
  mediaFileSize?: number;
  mediaOriginalFileName?: string;
};

export type SendDirectMessageRequest = {
  body: string;
  directChatId: string;
  type?: MessageType;

  mediaUrl?: string;
  mediaPublicId?: string;
  mediaType?: string;
  mediaFileSize?: number;
  mediaOriginalFileName?: string;
};

export type SendMessageRequest = {
  body: string;
  chatRoomId: string;
  type?: MessageType;

  mediaUrl?: string;
  mediaPublicId?: string;
  mediaType?: string;
  mediaFileSize?: number;
  mediaOriginalFileName?: string;
};

export type SendFriendRequestRequest = {
  friendCode: string;
  message?: string;
};

export type RespondToFriendRequestRequest = {
  requestId: string;
  accept: boolean;
};

export type MediaUploadResult = {
  url: string;
  publicId: string;
  mediaType: string;
  fileSize: number;
  originalFileName: string;
  category: string;
  chatRoomId?: string;
  channelId?: string;
};

export type UserStatusDto = {
  userId: string;
  status: string;
  customMessage?: string;
  lastSeen: Date;
  isOnline: boolean;
};

export type OnlineUsersDto = {
  userIds: string[];
};
