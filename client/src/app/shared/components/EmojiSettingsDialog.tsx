import { useEffect, useState } from "react";
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
  CircularProgress,
} from "@mui/material";
import { Close } from "@mui/icons-material";
import EmojiPickerComponent from "./EmojiPicker";
import { useEmojiPreferences } from "../../../lib/hooks/useEmojiPreferences";

type Props = {
  open: boolean;
  onClose: () => void;
  chatType: "chatroom" | "direct";
  chatId: string;
  chatName: string;
};

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
  const { useEmojiPreference, setEmojiPreference } = useEmojiPreferences();

  const backendChatType = chatType === "chatroom" ? "ChatRoom" : "DirectChat";

  const { data: emojiPreference, isLoading } = useEmojiPreference(
    backendChatType,
    chatId
  );

  const [currentEmoji, setCurrentEmoji] = useState("👍");

  useEffect(() => {
    if (emojiPreference) {
      setCurrentEmoji(emojiPreference.defaultEmoji);
    }
  }, [emojiPreference]);

  const handleEmojiSelect = (emoji: string) => {
    setCurrentEmoji(emoji);
  };

  const handleSave = async () => {
    try {
      await setEmojiPreference.mutateAsync({
        chatType: backendChatType,
        chatId,
        defaultEmoji: currentEmoji,
      });
      onClose();
    } catch {
      // Error handling is done in the mutation
    }
  };

  const handleCancel = () => {
    if (emojiPreference) {
      setCurrentEmoji(emojiPreference.defaultEmoji);
    } else {
      setCurrentEmoji("👍");
    }
    onClose();
  };

  if (isLoading) {
    return (
      <Dialog open={open} onClose={handleCancel} maxWidth="sm" fullWidth>
        <DialogContent>
          <Box display="flex" justifyContent="center" alignItems="center" p={4}>
            <CircularProgress />
          </Box>
        </DialogContent>
      </Dialog>
    );
  }

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
        <Button
          onClick={handleSave}
          variant="contained"
          disabled={setEmojiPreference.isPending}
        >
          {setEmojiPreference.isPending ? (
            <>
              <CircularProgress size={20} sx={{ mr: 1 }} />
              Saving...
            </>
          ) : (
            "Save Default Emoji"
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
