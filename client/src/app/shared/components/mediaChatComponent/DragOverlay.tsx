import { Box, Typography } from "@mui/material";
import { AttachFile } from "@mui/icons-material";

interface DragOverlayProps {
  isDragActive: boolean;
}

export default function DragOverlay({ isDragActive }: DragOverlayProps) {
  if (!isDragActive) return null;

  return (
    <Box
      sx={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.7)",
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "white",
        width: "100%",
        height: "100%",
      }}
    >
      <Box textAlign="center">
        <AttachFile sx={{ fontSize: 64, mb: 2 }} />
        <Typography variant="h5">Drop files here to upload</Typography>
        <Typography variant="body2" sx={{ mt: 1 }}>
          Supports images, videos, audio, documents, code files, and archives
        </Typography>
      </Box>
    </Box>
  );
}
