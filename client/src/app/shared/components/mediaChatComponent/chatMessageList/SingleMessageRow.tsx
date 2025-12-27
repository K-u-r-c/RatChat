import { Box } from "@mui/material";
import type { BaseMessage } from "../../../../../lib/types";
import MessageHeader from "./MessageHeader";
import MessageBubble from "./MessageBubble";
import SideActions from "./SideActions";
import MessageReactions from "../MessageReactions";
import type { MessageReaction } from "../../../../../lib/types";
import MessageAvatar from "../../MessageAvatar";
import { formatDate } from "../../../../../lib/util/util";

type Props = {
  message: BaseMessage;
  isOwn: boolean;
  continuation?: boolean;
  showUserProfiles?: boolean;
  onImageClick: (src: string) => void;
  onFileDownload: (url: string, filename: string) => void;
  onReplyClick?: (messageId: string) => void;
  onJumpToMessage?: (messageId: string) => void;
  defaultEmoji: string;
  showEmoji: boolean;
  onToggleReaction: (emoji: string) => void;
  reactions?: MessageReaction[];
  currentUserId?: string;
  accentColor?: string;
};

export default function SingleMessageRow({
  message,
  isOwn,
  continuation,
  showUserProfiles,
  onImageClick,
  onFileDownload,
  onReplyClick,
  onJumpToMessage,
  defaultEmoji,
  showEmoji,
  onToggleReaction,
  reactions,
  currentUserId,
  accentColor,
}: Props) {
  const displayName =
    message.senderDisplayName || message.displayName || "Unknown";

  const profileSlug = message.senderSlug || message.userSlug;

  return (
    <Box
      id={`msg-${message.id}`}
      className="rc-message"
      sx={{
        display: "flex",
        flexDirection: isOwn ? "row-reverse" : "row",
        mb: continuation ? 0.4 : 0.6,
        position: "relative",
        px: 1,
        py: continuation ? 0.2 : 0.35,
        borderRadius: 1,
        transition: "background-color 0.15s",
        "&:hover": { backgroundColor: "rgba(255,255,255,0.04)" },
        "&:hover .actions": { opacity: 1 },
      }}
      title={formatDate(message.createdAt)}
    >
      {!continuation ? (
        <MessageAvatar
          userId={message.senderId || message.userId || ""}
          userSlug={profileSlug}
          imageUrl={message.senderImageUrl || message.imageUrl}
          displayName={displayName}
          showUserProfiles={showUserProfiles}
        />
      ) : (
        <Box sx={{ width: 40, mx: 2 }} />
      )}

      <Box
        display="flex"
        flexDirection="column"
        sx={{ flex: 1, alignItems: isOwn ? "flex-end" : "flex-start" }}
      >
        {!continuation && (
          <MessageHeader
            isOwn={isOwn}
            displayName={displayName}
            createdAt={message.createdAt}
            messageType={message.type}
            profileSlug={profileSlug}
            showUserProfiles={showUserProfiles}
            accentColor={accentColor}
          />
        )}

        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 0.75,
            flexDirection: isOwn ? "row-reverse" : "row",
            maxWidth: { xs: "90%", sm: "75%" },
          }}
        >
          <MessageBubble
            message={message}
            isOwn={isOwn}
            onImageClick={onImageClick}
            onFileDownload={onFileDownload}
            onJumpToMessage={onJumpToMessage}
          />
          <SideActions
            isOwn={isOwn}
            messageId={message.id}
            onReplyClick={onReplyClick}
            showEmoji={showEmoji}
            defaultEmoji={defaultEmoji}
            onToggleReaction={onToggleReaction}
          />
        </Box>
        <Box sx={{ alignSelf: isOwn ? "flex-end" : "flex-start" }}>
          <MessageReactions
            reactions={reactions as MessageReaction[]}
            currentUserId={currentUserId}
            onToggle={async (emoji) => onToggleReaction(emoji)}
          />
        </Box>
      </Box>
    </Box>
  );
}
