import { useState, useCallback, useRef, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import {
  Box,
  Paper,
  Typography,
  Button,
  Avatar,
  CircularProgress,
  Stack,
} from "@mui/material";
import { CloudUpload, Delete, Crop } from "@mui/icons-material";
import Cropper, { type ReactCropperElement } from "react-cropper";
import "cropperjs/dist/cropper.css";
import { useAccount } from "../../lib/hooks/useAccount";
import { useChatRooms } from "../../lib/hooks/useChatRooms";
import { useChatRoomRolesRealtime } from "../../lib/hooks/useChatRoomRolesRealtime";
import { CHATROOM_PERMISSIONS } from "../../lib/types/chatroomPermissions";
import { MediaCategory, useMedia } from "../../lib/hooks/useMedia";

type Props = {
  chatRoomId: string;
};

export default function ChatRoomImageUpload({ chatRoomId }: Props) {
  const { currentUser } = useAccount();
  const { chatRoom, setChatRoomImage, deleteChatRoomImage } =
    useChatRooms(chatRoomId);
  const { rolesStore } = useChatRoomRolesRealtime(chatRoomId, currentUser?.id);
  const userPermissions = rolesStore?.userPermissions || {};
  const canEdit =
    chatRoom?.isAdmin ||
    !!userPermissions[CHATROOM_PERMISSIONS.ChangeChatRoomImage];

  const existingImage = chatRoom?.imageUrl || null;

  const { uploadMedia } = useMedia();

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

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxFiles: 1,
    accept: { "image/*": [".jpeg", ".jpg", ".png", ".gif", ".webp"] },
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

  const handleUpload = async () => {
    if (!croppedImage) return;
    try {
      const res = await fetch(croppedImage);
      const blob = await res.blob();
      const file = new File(
        [blob],
        selectedFile?.name || "chat-room-image.png",
        { type: blob.type }
      );

      const uploadResult = await uploadMedia.mutateAsync({
        file,
        category: MediaCategory.ChatRoomImage,
        chatRoomId,
      });

      await setChatRoomImage.mutateAsync({
        id: chatRoomId,
        imageUrl: uploadResult.url,
      });

      resetAll();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async () => {
    if (!existingImage) return;
    await deleteChatRoomImage.mutateAsync(chatRoomId);
  };

  const handleCancel = () => {
    resetAll();
  };

  const isUploading =
    uploadMedia.isPending ||
    setChatRoomImage.isPending ||
    deleteChatRoomImage.isPending;

  return (
    <Box sx={{ width: "100%" }}>
      {!preview && !croppedImage && (
        <Box
          sx={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            gap: 3,
          }}
        >
          <Box>
            {existingImage ? (
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  width: "100%",
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                  }}
                >
                  <Avatar
                    src={existingImage}
                    sx={{
                      width: 128,
                      height: 128,
                      borderRadius: 12,
                      border: "1px solid #5865f2ff",
                      backgroundColor: "#ffffff14",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      mb: 2,
                    }}
                    variant="rounded"
                  />
                  {canEdit && (
                    <Stack direction="row" spacing={1}>
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={handleDelete}
                        color="error"
                        disabled={deleteChatRoomImage.isPending}
                        startIcon={
                          deleteChatRoomImage.isPending ? (
                            <CircularProgress size={16} />
                          ) : (
                            <Delete />
                          )
                        }
                      >
                        Remove
                      </Button>
                    </Stack>
                  )}
                </Box>
              </Box>
            ) : (
              <Box
                sx={{
                  width: 128,
                  height: 128,
                  borderRadius: 12,
                  border: "1px solid #5865f2ff",
                  backgroundColor: "#ffffff14",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  mb: 2,
                }}
              >
                <Typography variant="caption" color="text.secondary">
                  No image
                </Typography>
              </Box>
            )}
          </Box>

          <Paper
            {...getRootProps()}
            sx={{
              p: 3,
              textAlign: "center",
              cursor: canEdit ? "pointer" : "not-allowed",
              border: "2px dashed",
              borderColor: isDragActive ? "primary.main" : "grey.700",
              bgcolor: "background.paper",
              backgroundImage:
                !canEdit && !existingImage
                  ? "repeating-linear-gradient(45deg,#2c2c2c,#2c2c2c 10px,#242424 10px,#242424 20px)"
                  : undefined,
              opacity: canEdit ? 1 : 0.6,
              minHeight: 180,
              width: "100%",
            }}
          >
            <input {...getInputProps()} />
            <CloudUpload sx={{ fontSize: 48, color: "grey.500", mb: 1 }} />
            <Typography variant="h6" gutterBottom>
              {canEdit
                ? "Drop or click to upload"
                : "You cannot change the image"}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              PNG / JPG / GIF / WEBP up to 5MB • 1:1 aspect
            </Typography>
          </Paper>
        </Box>
      )}

      {preview && !croppedImage && (
        <Box
          sx={{
            maxWidth: 360,
            mx: "auto",
            textAlign: "center",
            mt: 2,
          }}
        >
          <Cropper
            src={preview}
            style={{ height: 320, width: 320, margin: "0 auto" }}
            aspectRatio={1}
            guides={false}
            viewMode={1}
            background={false}
            responsive
            autoCropArea={1}
            ref={cropperRef}
          />
          <Stack direction="row" spacing={2} justifyContent="center" mt={2}>
            <Button
              variant="contained"
              onClick={handleCrop}
              startIcon={<Crop />}
              disabled={isUploading}
            >
              Crop
            </Button>
            <Button
              variant="outlined"
              onClick={handleCancel}
              startIcon={<Delete />}
              disabled={isUploading}
            >
              Cancel
            </Button>
          </Stack>
        </Box>
      )}

      {croppedImage && (
        <Box textAlign="center" mt={2}>
          <Avatar
            src={croppedImage}
            variant="rounded"
            sx={{ width: 160, height: 160, mx: "auto", mb: 2 }}
          />
          <Stack direction="row" spacing={2} justifyContent="center">
            <Button
              variant="contained"
              onClick={handleUpload}
              disabled={isUploading}
              startIcon={
                isUploading ? <CircularProgress size={18} /> : <CloudUpload />
              }
            >
              {isUploading ? "Uploading..." : "Upload"}
            </Button>
            <Button
              variant="outlined"
              onClick={handleCancel}
              startIcon={<Delete />}
              disabled={isUploading}
            >
              Cancel
            </Button>
          </Stack>
        </Box>
      )}
    </Box>
  );
}
