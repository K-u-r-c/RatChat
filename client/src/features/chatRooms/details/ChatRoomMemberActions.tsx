import { Popover, Box, Button, Stack, Tooltip } from "@mui/material";
import { useMemo, useEffect } from "react";
import { useAccount } from "../../../lib/hooks/useAccount";
import { useChatRoomRolesRealtime } from "../../../lib/hooks/useChatRoomRolesRealtime";
import { CHATROOM_PERMISSIONS } from "../../../lib/types/chatroomPermissions";
import agent from "../../../lib/api/agent";
import { useMutation } from "@tanstack/react-query";
import { toast } from "react-toastify";

type MemberTarget = {
  id: string;
  isOwner?: boolean;
};

type Props = {
  open: boolean;
  anchorEl: HTMLElement | null;
  onClose: () => void;
  chatRoomId: string;
  member: MemberTarget | null;
};

export default function ChatRoomMemberActions({
  open,
  anchorEl,
  onClose,
  chatRoomId,
  member,
}: Props) {
  const { currentUser } = useAccount();
  const { rolesStore } = useChatRoomRolesRealtime(chatRoomId, currentUser?.id);

  const userPermissions = rolesStore.userPermissions;

  const isProtected = useMemo(
    () => !member || member.id === currentUser?.id || member.isOwner === true,
    [member, currentUser]
  );

  const canKick =
    !isProtected && !!userPermissions[CHATROOM_PERMISSIONS.KickFromChatRoom];
  const canBan =
    !isProtected && !!userPermissions[CHATROOM_PERMISSIONS.BanFromChatRoom];

  useEffect(() => {
    if (!open || !anchorEl) return;
    if (!document.body.contains(anchorEl)) {
      onClose();
    }
  }, [open, anchorEl, onClose]);

  const kickMutation = useMutation({
    mutationFn: async () =>
      agent.post(`/chatRooms/${chatRoomId}/kick/${member!.id}`),
    onSuccess: () => toast.success("User kicked."),
    onError: () => toast.error("Failed to kick user."),
  });

  const banMutation = useMutation({
    mutationFn: async () =>
      agent.post(`/chatRooms/${chatRoomId}/ban/${member!.id}`),
    onSuccess: () => toast.success("User banned."),
    onError: () => toast.error("Failed to ban user."),
  });

  const handleKick = () => {
    if (!member || !canKick || kickMutation.isPending) return;
    onClose();
    if (window.confirm("Kick this user?")) {
      kickMutation.mutate();
    }
  };

  const handleBan = () => {
    if (!member || !canBan || banMutation.isPending) return;
    onClose();
    if (window.confirm("Ban this user?")) {
      banMutation.mutate();
    }
  };

  const loading = kickMutation.isPending || banMutation.isPending;

  return (
    <Popover
      open={open}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      transformOrigin={{ vertical: "top", horizontal: "center" }}
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
                : isProtected
                ? "Action not allowed on this user"
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
                : isProtected
                ? "Action not allowed on this user"
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
  );
}
