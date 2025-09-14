import { useState, useRef, memo } from "react";
import { IconButton, Popover, Box } from "@mui/material";
import { AddReaction } from "@mui/icons-material";
import EmojiPicker, {
  type EmojiClickData,
  EmojiStyle,
  Theme,
} from "emoji-picker-react";

type Props = {
  onEmojiSelect: (emoji: string) => void;
  onQuickReact?: (emoji: string) => void;
  defaultEmoji?: string;
  showQuickReact?: boolean;
  disabled?: boolean;
  variant?: "standard" | "reaction";
  randomHoverFaces?: boolean;
  anchorOrigin?: { vertical: "bottom" | "top"; horizontal: "left" | "right" };
  transformOrigin?: {
    vertical: "bottom" | "top";
    horizontal: "left" | "right";
  };
};

function EmojiPickerComponent({
  onEmojiSelect,
  onQuickReact,
  defaultEmoji = "👍",
  showQuickReact = true,
  disabled = false,
  variant = "standard",
  randomHoverFaces = true,
  anchorOrigin = { vertical: "bottom", horizontal: "right" },
  transformOrigin = { vertical: "bottom", horizontal: "right" },
}: Props) {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [hoverEmoji, setHoverEmoji] = useState<string | null>(null);

  const FACE_EMOJIS = [
    "🙂",
    "😊",
    "😄",
    "😃",
    "😁",
    "🥰",
    "😍",
    "🤗",
    "😉",
    "😌",
    "🥲",
    "😺",
    "😸",
  ];

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    onEmojiSelect(emojiData.emoji);
    setTimeout(() => handleClose(), 0);
  };

  const handleReactionClick = (emojiData: EmojiClickData) => {
    handleClose();
    setTimeout(() => onEmojiSelect(emojiData.emoji), 0);
  };

  const handleQuickReact = () => {
    if (onQuickReact) {
      onQuickReact(defaultEmoji);
    }
  };

  const open = Boolean(anchorEl);

  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
      {showQuickReact && onQuickReact && (
        <IconButton
          onClick={handleQuickReact}
          disabled={disabled}
          size="small"
          title={`Quick react with ${defaultEmoji}`}
          sx={{
            fontSize: "1.2rem",
            "&:hover": {
              backgroundColor: "action.hover",
            },
          }}
        >
          {defaultEmoji}
        </IconButton>
      )}

      {variant === "reaction" ? (
        <IconButton
          ref={buttonRef}
          onClick={handleClick}
          disabled={disabled}
          size="small"
          title="React"
          sx={{
            color: "primary.main",
            "&:hover": { backgroundColor: "action.hover" },
          }}
        >
          <AddReaction />
        </IconButton>
      ) : (
        <IconButton
          ref={buttonRef}
          onClick={handleClick}
          disabled={disabled}
          size="small"
          title="Add emoji"
          onMouseEnter={() =>
            randomHoverFaces
              ? setHoverEmoji(
                  FACE_EMOJIS[Math.floor(Math.random() * FACE_EMOJIS.length)]
                )
              : undefined
          }
          onMouseLeave={() => setHoverEmoji(null)}
          sx={{
            width: 32,
            height: 32,
            borderRadius: "50%",
            fontSize: "1.1rem",
            color: "inherit",
            "&:hover": { backgroundColor: "action.hover" },
          }}
        >
          {hoverEmoji || "🙂"}
        </IconButton>
      )}

      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={anchorOrigin}
        transformOrigin={transformOrigin}
        slotProps={{
          paper: {
            elevation: variant === "reaction" ? 0 : undefined,
            sx: {
              backgroundColor: "transparent",
            },
          },
        }}
      >
        <Box sx={{ p: variant === "reaction" ? 0 : 1 }}>
          <EmojiPicker
            onEmojiClick={handleEmojiClick}
            emojiStyle={EmojiStyle.APPLE}
            theme={Theme.AUTO}
            height={400}
            previewConfig={{
              showPreview: variant !== "reaction",
            }}
            reactionsDefaultOpen={variant === "reaction"}
            onReactionClick={handleReactionClick}
          />
        </Box>
      </Popover>
    </Box>
  );
}

export default memo(EmojiPickerComponent);
