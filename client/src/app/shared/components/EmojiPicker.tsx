import { useState, useRef } from "react";
import { IconButton, Popover, Box } from "@mui/material";
import { EmojiEmotions } from "@mui/icons-material";
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
};

export default function EmojiPickerComponent({
  onEmojiSelect,
  onQuickReact,
  defaultEmoji = "👍",
  showQuickReact = true,
  disabled = false,
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
        title="Add emoji"
        sx={{
          color: "primary.main",
          "&:hover": {
            backgroundColor: "action.hover",
          },
        }}
      >
        <EmojiEmotions />
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
            sx: {
              mt: -1,
              borderRadius: 2,
              boxShadow: 3,
            },
          },
        }}
      >
        <Box sx={{ p: 1 }}>
          <EmojiPicker
            onEmojiClick={handleEmojiClick}
            emojiStyle={EmojiStyle.NATIVE}
            theme={Theme.AUTO}
            width={320}
            height={400}
            searchDisabled={false}
            skinTonesDisabled={false}
            previewConfig={{
              showPreview: true,
            }}
          />
        </Box>
      </Popover>
    </Box>
  );
}
