import {HubConnection, HubConnectionBuilder, HubConnectionState,} from "@microsoft/signalr";

export type VoiceParticipant = {
    connectionId: string;
    userId: string;
    displayName: string;
    slug: string;
    imageUrl?: string;
    isCameraEnabled?: boolean;
    isScreenSharing?: boolean;
    isMuted?: boolean;
};

export type VoiceMediaState = {
    connectionId: string;
    isCameraEnabled: boolean;
    isScreenSharing: boolean;
    isMuted: boolean;
};

export type VoiceChannelJoinResponse = {
    channelId: string;
    selfConnectionId: string;
    participants: VoiceParticipant[];
};

export type VoicePeerUpdate = {
    channelId: string;
    participant: VoiceParticipant;
};

export type SessionDescriptionPayload = {
    type: RTCSdpType | string;
    sdp: string;
};

export type VoiceSignalMessage = {
    channelId: string;
    fromConnectionId: string;
    description: SessionDescriptionPayload;
};

export type IceCandidatePayload = {
    candidate: string;
    sdpMid?: string | null;
    sdpMLineIndex?: number | null;
};

export type VoiceIceCandidateMessage = {
    channelId: string;
    fromConnectionId: string;
    candidate: IceCandidatePayload;
};

export type VoiceChannelPresence = {
    channelId: string;
    participants: VoiceParticipant[];
};

export type VoiceChannelPresenceSnapshot = {
    chatRoomId: string;
    channels: VoiceChannelPresence[];
};

let hubConnection: HubConnection | null = null;
let startPromise: Promise<void> | null = null;

export async function startVoiceHub(): Promise<HubConnection> {
    const url = import.meta.env.VITE_VOICE_URL as string;

    if (!url) {
        throw new Error("VITE_VOICE_URL is not configured");
    }

    if (hubConnection) {
        if (hubConnection.state === HubConnectionState.Connected) {
            return hubConnection;
        }

        if (startPromise) {
            await startPromise;
            return hubConnection;
        }

        startPromise = hubConnection.start().finally(() => {
            startPromise = null;
        });
        await startPromise;
        return hubConnection;
    }

    hubConnection = new HubConnectionBuilder()
        .withUrl(url, {withCredentials: true})
        .withAutomaticReconnect()
        .build();

    startPromise = hubConnection.start().finally(() => {
        startPromise = null;
    });
    await startPromise;
    return hubConnection;
}

export async function stopVoiceHub() {
    if (hubConnection?.state === HubConnectionState.Connected) {
        await hubConnection.stop();
    }
    hubConnection = null;
}

function ensureConnection(): HubConnection {
    if (!hubConnection) {
        throw new Error("Voice hub is not started");
    }
    return hubConnection;
}

export async function joinVoiceChannel(
    channelId: string
): Promise<VoiceChannelJoinResponse> {
    const connection = ensureConnection();
    return connection.invoke<VoiceChannelJoinResponse>("JoinChannel", channelId);
}

export async function leaveVoiceChannel() {
    const connection = ensureConnection();
    try {
        await connection.invoke("LeaveChannel");
    } catch {
        // swallow errors if the server already removed the connection
    }
}

export async function watchChatRoom(chatRoomId: string): Promise<VoiceChannelPresenceSnapshot> {
    const connection = ensureConnection();
    return connection.invoke<VoiceChannelPresenceSnapshot>("WatchChatRoom", chatRoomId);
}

export async function unwatchChatRoom(chatRoomId: string) {
    const connection = ensureConnection();
    await connection.invoke("UnwatchChatRoom", chatRoomId);
}
export async function sendOffer(
    targetConnectionId: string,
    description: SessionDescriptionPayload
) {
    const connection = ensureConnection();
    await connection.invoke("SendOffer", targetConnectionId, description);
}

export async function sendAnswer(
    targetConnectionId: string,
    description: SessionDescriptionPayload
) {
    const connection = ensureConnection();
    await connection.invoke("SendAnswer", targetConnectionId, description);
}

export async function sendIceCandidate(
    targetConnectionId: string,
    candidate: IceCandidatePayload
) {
    const connection = ensureConnection();
    await connection.invoke("SendIceCandidate", targetConnectionId, candidate);
}

export async function updateMediaState(state: {
    isCameraEnabled: boolean;
    isScreenSharing: boolean;
    isMuted: boolean;
}) {
    const connection = ensureConnection();
    await connection.invoke("UpdateMediaState", state);
}

export function on<TPayload = unknown>(
    event: string,
    cb: (payload: TPayload) => void
) {
    const connection = ensureConnection();
    connection.on(event, cb as unknown as (...args: unknown[]) => void);
}

export function off<TPayload = unknown>(event: string, cb?: (payload: TPayload) => void) {
    if (!hubConnection) return;
    if (cb) {
        hubConnection.off(event, cb as unknown as (...args: unknown[]) => void);
    } else {
        hubConnection.off(event);
    }
}

export function connection(): HubConnection | null {
    return hubConnection;
}
