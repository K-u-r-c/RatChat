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
import MessageAvatar from "../../MessageAvatar";
import GroupedMediaMessage from "../GroupedMediaMessage";
import type { BaseMessage, BaseMessageStore } from "../../../../../lib/types";
import EmojiPickerComponent from "../../EmojiPicker";
import MessageReactions from "../MessageReactions";
import { useAccount } from "../../../../../lib/hooks/useAccount";
import type { HubConnection } from "@microsoft/signalr";
import type { MessageReaction } from "../../../../../lib/types";
import { runInAction } from "mobx";
import React, { useRef } from "react";
import { timeAgo } from "../../../../../lib/util/util";
import DateDivider from "./DateDivider";
import SingleMessageRow from "./SingleMessageRow";
import { buildRenderItems, type RenderItem } from "./buildRenderItems";

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
  const renderItems: RenderItem[] = buildRenderItems(
    messageStore.messages as BaseMessage[]
  );
  const inFlightRef = useRef(new Set<string>());

  // Optimistic toggle flow for reactions:
  // - apply local change immediately
  // - invoke SignalR hub ("ToggleMessageReaction" or "ToggleDirectMessageReaction")
  // - if remote call fails, roll back local change
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
    } finally {
      inFlightRef.current.delete(key);
    }
  };

  return (
    <>
      {/* "Load older messages" indicator and control */}
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
          {/* While loading older messages show a spinner, otherwise a button */}
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

      {/* Main messages list */}
      {renderItems.map((item, idx) => {
        // Date divider: shows a centered date label between message groups
        if (item.kind === "date") {
          return <DateDivider key={`date-${idx}`} date={item.date} />;
        }

        // Single message: an individual message row with avatar, content, actions, reactions
        if (item.kind === "single") {
          const message = item.message;
          const isOwn =
            (message.senderId || message.userId) === currentUser?.id;
          return (
            <SingleMessageRow
              key={message.id}
              message={message}
              isOwn={isOwn}
              continuation={item.continuation}
              showUserProfiles={showUserProfiles}
              onImageClick={onImageClick}
              onFileDownload={onFileDownload}
              onReplyClick={onReplyClick}
              onJumpToMessage={onJumpToMessage}
              defaultEmoji={defaultEmoji}
              showEmoji={Boolean(chatRoomId || directChatId)}
              onToggleReaction={(emoji) =>
                toggleReactionOptimistic(message.id, emoji)
              }
              reactions={message.reactions as MessageReaction[]}
              currentUserId={currentUser?.id}
            />
          );
        }

        // Grouped media messages: displays a sender avatar + grouped media grid and reactions
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
            {/* Sender avatar for the group */}
            <MessageAvatar
              userId={first.senderId || first.userId || ""}
              imageUrl={first.senderImageUrl || first.imageUrl}
              displayName={displayName}
              showUserProfiles={showUserProfiles}
            />

            {/* Main grouped content column: sender name, time, media grid, reply preview, reactions */}
            <Box
              display="flex"
              flexDirection="column"
              sx={{ flex: 1, alignItems: isOwn ? "flex-end" : "flex-start" }}
            >
              {/* Header: sender name, timestamp, media type chip, inline actions (reply/emoji) */}
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

                {/* Inline actions shown on hover: reply, emoji picker */}
                <Box
                  className="actions"
                  sx={{
                    display: "flex",
                    gap: 1,
                    ml: isOwn ? 0 : "auto",
                    mr: isOwn ? "auto" : 0,
                    opacity: 0,
                    transition: "opacity 0.15s",
                    flexDirection: isOwn ? "row-reverse" : "row",
                  }}
                >
                  {/* Reply action */}
                  {onReplyClick && (
                    <IconButton
                      size="small"
                      title="Reply"
                      onClick={() => onReplyClick(first.id)}
                    >
                      <ReplyOutlined fontSize="small" />
                    </IconButton>
                  )}

                  {/* Emoji picker for adding reactions to the message */}
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

              {/* Card containing the grouped media grid and optional reply preview */}
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
                {/* Grid of images / videos */}
                <GroupedMediaMessage
                  type={item.type}
                  messages={item.messages}
                  onImageClick={onImageClick}
                />

                {/* Reply preview shown when the first message in the group replies to another message */}
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

              {/* Reactions row for the grouped content (aligned left/right based on owner) */}
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

      {/* End-of-list marker for scrolling / jumping to bottom */}
      <div ref={messagesEndRef} />
    </>
  );
}
