import {Close} from "@mui/icons-material";
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  Paper,
  Typography,
} from "@mui/material";
import {useCallback, useEffect, useMemo, useRef, useState,} from "react";
import {type SetChatAppearanceRequest, useChatAppearance,} from "../../../lib/hooks/useChatAppearance";
import {MediaCategory, useMedia} from "../../../lib/hooks/useMedia";
import {
  CHAT_BACKGROUND_OPTIONS,
  type ChatBackgroundSelection,
  DEFAULT_CHAT_BACKGROUND_KEY,
  getChatBackgroundStyle,
} from "../constants/chatBackgrounds";
import {CustomBackgroundUploadDialog} from "./CustomBackgroundUploadDialog";
import EmojiPickerComponent from "./EmojiPicker";

type Props = {
  open: boolean;
  onClose: () => void;
  chatType: "chatroom" | "direct" | "encrypted";
  chatId: string;
  chatName: string;
};

type CustomBackground = {
  url: string;
  publicId: string;
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

function normalizeBackgroundKey(value?: string): ChatBackgroundSelection {
  if (!value) {
    return DEFAULT_CHAT_BACKGROUND_KEY;
  }

  if (value === "custom") {
    return "custom";
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
  const {useAppearance, setAppearance} = useChatAppearance();
  const {uploadMedia, deleteMedia} = useMedia();
  const deleteMediaRef = useRef(deleteMedia);

  useEffect(() => {
    deleteMediaRef.current = deleteMedia;
  }, [deleteMedia]);

  useEffect(() => {
    if (!open) {
      setIsUploadDialogOpen(false);
    }
  }, [open]);

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

  const initialCustomBackground = useMemo<CustomBackground | undefined>(() => {
    if (
      appearance?.backgroundKey === "custom" &&
      appearance?.backgroundCustomUrl &&
      appearance?.backgroundCustomPublicId
    ) {
      return {
        url: appearance.backgroundCustomUrl,
        publicId: appearance.backgroundCustomPublicId,
      };
    }
    return undefined;
  }, [
    appearance?.backgroundKey,
    appearance?.backgroundCustomUrl,
    appearance?.backgroundCustomPublicId,
  ]);

  const [currentEmoji, setCurrentEmoji] = useState(initialEmoji);
  const [currentBackground, setCurrentBackground] =
    useState<ChatBackgroundSelection>(initialBackground);
  const [currentCustomBackground, setCurrentCustomBackground] = useState<
    CustomBackground | undefined
  >(initialCustomBackground);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [pendingUpload, setPendingUploadState] =
    useState<CustomBackground | undefined>();
  const pendingUploadRef = useRef<CustomBackground | undefined>(undefined);

  const setPendingUpload = useCallback((value?: CustomBackground) => {
    pendingUploadRef.current = value;
    setPendingUploadState(value);
  }, []);

  useEffect(() => {
    setCurrentEmoji(initialEmoji);
  }, [initialEmoji]);

  useEffect(() => {
    setCurrentBackground(initialBackground);
  }, [initialBackground]);

  useEffect(() => {
    if (!pendingUpload) {
      setCurrentCustomBackground(initialCustomBackground);
    }
  }, [initialCustomBackground, pendingUpload]);

  const maybeDeletePendingUpload = useCallback(async () => {
    const pending = pendingUploadRef.current;
    if (!pending) return;

    const mutation = deleteMediaRef.current;
    if (!mutation) return;

    try {
      await mutation.mutateAsync({
        publicId: pending.publicId,
        category: MediaCategory.ChatBackground,
        ...(chatType === "chatroom" ? {chatRoomId: chatId} : {}),
        suppressToast: true,
      });
    } catch {
      // ignore cleanup errors, surfaced via hook toast
    } finally {
      setPendingUpload(undefined);
    }
  }, [chatType, chatId, setPendingUpload]);

  useEffect(() => {
    return () => {
      const pending = pendingUploadRef.current;
      if (!pending) return;

      pendingUploadRef.current = undefined;
      const mutation = deleteMediaRef.current;
      if (!mutation) return;

      mutation
        .mutateAsync({
          publicId: pending.publicId,
          category: MediaCategory.ChatBackground,
          ...(chatType === "chatroom" ? {chatRoomId: chatId} : {}),
          suppressToast: true,
        })
        .catch(() => {
        });
    };
  }, [chatType, chatId]);

  const handleCustomBackgroundUpload = useCallback(
    async (file: File) => {
      if (!file) return;

      try {
        await maybeDeletePendingUpload();
        const uploadResult = await uploadMedia.mutateAsync({
          file,
          category: MediaCategory.ChatBackground,
          ...(chatType === "chatroom" ? {chatRoomId: chatId} : {}),
        });

        const uploaded: CustomBackground = {
          url: uploadResult.url,
          publicId: uploadResult.publicId,
        };

        setCurrentCustomBackground(uploaded);
        setPendingUpload(uploaded);
        setCurrentBackground("custom");
      } catch {
        // errors surfaced via useMedia toast
      }
    },
    [maybeDeletePendingUpload, uploadMedia, chatType, chatId]
  );

  const handleChooseCustomBackground = () => {
    setIsUploadDialogOpen(true);
  };

  const handleUploadDialogClose = () => {
    if (uploadMedia.isPending) {
      return;
    }
    setIsUploadDialogOpen(false);
  };

  const handleUploadDialogConfirm = useCallback(
    async (file: File) => {
      try {
        await handleCustomBackgroundUpload(file);
        setIsUploadDialogOpen(false);
      } catch {
        // errors surfaced via useMedia toast
      }
    },
    [handleCustomBackgroundUpload]
  );

  const handleUseSavedCustom = () => {
    if (initialCustomBackground) {
      setCurrentCustomBackground(initialCustomBackground);
      setCurrentBackground("custom");
    }
  };

  const handleRemoveCustom = useCallback(async () => {
    await maybeDeletePendingUpload();
    setCurrentCustomBackground(undefined);
    if (currentBackground === "custom") {
      setCurrentBackground(DEFAULT_CHAT_BACKGROUND_KEY);
    }
  }, [maybeDeletePendingUpload, currentBackground]);

  const handleBackgroundSelect = (backgroundKey: ChatBackgroundSelection) => {
    if (backgroundKey !== "custom") {
      if (pendingUpload) {
        maybeDeletePendingUpload().catch(() => {
        });
        setCurrentCustomBackground(initialCustomBackground);
      }
      setCurrentBackground(backgroundKey);
      return;
    }

    if (currentCustomBackground || initialCustomBackground) {
      setCurrentBackground("custom");
      if (!currentCustomBackground && initialCustomBackground) {
        setCurrentCustomBackground(initialCustomBackground);
      }
    } else {
      handleChooseCustomBackground();
    }
  };

  const handleEmojiSelect = (emoji: string) => {
    setCurrentEmoji(emoji);
  };

  const handleCancel = useCallback(async () => {
    await maybeDeletePendingUpload();
    setIsUploadDialogOpen(false);
    setCurrentEmoji(initialEmoji);
    setCurrentBackground(initialBackground);
    setCurrentCustomBackground(initialCustomBackground);
    onClose();
  }, [
    maybeDeletePendingUpload,
    initialEmoji,
    initialBackground,
    initialCustomBackground,
    onClose,
  ]);

  const isSaving = setAppearance.isPending;
  const isUploadingCustom = uploadMedia.isPending;

  const currentCustomPublicId = currentCustomBackground?.publicId ?? null;
  const initialCustomPublicId = initialCustomBackground?.publicId ?? null;

  const hasChanges =
    currentEmoji !== initialEmoji ||
    currentBackground !== initialBackground ||
    currentCustomPublicId !== initialCustomPublicId;

  const currentBackgroundStyle = getChatBackgroundStyle(
    currentBackground,
    currentBackground === "custom"
      ? currentCustomBackground?.url ?? null
      : undefined
  );

  const topPreviewStyle: Record<string, string | number> = {
    borderRadius: 8,
    height: 80,
    border: "1px solid",
    borderColor: "rgba(255,255,255,0.12)",
    ...currentBackgroundStyle,
  };

  if (
    currentBackground === DEFAULT_CHAT_BACKGROUND_KEY &&
    topPreviewStyle.backgroundColor === undefined
  ) {
    topPreviewStyle.backgroundColor = "rgba(255,255,255,0.04)";
  }

  const customPreviewStyle = currentCustomBackground
    ? getChatBackgroundStyle("custom", currentCustomBackground.url)
    : {backgroundColor: "rgba(255,255,255,0.04)"};

  const customPreviewSx: Record<string, string | number> = {
    borderRadius: 8,
    height: 64,
    border: "1px solid",
    borderColor:
      currentBackground === "custom"
        ? "primary.main"
        : "rgba(255,255,255,0.12)",
    position: "relative",
    overflow: "hidden",
    ...customPreviewStyle,
  };

  const handleSave = useCallback(async () => {
    if (!hasChanges) {
      onClose();
      return;
    }

    const payload: SetChatAppearanceRequest = {
      chatType: backendChatType,
      chatId,
    };

    if (currentEmoji !== initialEmoji) {
      payload.defaultEmoji = currentEmoji;
    }

    if (currentBackground !== initialBackground) {
      payload.backgroundKey = currentBackground;
    }

    if (currentBackground === "custom" && currentCustomBackground) {
      payload.backgroundKey = "custom";
      payload.backgroundCustomUrl = currentCustomBackground.url;
      payload.backgroundCustomPublicId = currentCustomBackground.publicId;
    }

    const customChanged =
      currentCustomPublicId !== initialCustomPublicId;

    if (
      customChanged &&
      currentBackground !== "custom" &&
      !payload.backgroundCustomUrl
    ) {
      payload.backgroundCustomUrl = null;
      payload.backgroundCustomPublicId = null;
    }

    try {
      await setAppearance.mutateAsync(payload);
      setPendingUpload(undefined);
      onClose();
    } catch {
      // errors surfaced via toast in mutation
    }
  }, [
    hasChanges,
    onClose,
    backendChatType,
    chatId,
    currentEmoji,
    initialEmoji,
    currentBackground,
    initialBackground,
    currentCustomBackground,
    currentCustomPublicId,
    initialCustomPublicId,
    setAppearance,
  ]);

  if (isLoading && !appearance && !isRefetching) {
    return (
      <Dialog open={open} onClose={handleCancel} maxWidth="sm" fullWidth>
        <DialogContent>
          <Box display="flex" justifyContent="center" alignItems="center" p={4}>
            <CircularProgress/>
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
            <Close/>
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{mb: 3}}>
          Choose the default emoji and background used in this{" "}
          {chatType === "chatroom"
            ? "chat room"
            : chatType === "encrypted"
              ? "encrypted direct chat"
              : "direct chat"}
          .
        </Typography>

        <Typography variant="subtitle2" gutterBottom>
          Popular emojis
        </Typography>
        <Grid container spacing={1} sx={{mb: 3}}>
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
        <Box display="flex" justifyContent="center" sx={{mb: 4}}>
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
              <Grid key={option.key} size={{xs: 12, sm: 6}}>
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
                  <Box sx={previewSx}/>
                  <Typography variant="subtitle2" sx={{mt: 1}}>
                    {option.label}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {option.description}
                  </Typography>
                </Paper>
              </Grid>
            );
          })}

          <Grid size={{xs: 12, sm: 6}}>
            <Paper
              variant="outlined"
              sx={{
                width: "100%",
                p: 2,
                backgroundColor: "rgba(255,255,255,0.02)",
                borderColor:
                  currentBackground === "custom" ? "primary.main" : "divider",
                boxShadow:
                  currentBackground === "custom"
                    ? "0 0 0 1px rgba(88,101,242,0.3)"
                    : "none",
                transition:
                  "border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease",
              }}
            >
              <Box sx={customPreviewSx}>
                {isUploadingCustom && (
                  <Box
                    sx={{
                      position: "absolute",
                      inset: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      backdropFilter: "blur(2px)",
                      backgroundColor: "rgba(0,0,0,0.35)",
                    }}
                  >
                    <CircularProgress size={24}/>
                  </Box>
                )}
              </Box>
              <Typography variant="subtitle2" sx={{mt: 1}}>
                Custom
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {currentCustomBackground
                  ? "Using your uploaded background."
                  : initialCustomBackground
                    ? "Restore your saved custom background or upload a new image."
                    : "Upload an image to personalize this chat."}
              </Typography>
              <Box display="flex" flexWrap="wrap" gap={1.5} sx={{mt: 2}}>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={handleChooseCustomBackground}
                  disabled={isUploadingCustom}
                >
                  {currentCustomBackground ? "Replace image" : "Upload image"}
                </Button>
                {initialCustomBackground &&
                  !currentCustomBackground && (
                    <Button
                      variant="text"
                      size="small"
                      onClick={handleUseSavedCustom}
                      disabled={isUploadingCustom}
                    >
                      Use saved background
                    </Button>
                  )}
                {currentCustomBackground && (
                  <Button
                    variant="text"
                    size="small"
                    color="error"
                    onClick={handleRemoveCustom}
                    disabled={isUploadingCustom}
                  >
                    Remove
                  </Button>
                )}
                {currentCustomBackground &&
                  currentBackground !== "custom" && (
                    <Button
                      variant="text"
                      size="small"
                      onClick={() => setCurrentBackground("custom")}
                      disabled={isUploadingCustom}
                    >
                      Use custom background
                    </Button>
                  )}
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleCancel} disabled={isSaving}>
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          disabled={isSaving || isUploadingCustom || !hasChanges}
        >
          {isSaving ? (
            <>
              <CircularProgress size={20} sx={{mr: 1}}/>
              Saving...
            </>
          ) : (
            "Save changes"
          )}
        </Button>
      </DialogActions>

      <CustomBackgroundUploadDialog
        open={isUploadDialogOpen}
        onClose={handleUploadDialogClose}
        onConfirm={handleUploadDialogConfirm}
        isUploading={isUploadingCustom}
      />
    </Dialog>
  );
}