import {
  ListItem,
  ListItemAvatar,
  ListItemText,
  IconButton,
  Box,
  Typography,
} from "@mui/material";
import { Message, PersonRemove } from "@mui/icons-material";
import type { Friend } from "../../lib/types";
import AvatarWithStatus from "../../app/shared/components/AvatarWithStatus";

type FriendListItemProps = {
  friend: Friend;
  onStartChat: (friendId: string) => void;
  onRemoveFriend: (friendId: string) => void;
  isRemoving: boolean;
};

export function FriendListItem({
  friend,
  onStartChat,
  onRemoveFriend,
  isRemoving,
}: FriendListItemProps) {
  return (
    <ListItem
      divider
      secondaryAction={
        <Box sx={{ display: "flex", gap: 1 }}>
          <IconButton
            onClick={() => onStartChat(friend.id)}
            color="primary"
            title="Send message"
          >
            <Message />
          </IconButton>
          <IconButton
            onClick={() => onRemoveFriend(friend.id)}
            color="error"
            disabled={isRemoving}
            title="Remove friend"
          >
            <PersonRemove />
          </IconButton>
        </Box>
      }
    >
      <ListItemAvatar>
        <AvatarWithStatus
          src={friend.imageUrl}
          alt={friend.displayName}
          status={friend.status || "Offline"}
        >
          {friend.displayName[0]}
        </AvatarWithStatus>
      </ListItemAvatar>
      <ListItemText
        primary={friend.displayName}
        secondary={
          <Box component="div">
            {friend.bio && (
              <Typography
                variant="body2"
                color="text.secondary"
                component="div"
              >
                {friend.bio}
              </Typography>
            )}
            <Typography
              variant="caption"
              color="text.secondary"
              component="div"
            >
              Friends since {new Date(friend.friendsSince).toLocaleDateString()}
            </Typography>
          </Box>
        }
        slotProps={{ secondary: { component: "div" } }}
      />
    </ListItem>
  );
}
