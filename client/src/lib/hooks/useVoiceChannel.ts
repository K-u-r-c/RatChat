import { useEffect, useSyncExternalStore } from "react";
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
  updateMediaState,
  type VoiceChannelJoinResponse,
  type VoiceChannelPresence,
  type VoiceChannelPresenceSnapshot,
  type VoiceIceCandidateMessage,
  type VoiceMediaState,
  type VoiceParticipant,
  type VoicePeerUpdate,
  type VoiceSignalMessage,
  watchChatRoom,
} from "../realtime/voiceHub";

import type {
  LeaveOptions,
  LocalSpeakingMonitor,
  ScreenShareConstraints,
  SpeakingMonitor,
  VoiceChannelSnapshot,
  VoiceChannelState,
} from "../types/voiceChannel";

export type { VoiceChannelState } from "../types/voiceChannel";

const ICE_SERVERS: RTCConfiguration["iceServers"] = [
  { urls: "stun:stun.l.google.com:19302" },
];
const PING_REFRESH_INTERVAL_MS = 5000;
const PING_HTTP_TIMEOUT_MS = 2000;

const DEFAULT_SCREEN_SHARE_CONSTRAINTS: ScreenShareConstraints = {
  width: 1920,
  height: 1080,
  frameRate: 30,
};

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
  private remoteAudioStreams = new Map<string, MediaStream>();
  private remoteVideoStreams = new Map<
    string,
    Map<"camera" | "screen", MediaStream>
  >();
  private remoteVideoStreamTypes = new Map<string, "camera" | "screen">();
  private peerConnections = new Map<string, RTCPeerConnection>();
  private localMicrophoneStream: MediaStream | null = null;
  private localCameraStream: MediaStream | null = null;
  private localScreenStream: MediaStream | null = null;
  private localCameraEndedHandler: (() => void) | null = null;
  private localScreenEndedHandler: (() => void) | null = null;
  private videoSenders = new Map<
    string,
    { camera?: RTCRtpSender; screen?: RTCRtpSender }
  >();
  private negotiationStates = new Map<
    string,
    {
      busy: boolean;
      pending: boolean;
    }
  >();
  private isCameraEnabled = false;
  private isScreenSharing = false;
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
  private selfConnectionId: string | null = null;
  private selfMuted = false;
  private selfDeafened = false;
  private selfMutedBeforeDeafen: boolean | null = null;
  private pingUpdateInterval: number | null = null;
  private pingMeasurementPromise: Promise<void> | null = null;
  private pingHttpAbortController: AbortController | null = null;
  private pingTargets: string[] | null = null;
  private pingMs: number | null = null;
  private screenShareConstraints: ScreenShareConstraints = {
    ...DEFAULT_SCREEN_SHARE_CONSTRAINTS,
  };

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
    remoteAudioStreams: [],
    remoteVideoStreams: [],
    localCameraStream: null,
    localScreenStream: null,
    isCameraEnabled: false,
    isScreenSharing: false,
    participantVolumes: {},
    mutedParticipantIds: [],
    activeSpeakers: [],
    isJoining: false,
    error: null,
    isSelfMuted: false,
    isSelfDeafened: false,
    pingMs: null,
    screenShareConstraints: {
      ...DEFAULT_SCREEN_SHARE_CONSTRAINTS,
    },
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
        remoteAudioStreams: this.buildRemoteAudioStreams(),
        remoteVideoStreams: this.buildRemoteVideoStreams(),
        localCameraStream: this.localCameraStream,
        localScreenStream: this.localScreenStream,
        isCameraEnabled: this.isCameraEnabled,
        isScreenSharing: this.isScreenSharing,
        participantVolumes: this.buildParticipantVolumeRecord(),
        mutedParticipantIds: Array.from(this.participantMute),
        activeSpeakers: Array.from(this.activeSpeakers),
        isJoining: this.isJoining,
        error: this.error,
        isSelfMuted: this.selfMuted,
        isSelfDeafened: this.selfDeafened,
        pingMs: this.pingMs,
        screenShareConstraints: {
          ...this.screenShareConstraints,
        },
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
      return () => {};
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
    if (this.selfConnectionId) {
      this.applyParticipantMediaState(this.selfConnectionId, {
        isMuted: this.selfMuted,
      });
    }
    this.applyLocalMuteState();
    this.emit();
    void this.syncMediaState();
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
    if (this.selfConnectionId) {
      this.applyParticipantMediaState(this.selfConnectionId, {
        isMuted: this.selfMuted,
      });
    }
    this.applyLocalMuteState();
    this.emit();
    void this.syncMediaState();
  };

  toggleSelfDeafened = () => {
    this.setSelfDeafened(!this.selfDeafened);
  };

  startCamera = async () => {
    await this.setLocalVideoEnabled("camera", true);
  };

  stopCamera = async () => {
    await this.setLocalVideoEnabled("camera", false);
  };

  toggleCamera = async (enabled?: boolean) => {
    const next = typeof enabled === "boolean" ? enabled : !this.isCameraEnabled;
    await this.setLocalVideoEnabled("camera", next);
  };

  startScreenShare = async () => {
    await this.setLocalVideoEnabled("screen", true);
  };

  stopScreenShare = async () => {
    await this.setLocalVideoEnabled("screen", false);
  };

  toggleScreenShare = async (enabled?: boolean) => {
    const next = typeof enabled === "boolean" ? enabled : !this.isScreenSharing;
    await this.setLocalVideoEnabled("screen", next);
  };

  setScreenShareConstraints = (constraints: ScreenShareConstraints) => {
    const previous = this.screenShareConstraints;
    const next: ScreenShareConstraints = {
      ...previous,
      ...constraints,
    };

    const changed =
      (next.width ?? null) !== (previous.width ?? null) ||
      (next.height ?? null) !== (previous.height ?? null) ||
      (next.frameRate ?? null) !== (previous.frameRate ?? null);

    this.screenShareConstraints = next;
    this.emit();

    if (changed && this.isScreenSharing) {
      void this.applyScreenShareConstraintsToActiveTrack();
    }
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
      await this.leave({ keepLocalStream: true });

      const stream = await this.ensureLocalMicrophoneStream();
      if (!stream) throw new Error("Unable to access microphone");

      const response: VoiceChannelJoinResponse = await joinVoiceChannelHub(
        channelId
      );

      this.participants.clear();
      for (const participant of response.participants) {
        this.participants.set(participant.connectionId, participant);
      }

      this.selfConnectionId = response.selfConnectionId;
      if (this.selfConnectionId) {
        this.applyParticipantMediaState(this.selfConnectionId, {
          isCameraEnabled: this.isCameraEnabled,
          isScreenSharing: this.isScreenSharing,
          isMuted: this.selfMuted,
        });
      }

      this.currentChannelId = response.channelId;
      this.setChannelPresence(response.channelId, response.participants);
      this.ensurePingMonitor(true);
      this.emit();
      void this.syncMediaState();

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
      await this.leave({ keepLocalStream: false });
    } finally {
      this.isJoining = false;
      this.emit();
    }
  };

  leave = async (options: LeaveOptions = {}) => {
    const keepLocalStream = options.keepLocalStream ?? false;

    await this.setLocalVideoEnabled("screen", false, false);
    await this.setLocalVideoEnabled("camera", false, false);

    if (!this.currentChannelId) {
      if (!keepLocalStream) {
        this.releaseLocalMicrophoneStream();
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
    await this.leave({ keepLocalStream: false });
    await this.stopHub();
  };

  private applyLocalMuteState() {
    if (!this.localMicrophoneStream) return;
    const disable = this.selfMuted || this.selfDeafened;
    this.localMicrophoneStream.getAudioTracks().forEach((track) => {
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
      off("PeerMediaStateChanged", this.handlePeerMediaStateChanged);
      this.hubHandlersAttached = false;
    }
    await stopVoiceHub().catch(() => {});
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
    on<VoiceMediaState>(
      "PeerMediaStateChanged",
      this.handlePeerMediaStateChanged
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
      unwatchChatRoom(chatRoomId).catch(() => {});
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

  private buildRemoteAudioStreams() {
    return Array.from(this.remoteAudioStreams.entries()).map(
      ([connectionId, stream]) => ({
        connectionId,
        stream,
        userId: this.participants.get(connectionId)?.userId ?? null,
      })
    );
  }

  private buildRemoteVideoStreams() {
    const result: {
      connectionId: string;
      stream: MediaStream;
      userId: string | null;
      mediaType: "camera" | "screen";
    }[] = [];
    this.remoteVideoStreams.forEach((streams, connectionId) => {
      streams.forEach((stream, mediaType) => {
        result.push({
          connectionId,
          stream,
          userId: this.participants.get(connectionId)?.userId ?? null,
          mediaType,
        });
      });
    });
    return result;
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

  private releaseLocalMicrophoneStream() {
    this.stopLocalSpeakingMonitor();
    if (!this.localMicrophoneStream) return;
    this.localMicrophoneStream.getTracks().forEach((track) => track.stop());
    this.localMicrophoneStream = null;
  }

  private async ensureLocalMicrophoneStream(): Promise<MediaStream | null> {
    if (this.localMicrophoneStream) return this.localMicrophoneStream;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
        },
      });
      this.localMicrophoneStream = stream;
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
        pc.onnegotiationneeded = null;
        pc.onsignalingstatechange = null;
        pc.close();
      } catch {
        // ignore close errors
      }
      this.peerConnections.delete(connectionId);
    }

    this.stopRemoteSpeakingMonitor(connectionId);

    this.negotiationStates.delete(connectionId);

    this.remoteAudioStreams.delete(connectionId);
    const videoStreams = this.remoteVideoStreams.get(connectionId);
    if (videoStreams) {
      videoStreams.forEach((videoStream) => {
        this.remoteVideoStreamTypes.delete(videoStream.id);
      });
    }
    this.remoteVideoStreams.delete(connectionId);
    this.videoSenders.delete(connectionId);
    this.applyParticipantMediaState(connectionId, {
      isCameraEnabled: false,
      isScreenSharing: false,
    });

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

  private resetState(stopLocalMicrophoneStream: boolean) {
    const previousChannelId = this.currentChannelId;
    const currentUserId = this.currentUserId;

    this.peerConnections.forEach((_, connectionId) =>
      this.cleanupConnection(connectionId)
    );
    this.peerConnections.clear();

    this.detachLocalVideoTrack("camera");
    this.detachLocalVideoTrack("screen");
    this.videoSenders.clear();

    this.speakingMonitors.forEach((_, connectionId) => {
      this.stopRemoteSpeakingMonitor(connectionId);
    });
    this.speakingMonitors.clear();

    if (currentUserId) {
      this.updateActiveSpeaker(currentUserId, false);
    }
    this.activeSpeakers.clear();

    this.remoteAudioStreams.clear();
    this.remoteVideoStreams.clear();
    this.remoteVideoStreamTypes.clear();
    this.participants.clear();

    this.isCameraEnabled = false;
    this.isScreenSharing = false;
    this.selfConnectionId = null;

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

    if (this.localCameraStream) {
      const track = this.localCameraStream.getVideoTracks()[0];
      if (track && this.localCameraEndedHandler) {
        track.removeEventListener("ended", this.localCameraEndedHandler);
      }
      this.localCameraStream.getTracks().forEach((localTrack) => {
        try {
          localTrack.stop();
        } catch {
          // ignore
        }
      });
      this.localCameraStream = null;
      this.localCameraEndedHandler = null;
    }

    if (this.localScreenStream) {
      const track = this.localScreenStream.getVideoTracks()[0];
      if (track && this.localScreenEndedHandler) {
        track.removeEventListener("ended", this.localScreenEndedHandler);
      }
      this.localScreenStream.getTracks().forEach((localTrack) => {
        try {
          localTrack.stop();
        } catch {
          // ignore
        }
      });
      this.localScreenStream = null;
      this.localScreenEndedHandler = null;
    }

    if (stopLocalMicrophoneStream) {
      this.releaseLocalMicrophoneStream();
    }

    this.emit();
  }

  private getVideoSenderEntry(connectionId: string) {
    let entry = this.videoSenders.get(connectionId);
    if (!entry) {
      entry = {};
      this.videoSenders.set(connectionId, entry);
    }
    return entry;
  }

  private getNegotiationState(connectionId: string) {
    let state = this.negotiationStates.get(connectionId);
    if (!state) {
      state = { busy: false, pending: false };
      this.negotiationStates.set(connectionId, state);
    }
    return state;
  }

  private updateSenderStreams(
    sender: RTCRtpSender,
    stream: MediaStream | null
  ) {
    const candidate = sender as RTCRtpSender & {
      setStreams?: (...streams: MediaStream[]) => void;
    };
    if (typeof candidate.setStreams !== "function") return;
    try {
      if (stream) {
        candidate.setStreams(stream);
      } else {
        candidate.setStreams();
      }
    } catch (err) {
      if (import.meta.env.DEV) {
        console.warn("Failed to update sender streams", err);
      }
    }
  }

  private stopPublishingLocalVideoTrack(type: "camera" | "screen") {
    this.videoSenders.forEach((entry, connectionId) => {
      const sender = entry?.[type];
      if (!sender) {
        return;
      }

      const finalizeRenegotiation = () => {
        this.renegotiateConnection(connectionId);
      };

      try {
        this.updateSenderStreams(sender, null);
        const replaceResult = sender.replaceTrack(null);
        Promise.resolve(replaceResult)
          .then(() => {
            finalizeRenegotiation();
          })
          .catch((err) => {
            if (import.meta.env.DEV) {
              console.warn("Failed to clear video track", err);
            }
            this.detachVideoSenderForConnection(connectionId, type);
            finalizeRenegotiation();
          });
      } catch (err) {
        if (import.meta.env.DEV) {
          console.warn("Failed to clear video track", err);
        }
        this.detachVideoSenderForConnection(connectionId, type);
        finalizeRenegotiation();
      }
    });
  }

  private async applyScreenShareConstraintsToActiveTrack() {
    const stream = this.localScreenStream;
    if (!stream) return;

    const [track] = stream.getVideoTracks();
    if (!track) return;

    await this.applyPreferredTrackSettings("screen", track);

    this.peerConnections.forEach((_, connectionId) => {
      const entry = this.videoSenders.get(connectionId);
      const sender = entry?.screen;
      if (!sender) return;
      this.updateSenderStreams(sender, stream);
      this.configureVideoSender(connectionId, "screen", sender, track);
      this.renegotiateConnection(connectionId);
    });

    this.emit();
  }

  private publishLocalVideoTrack(
    type: "camera" | "screen",
    track: MediaStreamTrack,
    stream: MediaStream
  ) {
    this.peerConnections.forEach((pc, connectionId) => {
      const entry = this.getVideoSenderEntry(connectionId);
      const existingSender = entry[type];
      if (existingSender) {
        this.updateSenderStreams(existingSender, stream);
        Promise.resolve(existingSender.replaceTrack(track))
          .then(() => {
            this.configureVideoSender(
              connectionId,
              type,
              existingSender,
              track
            );
            this.renegotiateConnection(connectionId);
          })
          .catch((err) => {
            if (import.meta.env.DEV) {
              console.warn("Failed to replace video track, retrying", err);
            }
            this.detachVideoSenderForConnection(connectionId, type);
            try {
              const sender = pc.addTrack(track, stream);
              this.getVideoSenderEntry(connectionId)[type] = sender;
              this.updateSenderStreams(sender, stream);
              this.configureVideoSender(connectionId, type, sender, track);
              this.renegotiateConnection(connectionId);
            } catch (fallbackErr) {
              if (import.meta.env.DEV) {
                console.warn("Failed to publish video track", fallbackErr);
              }
            }
          });
        return;
      }
      try {
        const sender = pc.addTrack(track, stream);
        entry[type] = sender;
        this.updateSenderStreams(sender, stream);
        this.configureVideoSender(connectionId, type, sender, track);
        this.renegotiateConnection(connectionId);
      } catch (err) {
        if (import.meta.env.DEV) {
          console.warn("Failed to publish video track", err);
        }
      }
    });
  }

  private async applyPreferredTrackSettings(
    type: "camera" | "screen",
    track: MediaStreamTrack
  ) {
    if (type === "screen") {
      const { width, height, frameRate } = this.screenShareConstraints;
      const constraints: MediaTrackConstraints = {};
      if (typeof width === "number" && width > 0) {
        constraints.width = { ideal: width };
      }
      if (typeof height === "number" && height > 0) {
        constraints.height = { ideal: height };
      }
      if (typeof frameRate === "number" && frameRate > 0) {
        constraints.frameRate = { ideal: frameRate, max: frameRate };
      }
      if (Object.keys(constraints).length > 0) {
        try {
          await track.applyConstraints(constraints);
        } catch (err) {
          if (import.meta.env.DEV) {
            console.warn("Failed to apply screen track constraints", err);
          }
        }
      }
      if ("contentHint" in track) {
        try {
          track.contentHint = "detail";
        } catch {
          // ignore unsupported
        }
      }
    } else if ("contentHint" in track) {
      try {
        track.contentHint = "motion";
      } catch {
        // ignore unsupported
      }
    }
  }

  private configureVideoSender(
    connectionId: string,
    type: "camera" | "screen",
    sender: RTCRtpSender,
    track: MediaStreamTrack
  ) {
    const settings = this.safeGetTrackSettings(track);
    const width =
      settings.width ??
      (type === "screen" ? this.screenShareConstraints.width : undefined);
    const height =
      settings.height ??
      (type === "screen" ? this.screenShareConstraints.height : undefined);
    const frameRate =
      settings.frameRate ??
      (type === "screen" ? this.screenShareConstraints.frameRate : undefined);

    const params =
      typeof sender.getParameters === "function" &&
      typeof sender.setParameters === "function"
        ? sender.getParameters()
        : null;
    if (!params) return;

    if (!params.encodings || params.encodings.length === 0) {
      params.encodings = [{}];
    }
    const encoding = params.encodings[0];
    const maxBitrate = this.estimateVideoBitrate(
      width,
      height,
      frameRate,
      type
    );
    if (maxBitrate != null) {
      encoding.maxBitrate = maxBitrate;
    }

    if (type === "screen") {
      params.degradationPreference = "maintain-resolution";
    } else if (!params.degradationPreference) {
      params.degradationPreference = "balanced";
    }

    if (encoding.scaleResolutionDownBy === undefined) {
      encoding.scaleResolutionDownBy = 1;
    }

    sender.setParameters(params).catch((err) => {
      if (import.meta.env.DEV) {
        console.warn(
          `Failed to update RTP sender parameters for ${type} track ${connectionId}`,
          err
        );
      }
    });
  }

  private safeGetTrackSettings(track: MediaStreamTrack) {
    try {
      return track.getSettings() as MediaTrackSettings & {
        width?: number;
        height?: number;
        frameRate?: number;
      };
    } catch {
      return {};
    }
  }

  private estimateVideoBitrate(
    width?: number,
    height?: number,
    frameRate?: number,
    type: "camera" | "screen" = "camera"
  ): number | null {
    const fallback = type === "screen" ? 8_000_000 : 2_500_000;
    if (!width || !height) {
      return fallback;
    }
    const fps = frameRate && frameRate > 0 ? frameRate : 30;
    const pixelsPerSecond = width * height * fps;
    const bitsPerPixel = type === "screen" ? 0.14 : 0.08;
    const estimate = pixelsPerSecond * bitsPerPixel;
    const min = type === "screen" ? 4_000_000 : 1_500_000;
    const max = type === "screen" ? 25_000_000 : 12_000_000;
    return Math.max(min, Math.min(estimate, max));
  }

  private detachVideoSenderForConnection(
    connectionId: string,
    type: "camera" | "screen"
  ) {
    const entry = this.videoSenders.get(connectionId);
    const sender = entry?.[type];
    if (!sender) return;
    const pc = this.peerConnections.get(connectionId);
    if (pc) {
      try {
        pc.removeTrack(sender);
      } catch (err) {
        if (import.meta.env.DEV) {
          console.warn("Failed to remove video track", err);
        }
      }
    }
    if (entry) {
      delete entry[type];
      if (!entry.camera && !entry.screen) {
        this.videoSenders.delete(connectionId);
      }
    }
  }

  private detachLocalVideoTrack(type: "camera" | "screen") {
    Array.from(this.videoSenders.keys()).forEach((connectionId) => {
      this.detachVideoSenderForConnection(connectionId, type);
    });
  }

  private detectVideoType(track: MediaStreamTrack): "camera" | "screen" {
    try {
      const settings = track.getSettings() as MediaTrackSettings & {
        displaySurface?: string;
      };
      const surface = settings.displaySurface?.toLowerCase();
      if (surface && surface !== "camera") {
        return "screen";
      }
    } catch {
      // ignore inability to read settings
    }
    const label = track.label?.toLowerCase() ?? "";
    if (
      label.includes("screen") ||
      label.includes("display") ||
      label.includes("window")
    ) {
      return "screen";
    }
    return "camera";
  }

  private setRemoteVideoStream(
    connectionId: string,
    mediaType: "camera" | "screen",
    stream: MediaStream
  ) {
    let streams = this.remoteVideoStreams.get(connectionId);
    if (!streams) {
      streams = new Map();
      this.remoteVideoStreams.set(connectionId, streams);
    }

    const participant = this.participants.get(connectionId);
    const hasScreenStream = streams.has("screen");
    const hasCameraStream = streams.has("camera");
    let resolvedType: "camera" | "screen" = mediaType;

    if (mediaType === "camera") {
      if (
        participant?.isScreenSharing &&
        !participant?.isCameraEnabled &&
        !hasScreenStream
      ) {
        resolvedType = "screen";
      } else if (
        participant?.isScreenSharing &&
        participant?.isCameraEnabled &&
        hasCameraStream &&
        !hasScreenStream
      ) {
        const existingCamera = streams.get("camera");
        if (existingCamera && existingCamera.id !== stream.id) {
          streams.set("screen", existingCamera);
          this.remoteVideoStreamTypes.set(existingCamera.id, "screen");
        }
      }
    } else if (mediaType === "screen") {
      if (
        !participant?.isScreenSharing &&
        participant?.isCameraEnabled &&
        !hasCameraStream
      ) {
        resolvedType = "camera";
      }
    }

    if (resolvedType !== mediaType) {
      const misclassified = streams.get(mediaType);
      if (misclassified && misclassified.id === stream.id) {
        streams.delete(mediaType);
        this.remoteVideoStreamTypes.delete(misclassified.id);
      }
    }

    const current = streams.get(resolvedType);
    if (current && current.id === stream.id) {
      this.remoteVideoStreamTypes.set(stream.id, resolvedType);
      return;
    }

    streams.set(resolvedType, stream);
    this.remoteVideoStreamTypes.set(stream.id, resolvedType);
    this.emit();
  }

  private removeRemoteVideoStream(
    connectionId: string,
    mediaType: "camera" | "screen",
    streamId?: string
  ) {
    const streams = this.remoteVideoStreams.get(connectionId);
    if (!streams) return;

    const resolvedType =
      streamId != null
        ? this.remoteVideoStreamTypes.get(streamId) ?? mediaType
        : mediaType;

    if (streamId) {
      const target = streams.get(resolvedType);
      if (!target || target.id !== streamId) return;
    }

    if (!streams.delete(resolvedType)) return;

    if (streamId != null) {
      this.remoteVideoStreamTypes.delete(streamId);
    }

    if (streams.size === 0) {
      this.remoteVideoStreams.delete(connectionId);
    }

    this.emit();
  }

  private applyParticipantMediaState(
    connectionId: string,
    mediaState: {
      isCameraEnabled?: boolean;
      isScreenSharing?: boolean;
      isMuted?: boolean;
    }
  ) {
    const participant = this.participants.get(connectionId);
    if (participant) {
      this.participants.set(connectionId, {
        ...participant,
        ...mediaState,
      });
    }
    this.channelPresence.forEach((connections) => {
      const existing = connections.get(connectionId);
      if (!existing) return;
      connections.set(connectionId, {
        ...existing,
        ...mediaState,
      });
    });
  }

  private async setLocalVideoEnabled(
    type: "camera" | "screen",
    enabled: boolean,
    notify = true
  ) {
    const currentlyEnabled =
      type === "camera" ? this.isCameraEnabled : this.isScreenSharing;

    if (enabled) {
      if (currentlyEnabled) return;
      if (!this.currentChannelId) return;

      const otherType = type === "camera" ? "screen" : "camera";
      const otherEnabled =
        otherType === "camera" ? this.isCameraEnabled : this.isScreenSharing;
      if (otherEnabled) {
        await this.setLocalVideoEnabled(otherType, false, notify);
      }

      let stream: MediaStream | null = null;

      try {
        if (type === "camera") {
          const mediaDevices = navigator.mediaDevices;
          if (!mediaDevices?.getUserMedia) {
            if (import.meta.env.DEV) {
              console.warn("Camera capture is not supported in this browser");
            }
            return;
          }
          stream = await mediaDevices.getUserMedia({
            video: {
              width: 1280,
              height: 720,
              frameRate: { ideal: 30, max: 60 },
            },
            audio: false,
          });
        } else {
          const mediaDevices = navigator.mediaDevices;
          if (!mediaDevices?.getDisplayMedia) {
            if (import.meta.env.DEV) {
              console.warn("Screen sharing is not supported in this browser");
            }
            return;
          }
          const { width, height, frameRate } = this.screenShareConstraints;
          const videoConstraints: MediaTrackConstraints = {
            frameRate:
              typeof frameRate === "number" && frameRate > 0
                ? { ideal: frameRate, max: frameRate }
                : { ideal: 30, max: 60 },
          };
          if (typeof width === "number" && width > 0) {
            videoConstraints.width = { ideal: width };
          }
          if (typeof height === "number" && height > 0) {
            videoConstraints.height = { ideal: height };
          }
          stream = await mediaDevices.getDisplayMedia({
            video: videoConstraints,
            audio: false,
          });
        }
      } catch (err) {
        if (import.meta.env.DEV) {
          console.warn(
            type === "camera"
              ? "Camera capture cancelled or failed"
              : "Screen share cancelled or failed",
            err
          );
        }
        return;
      }

      if (!stream) return;
      const [track] = stream.getVideoTracks();
      if (!track) {
        stream.getTracks().forEach((t) => {
          try {
            t.stop();
          } catch {
            // ignore
          }
        });
        return;
      }

      await this.applyPreferredTrackSettings(type, track);

      if (type === "camera" && this.localCameraStream) {
        const prevTrack = this.localCameraStream.getVideoTracks()[0];
        if (prevTrack && this.localCameraEndedHandler) {
          prevTrack.removeEventListener("ended", this.localCameraEndedHandler);
        }
        this.localCameraStream.getTracks().forEach((t) => {
          try {
            t.stop();
          } catch {
            // ignore
          }
        });
      }

      if (type === "screen" && this.localScreenStream) {
        const prevTrack = this.localScreenStream.getVideoTracks()[0];
        if (prevTrack && this.localScreenEndedHandler) {
          prevTrack.removeEventListener("ended", this.localScreenEndedHandler);
        }
        this.localScreenStream.getTracks().forEach((t) => {
          try {
            t.stop();
          } catch {
            // ignore
          }
        });
      }

      const onEnded = () => {
        void this.setLocalVideoEnabled(type, false, false);
        void this.syncMediaState();
      };
      track.addEventListener("ended", onEnded);

      if (type === "camera") {
        this.localCameraEndedHandler = onEnded;
        this.localCameraStream = stream;
        this.isCameraEnabled = true;
      } else {
        this.localScreenEndedHandler = onEnded;
        this.localScreenStream = stream;
        this.isScreenSharing = true;
      }

      this.publishLocalVideoTrack(type, track, stream);

      if (this.selfConnectionId) {
        if (type === "camera") {
          this.applyParticipantMediaState(this.selfConnectionId, {
            isCameraEnabled: true,
          });
        } else {
          this.applyParticipantMediaState(this.selfConnectionId, {
            isScreenSharing: true,
          });
        }
      }

      this.emit();
      if (notify) {
        await this.syncMediaState();
      }
      return;
    }

    if (!currentlyEnabled) {
      if (type === "camera") {
        if (!this.localCameraStream) return;
      } else if (!this.localScreenStream) {
        return;
      }
    }

    this.stopPublishingLocalVideoTrack(type);

    if (type === "camera") {
      const stream = this.localCameraStream;
      const handler = this.localCameraEndedHandler;
      if (stream) {
        const [prevTrack] = stream.getVideoTracks();
        if (prevTrack && handler) {
          prevTrack.removeEventListener("ended", handler);
        }
        stream.getTracks().forEach((t) => {
          try {
            t.stop();
          } catch {
            // ignore
          }
        });
      }
      this.localCameraStream = null;
      this.localCameraEndedHandler = null;
      this.isCameraEnabled = false;
    } else {
      const stream = this.localScreenStream;
      const handler = this.localScreenEndedHandler;
      if (stream) {
        const [prevTrack] = stream.getVideoTracks();
        if (prevTrack && handler) {
          prevTrack.removeEventListener("ended", handler);
        }
        stream.getTracks().forEach((t) => {
          try {
            t.stop();
          } catch {
            // ignore
          }
        });
      }
      this.localScreenStream = null;
      this.localScreenEndedHandler = null;
      this.isScreenSharing = false;
    }

    if (this.selfConnectionId) {
      if (type === "camera") {
        this.applyParticipantMediaState(this.selfConnectionId, {
          isCameraEnabled: false,
        });
      } else {
        this.applyParticipantMediaState(this.selfConnectionId, {
          isScreenSharing: false,
        });
      }
    }

    this.emit();
    if (notify) {
      await this.syncMediaState();
    }
  }

  private async syncMediaState() {
    if (!this.currentChannelId) return;
    try {
      await updateMediaState({
        isCameraEnabled: this.isCameraEnabled,
        isScreenSharing: this.isScreenSharing,
        isMuted: this.selfMuted,
      });
    } catch (err) {
      if (import.meta.env.DEV) {
        console.warn("Failed to sync media state", err);
      }
    }
  }

  private async createPeerConnection(
    connectionId: string
  ): Promise<RTCPeerConnection> {
    const existing = this.peerConnections.get(connectionId);
    if (existing) return existing;

    const stream = await this.ensureLocalMicrophoneStream();

    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });

    stream?.getAudioTracks().forEach((track) => pc.addTrack(track, stream));

    const addVideoTrack = (
      mediaStream: MediaStream | null,
      type: "camera" | "screen"
    ) => {
      const videoTrack = mediaStream?.getVideoTracks()[0];
      if (!videoTrack) return;
      this.detachVideoSenderForConnection(connectionId, type);
      try {
        const sender = pc.addTrack(videoTrack, mediaStream!);
        this.getVideoSenderEntry(connectionId)[type] = sender;
        this.updateSenderStreams(sender, mediaStream!);
      } catch (err) {
        if (import.meta.env.DEV) {
          console.warn("Failed to publish video track", err);
        }
      }
    };

    addVideoTrack(this.localCameraStream, "camera");
    addVideoTrack(this.localScreenStream, "screen");

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
      if (event.track.kind === "audio") {
        this.remoteAudioStreams.set(connectionId, trackStream);
        this.startRemoteSpeakingMonitor(connectionId, trackStream);
        this.emit();
        return;
      }
      if (event.track.kind === "video") {
        const mediaType = this.detectVideoType(event.track);
        this.setRemoteVideoStream(connectionId, mediaType, trackStream);
        if (mediaType === "screen") {
          this.applyParticipantMediaState(connectionId, {
            isScreenSharing: true,
          });
        } else {
          this.applyParticipantMediaState(connectionId, {
            isCameraEnabled: true,
          });
        }
        const handleEnded = () => {
          this.removeRemoteVideoStream(connectionId, mediaType, trackStream.id);
          if (mediaType === "screen") {
            this.applyParticipantMediaState(connectionId, {
              isScreenSharing: false,
            });
          } else {
            this.applyParticipantMediaState(connectionId, {
              isCameraEnabled: false,
            });
          }
        };
        event.track.addEventListener("ended", handleEnded, { once: true });
        this.emit();
      }
    };

    pc.onnegotiationneeded = () => {
      if (this.isJoining) return;
      this.renegotiateConnection(connectionId);
    };

    pc.onsignalingstatechange = () => {
      this.handleSignalingStateChange(connectionId);
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

  private renegotiateConnection(connectionId: string) {
    const pc = this.peerConnections.get(connectionId);
    if (!pc) return;

    if (pc.signalingState === "closed" || pc.connectionState === "closed") {
      this.negotiationStates.delete(connectionId);
      return;
    }

    const state = this.getNegotiationState(connectionId);

    if (state.busy) {
      state.pending = true;
      return;
    }

    if (pc.signalingState !== "stable") {
      state.pending = true;
      return;
    }

    state.busy = true;
    state.pending = false;

    (async () => {
      try {
        const offer = await pc.createOffer();
        if (pc.signalingState !== "stable") {
          state.pending = true;
          return;
        }
        await pc.setLocalDescription(offer);
        await sendOffer(connectionId, {
          type: offer.type,
          sdp: offer.sdp ?? "",
        });
      } catch (err) {
        if (import.meta.env.DEV) {
          console.error("Failed to renegotiate connection", err);
        }
        state.pending = true;
      } finally {
        state.busy = false;
        if (state.pending) {
          state.pending = false;
          this.renegotiateConnection(connectionId);
        }
      }
    })();
  }

  private handleSignalingStateChange(connectionId: string) {
    const pc = this.peerConnections.get(connectionId);
    if (!pc) {
      this.negotiationStates.delete(connectionId);
      return;
    }

    if (pc.signalingState === "closed") {
      this.negotiationStates.delete(connectionId);
      return;
    }

    if (pc.signalingState === "stable") {
      const state = this.negotiationStates.get(connectionId);
      if (state && state.pending && !state.busy) {
        state.pending = false;
        this.renegotiateConnection(connectionId);
      }
    }
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
      this.pingUpdateInterval = window.setInterval(
        run,
        PING_REFRESH_INTERVAL_MS
      );
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
            if (state && state !== "succeeded" && state !== "in-progress") {
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
        const resolved = new URL(
          explicitTarget,
          typeof window !== "undefined" ? window.location.origin : undefined
        );
        resolved.hash = "";
        targets.add(resolved.toString());
      } catch {
        // If the configured value is invalid, fall back to default target.
      }
    }

    this.pingTargets = Array.from(targets);
    return this.pingTargets;
  }

  private async measureHttpPingForTarget(
    target: string
  ): Promise<number | null> {
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
        if (typeof window === "undefined") return { value: null };
        try {
          url = new URL(target, window.location.origin);
        } catch {
          return { value: null };
        }
      }

      url.searchParams.set("_ping", `${Date.now().toString(36)}-${method}`);

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
            return { value: null, retry: true };
          }
          return { value: null };
        }

        return { value: Math.max(0, Math.round(end - start)) };
      } catch (error) {
        if ((error as DOMException)?.name === "AbortError") {
          return { value: null };
        }
        return { value: null };
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

  private handlePeerMediaStateChanged = (message: VoiceMediaState) => {
    this.applyParticipantMediaState(message.connectionId, {
      isCameraEnabled: message.isCameraEnabled,
      isScreenSharing: message.isScreenSharing,
      isMuted: message.isMuted,
    });
    this.emit();
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
    startCamera: voiceManager.startCamera,
    stopCamera: voiceManager.stopCamera,
    toggleCamera: voiceManager.toggleCamera,
    startScreenShare: voiceManager.startScreenShare,
    stopScreenShare: voiceManager.stopScreenShare,
    toggleScreenShare: voiceManager.toggleScreenShare,
    setScreenShareConstraints: voiceManager.setScreenShareConstraints,
    join: voiceManager.join,
    leave: voiceManager.leave,
  };
}
