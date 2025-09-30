import { observer } from "mobx-react-lite";
import { useMessages } from "../../../lib/hooks/useMessages";
import MediaChatComponent from "../../../app/shared/components/mediaChatComponent/MediaChatComponent";
import type { MessageType, MediaUploadResult } from "../../../lib/types";

type Props = {
  chatRoomId: string;
  channelId: string;
};

const ChatRoomDetailsChat = observer(function ChatRoomDetailsChat({
  chatRoomId,
  channelId,
}: Props) {
  const { messageStore } = useMessages(chatRoomId, channelId);

  const handleSendMessage = async (
    body: string,
    type: MessageType = "Text",
    mediaData?: Partial<MediaUploadResult>,
    replyToMessageId?: string
  ) => {
    if (!channelId) return;
    const messageData = {
      chatRoomId,
      channelId,
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
      chatRoomId={chatRoomId}
      channelId={channelId}
    />
  );
});

export default ChatRoomDetailsChat;
