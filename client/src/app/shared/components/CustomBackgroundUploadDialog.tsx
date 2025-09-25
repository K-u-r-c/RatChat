import { useEffect, useMemo, useRef, useState } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  Typography,
} from "@mui/material";
import { Close, UploadFile } from "@mui/icons-material";
import { getChatBackgroundStyle } from "../constants/chatBackgrounds";

type CustomBackgroundUploadDialogProps = {
  open: boolean;
  onClose: () => void;
  onConfirm: (file: File) => Promise<void> | void;
  isUploading?: boolean;
};

type PreviewDefinition = {
  key: string;
  label: string;
  aspectRatio: string;
};

const PREVIEWS: PreviewDefinition[] = [
  { key: "landscape", label: "Landscape 16:9", aspectRatio: "16 / 9" },
  { key: "standard", label: "Standard 4:3", aspectRatio: "4 / 3" },
  { key: "portrait", label: "Portrait 9:16", aspectRatio: "9 / 16" },
];

export function CustomBackgroundUploadDialog({
  open,
  onClose,
  onConfirm,
  isUploading = false,
}: CustomBackgroundUploadDialogProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setSelectedFile(null);
      setPreviewUrl(null);
    }
  }, [open]);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const backgroundPreviewStyle = useMemo(() => {
    if (!previewUrl) {
      return null;
    }

    return getChatBackgroundStyle("custom", previewUrl);
  }, [previewUrl]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    const objectUrl = URL.createObjectURL(file);
    setSelectedFile(file);
    setPreviewUrl(objectUrl);
    event.target.value = "";
  };

  const handleChooseClick = () => {
    fileInputRef.current?.click();
  };

  const handleConfirm = () => {
    if (!selectedFile || isUploading) {
      return;
    }

    void onConfirm(selectedFile);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="md"
      aria-labelledby="custom-background-upload"
    >
      <DialogTitle id="custom-background-upload" sx={{ pr: 6 }}>
        Upload custom background
        <IconButton
          onClick={onClose}
          size="small"
          sx={{ position: "absolute", right: 12, top: 12 }}
          aria-label="Close"
        >
          <Close fontSize="small" />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        <Stack spacing={3}>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems="flex-start">
            <Button
              variant="contained"
              startIcon={<UploadFile />}
              onClick={handleChooseClick}
              disabled={isUploading}
            >
              {selectedFile ? "Choose a different image" : "Select an image"}
            </Button>
            {selectedFile && (
              <Box>
                <Typography variant="subtitle2">Selected file</Typography>
                <Typography variant="body2" color="text.secondary">
                  {selectedFile.name} ({(selectedFile.size / (1024 * 1024)).toFixed(2)} MB)
                </Typography>
              </Box>
            )}
          </Stack>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            hidden
            onChange={handleFileChange}
          />

          <Box>
            <Typography variant="subtitle2" gutterBottom>
              Preview
            </Typography>
            {!previewUrl ? (
              <Box
                sx={{
                  border: "1px dashed",
                  borderColor: "divider",
                  borderRadius: 2,
                  p: 3,
                  textAlign: "center",
                  color: "text.secondary",
                }}
              >
                Select an image to preview how it will appear across chat layouts.
              </Box>
            ) : (
              <Stack spacing={2}>
                {PREVIEWS.map(({ key, label, aspectRatio }) => (
                  <Box key={key}>
                    <Typography variant="caption" color="text.secondary">
                      {label}
                    </Typography>
                    <Box
                      sx={{
                        mt: 0.5,
                        borderRadius: 2,
                        overflow: "hidden",
                        border: "1px solid",
                        borderColor: "rgba(255,255,255,0.12)",
                        position: "relative",
                        aspectRatio,
                        backgroundColor: "rgba(255,255,255,0.04)",
                        ...(backgroundPreviewStyle ?? {}),
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                        backgroundRepeat: "no-repeat",
                      }}
                    >
                      <Box
                        sx={{
                          position: "absolute",
                          inset: 0,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          bgcolor: "rgba(0,0,0,0.12)",
                          mixBlendMode: "soft-light",
                        }}
                      />
                    </Box>
                  </Box>
                ))}
              </Stack>
            )}
          </Box>

          <Typography variant="body2" color="text.secondary">
            Tip: Use images at least 1600x900 for best results. Wide images will be
            cropped on portrait screens, and tall images will be cropped on landscape screens.
          </Typography>
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={isUploading}>
          Cancel
        </Button>
        <Button
          onClick={handleConfirm}
          variant="contained"
          disabled={!selectedFile || isUploading}
        >
          {isUploading ? "Uploading..." : "Upload and use"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
