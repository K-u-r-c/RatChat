import { Box, Paper } from "@mui/material";
import type { BaseMessage } from "../../../../../lib/types";
import MessageAvatar from "../../MessageAvatar";
import GroupedMediaMessage from "../GroupedMediaMessage";
import MessageHeader from "./MessageHeader";
import ReplyPreview from "./ReplyPreview";
import { formatDate } from "../../../../../lib/util/util";

type Props = {
  messages: BaseMessage[];
  type: "Image" | "Video";
  isOwn: boolean;
  displayName: string;
  showUserProfiles?: boolean;
  onImageClick: (src: string) => void;
  onJumpToMessage?: (messageId: string) => void;
};

export default function GroupedMediaRow({
  messages,
  type,
  isOwn,
  displayName,
  showUserProfiles,
  onImageClick,
  onJumpToMessage,
}: Props) {
  const first = messages[0];
  return (
    <Box
      id={`msg-${first.id}`}
      className="rc-message"
      title={formatDate(first.createdAt)}
      sx={{
        display: "flex",
        flexDirection: isOwn ? "row-reverse" : "row",
        mb: 1.0,
        position: "relative",
        px: 1,
        py: 0.5,
        borderRadius: 1,
        transition: "background-color 0.15s",
        "&:hover": { backgroundColor: "rgba(255,255,255,0.04)" },
        "&:hover .actions": { opacity: 1 },
      }}
    >
      <MessageAvatar
        userId={first.senderId || first.userId || ""}
        imageUrl={first.senderImageUrl || first.imageUrl}
        displayName={displayName}
        showUserProfiles={showUserProfiles}
      />
      <Box
        display="flex"
        flexDirection="column"
        sx={{ flex: 1, alignItems: isOwn ? "flex-end" : "flex-start" }}
      >
        <MessageHeader
          isOwn={isOwn}
          displayName={displayName}
          createdAt={first.createdAt}
          messageType={type}
        />
        <Paper
          elevation={0}
          sx={{
            p: 1.25,
            bgcolor: isOwn ? "primary.main" : "action.hover",
            color: isOwn ? "#fff" : "inherit",
            borderRadius: 2,
            maxWidth: { xs: "90%", sm: "75%" },
          }}
        >
          <GroupedMediaMessage
            type={type}
            messages={messages}
            onImageClick={onImageClick}
          />
          {first.replyToMessageId && (
            <ReplyPreview
              isOwn={isOwn}
              onClick={() =>
                onJumpToMessage && onJumpToMessage(first.replyToMessageId!)
              }
              replyToDisplayName={first.replyToDisplayName}
              replyToBody={first.replyToBody}
              replyToType={first.replyToType}
              replyToMediaOriginalFileName={first.replyToMediaOriginalFileName}
            />
          )}
        </Paper>
      </Box>
    </Box>
  );
}
