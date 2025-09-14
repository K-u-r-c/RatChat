import { Paper } from "@mui/material";
import type { BaseMessage } from "../../../../../lib/types";
import MessageContentRenderer from "../MessageContentRenderer";
import ReplyPreview from "./ReplyPreview";

type Props = {
  message: BaseMessage;
  isOwn: boolean;
  onImageClick: (src: string) => void;
  onFileDownload: (url: string, filename: string) => void;
  onJumpToMessage?: (messageId: string) => void;
};

export default function MessageBubble({ message, isOwn, onImageClick, onFileDownload, onJumpToMessage }: Props) {
  return (
    <Paper
      elevation={0}
      sx={{ p: 1.25, bgcolor: isOwn ? "primary.main" : "action.hover", color: isOwn ? "#fff" : "inherit", borderRadius: 2 }}
    >
      <MessageContentRenderer message={message} onImageClick={onImageClick} onFileDownload={onFileDownload} />
      {message.replyToMessageId && (
        <ReplyPreview
          isOwn={isOwn}
          onClick={() => onJumpToMessage && onJumpToMessage(message.replyToMessageId!)}
          replyToDisplayName={message.replyToDisplayName}
          replyToBody={message.replyToBody}
          replyToType={message.replyToType}
          replyToMediaOriginalFileName={message.replyToMediaOriginalFileName}
        />
      )}
    </Paper>
  );
}

