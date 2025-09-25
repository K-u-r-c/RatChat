import {Close, CloudUpload, Crop, Delete, Edit} from "@mui/icons-material";
import {
  Avatar,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Paper,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import {type KeyboardEvent, useCallback, useEffect, useRef, useState,} from "react";
import Cropper, {type ReactCropperElement} from "react-cropper";
import "cropperjs/dist/cropper.css";
import {useDropzone} from "react-dropzone";
import {useAccount} from "../../lib/hooks/useAccount";
import {useChatRoomRolesRealtime} from "../../lib/hooks/useChatRoomRolesRealtime";
import {useChatRooms} from "../../lib/hooks/useChatRooms";
import {MediaCategory, useMedia} from "../../lib/hooks/useMedia";
import {CHATROOM_PERMISSIONS} from "../../lib/types/chatroomPermissions";

type Props = {
  chatRoomId: string;
};

export default function ChatRoomImageUpload({chatRoomId}: Props) {
  const {currentUser} = useAccount();
  const {
    chatRoom,
    setChatRoomImage: setChatRoomImageMutation,
    deleteChatRoomImage: deleteChatRoomImageMutation,
  } = useChatRooms(chatRoomId);
  const {rolesStore} = useChatRoomRolesRealtime(chatRoomId, currentUser?.id);
  const userPermissions = rolesStore?.userPermissions || {};
  const canEdit =
    chatRoom?.isOwner ||
    !!userPermissions[CHATROOM_PERMISSIONS.ChangeChatRoomImage];

  const existingImage = chatRoom?.imageUrl || null;

  const {uploadMedia} = useMedia();

  const [isDialogOpen, setDialogOpen] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [croppedImage, setCroppedImage] = useState<string | null>(null);
  const cropperRef = useRef<ReactCropperElement>(null);

  const onDrop = useCallback((accepted: File[]) => {
    if (!accepted[0]) return;
    const file = accepted[0];
    const url = URL.createObjectURL(file);
    setSelectedFile(file);
    setPreview(url);
    setCroppedImage(null);
  }, []);

  useEffect(
    () => () => {
      if (preview) URL.revokeObjectURL(preview);
    },
    [preview]
  );

  const {getRootProps, getInputProps, isDragActive} = useDropzone({
    onDrop,
    maxFiles: 1,
    accept: {"image/*": [".jpeg", ".jpg", ".png", ".gif", ".webp"]},
    maxSize: 5 * 1024 * 1024,
    disabled: !canEdit,
  });

  const handleCrop = () => {
    const cropper = cropperRef.current;
    if (cropper && cropper.cropper) {
      const dataUrl = cropper.cropper.getCroppedCanvas().toDataURL();
      setCroppedImage(dataUrl);
    }
  };

  const resetAll = () => {
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    setSelectedFile(null);
    setCroppedImage(null);
  };

  const handleOpenDialog = () => {
    if (!canEdit) return;
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    resetAll();
  };

  const handleAvatarKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!canEdit) return;
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handleOpenDialog();
    }
  };

  const handleUpload = async () => {
    if (!croppedImage) return;
    try {
      const res = await fetch(croppedImage);
      const blob = await res.blob();
      const file = new File(
        [blob],
        selectedFile?.name || "chat-room-image.png",
        {type: blob.type}
      );

      const uploadResult = await uploadMedia.mutateAsync({
        file,
        category: MediaCategory.ChatRoomImage,
        chatRoomId,
      });

      await setChatRoomImageMutation.mutateAsync({
        id: chatRoomId,
        imageUrl: uploadResult.url,
      });

      handleCloseDialog();
    } catch (e) {
      if (import.meta.env.DEV) console.error(e);
    }
  };

  const handleDelete = async () => {
    if (!existingImage) return;
    await deleteChatRoomImageMutation.mutateAsync(chatRoomId);
  };

  const isUploading =
    uploadMedia.isPending ||
    setChatRoomImageMutation.isPending ||
    deleteChatRoomImageMutation.isPending;

  return (
    <Box sx={{width: "100%"}}>
      <Stack direction="row" spacing={2} alignItems="center">
        <Tooltip
          title={canEdit ? "Change image" : ""}
          disableHoverListener={!canEdit}
          sx={{
            borderRadius: 4,
          }}
        >
          <Box
            onClick={handleOpenDialog}
            onKeyDown={handleAvatarKeyDown}
            role={canEdit ? "button" : undefined}
            tabIndex={canEdit ? 0 : -1}
            sx={{
              position: "relative",
              width: 128,
              height: 128,
              borderRadius: 4,
              cursor: canEdit ? "pointer" : "default",
              outline: "none",
              "&:hover .editOverlay": {opacity: canEdit ? 1 : 0},
              "&:focus-visible .editOverlay": {opacity: canEdit ? 1 : 0},
            }}
          >
            <Avatar
              src={existingImage ?? undefined}
              variant="rounded"
              sx={{
                width: "100%",
                height: "100%",
                borderRadius: "inherit",
                border: "1px solid #5865f2ff",
                backgroundColor: "#ffffff14",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 12,
                color: "text.secondary",
              }}
            >
              {!existingImage && "No image"}
            </Avatar>
            {canEdit && (
              <Box
                className="editOverlay"
                sx={{
                  position: "absolute",
                  inset: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  bgcolor: "rgba(0,0,0,0.55)",
                  borderRadius: 4,
                  opacity: 0,
                  transition: "opacity 0.2s ease",
                  pointerEvents: "none",
                }}
              >
                <Edit sx={{color: "common.white", fontSize: 32}}/>
              </Box>
            )}
          </Box>
        </Tooltip>
        {canEdit && existingImage && (
          <Button
            size="small"
            variant="outlined"
            onClick={handleDelete}
            color="error"
            disabled={deleteChatRoomImageMutation.isPending}
            startIcon={
              deleteChatRoomImageMutation.isPending ? (
                <CircularProgress size={16}/>
              ) : (
                <Delete/>
              )
            }
          >
            Remove
          </Button>
        )}
      </Stack>

      <Dialog
        open={isDialogOpen}
        onClose={handleCloseDialog}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle sx={{pr: 5}}>
          Update chat room image
          <IconButton
            aria-label="Close"
            onClick={handleCloseDialog}
            sx={{position: "absolute", right: 8, top: 8}}
            size="small"
          >
            <Close/>
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {!preview && !croppedImage && (
            <Paper
              {...getRootProps()}
              sx={{
                p: 4,
                textAlign: "center",
                cursor: "pointer",
                border: "2px dashed",
                borderColor: isDragActive ? "primary.main" : "grey.700",
                bgcolor: "background.paper",
              }}
            >
              <input {...getInputProps()} />
              <CloudUpload sx={{fontSize: 48, color: "grey.500", mb: 2}}/>
              <Typography variant="h6" gutterBottom>
                Drop or click to upload
              </Typography>
              <Typography variant="body2" color="text.secondary">
                PNG / JPG / GIF / WEBP up to 5MB - 1:1 aspect
              </Typography>
            </Paper>
          )}

          {preview && !croppedImage && (
            <Box
              sx={{
                maxWidth: 360,
                mx: "auto",
                textAlign: "center",
              }}
            >
              <Cropper
                src={preview}
                style={{height: 320, width: 320, margin: "0 auto"}}
                aspectRatio={1}
                guides={false}
                viewMode={1}
                background={false}
                responsive
                autoCropArea={1}
                ref={cropperRef}
              />
            </Box>
          )}

          {croppedImage && (
            <Box textAlign="center" mt={1}>
              <Avatar
                src={croppedImage}
                variant="rounded"
                sx={{width: 160, height: 160, mx: "auto"}}
              />
              <Typography variant="body2" color="text.secondary" mt={2}>
                Looks good? Upload to save changes.
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{gap: 1}}>
          <Button onClick={handleCloseDialog} disabled={isUploading}>
            Close
          </Button>
          {(preview || croppedImage) && (
            <Button onClick={resetAll} disabled={isUploading}>
              Clear selection
            </Button>
          )}
          {preview && !croppedImage && (
            <Button
              variant="contained"
              onClick={handleCrop}
              startIcon={<Crop/>}
              disabled={isUploading}
            >
              Crop
            </Button>
          )}
          {croppedImage && (
            <Button
              variant="contained"
              onClick={handleUpload}
              disabled={isUploading}
              startIcon={
                isUploading ? <CircularProgress size={18}/> : <CloudUpload/>
              }
            >
              {isUploading ? "Uploading..." : "Upload"}
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
}
