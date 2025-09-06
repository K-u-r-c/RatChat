import {
  Box,
  Button,
  CircularProgress,
  Chip,
  Typography,
  IconButton,
  Paper,
} from "@mui/material";
import { ReplyOutlined } from "@mui/icons-material";
import { Link } from "react-router";
import { timeAgo } from "../../../../lib/util/util";
import MessageAvatarWithStatus from "../MessageAvatarWithStatus";
import MessageContentRenderer from "./MessageContentRenderer";
import GroupedMediaMessage from "./GroupedMediaMessage";
import type { BaseMessage, BaseMessageStore } from "../../../../lib/types";

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
  type RenderItem =
    | { kind: "single"; message: BaseMessage }
    | { kind: "group"; type: "Image" | "Video"; messages: BaseMessage[] };

  const buildRenderItems = (): RenderItem[] => {
    const items: RenderItem[] = [];
    const msgs = messageStore.messages;
    const timeWindowMs = 15 * 1000;

    let i = 0;
    while (i < msgs.length) {
      const m = msgs[i];
      if (m.type === "Image" || m.type === "Video") {
        const sender = m.senderId || m.userId;
        const t0 = new Date(m.createdAt).getTime();
        const groupType = m.type;
        const group: BaseMessage[] = [m];
        let j = i + 1;
        while (j < msgs.length) {
          const n = msgs[j];
          if (n.type === groupType && (n.senderId || n.userId) === sender) {
            const tj = new Date(n.createdAt).getTime();
            if (Math.abs(tj - t0) <= timeWindowMs) {
              group.push(n);
              j++;
              continue;
            }
          }
          break;
        }
        if (group.length > 1) {
          items.push({ kind: "group", type: groupType, messages: group });
          i = j;
          continue;
        }
        items.push({ kind: "single", message: m });
        i++;
      } else {
        items.push({ kind: "single", message: m });
        i++;
      }
    }
    return items;
  };

  const renderItems = buildRenderItems();

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
      {renderItems.map((item, idx) => {
        if (item.kind === "single") {
          const message = item.message;
          return (
            <Box
              key={message.id}
              id={`msg-${message.id}`}
              sx={{ display: "flex", mb: 2 }}
            >
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
                    sx={{
                      p: 1,
                      mb: 1,
                      bgcolor: "action.hover",
                      cursor: onJumpToMessage ? "pointer" : "default",
                    }}
                    onClick={() =>
                      onJumpToMessage &&
                      onJumpToMessage(message.replyToMessageId!)
                    }
                  >
                    <Typography variant="caption" sx={{ fontWeight: 700 }}>
                      Replying to {message.replyToDisplayName || "message"}
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {message.replyToType && message.replyToType !== "Text"
                        ? `Ы"� ${
                            message.replyToMediaOriginalFileName ||
                            message.replyToType
                          }`
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
          );
        }

        const first = item.messages[0];
        const displayName =
          first.senderDisplayName || first.displayName || "Unknown";
        return (
          <Box
            key={`group-${first.id}-${idx}`}
            id={`msg-${first.id}`}
            sx={{ display: "flex", mb: 2 }}
          >
            <MessageAvatarWithStatus
              userId={first.senderId || first.userId || ""}
              imageUrl={first.senderImageUrl || first.imageUrl}
              displayName={displayName}
              showUserProfiles={showUserProfiles}
            />
            <Box display="flex" flexDirection="column" sx={{ flex: 1 }}>
              <Box display="flex" alignItems="center" gap={3}>
                <Typography
                  component={showUserProfiles ? Link : "span"}
                  to={
                    showUserProfiles
                      ? `/profiles/${first.senderId || first.userId}`
                      : undefined
                  }
                  variant="subtitle1"
                  sx={{ fontWeight: "bold", textDecoration: "none" }}
                >
                  {displayName}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  {timeAgo(first.createdAt)}
                </Typography>
                <Chip
                  size="small"
                  label={item.type}
                  color="primary"
                  variant="outlined"
                />
                {onReplyClick && (
                  <IconButton
                    size="small"
                    sx={{ ml: "auto" }}
                    title="Reply"
                    onClick={() => onReplyClick(first.id)}
                  >
                    <ReplyOutlined fontSize="small" />
                  </IconButton>
                )}
              </Box>

              {first.replyToMessageId && (
                <Paper
                  variant="outlined"
                  sx={{
                    p: 1,
                    mb: 1,
                    bgcolor: "action.hover",
                    cursor: onJumpToMessage ? "pointer" : "default",
                  }}
                  onClick={() =>
                    onJumpToMessage && onJumpToMessage(first.replyToMessageId!)
                  }
                >
                  <Typography variant="caption" sx={{ fontWeight: 700 }}>
                    Replying to {first.replyToDisplayName || "message"}
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {first.replyToType && first.replyToType !== "Text"
                      ? `Ы"� ${
                          first.replyToMediaOriginalFileName ||
                          first.replyToType
                        }`
                      : first.replyToBody || ""}
                  </Typography>
                </Paper>
              )}

              <GroupedMediaMessage
                type={item.type}
                messages={item.messages}
                onImageClick={onImageClick}
              />
            </Box>
          </Box>
        );
      })}

      <div ref={messagesEndRef} />
    </>
  );
}
