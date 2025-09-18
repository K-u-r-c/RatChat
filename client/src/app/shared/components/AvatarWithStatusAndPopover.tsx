import { Box } from "@mui/material";
import type { Profile } from "../../../lib/types";
import AvatarPopover from "./AvatarPopover";
import StatusIndicator from "./StatusIndicator";
import AvatarWithStatus from "./AvatarWithStatus";

type AvatarWithStatusAndPopoverProps = {
  profile: Profile;
  size?: number;
  showPopover?: boolean;
};

export function AvatarWithStatusAndPopover({
  profile,
  size,
  showPopover = true,
}: AvatarWithStatusAndPopoverProps) {
  if (showPopover) {
    return (
      <Box sx={{ position: "relative" }}>
        <AvatarPopover profile={profile} />
        <Box
          sx={{
            position: "absolute",
            bottom: -2,
            right: -2,
            backgroundColor: "white",
            borderRadius: "50%",
            padding: "2px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <StatusIndicator status={profile.status || "Offline"} size="small" />
        </Box>
      </Box>
    );
  }

  return (
    <AvatarWithStatus
      src={profile.imageUrl}
      alt={profile.displayName + " image"}
      status={profile.status || "Offline"}
      size={size}
    />
  );
}
