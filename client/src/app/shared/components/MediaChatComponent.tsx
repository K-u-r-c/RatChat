import {
  Box,
  Typography,
  Card,
  CardContent,
  TextField,
  Avatar,
  CircularProgress,
  Button,
  IconButton,
  Dialog,
  DialogContent,
  DialogTitle,
  DialogActions,
  Paper,
  Chip,
} from "@mui/material";
import {
  AttachFile,
  InsertDriveFile,
  Download,
  Close,
  Send,
} from "@mui/icons-material";
import { Link } from "react-router";
import { timeAgo } from "../../../lib/util/util";
import { type FieldValues, useForm } from "react-hook-form";
import { observer } from "mobx-react-lite";
import { useInView } from "react-intersection-observer";
import { useEffect, useRef, useState } from "react";
import { useDropzone } from "react-dropzone";
import { useMedia, MediaCategory } from "../../../lib/hooks/useMedia";
import type { MessageType, MediaUploadResult } from "../../../lib/types";
import { toast } from "react-toastify";

type BaseMessage = {
  id: string;
  createdAt: Date;
  body: string;
  type: MessageType;
  senderId?: string;
  senderDisplayName?: string;
  senderImageUrl?: string;
  displayName?: string;
  userId?: string;
  imageUrl?: string;
  mediaUrl?: string;
  mediaPublicId?: string;
  mediaType?: string;
  mediaFileSize?: number;
  mediaOriginalFileName?: string;
};

type BaseMessageStore = {
  messages: BaseMessage[];
  hasOlderMessages: boolean;
  isLoadingOlder: boolean;
  loadOlderMessages: () => void;
  hubConnection: unknown;
};

type Props = {
  title: string;
  messageStore: BaseMessageStore;
  onSendMessage: (
    body: string,
    type?: MessageType,
    mediaData?: Partial<MediaUploadResult>
  ) => Promise<void>;
  showUserProfiles?: boolean;
  chatRoomId?: string;
};

const MediaChatComponent = observer(function MediaChatComponent({
  title,
  messageStore,
  onSendMessage,
  showUserProfiles = true,
  chatRoomId,
}: Props) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const previousScrollHeight = useRef<number>(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isAtBottom, setIsAtBottom] = useState(true);
  const [newMessageCount, setNewMessageCount] = useState(0);
  const [showMediaDialog, setShowMediaDialog] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [imageDialog, setImageDialog] = useState<{
    open: boolean;
    src: string | null;
  }>({
    open: false,
    src: "",
  });
  const [pendingPaste, setPendingPaste] = useState<{
    file: File | null;
    preview: string | null;
  }>({
    file: null,
    preview: null,
  });

  const { uploadMedia } = useMedia();

  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm();

  const { ref: loadMoreRef, inView } = useInView({
    threshold: 0.1,
    rootMargin: "100px 0px 0px 0px",
  });

  useEffect(() => {
    const handlePaste = async (event: ClipboardEvent) => {
      const items = event.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        const item = items[i];

        if (item.type.indexOf("image") !== -1) {
          event.preventDefault();
          const file = item.getAsFile();

          if (file) {
            const previewUrl = URL.createObjectURL(file);
            setPendingPaste({ file, preview: previewUrl });
          }
          break;
        }
      }
    };

    document.addEventListener("paste", handlePaste);

    return () => {
      document.removeEventListener("paste", handlePaste);
    };
  }, []);

  const clearPendingPaste = () => {
    if (pendingPaste.preview) {
      URL.revokeObjectURL(pendingPaste.preview);
    }
    setPendingPaste({ file: null, preview: null });
  };

  const sendPendingPaste = async (additionalText?: string) => {
    const file = pendingPaste.file;
    if (!file) return;

    try {
      const category = getMediaCategory(file);
      const messageType = getMessageType(file);

      const uploadResult = await uploadMedia.mutateAsync({
        file,
        category,
        ...(chatRoomId && { chatRoomId }),
      });

      const messageBody = additionalText?.trim() || file.name || "Pasted image";

      await onSendMessage(messageBody, messageType, {
        url: uploadResult.url,
        publicId: uploadResult.publicId,
        mediaType: uploadResult.mediaType,
        fileSize: uploadResult.fileSize,
        originalFileName: uploadResult.originalFileName,
      });

      clearPendingPaste();
      reset();
    } catch (error) {
      console.error("Paste upload failed:", error);
      toast.error("Failed to upload pasted image");
      clearPendingPaste();
    }
  };

  const onDrop = (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      setSelectedFile(file);
      const preview = URL.createObjectURL(file);
      setMediaPreview(preview);
      setShowMediaDialog(true);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".jpeg", ".jpg", ".png", ".gif", ".webp"],
      "video/*": [".mp4", ".avi", ".mov", ".wmv"],
      "application/*": [".pdf", ".doc", ".docx", ".txt"],
    },
    maxFiles: 1,
    maxSize: 100 * 1024 * 1024, // 100MB
    noClick: true,
  });

  const getMediaCategory = (file: File): MediaCategory => {
    if (file.type.startsWith("image/")) return MediaCategory.ChatRoomImage;
    if (file.type.startsWith("video/")) return MediaCategory.ChatRoomVideo;
    if (file.type.startsWith("audio/")) return MediaCategory.ChatRoomAudio;
    if (
      file.type.includes("pdf") ||
      file.type.includes("document") ||
      file.type.includes("text")
    ) {
      return MediaCategory.ChatRoomDocument;
    }
    return MediaCategory.ChatRoomOther;
  };

  const getMessageType = (file: File): MessageType => {
    if (file.type.startsWith("image/")) return "Image";
    if (file.type.startsWith("video/")) return "Video";
    if (file.type.startsWith("audio/")) return "Audio";
    return "Document";
  };

  const handleMediaUpload = async () => {
    if (!selectedFile) return;

    try {
      const category = getMediaCategory(selectedFile);
      const messageType = getMessageType(selectedFile);

      const uploadResult = await uploadMedia.mutateAsync({
        file: selectedFile,
        category,
        ...(chatRoomId && { chatRoomId }),
      });

      await onSendMessage(selectedFile.name, messageType, {
        url: uploadResult.url,
        publicId: uploadResult.publicId,
        mediaType: uploadResult.mediaType,
        fileSize: uploadResult.fileSize,
        originalFileName: uploadResult.originalFileName,
      });

      handleMediaDialogClose();
    } catch (error) {
      console.error("Media upload failed:", error);
      toast.error("Failed to upload media");
    }
  };

  const handleMediaDialogClose = () => {
    setShowMediaDialog(false);
    setSelectedFile(null);
    if (mediaPreview) {
      URL.revokeObjectURL(mediaPreview);
      setMediaPreview(null);
    }
  };

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onDrop([file]);
    }
  };

  const downloadFile = (url: string, filename: string) => {
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.target = "_blank";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const renderMediaContent = (message: BaseMessage) => {
    if (message.type === "Text" || !message.mediaUrl) {
      return (
        <Typography sx={{ whiteSpace: "pre-wrap" }}>{message.body}</Typography>
      );
    }

    const commonProps = {
      sx: { maxWidth: "100%", borderRadius: 2, mt: 1 },
    };

    switch (message.type) {
      case "Image":
        return (
          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              📷 {message.mediaOriginalFileName}
            </Typography>
            <img
              {...commonProps}
              src={message.mediaUrl}
              alt={message.mediaOriginalFileName || "Image"}
              style={{ maxHeight: 300, cursor: "pointer" }}
              onClick={() =>
                setImageDialog({ open: true, src: message.mediaUrl! })
              }
            />
          </Box>
        );

      case "Video":
        return (
          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              🎥 {message.mediaOriginalFileName}
            </Typography>
            <video
              {...commonProps}
              controls
              style={{ maxHeight: 300 }}
              src={message.mediaUrl}
            >
              Your browser does not support the video tag.
            </video>
          </Box>
        );

      case "Audio":
        return (
          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              🎵 {message.mediaOriginalFileName}
            </Typography>
            <audio {...commonProps} controls src={message.mediaUrl}>
              Your browser does not support the audio tag.
            </audio>
          </Box>
        );

      case "Document":
        return (
          <Paper
            sx={{
              p: 2,
              mt: 1,
              display: "flex",
              alignItems: "center",
              gap: 2,
              cursor: "pointer",
              "&:hover": { backgroundColor: "action.hover" },
            }}
            onClick={() =>
              downloadFile(message.mediaUrl!, message.mediaOriginalFileName!)
            }
          >
            <InsertDriveFile color="primary" />
            <Box sx={{ flex: 1 }}>
              <Typography variant="body2" fontWeight="bold">
                {message.mediaOriginalFileName}
              </Typography>
              {message.mediaFileSize && (
                <Typography variant="caption" color="text.secondary">
                  {formatFileSize(message.mediaFileSize)}
                </Typography>
              )}
            </Box>
            <IconButton size="small" color="primary">
              <Download />
            </IconButton>
          </Paper>
        );

      default:
        return (
          <Typography sx={{ whiteSpace: "pre-wrap" }}>
            {message.body}
          </Typography>
        );
    }
  };

  useEffect(() => {
    if (
      inView &&
      messageStore.hasOlderMessages &&
      !messageStore.isLoadingOlder
    ) {
      const container = messagesContainerRef.current;
      if (container) {
        previousScrollHeight.current = container.scrollHeight;
      }
      messageStore.loadOlderMessages();
    }
  }, [inView, messageStore]);

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (
      container &&
      messageStore.isLoadingOlder === false &&
      previousScrollHeight.current > 0
    ) {
      const newScrollHeight = container.scrollHeight;
      const scrollDiff = newScrollHeight - previousScrollHeight.current;
      container.scrollTop = container.scrollTop + scrollDiff;
      previousScrollHeight.current = 0;
    }
  }, [messageStore.isLoadingOlder]);

  const prevMessageCount = useRef(messageStore.messages.length);
  const prevFirstMessageId = useRef(messageStore.messages[0]?.id);

  useEffect(() => {
    const currentMessageCount = messageStore.messages.length;
    const newMessages = currentMessageCount - prevMessageCount.current;
    const currentFirstMessageId = messageStore.messages[0]?.id;

    if (
      prevFirstMessageId.current !== undefined &&
      prevFirstMessageId.current !== currentFirstMessageId
    ) {
      prevMessageCount.current = currentMessageCount;
      prevFirstMessageId.current = currentFirstMessageId;
      return;
    }

    if (!messageStore.isLoadingOlder && newMessages > 0) {
      if (isAtBottom) {
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 100);
        setNewMessageCount(0);
      } else {
        setNewMessageCount((prev) => prev + newMessages);
      }
    }

    prevMessageCount.current = currentMessageCount;
    prevFirstMessageId.current = currentFirstMessageId;
  }, [
    messageStore.messages.length,
    isAtBottom,
    messageStore.isLoadingOlder,
    messageStore.messages,
  ]);

  useEffect(() => {
    if (messageStore.messages.length > 0 && prevMessageCount.current === 0) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "auto" });
      }, 100);
    }
  }, [messageStore.messages.length]);

  const handleScroll = (event: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = event.currentTarget;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
    const wasAtBottom = isAtBottom;
    const nowAtBottom = distanceFromBottom < 50;

    setIsAtBottom(nowAtBottom);

    if (nowAtBottom && !wasAtBottom) {
      setNewMessageCount(0);
    }
  };

  const addMessage = async (data: FieldValues) => {
    try {
      if (pendingPaste.file) {
        await sendPendingPaste(data.body);
        return;
      }

      const trimmedBody = data.body?.trimEnd();
      if (trimmedBody) {
        await onSendMessage(trimmedBody);
      }
    } catch (error) {
      console.log(error);
    } finally {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      reset();
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSubmit(addMessage)();
    } else if (event.key === "Escape" && pendingPaste.file) {
      event.preventDefault();
      clearPendingPaste();
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    setIsAtBottom(true);
    setNewMessageCount(0);
  };

  return (
    <div {...getRootProps()}>
      <input {...getInputProps()} />

      {/* Header */}
      <Box
        sx={{
          textAlign: "center",
          bgcolor: "primary.main",
          color: "white",
          padding: 2,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Typography variant="h6">{title}</Typography>
        {!isAtBottom && (
          <Button
            onClick={scrollToBottom}
            variant="contained"
            size="small"
            sx={{
              backgroundColor: "rgba(255,255,255,0.2)",
              "&:hover": { backgroundColor: "rgba(255,255,255,0.3)" },
              position: "relative",
            }}
          >
            {newMessageCount > 0 && (
              <Box
                sx={{
                  position: "absolute",
                  top: -8,
                  right: -8,
                  backgroundColor: "error.main",
                  color: "white",
                  borderRadius: "50%",
                  width: 20,
                  height: 20,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "0.75rem",
                  fontWeight: "bold",
                }}
              >
                {newMessageCount}
              </Box>
            )}
            ↓ New messages
          </Button>
        )}
      </Box>

      {/* Drag overlay */}
      {isDragActive && (
        <Box
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.7)",
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "white",
          }}
        >
          <Box textAlign="center">
            <AttachFile sx={{ fontSize: 64, mb: 2 }} />
            <Typography variant="h5">Drop files here to upload</Typography>
          </Box>
        </Box>
      )}

      <Card>
        <CardContent sx={{ p: 0 }}>
          <Box
            ref={messagesContainerRef}
            sx={{
              height: 600,
              overflow: "auto",
              display: "flex",
              flexDirection: "column",
              p: 2,
            }}
            onScroll={handleScroll}
          >
            {/* Load older messages indicator */}
            {messageStore.hasOlderMessages && (
              <Box
                ref={loadMoreRef}
                sx={{
                  display: "flex",
                  justifyContent: "center",
                  p: 2,
                  borderBottom: "1px solid",
                  borderColor: "divider",
                  mb: 2,
                }}
              >
                {messageStore.isLoadingOlder ? (
                  <CircularProgress size={24} />
                ) : (
                  <Button
                    onClick={() => messageStore.loadOlderMessages()}
                    variant="outlined"
                    size="small"
                  >
                    Load older messages
                  </Button>
                )}
              </Box>
            )}

            {/* Messages list */}
            {messageStore.messages.map((message) => (
              <Box key={message.id} sx={{ display: "flex", mb: 2 }}>
                <Avatar
                  src={message.senderImageUrl || message.imageUrl}
                  alt={"user image"}
                  sx={{ mr: 2 }}
                />
                <Box display="flex" flexDirection="column" sx={{ flex: 1 }}>
                  <Box display="flex" alignItems="center" gap={3}>
                    <Typography
                      component={showUserProfiles ? Link : "span"}
                      to={
                        showUserProfiles
                          ? `/profiles/${message.senderId || message.userId}`
                          : undefined
                      }
                      variant="subtitle1"
                      sx={{ fontWeight: "bold", textDecoration: "none" }}
                    >
                      {message.senderDisplayName || message.displayName}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      {timeAgo(message.createdAt)}
                    </Typography>
                    {message.type !== "Text" && (
                      <Chip
                        size="small"
                        label={message.type}
                        color="primary"
                        variant="outlined"
                      />
                    )}
                  </Box>

                  {renderMediaContent(message)}
                </Box>
              </Box>
            ))}

            <div ref={messagesEndRef} />
          </Box>

          {/* Message input */}
          <Box sx={{ p: 2, borderTop: "1px solid", borderColor: "divider" }}>
            {/* Paste preview area */}
            {pendingPaste.file && pendingPaste.preview && (
              <Box
                sx={{
                  mb: 2,
                  p: 2,
                  border: "2px solid",
                  borderColor: "primary.main",
                  borderRadius: 2,
                  backgroundColor: "background.paper",
                  display: "flex",
                  alignItems: "center",
                  gap: 2,
                }}
              >
                <img
                  src={pendingPaste.preview}
                  alt="Pasted image preview"
                  style={{
                    width: 60,
                    height: 60,
                    objectFit: "cover",
                    borderRadius: 8,
                  }}
                />
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body2" fontWeight="bold">
                    📷 Image ready to send
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {formatFileSize(pendingPaste.file.size)} • Add text below or
                    press Enter to send
                  </Typography>
                </Box>
                <IconButton
                  onClick={clearPendingPaste}
                  size="small"
                  color="error"
                  title="Remove image"
                >
                  <Close />
                </IconButton>
              </Box>
            )}

            <Box sx={{ display: "flex", gap: 1, alignItems: "flex-end" }}>
              <TextField
                {...register("body")}
                variant="outlined"
                fullWidth
                multiline
                rows={2}
                placeholder={
                  pendingPaste.file
                    ? "Add a message with your image (optional)..."
                    : "Enter your message (Enter to submit, Ctrl+V to paste images, SHIFT + Enter for new line)"
                }
                onKeyDown={handleKeyPress}
                slotProps={{
                  input: {
                    endAdornment:
                      isSubmitting || uploadMedia.isPending ? (
                        <CircularProgress size={24} />
                      ) : null,
                  },
                }}
              />
              <IconButton
                onClick={handleFileSelect}
                color="primary"
                sx={{ mb: 0.5 }}
                title="Attach file"
                disabled={!!pendingPaste.file}
              >
                <AttachFile />
              </IconButton>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        hidden
        accept="image/*,video/*,.pdf,.doc,.docx,.txt"
        onChange={handleFileChange}
      />

      {/* Media upload dialog */}
      <Dialog
        open={showMediaDialog}
        onClose={handleMediaDialogClose}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Upload Media
          <IconButton
            onClick={handleMediaDialogClose}
            sx={{ position: "absolute", right: 8, top: 8 }}
          >
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {selectedFile && (
            <Box>
              <Typography variant="h6" gutterBottom>
                {selectedFile.name}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Size: {formatFileSize(selectedFile.size)}
              </Typography>

              {mediaPreview && selectedFile.type.startsWith("image/") && (
                <Box sx={{ mt: 2, textAlign: "center" }}>
                  <img
                    src={mediaPreview}
                    alt="Preview"
                    style={{
                      maxWidth: "100%",
                      maxHeight: 300,
                      borderRadius: 8,
                    }}
                  />
                </Box>
              )}

              {selectedFile.type.startsWith("video/") && mediaPreview && (
                <Box sx={{ mt: 2, textAlign: "center" }}>
                  <video
                    src={mediaPreview}
                    controls
                    style={{
                      maxWidth: "100%",
                      maxHeight: 300,
                      borderRadius: 8,
                    }}
                  />
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleMediaDialogClose}>Cancel</Button>
          <Button
            onClick={handleMediaUpload}
            variant="contained"
            disabled={uploadMedia.isPending}
            startIcon={
              uploadMedia.isPending ? <CircularProgress size={20} /> : <Send />
            }
          >
            Upload & Send
          </Button>
        </DialogActions>
      </Dialog>

      {/* Image viewer dialog */}
      <Dialog
        open={imageDialog.open}
        onClose={() => setImageDialog({ open: false, src: null })}
        maxWidth="lg"
        fullWidth
      >
        <DialogContent sx={{ p: 0 }}>
          <img
            src={imageDialog.src ?? undefined}
            alt="Full size"
            style={{ width: "100%", height: "auto" }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
});

export default MediaChatComponent;
