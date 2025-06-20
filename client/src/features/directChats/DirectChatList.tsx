import {
  Box,
  Card,
  CardContent,
  Typography,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Chip,
  Paper,
} from "@mui/material";
import { Link } from "react-router";
import { useDirectChats } from "../../lib/hooks/useDirectChats";
import { timeAgo } from "../../lib/util/util";
import StatusIndicator from "../../app/shared/components/StatusIndicator";

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
                    <Box sx={{ position: "relative" }}>
                      <Avatar
                        src={chat.otherUserImageUrl}
                        alt={chat.otherUserDisplayName}
                      >
                        {chat.otherUserDisplayName[0]}
                      </Avatar>
                      {/* Status indicator overlay */}
                      <Box
                        sx={{
                          position: "absolute",
                          bottom: -2,
                          right: -2,
                          backgroundColor: "white",
                          borderRadius: "50%",
                          padding: "2px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <StatusIndicator
                          status={chat.status || "Offline"}
                          customMessage={chat.customStatusMessage}
                          size="small"
                        />
                      </Box>
                    </Box>
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
                        {chat.customStatusMessage && (
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            component="div"
                            sx={{
                              fontStyle: "italic",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {chat.customStatusMessage}
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
