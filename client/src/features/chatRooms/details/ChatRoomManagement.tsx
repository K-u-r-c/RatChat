import {
  Box,
  Button,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Tabs,
  Tab,
  Typography,
  List,
  ListItem,
  ListItemAvatar,
  Avatar,
  ListItemText,
} from "@mui/material";
import { useParams, useNavigate } from "react-router";
import { useChatRooms } from "../../../lib/hooks/useChatRooms";
import type { useChatRoomRolesRealtime } from "../../../lib/hooks/useChatRoomRolesRealtime";
import { CHATROOM_PERMISSIONS } from "../../../lib/types/chatroomPermissions";
import { useMemo, useState } from "react";
import { useFriends } from "../../../lib/hooks/useFriends";
import SettingsIcon from "@mui/icons-material/Settings";
import ChatRoomSettings from "../settings/ChatRoomSettings";

type Props = {
  userPermissions: ReturnType<
    typeof useChatRoomRolesRealtime
  >["userPermissions"];
};
export default function ChatRoomManagement({ userPermissions }: Props) {
  const { id } = useParams();
  const navigate = useNavigate();
  const {
    chatRoom,
    deleteChatRooms,
    createInviteLink,
    isGeneratingInvite,
    leaveChatRoom,
  } = useChatRooms(id);
  const { friends } = useFriends();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [maxUses, setMaxUses] = useState<string>("");
  const [expiresInMinutes, setExpiresInMinutes] = useState<string>("");
  const [tabIndex, setTabIndex] = useState(0);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const canInvite = useMemo(
    () =>
      (chatRoom?.isAdmin ||
        userPermissions[CHATROOM_PERMISSIONS.CreateInviteLinks]) &&
      !isGeneratingInvite,
    [chatRoom?.isAdmin, userPermissions, isGeneratingInvite]
  );

  const availableFriends = useMemo(() => {
    const memberIds = new Set((chatRoom?.members || []).map((m) => m.id));
    return (friends || []).filter((f) => !memberIds.has(f.id));
  }, [friends, chatRoom?.members]);

  const handleDelete = async () => {
    if (window.confirm("Are you sure you want to delete this chat room?")) {
      await deleteChatRooms.mutateAsync(id!);
    }
  };

  const handleLeave = async () => {
    const message = chatRoom?.isAdmin
      ? "Are you sure you want to leave this chat room?\n\nAs the admin, leaving will transfer ownership to the oldest user or delete the room if you are the last member."
      : "Are you sure you want to leave this chat room?";

    if (window.confirm(message)) {
      await leaveChatRoom.mutateAsync(id!);
    }
  };

  const handleModify = () => {
    navigate(`/manage/${id}`);
  };

  const handleGenerateInvite = async () => {
    await createInviteLink.mutateAsync({ id: id! }); // default: 10 min expiry, unlimited uses
  };

  const handleOpenDialog = () => setDialogOpen(true);
  const handleCloseDialog = () => setDialogOpen(false);

  const handleCreateCustomInvite = async () => {
    await createInviteLink.mutateAsync({
      id: id!,
      maxUses: maxUses ? Number(maxUses) : undefined,
      expiresInMinutes: expiresInMinutes ? Number(expiresInMinutes) : undefined,
    });
    setDialogOpen(false);
  };

  const handleInviteFriend = async (friendId: string) => {
    await createInviteLink.mutateAsync({ id: id!, allowedUserId: friendId });
  };

  return (
    <Box sx={{ mb: 3 }}>
      <Stack direction="row" spacing={2}>
        <Button
          variant="contained"
          color="error"
          onClick={handleDelete}
          disabled={!chatRoom?.isAdmin || deleteChatRooms.isPending}
        >
          Delete Chat Room
        </Button>
        <Button variant="outlined" color="warning" onClick={handleLeave}>
          Leave Chat Room
        </Button>
        <Button
          variant="outlined"
          color="primary"
          onClick={handleModify}
          disabled={!chatRoom?.isAdmin}
        >
          Modify Chat Room
        </Button>

        <Button
          variant="outlined"
          color="secondary"
          onClick={handleGenerateInvite}
          disabled={!canInvite}
        >
          Generate Invite Link
        </Button>
        <IconButton
          color="default"
          aria-label="Invite settings"
          onClick={handleOpenDialog}
          disabled={!canInvite}
        >
          <SettingsIcon />
        </IconButton>
      </Stack>
      <Button
        variant="outlined"
        color="secondary"
        onClick={handleGenerateInvite}
        disabled={!canInvite}
      >
        Generate Invite Link
      </Button>
      {/* Open settings dialog */}
      <Button
        variant="outlined"
        color="info"
        onClick={() => setSettingsOpen(true)}
        disabled={!chatRoom?.isAdmin}
      >
        Chat Room Settings
      </Button>
      <Dialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle>Invite Settings</DialogTitle>
        <DialogContent sx={{ pt: 0 }}>
          <Tabs
            value={tabIndex}
            onChange={(_, v) => setTabIndex(v)}
            aria-label="invite tabs"
            sx={{ borderBottom: 1, borderColor: "divider" }}
          >
            <Tab label="Custom Invite" />
            <Tab label="Friends Invite" />
          </Tabs>

          {/* Custom Invite Tab */}
          {tabIndex === 0 && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle1" gutterBottom>
                Set accepts limit and expiration time
              </Typography>
              <Stack spacing={2}>
                <TextField
                  label="Max accepts"
                  type="number"
                  inputProps={{ min: 1 }}
                  value={maxUses}
                  onChange={(e) => setMaxUses(e.target.value)}
                  fullWidth
                />
                <TextField
                  label="Expires in minutes"
                  type="number"
                  inputProps={{ min: 1 }}
                  value={expiresInMinutes}
                  onChange={(e) => setExpiresInMinutes(e.target.value)}
                  fullWidth
                />
              </Stack>
            </Box>
          )}

          {/* Friends Invite Tab */}
          {tabIndex === 1 && (
            <Box sx={{ mt: 2 }}>
              {availableFriends && availableFriends.length > 0 ? (
                <List>
                  {availableFriends.map((f) => (
                    <ListItem
                      key={f.id}
                      secondaryAction={
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={() => handleInviteFriend(f.id)}
                          disabled={isGeneratingInvite}
                        >
                          Invite
                        </Button>
                      }
                    >
                      <ListItemAvatar>
                        <Avatar src={f.imageUrl}>{f.displayName[0]}</Avatar>
                      </ListItemAvatar>
                      <ListItemText primary={f.displayName} />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography color="text.secondary">
                  No friends to invite.
                </Typography>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          {tabIndex === 0 && (
            <Button
              variant="contained"
              onClick={handleCreateCustomInvite}
              disabled={isGeneratingInvite}
            >
              Create Invite
            </Button>
          )}
          <Button onClick={handleCloseDialog}>Close</Button>
        </DialogActions>
      </Dialog>
      {chatRoom && (
        <ChatRoomSettings
          open={settingsOpen}
          onClose={() => setSettingsOpen(false)}
          chatRoomId={chatRoom.id}
        />
      )}
    </Box>
  );
}
