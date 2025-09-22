import { PeopleAlt } from "@mui/icons-material";
import {
  Badge,
  Box,
  ToggleButton,
  ToggleButtonGroup,
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
import { useEncryptedDirectChats } from "../../../lib/hooks/useEncryptedDirectChats";
import { useEffect, useMemo, useState } from "react";
import { observer } from "mobx-react-lite";
import { useStore } from "../../../lib/hooks/useStore";
import { useFriends } from "../../../lib/hooks/useFriends";
import type { DirectChat, EncryptedDirectChat } from "../../../lib/types";

type ChatListItem =
  | { kind: "direct"; chat: DirectChat }
  | { kind: "encrypted"; chat: EncryptedDirectChat };

const DefaultSidebarContent = observer(function DefaultSidebarContent() {
  const location = useLocation();
  const [query, setQuery] = useState("");
  const [chatView, setChatView] = useState<"direct" | "encrypted">(() => {
    const stored = localStorage.getItem("directSidebarView");
    return stored === "encrypted" ? "encrypted" : "direct";
  });
  const { directChats } = useDirectChats();
  const { encryptedDirectChats } = useEncryptedDirectChats();
  const { messagesNotificationsStore } = useStore();
  const directUnreadCount = messagesNotificationsStore.totalDirectUnread;
  const encryptedUnreadCount =
    messagesNotificationsStore.totalEncryptedDirectUnread;

  const handleChatViewChange = (
    _: React.MouseEvent<HTMLElement>,
    next: "direct" | "encrypted" | null
  ) => {
    if (!next) return;
    setChatView(next);
    localStorage.setItem("directSidebarView", next);
  };
  const { friendRequests } = useFriends();
  useEffect(() => {
    if (location.pathname.startsWith("/encrypted-direct-chats")) {
      setChatView((prev) => {
        if (prev !== "encrypted") {
          localStorage.setItem("directSidebarView", "encrypted");
          return "encrypted";
        }
        return prev;
      });
    } else if (location.pathname.startsWith("/direct-chats")) {
      setChatView((prev) => {
        if (prev !== "direct") {
          localStorage.setItem("directSidebarView", "direct");
          return "direct";
        }
        return prev;
      });
    }
  }, [location.pathname]);
  const friendInvitesCount = friendRequests?.received?.length || 0;

  const filteredDirectChats = useMemo(() => {
    const q = query.trim().toLowerCase();
    const base = directChats ?? [];
    if (!q) return base;
    return base.filter((c) =>
      (c.otherUserDisplayName ?? "").toLowerCase().includes(q)
    );
  }, [directChats, query]);

  const filteredEncryptedChats = useMemo(() => {
    const q = query.trim().toLowerCase();
    const base = encryptedDirectChats ?? [];
    if (!q) return base;
    return base.filter((c) =>
      (c.otherUserDisplayName ?? "").toLowerCase().includes(q)
    );
  }, [encryptedDirectChats, query]);
  const chatsToRender = useMemo<ChatListItem[]>(() => {
    if (chatView === "direct") {
      return filteredDirectChats.map((chat) => ({
        kind: "direct" as const,
        chat,
      }));
    }
    return filteredEncryptedChats.map((chat) => ({
      kind: "encrypted" as const,
      chat,
    }));
  }, [chatView, filteredDirectChats, filteredEncryptedChats]);

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
            <Badge
              color="success"
              overlap="rectangular"
              anchorOrigin={{ vertical: "top", horizontal: "left" }}
              badgeContent={friendInvitesCount}
              invisible={!friendInvitesCount}
              max={99}
              sx={{
                "& .MuiBadge-badge": {
                  minWidth: 18,
                  height: 18,
                  fontSize: 10,
                  fontWeight: 700,
                },
              }}
            >
              <PeopleAlt sx={{ color: "white" }} />
            </Badge>
          </ListItemIcon>
          <ListItemText
            primary={<Typography color="white">Friends</Typography>}
          />
        </ListItemButton>
      </List>

      <Box
        sx={{
          px: 1,
          py: 1,
          display: "flex",
          alignItems: "center",
        }}
      >
        <ToggleButtonGroup
          value={chatView}
          exclusive
          onChange={handleChatViewChange}
          size="small"
          sx={{
            backgroundColor: "rgba(255,255,255,0.04)",
            flex: 1,
            overflow: "hidden",
          }}
        >
          <ToggleButton
            value="direct"
            sx={{ color: "white", flex: 1, minWidth: 0, p: 0 }}
          >
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                width: "100%",
                minWidth: 0,
                px: 1.5,
              }}
            >
              <Typography
                noWrap
                sx={{
                  textOverflow: "ellipsis",
                  overflow: "hidden",
                  minWidth: 0,
                  flex: 1,
                }}
              >
                Direct
              </Typography>
              <Badge
                color="error"
                badgeContent={directUnreadCount}
                invisible={!directUnreadCount}
                max={99}
                sx={{
                  "& .MuiBadge-badge": {
                    minWidth: 18,
                    height: 18,
                    fontSize: 10,
                    fontWeight: 700,
                  },
                }}
              />
            </Box>
          </ToggleButton>
          <ToggleButton
            value="encrypted"
            sx={{ color: "white", flex: 1, minWidth: 0, p: 0 }}
          >
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                width: "100%",
                minWidth: 0,
                px: 1.5,
              }}
            >
              <Typography
                noWrap
                sx={{
                  textOverflow: "ellipsis",
                  overflow: "hidden",
                  minWidth: 0,
                  flex: 1,
                }}
              >
                Encrypted
              </Typography>
              <Badge
                color="error"
                badgeContent={encryptedUnreadCount}
                invisible={!encryptedUnreadCount}
                max={99}
                sx={{
                  ml: 1,
                  "& .MuiBadge-badge": {
                    minWidth: 18,
                    height: 18,
                    fontSize: 10,
                    fontWeight: 700,
                  },
                }}
              />
            </Box>
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>
      <Divider sx={{ borderColor: "rgba(255,255,255,0.08)" }} />

      <Box sx={{ flex: 1, overflowY: "auto" }}>
        <List sx={{ py: 0 }}>
          {chatsToRender.map(({ kind, chat }) => {
            const unreadCount =
              kind === "direct"
                ? messagesNotificationsStore.directUnreadByChat.get(chat.id) ??
                  0
                : messagesNotificationsStore.encryptedDirectUnreadByChat.get(
                    chat.id
                  ) ?? 0;
            const isReadOnly =
              kind === "direct" ? !chat.canSendMessages : false;
            const linkTo =
              kind === "direct"
                ? `/direct-chats/${chat.otherUserSlug}`
                : `/encrypted-direct-chats/${chat.otherUserSlug}`;
            const isSelected = location.pathname === linkTo;
            const avatarStatus = chat.status || "Offline";
            const primaryColor = isReadOnly ? "text.secondary" : "white";
            const secondaryNode =
              kind === "direct" ? (
                chat.lastMessageBody ? (
                  <Typography variant="caption" color="text.secondary" noWrap>
                    {chat.lastMessageBody}
                  </Typography>
                ) : null
              ) : chat.lastMessageSenderId ? (
                <Typography variant="caption" color="text.secondary" noWrap>
                  Encrypted message
                </Typography>
              ) : null;

            return (
              <ListItemButton
                key={chat.id}
                component={Link}
                to={linkTo}
                sx={{
                  borderRadius: 1,
                  mx: 1,
                  my: 0.2,
                  opacity: isReadOnly ? 0.6 : 1,
                }}
                selected={isSelected}
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
                      status={avatarStatus}
                      containerSx={
                        isReadOnly ? { filter: "grayscale(100%)" } : undefined
                      }
                    >
                      {chat.otherUserDisplayName?.charAt(0).toUpperCase()}
                    </AvatarWithStatus>
                  </Badge>
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Typography
                      color={primaryColor}
                      fontWeight={unreadCount ? 700 : undefined}
                    >
                      {chat.otherUserDisplayName}
                    </Typography>
                  }
                  secondary={secondaryNode}
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
