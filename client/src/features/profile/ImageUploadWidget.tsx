import { useState, useCallback, useRef } from "react";
import { useDropzone } from "react-dropzone";
import {
  Box,
  Button,
  Typography,
  Paper,
  Avatar,
  CircularProgress,
} from "@mui/material";
import { CloudUpload, Delete, Crop } from "@mui/icons-material";
import { useMedia, MediaCategory } from "../../lib/hooks/useMedia";
import { useProfiles } from "../../lib/hooks/useProfiles";
import Cropper, { type ReactCropperElement } from "react-cropper";
import "cropperjs/dist/cropper.css";
import { useAccount } from "../../lib/hooks/useAccount";

type Props = {
  onUploadComplete: () => void;
  imageType: "profile" | "banner";
};

export default function ImageUploadWidget({
  onUploadComplete,
  imageType,
}: Props) {
  const { currentUser } = useAccount();
  const [preview, setPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [croppedImage, setCroppedImage] = useState<string | null>(null);
  const cropperRef = useRef<ReactCropperElement>(null);
  const { uploadMedia } = useMedia();
  const { setProfileImage } = useProfiles();

  const isProfileImage = imageType === "profile";
  const aspectRatio = isProfileImage ? 1 : 16 / 9;
  const category = isProfileImage
    ? MediaCategory.ProfileImage
    : MediaCategory.ProfileBackground;

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      setSelectedFile(file);
      const previewUrl = URL.createObjectURL(file);
      setPreview(previewUrl);
      setCroppedImage(null);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".jpeg", ".jpg", ".png", ".gif", ".webp"],
    },
    maxFiles: 1,
    maxSize: isProfileImage ? 5 * 1024 * 1024 : 25 * 1024 * 1024, // 5MB for profile, 25MB for banner
  });

  const handleCrop = () => {
    const cropper = cropperRef.current;
    if (cropper && cropper.cropper) {
      const croppedDataUrl = cropper.cropper.getCroppedCanvas().toDataURL();
      setCroppedImage(croppedDataUrl);
    }
  };

  const handleUpload = async () => {
    if (!croppedImage) return;

    try {
      const res = await fetch(croppedImage);
      const blob = await res.blob();
      const file = new File(
        [blob],
        selectedFile?.name || `cropped-${imageType}.png`,
        {
          type: blob.type,
        }
      );

      const uploadResult = await uploadMedia.mutateAsync({
        file,
        category,
      });

      await setProfileImage.mutateAsync({
        mediaUrl: uploadResult.url,
        publicId: uploadResult.publicId,
        imageType,
        userId: currentUser?.id ?? "",
      });

      onUploadComplete();
    } catch (error) {
      console.error("Upload failed:", error);
    }
  };

  const handleCancel = () => {
    setPreview(null);
    setSelectedFile(null);
    setCroppedImage(null);
    if (preview) {
      URL.revokeObjectURL(preview);
    }
  };

  const isUploading = uploadMedia.isPending || setProfileImage.isPending;
  const maxSize = isProfileImage ? "5MB" : "10MB";
  const title = isProfileImage ? "profile photo" : "banner";

  return (
    <Box>
      {!preview ? (
        <Paper
          {...getRootProps()}
          sx={{
            p: 3,
            textAlign: "center",
            cursor: "pointer",
            border: "2px dashed",
            borderColor: isDragActive ? "primary.main" : "grey.300",
            backgroundColor: isDragActive ? "action.hover" : "background.paper",
            "&:hover": {
              backgroundColor: "action.hover",
            },
            minHeight: isProfileImage ? 200 : 150,
          }}
        >
          <input {...getInputProps()} />
          <CloudUpload sx={{ fontSize: 48, color: "grey.400", mb: 1 }} />
          <Typography variant="h6" gutterBottom>
            Drop your {title} here
          </Typography>
          <Typography variant="body2" color="text.secondary">
            or click to select a file
          </Typography>
          <Typography variant="caption" display="block" sx={{ mt: 1 }}>
            Accepted formats: JPEG, PNG, GIF, WebP (max {maxSize})
          </Typography>
          {!isProfileImage && (
            <Typography variant="caption" display="block" color="primary">
              Recommended size: 1920 x 1080 pixels
            </Typography>
          )}
        </Paper>
      ) : !croppedImage ? (
        <Box
          textAlign="center"
          sx={{
            width: isProfileImage ? 320 : 700,
            mx: "auto",
            mb: 2,
            maxWidth: "100%",
          }}
        >
          <Cropper
            src={preview}
            style={{
              height: isProfileImage ? 320 : 400,
              width: isProfileImage ? 320 : 700,
              margin: "0 auto",
            }}
            aspectRatio={aspectRatio}
            guides={false}
            viewMode={1}
            background={false}
            responsive={true}
            autoCropArea={1}
            ref={cropperRef}
          />
          <Box display="flex" gap={2} justifyContent="center" mt={2}>
            <Button
              variant="contained"
              onClick={handleCrop}
              startIcon={<Crop />}
            >
              Crop
            </Button>
            <Button
              variant="outlined"
              onClick={handleCancel}
              startIcon={<Delete />}
            >
              Cancel
            </Button>
          </Box>
        </Box>
      ) : (
        <Box textAlign="center">
          {isProfileImage ? (
            <Avatar
              src={croppedImage}
              sx={{
                width: 200,
                height: 200,
                mx: "auto",
                mb: 2,
              }}
            />
          ) : (
            <Box
              sx={{
                width: "100%",
                height: 200,
                backgroundImage: `url(${croppedImage})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                borderRadius: 2,
                mb: 2,
                border: "1px solid",
                borderColor: "grey.300",
              }}
            />
          )}
          <Box display="flex" gap={2} justifyContent="center">
            <Button
              variant="contained"
              onClick={handleUpload}
              disabled={isUploading}
              startIcon={
                isUploading ? <CircularProgress size={20} /> : <CloudUpload />
              }
            >
              {isUploading ? "Uploading..." : "Upload"}
            </Button>
            <Button
              variant="outlined"
              onClick={handleCancel}
              disabled={isUploading}
              startIcon={<Delete />}
            >
              Cancel
            </Button>
          </Box>
        </Box>
      )}
    </Box>
  );
}
