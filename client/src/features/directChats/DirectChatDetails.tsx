import { useParams } from "react-router";
import { observer } from "mobx-react-lite";
import { useDirectMessages } from "../../lib/hooks/useDirectMessages";
import { useDirectChats } from "../../lib/hooks/useDirectChats";
import BaseChatComponent from "../../app/shared/components/BaseChatComponent";
import { Typography, Box, Avatar } from "@mui/material";

const DirectChatDetails = observer(function DirectChatDetails() {
  const { id } = useParams();
  const { directMessageStore } = useDirectMessages(id);
  const { directChats } = useDirectChats();

  const currentChat = directChats?.find((chat) => chat.id === id);

  const handleSendMessage = async (body: string) => {
    await directMessageStore.hubConnection?.invoke("SendDirectMessage", {
      directChatId: id,
      body,
    });
  };

  if (!currentChat) {
    return <Typography>Direct chat not found</Typography>;
  }

  return (
    <Box>
      {/* Chat Header */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 2,
          p: 2,
          borderBottom: "1px solid",
          borderColor: "divider",
          mb: 3,
        }}
      >
        <Avatar
          src={currentChat.otherUserImageUrl}
          alt={currentChat.otherUserDisplayName}
          sx={{ width: 48, height: 48 }}
        >
          {currentChat.otherUserDisplayName[0]}
        </Avatar>
        <Box>
          <Typography variant="h5" fontWeight="bold">
            {currentChat.otherUserDisplayName}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {currentChat.isOnline ? "Online" : "Offline"}
          </Typography>
        </Box>
      </Box>

      <BaseChatComponent
        title={`Chat with ${currentChat.otherUserDisplayName}`}
        messageStore={directMessageStore}
        onSendMessage={handleSendMessage}
        showUserProfiles={false}
      />
    </Box>
  );
});

export default DirectChatDetails;
