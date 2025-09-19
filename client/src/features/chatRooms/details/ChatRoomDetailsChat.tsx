import { observer } from "mobx-react-lite";
import { useMessages } from "../../../lib/hooks/useMessages";
import MediaChatComponent from "../../../app/shared/components/mediaChatComponent/MediaChatComponent";
import type { MessageType, MediaUploadResult } from "../../../lib/types";
import type { useChatRoomRolesRealtime } from "../../../lib/hooks/useChatRoomRolesRealtime";

type Props = {
  chatRoomId: string;
  userPermissions: ReturnType<
    typeof useChatRoomRolesRealtime
  >["userPermissions"];
};

const ChatRoomDetailsChat = observer(function ChatRoomDetailsChat({
  chatRoomId,
  userPermissions,
}: Props) {
  const { messageStore } = useMessages(chatRoomId);

  const handleSendMessage = async (
    body: string,
    type: MessageType = "Text",
    mediaData?: Partial<MediaUploadResult>,
    replyToMessageId?: string
  ) => {
    const messageData = {
      chatRoomId,
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
      userPermissions={userPermissions}
    />
  );
});

export default ChatRoomDetailsChat;
