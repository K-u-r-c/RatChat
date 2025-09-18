import { useParams } from "react-router";
import { useRef, useState } from "react";
import { observer } from "mobx-react-lite";
import { useDirectMessages } from "../../lib/hooks/useDirectMessages";
import { useDirectChats } from "../../lib/hooks/useDirectChats";
import { Typography, Box, Alert, IconButton, Button } from "@mui/material";
import MediaChatComponent from "../../app/shared/components/mediaChatComponent/MediaChatComponent";
import type { MessageType, MediaUploadResult } from "../../lib/types";
import EmojiSettingsDialog from "../../app/shared/components/EmojiSettingsDialog";
import AvatarWithStatus from "../../app/shared/components/AvatarWithStatus";
import { MoreHoriz } from "@mui/icons-material";

const DirectChatDetails = observer(function DirectChatDetails() {
  const { id } = useParams();
  const { directMessageStore } = useDirectMessages(id);
  const { directChats } = useDirectChats();

  const currentChat = directChats?.find((chat) => chat.id === id);
  const [rightPanelOpen, setRightPanelOpen] = useState(true);
  const [emojiDialogOpen, setEmojiDialogOpen] = useState(false);

  const DEFAULT_RIGHT_PANEL_WIDTH = 300;
  const [rightPanelWidth, setRightPanelWidth] = useState<number>(() => {
    const saved = Number(localStorage.getItem("directRightPanelWidth"));
    return Number.isFinite(saved) && saved > 0
      ? saved
      : DEFAULT_RIGHT_PANEL_WIDTH;
  });
  const dragStateRef = useRef<{ startX: number; startWidth: number } | null>(
    null
  );

  const resetRightPanel = () => {
    setRightPanelWidth(DEFAULT_RIGHT_PANEL_WIDTH);
    localStorage.setItem(
      "directRightPanelWidth",
      String(DEFAULT_RIGHT_PANEL_WIDTH)
    );
  };

  const startResize = (e: React.MouseEvent) => {
    dragStateRef.current = { startX: e.clientX, startWidth: rightPanelWidth };
    const onMove = (ev: MouseEvent) => {
      if (!dragStateRef.current) return;
      const dx = dragStateRef.current.startX - ev.clientX;
      const next = Math.min(
        Math.max(dragStateRef.current.startWidth + dx, 220),
        640
      );
      setRightPanelWidth(next);
    };
    const onUp = () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
      dragStateRef.current = null;
      localStorage.setItem("directRightPanelWidth", String(rightPanelWidth));
      document.body.style.cursor = "";
      (document.body.style as CSSStyleDeclaration).userSelect = "";
    };
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
    document.body.style.cursor = "col-resize";
    (document.body.style as CSSStyleDeclaration).userSelect = "none";
  };

  const handleSendMessage = async (
    body: string,
    type: MessageType = "Text",
    mediaData?: Partial<MediaUploadResult>,
    replyToMessageId?: string
  ) => {
    if (!currentChat?.canSendMessages) return;

    const messageData = {
      directChatId: id!,
      body,
      type,
      ...(mediaData && {
        mediaUrl: mediaData.url,
        mediaPublicId: mediaData.publicId,
        mediaType: mediaData.mediaType,
        mediaFileSize: mediaData.fileSize,
        mediaOriginalFileName: mediaData.originalFileName,
      }),
      ...(replyToMessageId && { replyToMessageId }),
    };

    if (type === "Text") {
      await directMessageStore.hubConnection?.invoke(
        "SendDirectMessage",
        messageData
      );
    } else {
      await directMessageStore.hubConnection?.invoke(
        "SendDirectMediaMessage",
        messageData
      );
    }
  };

  if (!currentChat) {
    return <Typography>Direct chat not found</Typography>;
  }

  return (
    <Box
      sx={{
        height: "100vh",
        display: "flex",
        flexDirection: "row",
        overflow: "hidden",
      }}
    >
      {/* Main chat area */}
      <Box
        sx={{
          flex: rightPanelOpen
            ? `1 1 calc(100% - ${rightPanelWidth}px)`
            : "1 1 100%",
          display: "flex",
          flexDirection: "column",
          minWidth: 0,
          transition: "flex-basis 200ms cubic-bezier(.4,0,.2,1)",
        }}
      >
        {/* Header */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderBottom: "1px solid",
            borderColor: "divider",
            p: 1,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <AvatarWithStatus
              src={currentChat.otherUserImageUrl}
              alt={currentChat.otherUserDisplayName}
              status={
                currentChat.status ||
                (currentChat.isOnline ? "Online" : "Offline")
              }
            >
              {currentChat.otherUserDisplayName[0]}
            </AvatarWithStatus>
            <Typography variant="h6" fontWeight="bold">
              {currentChat.otherUserDisplayName}
            </Typography>
          </Box>
          <IconButton
            aria-label="More options"
            onClick={() => setRightPanelOpen((v) => !v)}
          >
            <MoreHoriz />
          </IconButton>
        </Box>

        {!currentChat.canSendMessages && (
          <Alert severity="info" sx={{ m: 1 }}>
            You can only view this conversation. To send messages, you need to
            be friends with {currentChat.otherUserDisplayName}.
          </Alert>
        )}

        <Box sx={{ flex: 1, minHeight: 0 }}>
          <MediaChatComponent
            title={`Chat with ${currentChat.otherUserDisplayName}`}
            messageStore={directMessageStore}
            onSendMessage={
              currentChat.canSendMessages ? handleSendMessage : async () => {}
            }
            showUserProfiles={true}
            chatRoomId={undefined}
            directChatId={id}
            userPermissions={undefined}
          />
        </Box>
      </Box>

      {/* Right side panel */}
      {rightPanelOpen && (
        <>
          {/* Resize handle */}
          <Box
            role="separator"
            aria-orientation="vertical"
            onMouseDown={startResize}
            onDoubleClick={resetRightPanel}
            sx={{
              width: 4,
              cursor: "col-resize",
              flex: "0 0 4px",
              alignSelf: "stretch",
              bgcolor: "divider",
              "&:hover": { bgcolor: "action.hover" },
            }}
          />
          <Box
            sx={{
              width: rightPanelWidth,
              flexShrink: 0,
              p: 2,
              boxSizing: "border-box",
              bgcolor: "background.paper",
              borderLeft: "1px solid",
              borderColor: "divider",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <Typography variant="h6" sx={{ mb: 2 }}>
              Conversation Options
            </Typography>
            <Button variant="outlined" onClick={() => setEmojiDialogOpen(true)}>
              Change default emoji
            </Button>
          </Box>
        </>
      )}

      {/* Emoji settings dialog triggered from right panel */}
      <EmojiSettingsDialog
        open={emojiDialogOpen}
        onClose={() => setEmojiDialogOpen(false)}
        chatType={"direct"}
        chatId={id!}
        chatName={`Chat with ${currentChat.otherUserDisplayName}`}
      />
    </Box>
  );
});

export default DirectChatDetails;
