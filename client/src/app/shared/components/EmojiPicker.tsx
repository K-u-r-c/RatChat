import { useState, useRef, memo } from "react";
import { IconButton, Popover, Box } from "@mui/material";
import { AddReaction, EmojiEmotions } from "@mui/icons-material";
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
};

function EmojiPickerComponent({
  onEmojiSelect,
  onQuickReact,
  defaultEmoji = "👍",
  showQuickReact = true,
  disabled = false,
  variant = "standard",
}: Props) {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

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

      <IconButton
        ref={buttonRef}
        onClick={handleClick}
        disabled={disabled}
        size="small"
        title={variant === "reaction" ? "React" : "Add emoji"}
        sx={{
          color: "primary.main",
          "&:hover": {
            backgroundColor: "action.hover",
          },
        }}
      >
        {variant === "reaction" ? <AddReaction /> : <EmojiEmotions />}
      </IconButton>

      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "right",
        }}
        transformOrigin={{
          vertical: "bottom",
          horizontal: "right",
        }}
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
