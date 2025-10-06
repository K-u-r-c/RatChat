import { Box, Typography } from "@mui/material";

type Props = {
  isOwn: boolean;
  onClick?: () => void;
  replyToDisplayName?: string | null;
  replyToBody?: string | null;
  replyToType?: string | null;
  replyToMediaOriginalFileName?: string | null;
};

export default function ReplyPreview({
  isOwn,
  onClick,
  replyToDisplayName,
  replyToBody,
  replyToType,
  replyToMediaOriginalFileName,
}: Props) {
  const label = (replyToDisplayName?.trim() ?? "") || "message";
  const hasAttachment = !!replyToType && replyToType !== "Text";
  const trimmedBody = replyToBody?.trim() ?? "";

  let description = "";
  if (hasAttachment) {
    const fileName = (replyToMediaOriginalFileName ?? "").trim();
    description = fileName.length > 0
      ? "[Attachment] " + fileName
      : "[Attachment] " + (replyToType ?? "Attachment");
  } else if (trimmedBody.length > 0) {
    description = trimmedBody;
  } else {
    description = "Jump to original message";
  }

  return (
    <Box
      sx={{
        mt: 0.25,
        pt: 0.25,
        borderTop: "1px solid",
        borderColor: "divider",
        cursor: onClick ? "pointer" : "default",
      }}
      onClick={onClick}
    >
      <Typography variant="caption" sx={{ fontWeight: 700 }}>
        Replying to {label}
      </Typography>
      <Typography
        variant="caption"
        color={isOwn ? "inherit" : "text.secondary"}
        sx={{
          display: "block",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {description}
      </Typography>
    </Box>
  );
}
