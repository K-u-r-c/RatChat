import {Close} from "@mui/icons-material";
import {Box, Chip, IconButton, LinearProgress, Typography,} from "@mui/material";

type PreviewItem = {
  id: string;
  file: File;
  kind: "image" | "video" | "audio" | "other";
  preview?: string | null;
};

type Props = {
  items: PreviewItem[];
  totalSize: number;
  maxTotalSize: number;
  onRemove: (id: string) => void;
  onClearAll: () => void;
};

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

export default function MultiFilePreview(
  {
    items,
    totalSize,
    maxTotalSize,
    onRemove,
    onClearAll,
  }: Props) {
  const images = items.filter((i) => i.kind === "image");
  const videos = items.filter((i) => i.kind === "video");
  const others = items.filter((i) => i.kind !== "image" && i.kind !== "video");

  const percent = Math.min(100, Math.round((totalSize / maxTotalSize) * 100));

  return (
    <Box
      sx={{
        p: 2,
        backgroundColor: "background.default",
      }}
    >
      <Box sx={{display: "flex", alignItems: "center", gap: 1, mb: 1}}>
        <Typography variant="body2" fontWeight={700}>
          Selected files: {items.length} ({formatFileSize(totalSize)} /{" "}
          {formatFileSize(maxTotalSize)})
        </Typography>
        <Box sx={{flex: 1}}/>
        <Chip label="Clear all" size="small" onClick={onClearAll}/>
      </Box>
      <LinearProgress variant="determinate" value={percent} sx={{mb: 2}}/>

      {images.length > 0 && (
        <Box sx={{mb: 2}}>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{display: "block", mb: 1}}
          >
            Images
          </Typography>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(80px, 1fr))",
              gap: 1,
            }}
          >
            {images.map((i) => (
              <Box key={i.id} sx={{position: "relative"}}>
                <img
                  src={i.preview || ""}
                  alt={i.file.name}
                  style={{
                    width: "100%",
                    height: 80,
                    objectFit: "cover",
                    borderRadius: 8,
                  }}
                />
                <IconButton
                  size="small"
                  color="error"
                  onClick={() => onRemove(i.id)}
                  sx={{
                    position: "absolute",
                    top: 2,
                    right: 2,
                    bgcolor: "background.paper",
                  }}
                >
                  <Close fontSize="small"/>
                </IconButton>
              </Box>
            ))}
          </Box>
        </Box>
      )}

      {videos.length > 0 && (
        <Box sx={{mb: 2}}>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{display: "block", mb: 1}}
          >
            Videos
          </Typography>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))",
              gap: 1,
            }}
          >
            {videos.map((i) => (
              <Box key={i.id} sx={{position: "relative"}}>
                <video
                  src={i.preview || ""}
                  muted
                  controls
                  style={{width: "100%", height: 100, borderRadius: 8}}
                />
                <IconButton
                  size="small"
                  color="error"
                  onClick={() => onRemove(i.id)}
                  sx={{
                    position: "absolute",
                    top: 2,
                    right: 2,
                    bgcolor: "background.paper",
                  }}
                >
                  <Close fontSize="small"/>
                </IconButton>
              </Box>
            ))}
          </Box>
        </Box>
      )}

      {others.length > 0 && (
        <Box>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{display: "block", mb: 1}}
          >
            Other files
          </Typography>
          <Box sx={{display: "flex", flexDirection: "column", gap: 1}}>
            {others.map((i) => (
              <Box
                key={i.id}
                sx={{
                  p: 1,
                  border: "1px solid",
                  borderColor: "divider",
                  borderRadius: 1,
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                }}
              >
                <Typography variant="body2" sx={{flex: 1}}>
                  {i.file.name} ({formatFileSize(i.file.size)})
                </Typography>
                <IconButton
                  size="small"
                  color="error"
                  onClick={() => onRemove(i.id)}
                  title="Remove"
                >
                  <Close fontSize="small"/>
                </IconButton>
              </Box>
            ))}
          </Box>
        </Box>
      )}

      <Typography
        variant="caption"
        color="text.secondary"
        sx={{display: "block", mt: 2}}
      >
        Add a message below and press Enter to send all.
      </Typography>
    </Box>
  );
}
