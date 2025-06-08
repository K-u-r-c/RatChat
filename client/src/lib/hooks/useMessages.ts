import { useLocalObservable } from "mobx-react-lite";
import {
  HubConnection,
  HubConnectionBuilder,
  HubConnectionState,
} from "@microsoft/signalr";
import { useEffect, useRef } from "react";
import type { ChatMessage } from "../types";
import { runInAction } from "mobx";
import { toast} from "react-toastify";

export const useMessages = (chatRoomId?: string) => {
  const created = useRef(false);

  const messageStore = useLocalObservable(() => ({
    messages: [] as ChatMessage[],
    hubConnection: null as HubConnection | null,

    createHubConnection(chatRoomId: string) {
      if (!chatRoomId) return;

      this.hubConnection = new HubConnectionBuilder()
        .withUrl(
          `${import.meta.env.VITE_MESSAGE_URL}?chatRoomId=${chatRoomId}`,
          {
            withCredentials: true,
          }
        )
        .withAutomaticReconnect()
        .build();

      this.hubConnection
        .start()
        .catch((error) =>
          console.log("Error establishing connection: ", error)
        );

      this.hubConnection.on("LoadMessages", (messages) => {
        runInAction(() => {
          this.messages = messages;
        });
      });

      this.hubConnection.on("ReceiveMessage", (message) => {
        runInAction(() => {
          this.messages.unshift(message);
        });
      });

      this.hubConnection.on("ReceiveError", (errorCode, message) => {
        if (import.meta.env.DEV) console.log(errorCode, message);
        toast.error(message);
      });
    },
    stopHubConnection() {
      if (this.hubConnection?.state === HubConnectionState.Connected) {
        this.hubConnection
          .stop()
          .catch((error) => console.log("Error stopping connection: ", error));
      }
    },
  }));

  useEffect(() => {
    if (chatRoomId && !created.current) {
      messageStore.createHubConnection(chatRoomId);
      created.current = true;
    }

    return () => {
      messageStore.stopHubConnection();
      messageStore.messages = [];
    };
  }, [chatRoomId, messageStore]);

  return {
    messageStore,
  };
};
