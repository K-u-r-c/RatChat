import {HubConnection, HubConnectionBuilder, HubConnectionState,} from "@microsoft/signalr";
import {hubLogger} from "../util/hubLogger.ts";

let hubConnection: HubConnection | null = null;
let startPromise: Promise<void> | null = null;

export function getEncryptedMessagesHub(): HubConnection | null {
  return hubConnection;
}

export async function startEncryptedMessagesHub(): Promise<HubConnection> {
  const url =
    (import.meta.env.VITE_CHATROOM_ENCRYPTED_MESSAGES_URL as string) ||
    "https://localhost:5001/encrypted-messages";

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

export async function stopEncryptedMessagesHub() {
  if (hubConnection?.state === HubConnectionState.Connected) {
    await hubConnection.stop();
  }
}

export function onEncrypted<TPayload = unknown>(
  event: string,
  cb: (payload: TPayload) => void
) {
  if (!hubConnection) return;
  hubConnection.on(event, cb as unknown as (...args: unknown[]) => void);
}

export function offEncrypted(event: string, cb?: (...args: unknown[]) => void) {
  if (!hubConnection) return;
  if (cb) hubConnection.off(event, cb);
  else hubConnection.off(event);
}

export function encryptedConnection(): HubConnection | null {
  return hubConnection;
}
