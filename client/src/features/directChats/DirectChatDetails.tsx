import { useParams } from "react-router";
import { observer } from "mobx-react-lite";
import { useDirectMessages } from "../../lib/hooks/useDirectMessages";
import { useDirectChats } from "../../lib/hooks/useDirectChats";
import { Typography, Box, Avatar, Alert } from "@mui/material";
import {
  Card,
  CardContent,
  TextField,
  CircularProgress,
  Button,
} from "@mui/material";
import { timeAgo } from "../../lib/util/util";
import { type FieldValues, useForm } from "react-hook-form";
import { useInView } from "react-intersection-observer";
import { useEffect, useRef, useState } from "react";

const DirectChatDetails = observer(function DirectChatDetails() {
  const { id } = useParams();
  const { directMessageStore } = useDirectMessages(id);
  const { directChats } = useDirectChats();

  const currentChat = directChats?.find((chat) => chat.id === id);

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
      directMessageStore.hasOlderMessages &&
      !directMessageStore.isLoadingOlder
    ) {
      const container = messagesContainerRef.current;
      if (container) {
        previousScrollHeight.current = container.scrollHeight;
      }
      directMessageStore.loadOlderMessages();
    }
  }, [inView, directMessageStore]);

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (
      container &&
      directMessageStore.isLoadingOlder === false &&
      previousScrollHeight.current > 0
    ) {
      const newScrollHeight = container.scrollHeight;
      const scrollDiff = newScrollHeight - previousScrollHeight.current;
      container.scrollTop = container.scrollTop + scrollDiff;
      previousScrollHeight.current = 0;
    }
  }, [directMessageStore.isLoadingOlder]);

  const prevMessageCount = useRef(directMessageStore.messages.length);
  const prevFirstMessageId = useRef(directMessageStore.messages[0]?.id);

  useEffect(() => {
    const currentMessageCount = directMessageStore.messages.length;
    const newMessages = currentMessageCount - prevMessageCount.current;
    const currentFirstMessageId = directMessageStore.messages[0]?.id;

    if (
      prevFirstMessageId.current !== undefined &&
      prevFirstMessageId.current !== currentFirstMessageId
    ) {
      prevMessageCount.current = currentMessageCount;
      prevFirstMessageId.current = currentFirstMessageId;
      return;
    }

    if (!directMessageStore.isLoadingOlder && newMessages > 0) {
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
  }, [directMessageStore.messages.length, isAtBottom, directMessageStore.isLoadingOlder, directMessageStore.messages]);

  useEffect(() => {
    if (
      directMessageStore.messages.length > 0 &&
      prevMessageCount.current === 0
    ) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "auto" });
      }, 100);
    }
  }, [directMessageStore.messages.length]);

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
    if (!currentChat?.canSendMessages) return;

    try {
      const trimmedBody = data.body?.trimEnd();
      if (trimmedBody) {
        await directMessageStore.hubConnection?.invoke("SendDirectMessage", {
          directChatId: id,
          body: trimmedBody,
        });
      }
    } catch (error) {
      console.log(error);
    } finally {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      reset();
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (
      event.key === "Enter" &&
      !event.shiftKey &&
      currentChat?.canSendMessages
    ) {
      event.preventDefault();
      handleSubmit(addMessage)();
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    setIsAtBottom(true);
    setNewMessageCount(0);
  };

  if (!currentChat) {
    return <Typography>Direct chat not found</Typography>;
  }

  return (
    <Box>
      {/* Chat Header */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 2,
          p: 2,
          borderBottom: "1px solid",
          borderColor: "divider",
          mb: 3,
        }}
      >
        <Avatar
          src={currentChat.otherUserImageUrl}
          alt={currentChat.otherUserDisplayName}
          sx={{ width: 48, height: 48 }}
        >
          {currentChat.otherUserDisplayName[0]}
        </Avatar>
        <Box>
          <Typography variant="h5" fontWeight="bold">
            {currentChat.otherUserDisplayName}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {currentChat.isOnline ? "Online" : "Offline"}
          </Typography>
        </Box>
      </Box>

      {!currentChat.canSendMessages && (
        <Alert severity="info" sx={{ mb: 3 }}>
          You can only view this conversation. To send messages, you need to be
          friends with {currentChat.otherUserDisplayName}.
        </Alert>
      )}

      {/* Messages */}
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
          <Typography variant="h6">
            Chat with {currentChat.otherUserDisplayName}
          </Typography>
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
              {directMessageStore.hasOlderMessages && (
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
                  {directMessageStore.isLoadingOlder ? (
                    <CircularProgress size={24} />
                  ) : (
                    <Button
                      onClick={() => directMessageStore.loadOlderMessages()}
                      variant="outlined"
                      size="small"
                    >
                      Load older messages
                    </Button>
                  )}
                </Box>
              )}

              {/* Messages list */}
              {directMessageStore.messages.map((message) => (
                <Box key={message.id} sx={{ display: "flex", mb: 2 }}>
                  <Avatar
                    src={message.senderImageUrl}
                    alt={"user image"}
                    sx={{ mr: 2 }}
                  />
                  <Box display="flex" flexDirection="column" sx={{ flex: 1 }}>
                    <Box display="flex" alignItems="center" gap={3}>
                      <Typography
                        variant="subtitle1"
                        sx={{ fontWeight: "bold", textDecoration: "none" }}
                      >
                        {message.senderDisplayName}
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
            {currentChat.canSendMessages ? (
              <Box
                sx={{ p: 2, borderTop: "1px solid", borderColor: "divider" }}
              >
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
            ) : (
              <Box
                sx={{
                  p: 2,
                  borderTop: "1px solid",
                  borderColor: "divider",
                  textAlign: "center",
                }}
              >
                <Typography color="text.secondary">
                  You cannot send messages to {currentChat.otherUserDisplayName}{" "}
                  because you are not friends.
                </Typography>
              </Box>
            )}
          </CardContent>
        </Card>
      </>
    </Box>
  );
});

export default DirectChatDetails;
