import { useMemo, useEffect, useState } from "react";
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
import { useChatAppearance } from "../../../lib/hooks/useChatAppearance";
import {
  CHAT_BACKGROUND_OPTIONS,
  DEFAULT_CHAT_BACKGROUND_KEY,
  getChatBackgroundStyle,
  type ChatBackgroundKey,
} from "../constants/chatBackgrounds";

type Props = {
  open: boolean;
  onClose: () => void;
  chatType: "chatroom" | "direct" | "encrypted";
  chatId: string;
  chatName: string;
};

const DEFAULT_EMOJI = "\u{1F44D}";
const POPULAR_EMOJI_CODES = [
  0x1f44d, // thumbs up
  0x1f44f, // clapping hands
  0x1f389, // party popper
  0x1f525, // fire
  0x1f60d, // heart eyes
  0x1f642, // slight smile
  0x1f600, // grinning face
  0x1f602, // joy
  0x1f607, // smiling face with halo
  0x1f618, // face blowing kiss
  0x1f60e, // sunglasses
  0x1f979, // melting face
  0x1f914, // thinking face
  0x1f62e, // open mouth
  0x1f622, // crying face
  0x1f621, // pouting face
  0x1f625, // weary
  0x1f929, // star-struck
  0x1f973, // partying face
  0x1f64f, // folded hands
  0x1f64c, // raising hands
  0x1f44c, // ok hand
  0x1f680, // rocket
  0x2b50, // star
] as const;
const POPULAR_EMOJIS = POPULAR_EMOJI_CODES.map((code) =>
  String.fromCodePoint(code)
);

function normalizeBackgroundKey(value?: string): ChatBackgroundKey {
  if (!value) {
    return DEFAULT_CHAT_BACKGROUND_KEY;
  }
  const match = CHAT_BACKGROUND_OPTIONS.find((option) => option.key === value);
  return match ? match.key : DEFAULT_CHAT_BACKGROUND_KEY;
}

export default function EmojiSettingsDialog({
  open,
  onClose,
  chatType,
  chatId,
  chatName,
}: Props) {
  const { useAppearance, setAppearance } = useChatAppearance();

  const backendChatType =
    chatType === "chatroom"
      ? "ChatRoom"
      : chatType === "encrypted"
      ? "EncryptedDirectChat"
      : "DirectChat";

  const {
    data: appearance,
    isLoading,
    isRefetching,
  } = useAppearance(backendChatType, chatId);

  const initialEmoji = appearance?.defaultEmoji ?? DEFAULT_EMOJI;
  const initialBackground = normalizeBackgroundKey(appearance?.backgroundKey);

  const [currentEmoji, setCurrentEmoji] = useState(initialEmoji);
  const [currentBackground, setCurrentBackground] =
    useState<ChatBackgroundKey>(initialBackground);

  useEffect(() => {
    setCurrentEmoji(initialEmoji);
  }, [initialEmoji]);

  useEffect(() => {
    setCurrentBackground(initialBackground);
  }, [initialBackground]);

  const isSaving = setAppearance.isPending;
  const hasChanges = useMemo(
    () =>
      currentEmoji !== initialEmoji || currentBackground !== initialBackground,
    [currentEmoji, currentBackground, initialEmoji, initialBackground]
  );

  const handleSave = async () => {
    if (!hasChanges) {
      onClose();
      return;
    }

    const payload: {
      chatType: string;
      chatId: string;
      defaultEmoji?: string;
      backgroundKey?: string;
    } = {
      chatType: backendChatType,
      chatId,
    };

    if (currentEmoji !== initialEmoji) {
      payload.defaultEmoji = currentEmoji;
    }

    if (currentBackground !== initialBackground) {
      payload.backgroundKey = currentBackground;
    }

    try {
      await setAppearance.mutateAsync(payload);
      onClose();
    } catch {
      // errors surfaced via toast in mutation
    }
  };

  const handleCancel = () => {
    setCurrentEmoji(initialEmoji);
    setCurrentBackground(initialBackground);
    onClose();
  };

  const handleEmojiSelect = (emoji: string) => {
    setCurrentEmoji(emoji);
  };

  const handleBackgroundSelect = (backgroundKey: ChatBackgroundKey) => {
    setCurrentBackground(backgroundKey);
  };

  if (isLoading && !appearance && !isRefetching) {
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
          <Typography variant="h6">
            Appearance settings for {chatName}
          </Typography>
          <IconButton onClick={handleCancel} size="small">
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Choose the default emoji and background used in this{" "}
          {chatType === "chatroom"
            ? "chat room"
            : chatType === "encrypted"
            ? "encrypted chat"
            : "direct chat"}
          .
        </Typography>

        <Paper
          variant="outlined"
          sx={{
            p: 3,
            mb: 3,
            backgroundColor: "action.hover",
          }}
        >
          <Box display="flex" gap={3} alignItems="center" flexWrap="wrap">
            <Box textAlign="center">
              <Typography variant="h4" sx={{ mb: 1 }}>
                {currentEmoji}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Current default emoji
              </Typography>
            </Box>
            <Box flexGrow={1} minWidth={180}>
              <Box
                sx={{
                  borderRadius: 2,
                  height: 72,
                  border: "1px solid",
                  borderColor: "divider",
                  overflow: "hidden",
                  ...getChatBackgroundStyle(currentBackground),
                  ...(currentBackground === "default"
                    ? { backgroundColor: "rgba(255,255,255,0.04)" }
                    : {}),
                }}
              />
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Current background preview
              </Typography>
            </Box>
          </Box>
        </Paper>

        <Typography variant="subtitle2" gutterBottom>
          Popular emojis
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

        <Typography variant="subtitle2" gutterBottom>
          Or choose any emoji
        </Typography>
        <Box display="flex" justifyContent="center" sx={{ mb: 4 }}>
          <EmojiPickerComponent
            onEmojiSelect={handleEmojiSelect}
            showQuickReact={false}
          />
        </Box>

        <Typography variant="subtitle2" gutterBottom>
          Chat background
        </Typography>
        <Grid container spacing={2}>
          {CHAT_BACKGROUND_OPTIONS.map((option) => {
            const previewSx: Record<string, string | number> = {
              borderRadius: 8,
              height: 64,
              border: "1px solid",
              borderColor:
                currentBackground === option.key
                  ? "primary.main"
                  : "rgba(255,255,255,0.12)",
              ...option.previewStyle,
            };

            if (
              option.key === "default" &&
              option.previewStyle.backgroundColor === undefined
            ) {
              previewSx.backgroundColor = "rgba(255,255,255,0.04)";
            }

            return (
              <Grid key={option.key} size={{ xs: 12, sm: 6 }}>
                <Paper
                  component="button"
                  type="button"
                  onClick={() => handleBackgroundSelect(option.key)}
                  variant="outlined"
                  sx={{
                    width: "100%",
                    textAlign: "left",
                    p: 2,
                    cursor: "pointer",
                    borderColor:
                      currentBackground === option.key
                        ? "primary.main"
                        : "divider",
                    backgroundColor: "rgba(255,255,255,0.02)",
                    transition:
                      "border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease",
                    boxShadow:
                      currentBackground === option.key
                        ? "0 0 0 1px rgba(88,101,242,0.3)"
                        : "none",
                    "&:hover": {
                      borderColor: "primary.light",
                      transform: "translateY(-1px)",
                    },
                  }}
                >
                  <Box sx={previewSx} />
                  <Typography variant="subtitle2" sx={{ mt: 1 }}>
                    {option.label}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {option.description}
                  </Typography>
                </Paper>
              </Grid>
            );
          })}
        </Grid>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleCancel}>Cancel</Button>
        <Button
          onClick={handleSave}
          variant="contained"
          disabled={isSaving || !hasChanges}
        >
          {isSaving ? (
            <>
              <CircularProgress size={20} sx={{ mr: 1 }} />
              Saving...
            </>
          ) : (
            "Save changes"
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
