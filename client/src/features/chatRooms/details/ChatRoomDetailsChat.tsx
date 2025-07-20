import { useParams } from "react-router";
import { observer } from "mobx-react-lite";
import { useMessages } from "../../../lib/hooks/useMessages";
import MediaChatComponent from "../../../app/shared/components/mediaChatComponent/MediaChatComponent";
import type { MessageType, MediaUploadResult } from "../../../lib/types";
import type { useChatRoomRolesRealtime } from "../../../lib/hooks/useChatRoomRolesRealtime";

type Props = {
    userPermissions: ReturnType<typeof 
      useChatRoomRolesRealtime>["userPermissions"];
}

const ChatRoomDetailsChat = observer(function ChatRoomDetailsChat(
  { userPermissions } : Props
) {
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
      userPermissions={userPermissions}
    />
  );
});

export default ChatRoomDetailsChat;
