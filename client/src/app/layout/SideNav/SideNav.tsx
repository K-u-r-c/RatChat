import {
  Box,
  Avatar,
  Badge,
  CircularProgress,
  IconButton,
  Tooltip,
} from "@mui/material";
import { Forum, Add, ExpandLess, ExpandMore } from "@mui/icons-material";
import { NavLink } from "react-router";
import { NAV_WIDTH } from "../../../lib/types/constants";
import UserMenuIcon from "../UserMenuIcon";
import { useEffect, useRef, useState } from "react";
import { observer } from "mobx-react-lite";
import { useChatRooms } from "../../../lib/hooks/useChatRooms";
import { useStore } from "../../../lib/hooks/useStore";
import { useFriends } from "../../../lib/hooks/useFriends";

const SideNav = observer(function SideNav() {
  const {
    chatRooms,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useChatRooms();
  const { uiStore, messagesNotificationsStore } = useStore();
  const listRef = useRef<HTMLDivElement | null>(null);
  const [hasAbove, setHasAbove] = useState(false);
  const [hasBelow, setHasBelow] = useState(false);

  const updateScrollIndicators = () => {
    const el = listRef.current;
    if (!el) return;
    const { scrollTop, clientHeight, scrollHeight } = el;
    setHasAbove(scrollTop > 0);
    setHasBelow(scrollTop + clientHeight < scrollHeight - 1);
  };

  useEffect(() => {
    updateScrollIndicators();
    const onResize = () => updateScrollIndicators();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [chatRooms]);

  useEffect(() => {
    let cancelled = false;
    const ensureFilled = async () => {
      const el = listRef.current;
      if (!el) return;

      while (
        !cancelled &&
        hasNextPage &&
        !isFetchingNextPage &&
        el.clientHeight >= el.scrollHeight
      ) {
        try {
          await fetchNextPage();
          await new Promise((r) => setTimeout(r, 50));
        } catch {
          break;
        }
      }
      updateScrollIndicators();
    };

    ensureFilled();

    return () => {
      cancelled = true;
    };
  }, [chatRooms, hasNextPage, isFetchingNextPage, fetchNextPage]);

  useEffect(() => {
    const handleScroll = () => {
      if (listRef.current) {
        const { scrollTop, clientHeight, scrollHeight } = listRef.current;
        if (scrollTop + clientHeight >= scrollHeight - 10 && hasNextPage) {
          fetchNextPage();
        }
      }
    };

    const el = listRef.current;
    if (el) {
      el.addEventListener("scroll", handleScroll);
    }

    return () => {
      if (el) {
        el.removeEventListener("scroll", handleScroll);
      }
    };
  }, [fetchNextPage, hasNextPage]);

  const directUnreadCount = messagesNotificationsStore.totalDirectUnread;
  const encryptedDirectUnreadCount =
    messagesNotificationsStore.totalEncryptedDirectUnread;
  const totalDirectBadgeCount = directUnreadCount + encryptedDirectUnreadCount;
  const { friendRequests } = useFriends();
  const friendInvitesCount = friendRequests?.received?.length || 0;

  return (
    <Box
      component="nav"
      sx={{
        width: NAV_WIDTH,
        flex: `0 0 ${NAV_WIDTH}px`,
        bgcolor: "#1e1f24",
        borderRight: "1px solid rgba(255,255,255,0.08)",
        height: "100vh",
        position: "sticky",
        top: 0,
        display: { xs: "none", sm: "flex" },
        flexDirection: "column",
        alignItems: "center",
        gap: 1,
        py: 1.5,
      }}
    >
      {/* Direct Messages entry */}
      <Tooltip title="Direct Messages" placement="right">
        <IconButton
          component={NavLink}
          to="/friends"
          sx={{
            width: 52,
            height: 52,
            borderRadius: 2,
            bgcolor: "#2f3136",
            color: "#fff",
            "&.active": {
              bgcolor: "primary.main",
            },
          }}
          className="rc-server-btn"
        >
          {/* Green top-left badge for friend invites */}
          <Badge
            color="success"
            overlap="rectangular"
            anchorOrigin={{ vertical: "top", horizontal: "left" }}
            badgeContent={friendInvitesCount}
            invisible={!friendInvitesCount}
            max={99}
            sx={{
              "& .MuiBadge-badge": {
                fontSize: 11,
                fontWeight: 700,
                minWidth: 20,
                height: 20,
                borderRadius: "999px",
              },
            }}
          >
            {/* Red top-right badge for unread direct messages */}
            <Badge
              color="error"
              overlap="rectangular"
              badgeContent={totalDirectBadgeCount}
              invisible={!totalDirectBadgeCount}
              max={99}
              sx={{
                "& .MuiBadge-badge": {
                  fontSize: 11,
                  fontWeight: 700,
                  minWidth: 20,
                  height: 20,
                  borderRadius: "999px",
                },
              }}
            >
              <Forum />
            </Badge>
          </Badge>
        </IconButton>
      </Tooltip>

      {/* Separator */}
      <Box sx={{ width: 36, height: 2, bgcolor: "divider", my: 1 }} />

      {/* Chat rooms */}
      <Box sx={{ position: "relative", width: "100%", flex: 1, minHeight: 0 }}>
        {hasAbove && (
          <Box
            sx={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: 26,
              background:
                "linear-gradient(to bottom, rgba(0,0,0,0.45), rgba(0,0,0,0))",
              pointerEvents: "none",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1,
            }}
          >
            <ExpandLess sx={{ color: "#ffffff66", fontSize: 20 }} />
          </Box>
        )}

        <Box
          ref={listRef}
          onScroll={updateScrollIndicators}
          sx={{
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 1,
            width: "100%",
            py: 1,
            boxSizing: "border-box",
            height: "100%",
          }}
          className="rc-hide-scrollbar"
        >
          {isLoading && <CircularProgress size={24} />}
          {!isLoading &&
            chatRooms?.map((room) => {
              const unreadCount =
                messagesNotificationsStore.unreadByRoom.get(room.id) ?? 0;

              return (
                <Tooltip key={room.id} title={room.title} placement="right">
                  <IconButton
                    component={NavLink}
                    to={`/chat-rooms/${room.slug}`}
                    sx={{
                      width: 52,
                      height: 52,
                      borderRadius: 2,
                      p: 0,
                      bgcolor: "transparent",
                      "&.active": {
                        outline: "2px solid",
                        outlineColor: "primary.main",
                        outlineOffset: 2,
                      },
                    }}
                    className="rc-server-btn"
                  >
                    <Badge
                      overlap="rectangular"
                      anchorOrigin={{ vertical: "top", horizontal: "right" }}
                      color="error"
                      badgeContent={unreadCount}
                      invisible={!unreadCount}
                      max={99}
                      sx={{
                        "& .MuiBadge-badge": {
                          fontSize: 11,
                          fontWeight: 700,
                          minWidth: 22,
                          height: 20,
                          borderRadius: "999px",
                          right: 2,
                          top: 2,
                          px: 0.75,
                        },
                      }}
                    >
                      <Avatar
                        variant="rounded"
                        sx={{
                          width: 52,
                          height: 52,
                          borderRadius: 2,
                          bgcolor: "#2f3136",
                          fontWeight: 700,
                          color: "#fff",
                        }}
                        src={room.imageUrl}
                        alt={room.title}
                      >
                        {room.title?.charAt(0).toUpperCase()}
                      </Avatar>
                    </Badge>
                  </IconButton>
                </Tooltip>
              );
            })}

          {/* Add chat room button */}
          <Tooltip title="Create chat room" placement="right">
            <IconButton
              onClick={() => uiStore.openCreateJoinModal()}
              sx={{
                width: 52,
                height: 52,
                borderRadius: 2,
                bgcolor: "#2f3136",
                color: "#fff",
                "&:hover": { bgcolor: "#3a3c43" },
              }}
              className="rc-server-btn"
            >
              <Add />
            </IconButton>
          </Tooltip>
        </Box>

        {hasBelow && (
          <Box
            sx={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              height: 26,
              background:
                "linear-gradient(to top, rgba(0,0,0,0.45), rgba(0,0,0,0))",
              pointerEvents: "none",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1,
            }}
          >
            <ExpandMore sx={{ color: "rgba(255,255,255,0.4)", fontSize: 20 }} />
          </Box>
        )}
      </Box>

      {/* Bottom user menu (Discord-like) */}
      <Box sx={{ pb: 0.5 }}>
        <UserMenuIcon />
      </Box>
    </Box>
  );
});

export default SideNav;

