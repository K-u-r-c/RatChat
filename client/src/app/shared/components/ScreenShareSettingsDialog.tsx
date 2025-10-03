import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  ButtonBase,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import { ScreenShareRounded } from "@mui/icons-material";
import type {
  ScreenShareAudioMode,
  ScreenShareConstraints,
} from "../../../lib/types/voiceChannel";
import {
  SCREEN_AUDIO_OPTIONS,
  SCREEN_FRAME_RATE_OPTIONS,
  SCREEN_RESOLUTION_OPTIONS,
  getAudioOptionForConstraints,
  getFrameRateOptionForConstraints,
  getResolutionOptionForConstraints,
} from "../../../lib/constants/screenShare";
import { isDesktopRuntime } from "../../../lib/environment/runtime";
import { fetchDesktopScreenSources } from "../../../lib/desktop/screenShare";
import type { DesktopScreenSource } from "../../../lib/environment/runtime";

export type ScreenShareSelection = {
  constraints: ScreenShareConstraints;
  sourceId?: string | null;
};

export type ScreenShareSettingsDialogProps = {
  open: boolean;
  initialConstraints: ScreenShareConstraints;
  onCancel: () => void;
  onConfirm: (selection: ScreenShareSelection) => Promise<void> | void;
  isSubmitting?: boolean;
};

export default function ScreenShareSettingsDialog({
  open,
  initialConstraints,
  onCancel,
  onConfirm,
  isSubmitting = false,
}: ScreenShareSettingsDialogProps) {
  const [resolutionId, setResolutionId] = useState(
    () => getResolutionOptionForConstraints(initialConstraints).id
  );
  const [frameRateId, setFrameRateId] = useState(
    () => getFrameRateOptionForConstraints(initialConstraints).id
  );
  const [audioId, setAudioId] = useState<ScreenShareAudioMode>(
    () => getAudioOptionForConstraints(initialConstraints).id
  );
  const [sources, setSources] = useState<DesktopScreenSource[]>([]);
  const [selectedSourceId, setSelectedSourceId] = useState<string | null>(null);
  const [isLoadingSources, setIsLoadingSources] = useState(false);
  const [sourceError, setSourceError] = useState<string | null>(null);

  useEffect(() => {
    setResolutionId(getResolutionOptionForConstraints(initialConstraints).id);
  }, [initialConstraints]);

  useEffect(() => {
    setFrameRateId(getFrameRateOptionForConstraints(initialConstraints).id);
  }, [initialConstraints]);

  useEffect(() => {
    setAudioId(getAudioOptionForConstraints(initialConstraints).id);
  }, [initialConstraints]);

  useEffect(() => {
    if (!isDesktopRuntime) {
      return;
    }

    if (!open) {
      setSources([]);
      setSelectedSourceId(null);
      setIsLoadingSources(false);
      setSourceError(null);
      return;
    }

    let cancelled = false;
    setIsLoadingSources(true);
    setSourceError(null);

    void fetchDesktopScreenSources()
      .then((items) => {
        if (cancelled) return;
        setSources(items);
        setIsLoadingSources(false);
        setSelectedSourceId((previous) => {
          if (previous && items.some((source) => source.id === previous)) {
            return previous;
          }
          return items.length > 0 ? items[0].id : null;
        });
      })
      .catch((error) => {
        if (cancelled) return;
        setIsLoadingSources(false);
        setSelectedSourceId(null);
        setSources([]);
        setSourceError(
          error instanceof Error ? error.message : "Unable to load sources"
        );
      });

    return () => {
      cancelled = true;
    };
  }, [open]);

  const selectedResolution = useMemo(() => {
    return (
      SCREEN_RESOLUTION_OPTIONS.find((option) => option.id === resolutionId) ||
      getResolutionOptionForConstraints(initialConstraints)
    );
  }, [initialConstraints, resolutionId]);

  const selectedFrameRate = useMemo(() => {
    return (
      SCREEN_FRAME_RATE_OPTIONS.find((option) => option.id === frameRateId) ||
      getFrameRateOptionForConstraints(initialConstraints)
    );
  }, [frameRateId, initialConstraints]);

  const selectedAudioOption = useMemo(() => {
    return (
      SCREEN_AUDIO_OPTIONS.find((option) => option.id === audioId) ||
      getAudioOptionForConstraints(initialConstraints)
    );
  }, [audioId, initialConstraints]);

  const handleConfirm = useCallback(async () => {
    const constraints: ScreenShareConstraints = {
      width: selectedResolution.width,
      height: selectedResolution.height,
      frameRate: selectedFrameRate.fps,
      audio: selectedAudioOption.id,
    };

    await onConfirm({
      constraints,
      sourceId: isDesktopRuntime ? selectedSourceId : undefined,
    });
  }, [
    onConfirm,
    selectedFrameRate.fps,
    selectedAudioOption.id,
    selectedSourceId,
    selectedResolution.height,
    selectedResolution.width,
  ]);

  const handleResolutionChange = useCallback(
    (_: unknown, value: string | null) => {
      if (value === null) return;
      setResolutionId(value);
    },
    []
  );

  const handleFrameRateChange = useCallback(
    (_: unknown, value: string | null) => {
      if (value === null) return;
      setFrameRateId(value);
    },
    []
  );

  const handleAudioChange = useCallback(
    (_: unknown, value: string | null) => {
      if (value === null) return;
      setAudioId(value as ScreenShareAudioMode);
    },
    []
  );

  const handleSourceSelect = useCallback((sourceId: string) => {
    setSelectedSourceId(sourceId);
  }, []);

  const canConfirm = useMemo(() => {
    if (!isDesktopRuntime) {
      return true;
    }
    if (isLoadingSources) {
      return false;
    }
    if (sourceError) {
      return false;
    }
    return Boolean(selectedSourceId);
  }, [isLoadingSources, selectedSourceId, sourceError]);

  return (
    <Dialog
      open={open}
      onClose={isSubmitting ? undefined : onCancel}
      aria-labelledby="screen-share-settings-dialog"
      maxWidth="xs"
      fullWidth
    >
      <DialogTitle id="screen-share-settings-dialog">
        Choose what to share
      </DialogTitle>
      <DialogContent sx={{ pt: 1 }}>
        <Stack spacing={3}>
          <Typography variant="body2" color="text.secondary">
            {isDesktopRuntime
              ? "Pick the resolution and frame rate for your stream, then choose which screen or window to share below."
              : "Pick the resolution and frame rate for your stream. After you continue, your browser will ask you to choose the window or screen to share."}
          </Typography>

          {isDesktopRuntime ? (
            <Stack spacing={1.5}>
              <Typography variant="subtitle2" fontWeight={600}>
                Screen or window
              </Typography>
              {isLoadingSources ? (
                <Stack
                  spacing={1}
                  alignItems="center"
                  justifyContent="center"
                  sx={{ py: 3 }}
                >
                  <CircularProgress size={24} />
                  <Typography variant="caption" color="text.secondary">
                    Loading available sources…
                  </Typography>
                </Stack>
              ) : sourceError ? (
                <Typography variant="body2" color="error">
                  {sourceError}
                </Typography>
              ) : sources.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  No shareable sources were found.
                </Typography>
              ) : (
                <Box
                  sx={{
                    display: "grid",
                    gap: 1.5,
                    gridTemplateColumns: {
                      xs: "1fr",
                      sm: "1fr 1fr",
                    },
                  }}
                >
                  {sources.map((source) => {
                    const selected = source.id === selectedSourceId;
                    return (
                      <ButtonBase
                        key={source.id}
                        onClick={() => handleSourceSelect(source.id)}
                        disabled={isSubmitting}
                        sx={{
                          position: "relative",
                          borderRadius: 2,
                          border: (theme) =>
                            `2px solid ${
                              selected
                                ? theme.palette.primary.main
                                : theme.palette.divider
                            }`,
                          overflow: "hidden",
                          p: 1,
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "stretch",
                          gap: 1,
                          textAlign: "left",
                          bgcolor: selected
                            ? "action.selected"
                            : "background.paper",
                          transition: (theme) =>
                            theme.transitions.create(["border-color", "box-shadow"], {
                              duration: theme.transitions.duration.shorter,
                            }),
                          boxShadow: selected ? 2 : 0,
                        }}
                      >
                        <Box
                          sx={{
                            width: "100%",
                            aspectRatio: "16 / 9",
                            borderRadius: 1,
                            overflow: "hidden",
                            bgcolor: "background.default",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          {source.thumbnail ? (
                            <Box
                              component="img"
                              src={source.thumbnail}
                              alt={source.name}
                              sx={{
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                              }}
                            />
                          ) : (
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              No preview available
                            </Typography>
                          )}
                        </Box>
                        <Stack spacing={0.5} alignItems="flex-start">
                          <Typography
                            variant="body2"
                            fontWeight={600}
                            sx={{ maxWidth: "100%" }}
                            noWrap
                          >
                            {source.name}
                          </Typography>
                          <Chip
                            size="small"
                            label={
                              source.sourceType === "screen"
                                ? "Screen"
                                : "Window"
                            }
                          />
                        </Stack>
                      </ButtonBase>
                    );
                  })}
                </Box>
              )}
            </Stack>
          ) : null}

          <Stack spacing={1.5}>
            <Typography variant="subtitle2" fontWeight={600}>
              Resolution
            </Typography>
            <ToggleButtonGroup
              color="primary"
              exclusive
              value={resolutionId}
              onChange={handleResolutionChange}
              orientation="vertical"
            >
              {SCREEN_RESOLUTION_OPTIONS.map((option) => (
                <ToggleButton
                  key={option.id}
                  value={option.id}
                  disabled={isSubmitting}
                  sx={{ justifyContent: "flex-start", textTransform: "none" }}
                >
                  {option.label}
                </ToggleButton>
              ))}
            </ToggleButtonGroup>
          </Stack>

          <Stack spacing={1.5}>
            <Typography variant="subtitle2" fontWeight={600}>
              Frame rate
            </Typography>
            <ToggleButtonGroup
              color="primary"
              exclusive
              value={frameRateId}
              onChange={handleFrameRateChange}
              orientation="vertical"
            >
              {SCREEN_FRAME_RATE_OPTIONS.map((option) => (
                <ToggleButton
                  key={option.id}
                  value={option.id}
                  disabled={isSubmitting}
                  sx={{ justifyContent: "flex-start", textTransform: "none" }}
                >
                  {option.label}
                </ToggleButton>
              ))}
            </ToggleButtonGroup>
          </Stack>

          <Stack spacing={1.5}>
            <Typography variant="subtitle2" fontWeight={600}>
              Audio
            </Typography>
            <ToggleButtonGroup
              color="primary"
              exclusive
              value={audioId}
              onChange={handleAudioChange}
              orientation="vertical"
            >
              {SCREEN_AUDIO_OPTIONS.map((option) => (
                <ToggleButton
                  key={option.id}
                  value={option.id}
                  disabled={isSubmitting}
                  sx={{
                    justifyContent: "flex-start",
                    textTransform: "none",
                    alignItems: "flex-start",
                  }}
                >
                  <Stack spacing={0.5} alignItems="flex-start">
                    <Typography variant="body2" fontWeight={600}>
                      {option.label}
                    </Typography>
                    {option.helperText ? (
                      <Typography variant="caption" color="text.secondary">
                        {option.helperText}
                      </Typography>
                    ) : null}
                  </Stack>
                </ToggleButton>
              ))}
            </ToggleButtonGroup>
            <Typography variant="caption" color="text.secondary">
              System audio is only available when sharing your entire screen and
              may not be supported by all browsers.
            </Typography>
          </Stack>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button
          onClick={handleConfirm}
          variant="contained"
          startIcon={<ScreenShareRounded />}
          disabled={isSubmitting || !canConfirm}
        >
          Share screen
        </Button>
      </DialogActions>
    </Dialog>
  );
}
