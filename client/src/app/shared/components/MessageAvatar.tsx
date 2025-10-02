import { Avatar, Box } from "@mui/material";
import { Link } from "react-router";

type Props = {
  userId: string;
  userSlug?: string;
  imageUrl?: string;
  displayName: string;
  showUserProfiles?: boolean;
};

export default function MessageAvatar({
  userSlug,
  imageUrl,
  displayName,
  showUserProfiles = true,
}: Props) {
  const avatar = (
    <Box
      sx={{
        display: "inline-block",
        mx: 2,
        position: "relative",
      }}
    >
      <Avatar
        src={imageUrl}
        alt={displayName + " image"}
        sx={{
          position: "relative",
        }}
      />
    </Box>
  );

  if (!showUserProfiles || !userSlug) {
    return avatar;
  }

  return <Link to={`/profiles/${userSlug}`}>{avatar}</Link>;
}
