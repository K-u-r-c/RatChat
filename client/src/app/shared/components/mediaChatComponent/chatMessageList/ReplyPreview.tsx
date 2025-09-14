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
  if (!replyToDisplayName && !replyToBody && !replyToType) return null;
  return (
    <Box
      sx={{ mt: 0.25, pt: 0.25, borderTop: "1px solid", borderColor: "divider", cursor: onClick ? "pointer" : "default" }}
      onClick={onClick}
    >
      <Typography variant="caption" sx={{ fontWeight: 700 }}>
        Replying to {replyToDisplayName || "message"}
      </Typography>
      <Typography
        variant="caption"
        color={isOwn ? "inherit" : "text.secondary"}
        sx={{ display: "block", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}
      >
        {replyToType && replyToType !== "Text"
          ? `📎 ${replyToMediaOriginalFileName || replyToType}`
          : replyToBody || ""}
      </Typography>
    </Box>
  );
}

