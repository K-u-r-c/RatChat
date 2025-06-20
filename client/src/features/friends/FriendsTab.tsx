import { Typography, List } from "@mui/material";
import type { Friend } from "../../lib/types";
import { FriendListItem } from "./FriendListItem";

type FriendsTabProps = {
  friends: Friend[] | undefined;
  isLoading: boolean;
  onStartChat: (friendId: string) => void;
  onRemoveFriend: (friendId: string) => void;
  isRemoving: boolean;
};

export function FriendsTab({
  friends,
  isLoading,
  onStartChat,
  onRemoveFriend,
  isRemoving,
}: FriendsTabProps) {
  if (isLoading) {
    return <Typography>Loading friends...</Typography>;
  }

  if (!friends?.length) {
    return (
      <Typography color="text.secondary">
        No friends yet. Add some friends to get started!
      </Typography>
    );
  }

  return (
    <List>
      {friends.map((friend) => (
        <FriendListItem
          key={friend.id}
          friend={friend}
          onStartChat={onStartChat}
          onRemoveFriend={onRemoveFriend}
          isRemoving={isRemoving}
        />
      ))}
    </List>
  );
}
