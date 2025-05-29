import {
  Box,
  Typography,
  Card,
  CardContent,
  TextField,
  Avatar,
  CircularProgress,
} from "@mui/material";
import { Link } from "react-router";
import { useParams } from "react-router";
import { timeAgo } from "../../../lib/util/util";
import { type FieldValues, useForm } from "react-hook-form";
import { observer } from "mobx-react-lite";
import { useMessages } from "../../../lib/hooks/useMessages";

const ChatRoomDetailsChat = observer(function ChatRoomDetailsChat() {
  const { id } = useParams();
  const { messageStore } = useMessages(id);
  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm();

  const addComment = async (data: FieldValues) => {
    try {
      await messageStore.hubConnection?.invoke("SendMessage", {
        chatRoomId: id,
        body: data.body,
      });

      reset();
    } catch (error) {
      console.log(error);
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSubmit(addComment)();
    }
  };
  return (
    <>
      <Box
        sx={{
          textAlign: "center",
          bgcolor: "primary.main",
          color: "white",
          padding: 2,
        }}
      >
        <Typography variant="h6">Chat history</Typography>
      </Box>
      <Card>
        <CardContent>
          <div>
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
          </div>

          <Box sx={{ height: 400, overflow: "auto" }}>
            {messageStore.messages.map((message) => (
              <Box key={message.id} sx={{ display: "flex", my: 2 }}>
                <Avatar
                  src={message.imageUrl}
                  alt={"user image"}
                  sx={{ mr: 2 }}
                />
                <Box display="flex" flexDirection="column">
                  <Box display="flex" alignItems="center" gap={3}>
                    <Typography
                      component={Link}
                      to={`/profiles/${message.userId}`}
                      variant="subtitle1"
                      sx={{ fontWeight: "bold", textDecoration: "none" }}
                    >
                      {message.displayName}
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
          </Box>
        </CardContent>
      </Card>
    </>
  );
});

export default ChatRoomDetailsChat;
