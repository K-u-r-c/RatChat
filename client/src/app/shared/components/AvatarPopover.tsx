import Popover from "@mui/material/Popover";
import type { Profile } from "../../../lib/types";
import { useState, type MouseEvent } from "react";
import { Avatar } from "@mui/material";
import { Link } from "react-router";
import ProfileCard from "./ProfileCard";

type Props = {
  profile: Profile;
};

export default function AvatarPopover({ profile }: Props) {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

  const handlePopoverOpen = (event: MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handlePopoverClose = () => {
    setAnchorEl(null);
  };

  const open = Boolean(anchorEl);

  return (
    <>
      <Avatar
        alt={profile.displayName + " image"}
        src={profile.imageUrl}
        sx={{
          border: profile.following ? 3 : 0,
          borderColor: "secondary.main",
        }}
        component={Link}
        to={`/profiles/${profile.id}`}
        onMouseEnter={handlePopoverOpen}
        onMouseLeave={handlePopoverClose}
      />
      <Popover
        id="mouse-over-popover"
        sx={{ pointerEvents: "none" }}
        open={open}
        anchorEl={anchorEl}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "left",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "left",
        }}
        onClose={handlePopoverClose}
        disableRestoreFocus
        slotProps={{
          paper: {
            sx: { borderRadius: 4 },
          },
        }}
      >
        <ProfileCard profile={profile} />
      </Popover>
    </>
  );
}
