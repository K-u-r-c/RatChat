import { Box, Typography } from "@mui/material";
import { useState, useEffect } from "react";
import { observer } from "mobx-react-lite";
import { useInView } from "react-intersection-observer";
import { type FieldValues } from "react-hook-form";
import type {
  MessageType,
  MediaUploadResult,
  BaseMessageStore,
} from "../../../../lib/types";
import DragOverlay from "./DragOverlay";
import ChatMessageList from "./chatMessageList/ChatMessageList";
import { FilePreview } from "./FilePreview";
import MultiFilePreview from "./MultiFilePreview";
import ChatInput from "./ChatInput";
import ImageViewerDialog from "./ImageViewerDialog";
import { useEmojiPreferences } from "../../../../lib/hooks/useEmojiPreferences";
import { useScrollHandler } from "../../../../lib/hooks/useScrollHandler";
import { useFileUpload } from "../../../../lib/hooks/useFileUpload";
import EmojiSettingsDialog from "../EmojiSettingsDialog";
import type { useChatRoomRolesRealtime } from "../../../../lib/hooks/useChatRoomRolesRealtime";
import { CHATROOM_PERMISSIONS } from "../../../../lib/types/chatroomPermissions";

const MAX_JUMP_ATTEMPTS = 1000;
const RETRY_DELAY_MS = 100;

interface MediaChatComponentProps {
  title: string;
  messageStore: BaseMessageStore;
  onSendMessage: (
    body: string,
    type?: MessageType,
    mediaData?: Partial<MediaUploadResult>,
    replyToMessageId?: string
  ) => Promise<void>;
  showUserProfiles?: boolean;
  chatRoomId?: string;
  directChatId?: string;
  userPermissions?: ReturnType<
    typeof useChatRoomRolesRealtime
  >["userPermissions"];
}

const MediaChatComponent = observer(function MediaChatComponent({
  title,
  messageStore,
  onSendMessage,
  showUserProfiles = true,
  chatRoomId,
  directChatId,
  userPermissions,
}: MediaChatComponentProps) {
  const [imageDialog, setImageDialog] = useState<{
    open: boolean;
    src: string | null;
  }>({
    open: false,
    src: null,
  });
  const [showEmojiSettings, setShowEmojiSettings] = useState(false);
  const [replyToMessageId, setReplyToMessageId] = useState<string | undefined>(
    undefined
  );
  const [replyPreview, setReplyPreview] = useState<
    | {
        displayName?: string;
        body?: string;
        type?: MessageType;
        mediaOriginalFileName?: string;
      }
    | undefined
  >(undefined);

  const chatType = chatRoomId ? "ChatRoom" : "DirectChat";
  const chatId = chatRoomId || directChatId || "";
  const { useEmojiPreference } = useEmojiPreferences();
  const { data: emojiPreference } = useEmojiPreference(chatType, chatId);
  const defaultEmoji = emojiPreference?.defaultEmoji || "👍";

  const scrollHandler = useScrollHandler({ messageStore });
  const fileUpload = useFileUpload({
    chatRoomId,
    onUpload: async (body, type, mediaData) =>
      onSendMessage(body, type, mediaData, replyToMessageId),
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

      if (fileUpload.selectedItems && fileUpload.selectedItems.length > 0) {
        await fileUpload.uploadSelectedFiles(data.body);
        return;
      }

      const trimmedBody = data.body?.trimEnd();
      if (trimmedBody) {
        await onSendMessage(trimmedBody, "Text", undefined, replyToMessageId);
      }
    } catch (error) {
      if (import.meta.env.DEV) console.error("Send message error:", error);
    } finally {
      scrollHandler.scrollToBottom();
      setReplyToMessageId(undefined);
      setReplyPreview(undefined);
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
      } else if (fileUpload.selectedItems.length > 0) {
        fileUpload.clearSelectedFiles();
      }
    }
  };

  const hasFileAttached = !!(
    fileUpload.pendingPaste.file ||
    (fileUpload.selectedItems && fileUpload.selectedItems.length > 0)
  );

  const handleReplyClick = (messageId: string) => {
    const msg = messageStore.messages.find((m) => m.id === messageId);
    if (!msg) return;
    setReplyToMessageId(msg.id);
    setReplyPreview({
      displayName: msg.senderDisplayName || msg.displayName,
      body: msg.body,
      type: msg.type,
      mediaOriginalFileName: msg.mediaOriginalFileName,
    });
  };

  const handleJumpToMessage = async (messageId: string) => {
    const highlight = (el: HTMLElement) => {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.animate(
        [
          { backgroundColor: "transparent" },
          { backgroundColor: "rgba(255, 235, 59, 0.3)" },
          { backgroundColor: "transparent" },
        ],
        { duration: 1200 }
      );
    };

    for (let attempts = 0; attempts < MAX_JUMP_ATTEMPTS; attempts++) {
      const el = document.getElementById(
        `msg-${messageId}`
      ) as HTMLElement | null;
      if (el) {
        highlight(el);
        return;
      }

      if (!messageStore.hasOlderMessages) break;

      if (!messageStore.isLoadingOlder) {
        const container = scrollHandler.messagesContainerRef.current;
        if (container) {
          scrollHandler.previousScrollHeight.current = container.scrollHeight;
        }
        messageStore.loadOlderMessages();
      }

      await new Promise((res) => setTimeout(res, RETRY_DELAY_MS));
    }
  };

  return (
    <div
      {...fileUpload.dropzoneProps}
      style={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        minHeight: 0,
      }}
    >
      <input {...fileUpload.inputProps} />

      {/* Drag overlay */}
      <DragOverlay isDragActive={fileUpload.isDragActive} />

      <Box
        sx={{
          height: "100%",
          display: "flex",
          flexDirection: "column",
          minHeight: 0,
        }}
      >
        <Box
          sx={{
            flex: 1,
            minHeight: 0,
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* Messages container */}
          <Box
            ref={scrollHandler.messagesContainerRef}
            sx={{
              display: "flex",
              flexDirection: "column",
              overflowY: "auto",
              flex: 1,
              minHeight: 0,
            }}
            className="rc-scroll"
            onScroll={scrollHandler.handleScroll}
          >
            <ChatMessageList
              messageStore={messageStore}
              showUserProfiles={showUserProfiles}
              onImageClick={handleImageClick}
              onFileDownload={handleFileDownload}
              loadMoreRef={loadMoreRef}
              messagesEndRef={scrollHandler.messagesEndRef}
              onReplyClick={handleReplyClick}
              onJumpToMessage={handleJumpToMessage}
              chatRoomId={chatRoomId}
              directChatId={directChatId}
              defaultEmoji={defaultEmoji}
            />
          </Box>

          {/* Message input area (non-scrollable, grows with content) */}
          <Box sx={{ borderTop: "1px solid", borderColor: "divider" }}>
            {/* Reply context */}
            {replyToMessageId && (
              <Box sx={{ bgcolor: "action.hover" }}>
                <Box>
                  <Box display="flex" alignItems="center" gap={1}>
                    <Typography variant="caption" sx={{ fontWeight: 700 }}>
                      Replying to {replyPreview?.displayName}
                    </Typography>
                    <Box flexGrow={1} />
                    <Box
                      component="button"
                      onClick={() => {
                        setReplyToMessageId(undefined);
                        setReplyPreview(undefined);
                      }}
                      sx={{
                        border: "none",
                        background: "transparent",
                        cursor: "pointer",
                        color: "text.secondary",
                        fontSize: 12,
                      }}
                    >
                      cancel
                    </Box>
                  </Box>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {replyPreview?.type && replyPreview.type !== "Text"
                      ? `📎 ${
                          replyPreview?.mediaOriginalFileName ||
                          replyPreview?.type
                        }`
                      : replyPreview?.body}
                  </Typography>
                </Box>
              </Box>
            )}
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

            {fileUpload.selectedItems &&
              fileUpload.selectedItems.length > 0 && (
                <MultiFilePreview
                  items={fileUpload.selectedItems}
                  totalSize={fileUpload.totalSelectedSize}
                  maxTotalSize={fileUpload.MAX_TOTAL_SIZE}
                  onRemove={(id) => fileUpload.removeSelectedItem(id)}
                  onClearAll={fileUpload.clearSelectedFiles}
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
                hasAttachment={hasFileAttached}
                hasPermission={
                  chatRoomId === undefined
                    ? true
                    : userPermissions &&
                      userPermissions[CHATROOM_PERMISSIONS.SendMessages]
                    ? true
                    : false
                }
                placeholder={
                  hasFileAttached
                    ? "Add a message with your file (optional)..."
                    : "Enter your message ..."
                }
              />
            </div>
          </Box>
        </Box>
      </Box>

      {/* Hidden file input */}
      <input
        ref={fileUpload.fileInputRef}
        type="file"
        hidden
        multiple
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
