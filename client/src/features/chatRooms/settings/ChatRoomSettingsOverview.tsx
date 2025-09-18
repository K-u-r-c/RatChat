import { Box, Stack, Typography, Button, Collapse, Paper } from "@mui/material";
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
    if (chatRoom) methods.reset({ title: chatRoom.title?.trim() ?? "" });
  }, [chatRoom, methods]);

  const watchedTitle = methods.watch("title") ?? "";
  const isTrimmedDirty =
    chatRoom != null
      ? watchedTitle.trim() !== (chatRoom.title ?? "")
      : methods.formState.isDirty;

  const performSave = async (data: ChatRoomSchema) => {
    if (!chatRoom) return;
    const trimmed = data.title.trim();
    if (trimmed === (chatRoom.title ?? "")) {
      methods.reset({ title: chatRoom.title ?? "" });
      return;
    }
    await updateChatRoom.mutateAsync({ ...chatRoom, title: trimmed });
    methods.reset({ title: trimmed });
  };

  const onSubmit = methods.handleSubmit(performSave);

  return (
    <Stack
      sx={{
        display: "flex",
        height: "100%",
        flexDirection: "column",
        gap: 3,
        position: "relative",
        pb: 10,
      }}
    >
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

      <Box
        sx={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Typography variant="h6" gutterBottom>
          Server name
        </Typography>
        <FormProvider {...methods}>
          <Box component="form" onSubmit={onSubmit}>
            <TextInput
              name="title"
              label="Name"
              disabled={isLoadingChatRoom || updateChatRoom.isPending}
              autoComplete="off"
              spellCheck={false}
              autoCorrect="off"
              autoCapitalize="off"
            />
          </Box>
        </FormProvider>
      </Box>

      <Collapse
        in={isTrimmedDirty}
        timeout={200}
        unmountOnExit
        sx={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          px: 2,
        }}
      >
        <Paper
          elevation={0}
          sx={{
            px: 2,
            py: 1.5,
            borderRadius: 2,
            bgcolor: "#2b2d31",
            border: "1px solid",
            borderColor: "rgba(255,255,255,0.08)",
            display: "flex",
            alignItems: "center",
            gap: 2,
            maxWidth: 920,
            margin: "0 auto",
          }}
        >
          <Typography sx={{ flex: 1 }}>
            Careful — you have unsaved changes!
          </Typography>
          <Button
            type="button"
            onClick={() =>
              methods.reset({ title: (chatRoom?.title ?? "").trim() })
            }
            color="info"
            variant="text"
          >
            Reset
          </Button>
          <Button
            type="submit"
            onClick={() => {
              methods.handleSubmit(performSave)();
            }}
            color="success"
            variant="contained"
            disabled={updateChatRoom.isPending}
          >
            Save Changes
          </Button>
        </Paper>
      </Collapse>
    </Stack>
  );
}
