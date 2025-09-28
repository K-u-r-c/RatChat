import {useEffect, useSyncExternalStore} from "react";
import {
  type IceCandidatePayload,
  joinVoiceChannel as joinVoiceChannelHub,
  leaveVoiceChannel as leaveVoiceChannelHub,
  off,
  on,
  sendAnswer,
  sendIceCandidate,
  sendOffer,
  type SessionDescriptionPayload,
  startVoiceHub,
  stopVoiceHub,
  unwatchChatRoom,
  type VoiceChannelJoinResponse,
  type VoiceChannelPresence,
  type VoiceChannelPresenceSnapshot,
  type VoiceIceCandidateMessage,
  type VoiceParticipant,
  type VoicePeerUpdate,
  type VoiceSignalMessage,
  watchChatRoom,
} from "../realtime/voiceHub";

import type {
  LeaveOptions,
  LocalSpeakingMonitor,
  SpeakingMonitor,
  VoiceChannelSnapshot,
  VoiceChannelState,
} from "../types/voiceChannel";

export type {VoiceChannelState} from "../types/voiceChannel";

const ICE_SERVERS: RTCConfiguration["iceServers"] = [
  {urls: "stun:stun.l.google.com:19302"},
];
const PING_REFRESH_INTERVAL_MS = 5000;
const PING_HTTP_TIMEOUT_MS = 2000;

type MaybeNetworkInformation = {
  rtt?: number;
};

type NavigatorWithConnection = Navigator & {
  connection?: MaybeNetworkInformation;
  mozConnection?: MaybeNetworkInformation;
  webkitConnection?: MaybeNetworkInformation;
};

class VoiceManager {
  private participants = new Map<string, VoiceParticipant>();
  private remoteStreams = new Map<string, MediaStream>();
  private peerConnections = new Map<string, RTCPeerConnection>();
  private localStream: MediaStream | null = null;
  private currentChannelId: string | null = null;
  private channelPresence = new Map<string, Map<string, VoiceParticipant>>();
  private participantVolumes = new Map<string, number>();
  private participantMute = new Set<string>();
  private audioContext: AudioContext | null = null;
  private speakingMonitors = new Map<string, SpeakingMonitor>();
  private localSpeakingMonitor: LocalSpeakingMonitor | null = null;
  private activeSpeakers = new Set<string>();
  private isJoining = false;
  private error: string | null = null;
  private currentUserId: string | null = null;
  private selfMuted = false;
  private selfDeafened = false;
  private selfMutedBeforeDeafen: boolean | null = null;
  private pingUpdateInterval: number | null = null;
  private pingMeasurementPromise: Promise<void> | null = null;
  private pingHttpAbortController: AbortController | null = null;
  private pingTargets: string[] | null = null;
  private pingMs: number | null = null;

  private listeners = new Set<() => void>();

  private hubStartPromise: Promise<void> | null = null;
  private hubHandlersAttached = false;

  private watchedChatRoomId: string | null = null;
  private watchedChatRoomRefCount = 0;
  private presenceWatchToken: symbol | null = null;
  private isWatchingChatRoom = false;
  private pendingPresenceRelease = false;

  private _version = 0;
  private _snapshotVersion = -1;
  private _cachedSnapshot: VoiceChannelSnapshot = {
    currentChannelId: null,
    currentChatRoomId: null,
    participants: [],
    allParticipants: [],
    presenceByChannel: {},
    remoteStreams: [],
    participantVolumes: {},
    mutedParticipantIds: [],
    activeSpeakers: [],
    isJoining: false,
    error: null,
    isSelfMuted: false,
    isSelfDeafened: false,
    pingMs: null,
  };

  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  getSnapshot = (): VoiceChannelSnapshot => {
    if (this._snapshotVersion !== this._version) {
      this._cachedSnapshot = {
        currentChannelId: this.currentChannelId,
        currentChatRoomId: this.watchedChatRoomId,
        participants: this.getUniqueParticipants(),
        allParticipants: Array.from(this.participants.values()),
        presenceByChannel: this.buildPresenceMap(),
        remoteStreams: this.buildRemoteStreams(),
        participantVolumes: this.buildParticipantVolumeRecord(),
        mutedParticipantIds: Array.from(this.participantMute),
        activeSpeakers: Array.from(this.activeSpeakers),
        isJoining: this.isJoining,
        error: this.error,
        isSelfMuted: this.selfMuted,
        isSelfDeafened: this.selfDeafened,
        pingMs: this.pingMs,
      };
      this._snapshotVersion = this._version;
    }
    return this._cachedSnapshot;
  };

  setCurrentUser = (userId: string | null) => {
    if (this.currentUserId === userId) return;
    if (this.currentUserId && this.currentUserId !== userId) {
      this.updateActiveSpeaker(this.currentUserId, false);
      this.stopLocalSpeakingMonitor();
    }
    this.currentUserId = userId;
    if (!userId) {
      void this.forceDisconnect();
    }
  };

  trackChatRoomPresence = (chatRoomId: string | null) => {
    if (!chatRoomId) {
      this.releasePresenceWatch();
      return () => {
      };
    }

    const id = chatRoomId;

    if (this.watchedChatRoomId && this.watchedChatRoomId !== id) {
      this.releasePresenceWatch();
    }

    this.watchedChatRoomId = id;
    this.watchedChatRoomRefCount += 1;

    if (!this.isWatchingChatRoom) {
      void this.startPresenceWatch(id);
    }

    return () => {
      if (this.watchedChatRoomId !== id) return;
      this.watchedChatRoomRefCount = Math.max(
        0,
        this.watchedChatRoomRefCount - 1
      );
      if (this.watchedChatRoomRefCount === 0) {
        this.schedulePresenceRelease();
      }
    };
  };

  setParticipantVolume = (userId: string, volume: number) => {
    const clamped = Math.min(Math.max(volume, 0), 1);
    const existing = this.participantVolumes.get(userId);
    if (existing === clamped) return;
    this.participantVolumes.set(userId, clamped);
    this.emit();
  };

  toggleParticipantMute = (userId: string, muted?: boolean) => {
    const set = this.participantMute;
    const nextMuted = muted ?? !set.has(userId);
    if (nextMuted) {
      if (!set.has(userId)) {
        set.add(userId);
        this.emit();
      }
    } else if (set.delete(userId)) {
      this.emit();
    }
  };

  setSelfMuted = (muted: boolean) => {
    const next = Boolean(muted);
    if (this.selfDeafened && !next) {
      return;
    }
    if (this.selfMuted === next) return;
    this.selfMuted = next;
    if (!this.selfDeafened) {
      this.selfMutedBeforeDeafen = null;
    }
    this.applyLocalMuteState();
    this.emit();
  };

  toggleSelfMute = () => {
    if (this.selfDeafened) return;
    this.setSelfMuted(!this.selfMuted);
  };

  setSelfDeafened = (deafened: boolean) => {
    const next = Boolean(deafened);
    if (this.selfDeafened === next) return;
    this.selfDeafened = next;
    if (next) {
      this.selfMutedBeforeDeafen = this.selfMuted;
      if (!this.selfMuted) {
        this.selfMuted = true;
      }
    } else {
      const restore = this.selfMutedBeforeDeafen ?? false;
      this.selfMuted = restore;
      this.selfMutedBeforeDeafen = null;
    }
    this.applyLocalMuteState();
    this.emit();
  };

  toggleSelfDeafened = () => {
    this.setSelfDeafened(!this.selfDeafened);
  };

  join = async (channelId: string) => {
    if (!this.watchedChatRoomId) {
      this.setError(
        "You need to open a chat room before joining a voice channel"
      );
      return;
    }

    if (this.isJoining) return;

    this.isJoining = true;
    this.setError(null);
    this.emit();

    try {
      await this.ensureHub();
      await this.leave({keepLocalStream: true});

      const stream = await this.ensureLocalStream();
      if (!stream) throw new Error("Unable to access microphone");

      const response: VoiceChannelJoinResponse = await joinVoiceChannelHub(
        channelId
      );

      this.participants.clear();
      for (const participant of response.participants) {
        this.participants.set(participant.connectionId, participant);
      }

      this.currentChannelId = response.channelId;
      this.setChannelPresence(response.channelId, response.participants);
      this.ensurePingMonitor(true);
      this.emit();

      for (const participant of response.participants) {
        if (participant.connectionId === response.selfConnectionId) continue;
        try {
          const pc = await this.createPeerConnection(participant.connectionId);
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
      this.setError("Unable to join the voice channel");
      await this.leave({keepLocalStream: false});
    } finally {
      this.isJoining = false;
      this.emit();
    }
  };

  leave = async (options: LeaveOptions = {}) => {
    const keepLocalStream = options.keepLocalStream ?? false;

    if (!this.currentChannelId) {
      if (!keepLocalStream) {
        this.releaseLocalStream();
      }
      return;
    }

    try {
      await leaveVoiceChannelHub();
    } catch {
      // ignored
    }

    this.resetState(!keepLocalStream);
    this.emit();
  };

  forceDisconnect = async () => {
    await this.leave({keepLocalStream: false});
    await this.stopHub();
  };

  private applyLocalMuteState() {
    if (!this.localStream) return;
    const disable = this.selfMuted || this.selfDeafened;
    this.localStream.getAudioTracks().forEach((track) => {
      track.enabled = !disable;
    });
  }

  private emit() {
    this._version++;
    this.listeners.forEach((listener) => listener());
  }

  private async ensureHub() {
    if (this.hubStartPromise) {
      await this.hubStartPromise;
      return;
    }

    this.hubStartPromise = startVoiceHub()
      .then(() => {
        this.attachHubHandlers();
      })
      .catch((err) => {
        this.hubStartPromise = null;
        throw err;
      });

    await this.hubStartPromise;
  }

  private async stopHub() {
    if (this.hubHandlersAttached) {
      off("PeerJoined", this.handlePeerJoined);
      off("PeerLeft", this.handlePeerLeft);
      off("ReceiveOffer", this.handleOffer);
      off("ReceiveAnswer", this.handleAnswer);
      off("ReceiveIceCandidate", this.handleIceCandidate);
      off("ChannelPresenceUpdated", this.handleChannelPresenceUpdated);
      this.hubHandlersAttached = false;
    }
    await stopVoiceHub().catch(() => {
    });
    this.hubStartPromise = null;
  }

  private attachHubHandlers() {
    if (this.hubHandlersAttached) return;
    on<VoicePeerUpdate>("PeerJoined", this.handlePeerJoined);
    on<VoicePeerUpdate>("PeerLeft", this.handlePeerLeft);
    on<VoiceSignalMessage>("ReceiveOffer", this.handleOffer);
    on<VoiceSignalMessage>("ReceiveAnswer", this.handleAnswer);
    on<VoiceIceCandidateMessage>(
      "ReceiveIceCandidate",
      this.handleIceCandidate
    );
    on<VoiceChannelPresence>(
      "ChannelPresenceUpdated",
      this.handleChannelPresenceUpdated
    );
    this.hubHandlersAttached = true;
  }

  private schedulePresenceRelease() {
    if (this.pendingPresenceRelease) return;
    this.pendingPresenceRelease = true;
    Promise.resolve().then(() => {
      this.pendingPresenceRelease = false;
      if (this.watchedChatRoomRefCount === 0) {
        this.releasePresenceWatch();
      }
    });
  }

  private releasePresenceWatch() {
    this.pendingPresenceRelease = false;
    const chatRoomId = this.watchedChatRoomId;
    this.watchedChatRoomId = null;
    this.watchedChatRoomRefCount = 0;
    this.presenceWatchToken = null;
    this.isWatchingChatRoom = false;
    if (chatRoomId) {
      unwatchChatRoom(chatRoomId).catch(() => {
      });
    }
    this.channelPresence.clear();
    this.emit();
  }

  private async startPresenceWatch(chatRoomId: string) {
    const token = Symbol(chatRoomId);
    this.presenceWatchToken = token;
    this.isWatchingChatRoom = false;
    this.channelPresence.clear();
    this.emit();

    try {
      await this.ensureHub();
    } catch (err) {
      this.setError("Failed to connect to the voice service");
      if (import.meta.env.DEV) console.error(err);
      return;
    }

    try {
      const snapshot = await watchChatRoom(chatRoomId);
      if (this.presenceWatchToken !== token) return;
      this.applyPresenceSnapshot(snapshot);
      this.isWatchingChatRoom = true;
      this.emit();
    } catch (err) {
      if (import.meta.env.DEV) {
        console.error("Failed to load voice presence snapshot", err);
      }
    }
  }

  private applyPresenceSnapshot(snapshot: VoiceChannelPresenceSnapshot) {
    const next = new Map<string, Map<string, VoiceParticipant>>();
    for (const channel of snapshot.channels) {
      const connections = new Map<string, VoiceParticipant>();
      for (const participant of channel.participants) {
        connections.set(participant.connectionId, participant);
      }
      next.set(channel.channelId, connections);
    }
    this.channelPresence = next;
    this.emit();
  }

  private buildPresenceMap(): Record<string, VoiceParticipant[]> {
    const result: Record<string, VoiceParticipant[]> = {};
    this.channelPresence.forEach((connections, channelId) => {
      result[channelId] = Array.from(connections.values());
    });
    return result;
  }

  private buildRemoteStreams() {
    return Array.from(this.remoteStreams.entries()).map(
      ([connectionId, stream]) => ({
        connectionId,
        stream,
        userId: this.participants.get(connectionId)?.userId ?? null,
      })
    );
  }

  private buildParticipantVolumeRecord() {
    const record: Record<string, number> = {};
    this.participantVolumes.forEach((volume, userId) => {
      record[userId] = volume;
    });
    return record;
  }

  private getUniqueParticipants(): VoiceParticipant[] {
    const unique = new Map<string, VoiceParticipant>();
    for (const participant of this.participants.values()) {
      if (!unique.has(participant.userId)) {
        unique.set(participant.userId, participant);
      }
    }
    return Array.from(unique.values());
  }

  private setError(message: string | null) {
    if (this.error === message) return;
    this.error = message;
    this.emit();
  }

  private ensureAudioContext() {
    if (!this.audioContext) {
      this.audioContext = new AudioContext();
    }
    return this.audioContext;
  }

  private updateActiveSpeaker(userId: string, speaking: boolean) {
    const set = this.activeSpeakers;
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
      this.emit();
    }
  }

  private stopRemoteSpeakingMonitor(connectionId: string) {
    const monitor = this.speakingMonitors.get(connectionId);
    if (!monitor) return;
    cancelAnimationFrame(monitor.rafId);
    monitor.source.disconnect();
    this.speakingMonitors.delete(connectionId);
    this.updateActiveSpeaker(monitor.userId, false);
  }

  private startRemoteSpeakingMonitor(
    connectionId: string,
    stream: MediaStream
  ) {
    this.stopRemoteSpeakingMonitor(connectionId);

    const audioContext = this.ensureAudioContext();
    const source = audioContext.createMediaStreamSource(stream);
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 256;
    source.connect(analyser);
    const data = new Uint8Array(analyser.frequencyBinCount);
    const participant = this.participants.get(connectionId);
    if (!participant) return;

    const monitor: SpeakingMonitor = {
      analyser,
      source,
      rafId: 0,
      userId: participant.userId,
    };
    this.speakingMonitors.set(connectionId, monitor);

    const detect = () => {
      analyser.getByteTimeDomainData(data);
      let sum = 0;
      for (let i = 0; i < data.length; i++) {
        const value = (data[i] - 128) / 128;
        sum += value * value;
      }
      const rms = Math.sqrt(sum / data.length);
      this.updateActiveSpeaker(participant.userId, rms > 0.02);
      monitor.rafId = window.requestAnimationFrame(detect);
    };

    detect();
  }

  private stopLocalSpeakingMonitor() {
    const monitor = this.localSpeakingMonitor;
    if (!monitor) return;
    cancelAnimationFrame(monitor.rafId);
    monitor.source.disconnect();
    this.localSpeakingMonitor = null;
    this.updateActiveSpeaker(monitor.userId, false);
  }

  private startLocalSpeakingMonitor(stream: MediaStream) {
    const userId = this.currentUserId;
    if (!userId) return;
    this.stopLocalSpeakingMonitor();
    const audioContext = this.ensureAudioContext();
    const source = audioContext.createMediaStreamSource(stream);
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 256;
    source.connect(analyser);
    const data = new Uint8Array(analyser.frequencyBinCount);
    const monitor: LocalSpeakingMonitor = {
      analyser,
      source,
      rafId: 0,
      userId,
    };
    this.localSpeakingMonitor = monitor;

    const detect = () => {
      analyser.getByteTimeDomainData(data);
      let sum = 0;
      for (let i = 0; i < data.length; i++) {
        const value = (data[i] - 128) / 128;
        sum += value * value;
      }
      const rms = Math.sqrt(sum / data.length);
      if (this.currentUserId) {
        this.updateActiveSpeaker(this.currentUserId, rms > 0.02);
      }
      monitor.rafId = window.requestAnimationFrame(detect);
    };

    detect();
  }

  private releaseLocalStream() {
    this.stopLocalSpeakingMonitor();
    if (!this.localStream) return;
    this.localStream.getTracks().forEach((track) => track.stop());
    this.localStream = null;
  }

  private async ensureLocalStream(): Promise<MediaStream | null> {
    if (this.localStream) return this.localStream;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
        },
      });
      this.localStream = stream;
      this.startLocalSpeakingMonitor(stream);
      this.applyLocalMuteState();
      return stream;
    } catch (err) {
      this.setError("Microphone access was denied");
      throw err;
    }
  }

  private cleanupConnection(connectionId: string, removeParticipant = false) {
    const pc = this.peerConnections.get(connectionId);
    if (pc) {
      try {
        pc.onicecandidate = null;
        pc.ontrack = null;
        pc.close();
      } catch {
        // ignore close errors
      }
      this.peerConnections.delete(connectionId);
    }

    this.stopRemoteSpeakingMonitor(connectionId);

    const stream = this.remoteStreams.get(connectionId);
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      this.remoteStreams.delete(connectionId);
    }

    if (removeParticipant) {
      if (this.participants.delete(connectionId)) {
        this.emit();
      }

      let channelId: string | null = null;
      for (const [
        candidateChannelId,
        connections,
      ] of this.channelPresence.entries()) {
        if (connections.has(connectionId)) {
          channelId = candidateChannelId;
          break;
        }
      }

      if (!channelId) {
        channelId = this.currentChannelId;
      }

      if (channelId) {
        this.removePresenceParticipant(channelId, connectionId);
      }
    }

    this.emit();
  }

  private resetState(stopLocalStream: boolean) {
    const previousChannelId = this.currentChannelId;
    const currentUserId = this.currentUserId;

    this.peerConnections.forEach((_, connectionId) =>
      this.cleanupConnection(connectionId)
    );
    this.peerConnections.clear();

    this.speakingMonitors.forEach((_, connectionId) => {
      this.stopRemoteSpeakingMonitor(connectionId);
    });
    this.speakingMonitors.clear();

    if (currentUserId) {
      this.updateActiveSpeaker(currentUserId, false);
    }
    this.activeSpeakers.clear();

    this.remoteStreams.clear();
    this.participants.clear();

    this.stopPingMonitor();
    this.pingMs = null;

    if (previousChannelId && currentUserId) {
      const channel = this.channelPresence.get(previousChannelId);
      if (channel) {
        for (const [connectionId, participant] of channel) {
          if (participant.userId === currentUserId) {
            channel.delete(connectionId);
            if (channel.size === 0) {
              this.channelPresence.delete(previousChannelId);
            }
            break;
          }
        }
      }
    }

    this.currentChannelId = null;

    if (stopLocalStream) {
      this.releaseLocalStream();
    }
  }

  private async createPeerConnection(
    connectionId: string
  ): Promise<RTCPeerConnection> {
    const existing = this.peerConnections.get(connectionId);
    if (existing) return existing;

    const stream = await this.ensureLocalStream();

    const pc = new RTCPeerConnection({iceServers: ICE_SERVERS});

    stream?.getAudioTracks().forEach((track) => pc.addTrack(track, stream));

    pc.onicecandidate = (event) => {
      if (!event.candidate) return;
      const payload: IceCandidatePayload = {
        candidate: event.candidate.candidate,
        sdpMid: event.candidate.sdpMid ?? null,
        sdpMLineIndex: event.candidate.sdpMLineIndex ?? null,
      };
      sendIceCandidate(connectionId, payload).catch(() => {
      });
    };

    pc.ontrack = (event) => {
      const [trackStream] = event.streams;
      if (!trackStream) return;
      this.remoteStreams.set(connectionId, trackStream);
      this.startRemoteSpeakingMonitor(connectionId, trackStream);
      this.emit();
    };

    pc.onconnectionstatechange = () => {
      if (
        pc.connectionState === "disconnected" ||
        pc.connectionState === "failed" ||
        pc.connectionState === "closed"
      ) {
        this.cleanupConnection(connectionId);
      }
    };

    this.peerConnections.set(connectionId, pc);
    this.ensurePingMonitor();
    return pc;
  }

  private setChannelPresence(
    channelId: string,
    participants: VoiceParticipant[]
  ) {
    const connections = new Map<string, VoiceParticipant>();
    for (const participant of participants) {
      connections.set(participant.connectionId, participant);
    }
    this.channelPresence.set(channelId, connections);
    this.emit();
  }

  private addPresenceParticipant(
    channelId: string,
    participant: VoiceParticipant
  ) {
    const channel = this.channelPresence.get(channelId);
    if (!channel) {
      const connections = new Map<string, VoiceParticipant>();
      connections.set(participant.connectionId, participant);
      this.channelPresence.set(channelId, connections);
    } else {
      channel.set(participant.connectionId, participant);
    }
    this.emit();
  }

  private removePresenceParticipant(channelId: string, connectionId: string) {
    const channel = this.channelPresence.get(channelId);
    if (!channel) return;
    if (channel.delete(connectionId)) {
      if (channel.size === 0) {
        this.channelPresence.delete(channelId);
      }
      this.emit();
    }
  }

  private ensurePingMonitor(immediate = false) {
    if (typeof window === "undefined") return;
    if (this.pingUpdateInterval == null) {
      const run = () => {
        void this.collectPingMeasurement();
      };
      this.pingUpdateInterval = window.setInterval(run, PING_REFRESH_INTERVAL_MS);
    }
    if (immediate) {
      void this.collectPingMeasurement();
    }
  }

  private stopPingMonitor() {
    if (typeof window !== "undefined" && this.pingUpdateInterval != null) {
      window.clearInterval(this.pingUpdateInterval);
    }
    this.pingUpdateInterval = null;
    this.pingHttpAbortController?.abort();
    this.pingHttpAbortController = null;
    this.pingMeasurementPromise = null;
  }

  private collectPingMeasurement(): Promise<void> | undefined {
    if (this.pingMeasurementPromise) {
      return this.pingMeasurementPromise;
    }

    this.pingMeasurementPromise = (async () => {
      const rtcPing = await this.measureRtcPing();
      if (rtcPing != null) {
        this.applyPingUpdate(rtcPing);
        return;
      }

      const networkPing = this.measureNetworkInformation();
      if (networkPing != null) {
        this.applyPingUpdate(networkPing);
        return;
      }

      const httpPing = await this.measureHttpPing();
      if (httpPing != null) {
        this.applyPingUpdate(httpPing);
        return;
      }

      this.applyPingUpdate(null);
    })()
      .catch(() => {
        this.applyPingUpdate(null);
      })
      .finally(() => {
        this.pingMeasurementPromise = null;
      });

    return this.pingMeasurementPromise;
  }

  private async measureRtcPing(): Promise<number | null> {
    if (this.peerConnections.size === 0) {
      return null;
    }

    const pingValues: number[] = [];

    await Promise.all(
      Array.from(this.peerConnections.values()).map(async (pc) => {
        try {
          const stats = await pc.getStats();
          stats.forEach((report) => {
            if (report.type !== "candidate-pair") return;

            const candidatePair = report as RTCIceCandidatePairStats & {
              currentRoundTripTime?: number;
              totalRoundTripTime?: number;
              responsesReceived?: number;
              nominated?: boolean;
            };

            if (candidatePair.nominated === false) {
              return;
            }

            const state = candidatePair.state;
            if (
              state &&
              state !== "succeeded" &&
              state !== "in-progress"
            ) {
              return;
            }

            let rttSeconds =
              typeof candidatePair.currentRoundTripTime === "number"
                ? candidatePair.currentRoundTripTime
                : undefined;

            if (
              (rttSeconds == null || rttSeconds <= 0) &&
              typeof candidatePair.totalRoundTripTime === "number" &&
              typeof candidatePair.responsesReceived === "number" &&
              candidatePair.responsesReceived > 0
            ) {
              rttSeconds =
                candidatePair.totalRoundTripTime /
                candidatePair.responsesReceived;
            }

            if (
              typeof rttSeconds === "number" &&
              isFinite(rttSeconds) &&
              rttSeconds > 0
            ) {
              pingValues.push(rttSeconds * 1000);
            }
          });
        } catch {
          // Ignore statistics collection errors.
        }
      })
    );

    if (pingValues.length === 0) {
      return null;
    }

    const average =
      pingValues.reduce((sum, value) => sum + value, 0) / pingValues.length;
    return Math.max(0, Math.round(average));
  }

  private measureNetworkInformation(): number | null {
    if (typeof navigator === "undefined") return null;
    const nav = navigator as NavigatorWithConnection;
    const connection =
      nav.connection ?? nav.mozConnection ?? nav.webkitConnection;

    if (!connection) return null;

    const rtt = connection.rtt;
    if (typeof rtt === "number" && isFinite(rtt) && rtt > 0) {
      return Math.round(rtt);
    }
    return null;
  }

  private async measureHttpPing(): Promise<number | null> {
    if (typeof fetch !== "function") return null;

    const targets = this.getPingTargets();
    for (const target of targets) {
      const measurement = await this.measureHttpPingForTarget(target);
      if (measurement != null) {
        return measurement;
      }
    }

    return null;
  }

  private getPingTargets(): string[] {
    if (this.pingTargets) {
      return this.pingTargets;
    }

    const targets = new Set<string>();

    if (typeof window !== "undefined") {
      targets.add(new URL("/", window.location.origin).toString());
    }

    const explicitTarget = import.meta.env.VITE_PING_URL as string | undefined;
    if (explicitTarget) {
      try {
        const resolved = new URL(explicitTarget, typeof window !== "undefined" ? window.location.origin : undefined);
        resolved.hash = "";
        targets.add(resolved.toString());
      } catch {
        // If the configured value is invalid, fall back to default target.
      }
    }

    this.pingTargets = Array.from(targets);
    return this.pingTargets;
  }

  private async measureHttpPingForTarget(target: string): Promise<number | null> {
    if (typeof window === "undefined") return null;

    const attempt = async (
      method: "HEAD" | "GET"
    ): Promise<{ value: number | null; retry?: boolean }> => {
      this.pingHttpAbortController?.abort();
      const controller = new AbortController();
      this.pingHttpAbortController = controller;

      let url: URL;
      try {
        url = new URL(target);
      } catch {
        if (typeof window === "undefined") return {value: null};
        try {
          url = new URL(target, window.location.origin);
        } catch {
          return {value: null};
        }
      }

      url.searchParams.set(
        "_ping",
        `${Date.now().toString(36)}-${method}`
      );

      const start = performance.now();
      const timeoutId = window.setTimeout(
        () => controller.abort(),
        PING_HTTP_TIMEOUT_MS
      );

      try {
        const response = await fetch(url.toString(), {
          method,
          credentials: "include",
          cache: "no-store",
          signal: controller.signal,
        });
        const end = performance.now();

        if (!response.ok) {
          if (
            method === "HEAD" &&
            (response.status === 405 || response.status === 501)
          ) {
            return {value: null, retry: true};
          }
          return {value: null};
        }

        return {value: Math.max(0, Math.round(end - start))};
      } catch (error) {
        if ((error as DOMException)?.name === "AbortError") {
          return {value: null};
        }
        return {value: null};
      } finally {
        window.clearTimeout(timeoutId);
        if (this.pingHttpAbortController === controller) {
          this.pingHttpAbortController = null;
        }
      }
    };

    const headResult = await attempt("HEAD");
    if (headResult.retry) {
      const getResult = await attempt("GET");
      return getResult.value;
    }

    return headResult.value;
  }

  private applyPingUpdate(value: number | null) {
    if (this.pingMs === value) return;
    this.pingMs = value;
    this.emit();
  }

  private handlePeerJoined = (update: VoicePeerUpdate) => {
    let dirty = false;
    if (update.channelId === this.currentChannelId) {
      this.cleanupConnection(update.participant.connectionId);
      this.participants.set(
        update.participant.connectionId,
        update.participant
      );
      dirty = true;
    }
    if (this.isWatchingChatRoom) {
      this.addPresenceParticipant(update.channelId, update.participant);
      dirty = true;
    }
    if (dirty) this.emit();
  };

  private handlePeerLeft = (update: VoicePeerUpdate) => {
    if (update.channelId === this.currentChannelId) {
      this.cleanupConnection(update.participant.connectionId, true);
      this.emit();
    } else if (this.isWatchingChatRoom) {
      this.removePresenceParticipant(
        update.channelId,
        update.participant.connectionId
      );
    }
  };

  private handleOffer = (message: VoiceSignalMessage) => {
    if (message.channelId !== this.currentChannelId) return;
    (async () => {
      try {
        const pc = await this.createPeerConnection(message.fromConnectionId);
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

  private handleAnswer = (message: VoiceSignalMessage) => {
    if (message.channelId !== this.currentChannelId) return;
    const pc = this.peerConnections.get(message.fromConnectionId);
    if (!pc) return;
    pc.setRemoteDescription({
      type: message.description.type as RTCSdpType,
      sdp: message.description.sdp,
    }).catch((err) => {
      if (import.meta.env.DEV) {
        console.error("Failed to apply answer", err);
      }
    });
  };

  private handleIceCandidate = (message: VoiceIceCandidateMessage) => {
    if (message.channelId !== this.currentChannelId) return;
    const pc = this.peerConnections.get(message.fromConnectionId);
    if (!pc) return;
    const candidate = {
      candidate: message.candidate.candidate,
      sdpMid: message.candidate.sdpMid ?? undefined,
      sdpMLineIndex: message.candidate.sdpMLineIndex ?? undefined,
    };
    pc.addIceCandidate(candidate as RTCIceCandidateInit).catch((err) => {
      if (import.meta.env.DEV) {
        console.error("Failed to add ICE candidate", err);
      }
    });
  };

  private handleChannelPresenceUpdated = (update: VoiceChannelPresence) => {
    this.setChannelPresence(update.channelId, update.participants);
  };
}

const voiceManager = new VoiceManager();

export function useVoiceChannel(
  chatRoomId?: string,
  currentUserId?: string
): VoiceChannelState {
  const snapshot = useSyncExternalStore(
    voiceManager.subscribe,
    voiceManager.getSnapshot,
    voiceManager.getSnapshot
  );

  useEffect(() => {
    voiceManager.setCurrentUser(currentUserId ?? null);
  }, [currentUserId]);

  useEffect(() => {
    if (!chatRoomId) {
      return;
    }

    return voiceManager.trackChatRoomPresence(chatRoomId);
  }, [chatRoomId]);

  return {
    ...snapshot,
    setParticipantVolume: voiceManager.setParticipantVolume,
    toggleParticipantMute: voiceManager.toggleParticipantMute,
    setSelfMuted: voiceManager.setSelfMuted,
    toggleSelfMute: voiceManager.toggleSelfMute,
    setSelfDeafened: voiceManager.setSelfDeafened,
    toggleSelfDeafened: voiceManager.toggleSelfDeafened,
    join: voiceManager.join,
    leave: voiceManager.leave,
  };
}
