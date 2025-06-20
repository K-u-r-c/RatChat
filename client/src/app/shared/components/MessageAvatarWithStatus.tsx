import { Avatar, Box } from "@mui/material";
import { Link } from "react-router";
import StatusIndicator from "./StatusIndicator";
import { useStatus } from "../../../lib/hooks/useStatus";

type Props = {
  userId: string;
  imageUrl?: string;
  displayName: string;
  showUserProfiles?: boolean;
};

export default function MessageAvatarWithStatus({
  userId,
  imageUrl,
  displayName,
  showUserProfiles = true,
}: Props) {
  const { useUserStatus } = useStatus();
  const { data: userStatus } = useUserStatus(userId);

  const avatar = (
    <Box sx={{ position: "relative", display: "inline-block" }}>
      <Avatar src={imageUrl} alt={displayName + " image"} sx={{ mr: 2 }} />
      {userStatus && (
        <Box
          sx={{
            position: "absolute",
            bottom: -2,
            right: 6,
            backgroundColor: "white",
            borderRadius: "50%",
            padding: "2px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <StatusIndicator status={userStatus.status} size="small" />
        </Box>
      )}
    </Box>
  );

  if (!showUserProfiles) {
    return avatar;
  }

  return (
    <Link
      to={`/profiles/${userId}`}
      style={{ textDecoration: "none", color: "inherit" }}
    >
      {avatar}
    </Link>
  );
}
