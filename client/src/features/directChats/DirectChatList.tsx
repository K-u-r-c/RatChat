import {
  Box,
  Card,
  CardContent,
  Typography,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Chip,
  Paper,
} from "@mui/material";
import { Link } from "react-router";
import { useDirectChats } from "../../lib/hooks/useDirectChats";
import { timeAgo } from "../../lib/util/util";
import AvatarWithStatus from "../../app/shared/components/AvatarWithStatus";

export default function DirectChatsList() {
  const { directChats, isLoadingChats } = useDirectChats();

  if (isLoadingChats) {
    return (
      <Box sx={{ maxWidth: 800, mx: "auto", p: 2 }}>
        <Typography>Loading direct chats...</Typography>
      </Box>
    );
  }

  if (!directChats) {
    return (
      <Box sx={{ maxWidth: 800, mx: "auto", p: 2 }}>
        <Paper sx={{ mb: 3, p: 3 }}>
          <Typography variant="h4" gutterBottom>
            Direct Messages
          </Typography>
        </Paper>
        <Card>
          <CardContent sx={{ p: 0 }}>
            <Box sx={{ p: 3, textAlign: "center" }}>
              <Typography color="text.secondary">
                No direct chats yet. Start a conversation with a friend!
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Box>
    );
  }

  const chatsArray = Array.isArray(directChats) ? directChats : [];

  return (
    <Box sx={{ maxWidth: 800, mx: "auto", p: 2 }}>
      <Paper sx={{ mb: 3, p: 3 }}>
        <Typography variant="h4" gutterBottom>
          Direct Messages
        </Typography>
      </Paper>

      <Card>
        <CardContent sx={{ p: 0 }}>
          {chatsArray.length === 0 ? (
            <Box sx={{ p: 3, textAlign: "center" }}>
              <Typography color="text.secondary">
                No direct chats yet. Start a conversation with a friend!
              </Typography>
            </Box>
          ) : (
            <List>
              {chatsArray.map((chat) => (
                <ListItem
                  key={chat.id}
                  component={Link}
                  to={`/direct-chats/${chat.id}`}
                  sx={{
                    textDecoration: "none",
                    color: "inherit",
                    "&:hover": {
                      backgroundColor: "action.hover",
                    },
                  }}
                  divider
                >
                  <ListItemAvatar>
                    <AvatarWithStatus
                      src={chat.otherUserImageUrl}
                      alt={chat.otherUserDisplayName}
                      status={chat.status || "Offline"}
                    >
                      {chat.otherUserDisplayName[0]}
                    </AvatarWithStatus>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <Typography variant="h6" fontWeight="bold">
                          {chat.otherUserDisplayName}
                        </Typography>
                        <Box
                          sx={{ display: "flex", gap: 1, alignItems: "center" }}
                        >
                          {chat.unreadCount > 0 && (
                            <Chip
                              label={chat.unreadCount}
                              color="primary"
                              size="small"
                            />
                          )}
                          <Typography variant="caption" color="text.secondary">
                            {timeAgo(chat.lastMessageAt)}
                          </Typography>
                        </Box>
                      </Box>
                    }
                    secondary={
                      <Box component="div">
                        {chat.lastMessageBody && (
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            component="div"
                            sx={{
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                              maxWidth: "100%",
                            }}
                          >
                            {chat.lastMessageBody}
                          </Typography>
                        )}
                        {!chat.canSendMessages && (
                          <Typography
                            variant="caption"
                            color="warning.main"
                            component="div"
                            sx={{ fontStyle: "italic" }}
                          >
                            Read-only (not friends)
                          </Typography>
                        )}
                      </Box>
                    }
                    secondaryTypographyProps={{ component: "div" }}
                  />
                </ListItem>
              ))}
            </List>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
