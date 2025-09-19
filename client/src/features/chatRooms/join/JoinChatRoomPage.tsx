import { useEffect, useRef } from "react";
import { Box, Typography, Button, CircularProgress } from "@mui/material";
import { useNavigate, useParams } from "react-router";
import { useChatRooms } from "../../../lib/hooks/useChatRooms";
import { useStore } from "../../../lib/hooks/useStore";

const JoinChatRoomPage = () => {
  const { slug, token } = useParams();
  const navigate = useNavigate();
  const { joinChatRoom } = useChatRooms();
  const { uiStore } = useStore();
  const hasJoined = useRef(false);

  useEffect(() => {
    if (!slug || !token || hasJoined.current) return;
    uiStore.suppressNextChatRoomForbiddenToast();
    hasJoined.current = true;
    joinChatRoom.mutate({ identifier: slug, token });
  }, [slug, token, joinChatRoom, uiStore]);

  const handleRedirect = () => {
    navigate("/");
  };

  return (
    <Box sx={{ textAlign: "center", mt: 5 }}>
      {joinChatRoom.isPending ? (
        <CircularProgress />
      ) : joinChatRoom.isError ? (
        <Box>
          <Typography variant="h6" color="error">
            Failed to join the chat room. Please check the invite link.
          </Typography>
          <Button variant="contained" onClick={handleRedirect} sx={{ mt: 2 }}>
            Go to Chat Rooms
          </Button>
        </Box>
      ) : null}
    </Box>
  );
};

export default JoinChatRoomPage;
