import { Box, Chip, Typography } from "@mui/material";
import { Link } from "react-router";
import { timeAgo, formatDate } from "../../../../../lib/util/util";

type Props = {
  isOwn: boolean;
  displayName: string;
  createdAt: Date | string;
  messageType?: string;
  profileSlug?: string;
  showUserProfiles?: boolean;
  accentColor?: string;
};

export default function MessageHeader({
  isOwn,
  displayName,
  createdAt,
  messageType,
  profileSlug,
  showUserProfiles = true,
  accentColor,
}: Props) {
  const linkEnabled = showUserProfiles && !!profileSlug;
  const linkProps = linkEnabled
    ? ({ component: Link, to: `/profiles/${profileSlug}` } as const)
    : {};

  return (
    <Box
      display="flex"
      alignItems="center"
      gap={3}
      sx={{ width: "100%", flexDirection: isOwn ? "row-reverse" : "row" }}
    >
      <Typography
        variant="subtitle1"
        sx={{
          fontWeight: "bold",
          textDecoration: "none",
          color: accentColor ?? "inherit",
          "&:hover": linkEnabled ? { textDecoration: "underline" } : undefined,
        }}
        {...linkProps}
      >
        {displayName}
      </Typography>
      <Typography
        variant="body2"
        color="text.secondary"
        title={formatDate(createdAt)}
      >
        {timeAgo(createdAt)}
      </Typography>
      {messageType && messageType !== "Text" && (
        <Chip
          size="small"
          label={messageType}
          color="primary"
          variant="outlined"
        />
      )}
    </Box>
  );
}
