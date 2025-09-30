import { Box, Button, Stack, Typography } from "@mui/material";
import { useAccount } from "../../../lib/hooks/useAccount";
import { useChatRooms } from "../../../lib/hooks/useChatRooms";
import ChatRoomRolesBar from "../details/ChatRoomRolesBar";
import ChatRoomManageRolesForm from "../forms/ChatRoomManageRolesForm";
import {useMemo, useState} from "react";
import { useChatRoomRoles } from "../../../lib/hooks/useChatRoomRoles";
import {CHATROOM_PERMISSIONS} from "../../../lib/types/chatroomPermissions.ts"; // permission info

type Props = { chatRoomId: string };

export default function ChatRoomSettingsRoles({ chatRoomId }: Props) {
  const { currentUser } = useAccount();
  const { chatRoom, isLoadingChatRoom } = useChatRooms(chatRoomId);
  const [assignOpen, setAssignOpen] = useState(false);
  const { userPermissions } = useChatRoomRoles(chatRoom?.id, currentUser?.id);

  const canManageRoles = useMemo(() => userPermissions[CHATROOM_PERMISSIONS.ManageChatRoomRoles], [userPermissions]);
  return (
    <Stack gap={3} sx={{ height: "100%" }}>
      <Box>
        <Typography variant="h6" gutterBottom>
          Roles
        </Typography>
        <ChatRoomRolesBar
          chatRoomId={chatRoom?.id}
          currentUserId={currentUser?.id}
        />
      </Box>

      <Box>
        <Typography variant="h6" gutterBottom>
          Assign roles to members
        </Typography>
        <Button
          variant="outlined"
          onClick={() => setAssignOpen(true)}
          disabled={isLoadingChatRoom || !canManageRoles}
        >
          Manage assignments
        </Button>
        {!canManageRoles && !isLoadingChatRoom && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            You don't have permission to manage roles.
          </Typography>
        )}
      </Box>

      <ChatRoomManageRolesForm
        open={assignOpen}
        onClose={() => setAssignOpen(false)}
        members={chatRoom?.members || []}
        chatRoomId={chatRoom?.id}
        currentUserId={currentUser?.id}
        loading={isLoadingChatRoom}
      />
    </Stack>
  );
}
