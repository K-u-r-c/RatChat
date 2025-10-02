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
  const aspectRatio = isProfileImage ? 1 : 32 / 9;
  const category = isProfileImage
    ? MediaCategory.ProfileImage
    : MediaCategory.ProfileBackground;

  // Track if file is GIF and crop meta for non-destructive crop
  const isGif = selectedFile?.type === "image/gif";
  type CropMeta = { cx: number; cy: number; scale: number }; // cx, cy in [0..100], scale >= 1
  const [gifCrop, setGifCrop] = useState<CropMeta | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      setSelectedFile(file);
      const previewUrl = URL.createObjectURL(file);
      setPreview(previewUrl);

      // For GIFs, we will still show Cropper, but won't rasterize.
      // For non-GIFs, we wait for user to click Crop to produce a canvas crop.
      setGifCrop(null);
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

  // Compute non-destructive crop meta from Cropper
  const computeGifCropMeta = (): CropMeta | null => {
    const instance = cropperRef.current?.cropper;
    if (!instance) return null;

    const data = instance.getData(); // { x, y, width, height }
    const img = instance.getImageData(); // { naturalWidth, naturalHeight }
    if (!data || !img || !img.naturalWidth || !img.naturalHeight) return null;

    const iw = img.naturalWidth;
    const ih = img.naturalHeight;
    const cw = Math.max(1, data.width);
    const ch = Math.max(1, data.height);
    const cx = ((data.x + cw / 2) / iw) * 100; // center X in %
    const cy = ((data.y + ch / 2) / ih) * 100; // center Y in %
    const scale = iw / cw; // zoom factor (>= 1 when cropping in)

    return {
      cx: Math.max(0, Math.min(100, cx)),
      cy: Math.max(0, Math.min(100, cy)),
      scale: Math.max(1, scale),
    };
  };

  const handleCrop = () => {
    const instance = cropperRef.current?.cropper;
    if (!instance) return;

    if (isGif) {
      // Non-destructive crop: capture crop meta for CSS-based framing
      const meta = computeGifCropMeta();
      if (meta) {
        setGifCrop(meta);
        // Use original GIF preview for the visual confirmation step
        setCroppedImage(preview);
      }
      return;
    }

    // Raster crop for non-GIFs (as before)
    const croppedDataUrl = instance.getCroppedCanvas().toDataURL();
    setCroppedImage(croppedDataUrl);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    try {
      let fileToUpload: File | null = null;
      let mediaUrlOverride: string | null = null;

      if (isGif) {
        // Upload original GIF to preserve animation
        fileToUpload = selectedFile;

        // If user applied a crop, append non-destructive crop meta to URL
        // We encode it into mediaUrl query so no backend schema change is needed.
        // cx/cy are center in %, s is zoom factor.
        // Example: https://cdn/.../avatar.gif?cx=45.2&cy=52.7&s=1.35
      } else {
        // Upload rasterized cropped image
        if (!croppedImage) return;
        const res = await fetch(croppedImage);
        const blob = await res.blob();
        fileToUpload = new File(
          [blob],
          selectedFile?.name || `cropped-${imageType}.png`,
          { type: blob.type }
        );
      }

      if (!fileToUpload) return;

      const uploadResult = await uploadMedia.mutateAsync({
        file: fileToUpload,
        category,
      });

      // Optionally append crop meta for GIFs
      if (isGif && gifCrop) {
        const u = new URL(uploadResult.url, window.location.href);
        u.searchParams.set("cx", gifCrop.cx.toFixed(3));
        u.searchParams.set("cy", gifCrop.cy.toFixed(3));
        u.searchParams.set("s", gifCrop.scale.toFixed(4));
        mediaUrlOverride = u.toString();
      }

      await setProfileImage.mutateAsync({
        mediaUrl: mediaUrlOverride ?? uploadResult.url,
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
    setGifCrop(null);
    if (preview) {
      URL.revokeObjectURL(preview);
    }
  };

  const isUploading = uploadMedia.isPending || setProfileImage.isPending;
  const maxSize = isProfileImage ? "5MB" : "25MB";
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
              Recommended aspect ratio 32:9 (eg. 3840x1080)
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
              height: isProfileImage ? 320 : Math.round((700 * 9) / 32),
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
              {isGif ? "Apply crop" : "Crop"}
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
            // For GIFs, show a non-destructive crop preview using CSS background
            isGif ? (
              <Box
                sx={{
                  width: 200,
                  height: 200,
                  mx: "auto",
                  mb: 2,
                  borderRadius: "50%",
                  overflow: "hidden",
                  border: "1px solid",
                  borderColor: "grey.300",
                  backgroundImage: `url(${preview})`,
                  backgroundRepeat: "no-repeat",
                  backgroundSize: gifCrop
                    ? `${(gifCrop.scale * 100).toFixed(3)}% auto`
                    : "cover",
                  backgroundPosition: gifCrop
                    ? `${gifCrop.cx.toFixed(3)}% ${gifCrop.cy.toFixed(3)}%`
                    : "center",
                }}
              />
            ) : (
              <Avatar
                src={croppedImage}
                sx={{
                  width: 200,
                  height: 200,
                  mx: "auto",
                  mb: 2,
                }}
              />
            )
          ) : // Banner preview
          isGif ? (
            <Box
              sx={{
                width: "100%",
                aspectRatio: "32 / 9",
                borderRadius: 2,
                mb: 2,
                border: "1px solid",
                borderColor: "grey.300",
                overflow: "hidden",
                backgroundImage: `url(${preview})`,
                backgroundRepeat: "no-repeat",
                backgroundSize: gifCrop
                  ? `${(gifCrop.scale * 100).toFixed(3)}% auto`
                  : "cover",
                backgroundPosition: gifCrop
                  ? `${gifCrop.cx.toFixed(3)}% ${gifCrop.cy.toFixed(3)}%`
                  : "center",
              }}
            />
          ) : (
            <Box
              sx={{
                width: "100%",
                aspectRatio: "32 / 9",
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

          {isGif && (
            <Typography
              variant="caption"
              color="text.secondary"
              display="block"
              sx={{ mb: 1 }}
            >
              Animated GIFs are uploaded as-is. The crop is applied visually so
              the full animation plays.
            </Typography>
          )}

          <Box display="flex" gap={2} justifyContent="center">
            <Button
              variant="contained"
              onClick={handleUpload}
              disabled={isUploading || (isGif && !gifCrop)}
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
