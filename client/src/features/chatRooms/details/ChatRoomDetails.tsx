import { useNavigate, useParams } from "react-router";
import { useChatRooms } from "../../../lib/hooks/useChatRooms";
import {
  Box,
  Typography,
  TextField,
  List,
  ListItemButton,
  ListItemAvatar,
  Avatar,
  ListItemText,
  Divider,
  Badge,
} from "@mui/material";
import ChatRoomDetailsChat from "./ChatRoomDetailsChat";
import { useChatRoomRolesRealtime } from "../../../lib/hooks/useChatRoomRolesRealtime";
import { observer } from "mobx-react-lite";
import { useAccount } from "../../../lib/hooks/useAccount";
import { useEffect, useMemo, useRef, useState } from "react";
import ChatRoomMemberPopover from "./ChatRoomMemberPopover";

const ChatRoomDetails = observer(function ChatRoomDetails() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAccount();
  const { chatRoom, isLoadingChatRoom } = useChatRooms(slug);
  const { rolesStore } = useChatRoomRolesRealtime(
    chatRoom?.id,
    currentUser?.id
  );

  useEffect(() => {
    if (chatRoom && slug && slug !== chatRoom.slug) {
      navigate(`/chat-rooms/${chatRoom.slug}`, { replace: true });
    }
  }, [chatRoom, chatRoom?.slug, slug, navigate]);

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
    dragRef.current = { startX: e.clientX, startWidth: rightPanelWidth };
    const onMove = (ev: MouseEvent) => {
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
          flex: `1 1 calc(100% - ${rightPanelWidth}px)`,
          display: "flex",
          flexDirection: "column",
          minWidth: 0,
        }}
      >
        {/* Header (dummy for now) */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderBottom: "1px solid",
            borderColor: "divider",
            p: 1,
          }}
        >
          <Typography variant="h6" fontWeight="bold">
            # general
          </Typography>
          <TextField
            size="small"
            placeholder="Search (dummy)"
            sx={{ width: 320 }}
            disabled
          />
        </Box>

        {/* Chat */}
        <Box sx={{ flex: 1, minHeight: 0 }}>
          <ChatRoomDetailsChat
            chatRoomId={chatRoom.id}
            userPermissions={rolesStore.userPermissions}
          />
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
          "&:hover": { bgcolor: "action.hover" },
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
          sx={{ fontWeight: 700, px: 2, mb: 0.5 }}
        >
          Online - {onlineMembers.length}
        </Typography>
        <Box sx={{ flex: 1, overflowY: "auto" }}>
          <List dense>
            {onlineMembers.length === 0 && (
              <Typography variant="body2" color="text.secondary" sx={{ px: 2 }}>
                No one is online right now
              </Typography>
            )}
            {onlineMembers.map((m) => (
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
                    anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
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
                />
              </ListItemButton>
            ))}
          </List>
          <Divider sx={{ my: 1 }} />

          <Typography
            variant="subtitle2"
            sx={{ fontWeight: 700, px: 2, mb: 0.5 }}
          >
            Offline - {offlineMembers.length}
          </Typography>
          <List dense>
            {offlineMembers.map((m) => (
              <ListItemButton
                key={m.id}
                onClick={(e) => {
                  setSelectedMemberId(m.id);
                  setAnchorEl(e.currentTarget);
                }}
                sx={{ opacity: 0.6 }}
              >
                <ListItemAvatar>
                  <Badge
                    variant="dot"
                    overlap="circular"
                    anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
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
                />
              </ListItemButton>
            ))}
          </List>
        </Box>
      </Box>
      <ChatRoomMemberPopover
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={() => setAnchorEl(null)}
        member={selectedMember}
        loadRoles={rolesStore.getUserRoles}
      />
    </Box>
  );
});

export default ChatRoomDetails;
