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
  unwatchChatRoom,
  watchChatRoom,
  type IceCandidatePayload,
  type SessionDescriptionPayload,
  type VoiceChannelJoinResponse,
  type VoiceChannelPresence,
  type VoiceChannelPresenceSnapshot,
  type VoiceIceCandidateMessage,
  type VoiceParticipant,
  type VoicePeerUpdate,
  type VoiceSignalMessage,
} from "../realtime/voiceHub";

type LeaveOptions = {
  keepLocalStream?: boolean;
};

type SpeakingMonitor = {
  analyser: AnalyserNode;
  source: MediaStreamAudioSourceNode;
  rafId: number;
  userId: string;
};

type LocalSpeakingMonitor = {
  analyser: AnalyserNode;
  source: MediaStreamAudioSourceNode;
  rafId: number;
  userId: string;
};

const ICE_SERVERS: RTCConfiguration["iceServers"] = [
  { urls: "stun:stun.l.google.com:19302" },
];

export type VoiceChannelState = {
  currentChannelId: string | null;
  participants: VoiceParticipant[];
  allParticipants: VoiceParticipant[];
  presenceByChannel: Record<string, VoiceParticipant[]>;
  remoteStreams: Array<{ connectionId: string; stream: MediaStream; userId: string | null }>;
  participantVolumes: Record<string, number>;
  mutedParticipantIds: string[];
  activeSpeakers: string[];
  isJoining: boolean;
  error: string | null;
  setParticipantVolume: (userId: string, volume: number) => void;
  toggleParticipantMute: (userId: string, muted?: boolean) => void;
  join: (channelId: string) => Promise<void>;
  leave: (options?: LeaveOptions) => Promise<void>;
};

export function useVoiceChannel(
  chatRoomId?: string,
  currentUserId?: string
): VoiceChannelState {
  const participantsRef = useRef(new Map<string, VoiceParticipant>());
  const remoteStreamsRef = useRef(new Map<string, MediaStream>());
  const peerConnectionsRef = useRef(new Map<string, RTCPeerConnection>());
  const localStreamRef = useRef<MediaStream | null>(null);
  const selfConnectionIdRef = useRef<string | null>(null);
  const currentChannelRef = useRef<string | null>(null);
  const channelPresenceRef = useRef(
    new Map<string, Map<string, VoiceParticipant>>()
  );
  const participantVolumeRef = useRef(new Map<string, number>());
  const participantMuteRef = useRef(new Set<string>());
  const audioContextRef = useRef<AudioContext | null>(null);
  const speakingMonitorsRef = useRef(new Map<string, SpeakingMonitor>());
  const localSpeakingMonitorRef = useRef<LocalSpeakingMonitor | null>(null);
  const activeSpeakersRef = useRef(new Set<string>());

  const [participantsVersion, setParticipantsVersion] = useState(0);
  const [streamsVersion, setStreamsVersion] = useState(0);
  const [channelPresenceVersion, setChannelPresenceVersion] = useState(0);
  const [volumeVersion, setVolumeVersion] = useState(0);
  const [muteVersion, setMuteVersion] = useState(0);
  const [speakingVersion, setSpeakingVersion] = useState(0);
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

  const ensureAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext();
    }
    return audioContextRef.current;
  }, []);

  const updateActiveSpeaker = useCallback((userId: string, speaking: boolean) => {
    const set = activeSpeakersRef.current;
    let changed = false;
    if (speaking) {
      if (!set.has(userId)) {
        set.add(userId);
        changed = true;
      }
    } else if (set.delete(userId)) {
      changed = true;
    }
    if (changed) {
      setSpeakingVersion((prev) => prev + 1);
    }
  }, []);

  const stopRemoteSpeakingMonitor = useCallback(
    (connectionId: string) => {
      const monitor = speakingMonitorsRef.current.get(connectionId);
      if (!monitor) return;
      cancelAnimationFrame(monitor.rafId);
      monitor.source.disconnect();
      speakingMonitorsRef.current.delete(connectionId);
      updateActiveSpeaker(monitor.userId, false);
    },
    [updateActiveSpeaker]
  );

  const startRemoteSpeakingMonitor = useCallback(
    (connectionId: string, stream: MediaStream) => {
      const participant = participantsRef.current.get(connectionId);
      if (!participant) return;

      stopRemoteSpeakingMonitor(connectionId);
      const audioContext = ensureAudioContext();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      const data = new Uint8Array(analyser.frequencyBinCount);
      let monitor: SpeakingMonitor;
      const detect = () => {
        analyser.getByteTimeDomainData(data);
        let sum = 0;
        for (let i = 0; i < data.length; i++) {
          const value = (data[i] - 128) / 128;
          sum += value * value;
        }
        const rms = Math.sqrt(sum / data.length);
        updateActiveSpeaker(participant.userId, rms > 0.02);
        monitor.rafId = window.requestAnimationFrame(detect);
      };
      monitor = {
        analyser,
        source,
        rafId: window.requestAnimationFrame(detect),
        userId: participant.userId,
      };
      speakingMonitorsRef.current.set(connectionId, monitor);
      detect();
    },
    [ensureAudioContext, stopRemoteSpeakingMonitor, updateActiveSpeaker]
  );

  const stopLocalSpeakingMonitor = useCallback(() => {
    const monitor = localSpeakingMonitorRef.current;
    if (!monitor) return;
    cancelAnimationFrame(monitor.rafId);
    monitor.source.disconnect();
    localSpeakingMonitorRef.current = null;
    updateActiveSpeaker(monitor.userId, false);
  }, [updateActiveSpeaker]);

  const startLocalSpeakingMonitor = useCallback(
    (stream: MediaStream) => {
      if (!currentUserId) return;
      stopLocalSpeakingMonitor();
      const audioContext = ensureAudioContext();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      const data = new Uint8Array(analyser.frequencyBinCount);
      let monitor: LocalSpeakingMonitor;
      const detect = () => {
        analyser.getByteTimeDomainData(data);
        let sum = 0;
        for (let i = 0; i < data.length; i++) {
          const value = (data[i] - 128) / 128;
          sum += value * value;
        }
        const rms = Math.sqrt(sum / data.length);
        updateActiveSpeaker(currentUserId, rms > 0.02);
        monitor.rafId = window.requestAnimationFrame(detect);
      };
      monitor = {
        analyser,
        source,
        rafId: window.requestAnimationFrame(detect),
        userId: currentUserId,
      };
      localSpeakingMonitorRef.current = monitor;
      detect();
    },
    [currentUserId, ensureAudioContext, stopLocalSpeakingMonitor, updateActiveSpeaker]
  );


  const releaseLocalStream = useCallback(() => {
    stopLocalSpeakingMonitor();
    if (!localStreamRef.current) return;
    localStreamRef.current.getTracks().forEach((track) => track.stop());
    localStreamRef.current = null;
  }, [stopLocalSpeakingMonitor]);

  const setParticipantVolume = useCallback((userId: string, volume: number) => {
    const clamped = Math.min(Math.max(volume, 0), 1);
    participantVolumeRef.current.set(userId, clamped);
    setVolumeVersion((prev) => prev + 1);
  }, []);

  const toggleParticipantMute = useCallback(
    (userId: string, muted?: boolean) => {
      const set = participantMuteRef.current;
      const nextMuted = muted ?? !set.has(userId);
      if (nextMuted) {
        if (!set.has(userId)) {
          set.add(userId);
          setMuteVersion((prev) => prev + 1);
        }
      } else if (set.delete(userId)) {
        setMuteVersion((prev) => prev + 1);
      }
    },
    []
  );

  const setChannelPresence = useCallback(
    (channelId: string, participants: VoiceParticipant[]) => {
      const connections = new Map<string, VoiceParticipant>();
      for (const participant of participants) {
        connections.set(participant.connectionId, participant);
      }
      channelPresenceRef.current.set(channelId, connections);
      setChannelPresenceVersion((prev) => prev + 1);
    },
    []
  );

  const addPresenceParticipant = useCallback(
    (channelId: string, participant: VoiceParticipant) => {
      const channel = channelPresenceRef.current.get(channelId);
      if (!channel) {
        const connections = new Map<string, VoiceParticipant>();
        connections.set(participant.connectionId, participant);
        channelPresenceRef.current.set(channelId, connections);
      } else {
        channel.set(participant.connectionId, participant);
      }
      setChannelPresenceVersion((prev) => prev + 1);
    },
    []
  );

  const removePresenceParticipant = useCallback(
    (channelId: string, connectionId: string) => {
      const channel = channelPresenceRef.current.get(channelId);
      if (!channel) return;
      if (channel.delete(connectionId)) {
        if (channel.size === 0) {
          channelPresenceRef.current.delete(channelId);
        }
        setChannelPresenceVersion((prev) => prev + 1);
      }
    },
    []
  );

  const applyPresenceSnapshot = useCallback(
    (snapshot: VoiceChannelPresenceSnapshot) => {
      const next = new Map<string, Map<string, VoiceParticipant>>();
      for (const channel of snapshot.channels) {
        const connections = new Map<string, VoiceParticipant>();
        for (const participant of channel.participants) {
          connections.set(participant.connectionId, participant);
        }
        next.set(channel.channelId, connections);
      }
      channelPresenceRef.current = next;
      setChannelPresenceVersion((prev) => prev + 1);
    },
    []
  );

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

      stopRemoteSpeakingMonitor(connectionId);
      removeRemoteStream(connectionId);

      if (removeParticipant) {
        const removed = participantsRef.current.delete(connectionId);
        if (removed) {
          setParticipantsVersion((prev) => prev + 1);
        }

        let channelId: string | null = null;
        for (const [candidateChannelId, connections] of channelPresenceRef.current.entries()) {
          if (connections.has(connectionId)) {
            channelId = candidateChannelId;
            break;
          }
        }

        if (!channelId) {
          channelId = currentChannelRef.current;
        }

        if (channelId) {
          removePresenceParticipant(channelId, connectionId);
        }
      }
    },
    [removeRemoteStream, removePresenceParticipant, stopRemoteSpeakingMonitor]
  );
  const resetState = useCallback(
    (stopLocalStream: boolean) => {
      peerConnectionsRef.current.forEach((_, connectionId) =>
        cleanupConnection(connectionId, true)
      );
      peerConnectionsRef.current.clear();

      speakingMonitorsRef.current.forEach((_, connectionId) => {
        stopRemoteSpeakingMonitor(connectionId);
      });
      speakingMonitorsRef.current.clear();
      if (currentUserId) {
        updateActiveSpeaker(currentUserId, false);
      }
      activeSpeakersRef.current.clear();
      setSpeakingVersion((prev) => prev + 1);

      remoteStreamsRef.current.clear();
      setStreamsVersion((prev) => prev + 1);

      participantsRef.current.clear();
      setParticipantsVersion((prev) => prev + 1);

      selfConnectionIdRef.current = null;
      currentChannelRef.current = null;
      setCurrentChannelId(null);

      channelPresenceRef.current.clear();
      setChannelPresenceVersion((prev) => prev + 1);

      if (stopLocalStream) {
        releaseLocalStream();
      }
    },
    [
      cleanupConnection,
      currentUserId,
      releaseLocalStream,
      stopRemoteSpeakingMonitor,
      updateActiveSpeaker,
    ]
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
      startLocalSpeakingMonitor(stream);
      return stream;
    } catch (err) {
      setError("Microphone access was denied");
      throw err;
    }
  }, [startLocalSpeakingMonitor]);

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
        const [trackStream] = event.streams;
        if (!trackStream) return;
        remoteStreamsRef.current.set(connectionId, trackStream);
        setStreamsVersion((prev) => prev + 1);
        startRemoteSpeakingMonitor(connectionId, trackStream);
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
    [cleanupConnection, ensureLocalStream, startRemoteSpeakingMonitor]
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
        setChannelPresence(response.channelId, response.participants);

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
    [
      chatRoomId,
      createPeerConnection,
      ensureLocalStream,
      isJoining,
      leave,
      setChannelPresence,
    ]
  );

  useEffect(() => {
    if (!chatRoomId) {
      void leave();
      return;
    }

    let subscribed = false;
    let hasWatched = false;

    channelPresenceRef.current.clear();
    setChannelPresenceVersion((prev) => prev + 1);

    const handlePeerJoined = (update: VoicePeerUpdate) => {
      if (update.channelId !== currentChannelRef.current) return;
      cleanupConnection(update.participant.connectionId);
      participantsRef.current.set(
        update.participant.connectionId,
        update.participant
      );
      addPresenceParticipant(update.channelId, update.participant);
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

    const handleChannelPresenceUpdated = (update: VoiceChannelPresence) => {
      setChannelPresence(update.channelId, update.participants);
    };

    (async () => {
      try {
        await startVoiceHub();
        on<VoicePeerUpdate>("PeerJoined", handlePeerJoined);
        on<VoicePeerUpdate>("PeerLeft", handlePeerLeft);
        on<VoiceSignalMessage>("ReceiveOffer", handleOffer);
        on<VoiceSignalMessage>("ReceiveAnswer", handleAnswer);
        on<VoiceIceCandidateMessage>("ReceiveIceCandidate", handleIceCandidate);
        on<VoiceChannelPresence>("ChannelPresenceUpdated", handleChannelPresenceUpdated);
        subscribed = true;
      } catch (err) {
        setError("Failed to connect to the voice service");
        if (import.meta.env.DEV) console.error(err);
        return;
      }

      try {
        const snapshot = await watchChatRoom(chatRoomId);
        applyPresenceSnapshot(snapshot);
        hasWatched = true;
      } catch (err) {
        if (import.meta.env.DEV) {
          console.error("Failed to load voice presence snapshot", err);
        }
      }
    })();

    return () => {
      if (subscribed) {
        off("PeerJoined", handlePeerJoined);
        off("PeerLeft", handlePeerLeft);
        off("ReceiveOffer", handleOffer);
        off("ReceiveAnswer", handleAnswer);
        off("ReceiveIceCandidate", handleIceCandidate);
        off("ChannelPresenceUpdated", handleChannelPresenceUpdated);
      }
      if (hasWatched) {
        unwatchChatRoom(chatRoomId).catch(() => {});
      }
      void leave();
      void stopVoiceHub().catch(() => {});
    };
  }, [
    chatRoomId,
    addPresenceParticipant,
    cleanupConnection,
    createPeerConnection,
    leave,
    setChannelPresence,
    applyPresenceSnapshot,
  ]);

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
      Array.from(remoteStreamsRef.current.entries()).map(
        ([connectionId, stream]) => ({
          connectionId,
          stream,
          userId: participantsRef.current.get(connectionId)?.userId ?? null,
        })
      ),
    [streamsVersion, participantsVersion]
  );

  const presenceByChannel = useMemo(() => {
    const result: Record<string, VoiceParticipant[]> = {};
    channelPresenceRef.current.forEach((connections, channelId) => {
      result[channelId] = Array.from(connections.values());
    });
    return result;
  }, [channelPresenceVersion]);

  const participantVolumes = useMemo(() => {
    const result: Record<string, number> = {};
    participantVolumeRef.current.forEach((volume, userId) => {
      result[userId] = volume;
    });
    return result;
  }, [volumeVersion]);

  const mutedParticipantIds = useMemo(
    () => Array.from(participantMuteRef.current),
    [muteVersion]
  );

  const activeSpeakers = useMemo(
    () => Array.from(activeSpeakersRef.current),
    [speakingVersion]
  );

  return {
    currentChannelId,
    participants: uniqueParticipants,
    allParticipants: participantsList,
    presenceByChannel,
    remoteStreams,
    participantVolumes,
    mutedParticipantIds,
    activeSpeakers,
    isJoining,
    error,
    setParticipantVolume,
    toggleParticipantMute,
    join,
    leave,
  };
}
