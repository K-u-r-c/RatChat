import { useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  Typography,
  Fade,
} from "@mui/material";
import { Close, ArrowBack } from "@mui/icons-material";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useStore } from "../../../lib/hooks/useStore";
import { useChatRooms } from "../../../lib/hooks/useChatRooms";
import {
  chatRoomSchema,
  type ChatRoomSchema,
} from "../../../lib/schemas/chatRoomSchema";
import { observer } from "mobx-react-lite";
import ChooseStep from "./ChooseStep";
import CreateStep from "./CreateStep";
import JoinStep from "./JoinStep";
import AnimatedAutoHeight from "../../../app/shared/components/AnimatedAutoHeight";
import { useMedia, MediaCategory } from "../../../lib/hooks/useMedia";
import { useNavigate } from "react-router";

const joinSchema = z.object({
  invite: z
    .string()
    .min(3, "Invite link is required")
    .refine((val) => /\/chat-rooms\/.+\/.+\/join/.test(val), {
      message: "Paste a valid invite link",
    }),
});

type JoinSchema = z.infer<typeof joinSchema>;

const NewChatRoomModal = observer(function NewChatRoomModalInner() {
  const { uiStore } = useStore();
  const { createChatRoom, joinChatRoom, setChatRoomImage } = useChatRooms();
  const { uploadMedia } = useMedia();
  const navigate = useNavigate();

  const createForm = useForm<ChatRoomSchema>({
    mode: "onTouched",
    resolver: zodResolver(chatRoomSchema),
    defaultValues: { title: "" },
  });

  const joinForm = useForm<JoinSchema>({
    mode: "onTouched",
    resolver: zodResolver(joinSchema),
    defaultValues: { invite: "" },
  });

  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleClose = () => {
    if (createChatRoom.isPending || joinChatRoom.isPending) return;
    uiStore.closeCreateJoinModal();
    setSubmitError(null);
    createForm.reset({ title: "" });
    joinForm.reset({ invite: "" });
  };

  const [croppedImage, setCroppedImage] = useState<string | null>(null);

  const header = useMemo(() => {
    switch (uiStore.createJoinModalStep) {
      case "create":
        return "Customize Your Chat Room";
      case "join":
        return "Join a Chat Room";
      default:
        return "Create Your Chat Room";
    }
  }, [uiStore.createJoinModalStep]);

  const parseInvite = (invite: string) => {
    try {
      const url = new URL(invite);
      const parts = url.pathname.split("/").filter(Boolean);
      const idx = parts.findIndex((p) => p === "chat-rooms");
      if (
        idx >= 0 &&
        parts[idx + 1] &&
        parts[idx + 2] &&
        parts[idx + 3] === "join"
      ) {
        return { identifier: parts[idx + 1], token: parts[idx + 2] };
      }
      return null;
    } catch {
      const m = invite.match(/\/chat-rooms\/([^/]+)\/([^/]+)\/join/);
      if (m) return { identifier: m[1], token: m[2] };
      return null;
    }
  };

  const onCreate = createForm.handleSubmit(async (data) => {
    setSubmitError(null);
    try {
      const newRoom = await createChatRoom.mutateAsync(data);
      if (croppedImage) {
        const res = await fetch(croppedImage);
        const blob = await res.blob();
        const file = new File([blob], "chat-room-image.png", {
          type: blob.type,
        });
        const upload = await uploadMedia.mutateAsync({
          file,
          category: MediaCategory.ChatRoomImage,
          chatRoomId: newRoom.id,
        });
        await setChatRoomImage.mutateAsync({
          id: newRoom.id,
          imageUrl: upload.url,
        });
      }
      uiStore.closeCreateJoinModal();
      navigate(`/chat-rooms/${newRoom.slug}`);
    } catch (e) {
      setSubmitError("Failed to create chat room. Please try again.");
      if (import.meta.env.DEV) console.error(e);
    }
  });

  const onJoin = joinForm.handleSubmit(async ({ invite }) => {
    setSubmitError(null);
    const parsed = parseInvite(invite);
    if (!parsed) {
      joinForm.setError("invite", {
        type: "validate",
        message: "Invalid invite link",
      });
      return;
    }
    try {
      await joinChatRoom.mutateAsync(parsed, {
        onSuccess: () => uiStore.closeCreateJoinModal(),
      });
    } catch (e) {
      setSubmitError("Failed to join the chat room. Check the invite link.");
      if (import.meta.env.DEV) console.error(e);
    }
  });

  return (
    <Dialog
      open={uiStore.createJoinModalOpen}
      onClose={handleClose}
      fullWidth
      maxWidth="xs"
      slots={{ transition: Fade }}
      slotProps={{
        paper: {
          sx: {
            bgcolor: "#1e1f24",
            borderRadius: 2,
            color: "#fff",
          },
        },
      }}
    >
      <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        {uiStore.createJoinModalStep !== "choose" && (
          <IconButton
            onClick={() => uiStore.backToChoose()}
            size="small"
            sx={{ mr: 1 }}
          >
            <ArrowBack sx={{ color: "#fff" }} />
          </IconButton>
        )}
        <Typography sx={{ flex: 1, fontSize: "1.25rem", fontWeight: 500 }}>
          {header}
        </Typography>
        <IconButton onClick={handleClose}>
          <Close sx={{ color: "#fff" }} />
        </IconButton>
      </DialogTitle>
      <Divider sx={{ borderColor: "rgba(255,255,255,0.08)" }} />
      <DialogContent>
        <AnimatedAutoHeight>
          {uiStore.createJoinModalStep === "choose" && <ChooseStep />}
          {uiStore.createJoinModalStep === "create" && (
            <CreateStep
              createForm={createForm}
              onCreate={onCreate}
              submitError={submitError}
              isPending={
                createChatRoom.isPending ||
                uploadMedia.isPending ||
                setChatRoomImage.isPending
              }
              onCroppedImageChange={setCroppedImage}
            />
          )}
          {uiStore.createJoinModalStep === "join" && (
            <JoinStep
              joinForm={joinForm}
              onJoin={onJoin}
              submitError={submitError}
              isPending={joinChatRoom.isPending}
            />
          )}
        </AnimatedAutoHeight>
      </DialogContent>
    </Dialog>
  );
});

export default NewChatRoomModal;
