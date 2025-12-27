import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  InputLabel,
  LinearProgress,
  MenuItem,
  Select,
  Slider,
  Stack,
  Typography,
} from "@mui/material";
import { useEffect, useMemo, useRef } from "react";
import { useAccount } from "../../../lib/hooks/useAccount";
import { useVoiceChannel } from "../../../lib/hooks/useVoiceChannel";

type AudioSettingsDialogProps = {
  open: boolean;
  onClose: () => void;
};

export default function AudioSettingsDialog({
  open,
  onClose,
}: AudioSettingsDialogProps) {
  const { currentUser } = useAccount();
  const voice = useVoiceChannel(undefined, currentUser?.id);
  const {
    audioInputDevices,
    audioOutputDevices,
    audioInputDeviceId,
    audioOutputDeviceId,
    outputVolume,
    inputGain,
    noiseGateThresholdDb,
    microphoneLevel,
    isTestingMicrophone,
    microphoneTestStream,
    isAudioDeviceLoading,
    audioDeviceError,
    supportsOutputDeviceSelection,
    refreshAudioDevices,
    setAudioInputDevice,
    setAudioOutputDevice,
    setOutputVolume,
    setInputGain,
    setNoiseGateThresholdDb,
    setMicTestEnabled,
  } = voice;

  const testAudioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (!open) return;
    void refreshAudioDevices();
  }, [open, refreshAudioDevices]);

  useEffect(() => {
    if (open) return;
    if (isTestingMicrophone) {
      void setMicTestEnabled(false);
    }
  }, [open, isTestingMicrophone, setMicTestEnabled]);

  useEffect(() => {
    if (!open) return;
    const audio = testAudioRef.current;
    if (!audio) return;
    if (!isTestingMicrophone || !microphoneTestStream) {
      audio.srcObject = null;
      return;
    }
    audio.srcObject = microphoneTestStream;
    audio.volume = Math.min(Math.max(outputVolume, 0), 1);
    audio.muted = false;
    const playPromise = audio.play();
    if (playPromise) {
      playPromise.catch(() => {
        // ignore autoplay blocking
      });
    }
  }, [open, isTestingMicrophone, microphoneTestStream, outputVolume]);

  useEffect(() => {
    const audio = testAudioRef.current as HTMLAudioElement & {
      setSinkId?: (id: string) => Promise<void>;
    };
    if (!audio?.setSinkId) return;
    const targetId = audioOutputDeviceId ?? "default";
    audio.setSinkId(targetId).catch(() => {});
  }, [audioOutputDeviceId]);

  const inputValue = audioInputDeviceId ?? "default";
  const outputValue = audioOutputDeviceId ?? "default";

  const inputOptions = useMemo(() => {
    return [
      { id: "default", label: "System default" },
      ...audioInputDevices.map((device, index) => ({
        id: device.deviceId,
        label: device.label || `Microphone ${index + 1}`,
      })),
    ];
  }, [audioInputDevices]);

  const outputOptions = useMemo(() => {
    return [
      { id: "default", label: "System default" },
      ...audioOutputDevices.map((device, index) => ({
        id: device.deviceId,
        label: device.label || `Speaker ${index + 1}`,
      })),
    ];
  }, [audioOutputDevices]);

  const microphoneLevelPercent = Math.min(
    100,
    Math.round(microphoneLevel * 120)
  );

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Settings</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={3}>
          <Box>
            <Typography variant="subtitle1" fontWeight={700}>
              Audio devices
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Default devices are selected automatically. Choose a specific device
              if you want to override it.
            </Typography>
          </Box>

          {isAudioDeviceLoading && (
            <LinearProgress sx={{ height: 6, borderRadius: 999 }} />
          )}

          <Stack spacing={2}>
            <FormControl fullWidth size="small" disabled={isAudioDeviceLoading}>
              <InputLabel id="audio-input-select">Input device</InputLabel>
              <Select
                labelId="audio-input-select"
                value={inputValue}
                label="Input device"
                onChange={(event) => {
                  const value = event.target.value as string;
                  void setAudioInputDevice(value === "default" ? null : value);
                }}
              >
                {inputOptions.map((option) => (
                  <MenuItem key={option.id} value={option.id}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl
              fullWidth
              size="small"
              disabled={!supportsOutputDeviceSelection || isAudioDeviceLoading}
            >
              <InputLabel id="audio-output-select">Output device</InputLabel>
              <Select
                labelId="audio-output-select"
                value={outputValue}
                label="Output device"
                onChange={(event) => {
                  const value = event.target.value as string;
                  setAudioOutputDevice(value === "default" ? null : value);
                }}
              >
                {outputOptions.map((option) => (
                  <MenuItem key={option.id} value={option.id}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {!supportsOutputDeviceSelection && (
              <Typography variant="caption" color="text.secondary">
                Output device selection is not supported in this browser.
              </Typography>
            )}

            {audioDeviceError && (
              <Typography variant="caption" color="error">
                {audioDeviceError}
              </Typography>
            )}
          </Stack>

          <Divider />

          <Box>
            <Typography variant="subtitle1" fontWeight={700}>
              Levels
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Control input sensitivity and overall output volume.
            </Typography>
          </Box>

          <Stack spacing={2}>
            <Box>
              <Stack direction="row" justifyContent="space-between" mb={1}>
                <Typography variant="body2">Output volume</Typography>
                <Typography variant="body2" color="text.secondary">
                  {Math.round(outputVolume * 100)}%
                </Typography>
              </Stack>
              <Slider
                value={Math.round(outputVolume * 100)}
                onChange={(_, value) => {
                  const numeric = Array.isArray(value) ? value[0] : value;
                  setOutputVolume(numeric / 100);
                }}
                min={0}
                max={100}
              />
            </Box>

            <Box>
              <Stack direction="row" justifyContent="space-between" mb={1}>
                <Typography variant="body2">Input gain</Typography>
                <Typography variant="body2" color="text.secondary">
                  {Math.round(inputGain * 100)}%
                </Typography>
              </Stack>
              <Slider
                value={Math.round(inputGain * 100)}
                onChange={(_, value) => {
                  const numeric = Array.isArray(value) ? value[0] : value;
                  setInputGain(numeric / 100);
                }}
                min={0}
                max={200}
              />
            </Box>
          </Stack>

          <Divider />

          <Box>
            <Typography variant="subtitle1" fontWeight={700}>
              Microphone test
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Test your microphone and tune the noise gate so background noise
              stays muted.
            </Typography>
          </Box>

          <Stack spacing={2}>
            <Stack direction="row" spacing={1} alignItems="center">
              <Button
                variant={isTestingMicrophone ? "contained" : "outlined"}
                onClick={() => void setMicTestEnabled(!isTestingMicrophone)}
              >
                {isTestingMicrophone ? "Stop test" : "Test microphone"}
              </Button>
              <Typography variant="body2" color="text.secondary">
                {isTestingMicrophone ? "Listening..." : "Idle"}
              </Typography>
            </Stack>

            <Box>
              <Stack direction="row" justifyContent="space-between" mb={1}>
                <Typography variant="body2">Input level</Typography>
                <Typography variant="body2" color="text.secondary">
                  {microphoneLevelPercent}%
                </Typography>
              </Stack>
              <LinearProgress
                variant="determinate"
                value={microphoneLevelPercent}
                sx={{ height: 8, borderRadius: 999 }}
              />
            </Box>

            <Box>
              <Stack direction="row" justifyContent="space-between" mb={1}>
                <Typography variant="body2">Noise gate threshold</Typography>
                <Typography variant="body2" color="text.secondary">
                  {Math.round(noiseGateThresholdDb)} dB
                </Typography>
              </Stack>
              <Slider
                value={Math.round(noiseGateThresholdDb)}
                onChange={(_, value) => {
                  const numeric = Array.isArray(value) ? value[0] : value;
                  setNoiseGateThresholdDb(numeric);
                }}
                min={-80}
                max={-10}
              />
            </Box>
          </Stack>
        </Stack>
        <audio ref={testAudioRef} autoPlay playsInline style={{ display: "none" }} />
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}
