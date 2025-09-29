import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Button,
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
import type { ScreenShareConstraints } from "../../../lib/types/voiceChannel";
import {
  SCREEN_FRAME_RATE_OPTIONS,
  SCREEN_RESOLUTION_OPTIONS,
  getFrameRateOptionForConstraints,
  getResolutionOptionForConstraints,
} from "../../../lib/constants/screenShare";

export type ScreenShareSettingsDialogProps = {
  open: boolean;
  initialConstraints: ScreenShareConstraints;
  onCancel: () => void;
  onConfirm: (constraints: ScreenShareConstraints) => Promise<void> | void;
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

  useEffect(() => {
    setResolutionId(getResolutionOptionForConstraints(initialConstraints).id);
  }, [initialConstraints]);

  useEffect(() => {
    setFrameRateId(getFrameRateOptionForConstraints(initialConstraints).id);
  }, [initialConstraints]);

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

  const handleConfirm = useCallback(async () => {
    const constraints: ScreenShareConstraints = {
      width: selectedResolution.width,
      height: selectedResolution.height,
      frameRate: selectedFrameRate.fps,
    };

    await onConfirm(constraints);
  }, [
    onConfirm,
    selectedFrameRate.fps,
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
            Pick the resolution and frame rate for your stream. After you
            continue, your browser will ask you to choose the window or screen
            to share.
          </Typography>

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
          disabled={isSubmitting}
        >
          Share screen
        </Button>
      </DialogActions>
    </Dialog>
  );
}
