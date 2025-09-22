import { useParams } from "react-router";
import { useEffect, useMemo, useState } from "react";
import { observer, useLocalObservable } from "mobx-react-lite";
import { reaction, runInAction } from "mobx";
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Tooltip,
  Typography,
} from "@mui/material";
import { Lock, LockOpen } from "@mui/icons-material";
import AvatarWithStatus from "../../app/shared/components/AvatarWithStatus";
import MediaChatComponent from "../../app/shared/components/mediaChatComponent/MediaChatComponent";
import { useEncryptedDirectChats } from "../../lib/hooks/useEncryptedDirectChats";
import { useEncryptedDirectMessages } from "../../lib/hooks/useEncryptedDirectMessages";
import {
  decryptMessageMetadata,
  decryptMessagePayload,
  deriveChatKey,
  encryptMessagePayload,
  exportKeyToStorage,
  loadKeyFromStorage,
  clearStoredKey,
} from "../../lib/crypto/encryptedChat";
import type {
  BaseMessage,
  BaseMessageStore,
  EncryptedDirectMessage,
  MediaUploadResult,
  MessageType,
} from "../../lib/types";
import { toast } from "react-toastify";
import TextField from "@mui/material/TextField";

const UNDECRYPTABLE_TEXT = "Unable to decrypt message with current passphrase.";
const PASSPHRASE_REQUIRED_TEXT =
  "Set the shared passphrase to decrypt this message.";

type SerializedMediaMetadata = {
  url?: string;
  publicId?: string;
  mediaType?: string;
  fileSize?: number;
  originalFileName?: string;
  messageType?: MessageType;
};

type EncryptedMessageMetadata = {
  media?: SerializedMediaMetadata;
};

function parseContent(raw: string): { body: string } {
  try {
    const parsed = JSON.parse(raw);
    if (
      parsed &&
      typeof parsed === "object" &&
      typeof parsed.body === "string"
    ) {
      return { body: parsed.body };
    }
  } catch {
    // ignore parse error
  }
  return { body: raw };
}

function parseMetadata(raw: string): EncryptedMessageMetadata {
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object") {
      return parsed as EncryptedMessageMetadata;
    }
  } catch {
    // ignore parse error
  }
  return {};
}

function mapMimeToMessageType(mediaType?: string): MessageType | undefined {
  if (!mediaType) return undefined;
  if (mediaType.startsWith("image/")) return "Image";
  if (mediaType.startsWith("video/")) return "Video";
  if (mediaType.startsWith("audio/")) return "Audio";
  return "Document";
}

async function buildBaseMessage(
  message: EncryptedDirectMessage,
  key: CryptoKey | null
): Promise<BaseMessage> {
  const createdAt =
    message.createdAt instanceof Date
      ? message.createdAt
      : new Date(message.createdAt);

  const reactions = (message.reactions ?? []).map((reaction) => ({
    ...reaction,
    createdAt: reaction.createdAt ? new Date(reaction.createdAt) : new Date(),
  }));

  const base: BaseMessage = {
    id: message.id,
    createdAt,
    body: key ? UNDECRYPTABLE_TEXT : PASSPHRASE_REQUIRED_TEXT,
    type: (message.type || "Text") as MessageType,
    senderId: message.senderId,
    senderDisplayName: message.senderDisplayName,
    senderImageUrl: message.senderImageUrl ?? undefined,
    reactions,
  };

  if (!key) {
    if (message.replyToMessageId) {
      base.replyToMessageId = message.replyToMessageId;
      base.replyToDisplayName = message.replyToSenderDisplayName ?? undefined;
      base.replyToBody = PASSPHRASE_REQUIRED_TEXT;
    }
    return base;
  }

  try {
    const decrypted = await decryptMessagePayload(key, message.cipherText);
    const content = parseContent(decrypted);
    base.body = content.body;
  } catch {
    base.body = UNDECRYPTABLE_TEXT;
  }

  if (message.cipherTextMetadata) {
    try {
      const decryptedMetadata = await decryptMessageMetadata(
        key,
        message.cipherTextMetadata
      );
      const metadata = parseMetadata(decryptedMetadata);
      if (metadata.media) {
        const media = metadata.media;
        base.mediaUrl = media.url;
        base.mediaPublicId = media.publicId;
        base.mediaType = media.mediaType;
        base.mediaFileSize = media.fileSize;
        base.mediaOriginalFileName = media.originalFileName;
        if (media.messageType) {
          base.type = media.messageType;
        }
      }
    } catch {
      // ignore metadata errors
    }
  }

  if (message.replyToMessageId) {
    base.replyToMessageId = message.replyToMessageId;
    base.replyToDisplayName = message.replyToSenderDisplayName ?? undefined;

    if (message.replyToCipherText) {
      try {
        const replyPlain = await decryptMessagePayload(
          key,
          message.replyToCipherText
        );
        const replyContent = parseContent(replyPlain);
        base.replyToBody = replyContent.body;
      } catch {
        base.replyToBody = UNDECRYPTABLE_TEXT;
      }
    } else {
      base.replyToBody = UNDECRYPTABLE_TEXT;
    }

    if (message.replyToCipherTextMetadata) {
      try {
        const decryptedReplyMetadata = await decryptMessageMetadata(
          key,
          message.replyToCipherTextMetadata
        );
        const replyMetadata = parseMetadata(decryptedReplyMetadata);
        if (replyMetadata.media) {
          const media = replyMetadata.media;
          base.replyToMediaOriginalFileName = media.originalFileName;
          if (media.messageType) {
            base.replyToType = media.messageType;
          } else if (media.mediaType) {
            base.replyToType = mapMimeToMessageType(media.mediaType);
          }
        }
      } catch {
        // ignore reply metadata errors
      }
    }
  }

  return base;
}

const EncryptedDirectChatDetails = observer(
  function EncryptedDirectChatDetails() {
    const { userSlug } = useParams();
    const { encryptedDirectChats } = useEncryptedDirectChats();
    const currentChat = useMemo(
      () =>
        encryptedDirectChats.find((chat) => chat.otherUserSlug === userSlug),
      [encryptedDirectChats, userSlug]
    );
    const encryptedDirectChatId = currentChat?.id;
    const { encryptedDirectMessageStore } = useEncryptedDirectMessages(
      encryptedDirectChatId
    );
    const [cryptoKey, setCryptoKey] = useState<CryptoKey | null>(null);
    const [passphraseDialogOpen, setPassphraseDialogOpen] = useState(false);
    const [passphraseInput, setPassphraseInput] = useState("");
    const [passphraseBusy, setPassphraseBusy] = useState(false);
    const [passphraseError, setPassphraseError] = useState<string | null>(null);

    const messageViewStore = useLocalObservable<BaseMessageStore>(() => ({
      messages: [] as BaseMessage[],
      hasOlderMessages: false,
      isLoadingOlder: false,
      loadOlderMessages: () => {
        encryptedDirectMessageStore.loadOlderMessages();
      },
      hubConnection: encryptedDirectMessageStore.hubConnection as unknown,
    }));

    useEffect(() => {
      if (!encryptedDirectChatId) {
        setCryptoKey(null);
        runInAction(() => {
          messageViewStore.messages = [];
        });
        return;
      }

      let mounted = true;
      loadKeyFromStorage(encryptedDirectChatId).then((key) => {
        if (mounted) {
          setCryptoKey(key);
        }
      });

      return () => {
        mounted = false;
      };
    }, [encryptedDirectChatId, messageViewStore]);

    useEffect(() => {
      const dispose = reaction(
        () => ({
          hasOlder: encryptedDirectMessageStore.hasOlderMessages,
          isLoadingOlder: encryptedDirectMessageStore.isLoadingOlder,
          hub: encryptedDirectMessageStore.hubConnection,
        }),
        ({ hasOlder, isLoadingOlder, hub }) => {
          runInAction(() => {
            messageViewStore.hasOlderMessages = hasOlder;
            messageViewStore.isLoadingOlder = isLoadingOlder;
            messageViewStore.hubConnection = hub as unknown;
          });
        },
        { fireImmediately: true }
      );

      return () => {
        dispose();
      };
    }, [encryptedDirectMessageStore, messageViewStore]);

    useEffect(() => {
      if (!encryptedDirectChatId) {
        runInAction(() => {
          messageViewStore.messages = [];
        });
        return;
      }

      let cancelled = false;

      const dispose = reaction(
        () =>
          encryptedDirectMessageStore.messages.map((m) => ({
            id: m.id,
            cipherText: m.cipherText,
            cipherTextMetadata: m.cipherTextMetadata,
            replyCipher: m.replyToCipherText,
            replyCipherMetadata: m.replyToCipherTextMetadata,
            createdAt:
              m.createdAt instanceof Date
                ? m.createdAt.getTime()
                : new Date(m.createdAt).getTime(),
            reactionsSignature: JSON.stringify(
              (m.reactions ?? []).map(
                (r) => `${r.userId}:${r.emoji}:${r.createdAt ?? ""}`
              )
            ),
          })),
        async () => {
          const snapshot = encryptedDirectMessageStore.messages.slice();
          const decrypted = await Promise.all(
            snapshot.map((message) => buildBaseMessage(message, cryptoKey))
          );
          if (cancelled) return;
          const sorted = decrypted.sort(
            (a, b) => a.createdAt.getTime() - b.createdAt.getTime()
          );
          runInAction(() => {
            messageViewStore.messages = sorted;
          });
        },
        { fireImmediately: true }
      );

      return () => {
        cancelled = true;
        dispose();
      };
    }, [
      cryptoKey,
      encryptedDirectChatId,
      encryptedDirectMessageStore,
      messageViewStore,
    ]);

    if (!currentChat) {
      return <Typography>Encrypted direct chat not found</Typography>;
    }

    const handleOpenPassphraseDialog = () => {
      setPassphraseError(null);
      setPassphraseInput("");
      setPassphraseDialogOpen(true);
    };

    const handleSavePassphrase = async () => {
      if (!encryptedDirectChatId) return;
      if (!passphraseInput.trim()) {
        setPassphraseError("Passphrase cannot be empty");
        return;
      }
      setPassphraseBusy(true);
      try {
        const key = await deriveChatKey(
          passphraseInput.trim(),
          encryptedDirectChatId
        );
        await exportKeyToStorage(encryptedDirectChatId, key);
        setCryptoKey(key);
        setPassphraseDialogOpen(false);
        setPassphraseInput("");
        setPassphraseError(null);
        toast.success("Passphrase stored for this chat");
      } catch (error) {
        setPassphraseError("Failed to derive key");
        if (import.meta.env.DEV) console.error("Passphrase error", error);
      } finally {
        setPassphraseBusy(false);
      }
    };

    const handleClearPassphrase = () => {
      if (!encryptedDirectChatId) return;
      clearStoredKey(encryptedDirectChatId);
      setCryptoKey(null);
      setPassphraseInput("");
      toast.info("Cleared stored passphrase for this chat");
    };

    const handleSendMessage = async (
      body: string,
      type: MessageType = "Text",
      mediaData?: Partial<MediaUploadResult>,
      replyToMessageId?: string
    ) => {
      if (!encryptedDirectChatId) {
        throw new Error("Missing chat context");
      }
      if (!cryptoKey) {
        setPassphraseDialogOpen(true);
        throw new Error("Passphrase required");
      }
      if (!encryptedDirectMessageStore.hubConnection) {
        toast.error("Connection is not ready yet");
        throw new Error("Hub connection not available");
      }

      const normalizedBody = typeof body === "string" ? body : "";
      const metadataPayload = mediaData
        ? {
            media: {
              url: mediaData.url,
              publicId: mediaData.publicId,
              mediaType: mediaData.mediaType,
              fileSize: mediaData.fileSize,
              originalFileName: mediaData.originalFileName,
              messageType: type,
            },
          }
        : undefined;

      try {
        const { cipherText, metadata } = await encryptMessagePayload(
          cryptoKey,
          JSON.stringify({ body: normalizedBody }),
          metadataPayload ? JSON.stringify(metadataPayload) : undefined
        );

        await encryptedDirectMessageStore.hubConnection.invoke(
          "SendEncryptedMessage",
          {
            encryptedDirectChatId,
            cipherText,
            cipherTextMetadata: metadata,
            version: "v1",
            type,
            ...(replyToMessageId ? { replyToMessageId } : {}),
          }
        );
      } catch (error) {
        toast.error("Failed to send encrypted message");
        if (import.meta.env.DEV) {
          console.error("Send encrypted message error", error);
        }
        throw error instanceof Error ? error : new Error("Send failed");
      }
    };

    return (
      <Box
        sx={{
          height: "100vh",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderBottom: "1px solid",
            borderColor: "divider",
            p: 1.5,
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
              {currentChat.otherUserDisplayName?.charAt(0).toUpperCase()}
            </AvatarWithStatus>
            <Box>
              <Typography variant="h6" fontWeight="bold">
                {currentChat.otherUserDisplayName}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Encrypted conversation
              </Typography>
            </Box>
          </Box>
          <Box sx={{ display: "flex", gap: 1 }}>
            <Tooltip
              title={cryptoKey ? "Clear stored passphrase" : "Set passphrase"}
            >
              <span>
                <IconButton
                  color={cryptoKey ? "warning" : "primary"}
                  onClick={
                    cryptoKey
                      ? handleClearPassphrase
                      : handleOpenPassphraseDialog
                  }
                >
                  {cryptoKey ? <LockOpen /> : <Lock />}
                </IconButton>
              </span>
            </Tooltip>
            <Button variant="outlined" onClick={handleOpenPassphraseDialog}>
              {cryptoKey ? "Update passphrase" : "Set passphrase"}
            </Button>
          </Box>
        </Box>

        {!cryptoKey && (
          <Alert severity="info" sx={{ m: 2 }}>
            Set a shared passphrase to decrypt messages in this conversation.
          </Alert>
        )}

        <Box sx={{ flex: 1, minHeight: 0 }}>
          <MediaChatComponent
            title={`Chat with ${currentChat.otherUserDisplayName}`}
            messageStore={messageViewStore}
            onSendMessage={handleSendMessage}
            showUserProfiles
            chatRoomId={undefined}
            directChatId={undefined}
            encryptedDirectChatId={encryptedDirectChatId}
            directCanSend={Boolean(cryptoKey)}
          />
        </Box>

        <Dialog
          open={passphraseDialogOpen}
          onClose={() => !passphraseBusy && setPassphraseDialogOpen(false)}
        >
          <DialogTitle>
            {cryptoKey ? "Update passphrase" : "Set passphrase"}
          </DialogTitle>
          <DialogContent
            sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}
          >
            <Typography variant="body2" color="text.secondary">
              Enter a shared passphrase known only to you and{" "}
              {currentChat.otherUserDisplayName}. This passphrase never leaves
              your device.
            </Typography>
            <TextField
              label="Passphrase"
              type="password"
              value={passphraseInput}
              onChange={(e) => setPassphraseInput(e.target.value)}
              error={!!passphraseError}
              helperText={passphraseError}
              autoFocus
              fullWidth
            />
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => !passphraseBusy && setPassphraseDialogOpen(false)}
              disabled={passphraseBusy}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSavePassphrase}
              disabled={passphraseBusy}
              variant="contained"
            >
              Save
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    );
  }
);

export default EncryptedDirectChatDetails;
