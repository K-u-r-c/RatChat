import { Link } from "react-router";
import { Avatar, Box, Typography } from "@mui/material";
import type { Profile } from "../../../lib/types";

type Props = {
  profile: Profile;
};

export default function ProfileCard({ profile }: Props) {
  return (
    <Link to={`/profiles/${profile.id}`} style={{ textDecoration: "none" }}>
      <Box
        sx={{
          width: 340,
          overflow: "visible",
          boxSizing: "border-box",
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 3,
            p: 2,
            background: profile.bannerUrl
              ? `linear-gradient(rgba(30,30,30,0.55), rgba(30,30,30,0.55)), url(${profile.bannerUrl})`
              : "linear-gradient(135deg, #40356e 0%, #7867BD 69%, rgb(174, 157, 241) 89%)",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <Avatar
            src={profile?.imageUrl || "/images/user.png"}
            alt={profile.displayName + " image"}
            sx={{
              width: 80,
              height: 80,
              border: "4px solid white",
              backgroundColor: "background.paper",
              boxShadow: 2,
            }}
          />
          <Box>
            <Typography variant="h5" fontWeight="bold" color="white">
              {profile.displayName}
            </Typography>
            {profile.bio && (
              <Typography
                variant="body2"
                color="white"
                noWrap
                sx={{
                  maxWidth: 200,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  opacity: 0.85,
                }}
              >
                {profile.bio}
              </Typography>
            )}
          </Box>
        </Box>
      </Box>
    </Link>
  );
}
