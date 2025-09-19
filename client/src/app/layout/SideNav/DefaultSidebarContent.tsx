import { PeopleAlt } from "@mui/icons-material";
import {
  Badge,
  Box,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Divider,
} from "@mui/material";
import { Link, useLocation } from "react-router";
import DirectSearchInput from "../../../features/directChats/DirectSearchInput";
import AvatarWithStatus from "../../shared/components/AvatarWithStatus";
import { useDirectChats } from "../../../lib/hooks/useDirectChats";
import { useMemo, useState } from "react";
import { observer } from "mobx-react-lite";
import { useStore } from "../../../lib/hooks/useStore";

const DefaultSidebarContent = observer(function DefaultSidebarContent() {
  const location = useLocation();
  const [query, setQuery] = useState("");
  const { directChats } = useDirectChats();
  const { messagesNotificationsStore } = useStore();
  const isFriendsRoute = location.pathname.startsWith("/friends");

  const filteredChats = useMemo(() => {
    const q = query.trim().toLowerCase();
    const base = (directChats ?? []).filter((c) =>
      isFriendsRoute ? c.canSendMessages : true
    );
    if (!q) return base;
    return base.filter((c) =>
      (c.otherUserDisplayName ?? "").toLowerCase().includes(q)
    );
  }, [directChats, query, isFriendsRoute]);

  return (
    <>
      <Box sx={{ p: 2 }}>
        <DirectSearchInput
          value={query}
          onChange={setQuery}
          placeholder={"Search conversations"}
        />
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

      <Box sx={{ px: 2, py: 1, display: "flex", alignItems: "center", gap: 1 }}>
        <Typography variant="subtitle2" color="text.secondary">
          Direct Messages
        </Typography>
      </Box>
      <Divider sx={{ borderColor: "rgba(255,255,255,0.08)" }} />

      <Box sx={{ flex: 1, overflowY: "auto" }}>
        <List sx={{ py: 0 }}>
          {filteredChats.map((chat) => {
            const unreadCount =
              messagesNotificationsStore.directUnreadByChat.get(chat.id) ?? 0;

            return (
              <ListItemButton
                key={chat.id}
                component={Link}
                to={`/direct-chats/${chat.otherUserSlug}`}
                sx={{ borderRadius: 1, mx: 1, my: 0.2 }}
                selected={
                  location.pathname === `/direct-chats/${chat.otherUserSlug}`
                }
              >
                <ListItemIcon sx={{ minWidth: 48 }}>
                  <Badge
                    overlap="circular"
                    color="error"
                    badgeContent={unreadCount}
                    invisible={!unreadCount}
                    max={99}
                    sx={{
                      "& .MuiBadge-badge": {
                        minWidth: 18,
                        height: 18,
                        fontSize: 10,
                        fontWeight: 700,
                        px: 0.75,
                      },
                    }}
                  >
                    <AvatarWithStatus
                      src={chat.otherUserImageUrl}
                      alt={chat.otherUserDisplayName}
                      status={chat.status || "Offline"}
                    >
                      {chat.otherUserDisplayName?.charAt(0).toUpperCase()}
                    </AvatarWithStatus>
                  </Badge>
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Typography
                      color="white"
                      fontWeight={unreadCount ? 700 : undefined}
                    >
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
            );
          })}
        </List>
      </Box>
    </>
  );
});

export default DefaultSidebarContent;
