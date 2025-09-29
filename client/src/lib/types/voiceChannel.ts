import type { VoiceParticipant } from "../realtime/voiceHub";

export type ScreenShareConstraints = {
  width?: number;
  height?: number;
  frameRate?: number;
};

type RemoteAudioStreamInfo = {
  connectionId: string;
  stream: MediaStream;
  userId: string | null;
};

type RemoteVideoStreamInfo = {
  connectionId: string;
  stream: MediaStream;
  userId: string | null;
  mediaType: "camera" | "screen";
};

export type LeaveOptions = {
  keepLocalStream?: boolean;
};

export type SpeakingMonitor = {
  analyser: AnalyserNode;
  source: MediaStreamAudioSourceNode;
  rafId: number;
  userId: string;
};

export type LocalSpeakingMonitor = SpeakingMonitor;

export type VoiceChannelSnapshot = {
  currentChannelId: string | null;
  currentChatRoomId: string | null;
  participants: VoiceParticipant[];
  allParticipants: VoiceParticipant[];
  presenceByChannel: Record<string, VoiceParticipant[]>;
  remoteAudioStreams: RemoteAudioStreamInfo[];
  remoteVideoStreams: RemoteVideoStreamInfo[];
  localCameraStream: MediaStream | null;
  localScreenStream: MediaStream | null;
  isCameraEnabled: boolean;
  isScreenSharing: boolean;
  participantVolumes: Record<string, number>;
  mutedParticipantIds: string[];
  activeSpeakers: string[];
  isJoining: boolean;
  error: string | null;
  isSelfMuted: boolean;
  isSelfDeafened: boolean;
  pingMs: number | null;
  screenShareConstraints: ScreenShareConstraints;
};

export type VoiceChannelState = VoiceChannelSnapshot & {
  setParticipantVolume: (userId: string, volume: number) => void;
  toggleParticipantMute: (userId: string, muted?: boolean) => void;
  setSelfMuted: (muted: boolean) => void;
  toggleSelfMute: () => void;
  setSelfDeafened: (deafened: boolean) => void;
  toggleSelfDeafened: () => void;
  join: (channelId: string) => Promise<void>;
  leave: (options?: LeaveOptions) => Promise<void>;
  startCamera: () => Promise<void>;
  stopCamera: () => Promise<void>;
  toggleCamera: (enabled?: boolean) => Promise<void>;
  startScreenShare: () => Promise<void>;
  stopScreenShare: () => Promise<void>;
  toggleScreenShare: (enabled?: boolean) => Promise<void>;
  setScreenShareConstraints: (constraints: ScreenShareConstraints) => void;
};
