import { useParams } from "react-router";
import { observer } from "mobx-react-lite";
import { useMessages } from "../../../lib/hooks/useMessages";
import BaseChatComponent from "../../../app/shared/components/BaseChatComponent";

const ChatRoomDetailsChat = observer(function ChatRoomDetailsChat() {
  const { id } = useParams();
  const { messageStore } = useMessages(id);

  const handleSendMessage = async (body: string) => {
    await messageStore.hubConnection?.invoke("SendMessage", {
      chatRoomId: id,
      body,
    });
  };

  return (
    <BaseChatComponent
      title="Chat history"
      messageStore={messageStore}
      onSendMessage={handleSendMessage}
      showUserProfiles={true}
    />
  );
});

export default ChatRoomDetailsChat;
