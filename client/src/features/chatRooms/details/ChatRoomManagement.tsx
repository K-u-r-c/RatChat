import { Box, Button, Stack } from "@mui/material";
import { useParams, useNavigate } from "react-router";
import { useChatRooms } from "../../../lib/hooks/useChatRooms";

export default function ChatRoomManagement() {
  const { id } = useParams();
  const navigate = useNavigate();
  const {
    chatRoom,
    deleteChatRooms,
    generateInviteLink,
    inviteLink,
    isGeneratingInvite,
    leaveChatRoom,
  } = useChatRooms(id);

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
    await generateInviteLink.mutateAsync(id!);
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
          disabled={!chatRoom?.isAdmin || isGeneratingInvite}
        >
          Generate Invite Link
        </Button>
      </Stack>
      {inviteLink && (
        <Box mt={2}>
          <strong>Invite Link:</strong>{" "}
          <a href={inviteLink} target="_blank" rel="noopener noreferrer">
            {inviteLink}
          </a>
        </Box>
      )}
    </Box>
  );
}
