import type {VoiceParticipant} from "../realtime/voiceHub.ts";

export type ParticipantTileData = {
  id: string;
  participant: VoiceParticipant | null;
  stream: MediaStream | null;
  videoType?: "camera" | "screen";
  connectionId?: string;
  userId: string | null;
  displayName: string;
  avatarUrl?: string;
  isSelf: boolean;
};

export type ParticipantTileProps = {
  tile: ParticipantTileData;
  isSelected: boolean;
  onSelect: () => void;
  isActiveSpeaker: boolean;
  isMuted: boolean;
};
