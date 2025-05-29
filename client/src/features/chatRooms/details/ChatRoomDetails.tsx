import { useParams } from "react-router";
import { useChatRooms } from "../../../lib/hooks/useChatRooms";
import { Grid, Typography } from "@mui/material";
import ChatRoomDetailsChat from "./ChatRoomDetailsChat";

export default function ChatRoomDetails() {
  const { id } = useParams();
  const { chatRoom, isLoadingChatRoom } = useChatRooms(id);

  if (isLoadingChatRoom) return <Typography>Loading...</Typography>;
  if (!chatRoom) return <Typography>Activity not found</Typography>;

  return (
    <Grid container spacing={3}>
      <Grid size={8}>
        <ChatRoomDetailsChat />
      </Grid>
      <Grid size={4}>
        {/* <ActivityDetailsSidebar chatRoom={chatRoom} /> */}
      </Grid>
    </Grid>
  );
}
