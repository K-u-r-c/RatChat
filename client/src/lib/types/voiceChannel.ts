import type { VoiceParticipant } from "../realtime/voiceHub";

type RemoteStreamInfo = {
  connectionId: string;
  stream: MediaStream;
  userId: string | null;
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
  remoteStreams: RemoteStreamInfo[];
  participantVolumes: Record<string, number>;
  mutedParticipantIds: string[];
  activeSpeakers: string[];
  isJoining: boolean;
  error: string | null;
};

export type VoiceChannelState = VoiceChannelSnapshot & {
  setParticipantVolume: (userId: string, volume: number) => void;
  toggleParticipantMute: (userId: string, muted?: boolean) => void;
  join: (channelId: string) => Promise<void>;
  leave: (options?: LeaveOptions) => Promise<void>;
};
