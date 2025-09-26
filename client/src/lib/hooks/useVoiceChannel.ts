import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  joinVoiceChannel as joinVoiceChannelHub,
  leaveVoiceChannel as leaveVoiceChannelHub,
  on,
  off,
  sendAnswer,
  sendIceCandidate,
  sendOffer,
  startVoiceHub,
  stopVoiceHub,
  type IceCandidatePayload,
  type SessionDescriptionPayload,
  type VoiceChannelJoinResponse,
  type VoiceIceCandidateMessage,
  type VoiceParticipant,
  type VoicePeerUpdate,
  type VoiceSignalMessage,
} from "../realtime/voiceHub";

type LeaveOptions = {
  keepLocalStream?: boolean;
};

const ICE_SERVERS: RTCConfiguration["iceServers"] = [
  { urls: "stun:stun.l.google.com:19302" },
];

export type VoiceChannelState = {
  currentChannelId: string | null;
  participants: VoiceParticipant[];
  allParticipants: VoiceParticipant[];
  remoteStreams: Array<{ connectionId: string; stream: MediaStream }>;
  isJoining: boolean;
  error: string | null;
  join: (channelId: string) => Promise<void>;
  leave: (options?: LeaveOptions) => Promise<void>;
};

export function useVoiceChannel(chatRoomId?: string): VoiceChannelState {
  const participantsRef = useRef(new Map<string, VoiceParticipant>());
  const remoteStreamsRef = useRef(new Map<string, MediaStream>());
  const peerConnectionsRef = useRef(new Map<string, RTCPeerConnection>());
  const localStreamRef = useRef<MediaStream | null>(null);
  const selfConnectionIdRef = useRef<string | null>(null);
  const currentChannelRef = useRef<string | null>(null);

  const [participantsVersion, setParticipantsVersion] = useState(0);
  const [streamsVersion, setStreamsVersion] = useState(0);
  const [currentChannelId, setCurrentChannelId] = useState<string | null>(null);
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const removeRemoteStream = useCallback((connectionId: string) => {
    const stream = remoteStreamsRef.current.get(connectionId);
    if (!stream) return;
    stream.getTracks().forEach((track) => track.stop());
    remoteStreamsRef.current.delete(connectionId);
    setStreamsVersion((prev) => prev + 1);
  }, []);

  const cleanupConnection = useCallback(
    (connectionId: string, removeParticipant = false) => {
      const pc = peerConnectionsRef.current.get(connectionId);
      if (pc) {
        try {
          pc.onicecandidate = null;
          pc.ontrack = null;
          pc.close();
        } catch {
          // ignore close errors
        }
        peerConnectionsRef.current.delete(connectionId);
      }

      removeRemoteStream(connectionId);

      if (removeParticipant) {
        if (participantsRef.current.delete(connectionId)) {
          setParticipantsVersion((prev) => prev + 1);
        }
      }
    },
    [removeRemoteStream]
  );

  const releaseLocalStream = useCallback(() => {
    if (!localStreamRef.current) return;
    localStreamRef.current.getTracks().forEach((track) => track.stop());
    localStreamRef.current = null;
  }, []);

  const resetState = useCallback(
    (stopLocalStream: boolean) => {
      peerConnectionsRef.current.forEach((_, connectionId) =>
        cleanupConnection(connectionId, true)
      );
      peerConnectionsRef.current.clear();

      remoteStreamsRef.current.clear();
      setStreamsVersion((prev) => prev + 1);

      participantsRef.current.clear();
      setParticipantsVersion((prev) => prev + 1);

      selfConnectionIdRef.current = null;
      currentChannelRef.current = null;
      setCurrentChannelId(null);

      if (stopLocalStream) {
        releaseLocalStream();
      }
    },
    [cleanupConnection, releaseLocalStream]
  );

  const ensureLocalStream = useCallback(async () => {
    if (localStreamRef.current) return localStreamRef.current;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
        },
      });
      localStreamRef.current = stream;
      return stream;
    } catch (err) {
      setError("Microphone access was denied");
      throw err;
    }
  }, []);

  const createPeerConnection = useCallback(
    async (connectionId: string): Promise<RTCPeerConnection> => {
      const existing = peerConnectionsRef.current.get(connectionId);
      if (existing) return existing;

      const stream = await ensureLocalStream();

      const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });

      stream.getAudioTracks().forEach((track) => pc.addTrack(track, stream));

      pc.onicecandidate = (event) => {
        if (!event.candidate) return;
        const payload: IceCandidatePayload = {
          candidate: event.candidate.candidate,
          sdpMid: event.candidate.sdpMid ?? null,
          sdpMLineIndex: event.candidate.sdpMLineIndex ?? null,
        };
        sendIceCandidate(connectionId, payload).catch(() => {});
      };

      pc.ontrack = (event) => {
        const [stream] = event.streams;
        if (!stream) return;
        remoteStreamsRef.current.set(connectionId, stream);
        setStreamsVersion((prev) => prev + 1);
      };

      pc.onconnectionstatechange = () => {
        if (
          pc.connectionState === "disconnected" ||
          pc.connectionState === "failed" ||
          pc.connectionState === "closed"
        ) {
          cleanupConnection(connectionId);
        }
      };

      peerConnectionsRef.current.set(connectionId, pc);
      return pc;
    },
    [cleanupConnection, ensureLocalStream]
  );

  const leave = useCallback(
    async (options: LeaveOptions = {}) => {
      const keepLocalStream = options.keepLocalStream ?? false;

      if (!currentChannelRef.current) {
        if (!keepLocalStream) {
          releaseLocalStream();
        }
        return;
      }

      try {
        await leaveVoiceChannelHub();
      } catch {
        // ignored
      }

      resetState(!keepLocalStream);
    },
    [releaseLocalStream, resetState]
  );

  const join = useCallback(
    async (channelId: string) => {
      if (!chatRoomId) {
        setError("You need to open a chat room before joining a voice channel");
        return;
      }

      if (isJoining) return;

      setIsJoining(true);
      setError(null);

      try {
        await startVoiceHub();
        await leave({ keepLocalStream: true });

        const stream = await ensureLocalStream();
        if (!stream) throw new Error("Unable to access microphone");

        const response: VoiceChannelJoinResponse =
          await joinVoiceChannelHub(channelId);

        participantsRef.current.clear();
        for (const participant of response.participants) {
          participantsRef.current.set(participant.connectionId, participant);
        }
        setParticipantsVersion((prev) => prev + 1);

        selfConnectionIdRef.current = response.selfConnectionId;
        currentChannelRef.current = response.channelId;
        setCurrentChannelId(response.channelId);

        for (const participant of response.participants) {
          if (participant.connectionId === response.selfConnectionId) continue;
          try {
            const pc = await createPeerConnection(participant.connectionId);
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            const payload: SessionDescriptionPayload = {
              type: offer.type,
              sdp: offer.sdp ?? "",
            };
            await sendOffer(participant.connectionId, payload);
          } catch (err) {
            if (import.meta.env.DEV) {
              console.error("Failed to send offer", err);
            }
          }
        }
      } catch (err) {
        if (import.meta.env.DEV) console.error(err);
        setError("Unable to join the voice channel");
        await leave({ keepLocalStream: false });
      } finally {
        setIsJoining(false);
      }
    },
    [chatRoomId, createPeerConnection, ensureLocalStream, isJoining, leave]
  );

  useEffect(() => {
    if (!chatRoomId) {
      void leave();
      return;
    }

    let subscribed = false;

    const handlePeerJoined = (update: VoicePeerUpdate) => {
      if (update.channelId !== currentChannelRef.current) return;
      cleanupConnection(update.participant.connectionId);
      participantsRef.current.set(
        update.participant.connectionId,
        update.participant
      );
      setParticipantsVersion((prev) => prev + 1);
    };

    const handlePeerLeft = (update: VoicePeerUpdate) => {
      if (update.channelId !== currentChannelRef.current) return;
      cleanupConnection(update.participant.connectionId, true);
    };

    const handleOffer = (message: VoiceSignalMessage) => {
      if (message.channelId !== currentChannelRef.current) return;
      (async () => {
        try {
          const pc = await createPeerConnection(message.fromConnectionId);
          await pc.setRemoteDescription({
            type: message.description.type as RTCSdpType,
            sdp: message.description.sdp,
          });
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          await sendAnswer(message.fromConnectionId, {
            type: answer.type,
            sdp: answer.sdp ?? "",
          });
        } catch (err) {
          if (import.meta.env.DEV) {
            console.error("Failed to process offer", err);
          }
        }
      })();
    };

    const handleAnswer = (message: VoiceSignalMessage) => {
      if (message.channelId !== currentChannelRef.current) return;
      const pc = peerConnectionsRef.current.get(message.fromConnectionId);
      if (!pc) return;
      pc.setRemoteDescription({
        type: message.description.type as RTCSdpType,
        sdp: message.description.sdp,
      }).catch((err) => {
        if (import.meta.env.DEV) console.error("Failed to apply answer", err);
      });
    };

    const handleIceCandidate = (message: VoiceIceCandidateMessage) => {
      if (message.channelId !== currentChannelRef.current) return;
      const pc = peerConnectionsRef.current.get(message.fromConnectionId);
      if (!pc) return;
      const candidate = {
        candidate: message.candidate.candidate,
        sdpMid: message.candidate.sdpMid ?? undefined,
        sdpMLineIndex: message.candidate.sdpMLineIndex ?? undefined,
      };
      pc.addIceCandidate(candidate as RTCIceCandidateInit).catch((err) => {
        if (import.meta.env.DEV) console.error("Failed to add ICE candidate", err);
      });
    };

    (async () => {
      try {
        await startVoiceHub();
        on<VoicePeerUpdate>("PeerJoined", handlePeerJoined);
        on<VoicePeerUpdate>("PeerLeft", handlePeerLeft);
        on<VoiceSignalMessage>("ReceiveOffer", handleOffer);
        on<VoiceSignalMessage>("ReceiveAnswer", handleAnswer);
        on<VoiceIceCandidateMessage>("ReceiveIceCandidate", handleIceCandidate);
        subscribed = true;
      } catch (err) {
        setError("Failed to connect to the voice service");
        if (import.meta.env.DEV) console.error(err);
      }
    })();

    return () => {
      if (subscribed) {
        off("PeerJoined", handlePeerJoined);
        off("PeerLeft", handlePeerLeft);
        off("ReceiveOffer", handleOffer);
        off("ReceiveAnswer", handleAnswer);
        off("ReceiveIceCandidate", handleIceCandidate);
      }
      void leave();
      void stopVoiceHub().catch(() => {});
    };
  }, [chatRoomId, cleanupConnection, createPeerConnection, leave, resetState]);

  const participantsList = useMemo(
    () => Array.from(participantsRef.current.values()),
    [participantsVersion]
  );

  const uniqueParticipants = useMemo(() => {
    const unique = new Map<string, VoiceParticipant>();
    for (const participant of participantsList) {
      if (!unique.has(participant.userId)) {
        unique.set(participant.userId, participant);
      }
    }
    return Array.from(unique.values());
  }, [participantsList]);

  const remoteStreams = useMemo(
    () =>
      Array.from(remoteStreamsRef.current.entries()).map(([connectionId, stream]) => ({
        connectionId,
        stream,
      })),
    [streamsVersion]
  );

  return {
    currentChannelId,
    participants: uniqueParticipants,
    allParticipants: participantsList,
    remoteStreams,
    isJoining,
    error,
    join,
    leave,
  };
}
