import {
  Box,
  Typography,
  List,
  ListItemButton,
  ListItemText,
  Divider,
  Menu,
  MenuItem,
  ListItemIcon,
} from "@mui/material";
import { useState } from "react";
import {
  People,
  Settings,
  ExitToApp,
  VolumeUp,
  Chat,
  ExpandMore,
  ExpandLess,
} from "@mui/icons-material";
import { useParams } from "react-router";
import { useChatRooms } from "../../lib/hooks/useChatRooms";
import ChatRoomSettings from "./settings/ChatRoomSettings";
import InvitePeopleModal from "./invites/InvitePeopleModal";
import { useAccount } from "../../lib/hooks/useAccount";
import { useChatRoomRolesRealtime } from "../../lib/hooks/useChatRoomRolesRealtime";
import { CHATROOM_PERMISSIONS } from "../../lib/types/chatroomPermissions";

export default function ChatRoomSidebarContent() {
  const { id } = useParams();
  const { currentUser } = useAccount();
  const { chatRoom, isLoadingChatRoom, leaveChatRoom, deleteChatRooms } =
    useChatRooms(id);
  const { rolesStore } = useChatRoomRolesRealtime(id, currentUser?.id);
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);

  const menuOpen = Boolean(menuAnchorEl);

  const handleServerNameClick = (event: React.MouseEvent<HTMLElement>) => {
    setMenuAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
  };

  const handleLeave = async () => {
    const message = chatRoom?.isAdmin
      ? "Are you sure you want to leave this chat room?\n\nAs the admin, leaving will transfer ownership to the oldest user or delete the room if you are the last member."
      : "Are you sure you want to leave this chat room?";

    if (window.confirm(message)) {
      await leaveChatRoom.mutateAsync(id!);
    }
  };

  if (!chatRoom || isLoadingChatRoom) {
    return (
      <Box
        sx={{
          width: "100%",
          height: "100%",
          p: 2,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Typography variant="h6">Loading...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ width: "100%", p: 2 }}>
      {/* Server name and menu */}
      <Box sx={{ mb: 2, display: "flex", alignItems: "center", gap: 1 }}>
        <Typography
          variant="h6"
          sx={{
            cursor: "pointer",
            fontWeight: "bold",
            bgcolor: "#2b2d31",
            color: "white",
            px: 2,
            py: 1,
            borderRadius: 2,
            "&:hover": { bgcolor: "#36373c" },
            width: "fit-content",
            display: "flex",
            alignItems: "center",
            gap: 1,
          }}
          onClick={handleServerNameClick}
        >
          {chatRoom?.title}
          {menuOpen ? (
            <ExpandLess sx={{ ml: 1, fontSize: 22 }} />
          ) : (
            <ExpandMore sx={{ ml: 1, fontSize: 22 }} />
          )}
        </Typography>
        <Menu
          anchorEl={menuAnchorEl}
          open={menuOpen}
          onClose={handleMenuClose}
          slotProps={{
            paper: {
              sx: {
                bgcolor: "rgba(19,19,22)",
                borderRadius: 2,
                p: 1,
              },
            },
          }}
        >
          {(chatRoom.isAdmin ||
            rolesStore.userPermissions[
              CHATROOM_PERMISSIONS.CreateInviteLinks
            ]) && (
            <MenuItem
              onClick={() => {
                setInviteOpen(true);
                handleMenuClose();
              }}
            >
              <ListItemIcon>
                <People fontSize="small" />
              </ListItemIcon>
              Invite people
            </MenuItem>
          )}
          <MenuItem onClick={handleMenuClose} sx={{ display: "none" }}>
            <ListItemIcon>
              <People fontSize="small" />
            </ListItemIcon>
            Invite people
          </MenuItem>
          <MenuItem
            onClick={() => {
              setSettingsOpen(true);
              handleMenuClose();
            }}
          >
            <ListItemIcon>
              <Settings fontSize="small" />
            </ListItemIcon>
            Server settings
          </MenuItem>
          {chatRoom.isAdmin ? (
            <MenuItem
              onClick={async () => {
                if (
                  window.confirm(
                    "Are you sure you want to delete this chat room?"
                  )
                ) {
                  await deleteChatRooms.mutateAsync(id!);
                }
                handleMenuClose();
              }}
              sx={{ color: "error.main" }}
            >
              <ListItemIcon>
                <ExitToApp fontSize="small" sx={{ color: "error.main" }} />
              </ListItemIcon>
              Delete server
            </MenuItem>
          ) : (
            <MenuItem
              onClick={() => {
                handleLeave();
                handleMenuClose();
              }}
              sx={{ color: "error.main" }}
            >
              <ListItemIcon>
                <ExitToApp fontSize="small" sx={{ color: "error.main" }} />
              </ListItemIcon>
              Leave server
            </MenuItem>
          )}
        </Menu>
      </Box>

      {/* Text channels */}
      <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
        Text Channels
      </Typography>
      <List>
        <ListItemButton>
          <ListItemIcon>
            <Chat />
          </ListItemIcon>
          <ListItemText primary="# general" />
        </ListItemButton>
        <ListItemButton>
          <ListItemIcon>
            <Chat />
          </ListItemIcon>
          <ListItemText primary="# memes" />
        </ListItemButton>
        <ListItemButton>
          <ListItemIcon>
            <Chat />
          </ListItemIcon>
          <ListItemText primary="# tech-talk" />
        </ListItemButton>
      </List>

      <Divider sx={{ my: 2 }} />

      {/* Voice channels */}
      <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
        Voice Channels
      </Typography>
      <List>
        <ListItemButton>
          <ListItemIcon>
            <VolumeUp />
          </ListItemIcon>
          <ListItemText primary="General Voice" />
        </ListItemButton>
        <ListItemButton>
          <ListItemIcon>
            <VolumeUp />
          </ListItemIcon>
          <ListItemText primary="Gaming" />
        </ListItemButton>
      </List>

      {/* Chat room setting menu popup */}
      <ChatRoomSettings
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        chatRoomId={chatRoom.id}
      />
      <InvitePeopleModal
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        chatRoomId={chatRoom.id}
      />
    </Box>
  );
}
