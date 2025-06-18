import { useParams } from "react-router";
import { observer } from "mobx-react-lite";
import { useMessages } from "../../../lib/hooks/useMessages";
import MediaChatComponent from "../../../app/shared/components/MediaChatComponent";
import type { MessageType, MediaUploadResult } from "../../../lib/types";

const ChatRoomDetailsChat = observer(function ChatRoomDetailsChat() {
  const { id } = useParams();
  const { messageStore } = useMessages(id);

  const handleSendMessage = async (
    body: string,
    type: MessageType = "Text",
    mediaData?: Partial<MediaUploadResult>
  ) => {
    const messageData = {
      chatRoomId: id!,
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
      await messageStore.hubConnection?.invoke("SendMessage", messageData);
    } else {
      await messageStore.hubConnection?.invoke("SendMediaMessage", messageData);
    }
  };

  return (
    <MediaChatComponent
      title="Chat history"
      messageStore={messageStore}
      onSendMessage={handleSendMessage}
      showUserProfiles={true}
      chatRoomId={id}
    />
  );
});

export default ChatRoomDetailsChat;
