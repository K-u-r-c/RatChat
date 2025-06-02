import { Box, Button, Paper, Typography } from "@mui/material";
import { useNavigate, useParams } from "react-router";
import { useForm } from "react-hook-form";
import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useChatRooms } from "../../../lib/hooks/useChatRooms";
import {
  chatRoomSchema,
  type ChatRoomSchema,
} from "../../../lib/schemas/chatRoomSchema";
import TextInput from "../../../app/shared/components/TextInput";

export default function ChatRoomForm() {
  const { reset, handleSubmit, control } = useForm<ChatRoomSchema>({
    mode: "onTouched",
    resolver: zodResolver(chatRoomSchema),
  });
  const navigate = useNavigate();
  const { id } = useParams();
  const { updateChatRoom, createChatRoom, chatRoom, isLoadingChatRoom } =
    useChatRooms(id);

  useEffect(() => {
    if (chatRoom)
      reset({
        ...chatRoom,
      });
  }, [chatRoom, reset]);

  const onSubmit = async (data: ChatRoomSchema) => {
    try {
      if (chatRoom) {
        updateChatRoom.mutate(
          { ...chatRoom, ...data },
          {
            onSuccess: () => navigate(`/chat-rooms/${chatRoom.id}`),
          }
        );
      } else {
        createChatRoom.mutate(data, {
          onSuccess: (id) => navigate(`/chat-rooms/${id}`),
        });
      }
    } catch (error) {
      console.log(error);
    }
  };

  if (isLoadingChatRoom) return <Typography>Loading chat room...</Typography>;

  return (
    <Paper sx={{ borderRadius: 3, padding: 3 }}>
      <Typography variant="h5" gutterBottom color="primary">
        {chatRoom ? "Edit chat room" : "Create chat room"}
      </Typography>
      <Box
        component="form"
        onSubmit={handleSubmit(onSubmit)}
        display="flex"
        flexDirection="column"
        gap={3}
      >
        <TextInput label="Title" control={control} name="title" />
        <Box display="flex" justifyContent="end" gap={3}>
          <Button onClick={() => navigate(-1)} color="inherit">
            Cancel
          </Button>
          <Button
            type="submit"
            color="success"
            variant="contained"
            disabled={updateChatRoom.isPending || createChatRoom.isPending}
          >
            Submit
          </Button>
        </Box>
      </Box>
    </Paper>
  );
}
