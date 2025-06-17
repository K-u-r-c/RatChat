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
};

export type Profile = {
  id: string;
  displayName: string;
  bio?: string;
  imageUrl?: string;
  bannerUrl?: string;
  friendsCount?: number;
  isFriend?: boolean;
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
};

export type SendDirectMessageRequest = {
  body: string;
  directChatId: string;
};

export type SendFriendRequestRequest = {
  friendCode: string;
  message?: string;
};

export type RespondToFriendRequestRequest = {
  requestId: string;
  accept: boolean;
};
