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
import {type KeyboardEvent, useCallback, useEffect, useMemo, useRef, useState,} from "react";
import Cropper, {type ReactCropperElement} from "react-cropper";
import "cropperjs/dist/cropper.css";
import {useDropzone} from "react-dropzone";
import {useAccount} from "../../lib/hooks/useAccount";
import {useChatRoomRolesRealtime} from "../../lib/hooks/useChatRoomRolesRealtime";
import {useChatRooms} from "../../lib/hooks/useChatRooms";
import {MediaCategory, useMedia} from "../../lib/hooks/useMedia";
import {CHATROOM_PERMISSIONS} from "../../lib/types/chatroomPermissions";
import {appendGifCropToUrl, buildGifBackgroundStyles, type GifCropMeta, parseGifCropFromUrl,} from "./utils/gifCrop";

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
  const [gifCrop, setGifCrop] = useState<GifCropMeta | null>(null);
  const cropperRef = useRef<ReactCropperElement>(null);

  const isGif = selectedFile?.type === "image/gif";

  const existingGifCrop = useMemo(() => {
    if (!existingImage) return null;
    const lower = existingImage.toLowerCase();
    if (!lower.includes(".gif")) return null;
    return parseGifCropFromUrl(existingImage);
  }, [existingImage]);

  const onDrop = useCallback((accepted: File[]) => {
    if (!accepted[0]) return;
    const file = accepted[0];
    const url = URL.createObjectURL(file);
    setSelectedFile(file);
    setPreview(url);
    setCroppedImage(null);
    setGifCrop(null);
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

  const computeGifCropMeta = (): GifCropMeta | null => {
    const cropper = cropperRef.current?.cropper;
    if (!cropper) return null;

    const data = cropper.getData();
    const imageData = cropper.getImageData();

    if (!data || !imageData?.naturalWidth || !imageData?.naturalHeight)
      return null;

    const iw = imageData.naturalWidth;
    const ih = imageData.naturalHeight;
    const cw = Math.max(1, data.width);
    const ch = Math.max(1, data.height);

    const cx = ((data.x + cw / 2) / iw) * 100;
    const cy = ((data.y + ch / 2) / ih) * 100;
    const scale = iw / cw;

    return {
      cx: Math.max(0, Math.min(100, cx)),
      cy: Math.max(0, Math.min(100, cy)),
      scale: Math.max(1, scale),
    };
  };

  const handleCrop = () => {
    const cropper = cropperRef.current?.cropper;
    if (!cropper) return;

    if (isGif) {
      const meta = computeGifCropMeta();
      if (meta && preview && selectedFile) {
        setGifCrop(meta);
        setCroppedImage(preview);
      }
      return;
    }

    const dataUrl = cropper.getCroppedCanvas().toDataURL();
    setCroppedImage(dataUrl);
  };

  const resetAll = () => {
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    setSelectedFile(null);
    setCroppedImage(null);
    setGifCrop(null);
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
    if (isGif) {
      if (!selectedFile) return;
      try {
        const uploadResult = await uploadMedia.mutateAsync({
          file: selectedFile,
          category: MediaCategory.ChatRoomImage,
          chatRoomId,
        });

        const imageUrl = gifCrop
          ? appendGifCropToUrl(uploadResult.url, gifCrop)
          : uploadResult.url;

        await setChatRoomImageMutation.mutateAsync({
          id: chatRoomId,
          imageUrl,
        });

        handleCloseDialog();
      } catch (e) {
        if (import.meta.env.DEV) console.error(e);
      }
      return;
    }

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

  const canUpload = isGif ? !!gifCrop : !!croppedImage;

  const gifPreviewStyles = useMemo(() => {
    if (!isGif || !preview) return undefined;
    if (gifCrop) return buildGifBackgroundStyles(preview, gifCrop);
    return {
      backgroundImage: `url(${preview})`,
      backgroundRepeat: "no-repeat",
      backgroundSize: "cover",
      backgroundPosition: "center",
    } as const;
  }, [gifCrop, isGif, preview]);

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
              overflow: "hidden",
            }}
          >
            {existingImage ? (
              existingGifCrop ? (
                <Box
                  sx={{
                    width: "100%",
                    height: "100%",
                    borderRadius: 4,
                    ...buildGifBackgroundStyles(existingImage, existingGifCrop),
                  }}
                />
              ) : (
                <Avatar
                  src={existingImage}
                  variant="rounded"
                  sx={{width: 128, height: 128, borderRadius: 4}}
                />
              )
            ) : (
              <Paper
                elevation={0}
                sx={{
                  width: "100%",
                  height: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  bgcolor: "background.paper",
                  color: "text.secondary",
                }}
              >
                <Edit/>
              </Paper>
            )}
            {canEdit && (
              <Box
                sx={{
                  position: "absolute",
                  inset: 0,
                  bgcolor: "rgba(0,0,0,0.4)",
                  opacity: 0,
                  transition: "opacity 150ms ease-in-out",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#fff",
                  fontWeight: 600,
                  "&:hover": {opacity: 1},
                }}
              >
                Change
              </Box>
            )}
          </Box>
        </Tooltip>

        <Stack spacing={1}>
          <Typography variant="h6">Chat Room Image</Typography>
          <Typography variant="body2" color="text.secondary">
            Recommended 1:1 ratio, up to 5MB. Animated GIFs supported.
          </Typography>
          {existingImage && canEdit && (
            <Stack direction="row" spacing={1}>
              <Button
                variant="contained"
                size="small"
                onClick={handleOpenDialog}
                disabled={isUploading}
                startIcon={<Edit/>}
              >
                Update
              </Button>
              <Button
                variant="outlined"
                size="small"
                color="error"
                onClick={handleDelete}
                disabled={isUploading}
                startIcon={
                  deleteChatRoomImageMutation.isPending ? (
                    <CircularProgress size={14}/>
                  ) : (
                    <Delete/>
                  )
                }
              >
                Remove
              </Button>
            </Stack>
          )}
        </Stack>
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
              {isGif && gifPreviewStyles ? (
                <Box
                  sx={{
                    width: 160,
                    height: 160,
                    mx: "auto",
                    borderRadius: 2,
                    border: "1px solid",
                    borderColor: "grey.700",
                    overflow: "hidden",
                    ...gifPreviewStyles,
                  }}
                />
              ) : (
                <Avatar
                  src={croppedImage}
                  variant="rounded"
                  sx={{width: 160, height: 160, mx: "auto"}}
                />
              )}
              <Typography variant="body2" color="text.secondary" mt={2}>
                Looks good? Upload to save changes.
              </Typography>
              {isGif && (
                <Typography
                  variant="caption"
                  color="text.secondary"
                  display="block"
                  mt={1}
                >
                  Animated GIFs upload as-is. Crop is applied visually so the
                  animation stays intact.
                </Typography>
              )}
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
              {isGif ? "Apply crop" : "Crop"}
            </Button>
          )}
          {canUpload && (
            <Button
              variant="contained"
              onClick={handleUpload}
              disabled={isUploading || (isGif ? !gifCrop : !croppedImage)}
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