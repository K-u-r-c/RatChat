import { Box, Button, Stack, Typography } from "@mui/material";
import { useAccount } from "../../../lib/hooks/useAccount";
import { useChatRooms } from "../../../lib/hooks/useChatRooms";
import ChatRoomRolesBar from "../details/ChatRoomRolesBar";
import ChatRoomManageRolesForm from "../forms/ChatRoomManageRolesForm";
import { useState } from "react";

type Props = { chatRoomId: string };

export default function ChatRoomSettingsRoles({ chatRoomId }: Props) {
  const { currentUser } = useAccount();
  const { chatRoom, isLoadingChatRoom } = useChatRooms(chatRoomId);

  const [assignOpen, setAssignOpen] = useState(false);

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
          disabled={isLoadingChatRoom}
        >
          Manage assignments
        </Button>
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
