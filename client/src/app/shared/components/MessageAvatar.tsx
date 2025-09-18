import { Avatar, Box } from "@mui/material";
import { Link } from "react-router";

type Props = {
  userId: string;
  imageUrl?: string;
  displayName: string;
  showUserProfiles?: boolean;
};

export default function MessageAvatar({
  userId,
  imageUrl,
  displayName,
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

  // TODO: In the future we want to have a popup with user info on click
  <Link to={`/profiles/${userId}`}>{avatar}</Link>;

  return avatar;
}
