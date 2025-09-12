import { Box, Stack, Typography, Button } from "@mui/material";
import ChatRoomImageUpload from "../ChatRoomImageUpload";
import { useChatRooms } from "../../../lib/hooks/useChatRooms";
import { useEffect } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import TextInput from "../../../app/shared/components/TextInput";
import {
  chatRoomSchema,
  type ChatRoomSchema,
} from "../../../lib/schemas/chatRoomSchema";

type Props = { chatRoomId: string };

export default function ChatRoomSettingsOverview({ chatRoomId }: Props) {
  const { chatRoom, isLoadingChatRoom, updateChatRoom } =
    useChatRooms(chatRoomId);
  const methods = useForm<ChatRoomSchema>({
    mode: "onTouched",
    resolver: zodResolver(chatRoomSchema),
    defaultValues: { title: "" },
  });

  useEffect(() => {
    if (chatRoom) methods.reset({ title: chatRoom.title });
  }, [chatRoom, methods]);

  const onSubmit = methods.handleSubmit(async (data) => {
    if (!chatRoom) return;
    await updateChatRoom.mutateAsync({ ...chatRoom, title: data.title });
  });

  return (
    <Stack sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <Box>
        <Typography variant="h6" gutterBottom>
          Chat room image
        </Typography>
        <Box
          sx={{
            display: "flex",
            flexDirection: "row",
            alignItems: "flex-start",
            gap: 4,
            width: "100%",
          }}
        >
          <ChatRoomImageUpload chatRoomId={chatRoomId} />
        </Box>
      </Box>

      <Box>
        <Typography variant="h6" gutterBottom>
          Server name
        </Typography>
        <FormProvider {...methods}>
          <Box component="form" onSubmit={onSubmit} sx={{ maxWidth: 420 }}>
            <TextInput
              name="title"
              label="Name"
              disabled={isLoadingChatRoom || updateChatRoom.isPending}
            />
            <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 2 }}>
              <Button
                type="submit"
                variant="contained"
                disabled={isLoadingChatRoom || updateChatRoom.isPending}
              >
                Save
              </Button>
            </Box>
          </Box>
        </FormProvider>
      </Box>
    </Stack>
  );
}
