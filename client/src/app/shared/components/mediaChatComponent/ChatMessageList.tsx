import { Box, Button, CircularProgress, Chip, Typography, IconButton, Paper } from "@mui/material";
import { ReplyOutlined } from "@mui/icons-material";
import { Link } from "react-router";
import { timeAgo } from "../../../../lib/util/util";
import MessageAvatarWithStatus from "../MessageAvatarWithStatus";
import MessageContentRenderer from "./MessageContentRenderer";
import type { BaseMessageStore } from "../../../../lib/types";

interface ChatMessageListProps {
  messageStore: BaseMessageStore;
  showUserProfiles?: boolean;
  onImageClick: (src: string) => void;
  onFileDownload: (url: string, filename: string) => void;
  loadMoreRef:
    | React.RefObject<HTMLDivElement>
    | ((node?: Element | null) => void);
  messagesEndRef?: React.RefObject<HTMLDivElement | null>;
  onReplyClick?: (messageId: string) => void;
  onJumpToMessage?: (messageId: string) => void;
}

export default function ChatMessageList({
  messageStore,
  showUserProfiles = true,
  onImageClick,
  onFileDownload,
  loadMoreRef,
  messagesEndRef,
  onReplyClick,
  onJumpToMessage,
}: ChatMessageListProps) {
  return (
    <>
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
        <Box key={message.id} id={`msg-${message.id}`} sx={{ display: "flex", mb: 2 }}>
          <MessageAvatarWithStatus
            userId={message.senderId || message.userId || ""}
            imageUrl={message.senderImageUrl || message.imageUrl}
            displayName={
              message.senderDisplayName || message.displayName || "Unknown"
            }
            showUserProfiles={showUserProfiles}
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
              {onReplyClick && (
                <IconButton
                  size="small"
                  sx={{ ml: "auto" }}
                  title="Reply"
                  onClick={() => onReplyClick(message.id)}
                >
                  <ReplyOutlined fontSize="small" />
                </IconButton>
              )}
            </Box>

            {/* Replied-to preview */}
            {message.replyToMessageId && (
              <Paper
                variant="outlined"
                sx={{ p: 1, mb: 1, bgcolor: "action.hover", cursor: onJumpToMessage ? "pointer" : "default" }}
                onClick={() => onJumpToMessage && onJumpToMessage(message.replyToMessageId!)}
              >
                <Typography variant="caption" sx={{ fontWeight: 700 }}>
                  Replying to {message.replyToDisplayName || "message"}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {message.replyToType && message.replyToType !== "Text"
                    ? `📎 ${message.replyToMediaOriginalFileName || message.replyToType}`
                    : message.replyToBody || ""}
                </Typography>
              </Paper>
            )}

            <MessageContentRenderer
              message={message}
              onImageClick={onImageClick}
              onFileDownload={onFileDownload}
            />
          </Box>
        </Box>
      ))}

      <div ref={messagesEndRef} />
    </>
  );
}
