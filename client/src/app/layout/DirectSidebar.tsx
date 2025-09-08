import {
  Box,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Divider,
} from "@mui/material";
import { PeopleAlt } from "@mui/icons-material";
import { Link, useLocation } from "react-router";
import { useDirectChats } from "../../lib/hooks/useDirectChats";
import AvatarWithStatus from "../shared/components/AvatarWithStatus";

export const DIRECT_SIDEBAR_WIDTH = 280;

export default function DirectSidebar() {
  const location = useLocation();
  const { directChats } = useDirectChats();
  const isDirectContext =
    location.pathname.startsWith("/direct-chats") ||
    location.pathname.startsWith("/friends");

  return (
    <Box
      component="aside"
      sx={{
        width: { xs: 0, sm: DIRECT_SIDEBAR_WIDTH },
        flex: { xs: "0 0 0px", sm: `0 0 ${DIRECT_SIDEBAR_WIDTH}px` },
        display: { xs: "none", sm: "flex" },
        flexDirection: "column",
        height: "100vh",
        position: "sticky",
        top: 0,
        bgcolor: "#2b2d31",
        borderRight: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      {isDirectContext ? (
        <>
          <Box sx={{ p: 2 }}>
            <Box
              sx={{
                bgcolor: "#1f2125",
                borderRadius: 1,
                px: 2,
                py: 1.2,
                color: "text.secondary",
              }}
            >
              <Typography variant="body2">
                Find or start a conversation
              </Typography>
            </Box>
          </Box>

          <List sx={{ py: 0 }}>
            <ListItemButton
              component={Link}
              to="/friends"
              selected={location.pathname.startsWith("/friends")}
              sx={{ borderRadius: 1, mx: 1, my: 0.5 }}
            >
              <ListItemIcon>
                <PeopleAlt sx={{ color: "white" }} />
              </ListItemIcon>
              <ListItemText
                primary={<Typography color="white">Friends</Typography>}
              />
            </ListItemButton>
          </List>

          <Box
            sx={{ px: 2, py: 1, display: "flex", alignItems: "center", gap: 1 }}
          >
            <Typography variant="subtitle2" color="text.secondary">
              Direct Messages
            </Typography>
          </Box>
          <Divider sx={{ borderColor: "rgba(255,255,255,0.08)" }} />

          <Box sx={{ flex: 1, overflowY: "auto" }}>
            <List sx={{ py: 0 }}>
              {directChats?.map((chat) => (
                <ListItemButton
                  key={chat.id}
                  component={Link}
                  to={`/direct-chats/${chat.id}`}
                  sx={{ borderRadius: 1, mx: 1, my: 0.2 }}
                  selected={location.pathname === `/direct-chats/${chat.id}`}
                >
                  <ListItemIcon sx={{ minWidth: 48 }}>
                    <AvatarWithStatus
                      src={chat.otherUserImageUrl}
                      alt={chat.otherUserDisplayName}
                      status={chat.status || "Offline"}
                    >
                      {chat.otherUserDisplayName?.charAt(0).toUpperCase()}
                    </AvatarWithStatus>
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Typography color="white">
                        {chat.otherUserDisplayName}
                      </Typography>
                    }
                    secondary={
                      chat.lastMessageBody ? (
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          noWrap
                        >
                          {chat.lastMessageBody}
                        </Typography>
                      ) : null
                    }
                  />
                </ListItemButton>
              ))}
            </List>
          </Box>
        </>
      ) : (
        <Box sx={{ flex: 1 }} />
      )}
    </Box>
  );
}
