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
  slug: string;
  tag: number;
  hasPassword: boolean;
  status: string;
  customStatusMessage?: string;
  lastSeen: Date;
};

export type ChatRoomBan = {
  userId: string;
  user: User?;
  chatRoomId: string;
  dateBanned: string;
};

export type ChatRoom = {
  id: string;
  slug: string;
  title: string;
  imageUrl?: string;
  date: Date;
  members: Profile[];
  isOwner: boolean;
  ownerId: string;
  ownerDisplayName: string;
  ownerImageUrl?: string;
  bans: ChatRoomBan[];
};

export type ChatRoomIdentifier = {
  id: string;
  slug: string;
};

export type BaseMessage = {
  id: string;
  createdAt: Date;
  body: string;
  type: MessageType;
  senderId?: string;
  senderDisplayName?: string;
  senderSlug?: string;
  senderImageUrl?: string;
  displayName?: string;
  userId?: string;
  userSlug?: string;
  imageUrl?: string;
  mediaUrl?: string;
  mediaPublicId?: string;
  mediaType?: string;
  mediaFileSize?: number;
  mediaOriginalFileName?: string;
  // Reply metadata (optional, present when this message is a reply)
  replyToMessageId?: string;
  replyToDisplayName?: string;
  replyToBody?: string;
  replyToType?: MessageType;
  replyToMediaOriginalFileName?: string;
  reactions?: MessageReaction[];
};

export type BaseMessageStore = {
  messages: BaseMessage[];
  hasOlderMessages: boolean;
  isLoadingOlder: boolean;
  loadOlderMessages: () => void;
  hubConnection: unknown;
};

export type ChatRoomRole = {
  id: string;
  name: string;
  description?: string | null | undefined;
  color: string;
  createdAt: Date;
  isDefault: boolean;
  chatRoomId: string;
  permissions: ChatRoomPermission[];
};

export type ChatRoomPermission = {
  id: string;
  roleId: string;
  name: string;
  description: string;
  isAllowed: boolean;
};

export type ChatMessage = {
  id: string;
  createdAt: Date;
  body: string;
  userId: string;
  userSlug: string;
  displayName: string;
  imageUrl?: string;
  type: MessageType;

  mediaUrl?: string;
  mediaPublicId?: string;
  mediaType?: string;
  mediaFileSize?: number;
  mediaOriginalFileName?: string;
  replyToMessageId?: string;
  replyToDisplayName?: string;
  replyToBody?: string;
  replyToType?: MessageType;
  replyToMediaOriginalFileName?: string;
  reactions?: MessageReaction[];
};

export type MessageType = "Text" | "Image" | "Video" | "Document" | "Audio";

export type Profile = {
  id: string;
  displayName: string;
  tag?: number;
  bio?: string;
  imageUrl?: string;
  bannerUrl?: string;
  slug: string;
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
  slug: string;
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
  senderSlug: string;
  senderDisplayName: string;
  senderImageUrl?: string;
  receiverId: string;
  receiverSlug: string;
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
  slug: string;
  tag: number;
  imageUrl?: string;
  isAlreadyFriend: boolean;
  hasPendingRequest: boolean;
};

export type DirectChat = {
  id: string;
  otherUserId: string;
  otherUserDisplayName: string;
  otherUserSlug: string;
  otherUserImageUrl?: string;
  lastMessageAt: Date;
  lastMessageBody?: string;
  lastMessageSenderId?: string;
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
  senderSlug: string;
  senderImageUrl?: string;
  isOwnMessage: boolean;
  type: MessageType;

  mediaUrl?: string;
  mediaPublicId?: string;
  mediaType?: string;
  mediaFileSize?: number;
  mediaOriginalFileName?: string;
  replyToMessageId?: string;
  replyToDisplayName?: string;
  replyToBody?: string;
  replyToType?: MessageType;
  replyToMediaOriginalFileName?: string;
  reactions?: MessageReaction[];
};
export type EncryptedDirectChat = {
  id: string;
  otherUserId: string;
  otherUserDisplayName: string;
  otherUserSlug: string;
  otherUserImageUrl?: string;
  lastActivityAt: Date;
  lastMessageSenderId?: string;
  isOnline: boolean;
  lastSeen?: Date;
  status: string;
};

export type EncryptedDirectMessage = {
  id: string;
  cipherText: string;
  cipherTextMetadata?: string;
  version: string;
  createdAt: Date;
  senderId: string;
  senderDisplayName: string;
  senderSlug: string;
  senderImageUrl?: string;
  isOwnMessage: boolean;
  type: MessageType;
  replyToMessageId?: string;
  replyToCipherText?: string;
  replyToCipherTextMetadata?: string;
  replyToVersion?: string;
  replyToSenderId?: string;
  replyToSenderDisplayName?: string;
  reactions?: MessageReaction[];
};

export type MessageReaction = {
  messageId: string;
  emoji: string;
  userId: string;
  displayName: string;
  createdAt: Date;
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
  replyToMessageId?: string;
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
  replyToMessageId?: string;
};

export type SendFriendRequestRequest = {
  receiverId: string;
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

export type NotificationCounters = {
  chatRooms: Record<string, number>;
  directChats: Record<string, number>;
  encryptedDirectChats: Record<string, number>;
};
