import {
  ListItem,
  ListItemAvatar,
  ListItemText,
  IconButton,
  Avatar,
  Box,
  Typography,
  Button,
  Chip,
} from "@mui/material";
import { Check, Close } from "@mui/icons-material";
import type { FriendRequest } from "../../lib/types";

type ReceivedRequestItemProps = {
  request: FriendRequest;
  onAccept: (requestId: string) => void;
  onDecline: (requestId: string) => void;
  isResponding: boolean;
};

export function ReceivedRequestItem({
  request,
  onAccept,
  onDecline,
  isResponding,
}: ReceivedRequestItemProps) {
  return (
    <ListItem
      divider
      secondaryAction={
        <Box sx={{ display: "flex", gap: 1 }}>
          <IconButton
            onClick={() => onAccept(request.id)}
            color="success"
            disabled={isResponding}
            title="Accept request"
          >
            <Check />
          </IconButton>
          <IconButton
            onClick={() => onDecline(request.id)}
            color="error"
            disabled={isResponding}
            title="Decline request"
          >
            <Close />
          </IconButton>
        </Box>
      }
    >
      <ListItemAvatar>
        <Avatar src={request.senderImageUrl}>
          {request.senderDisplayName[0]}
        </Avatar>
      </ListItemAvatar>
      <ListItemText
        primary={request.senderDisplayName}
        secondary={
          <>
            {request.message && (
              <Typography variant="body2" component="span" display="block">
                "{request.message}"
              </Typography>
            )}
            <Typography
              variant="caption"
              color="text.secondary"
              component="span"
            >
              {new Date(request.createdAt).toLocaleDateString()}
            </Typography>
          </>
        }
      />
    </ListItem>
  );
}

type SentRequestItemProps = {
  request: FriendRequest;
  onCancel: (requestId: string) => void;
  isCanceling: boolean;
};

export function SentRequestItem({
  request,
  onCancel,
  isCanceling,
}: SentRequestItemProps) {
  return (
    <ListItem
      divider
      secondaryAction={
        <Button
          size="small"
          color="error"
          onClick={() => onCancel(request.id)}
          disabled={isCanceling}
        >
          Cancel
        </Button>
      }
    >
      <ListItemAvatar>
        <Avatar src={request.receiverImageUrl}>
          {request.receiverDisplayName[0]}
        </Avatar>
      </ListItemAvatar>
      <ListItemText
        primary={request.receiverDisplayName}
        secondary={
          <>
            <Chip label="Pending" size="small" color="warning" sx={{ mr: 1 }} />
            <Typography
              variant="caption"
              color="text.secondary"
              component="span"
            >
              Sent {new Date(request.createdAt).toLocaleDateString()}
            </Typography>
          </>
        }
        secondaryTypographyProps={{ component: "div" }}
      />
    </ListItem>
  );
}
