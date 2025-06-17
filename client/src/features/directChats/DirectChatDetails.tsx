import { useParams } from "react-router";
import { observer } from "mobx-react-lite";
import { useDirectMessages } from "../../lib/hooks/useDirectMessages";
import { useDirectChats } from "../../lib/hooks/useDirectChats";
import { Typography, Box, Avatar, Alert } from "@mui/material";
import MediaChatComponent from "../../app/shared/components/MediaChatComponent";
import type { MessageType, MediaUploadResult } from "../../lib/types";

const DirectChatDetails = observer(function DirectChatDetails() {
  const { id } = useParams();
  const { directMessageStore } = useDirectMessages(id);
  const { directChats } = useDirectChats();

  const currentChat = directChats?.find((chat) => chat.id === id);

  const handleSendMessage = async (
    body: string,
    type: MessageType = "Text",
    mediaData?: Partial<MediaUploadResult>
  ) => {
    if (!currentChat?.canSendMessages) return;

    const messageData = {
      directChatId: id!,
      body,
      type,
      ...(mediaData && {
        mediaUrl: mediaData.url,
        mediaPublicId: mediaData.publicId,
        mediaType: mediaData.mediaType,
        mediaFileSize: mediaData.fileSize,
        mediaOriginalFileName: mediaData.originalFileName,
      }),
    };

    if (type === "Text") {
      await directMessageStore.hubConnection?.invoke(
        "SendDirectMessage",
        messageData
      );
    } else {
      await directMessageStore.hubConnection?.invoke(
        "SendDirectMediaMessage",
        messageData
      );
    }
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

      {!currentChat.canSendMessages && (
        <Alert severity="info" sx={{ mb: 3 }}>
          You can only view this conversation. To send messages, you need to be
          friends with {currentChat.otherUserDisplayName}.
        </Alert>
      )}

      <MediaChatComponent
        title={`Chat with ${currentChat.otherUserDisplayName}`}
        messageStore={directMessageStore}
        onSendMessage={
          currentChat.canSendMessages ? handleSendMessage : async () => {}
        }
        showUserProfiles={false}
        chatRoomId={undefined}
      />
    </Box>
  );
});

export default DirectChatDetails;
