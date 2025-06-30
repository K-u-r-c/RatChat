import { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Grid,
  Paper,
  IconButton,
} from "@mui/material";
import { Close } from "@mui/icons-material";
import EmojiPickerComponent from "./EmojiPicker";
import { setDefaultEmoji, getDefaultEmoji } from "../../../lib/util/emojiUtils";

type Props = {
  open: boolean;
  onClose: () => void;
  chatType: "chatroom" | "direct";
  chatId: string;
  chatName: string;
};

// Popular emojis for quick selection
const POPULAR_EMOJIS = [
  "👍",
  "❤️",
  "😂",
  "😮",
  "😢",
  "😡",
  "👏",
  "🙏",
  "💪",
  "🔥",
  "✨",
  "⭐",
  "✅",
  "❌",
  "💯",
  "🎉",
  "👀",
  "🤔",
  "😍",
  "🥰",
  "😭",
  "😎",
  "🤝",
  "💝",
];

export default function EmojiSettingsDialog({
  open,
  onClose,
  chatType,
  chatId,
  chatName,
}: Props) {
  const [currentEmoji, setCurrentEmoji] = useState(() =>
    getDefaultEmoji(chatType, chatId)
  );

  const handleEmojiSelect = (emoji: string) => {
    setCurrentEmoji(emoji);
  };

  const handleSave = () => {
    setDefaultEmoji(chatType, chatId, currentEmoji);
    onClose();
  };

  const handleCancel = () => {
    setCurrentEmoji(getDefaultEmoji(chatType, chatId));
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleCancel} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">Default Emoji for {chatName}</Typography>
          <IconButton onClick={handleCancel} size="small">
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Choose a default emoji for quick reactions in this{" "}
          {chatType === "chatroom" ? "chat room" : "direct chat"}.
        </Typography>

        {/* Current Selection */}
        <Paper
          variant="outlined"
          sx={{
            p: 3,
            textAlign: "center",
            mb: 3,
            backgroundColor: "action.hover",
          }}
        >
          <Typography variant="h4" sx={{ mb: 1 }}>
            {currentEmoji}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Current default emoji
          </Typography>
        </Paper>

        {/* Popular Emojis */}
        <Typography variant="subtitle2" gutterBottom>
          Popular choices:
        </Typography>
        <Grid container spacing={1} sx={{ mb: 3 }}>
          {POPULAR_EMOJIS.map((emoji) => (
            <Grid size="auto" key={emoji}>
              <Button
                variant={currentEmoji === emoji ? "contained" : "outlined"}
                onClick={() => handleEmojiSelect(emoji)}
                sx={{
                  minWidth: 48,
                  height: 48,
                  fontSize: "1.5rem",
                  p: 0,
                }}
              >
                {emoji}
              </Button>
            </Grid>
          ))}
        </Grid>

        {/* Emoji Picker */}
        <Typography variant="subtitle2" gutterBottom>
          Or choose any emoji:
        </Typography>
        <Box display="flex" justifyContent="center">
          <EmojiPickerComponent
            onEmojiSelect={handleEmojiSelect}
            showQuickReact={false}
          />
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleCancel}>Cancel</Button>
        <Button onClick={handleSave} variant="contained">
          Save Default Emoji
        </Button>
      </DialogActions>
    </Dialog>
  );
}
