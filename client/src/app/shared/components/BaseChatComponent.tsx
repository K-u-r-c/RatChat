import {
  Box,
  Typography,
  Card,
  CardContent,
  TextField,
  Avatar,
  CircularProgress,
  Button,
} from "@mui/material";
import { Link } from "react-router";
import { timeAgo } from "../../../lib/util/util";
import { type FieldValues, useForm } from "react-hook-form";
import { observer } from "mobx-react-lite";
import { useInView } from "react-intersection-observer";
import { useEffect, useRef, useState } from "react";

type BaseMessage = {
  id: string;
  createdAt: Date;
  body: string;
  senderId?: string;
  senderDisplayName?: string;
  senderImageUrl?: string;
  displayName?: string;
  userId?: string;
  imageUrl?: string;
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
  onSendMessage: (body: string) => Promise<void>;
  showUserProfiles?: boolean;
};

const BaseChatComponent = observer(function BaseChatComponent({
  title,
  messageStore,
  onSendMessage,
  showUserProfiles = true,
}: Props) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const previousScrollHeight = useRef<number>(0);
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

  const [isAtBottom, setIsAtBottom] = useState(true);
  const [newMessageCount, setNewMessageCount] = useState(0);

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
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    setIsAtBottom(true);
    setNewMessageCount(0);
  };

  return (
    <>
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

            {/* Messages list - chronological order (oldest to newest) */}
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
                  </Box>

                  <Typography sx={{ whiteSpace: "pre-wrap" }}>
                    {message.body}
                  </Typography>
                </Box>
              </Box>
            ))}

            {/* Invisible element to scroll to */}
            <div ref={messagesEndRef} />
          </Box>

          {/* Message input */}
          <Box sx={{ p: 2, borderTop: "1px solid", borderColor: "divider" }}>
            <form>
              <TextField
                {...register("body", { required: true })}
                variant="outlined"
                fullWidth
                multiline
                rows={2}
                placeholder="Enter your message (Enter to submit, SHIFT + Enter for new line)"
                onKeyDown={handleKeyPress}
                slotProps={{
                  input: {
                    endAdornment: isSubmitting ? (
                      <CircularProgress size={24} />
                    ) : null,
                  },
                }}
              />
            </form>
          </Box>
        </CardContent>
      </Card>
    </>
  );
});

export default BaseChatComponent;
