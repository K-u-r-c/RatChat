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
      ></Avatar>
    </Box>
  );

  if (Link) {
    const WrapperComponent = Link;
    return (
      <WrapperComponent to={`/profiles/${userId}`} onClick={undefined}>
        {avatar}
      </WrapperComponent>
    );
  }

  return avatar;
}
