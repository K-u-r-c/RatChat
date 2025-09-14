import { useParams } from "react-router";
import { observer } from "mobx-react-lite";
import { useDirectMessages } from "../../lib/hooks/useDirectMessages";
import { useDirectChats } from "../../lib/hooks/useDirectChats";
import { Typography, Box, Alert } from "@mui/material";
import AvatarWithStatus from "../../app/shared/components/AvatarWithStatus";
import MediaChatComponent from "../../app/shared/components/mediaChatComponent/MediaChatComponent";
import type { MessageType, MediaUploadResult } from "../../lib/types";

const DirectChatDetails = observer(function DirectChatDetails() {
  const { id } = useParams();
  const { directMessageStore } = useDirectMessages(id);
  const { directChats } = useDirectChats();

  const currentChat = directChats?.find((chat) => chat.id === id);

  const handleSendMessage = async (
    body: string,
    type: MessageType = "Text",
    mediaData?: Partial<MediaUploadResult>,
    replyToMessageId?: string
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
      ...(replyToMessageId && { replyToMessageId }),
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
    <Box sx={{ height: "100vh", display: "flex", flexDirection: "column" }}>
      {/* Chat Header */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 2,
          borderBottom: "1px solid",
          borderColor: "divider",
          p: 1,
        }}
      >
        <AvatarWithStatus
          src={currentChat.otherUserImageUrl}
          alt={currentChat.otherUserDisplayName}
          status={
            currentChat.status || (currentChat.isOnline ? "Online" : "Offline")
          }
        >
          {currentChat.otherUserDisplayName[0]}
        </AvatarWithStatus>
        <Box>
          <Typography variant="h6" fontWeight="bold">
            {currentChat.otherUserDisplayName}
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
        showUserProfiles={true}
        chatRoomId={undefined}
        directChatId={id}
        userPermissions={undefined}
      />
    </Box>
  );
});

export default DirectChatDetails;
