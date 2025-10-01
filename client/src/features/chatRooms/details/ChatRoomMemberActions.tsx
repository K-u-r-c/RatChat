import {Box, Button, Popover, Stack, Tooltip} from "@mui/material";
import {useEffect, useMemo, useState} from "react";
import {useAccount} from "../../../lib/hooks/useAccount";
import {CHATROOM_PERMISSIONS} from "../../../lib/types/chatroomPermissions";
import agent from "../../../lib/api/agent";
import {useMutation} from "@tanstack/react-query";
import {toast} from "react-toastify";
import {useChatRoomRoles} from "../../../lib/hooks/useChatRoomRoles";
import ConfirmDialog from "../../../app/shared/components/ConfirmDialog";
import type {Profile} from "../../../lib/types";

type Props = {
  open: boolean;
  anchorEl: HTMLElement | null;
  onClose: () => void;
  chatRoomId: string;
  member?: Profile;
  isOwner?: boolean;
};

export default function ChatRoomMemberActions(
  {
    open,
    anchorEl,
    onClose,
    chatRoomId,
    member,
    isOwner,
  }: Props) {
  const {currentUser} = useAccount();
  const {userPermissions} = useChatRoomRoles(chatRoomId, currentUser?.id);

  const isCurrentUser = useMemo(
    () => !!member && member.id === currentUser?.id,
    [member, currentUser]
  );

  const isChatRoomOwner = useMemo(
    () => !!member && isOwner === true,
    [member]
  );

  const canKick =
    !isCurrentUser &&
    !isChatRoomOwner &&
    userPermissions[CHATROOM_PERMISSIONS.KickFromChatRoom];
  const canBan =
    !isCurrentUser &&
    !isChatRoomOwner &&
    userPermissions[CHATROOM_PERMISSIONS.BanFromChatRoom];

  useEffect(() => {
    if (!open || !anchorEl) return;
    if (!document.body.contains(anchorEl)) {
      onClose();
    }
  }, [open, anchorEl, onClose]);

  const kickMutation = useMutation({
    mutationFn: async (targetId: string) =>
      agent.post(`/chatRooms/${chatRoomId}/kick/${targetId}`),
    onSuccess: () => {
      const name = kickTarget?.displayName;
      toast.success(name ? `${name} kicked.` : "User kicked.");
    },
    onError: () => toast.error("Failed to kick user."),
  });

  const banMutation = useMutation({
    mutationFn: async (targetId: string) =>
      agent.post(`/chatRooms/${chatRoomId}/ban/${targetId}`),
    onSuccess: () => {
      const name = banTarget?.displayName;
      toast.success(name ? `${name} banned.` : "User banned.");
    },
    onError: () => toast.error("Failed to ban user."),
  });

  // Capture target data at dialog open so it stays stable if parent clears member
  const [kickDialogOpen, setKickDialogOpen] = useState(false);
  const [banDialogOpen, setBanDialogOpen] = useState(false);
  const [kickTarget, setKickTarget] = useState<{ id: string; displayName: string } | null>(null);
  const [banTarget, setBanTarget] = useState<{ id: string; displayName: string } | null>(null);

  const handleKick = () => {
    if (!member || !canKick || kickMutation.isPending) return;
    setKickTarget({id: member.id, displayName: member.displayName});
    onClose();
    setKickDialogOpen(true);
  };

  const handleBan = () => {
    if (!member || !canBan || banMutation.isPending) return;
    setBanTarget({id: member.id, displayName: member.displayName});
    onClose();
    setBanDialogOpen(true);
  };

  const confirmKick = () => {
    if (!kickTarget || kickMutation.isPending) return;
    kickMutation.mutate(kickTarget.id, {
      onSettled: () => {
        setKickDialogOpen(false);
        setKickTarget(null);
      }
    });
  };

  const confirmBan = () => {
    if (!banTarget || banMutation.isPending) return;
    banMutation.mutate(banTarget.id, {
      onSettled: () => {
        setBanDialogOpen(false);
        setBanTarget(null);
      }
    });
  };

  const loading = kickMutation.isPending || banMutation.isPending;

  return (
    <>
      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={onClose}
        anchorOrigin={{vertical: "bottom", horizontal: "center"}}
        transformOrigin={{vertical: "top", horizontal: "center"}}
        slotProps={{
          paper: {
            sx: {
              p: 1.5,
              width: 100,
              borderRadius: 2,
              bgcolor: "background.paper",
            },
          },
        }}
      >
        <Box>
          <Stack direction="column" gap={1}>
            <Tooltip
              title={
                canKick
                  ? ""
                  : !member
                    ? "No user"
                    : isCurrentUser
                      ? "Cannot kick yourself"
                      : isChatRoomOwner
                        ? "Cannot kick chatroom owner"
                        : "No permission"
              }
              disableHoverListener={canKick}
            >
              <span>
                <Button
                  size="small"
                  variant="text"
                  color="error"
                  disabled={!canKick || loading}
                  onClick={handleKick}
                  sx={{
                    justifyContent: "flex-start",
                    textTransform: "none",
                    width: "100%",
                  }}
                >
                  Kick
                </Button>
              </span>
            </Tooltip>
            <Tooltip
              title={
                canBan
                  ? ""
                  : !member
                    ? "No user"
                    : isCurrentUser
                      ? "Cannot ban yourself"
                      : isChatRoomOwner
                        ? "Cannot ban chatroom owner"
                        : "No permission"
              }
              disableHoverListener={canBan}
            >
              <span>
                <Button
                  size="small"
                  variant="text"
                  color="error"
                  disabled={!canBan || loading}
                  onClick={handleBan}
                  sx={{
                    justifyContent: "flex-start",
                    textTransform: "none",
                    width: "100%",
                  }}
                >
                  Ban
                </Button>
              </span>
            </Tooltip>
          </Stack>
        </Box>
      </Popover>

      <ConfirmDialog
        open={kickDialogOpen}
        onClose={() => !kickMutation.isPending && (setKickDialogOpen(false), setKickTarget(null))}
        onConfirm={confirmKick}
        title="Confirm Kick"
        message={kickTarget ? `Kick ${kickTarget.displayName} from this chat room?\nThey can rejoin if invited again.` : ''}
        confirmText="Kick"
        confirmColor="error"
        isProcessing={kickMutation.isPending}
        ariaLabel="confirm-kick-member"
      />

      <ConfirmDialog
        open={banDialogOpen}
        onClose={() => !banMutation.isPending && (setBanDialogOpen(false), setBanTarget(null))}
        onConfirm={confirmBan}
        title="Confirm Ban"
        message={banTarget ? `Ban ${banTarget.displayName} from this chat room?\nThey will not be able to rejoin until unbanned.` : ''}
        confirmText="Ban"
        confirmColor="error"
        isProcessing={banMutation.isPending}
        ariaLabel="confirm-ban-member"
      />
    </>
  );
}
