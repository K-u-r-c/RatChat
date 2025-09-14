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
import { timeAgo } from "../../../../lib/util/util";
import MessageAvatar from "../MessageAvatar";
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
import { format, isSameDay } from "date-fns";

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
    | { kind: "date"; date: Date }
    | { kind: "single"; message: BaseMessage; continuation?: boolean }
    | { kind: "group"; type: "Image" | "Video"; messages: BaseMessage[] };

  const buildRenderItems = (): RenderItem[] => {
    const items: RenderItem[] = [];
    const msgs = messageStore.messages;
    // Window for grouping MEDIA items into one tile
    const mediaGroupWindowMs = 15 * 1000;
    // Window for grouping consecutive messages from the same sender (time-based grouping)
    const timeGroupWindowMs = 60 * 1000; // 1 minute

    let i = 0;
    let lastDate: Date | null = null;
    let lastSender: string | null = null;
    let lastTimestamp: number | null = null;
    while (i < msgs.length) {
      const m = msgs[i];
      const createdAt = new Date(m.createdAt);
      if (!lastDate || !isSameDay(lastDate, createdAt)) {
        items.push({ kind: "date", date: createdAt });
        lastDate = createdAt;
      }
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
            if (Math.abs(tj - t0) <= mediaGroupWindowMs) {
              group.push(n);
              j++;
              continue;
            }
          }
          break;
        }
        if (group.length > 1) {
          items.push({ kind: "group", type: groupType, messages: group });
          // Update last sender/time so a message right after grouped media can be treated as continuation
          lastSender = sender || null;
          lastTimestamp = t0;
          i = j;
          continue;
        }
        const isContinuation =
          lastSender === (m.senderId || m.userId) &&
          lastTimestamp !== null &&
          Math.abs(new Date(m.createdAt).getTime() - lastTimestamp) <=
            timeGroupWindowMs;
        items.push({
          kind: "single",
          message: m,
          continuation: isContinuation,
        });
        lastSender = sender || null;
        lastTimestamp = t0;
        i++;
      } else {
        const ts = createdAt.getTime();
        const sender = m.senderId || m.userId;
        const isContinuation =
          lastSender === sender &&
          lastTimestamp !== null &&
          Math.abs(ts - lastTimestamp) <= timeGroupWindowMs;
        items.push({
          kind: "single",
          message: m,
          continuation: isContinuation,
        });
        lastSender = sender || null;
        lastTimestamp = ts;
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
        if (item.kind === "date") {
          const label = format(item.date, "d MMMM yyyy");
          return (
            <Box
              key={`date-${label}-${idx}`}
              sx={{ my: 1.5, position: "relative" }}
            >
              <Box
                sx={{
                  position: "absolute",
                  top: "50%",
                  left: 0,
                  right: 0,
                  borderTop: "1px solid",
                  borderColor: "divider",
                }}
              />
              <Box sx={{ display: "flex", justifyContent: "center" }}>
                <Typography
                  variant="caption"
                  sx={{
                    px: 1,
                    bgcolor: "background.default",
                    zIndex: 1,
                    color: "text.secondary",
                  }}
                >
                  {label}
                </Typography>
              </Box>
            </Box>
          );
        }
        if (item.kind === "single") {
          const message = item.message;
          const isOwn =
            (message.senderId || message.userId) === currentUser?.id;
          return (
            <Box
              key={message.id}
              id={`msg-${message.id}`}
              className="rc-message"
              sx={{
                display: "flex",
                flexDirection: isOwn ? "row-reverse" : "row",
                mb: item.continuation ? 0.5 : 1.5,
                position: "relative",
                px: 1,
                py: item.continuation ? 0.25 : 0.5,
                borderRadius: 1,
                transition: "background-color 0.15s",
                "&:hover": { backgroundColor: "rgba(255,255,255,0.04)" },
                "&:hover .actions": { opacity: 1 },
              }}
            >
              {!item.continuation && (
                <MessageAvatar
                  userId={message.senderId || message.userId || ""}
                  imageUrl={message.senderImageUrl || message.imageUrl}
                  displayName={
                    message.senderDisplayName ||
                    message.displayName ||
                    "Unknown"
                  }
                  showUserProfiles={showUserProfiles}
                />
              )}
              {item.continuation && <Box sx={{ width: 40, mx: 2 }} />}
              <Box
                display="flex"
                flexDirection="column"
                sx={{ flex: 1, alignItems: isOwn ? "flex-end" : "flex-start" }}
              >
                {!item.continuation && (
                  <Box
                    display="flex"
                    alignItems="center"
                    gap={3}
                    sx={{
                      width: "100%",
                      flexDirection: isOwn ? "row-reverse" : "row",
                    }}
                  >
                    <Typography
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
                    {/* Inline actions disabled in header; we use side actions near bubble */}
                    <Box sx={{ display: "none" }} />
                  </Box>
                )}

                {/* Message bubble with inline reply preview and side actions for continuations */}
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 0.75,
                    flexDirection: isOwn ? "row-reverse" : "row",
                    maxWidth: "75%",
                  }}
                >
                  <Paper
                    elevation={0}
                    sx={{
                      p: 1,
                      bgcolor: isOwn ? "primary.main" : "action.hover",
                      color: isOwn ? "#fff" : "inherit",
                      borderRadius: 2,
                    }}
                  >
                    <MessageContentRenderer
                      message={message}
                      onImageClick={onImageClick}
                      onFileDownload={onFileDownload}
                    />
                    {message.replyToMessageId && (
                      <Box
                        sx={{
                          mt: 0.25,
                          pt: 0.25,
                          borderTop: "1px solid",
                          borderColor: "divider",
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
                          variant="caption"
                          color={isOwn ? "inherit" : "text.secondary"}
                          sx={{
                            display: "block",
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
                      </Box>
                    )}
                  </Paper>
                  <Box
                    className="actions"
                    sx={{
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      opacity: 0,
                      transition: "opacity 0.15s",
                      flexDirection: isOwn ? "row-reverse" : "row",
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
                    {(chatRoomId || directChatId) && (
                      <EmojiPickerComponent
                        variant="reaction"
                        showQuickReact={false}
                        onQuickReact={async (emoji) =>
                          toggleReactionOptimistic(message.id, emoji)
                        }
                        onEmojiSelect={async (emoji) =>
                          toggleReactionOptimistic(message.id, emoji)
                        }
                        defaultEmoji={defaultEmoji}
                        anchorOrigin={{
                          vertical: "bottom",
                          horizontal: "center",
                        }}
                        transformOrigin={{
                          vertical: "top",
                          horizontal: "center",
                        }}
                      />
                    )}
                  </Box>
                </Box>
              </Box>

              {/* Reactions */}
              <Box sx={{ alignSelf: isOwn ? "flex-end" : "flex-start" }}>
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
        const isOwn = (first.senderId || first.userId) === currentUser?.id;
        return (
          <Box
            key={`group-${first.id}-${idx}`}
            id={`msg-${first.id}`}
            className="rc-message"
            sx={{
              display: "flex",
              flexDirection: isOwn ? "row-reverse" : "row",
              mb: 1.5,
              position: "relative",
              px: 1,
              py: 0.5,
              borderRadius: 1,
              transition: "background-color 0.15s",
              "&:hover": { backgroundColor: "rgba(255,255,255,0.04)" },
              "&:hover .actions": { opacity: 1 },
            }}
          >
            <MessageAvatar
              userId={first.senderId || first.userId || ""}
              imageUrl={first.senderImageUrl || first.imageUrl}
              displayName={displayName}
              showUserProfiles={showUserProfiles}
            />
            <Box
              display="flex"
              flexDirection="column"
              sx={{ flex: 1, alignItems: isOwn ? "flex-end" : "flex-start" }}
            >
              <Box
                display="flex"
                alignItems="center"
                gap={3}
                sx={{
                  width: "100%",
                  flexDirection: isOwn ? "row-reverse" : "row",
                }}
              >
                <Typography
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
                    ml: isOwn ? 0 : "auto",
                    mr: isOwn ? "auto" : 0,
                    opacity: 0,
                    transition: "opacity 0.15s",
                    // reverse order of buttons for grouped messages when isOwn
                    flexDirection: isOwn ? "row-reverse" : "row",
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
                      showQuickReact={false}
                      onQuickReact={async (emoji) =>
                        toggleReactionOptimistic(first.id, emoji)
                      }
                      onEmojiSelect={async (emoji) =>
                        toggleReactionOptimistic(first.id, emoji)
                      }
                      defaultEmoji={defaultEmoji}
                      anchorOrigin={
                        isOwn
                          ? { vertical: "bottom", horizontal: "right" }
                          : { vertical: "bottom", horizontal: "left" }
                      }
                      transformOrigin={
                        isOwn
                          ? { vertical: "bottom", horizontal: "left" }
                          : { vertical: "bottom", horizontal: "left" }
                      }
                    />
                  )}
                </Box>
              </Box>

              <Paper
                elevation={0}
                sx={{
                  p: 1.25,
                  bgcolor: isOwn ? "primary.main" : "action.hover",
                  color: isOwn ? "#fff" : "inherit",
                  borderRadius: 2,
                  maxWidth: "75%",
                }}
              >
                <GroupedMediaMessage
                  type={item.type}
                  messages={item.messages}
                  onImageClick={onImageClick}
                />
                {first.replyToMessageId && (
                  <Box
                    sx={{
                      mt: 0.25,
                      pt: 0.25,
                      borderTop: "1px solid",
                      borderColor: "divider",
                      cursor: onJumpToMessage ? "pointer" : "default",
                    }}
                    onClick={() =>
                      onJumpToMessage &&
                      onJumpToMessage(first.replyToMessageId!)
                    }
                  >
                    <Typography variant="caption" sx={{ fontWeight: 700 }}>
                      Replying to {first.replyToDisplayName || "message"}
                    </Typography>
                    <Typography
                      variant="caption"
                      color={isOwn ? "inherit" : "text.secondary"}
                      sx={{
                        display: "block",
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
                  </Box>
                )}
              </Paper>

              {/* Reactions under grouped content apply to each message; show for the first only */}
              <Box sx={{ alignSelf: isOwn ? "flex-end" : "flex-start" }}>
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
          </Box>
        );
      })}

      <div ref={messagesEndRef} />
    </>
  );
}
