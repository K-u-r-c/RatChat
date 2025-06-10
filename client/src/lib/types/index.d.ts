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
  followersCount?: number;
  followingCount?: number;
  following?: boolean;
};
