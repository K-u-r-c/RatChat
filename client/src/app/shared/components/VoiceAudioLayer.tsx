import { useEffect, useMemo, useRef } from "react";
import { useVoiceChannel } from "../../../lib/hooks/useVoiceChannel";
import { useAccount } from "../../../lib/hooks/useAccount";

type RemoteAudioProps = {
  stream: MediaStream;
  volume: number;
  muted: boolean;
};

function RemoteAudio({ stream, volume, muted }: RemoteAudioProps) {
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.srcObject = stream;
    const playPromise = audio.play();
    if (playPromise) {
      playPromise.catch(() => {
        // Ignore autoplay rejections; user interaction will resolve it later.
      });
    }
  }, [stream]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = Math.min(Math.max(volume, 0), 1);
    audio.muted = muted;
  }, [muted, volume]);

  return (
    <audio ref={audioRef} autoPlay playsInline style={{ display: "none" }} />
  );
}

export default function VoiceAudioLayer() {
  const { currentUser } = useAccount();
  const voice = useVoiceChannel(undefined, currentUser?.id);

  const {
    leave,
    currentChannelId,
    mutedParticipantIds,
    participantVolumes,
    remoteAudioStreams,
    isSelfDeafened,
  } = voice;

  useEffect(() => {
    if (!currentUser && currentChannelId) {
      void leave();
    }
  }, [currentUser, currentChannelId, leave]);

  const mutedSet = useMemo(
    () => new Set(mutedParticipantIds),
    [mutedParticipantIds]
  );

  return (
    <>
      {remoteAudioStreams.map(({ connectionId, stream, userId }) => {
        const volume = userId ? participantVolumes[userId] ?? 1 : 1;
        const muted = isSelfDeafened || (userId ? mutedSet.has(userId) : false);
        return (
          <RemoteAudio
            key={connectionId}
            stream={stream}
            volume={volume}
            muted={muted}
          />
        );
      })}
    </>
  );
}
