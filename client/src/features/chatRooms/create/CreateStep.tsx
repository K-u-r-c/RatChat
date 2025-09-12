import { Box, Button, Stack, Typography, Alert, Avatar } from "@mui/material";
import {
  FormProvider,
  type UseFormReturn,
  type FieldValues,
} from "react-hook-form";
import TextInput from "../../../app/shared/components/TextInput";
import { useStore } from "../../../lib/hooks/useStore";
import { useCallback, useEffect, useRef, useState } from "react";
import { useDropzone } from "react-dropzone";
import Cropper, { type ReactCropperElement } from "react-cropper";
import "cropperjs/dist/cropper.css";

interface CreateStepProps<T extends FieldValues = FieldValues> {
  createForm: UseFormReturn<T>;
  onCreate: React.FormEventHandler<HTMLFormElement>;
  submitError: string | null;
  isPending: boolean;
  onCroppedImageChange?: (dataUrl: string | null) => void;
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
  const [croppedImage, setCroppedImage] = useState<string | null>(null);
  const cropperRef = useRef<ReactCropperElement>(null);

  const onDrop = useCallback((accepted: File[]) => {
    if (!accepted[0]) return;
    const file = accepted[0];
    const url = URL.createObjectURL(file);
    setPreview(url);
    setCroppedImage(null);
  }, []);

  useEffect(
    () => () => {
      if (preview) URL.revokeObjectURL(preview);
    },
    [preview]
  );

  useEffect(() => {
    onCroppedImageChange?.(croppedImage);
  }, [croppedImage, onCroppedImageChange]);

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    maxFiles: 1,
    accept: { "image/*": [".jpeg", ".jpg", ".png", ".gif", ".webp"] },
    maxSize: 5 * 1024 * 1024,
  });

  const handleCrop = () => {
    const cropper = cropperRef.current;
    if (cropper && cropper.cropper) {
      const dataUrl = cropper.cropper
        .getCroppedCanvas({ width: 256, height: 256 })
        .toDataURL();
      setCroppedImage(dataUrl);
    }
  };

  const handleReset = () => {
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);

    setCroppedImage(null);
  };

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
            <Avatar src={croppedImage} sx={{ width: 128, height: 128 }} />
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
                Crop
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
            disabled={isPending || (preview !== null && !croppedImage)}
          >
            {isPending ? "Creating..." : "Create"}
          </Button>
        </Stack>
      </Box>
    </FormProvider>
  );
};

export default CreateStep;
