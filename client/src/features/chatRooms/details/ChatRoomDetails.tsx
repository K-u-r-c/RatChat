import { useParams } from "react-router";
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
import { useMemo, useState } from "react";
import ChatRoomMemberPopover from "./ChatRoomMemberPopover";

const ChatRoomDetails = observer(function ChatRoomDetails() {
  const { id } = useParams();
  const { currentUser } = useAccount();
  const { chatRoom, isLoadingChatRoom } = useChatRooms(id);
  const { rolesStore } = useChatRoomRolesRealtime(id, currentUser?.id);

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

  if (isLoadingChatRoom) return <Typography>Loading...</Typography>;
  if (!chatRoom) return <Typography>Activity not found</Typography>;

  return (
    <Box
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "row",
        overflow: "hidden",
      }}
    >
      {/* Main chat column */}
      <Box
        sx={{
          flex: "1 1 auto",
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
          <ChatRoomDetailsChat userPermissions={rolesStore.userPermissions} />
        </Box>
      </Box>

      {/* Right panel */}
      <Box
        sx={{
          width: 360,
          flexShrink: 0,
          p: 2,
          boxSizing: "border-box",
          bgcolor: "background.paper",
          borderLeft: "1px solid",
          borderColor: "divider",
          display: "flex",
          flexDirection: "column",
          gap: 2,
        }}
      >
        <Typography
          variant="subtitle2"
          sx={{ fontWeight: 700, px: 2, mb: 0.5 }}
        >
          Online — {onlineMembers.length}
        </Typography>
        <List dense sx={{ maxHeight: 220, overflowY: "auto" }}>
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
          Offline — {offlineMembers.length}
        </Typography>
        <List dense sx={{ maxHeight: 220, overflowY: "auto" }}>
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
