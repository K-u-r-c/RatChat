import { Box, Button, Stack, Typography, Alert, Avatar } from "@mui/material";
import {
  FormProvider,
  type UseFormReturn,
  type FieldValues,
} from "react-hook-form";
import TextInput from "../../../app/shared/components/TextInput";
import { useStore } from "../../../lib/hooks/useStore";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDropzone } from "react-dropzone";
import Cropper, { type ReactCropperElement } from "react-cropper";
import "cropperjs/dist/cropper.css";
import {
  buildGifBackgroundStyles,
  type GifCropMeta,
} from "../utils/gifCrop";

export type CroppedChatRoomImage =
  | {
      kind: "gif";
      file: File;
      crop: GifCropMeta;
      previewUrl: string;
    }
  | {
      kind: "raster";
      dataUrl: string;
      name: string;
      mime: string;
    };

interface CreateStepProps<T extends FieldValues = FieldValues> {
  createForm: UseFormReturn<T>;
  onCreate: React.FormEventHandler<HTMLFormElement>;
  submitError: string | null;
  isPending: boolean;
  onCroppedImageChange?: (selection: CroppedChatRoomImage | null) => void;
}

const CreateStep = <T extends FieldValues>({
  createForm,
  onCreate,
  submitError,
  isPending,
  onCroppedImageChange,
}: CreateStepProps<T>) => {
  const { uiStore } = useStore();

  const [preview, setPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [croppedImage, setCroppedImage] = useState<string | null>(null);
  const [gifCrop, setGifCrop] = useState<GifCropMeta | null>(null);
  const [selection, setSelection] = useState<CroppedChatRoomImage | null>(null);
  const cropperRef = useRef<ReactCropperElement>(null);

  const isGif = selectedFile?.type === "image/gif";

  const onDrop = useCallback((accepted: File[]) => {
    if (!accepted[0]) return;
    const file = accepted[0];
    const url = URL.createObjectURL(file);
    setSelectedFile(file);
    setPreview(url);
    setCroppedImage(null);
    setGifCrop(null);
    setSelection(null);
  }, []);

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  useEffect(() => {
    onCroppedImageChange?.(selection);
  }, [selection, onCroppedImageChange]);

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    maxFiles: 1,
    accept: { "image/*": [".jpeg", ".jpg", ".png", ".gif", ".webp"] },
    maxSize: 5 * 1024 * 1024,
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
    if (!cropper || !preview || !selectedFile) return;

    if (isGif) {
      const meta = computeGifCropMeta();
      if (!meta) return;
      setGifCrop(meta);
      setCroppedImage(preview);
      setSelection({ kind: "gif", file: selectedFile, crop: meta, previewUrl: preview });
      return;
    }

    const dataUrl = cropper
      .getCroppedCanvas({ width: 256, height: 256 })
      .toDataURL();
    setCroppedImage(dataUrl);
    setSelection({
      kind: "raster",
      dataUrl,
      name: selectedFile.name ?? "chat-room-image.png",
      mime: selectedFile.type || "image/png",
    });
  };

  const handleReset = () => {
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    setSelectedFile(null);
    setCroppedImage(null);
    setGifCrop(null);
    setSelection(null);
    onCroppedImageChange?.(null);
  };

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

  const hasPendingSelection = preview !== null && !selection;

  return (
    <FormProvider {...createForm}>
      <Box component="form" onSubmit={onCreate}>
        {/* Image picker (Discord-like) */}
        <Box sx={{ display: "flex", justifyContent: "center", mb: 2 }}>
          {!preview && !croppedImage && (
            <Box
              {...getRootProps()}
              sx={{
                width: 128,
                height: 128,
                borderRadius: "50%",
                border: "2px dashed #5865f2",
                backgroundColor: "#ffffff14",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#A9A9B2",
                cursor: "pointer",
                position: "relative",
                userSelect: "none",
                transition: "background-color 150ms",
                "&:hover": { backgroundColor: "#ffffff22" },
              }}
            >
              <input {...getInputProps()} />
              <Box sx={{ textAlign: "center" }}>
                <Typography variant="caption" sx={{ display: "block" }}>
                  UPLOAD
                </Typography>
              </Box>
              <Box
                sx={{
                  position: "absolute",
                  right: 4,
                  top: 4,
                  width: 20,
                  height: 20,
                  borderRadius: "50%",
                  bgcolor: "#5865f2",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 16,
                  lineHeight: 1,
                }}
              >
                +
              </Box>
            </Box>
          )}
          {croppedImage && (
            isGif && gifPreviewStyles ? (
              <Box
                sx={{
                  width: 128,
                  height: 128,
                  borderRadius: "50%",
                  border: "2px solid rgba(255,255,255,0.15)",
                  overflow: "hidden",
                  ...gifPreviewStyles,
                }}
              />
            ) : (
              <Avatar src={croppedImage} sx={{ width: 128, height: 128 }} />
            )
          )}
        </Box>

        {preview && !croppedImage && (
          <Box sx={{ textAlign: "center", mb: 2 }}>
            <Cropper
              src={preview}
              style={{
                height: 260,
                width: "100%",
                maxWidth: 320,
                margin: "0 auto",
              }}
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
                disabled={isPending}
              >
                {isGif ? "Apply crop" : "Crop"}
              </Button>
              <Button
                variant="outlined"
                onClick={handleReset}
                disabled={isPending}
              >
                Cancel
              </Button>
            </Stack>
          </Box>
        )}

        <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
          Give your new chat room a name. You can change it later.
        </Typography>
        <Box sx={{ mx: "auto" }}>
          <TextInput label="Chat Room Name" name="title" autoFocus fullWidth />
        </Box>
        {preview && !croppedImage && (
          <Typography
            variant="caption"
            color="warning.main"
            sx={{ mt: 1, display: "block" }}
          >
            Please crop or cancel the selected image before creating.
          </Typography>
        )}
        {isGif && croppedImage && (
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ mt: 0.5, display: "block" }}
          >
            Animated GIFs upload as-is. The crop is applied visually so the animation remains intact.
          </Typography>
        )}
        {submitError && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {submitError}
          </Alert>
        )}
        <Stack direction="row" spacing={2} justifyContent="flex-end" mt={3}>
          <Button onClick={() => uiStore.backToChoose()} color="inherit">
            Back
          </Button>
          <Button
            type="submit"
            variant="contained"
            disableElevation
            disabled={isPending || hasPendingSelection}
          >
            {isPending ? "Creating..." : "Create"}
          </Button>
        </Stack>
      </Box>
    </FormProvider>
  );
};

export default CreateStep;
