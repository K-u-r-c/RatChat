import { useParams } from "react-router";
import { useChatRooms } from "../../../lib/hooks/useChatRooms";
import { Box, Typography } from "@mui/material";
import ChatRoomDetailsChat from "./ChatRoomDetailsChat";
import ChatRoomManagement from "./ChatRoomManagement";
import ChatRoomRolesBar from "./ChatRoomRolesBar";
import ChatRoomMembersBar from "./ChatRoomMembersBar";
import { useChatRoomRolesRealtime } from "../../../lib/hooks/useChatRoomRolesRealtime";
import { observer } from "mobx-react-lite";

const ChatRoomDetails = observer(function ChatRoomDetails() {
  const { id } = useParams();
  const { chatRoom, isLoadingChatRoom } = useChatRooms(id);
  const { rolesStore } = useChatRoomRolesRealtime(id);

  if (isLoadingChatRoom) return <Typography>Loading...</Typography>;
  if (!chatRoom) return <Typography>Activity not found</Typography>;

  return (
    <Box sx = {{ flex: 1 }}>
      <ChatRoomManagement />
      <ChatRoomRolesBar 
        roles={rolesStore.roles}
        createRole={rolesStore.createRole} 
        updateRole={rolesStore.updateRole}
        deleteRole={rolesStore.deleteRole} />
      <ChatRoomMembersBar />
      <ChatRoomDetailsChat />
    </Box>
  );
});

export default ChatRoomDetails;
