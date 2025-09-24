import { useMemo, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Divider,
  Tabs,
  Tab,
  Box,
  Typography,
  TextField,
  Button,
  List,
  ListItem,
  ListItemAvatar,
  Avatar,
  ListItemText,
  Fade,
} from "@mui/material";
import AnimatedAutoHeight from "../../../app/shared/components/AnimatedAutoHeight";
import { useChatRooms } from "../../../lib/hooks/useChatRooms";
import { useFriends } from "../../../lib/hooks/useFriends";

type Props = {
  open: boolean;
  onClose: () => void;
  chatRoomId: string;
};

export default function InvitePeopleModal({
  open,
  onClose,
  chatRoomId,
}: Props) {
  const { chatRoom, createInviteLink, isGeneratingInvite } =
    useChatRooms(chatRoomId);
  const { friends } = useFriends();
  const [tab, setTab] = useState(0);
  const [maxUses, setMaxUses] = useState<string>("");
  const [expiresInMinutes, setExpiresInMinutes] = useState<string>("");

  const bannedUserIds = useMemo(
    () => new Set((chatRoom?.bans || []).map((b) => b.userId)),
    [chatRoom?.bans]
  );

  const availableFriends = useMemo(() => {
    const memberIds = new Set((chatRoom?.members || []).map((m) => m.id));
    return (friends || []).filter((f) => !memberIds.has(f.id));
  }, [friends, chatRoom?.members]);

  const handleCreateInvite = async () => {
    await createInviteLink.mutateAsync({
      id: chatRoomId,
      maxUses: maxUses ? Number(maxUses) : undefined,
      expiresInMinutes: expiresInMinutes ? Number(expiresInMinutes) : undefined,
    });
    onClose();
  };

  const handleInviteFriend = async (friendId: string) => {
    await createInviteLink.mutateAsync({
      id: chatRoomId,
      allowedUserId: friendId,
    });
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      TransitionComponent={Fade}
    >
      <DialogTitle>Invite People</DialogTitle>
      <Divider />
      <DialogContent sx={{ pt: 1 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
          <Tab label="Custom Invite" />
          <Tab label="Friends" />
        </Tabs>

        <AnimatedAutoHeight>
          {tab === 0 && (
            <Box sx={{ display: "grid", gap: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Configure optional limits and expiration for your invite link.
              </Typography>
              <TextField
                label="Max accepts (optional)"
                type="number"
                inputProps={{ min: 1 }}
                value={maxUses}
                onChange={(e) => setMaxUses(e.target.value)}
              />
              <TextField
                label="Expires in minutes (optional)"
                type="number"
                inputProps={{ min: 1 }}
                value={expiresInMinutes}
                onChange={(e) => setExpiresInMinutes(e.target.value)}
              />
              <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
                <Button
                  variant="contained"
                  onClick={handleCreateInvite}
                  disabled={isGeneratingInvite}
                >
                  Create Invite
                </Button>
              </Box>
            </Box>
          )}

          {tab === 1 && (
            <Box>
              {availableFriends && availableFriends.length > 0 ? (
                <List>
                  {availableFriends.map((f) => {
                    const isBanned = bannedUserIds.has(f.id);
                    return (
                      <ListItem
                        key={f.id}
                        secondaryAction={
                          <Button
                            variant={isBanned ? "outlined" : "contained"}
                            size="small"
                            onClick={() =>
                              !isBanned && handleInviteFriend(f.id)
                            }
                            disabled={isBanned || isGeneratingInvite}
                            color={isBanned ? "inherit" : "primary"}
                          >
                            {isBanned ? "Banned" : "Invite"}
                          </Button>
                        }
                      >
                        <ListItemAvatar>
                          <Avatar src={f.imageUrl}>{f.displayName[0]}</Avatar>
                        </ListItemAvatar>
                        <ListItemText primary={f.displayName} />
                      </ListItem>
                    );
                  })}
                </List>
              ) : (
                <Typography color="text.secondary">
                  No friends to invite.
                </Typography>
              )}
            </Box>
          )}
        </AnimatedAutoHeight>
      </DialogContent>
    </Dialog>
  );
}
