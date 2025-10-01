import {
  Avatar,
  Badge,
  Box,
  Divider,
  List,
  ListItemAvatar,
  ListItemButton,
  ListItemText,
  TextField,
  Typography,
} from "@mui/material";
import {observer} from "mobx-react-lite";
import {useCallback, useEffect, useMemo, useRef, useState} from "react";
import {useNavigate, useParams} from "react-router";
import {useAccount} from "../../../lib/hooks/useAccount";
import {useChatRoomModerationEventsRealtime} from "../../../lib/hooks/useChatRoomModerationEventsRealtime";
import {useChatRoomRoles} from "../../../lib/hooks/useChatRoomRoles";
import {useChatRoomRolesRealtime} from "../../../lib/hooks/useChatRoomRolesRealtime.ts";
import {useChatRooms} from "../../../lib/hooks/useChatRooms";
import {useStore} from "../../../lib/hooks/useStore.ts";
import ChatRoomDetailsChat from "./ChatRoomDetailsChat";
import ChatRoomMemberPopover from "./ChatRoomMemberPopover";
import ChatRoomScreenSharePanel from "./ChatRoomScreenSharePanel.tsx";

const ChatRoomDetails = observer(function ChatRoomDetails() {
  const {slug} = useParams();
  const navigate = useNavigate();
  const {currentUser} = useAccount();
  const {uiStore} = useStore();
  const {chatRoom, isLoadingChatRoom} = useChatRooms(slug);

  const activeRoomView = chatRoom ? uiStore.getChatRoomView(chatRoom.id) : "chat";
  const isScreenShareView = activeRoomView === "screen-share";

  useChatRoomModerationEventsRealtime(chatRoom, currentUser?.id);
  useChatRoomRolesRealtime(chatRoom, currentUser?.id);
  const {usersRolesMap} = useChatRoomRoles(chatRoom?.id, currentUser?.id);

  useEffect(() => {
    if (chatRoom && slug && slug !== chatRoom.slug) {
      navigate(`/chat-rooms/${chatRoom.slug}`, {replace: true});
    }
  }, [chatRoom, chatRoom?.slug, slug, navigate]);

  const memberAccentColors = useMemo(() => {
    if (!chatRoom) return new Map<string, string>();
    const map = new Map<string, string>();
    usersRolesMap.forEach((roles, userKey) => {
      if (roles.length > 0 && roles[0]?.color) {
        map.set(userKey, roles[0].color);
      }
    });
    return map;
  }, [chatRoom, usersRolesMap]);

  const resolveMemberAccent = useCallback(
    (userKey?: string) => (userKey ? memberAccentColors.get(userKey) : undefined),
    [memberAccentColors]
  );

  const isOnlineStatus = (status?: string, fallbackIsOnline?: boolean) => {
    const s = (status || "").toLowerCase();
    if (["online", "away", "donotdisturb", "do not disturb", "dnd"].includes(s))
      return true;
    return Boolean(fallbackIsOnline);
  };

  const statusLabel = (status?: string, fallbackIsOnline?: boolean) => {
    const s = (status || "").toLowerCase();
    if (s === "online") return "Online";
    if (s === "away") return "Away";
    if (s === "donotdisturb" || s === "do not disturb" || s === "dnd")
      return "Do Not Disturb";
    return fallbackIsOnline ? "Online" : "Offline";
  };

  const onlineMembers = useMemo(() => {
    const list = chatRoom?.members ?? [];
    return list.filter((m) => isOnlineStatus(m.status, m.isOnline));
  }, [chatRoom?.members]);

  const textChannels = useMemo(
    () =>
      (chatRoom?.channels ?? [])
        .filter((channel) => channel.type === "Text")
        .sort((a, b) => a.position - b.position),
    [chatRoom?.channels]
  );

  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [selectedMemberId, setSelectedMemberId] = useState<string | undefined>(
    undefined
  );

  const selectedMember = useMemo(
    () => chatRoom?.members?.find((m) => m.id === selectedMemberId),
    [chatRoom?.members, selectedMemberId]
  );
  const offlineMembers = useMemo(() => {
    const list = chatRoom?.members ?? [];
    return list.filter((m) => !isOnlineStatus(m.status, m.isOnline));
  }, [chatRoom?.members]);

  const statusColor = (status?: string, isOnline?: boolean) => {
    const s = (status || "").toLowerCase();
    if (s === "online") return "success.main";
    if (s === "away") return "warning.main";
    if (s === "donotdisturb" || s === "do not disturb" || s === "dnd")
      return "error.main";
    return isOnline ? "success.main" : "text.disabled";
  };

  const DEFAULT_RIGHT_PANEL_WIDTH = 360;
  const [rightPanelWidth, setRightPanelWidth] = useState<number>(() => {
    const saved = Number(localStorage.getItem("roomRightPanelWidth"));
    return Number.isFinite(saved) && saved > 0
      ? saved
      : DEFAULT_RIGHT_PANEL_WIDTH;
  });
  const dragRef = useRef<{ startX: number; startWidth: number } | null>(null);

  const resetRightPanel = () => {
    setRightPanelWidth(DEFAULT_RIGHT_PANEL_WIDTH);
    localStorage.setItem(
      "roomRightPanelWidth",
      String(DEFAULT_RIGHT_PANEL_WIDTH)
    );
  };

  const startResize = (e: React.MouseEvent) => {
    dragRef.current = {startX: e.clientX, startWidth: rightPanelWidth};
    const onMove = (ev: globalThis.MouseEvent) => {
      if (!dragRef.current) return;
      const dx = dragRef.current.startX - ev.clientX;
      const next = Math.min(
        Math.max(dragRef.current.startWidth + dx, 240),
        720
      );
      setRightPanelWidth(next);
    };
    const onUp = () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
      dragRef.current = null;
      localStorage.setItem("roomRightPanelWidth", String(rightPanelWidth));
      document.body.style.cursor = "";
      (document.body.style as CSSStyleDeclaration).userSelect = "";
    };
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
    document.body.style.cursor = "col-resize";
    (document.body.style as CSSStyleDeclaration).userSelect = "none";
  };

  useEffect(() => {
    if (!chatRoom?.id) return;
    if (textChannels.length === 0) {
      uiStore.clearSelectedTextChannel(chatRoom.id);
      return;
    }

    const current = uiStore.getSelectedTextChannel(chatRoom.id);
    if (!current) {
      uiStore.setSelectedTextChannel(chatRoom.id, textChannels[0].id);
    }
  }, [chatRoom?.id, textChannels, uiStore]);

  useEffect(() => {
    if (!anchorEl) return;
    const anchorGone = !document.body.contains(anchorEl);
    if (anchorGone || !selectedMember) {
      setAnchorEl(null);
    }
  }, [anchorEl, selectedMember]);

  const activeTextChannelId =
    chatRoom?.id != null
      ? uiStore.getSelectedTextChannel(chatRoom.id) ?? textChannels[0]?.id
      : undefined;

  if (isLoadingChatRoom) return <Typography>Loading...</Typography>;
  if (!chatRoom) return <Typography>Activity not found</Typography>;

  return (
    <Box
      sx={{
        height: "100vh",
        display: "flex",
        flexDirection: "row",
        overflow: "hidden",
      }}
    >
      {/* Main chat column */}
      <Box
        sx={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          minWidth: 0,
        }}
      >
        {!isScreenShareView && (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              borderBottom: "1px solid",
              borderColor: "divider",
              p: 1,
              gap: 1,
              flexWrap: "wrap",
            }}
          >
            <Typography variant="h6" fontWeight="bold" noWrap>
              {chatRoom.title}
            </Typography>
            <Box sx={{display: "flex", alignItems: "center", gap: 1}}>
              <TextField
                size="small"
                placeholder="Search (dummy)"
                sx={{width: 320}}
                disabled
              />
            </Box>
          </Box>
        )}

        <Box sx={{flex: 1, minHeight: 0, display: "flex", flexDirection: "column"}}>
          {isScreenShareView ? (
            <ChatRoomScreenSharePanel chatRoomId={chatRoom.id}/>
          ) : (
            activeTextChannelId ? (
              <ChatRoomDetailsChat
                chatRoomId={chatRoom.id}
                channelId={activeTextChannelId}
              />
            ) : (
              <Box
                sx={{
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  p: 2,
                }}
              >
                <Typography color="text.secondary">
                  No text channels available in this chat room.
                </Typography>
              </Box>
            )
          )}
        </Box>

      </Box>

      {/* Resize handle */}
      <Box
        role="separator"
        aria-orientation="vertical"
        onMouseDown={startResize}
        onDoubleClick={resetRightPanel}
        sx={{
          width: 4,
          cursor: "col-resize",
          flex: "0 0 4px",
          alignSelf: "stretch",
          bgcolor: "divider",
          "&:hover": {bgcolor: "action.hover"},
        }}
      />

      {/* Right panel */}
      <Box
        sx={{
          width: rightPanelWidth,
          flexShrink: 0,
          p: 2,
          boxSizing: "border-box",
          bgcolor: "background.paper",
          borderLeft: "1px solid",
          borderColor: "divider",
          display: "flex",
          flexDirection: "column",
          gap: 1,
          overflow: "hidden",
        }}
      >
        <Typography
          variant="subtitle2"
          sx={{fontWeight: 700, px: 2, mb: 0.5}}
        >
          Online - {onlineMembers.length}
        </Typography>
        <Box sx={{flex: 1, overflowY: "auto"}}>
          <List dense>
            {onlineMembers.length === 0 && (
              <Typography variant="body2" color="text.secondary" sx={{px: 2}}>
                No one is online right now
              </Typography>
            )}
            {onlineMembers.map((m) => {
              const accentColor = resolveMemberAccent(m.id);
              return (
                <ListItemButton
                  key={m.id}
                  onClick={(e) => {
                    setSelectedMemberId(m.id);
                    setAnchorEl(e.currentTarget);
                  }}
                >
                  <ListItemAvatar>
                    <Badge
                      variant="dot"
                      overlap="circular"
                      anchorOrigin={{vertical: "bottom", horizontal: "right"}}
                      sx={{
                        "& .MuiBadge-badge": {
                          bgcolor: statusColor(m.status, m.isOnline),
                          width: 12,
                          height: 12,
                          borderRadius: "50%",
                          border: "2px solid",
                          borderColor: "background.paper",
                        },
                      }}
                    >
                      <Avatar src={m.imageUrl}>{m.displayName?.[0]}</Avatar>
                    </Badge>
                  </ListItemAvatar>
                  <ListItemText
                    primary={m.displayName}
                    secondary={statusLabel(m.status, m.isOnline)}
                    primaryTypographyProps={{
                      noWrap: true,
                      sx: {
                        color: accentColor ?? "text.primary",
                        fontWeight: accentColor ? 600 : 500,
                      },
                    }}
                    secondaryTypographyProps={{
                      sx: {color: "text.secondary"},
                    }}
                  />
                </ListItemButton>
              );
            })}
          </List>
          <Divider sx={{my: 1}}/>

          <Typography
            variant="subtitle2"
            sx={{fontWeight: 700, px: 2, mb: 0.5}}
          >
            Offline - {offlineMembers.length}
          </Typography>
          <List dense>
            {offlineMembers.map((m) => {
              const accentColor = resolveMemberAccent(m.id);
              return (
                <ListItemButton
                  key={m.id}
                  onClick={(e) => {
                    setSelectedMemberId(m.id);
                    setAnchorEl(e.currentTarget);
                  }}
                  sx={{opacity: 0.6}}
                >
                  <ListItemAvatar>
                    <Badge
                      variant="dot"
                      overlap="circular"
                      anchorOrigin={{vertical: "bottom", horizontal: "right"}}
                      sx={{
                        "& .MuiBadge-badge": {
                          bgcolor: statusColor(m.status, m.isOnline),
                          width: 12,
                          height: 12,
                          borderRadius: "50%",
                          border: "2px solid",
                          borderColor: "background.paper",
                        },
                      }}
                    >
                      <Avatar src={m.imageUrl}>{m.displayName?.[0]}</Avatar>
                    </Badge>
                  </ListItemAvatar>
                  <ListItemText
                    primary={m.displayName}
                    secondary={statusLabel(m.status, m.isOnline)}
                    primaryTypographyProps={{
                      noWrap: true,
                      sx: {
                        color: accentColor ?? "text.primary",
                        fontWeight: accentColor ? 600 : 500,
                      },
                    }}
                    secondaryTypographyProps={{
                      sx: {color: "text.secondary"},
                    }}
                  />
                </ListItemButton>
              );
            })}
          </List>
        </Box>
      </Box>
      <ChatRoomMemberPopover
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={() => setAnchorEl(null)}
        member={selectedMember}
        chatRoomId={chatRoom?.id}
        ownerId={chatRoom.ownerId}
      />
    </Box>
  );
});

export default ChatRoomDetails;


