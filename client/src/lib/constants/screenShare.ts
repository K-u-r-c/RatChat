import type {
  ScreenShareAudioMode,
  ScreenShareConstraints,
} from "../types/voiceChannel";

export type ScreenResolutionOption = {
  id: string;
  label: string;
  width?: number;
  height?: number;
};

export type ScreenFrameRateOption = {
  id: string;
  label: string;
  fps?: number;
};

export type ScreenAudioOption = {
  id: ScreenShareAudioMode;
  label: string;
  helperText?: string;
};

export const SCREEN_RESOLUTION_OPTIONS: ScreenResolutionOption[] = [
  { id: "auto", label: "Match source", width: undefined, height: undefined },
  { id: "720p", label: "1280 × 720 (720p)", width: 1280, height: 720 },
  { id: "1080p", label: "1920 × 1080 (1080p)", width: 1920, height: 1080 },
  { id: "1440p", label: "2560 × 1440 (1440p)", width: 2560, height: 1440 },
  { id: "2160p", label: "3840 × 2160 (4K)", width: 3840, height: 2160 },
];

export const SCREEN_FRAME_RATE_OPTIONS: ScreenFrameRateOption[] = [
  { id: "auto", label: "Auto", fps: undefined },
  { id: "15", label: "15 FPS", fps: 15 },
  { id: "24", label: "24 FPS", fps: 24 },
  { id: "30", label: "30 FPS", fps: 30 },
  { id: "60", label: "60 FPS", fps: 60 },
];

export const SCREEN_AUDIO_OPTIONS: ScreenAudioOption[] = [
  {
    id: "none",
    label: "Don't share audio",
    helperText: "Screen video only.",
  },
  {
    id: "application",
    label: "Share app audio",
    helperText: "Includes audio from the window or tab you pick.",
  },
  {
    id: "system",
    label: "Share system audio",
    helperText: "Capture full system sound when sharing your screen.",
  },
];

export const DEFAULT_SCREEN_RESOLUTION_OPTION_ID = "1080p";
export const DEFAULT_SCREEN_FRAME_RATE_OPTION_ID = "30";

export const getResolutionOptionForConstraints = (
  constraints: ScreenShareConstraints
): ScreenResolutionOption => {
  const { width, height } = constraints;
  const match = SCREEN_RESOLUTION_OPTIONS.find(
    (option) => option.width === width && option.height === height
  );

  if (match) {
    return match;
  }

  return (
    SCREEN_RESOLUTION_OPTIONS.find(
      (option) => option.id === DEFAULT_SCREEN_RESOLUTION_OPTION_ID
    ) ?? SCREEN_RESOLUTION_OPTIONS[0]
  );
};

export const getFrameRateOptionForConstraints = (
  constraints: ScreenShareConstraints
): ScreenFrameRateOption => {
  const { frameRate } = constraints;
  const match = SCREEN_FRAME_RATE_OPTIONS.find(
    (option) => option.fps === frameRate
  );

  if (match) {
    return match;
  }

  return (
    SCREEN_FRAME_RATE_OPTIONS.find(
      (option) => option.id === DEFAULT_SCREEN_FRAME_RATE_OPTION_ID
    ) ?? SCREEN_FRAME_RATE_OPTIONS[0]
  );
};

export const getAudioOptionForConstraints = (
  constraints: ScreenShareConstraints
): ScreenAudioOption => {
  const audio: ScreenShareAudioMode = constraints.audio ?? "none";
  const match = SCREEN_AUDIO_OPTIONS.find((option) => option.id === audio);
  if (match) {
    return match;
  }
  return SCREEN_AUDIO_OPTIONS[0];
};
