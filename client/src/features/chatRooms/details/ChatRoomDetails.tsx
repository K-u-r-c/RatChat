import { useParams } from "react-router";
import { useChatRooms } from "../../../lib/hooks/useChatRooms";
import { Box, Typography } from "@mui/material";
import ChatRoomDetailsChat from "./ChatRoomDetailsChat";
import ChatRoomManagement from "./ChatRoomManagement";
import ChatRoomRolesBar from "./ChatRoomRolesBar";
import ChatRoomMembersBar from "./ChatRoomMembersBar";

export default function ChatRoomDetails() {
  const { id } = useParams();
  const { chatRoom, isLoadingChatRoom } = useChatRooms(id);

  if (isLoadingChatRoom) return <Typography>Loading...</Typography>;
  if (!chatRoom) return <Typography>Activity not found</Typography>;

  return (
    <Box sx = {{ flex: 1 }}>
      <ChatRoomManagement />
      <ChatRoomRolesBar />
      <ChatRoomMembersBar />
      <ChatRoomDetailsChat />
    </Box>
  );
}
