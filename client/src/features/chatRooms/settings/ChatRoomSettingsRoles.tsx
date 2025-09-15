import { Box, Button, Stack, Typography } from "@mui/material";
import { useAccount } from "../../../lib/hooks/useAccount";
import { useChatRooms } from "../../../lib/hooks/useChatRooms";
import { useChatRoomRolesRealtime } from "../../../lib/hooks/useChatRoomRolesRealtime";
import ChatRoomRolesBar from "../details/ChatRoomRolesBar";
import ChatRoomManageRolesForm from "../forms/ChatRoomManageRolesForm";
import { useState } from "react";

type Props = { chatRoomId: string };

export default function ChatRoomSettingsRoles({ chatRoomId }: Props) {
  const { currentUser } = useAccount();
  const { chatRoom, isLoadingChatRoom } = useChatRooms(chatRoomId);
  const { rolesStore } = useChatRoomRolesRealtime(chatRoomId, currentUser?.id);

  const [assignOpen, setAssignOpen] = useState(false);

  return (
    <Stack gap={3} sx={{ height: "100%" }}>
      <Box>
        <Typography variant="h6" gutterBottom>
          Roles
        </Typography>
        <ChatRoomRolesBar
          roles={rolesStore.roles}
          createRole={rolesStore.createRole}
          updateRole={rolesStore.updateRole}
          deleteRole={rolesStore.deleteRole}
        />
      </Box>

      <Box>
        <Typography variant="h6" gutterBottom>
          Assign roles to members
        </Typography>
        <Button
          variant="outlined"
          onClick={() => setAssignOpen(true)}
          disabled={isLoadingChatRoom}
        >
          Manage assignments
        </Button>
      </Box>

      <ChatRoomManageRolesForm
        open={assignOpen}
        onClose={() => setAssignOpen(false)}
        members={chatRoom?.members || []}
        roles={rolesStore.roles}
        memberRoles={rolesStore.memberRoles}
        assignRole={rolesStore.assignRole}
        unassignRole={rolesStore.unassignRole}
        loading={isLoadingChatRoom}
      />
    </Stack>
  );
}
