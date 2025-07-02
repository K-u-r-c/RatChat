import { Card, CardContent, Box } from "@mui/material";
import { useState, useEffect } from "react";
import { observer } from "mobx-react-lite";
import { useInView } from "react-intersection-observer";
import { type FieldValues } from "react-hook-form";
import type {
  MessageType,
  MediaUploadResult,
  BaseMessageStore,
} from "../../../../lib/types";
import ChatHeader from "./ChatHeader";
import DragOverlay from "./DragOverlay";
import ChatMessageList from "./ChatMessageList";
import { FilePreview } from "./FilePreview";
import ChatInput from "./ChatInput";
import ImageViewerDialog from "./ImageViewerDialog";
import { useEmojiPreferences } from "../../../../lib/hooks/useEmojiPreferences";
import { useScrollHandler } from "../../../../lib/hooks/useScrollHandler";
import { useFileUpload } from "../../../../lib/hooks/useFileUpload";
import EmojiSettingsDialog from "../EmojiSettingsDialog";

interface MediaChatComponentProps {
  title: string;
  messageStore: BaseMessageStore;
  onSendMessage: (
    body: string,
    type?: MessageType,
    mediaData?: Partial<MediaUploadResult>
  ) => Promise<void>;
  showUserProfiles?: boolean;
  chatRoomId?: string;
  directChatId?: string;
}

const MediaChatComponent = observer(function MediaChatComponent({
  title,
  messageStore,
  onSendMessage,
  showUserProfiles = true,
  chatRoomId,
  directChatId,
}: MediaChatComponentProps) {
  const [imageDialog, setImageDialog] = useState<{
    open: boolean;
    src: string | null;
  }>({
    open: false,
    src: null,
  });
  const [showEmojiSettings, setShowEmojiSettings] = useState(false);

  const chatType = chatRoomId ? "ChatRoom" : "DirectChat";
  const chatId = chatRoomId || directChatId || "";
  const { useEmojiPreference } = useEmojiPreferences();
  const { data: emojiPreference } = useEmojiPreference(chatType, chatId);
  const defaultEmoji = emojiPreference?.defaultEmoji || "👍";

  const scrollHandler = useScrollHandler({ messageStore });
  const fileUpload = useFileUpload({
    chatRoomId,
    onUpload: onSendMessage,
    onReset: () => {}, // Will be called from handleSubmit
  });

  const { ref: loadMoreRef, inView } = useInView({
    threshold: 0.1,
    rootMargin: "100px 0px 0px 0px",
  });

  useEffect(() => {
    if (
      inView &&
      messageStore.hasOlderMessages &&
      !messageStore.isLoadingOlder
    ) {
      const container = scrollHandler.messagesContainerRef.current;
      if (container) {
        scrollHandler.previousScrollHeight.current = container.scrollHeight;
      }
      messageStore.loadOlderMessages();
    }
  }, [inView, messageStore, scrollHandler]);

  const handleSubmit = async (data: FieldValues) => {
    try {
      if (fileUpload.pendingPaste.file) {
        await fileUpload.uploadPendingPaste(data.body);
        return;
      }

      if (fileUpload.selectedFile) {
        await fileUpload.uploadSelectedFile(data.body);
        return;
      }

      const trimmedBody = data.body?.trimEnd();
      if (trimmedBody) {
        await onSendMessage(trimmedBody);
      }
    } catch (error) {
      console.error("Send message error:", error);
    } finally {
      scrollHandler.scrollToBottom();
    }
  };

  const handleImageClick = (src: string) => {
    setImageDialog({ open: true, src });
  };

  const handleFileDownload = (url: string, filename: string) => {
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.target = "_blank";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleKeyPress = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape") {
      event.preventDefault();
      if (fileUpload.pendingPaste.file) {
        fileUpload.clearPendingPaste();
      } else if (fileUpload.selectedFile) {
        fileUpload.clearSelectedFile();
      }
    }
  };

  const hasFileAttached = !!(
    fileUpload.pendingPaste.file || fileUpload.selectedFile
  );

  return (
    <div {...fileUpload.dropzoneProps}>
      <input {...fileUpload.inputProps} />

      {/* Header */}
      <ChatHeader
        title={title}
        isAtBottom={scrollHandler.isAtBottom}
        newMessageCount={scrollHandler.newMessageCount}
        onScrollToBottom={scrollHandler.scrollToBottom}
        onEmojiSettingsOpen={() => setShowEmojiSettings(true)}
      />

      {/* Drag overlay */}
      <DragOverlay isDragActive={fileUpload.isDragActive} />

      <Card>
        <CardContent sx={{ p: 0 }}>
          {/* Messages container */}
          <Box
            ref={scrollHandler.messagesContainerRef}
            sx={{
              height: 600,
              overflow: "auto",
              display: "flex",
              flexDirection: "column",
              p: 2,
            }}
            onScroll={scrollHandler.handleScroll}
          >
            <ChatMessageList
              messageStore={messageStore}
              showUserProfiles={showUserProfiles}
              onImageClick={handleImageClick}
              onFileDownload={handleFileDownload}
              loadMoreRef={loadMoreRef}
              messagesEndRef={scrollHandler.messagesEndRef}
            />
          </Box>

          {/* Message input area */}
          <Box sx={{ p: 2, borderTop: "1px solid", borderColor: "divider" }}>
            {/* File previews */}
            {fileUpload.pendingPaste.file &&
              fileUpload.pendingPaste.preview && (
                <FilePreview
                  file={fileUpload.pendingPaste.file}
                  preview={fileUpload.pendingPaste.preview}
                  onRemove={fileUpload.clearPendingPaste}
                  type="pasted"
                />
              )}

            {fileUpload.selectedFile && fileUpload.mediaPreview && (
              <FilePreview
                file={fileUpload.selectedFile}
                preview={fileUpload.mediaPreview}
                onRemove={fileUpload.clearSelectedFile}
                type="selected"
              />
            )}

            {/* Input form */}
            <div onKeyDown={handleKeyPress}>
              <ChatInput
                onSubmit={handleSubmit}
                onFileSelect={fileUpload.handleFileSelect}
                defaultEmoji={defaultEmoji}
                isSubmitting={false}
                isUploading={fileUpload.isUploading}
                hasFileAttached={hasFileAttached}
                placeholder={
                  hasFileAttached
                    ? "Add a message with your file (optional)..."
                    : "Enter your message (Enter to submit, Ctrl+V to paste images, SHIFT + Enter for new line)"
                }
              />
            </div>
          </Box>
        </CardContent>
      </Card>

      {/* Hidden file input */}
      <input
        ref={fileUpload.fileInputRef}
        type="file"
        hidden
        accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt,.md,.js,.ts,.py,.java,.cs,.cpp,.c,.h,.php,.rb,.go,.rs,.swift,.kt,.scala,.yml,.yaml,.json,.xml,.html,.css,.sql,.sh,.bat,.ps1,.zip,.rar,.7z,.gz,.tar"
        onChange={fileUpload.handleFileChange}
      />

      {/* Dialogs */}
      <ImageViewerDialog
        open={imageDialog.open}
        imageSrc={imageDialog.src}
        onClose={() => setImageDialog({ open: false, src: null })}
      />

      <EmojiSettingsDialog
        open={showEmojiSettings}
        onClose={() => setShowEmojiSettings(false)}
        chatType={chatRoomId ? "chatroom" : "direct"}
        chatId={chatId}
        chatName={title}
      />
    </div>
  );
});

export default MediaChatComponent;
