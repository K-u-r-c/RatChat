import {Avatar, Box, Typography} from "@mui/material";
import {alpha, useTheme} from "@mui/material/styles";
import {MicOff} from "@mui/icons-material";
import MediaStreamVideo from "../../../app/shared/components/MediaStreamVideo";
import {useDominantColor} from "../../../lib/hooks/useDominantColor";
import type {ParticipantTileProps} from "../../../lib/types/ParticipantTile.types.ts";
import {hasActiveVideoTrack} from "../../../lib/util/videoTrackUtils.ts";

export default function ParticipantTile(
  {
    tile,
    isSelected,
    onSelect,
    isActiveSpeaker,
    isMuted,
  }: ParticipantTileProps) {
  const theme = useTheme();
  const backgroundColor = useDominantColor(
    hasActiveVideoTrack(tile.stream) ? undefined : tile.avatarUrl,
    tile.userId ?? tile.id
  );
  const videoAvailable = hasActiveVideoTrack(tile.stream);

  return (
    <Box
      onClick={onSelect}
      sx={{
        position: "relative",
        flex: "0 0 auto",
        width: 156,
        aspectRatio: "16 / 9",
        borderRadius: 1.75,
        overflow: "hidden",
        cursor: "pointer",
        border: `2px solid ${
          isSelected
            ? theme.palette.primary.main
            : "rgba(255,255,255,0.08)"
        }`,
        boxShadow: isActiveSpeaker
          ? `0 0 0 2px ${alpha(theme.palette.success.main, 0.55)}`
          : "none",
        transition: "border-color 140ms ease, box-shadow 140ms ease, transform 140ms ease",
        transform: isSelected ? "translateY(-2px)" : "none",
        backgroundColor: videoAvailable ? "#000" : backgroundColor,
        "&:hover": {
          borderColor: theme.palette.primary.light,
        },
      }}
    >
      {videoAvailable ? (
        <MediaStreamVideo stream={tile.stream} muted playsInline fit="cover"/>
      ) : (
        <Box
          sx={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            bgcolor: backgroundColor,
          }}
        >
          <Avatar
            src={tile.avatarUrl}
            alt={tile.displayName}
            sx={{
              width: 50,
              height: 50,
              fontSize: 22,
              bgcolor: alpha("#000", 0.2),
              color: "#fff",
            }}
          >
            {tile.displayName.charAt(0).toUpperCase()}
          </Avatar>
        </Box>
      )}

      <Box
        sx={{
          position: "absolute",
          inset: 0,
          boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.04)",
          pointerEvents: "none",
        }}
      />

      <Box
        sx={{
          position: "absolute",
          insetX: 0,
          bottom: 0,
          px: 1,
          py: 0.75,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 0.75,
          background:
            "linear-gradient(180deg, rgba(8,8,12,0) 0%, rgba(8,8,12,0.78) 100%)",
        }}
      >
        <Typography
          variant="caption"
          fontWeight={600}
          sx={{
            color: "#fff",
            textShadow: "0 1px 2px rgba(0,0,0,0.4)",
            flex: 1,
            minWidth: 0,
          }}
          noWrap
        >
          {tile.displayName}
        </Typography>
        {isMuted && <MicOff sx={{fontSize: 16, color: "rgba(255,255,255,0.72)"}}/>}
      </Box>
    </Box>
  );
}