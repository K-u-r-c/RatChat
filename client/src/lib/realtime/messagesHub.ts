import {HubConnection, HubConnectionBuilder, HubConnectionState,} from "@microsoft/signalr";
import {hubLogger} from "../util/hubLogger.ts";

let hubConnection: HubConnection | null = null;
let startPromise: Promise<void> | null = null;

export function getMessagesHub(): HubConnection | null {
  return hubConnection;
}

export async function startMessagesHub(): Promise<HubConnection> {
  const url = import.meta.env.VITE_MESSAGE_URL as string;

  if (hubConnection) {
    if (hubConnection.state === HubConnectionState.Connected)
      return hubConnection;
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
    .configureLogging(new hubLogger())
    .withAutomaticReconnect()
    .build();

  startPromise = hubConnection.start().finally(() => {
    startPromise = null;
  });
  await startPromise;
  return hubConnection;
}

export async function stopMessagesHub() {
  if (hubConnection?.state === HubConnectionState.Connected) {
    await hubConnection.stop();
  }
}

export async function joinChatChannel(
  chatRoomId: string,
  channelId: string,
  initialPageSize?: number
) {
  if (!hubConnection) throw new Error("Messages hub is not started");
  await hubConnection.invoke(
    "JoinChatChannel",
    chatRoomId,
    channelId,
    initialPageSize ?? null
  );
}

export async function joinChatRoom(
  chatRoomId: string,
  initialPageSize?: number
) {
  if (!hubConnection) throw new Error("Messages hub is not started");
  await hubConnection.invoke(
    "JoinChatRoom",
    chatRoomId,
    initialPageSize ?? null
  );
}

export async function leaveChatRoom(chatRoomId: string, channelId?: string) {
  if (!hubConnection) return;
  try {
    await hubConnection.invoke("LeaveChatRoom", chatRoomId, channelId ?? null);
  } catch {
    // ignore
  }
}

export async function loadMoreMessages(
  chatRoomId: string,
  channelId: string,
  cursor: Date | null,
  pageSize: number
) {
  if (!hubConnection) throw new Error("Messages hub is not started");
  await hubConnection.invoke(
    "LoadMoreMessages",
    chatRoomId,
    channelId,
    cursor,
    pageSize
  );
}

export function on<TPayload = unknown>(
  event: string,
  cb: (payload: TPayload) => void
) {
  if (!hubConnection) return;
  hubConnection.on(event, cb as unknown as (...args: unknown[]) => void);
}

export function off(event: string, cb?: (...args: unknown[]) => void) {
  if (!hubConnection) return;
  if (cb) hubConnection.off(event, cb);
  else hubConnection.off(event);
}

export function connection(): HubConnection | null {
  return hubConnection;
}
