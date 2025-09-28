import {type PointerEvent as ReactPointerEvent, useCallback, useEffect, useMemo, useRef, useState} from "react";
import {Avatar, Box, Chip, Fade, IconButton, Tooltip, Typography,} from "@mui/material";
import {alpha, useTheme} from "@mui/material/styles";
import {
  CallEndRounded,
  Fullscreen,
  FullscreenExit,
  Mic,
  MicOff,
  ScreenShareRounded,
  StopScreenShareRounded,
  VideocamOffRounded,
  VideocamRounded,
} from "@mui/icons-material";
import {useAccount} from "../../../lib/hooks/useAccount";
import {useVoiceChannel} from "../../../lib/hooks/useVoiceChannel";
import {useChatRooms} from "../../../lib/hooks/useChatRooms";
import {useDominantColor} from "../../../lib/hooks/useDominantColor";
import MediaStreamVideo from "../../../app/shared/components/MediaStreamVideo";
import ParticipantTile from "./ParticipantTile";
import type {VoiceParticipant} from "../../../lib/realtime/voiceHub";
import {hasActiveVideoTrack} from "../../../lib/util/videoTrackUtils.ts";
import type {ParticipantTileData} from "../../../lib/types/ParticipantTile.types.ts";

type Props = {
  chatRoomId: string;
};

const UI_HIDE_DELAY_MS = 2600;

const formatPossessive = (name?: string | null) => {
  if (!name) return "";
  const trimmed = name.trim();
  if (!trimmed) return "";
  const lower = trimmed.toLowerCase();
  if (lower.endsWith("'s")) return `${trimmed} Screen`;
  if (lower.endsWith("s")) return `${trimmed}' Screen`;
  return `${trimmed}'s Screen`;
};

export default function ChatRoomScreenSharePanel({chatRoomId}: Props) {
  const theme = useTheme();
  const panelRef = useRef<HTMLDivElement | null>(null);
  const uiHideTimerRef = useRef<number | null>(null);
  const screenContentRef = useRef<HTMLDivElement | null>(null);
  const pipRef = useRef<HTMLDivElement | null>(null);
  const pipDragStateRef = useRef({isDragging: false, offsetX: 0, offsetY: 0});
  const activePointerIdRef = useRef<number | null>(null);
  const [pipPosition, setPipPosition] = useState<{ left: number; top: number; } | null>(null);
  const [isPipDragging, setIsPipDragging] = useState(false);
  const lastCameraStreamIdRef = useRef<string | null>(null);


  const {currentUser} = useAccount();
  const voice = useVoiceChannel(chatRoomId, currentUser?.id);
  const {chatRooms} = useChatRooms();

  const {
    localCameraStream,
    localScreenStream,
    isCameraEnabled,
    isScreenSharing,
    toggleCamera,
    toggleScreenShare,
  } = voice;

  const [isUiVisible, setIsUiVisible] = useState(true);
  const [selectedTileId, setSelectedTileId] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [videoInfo, setVideoInfo] = useState<{
    width?: number;
    height?: number;
    fps?: number;
  } | null>(null);

  const presenceList = useMemo(() => {
    if (voice.currentChannelId) {
      return voice.presenceByChannel[voice.currentChannelId] ?? [];
    }
    return voice.participants;
  }, [voice.currentChannelId, voice.presenceByChannel, voice.participants]);

  const participantLookup = useMemo(() => {
    const map = new Map<string, VoiceParticipant>();
    voice.participants.forEach((participant) => {
      map.set(participant.userId, participant);
    });
    return map;
  }, [voice.participants]);

  const remoteVideoByConnection = useMemo(() => {
    const map = new Map<
      string,
      {
        camera?: MediaStream;
        screen?: MediaStream;
        userId: string | null;
      }
    >();
    voice.remoteVideoStreams.forEach(
      ({connectionId, mediaType, stream, userId}) => {
        const entry = map.get(connectionId) ?? {userId: userId ?? null};
        entry[mediaType] = stream;
        if (userId != null) {
          entry.userId = userId;
        }
        map.set(connectionId, entry);
      }
    );
    return map;
  }, [voice.remoteVideoStreams]);

  const tiles = useMemo(() => {
    const items: ParticipantTileData[] = [];
    const seen = new Set<string>();

    const push = (tile: ParticipantTileData) => {
      if (seen.has(tile.id)) return;
      seen.add(tile.id);
      items.push(tile);
    };

    const source = presenceList.length ? presenceList : voice.participants;

    source.forEach((participant) => {
      const id = `user:${participant.userId}`;
      const remoteVideo = remoteVideoByConnection.get(participant.connectionId);
      const cameraStream = remoteVideo?.camera ?? null;
      const screenStream = remoteVideo?.screen ?? null;
      const stream = screenStream ?? cameraStream;
      const videoType = screenStream
        ? "screen"
        : cameraStream
          ? "camera"
          : undefined;

      push({
        id,
        participant,
        stream,
        videoType,
        cameraStream,
        screenStream,
        connectionId: participant.connectionId,
        userId: participant.userId,
        displayName:
          participant.userId === currentUser?.id
            ? currentUser?.displayName ?? "You"
            : participant.displayName || "Unknown user",
        avatarUrl: participant.imageUrl,
        isSelf: participant.userId === currentUser?.id,
      });
    });

    remoteVideoByConnection.forEach((entry, connectionId) => {
      const id = entry.userId
        ? `user:${entry.userId}`
        : `stream:${connectionId}`;
      const cameraStream = entry.camera ?? null;
      const screenStream = entry.screen ?? null;
      const stream = screenStream ?? cameraStream;
      const videoType = screenStream
        ? "screen"
        : cameraStream
          ? "camera"
          : undefined;

      if (seen.has(id)) {
        if (!stream) return;
        const index = items.findIndex((item) => item.id === id);
        if (index >= 0) {
          items[index] = {
            ...items[index],
            stream,
            videoType,
            cameraStream,
            screenStream,
            connectionId,
          };
        }
        return;
      }

      if (!stream) return;

      const participant = entry.userId
        ? participantLookup.get(entry.userId) ?? null
        : null;

      const displayName =
        entry.userId && entry.userId === currentUser?.id
          ? currentUser?.displayName ?? "You"
          : participant?.displayName ?? "Screen Share";

      const avatarUrl =
        entry.userId === currentUser?.id
          ? currentUser?.imageUrl
          : participant?.imageUrl;

      push({
        id,
        participant,
        stream,
        videoType,
        cameraStream,
        screenStream,
        connectionId,
        userId: entry.userId ?? null,
        displayName,
        avatarUrl,
        isSelf: entry.userId === currentUser?.id,
      });
    });

    if (currentUser) {
      const id = `user:${currentUser.id}`;
      const index = items.findIndex((item) => item.id === id);
      const localCamera = localCameraStream ?? null;
      const localScreen = localScreenStream ?? null;
      const localStream = localScreen ?? localCamera;
      const videoType = localScreen
        ? "screen"
        : localCamera
          ? "camera"
          : undefined;

      if (index >= 0) {
        items[index] = {
          ...items[index],
          stream: localStream,
          videoType,
          cameraStream: localCamera,
          screenStream: localScreen,
          isSelf: true,
          avatarUrl: currentUser.imageUrl,
        };
      } else {
        push({
          id,
          participant: null,
          stream: localStream,
          videoType,
          cameraStream: localCamera,
          screenStream: localScreen,
          connectionId: undefined,
          userId: currentUser.id,
          displayName: currentUser.displayName,
          avatarUrl: currentUser.imageUrl,
          isSelf: true,
        });
      }
    }

    return items;
  }, [
    presenceList,
    voice.participants,
    remoteVideoByConnection,
    participantLookup,
    currentUser,
    localCameraStream,
    localScreenStream,
  ]);

  useEffect(() => {
    if (selectedTileId && tiles.some((tile) => tile.id === selectedTileId))
      return;
    if (tiles.length > 0) {
      const preferred =
        tiles.find((tile) => tile.videoType === "screen") ?? tiles[0];
      setSelectedTileId(preferred.id);
    } else {
      setSelectedTileId(null);
    }
  }, [tiles, selectedTileId]);

  const selectedTile = useMemo(
    () => tiles.find((tile) => tile.id === selectedTileId) ?? null,
    [tiles, selectedTileId]
  );

  const isScreenView = selectedTile?.videoType === "screen";
  const floatingCameraStream = isScreenView
    ? selectedTile?.cameraStream ?? null
    : null;
  const shouldShowFloatingCamera = Boolean(
    floatingCameraStream && hasActiveVideoTrack(floatingCameraStream)
  );

  const dominantColor = useDominantColor(
    selectedTile?.avatarUrl,
    selectedTile?.userId ?? selectedTile?.id ?? ""
  );

  const activeSpeakers = useMemo(
    () => new Set(voice.activeSpeakers),
    [voice.activeSpeakers]
  );

  const mutedParticipants = useMemo(
    () => new Set(voice.mutedParticipantIds),
    [voice.mutedParticipantIds]
  );

  useEffect(() => {
    if (
      !selectedTile?.stream ||
      !hasActiveVideoTrack(selectedTile.stream) ||
      selectedTile.videoType !== "screen"
    ) {
      setVideoInfo(null);
      return;
    }

    const stream = selectedTile.stream;
    const update = () => {
      const [track] = stream.getVideoTracks();
      if (!track) {
        setVideoInfo(null);
        return;
      }
      try {
        const settings = track.getSettings();
        setVideoInfo({
          width: settings.width ?? undefined,
          height: settings.height ?? undefined,
          fps: settings.frameRate ? Math.round(settings.frameRate) : undefined,
        });
      } catch {
        setVideoInfo(null);
      }
    };

    update();
    const intervalId = window.setInterval(update, 4000);
    return () => window.clearInterval(intervalId);
  }, [selectedTile?.stream, selectedTile?.videoType]);

  useEffect(() => {
    const resetDragState = () => {
      pipDragStateRef.current.isDragging = false;
      activePointerIdRef.current = null;
      setIsPipDragging(false);
    };

    if (!isScreenView) {
      resetDragState();
      lastCameraStreamIdRef.current = null;
      setPipPosition(null);
      return;
    }

    const currentId = floatingCameraStream?.id ?? null;
    if (currentId !== lastCameraStreamIdRef.current) {
      resetDragState();
      lastCameraStreamIdRef.current = currentId;
      setPipPosition(null);
    }
  }, [isScreenView, floatingCameraStream, selectedTile?.id]);

  const hideUiAfterDelay = useCallback(() => {
    if (uiHideTimerRef.current) window.clearTimeout(uiHideTimerRef.current);
    uiHideTimerRef.current = window.setTimeout(() => {
      setIsUiVisible(false);
    }, UI_HIDE_DELAY_MS);
  }, []);

  const handlePointerActivity = useCallback(() => {
    setIsUiVisible(true);
    hideUiAfterDelay();
  }, [hideUiAfterDelay]);

  const handleMouseLeave = useCallback(() => {
    if (uiHideTimerRef.current) window.clearTimeout(uiHideTimerRef.current);
    setIsUiVisible(false);
  }, []);

  useEffect(() => {
    handlePointerActivity();
    return () => {
      if (uiHideTimerRef.current) window.clearTimeout(uiHideTimerRef.current);
    };
  }, [handlePointerActivity]);

  const updatePipPosition = useCallback((clientX: number, clientY: number) => {
    const container = screenContentRef.current;
    const floating = pipRef.current;
    if (!container || !floating) return;

    const containerRect = container.getBoundingClientRect();
    const pipRect = floating.getBoundingClientRect();

    const maxLeft = Math.max(containerRect.width - pipRect.width, 0);
    const maxTop = Math.max(containerRect.height - pipRect.height, 0);

    const rawLeft =
      clientX - containerRect.left - pipDragStateRef.current.offsetX;
    const rawTop =
      clientY - containerRect.top - pipDragStateRef.current.offsetY;

    const nextLeft = Math.min(Math.max(rawLeft, 0), maxLeft);
    const nextTop = Math.min(Math.max(rawTop, 0), maxTop);

    setPipPosition({left: nextLeft, top: nextTop});
  }, []);

  const handlePipPointerDown = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (!shouldShowFloatingCamera) return;
      if (!screenContentRef.current || !pipRef.current) return;

      event.preventDefault();
      event.stopPropagation();
      handlePointerActivity();

      const rect = pipRef.current.getBoundingClientRect();
      pipDragStateRef.current.isDragging = true;
      pipDragStateRef.current.offsetX = event.clientX - rect.left;
      pipDragStateRef.current.offsetY = event.clientY - rect.top;
      activePointerIdRef.current = event.pointerId;
      setIsPipDragging(true);
      pipRef.current.setPointerCapture?.(event.pointerId);
    },
    [handlePointerActivity, shouldShowFloatingCamera]
  );

  const handlePipPointerMove = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (!pipDragStateRef.current.isDragging) return;
      if (activePointerIdRef.current !== event.pointerId) return;

      event.preventDefault();
      updatePipPosition(event.clientX, event.clientY);
    },
    [updatePipPosition]
  );

  const handlePipPointerUp = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (activePointerIdRef.current !== event.pointerId) return;

      pipDragStateRef.current.isDragging = false;
      activePointerIdRef.current = null;
      setIsPipDragging(false);
      pipRef.current?.releasePointerCapture?.(event.pointerId);
    },
    []
  );

  useEffect(() => {
    if (!isScreenView) return;
    const container = screenContentRef.current;
    if (!container || typeof ResizeObserver === "undefined") return;

    const observer = new ResizeObserver(() => {
      setPipPosition((prev) => {
        if (!prev || !screenContentRef.current || !pipRef.current) return prev;
        const containerRect = screenContentRef.current.getBoundingClientRect();
        const pipRect = pipRef.current.getBoundingClientRect();
        const maxLeft = Math.max(containerRect.width - pipRect.width, 0);
        const maxTop = Math.max(containerRect.height - pipRect.height, 0);
        const nextLeft = Math.min(Math.max(prev.left, 0), maxLeft);
        const nextTop = Math.min(Math.max(prev.top, 0), maxTop);
        if (nextLeft === prev.left && nextTop === prev.top) return prev;
        return {left: nextLeft, top: nextTop};
      });
    });

    observer.observe(container);

    return () => observer.disconnect();
  }, [isScreenView, shouldShowFloatingCamera]);

  useEffect(() => {
    const onFullscreenChange = () => {
      const element = panelRef.current;
      setIsFullscreen(document.fullscreenElement === element);
    };
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", onFullscreenChange);
    };
  }, []);

  const handleToggleFullscreen = () => {
    const element = panelRef.current;
    if (!element) return;
    if (document.fullscreenElement === element) {
      void document.exitFullscreen?.();
    } else {
      void element.requestFullscreen?.().catch(() => {
        /* no-op */
      });
    }
  };

  const isConnected = Boolean(voice.currentChannelId);

  const channelHost = useMemo(() => {
    if (!voice.currentChannelId) return null;
    return (chatRooms ?? []).find((room) => room.id === chatRoomId) ?? null;
  }, [chatRooms, chatRoomId, voice.currentChannelId]);

  const activeVoiceChannel = useMemo(() => {
    if (!voice.currentChannelId || !channelHost) return null;
    return (
      channelHost.channels?.find(
        (channel) => channel.id === voice.currentChannelId
      ) ?? null
    );
  }, [channelHost, voice.currentChannelId]);

  const channelLabel =
    activeVoiceChannel?.name ?? channelHost?.title ?? "Voice";

  const presenterName = selectedTile
    ? selectedTile.participant?.displayName ??
    (selectedTile.isSelf
      ? currentUser?.displayName ?? selectedTile.displayName
      : selectedTile.displayName)
    : null;

  const presenterAvatar =
    selectedTile?.avatarUrl ??
    (selectedTile?.isSelf ? currentUser?.imageUrl : undefined);

  const screenLabel =
    isScreenView && presenterName ? formatPossessive(presenterName) : null;

  const qualityLabel = useMemo(() => {
    if (!isScreenView || !videoInfo?.height) return null;
    const resolution = `${videoInfo.height}p`;
    const fpsLabel = videoInfo.fps ? `${videoInfo.fps} FPS` : null;
    return fpsLabel ? `${resolution} ${fpsLabel}` : resolution;
  }, [isScreenView, videoInfo]);

  const controlButtonBase = (activeColor: string, active: boolean) => ({
    width: 44,
    height: 44,
    borderRadius: 2,
    color: active ? activeColor : "rgba(255,255,255,0.88)",
    bgcolor: active
      ? alpha(activeColor, 0.2)
      : alpha("#0b0d13", isUiVisible ? 0.6 : 0.45),
    backdropFilter: "blur(8px)",
    border: `1px solid ${alpha("#ffffff", 0.08)}`,
    transition: "background-color 120ms ease, color 120ms ease",
    "&:hover": {
      bgcolor: active ? alpha(activeColor, 0.28) : alpha("#ffffff", 0.18),
    },
    "&.Mui-disabled": {
      color: "rgba(255,255,255,0.32)",
      bgcolor: alpha("#0b0d13", 0.4),
    },
  });

  const renderMainContent = () => {
    if (selectedTile?.stream && hasActiveVideoTrack(selectedTile.stream)) {
      const pipPlacementStyles = pipPosition
        ? {top: `${pipPosition.top}px`, left: `${pipPosition.left}px`}
        : {bottom: "24px", right: "24px"};

      return (
        <Box
          ref={screenContentRef}
          sx={{
            flex: 1,
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            bgcolor: "#000",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <MediaStreamVideo
            stream={selectedTile.stream}
            muted
            fit={isScreenView ? "contain" : "cover"}
          />
          {shouldShowFloatingCamera && (
            <Box
              ref={pipRef}
              onPointerDown={handlePipPointerDown}
              onPointerMove={handlePipPointerMove}
              onPointerUp={handlePipPointerUp}
              onPointerCancel={handlePipPointerUp}
              sx={{
                position: "absolute",
                width: "min(240px, 26vw)",
                aspectRatio: "16 / 9",
                maxWidth: "calc(100% - 32px)",
                minWidth: 140,
                borderRadius: 1.75,
                overflow: "hidden",
                boxShadow: "0 18px 40px rgba(0,0,0,0.45)",
                border: `1px solid ${alpha("#ffffff", 0.24)}`,
                cursor: isPipDragging ? "grabbing" : "grab",
                touchAction: "none",
                backgroundColor: "#000",
                backdropFilter: "blur(2px)",
                transition: "box-shadow 160ms ease, transform 160ms ease",
                pointerEvents: "auto",
                zIndex: theme.zIndex.modal,
                ...pipPlacementStyles,
              }}
              aria-label="Camera preview"
              aria-grabbed={isPipDragging}
              role="button"
            >
              <MediaStreamVideo
                stream={floatingCameraStream ?? undefined}
                muted
                mirrored={Boolean(selectedTile?.isSelf)}
                fit="cover"
                style={{pointerEvents: "none"}}
              />
            </Box>
          )}
        </Box>
      );
    }

    return (
      <Box
        ref={screenContentRef}
        sx={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          gap: 2,
          bgcolor: dominantColor || "#111318",
          color: "rgba(255,255,255,0.8)",
          textAlign: "center",
        }}
      >
        <Avatar
          src={presenterAvatar}
          sx={{
            width: 96,
            height: 96,
            fontSize: 40,
            bgcolor: alpha("#000", 0.15),
          }}
        >
          {presenterName?.charAt(0).toUpperCase() ?? "?"}
        </Avatar>
        <Typography variant="h5" fontWeight={600}>
          {presenterName ?? "No active stream"}
        </Typography>
        <Typography variant="body2" color="rgba(255,255,255,0.7)">
          {isConnected
            ? "Waiting for someone to share their screen"
            : "Join a voice channel to start sharing"}
        </Typography>
      </Box>
    );
  };

  return (
    <Box
      ref={panelRef}
      onMouseMove={handlePointerActivity}
      onPointerDown={handlePointerActivity}
      onMouseLeave={handleMouseLeave}
      sx={{
        flex: 1,
        width: "100%",
        height: "100%",
        minHeight: 0,
        borderRadius: 2,
        position: "relative",
        overflow: "hidden",
        backgroundColor: "#0b0d13",
        display: "flex",
        flexDirection: "column",
        boxShadow: "0 20px 40px rgba(0,0,0,0.35)",
      }}
    >
      <Box sx={{flex: 1, position: "relative", display: "flex"}}>
        {renderMainContent()}
      </Box>

      <Fade
        in={isUiVisible && isScreenView}
        timeout={{enter: 180, exit: 200}}
      >
        <Box
          sx={{
            position: "absolute",
            top: 18,
            left: 18,
            padding: "10px 14px",
            borderRadius: 1.8,
            backdropFilter: "blur(12px)",
            backgroundColor: alpha("#090a0f", 0.75),
            display: "flex",
            flexDirection: "column",
            gap: 1,
            maxWidth: "min(420px, 40vw)",
          }}
        >
          <Typography
            variant="caption"
            sx={{
              letterSpacing: 0.6,
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.6)",
            }}
          >
            {channelLabel}
          </Typography>
          <Box sx={{display: "flex", alignItems: "center", gap: 1.2}}>
            <Avatar
              src={presenterAvatar}
              alt={presenterName ?? "Screen"}
              sx={{width: 36, height: 36}}
            >
              {presenterName?.charAt(0).toUpperCase() ?? "?"}
            </Avatar>
            <Box sx={{minWidth: 0}}>
              <Typography variant="body2" fontWeight={600} color="#fff" noWrap>
                {presenterName ?? "No active stream"}
              </Typography>
              {screenLabel && (
                <Typography
                  variant="caption"
                  color="rgba(255,255,255,0.72)"
                  noWrap
                >
                  {screenLabel}
                </Typography>
              )}
            </Box>
          </Box>
        </Box>
      </Fade>

      <Fade
        in={isUiVisible && isScreenView}
        timeout={{enter: 180, exit: 200}}
      >
        <Box
          sx={{
            position: "absolute",
            top: 18,
            right: 18,
            display: "flex",
            alignItems: "center",
            gap: 1,
          }}
        >
          {qualityLabel && (
            <Chip
              label={qualityLabel}
              size="small"
              sx={{
                color: "#fff",
                bgcolor: alpha("#090a0f", 0.75),
                backdropFilter: "blur(8px)",
                borderRadius: 2,
                fontWeight: 600,
              }}
            />
          )}
          <Chip
            label="LIVE"
            size="small"
            sx={{
              color: "#fff",
              bgcolor: alpha(theme.palette.error.main, 0.9),
              borderRadius: 2,
              fontWeight: 700,
              letterSpacing: 1.2,
            }}
          />
        </Box>
      </Fade>

      <Fade in={isUiVisible} timeout={{enter: 180, exit: 220}}>
        <Box
          sx={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            px: 4,
            pb: 3,
            pt: 6,
            display: "flex",
            flexDirection: "column",
            gap: 2,
            background:
              "linear-gradient(180deg, rgba(7,7,12,0) 0%, rgba(7,7,12,0.86) 65%, rgba(7,7,12,0.92) 100%)",
          }}
        >
          <Box
            sx={{
              display: "flex",
              flexDirection: "row",
              width: "100%",
              justifyContent: "center",
              gap: 1.5,
              overflowX: "auto",
              paddingBottom: 0.5,
              py: 2,
              maskImage:
                "linear-gradient(90deg, transparent 0%, black 10%, black 90%, transparent 100%)",
            }}
          >
            {tiles.map((tile) => (
              <ParticipantTile
                key={tile.id}
                tile={tile}
                isSelected={tile.id === selectedTileId}
                onSelect={() => setSelectedTileId(tile.id)}
                isActiveSpeaker={
                  tile.userId ? activeSpeakers.has(tile.userId) : false
                }
                isMuted={
                  tile.isSelf
                    ? voice.isSelfMuted
                    : tile.userId
                      ? mutedParticipants.has(tile.userId)
                      : false
                }
              />
            ))}
          </Box>

          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexWrap: "wrap",
              gap: 2,
              px: 2,
            }}
          >
            <Box sx={{display: "flex", alignItems: "center", gap: 1.5}}>
              <Tooltip
                title={
                  voice.isSelfMuted ? "Unmute microphone" : "Mute microphone"
                }
              >
                <span>
                  <IconButton
                    size="large"
                    sx={controlButtonBase(
                      theme.palette.error.light,
                      voice.isSelfMuted
                    )}
                    onClick={() => voice.toggleSelfMute()}
                    disabled={!isConnected || voice.isJoining}
                    aria-label={voice.isSelfMuted ? "Unmute" : "Mute"}
                  >
                    {voice.isSelfMuted ? <MicOff/> : <Mic/>}
                  </IconButton>
                </span>
              </Tooltip>

              <Tooltip
                title={
                  isCameraEnabled
                    ? "Stop sharing camera"
                    : "Start sharing camera"
                }
              >
                <span>
                  <IconButton
                    size="large"
                    sx={controlButtonBase(
                      theme.palette.primary.light,
                      isCameraEnabled
                    )}
                    onClick={() => {
                      void toggleCamera();
                    }}
                    disabled={!isConnected || voice.isJoining}
                    aria-label={
                      isCameraEnabled ? "Stop camera" : "Start camera"
                    }
                  >
                    {isCameraEnabled ? (
                      <VideocamOffRounded/>
                    ) : (
                      <VideocamRounded/>
                    )}
                  </IconButton>
                </span>
              </Tooltip>

              <Tooltip
                title={
                  isScreenSharing ? "Stop screen sharing" : "Share your screen"
                }
              >
                <span>
                  <IconButton
                    size="large"
                    sx={controlButtonBase(
                      theme.palette.primary.light,
                      isScreenSharing
                    )}
                    onClick={() => {
                      void toggleScreenShare();
                    }}
                    disabled={!isConnected || voice.isJoining}
                    aria-label={
                      isScreenSharing ? "Stop screen" : "Share screen"
                    }
                  >
                    {isScreenSharing ? (
                      <StopScreenShareRounded/>
                    ) : (
                      <ScreenShareRounded/>
                    )}
                  </IconButton>
                </span>
              </Tooltip>

              <Tooltip title="Disconnect from voice channel">
                <span>
                  <IconButton
                    size="large"
                    sx={controlButtonBase(theme.palette.error.main, true)}
                    onClick={() => voice.leave().catch(() => {
                    })}
                    disabled={!isConnected || voice.isJoining}
                    aria-label="Disconnect"
                  >
                    <CallEndRounded/>
                  </IconButton>
                </span>
              </Tooltip>
            </Box>

            <Tooltip
              title={isFullscreen ? "Exit full screen" : "View full screen"}
            >
              <span>
                <IconButton
                  size="large"
                  onClick={handleToggleFullscreen}
                  sx={controlButtonBase("#ffffff", isFullscreen)}
                  aria-label={
                    isFullscreen ? "Exit full screen" : "Enter full screen"
                  }
                >
                  {isFullscreen ? <FullscreenExit/> : <Fullscreen/>}
                </IconButton>
              </span>
            </Tooltip>
          </Box>
        </Box>
      </Fade>
    </Box>
  );
}