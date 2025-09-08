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
import EmojiPickerComponent from "../EmojiPicker";
import MessageReactions from "./MessageReactions";
import { useAccount } from "../../../../lib/hooks/useAccount";
import type { HubConnection } from "@microsoft/signalr";
import type { MessageReaction } from "../../../../lib/types";
import { runInAction } from "mobx";
import { toast } from "react-toastify";
import React, { useRef } from "react";

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
  chatRoomId?: string;
  defaultEmoji?: string;
  directChatId?: string;
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
  chatRoomId,
  defaultEmoji = "👍",
  directChatId,
}: ChatMessageListProps) {
  const { currentUser } = useAccount();
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

  const inFlightRef = useRef(new Set<string>());

  const toggleReactionOptimistic = async (messageId: string, emoji: string) => {
    if ((!chatRoomId && !directChatId) || !currentUser) return;
    const key = `${messageId}|${emoji}`;
    if (inFlightRef.current.has(key)) return;
    inFlightRef.current.add(key);
    const idx = messageStore.messages.findIndex((m) => m.id === messageId);
    if (idx === -1) return;
    const msg = messageStore.messages[idx] as BaseMessage & {
      reactions?: MessageReaction[];
    };
    const list: MessageReaction[] = msg.reactions ? [...msg.reactions] : [];
    const existingIndex = list.findIndex(
      (r) => r.userId === currentUser.id && r.emoji === emoji
    );
    const added = existingIndex === -1;

    runInAction(() => {
      const newList = [...list];
      if (added) {
        newList.push({
          messageId,
          emoji,
          userId: currentUser.id,
          displayName: currentUser.displayName,
          createdAt: new Date(),
        });
      } else {
        newList.splice(existingIndex, 1);
      }
      (messageStore.messages as BaseMessage[])[idx] = {
        ...msg,
        reactions: newList,
      };
    });

    try {
      if (chatRoomId) {
        await (messageStore.hubConnection as HubConnection)?.invoke(
          "ToggleMessageReaction",
          chatRoomId,
          messageId,
          emoji
        );
      } else if (directChatId) {
        await (messageStore.hubConnection as HubConnection)?.invoke(
          "ToggleDirectMessageReaction",
          directChatId,
          messageId,
          emoji
        );
      }
    } catch {
      runInAction(() => {
        const current = (messageStore.messages as BaseMessage[])[
          idx
        ] as BaseMessage & {
          reactions?: MessageReaction[];
        };
        const curList = current.reactions ? [...current.reactions] : [];
        const i = curList.findIndex(
          (r) => r.userId === currentUser.id && r.emoji === emoji
        );
        if (added) {
          if (i !== -1) curList.splice(i, 1);
        } else {
          if (i === -1) {
            curList.push({
              messageId,
              emoji,
              userId: currentUser.id,
              displayName: currentUser.displayName,
              createdAt: new Date(),
            });
          }
        }
        (messageStore.messages as BaseMessage[])[idx] = {
          ...current,
          reactions: curList,
        };
      });
      toast.error("Failed to react. Please try again.");
    } finally {
      inFlightRef.current.delete(key);
    }
  };

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
              className="rc-message"
              sx={{
                display: "flex",
                mb: 2,
                position: "relative",
                "&:hover .actions": { opacity: 1 },
              }}
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
                  <Typography variant="body2" color="text.secondary">
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
                  {/* Inline actions (shown on hover) */}
                  <Box
                    className="actions"
                    sx={{
                      display: "flex",
                      gap: 1,
                      ml: "auto",
                      opacity: 0,
                      transition: "opacity 0.15s",
                    }}
                  >
                    {onReplyClick && (
                      <IconButton
                        size="small"
                        title="Reply"
                        onClick={() => onReplyClick(message.id)}
                      >
                        <ReplyOutlined fontSize="small" />
                      </IconButton>
                    )}
                    {/* React with emoji */}
                    {(chatRoomId || directChatId) && (
                      <EmojiPickerComponent
                        variant="reaction"
                        onQuickReact={async (emoji) =>
                          toggleReactionOptimistic(message.id, emoji)
                        }
                        onEmojiSelect={async (emoji) =>
                          toggleReactionOptimistic(message.id, emoji)
                        }
                        defaultEmoji={defaultEmoji}
                      />
                    )}
                  </Box>
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
                        ? `📎 ${
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

                {/* Reactions */}
                <MessageReactions
                  reactions={message.reactions as MessageReaction[]}
                  currentUserId={currentUser?.id}
                  onToggle={async (emoji) =>
                    toggleReactionOptimistic(message.id, emoji)
                  }
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
            className="rc-message"
            sx={{
              display: "flex",
              mb: 2,
              position: "relative",
              "&:hover .actions": { opacity: 1 },
            }}
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
                <Typography variant="body2" color="text.secondary">
                  {timeAgo(first.createdAt)}
                </Typography>
                <Chip
                  size="small"
                  label={item.type}
                  color="primary"
                  variant="outlined"
                />
                <Box
                  className="actions"
                  sx={{
                    display: "flex",
                    gap: 1,
                    ml: "auto",
                    opacity: 0,
                    transition: "opacity 0.15s",
                  }}
                >
                  {onReplyClick && (
                    <IconButton
                      size="small"
                      title="Reply"
                      onClick={() => onReplyClick(first.id)}
                    >
                      <ReplyOutlined fontSize="small" />
                    </IconButton>
                  )}
                  {(chatRoomId || directChatId) && (
                    <EmojiPickerComponent
                      variant="reaction"
                      onQuickReact={async (emoji) =>
                        toggleReactionOptimistic(first.id, emoji)
                      }
                      onEmojiSelect={async (emoji) =>
                        toggleReactionOptimistic(first.id, emoji)
                      }
                      defaultEmoji={defaultEmoji}
                    />
                  )}
                </Box>
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
                      ? `📎 ${
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

              {/* Reactions under grouped content apply to each message; show for the first only */}
              <MessageReactions
                reactions={
                  (first as BaseMessage).reactions as MessageReaction[]
                }
                currentUserId={currentUser?.id}
                onToggle={async (emoji) =>
                  toggleReactionOptimistic(first.id, emoji)
                }
              />
            </Box>
          </Box>
        );
      })}

      <div ref={messagesEndRef} />
    </>
  );
}
