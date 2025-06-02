import { useParams } from "react-router";
import { useChatRooms } from "../../../lib/hooks/useChatRooms";
import { Box, Typography } from "@mui/material";
import ChatRoomDetailsChat from "./ChatRoomDetailsChat";
import ChatRoomManagement from "./ChatRoomManagement";

export default function ChatRoomDetails() {
  const { id } = useParams();
  const { chatRoom, isLoadingChatRoom } = useChatRooms(id);

  if (isLoadingChatRoom) return <Typography>Loading...</Typography>;
  if (!chatRoom) return <Typography>Activity not found</Typography>;

  return (
    <Box>
      <ChatRoomManagement />
      <ChatRoomDetailsChat />
    </Box>
  );
}
