import { useState, useRef, memo } from "react";
import { IconButton, Popover, Box, type SxProps } from "@mui/material";
import { AddReaction, EmojiEmotions } from "@mui/icons-material";
import EmojiPicker, {
  type EmojiClickData,
  EmojiStyle,
  Theme,
  SuggestionMode,
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
    handleClose();
  };

  const handleReactionClick = (emojiData: EmojiClickData) => {
    onEmojiSelect(emojiData.emoji);
    handleClose();
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
          vertical: "top",
          horizontal: "right",
        }}
        transformOrigin={{
          vertical: "bottom",
          horizontal: "right",
        }}
        slotProps={{
          paper: {
            elevation: variant === "reaction" ? 0 : undefined,
            sx: (variant === "reaction"
              ? {
                  mt: 0,
                  p: 0,
                  backgroundColor: "transparent",
                  boxShadow: "none",
                  borderRadius: 0,
                }
              : {
                  mt: -1,
                  borderRadius: 2,
                  boxShadow: 3,
                }) as SxProps,
          },
        }}
      >
        {open && (
          <Box sx={{ p: variant === "reaction" ? 0 : 1 }}>
            <EmojiPicker
              onEmojiClick={handleEmojiClick}
              emojiStyle={EmojiStyle.NATIVE}
              theme={"auto" as Theme.AUTO}
              width={variant === "reaction" ? 300 : 320}
              height={variant === "reaction" ? 300 : 400}
              searchDisabled={variant === "reaction"}
              skinTonesDisabled={variant === "reaction"}
              previewConfig={{
                showPreview: variant !== "reaction",
              }}
              suggestedEmojisMode={
                variant === "reaction"
                  ? SuggestionMode.RECENT
                  : SuggestionMode.FREQUENT
              }
              lazyLoadEmojis={true}
              reactionsDefaultOpen={variant === "reaction"}
              onReactionClick={handleReactionClick}
            />
          </Box>
        )}
      </Popover>
    </Box>
  );
}

export default memo(EmojiPickerComponent);
