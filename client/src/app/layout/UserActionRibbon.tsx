import {type MouseEvent, useMemo, useRef} from "react";
import {Box, IconButton, Tooltip, Typography} from "@mui/material";
import {alpha, useTheme} from "@mui/material/styles";
import {
  CallEndRounded,
  Headset,
  HeadsetOff,
  Mic,
  MicOff,
  ScreenShareRounded,
  VideocamRounded,
  WifiRounded,
} from "@mui/icons-material";
import AvatarWithStatus from "../shared/components/AvatarWithStatus";
import {useAccount} from "../../lib/hooks/useAccount";
import {useVoiceChannel} from "../../lib/hooks/useVoiceChannel";
import UserMenuIcon from "./UserMenuIcon";
import {useChatRooms} from "../../lib/hooks/useChatRooms";

export const BASE_USER_ACTION_RIBBON_HEIGHT = 72;
export const VOICE_CARD_EXTRA_HEIGHT = 96;
export const VOICE_CONNECTED_RIBBON_HEIGHT =
  BASE_USER_ACTION_RIBBON_HEIGHT + VOICE_CARD_EXTRA_HEIGHT;

const formatDiscriminator = (tag?: number) =>
  tag == null ? "" : `#${String(tag).padStart(4, "0")}`;

export default function UserActionRibbon() {
  const {currentUser} = useAccount();
  const theme = useTheme();
  const voice = useVoiceChannel(undefined, currentUser?.id);
  const {chatRooms} = useChatRooms();
  const userMenuHandlersRef = useRef<
    | {
    openMenu: (event: MouseEvent<HTMLElement>) => void;
    closeMenu: () => void;
  }
    | null
  >(null);

  const {isSelfMuted, isSelfDeafened, toggleSelfMute, toggleSelfDeafened} =
    voice;

  const statusLine = useMemo(() => {
    if (!currentUser) return "";
    const custom = currentUser.customStatusMessage?.trim();
    if (custom) return custom;
    return formatDiscriminator(currentUser.tag);
  }, [currentUser]);

  const isVoiceConnected = Boolean(voice.currentChannelId);
  const ribbonHeight =
    BASE_USER_ACTION_RIBBON_HEIGHT +
    (isVoiceConnected ? VOICE_CARD_EXTRA_HEIGHT : 0);

  const activeVoiceRoom = useMemo(() => {
    if (!voice.currentChannelId) return null;
    return (
      (chatRooms ?? []).find((room) =>
        room.channels?.some((channel) => channel.id === voice.currentChannelId)
      ) ?? null
    );
  }, [chatRooms, voice.currentChannelId]);

  const activeVoiceChannel = useMemo(() => {
    if (!voice.currentChannelId || !activeVoiceRoom) return null;
    return (
      activeVoiceRoom.channels?.find(
        (channel) => channel.id === voice.currentChannelId
      ) ?? null
    );
  }, [activeVoiceRoom, voice.currentChannelId]);

  const voiceLocationLabel = useMemo(() => {
    if (!isVoiceConnected) return null;
    const segments: string[] = [];
    if (activeVoiceRoom?.title) segments.push(activeVoiceRoom.title);
    if (activeVoiceChannel?.name) segments.push(activeVoiceChannel.name);
    return segments.length ? segments.join(" / ") : null;
  }, [activeVoiceChannel?.name, activeVoiceRoom?.title, isVoiceConnected]);

  if (!currentUser) return null;

  const openUserMenuAtElement = (element: HTMLElement) => {
    const handlers = userMenuHandlersRef.current;
    if (!handlers) return;
    const syntheticEvent = {
      currentTarget: element,
      target: element,
      preventDefault: () => {
      },
      stopPropagation: () => {
      },
    } as unknown as MouseEvent<HTMLElement>;
    handlers.openMenu(syntheticEvent);
  };

  const handleProfileClick = (event: React.MouseEvent<HTMLElement>) => {
    event.preventDefault();
    userMenuHandlersRef.current?.openMenu(event);
  };

  const handleProfileKeyDown = (event: React.KeyboardEvent<HTMLElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openUserMenuAtElement(event.currentTarget as HTMLElement);
    }
  };

  const handleDisconnect = () => {
    voice.leave().catch(() => {
    });
  };

  const controlButtonSx = (active: boolean) => ({
    width: 40,
    height: 40,
    color: active ? theme.palette.error.light : "rgba(255,255,255,0.85)",
    bgcolor: active ? alpha(theme.palette.error.main, 0.18) : "transparent",
    borderRadius: 1.2,
    "&:hover": {
      bgcolor: active
        ? alpha(theme.palette.error.main, 0.28)
        : alpha("#ffffff", 0.08),
    },
  });

  const quickActionButtonSx = {
    width: 44,
    height: 44,
    borderRadius: 1.5,
    color: "rgba(255,255,255,0.85)",
    bgcolor: "rgba(255,255,255,0.08)",
    transition: "background-color 150ms ease, color 150ms ease",
    "&:hover": {
      bgcolor: "rgba(255,255,255,0.16)",
    },
  } as const;

  let pingColor = alpha("#ffffff", 0.6);
  let pingTooltip = "Voice connection inactive";

  if (isVoiceConnected) {
    const ping = voice.pingMs;
    if (typeof ping === "number") {
      pingTooltip = `Ping: ${ping} ms`;
      if (ping <= 60) {
        pingColor = theme.palette.success.light;
      } else if (ping <= 120) {
        pingColor = theme.palette.warning.light;
      } else {
        pingColor = theme.palette.error.light;
      }
    } else {
      pingColor = alpha("#ffffff", 0.7);
      pingTooltip = "Measuring ping...";
    }
  }

  return (
    <Box
      sx={{
        minHeight: BASE_USER_ACTION_RIBBON_HEIGHT,
        height: ribbonHeight,
        px: {xs: 1, sm: 1.5},
        py: 0.5,
        bgcolor: "background.default",
        borderTop: "1px solid rgba(255,255,255,0.06)",
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-end",
        gap: 1,
      }}
    >
      {isVoiceConnected && (
        <Box
          sx={{
            position: "relative",
            display: "flex",
            flexDirection: "column",
            gap: 1,
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 1.5,
            }}
          >
            <Box sx={{display: "flex", alignItems: "center", gap: 1}}>
              <Tooltip title={pingTooltip}>
                <WifiRounded sx={{color: pingColor}} fontSize="small"/>
              </Tooltip>
              <Box sx={{minWidth: 0}}>
                <Typography
                  variant="caption"
                  fontWeight={700}
                  color={pingColor}
                  sx={{letterSpacing: 0.3, textTransform: "uppercase"}}
                >
                  Voice Connected
                </Typography>
                {voiceLocationLabel && (
                  <Typography
                    variant="body2"
                    color="rgba(255,255,255,0.92)"
                    fontWeight={600}
                    noWrap
                  >
                    {voiceLocationLabel}
                  </Typography>
                )}
                {voice.error && (
                  <Typography variant="caption" color="error.main" noWrap>
                    {voice.error}
                  </Typography>
                )}
              </Box>
            </Box>
            <Tooltip title="Disconnect">
              <span>
                <IconButton
                  onClick={handleDisconnect}
                  size="small"
                  disabled={voice.isJoining}
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: 1.5,
                    color: theme.palette.error.light,
                    bgcolor: alpha(theme.palette.error.main, 0.22),
                    transition: "background-color 150ms ease, color 150ms ease",
                    "&:hover": {
                      bgcolor: alpha(theme.palette.error.main, 0.32),
                    },
                    "&.Mui-disabled": {
                      color: alpha(theme.palette.error.light, 0.4),
                      bgcolor: alpha(theme.palette.error.main, 0.12),
                    },
                  }}
                >
                  <CallEndRounded fontSize="small"/>
                </IconButton>
              </span>
            </Tooltip>
          </Box>

          <Box sx={{display: "flex", gap: 1}}>
            <Tooltip title="Turn on camera">
              <IconButton size="small" sx={quickActionButtonSx} onClick={() => {
              }}>
                <VideocamRounded fontSize="small"/>
              </IconButton>
            </Tooltip>
            <Tooltip title="Share your screen">
              <IconButton size="small" sx={quickActionButtonSx} onClick={() => {
              }}>
                <ScreenShareRounded fontSize="small"/>
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
      )}

      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
        }}
      >
        <Box
          onClick={handleProfileClick}
          role="button"
          tabIndex={0}
          onKeyDown={handleProfileKeyDown}
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            flex: 1,
            minWidth: 0,
            py: 0.5,
            borderRadius: 1.5,
            cursor: "pointer",
            bgcolor: "transparent",
            "&:hover": {
              bgcolor: "rgba(255,255,255,0.06)",
            },
            "&:focus-visible": {
              outline: `2px solid ${theme.palette.primary.main}`,
              outlineOffset: 2,
            },
          }}
        >
          <AvatarWithStatus
            src={currentUser.imageUrl}
            status={currentUser.status || "Offline"}
            alt={currentUser.displayName}
            size={40}
          />
          <Box sx={{minWidth: 0}}>
            <Typography variant="body2" fontWeight={600} color="white" noWrap>
              {currentUser.displayName}
            </Typography>
            <Typography variant="caption" color="rgba(255,255,255,0.6)" noWrap>
              {statusLine}
            </Typography>
          </Box>
        </Box>

        <Tooltip
          title={
            isSelfDeafened
              ? "Undeafen to control microphone"
              : isSelfMuted
                ? "Unmute"
                : "Mute microphone"
          }
        >
          <span>
            <IconButton
              onClick={() => {
                if (isSelfDeafened) return;
                toggleSelfMute();
              }}
              sx={controlButtonSx(isSelfMuted)}
              size="small"
              disabled={isSelfDeafened}
            >
              {isSelfMuted ? <MicOff/> : <Mic/>}
            </IconButton>
          </span>
        </Tooltip>

        <Tooltip
          title={isSelfDeafened ? "Enable sound" : "Mute sound & microphone"}
        >
          <span>
            <IconButton
              onClick={() => toggleSelfDeafened()}
              sx={controlButtonSx(isSelfDeafened)}
              size="small"
            >
              {isSelfDeafened ? <HeadsetOff/> : <Headset/>}
            </IconButton>
          </span>
        </Tooltip>
      </Box>

      <UserMenuIcon
        renderTrigger={({openMenu, closeMenu}) => {
          userMenuHandlersRef.current = {openMenu, closeMenu};
          return null;
        }}
      />
    </Box>
  );
}
