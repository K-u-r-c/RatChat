import { Box, IconButton, Typography } from "@mui/material";
import { Close, InsertDriveFile, Code, Archive } from "@mui/icons-material";

interface FilePreviewProps {
  file: File;
  preview: string;
  onRemove: () => void;
  type: "selected" | "pasted";
}

export function FilePreview({
  file,
  preview,
  onRemove,
  type,
}: FilePreviewProps) {
  const getFileIcon = (file: File) => {
    const extension = file.name.toLowerCase().split(".").pop() || "";

    const codeExtensions = [
      "js",
      "ts",
      "tsx",
      "jsx",
      "py",
      "java",
      "cs",
      "cpp",
      "c",
      "h",
      "hpp",
      "php",
      "rb",
      "go",
      "rs",
      "swift",
      "kt",
      "scala",
      "yml",
      "yaml",
      "json",
      "xml",
      "html",
      "css",
      "md",
      "sql",
      "sh",
      "bat",
      "ps1",
      "dockerfile",
    ];

    const archiveExtensions = ["zip", "rar", "7z", "gz", "tar", "bz2"];

    if (codeExtensions.includes(extension)) {
      return <Code color="primary" />;
    }

    if (archiveExtensions.includes(extension)) {
      return <Archive color="secondary" />;
    }

    return <InsertDriveFile color="primary" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const borderColor = type === "pasted" ? "primary.main" : "secondary.main";
  const emoji = type === "pasted" ? "📷" : "📎";
  const label = type === "pasted" ? "Image ready to send" : file.name;

  return (
    <Box
      sx={{
        mb: 2,
        p: 2,
        border: "2px solid",
        borderColor,
        borderRadius: 2,
        backgroundColor: "background.paper",
        display: "flex",
        alignItems: "center",
        gap: 2,
      }}
    >
      {file.type.startsWith("image/") ? (
        <img
          src={preview}
          alt="File preview"
          style={{
            width: 60,
            height: 60,
            objectFit: "cover",
            borderRadius: 8,
          }}
        />
      ) : (
        <Box
          sx={{
            width: 60,
            height: 60,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "grey.200",
            borderRadius: 2,
          }}
        >
          {getFileIcon(file)}
        </Box>
      )}
      <Box sx={{ flex: 1 }}>
        <Typography variant="body2" fontWeight="bold">
          {emoji} {label}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {formatFileSize(file.size)} • Add text below or press Enter to send
        </Typography>
      </Box>
      <IconButton
        onClick={onRemove}
        size="small"
        color="error"
        title="Remove file"
      >
        <Close />
      </IconButton>
    </Box>
  );
}
