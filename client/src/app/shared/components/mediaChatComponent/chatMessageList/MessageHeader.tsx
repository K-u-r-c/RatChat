import { Box, Chip, Typography } from "@mui/material";
import { timeAgo } from "../../../../../lib/util/util";

type Props = {
  isOwn: boolean;
  displayName: string;
  createdAt: Date | string;
  messageType?: string;
};

export default function MessageHeader({ isOwn, displayName, createdAt, messageType }: Props) {
  return (
    <Box display="flex" alignItems="center" gap={3} sx={{ width: "100%", flexDirection: isOwn ? "row-reverse" : "row" }}>
      <Typography variant="subtitle1" sx={{ fontWeight: "bold", textDecoration: "none" }}>
        {displayName}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        {timeAgo(createdAt)}
      </Typography>
      {messageType && messageType !== "Text" && (
        <Chip size="small" label={messageType} color="primary" variant="outlined" />
      )}
    </Box>
  );
}

