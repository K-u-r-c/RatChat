import { Box, IconButton } from "@mui/material";
import { ReplyOutlined } from "@mui/icons-material";
import EmojiPickerComponent from "../../EmojiPicker";

type Props = {
  isOwn: boolean;
  messageId: string;
  showEmoji: boolean;
  defaultEmoji: string;
  onReplyClick?: (messageId: string) => void;
  onToggleReaction: (emoji: string) => void;
};

export default function SideActions({
  isOwn,
  messageId,
  showEmoji,
  defaultEmoji,
  onReplyClick,
  onToggleReaction,
}: Props) {
  return (
    <Box
      className="actions"
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        opacity: 0,
        transition: "opacity 0.15s",
        flexDirection: isOwn ? "row-reverse" : "row",
      }}
    >
      {onReplyClick && (
        <IconButton
          size="small"
          title="Reply"
          onClick={() => onReplyClick(messageId)}
        >
          <ReplyOutlined fontSize="small" />
        </IconButton>
      )}
      {showEmoji && (
        <EmojiPickerComponent
          variant="reaction"
          showQuickReact={false}
          onQuickReact={async (emoji) => onToggleReaction(emoji)}
          onEmojiSelect={async (emoji) => onToggleReaction(emoji)}
          defaultEmoji={defaultEmoji}
          anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
          transformOrigin={{ vertical: "top", horizontal: "center" }}
        />
      )}
    </Box>
  );
}
