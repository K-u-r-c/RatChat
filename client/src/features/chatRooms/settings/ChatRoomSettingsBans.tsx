import {
  Avatar,
  Box,
  Button,
  Divider,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import { toast } from "react-toastify";
import agent from "../../../lib/api/agent";
import { useAccount } from "../../../lib/hooks/useAccount";
import { useChatRoomRolesRealtime } from "../../../lib/hooks/useChatRoomRolesRealtime";
import { CHATROOM_PERMISSIONS } from "../../../lib/types/chatroomPermissions";
import type { ChatRoomBan, ChatRoom } from "../../../lib/types";

type Props = { chatRoomId: string };

export default function ChatRoomSettingsBans({ chatRoomId }: Props) {
  const queryClient = useQueryClient();
  const { currentUser } = useAccount();
  const { rolesStore } = useChatRoomRolesRealtime(chatRoomId, currentUser?.id);
  const canUnban =
    !!rolesStore.userPermissions?.[CHATROOM_PERMISSIONS.UnbanFromChatRoom];

  const chatRoom = queryClient.getQueryData<ChatRoom>([
    "chatRooms",
    chatRoomId,
  ]);
  const bans: ChatRoomBan[] = useMemo(() => chatRoom?.bans ?? [], [chatRoom]);

  const unbanMutation = useMutation({
    mutationFn: async (userId: string) => {
      await agent.post(`/chatRooms/${chatRoomId}/unban/${userId}`);
      return userId;
    },
    onMutate: async (userId: string) => {
      const key = ["chatRooms", chatRoomId];
      await queryClient.cancelQueries({ queryKey: key });
      const prev = queryClient.getQueryData<ChatRoom>(key);
      if (prev) {
        queryClient.setQueryData<ChatRoom>(key, {
          ...prev,
          bans: prev.bans.filter((b) => b.userId !== userId),
        });
      }
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev)
        queryClient.setQueryData(["chatRooms", chatRoomId], ctx.prev);
      toast.error("Failed to unban user.");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["chatRooms", chatRoomId] });
    },
  });

  const handleUnban = (userId: string) => {
    if (!canUnban) return;
    if (!window.confirm("Unban this user?")) return;
    unbanMutation.mutate(userId);
  };

  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        mb={2}
      >
        <Typography variant="h6">Banned users</Typography>
        <Typography variant="body2" color="text.secondary">
          {bans.length} total
        </Typography>
      </Stack>

      {bans.length === 0 ? (
        <Box py={4} textAlign="center">
          <Typography color="text.secondary">No banned users.</Typography>
        </Box>
      ) : (
        <List disablePadding>
          {bans.map((ban, idx) => {
            const displayName = ban.user?.displayName ?? ban.userId;
            const avatar = ban.user?.imageUrl;
            return (
              <Box key={ban.userId}>
                <ListItem
                  secondaryAction={
                    canUnban && (
                      <Button
                        size="small"
                        variant="outlined"
                        color="success"
                        disabled={unbanMutation.isPending}
                        onClick={() => handleUnban(ban.userId)}
                      >
                        Unban
                      </Button>
                    )
                  }
                >
                  <ListItemAvatar>
                    <Avatar src={avatar}>{displayName?.[0]}</Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={displayName}
                    secondary={`Banned at ${new Date(
                      ban.dateBanned
                    ).toLocaleString()}`}
                  />
                </ListItem>
                {idx < bans.length - 1 && <Divider component="li" />}
              </Box>
            );
          })}
        </List>
      )}
    </Paper>
  );
}
