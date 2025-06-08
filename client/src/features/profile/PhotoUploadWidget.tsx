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
};

export default function PhotoUploadWidget({ onUploadComplete }: Props) {
  const { currentUser } = useAccount();
  const [preview, setPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [croppedImage, setCroppedImage] = useState<string | null>(null);
  const cropperRef = useRef<ReactCropperElement>(null);
  const { uploadMedia } = useMedia();
  const { setMainPhoto } = useProfiles();

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
    maxSize: 5 * 1024 * 1024, // 5MB
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
      const file = new File([blob], selectedFile?.name || "cropped-image.png", {
        type: blob.type,
      });

      const uploadResult = await uploadMedia.mutateAsync({
        file,
        category: MediaCategory.ProfileImage,
      });

      await setMainPhoto.mutateAsync({
        mediaUrl: uploadResult.url,
        publicId: uploadResult.publicId,
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

  const isUploading = uploadMedia.isPending || setMainPhoto.isPending;

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
          }}
        >
          <input {...getInputProps()} />
          <CloudUpload sx={{ fontSize: 48, color: "grey.400", mb: 1 }} />
          <Typography variant="h6" gutterBottom>
            Drop your image here
          </Typography>
          <Typography variant="body2" color="text.secondary">
            or click to select a file
          </Typography>
          <Typography variant="caption" display="block" sx={{ mt: 1 }}>
            Accepted formats: JPEG, PNG, GIF, WebP (max 5MB)
          </Typography>
        </Paper>
      ) : !croppedImage ? (
        <Box textAlign="center">
          <Cropper
            src={preview}
            style={{ height: 300, width: "100%" }}
            aspectRatio={1}
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
          <Avatar
            src={croppedImage}
            sx={{
              width: 200,
              height: 200,
              mx: "auto",
              mb: 2,
            }}
          />
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
