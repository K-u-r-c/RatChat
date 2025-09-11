import {
  HubConnection,
  HubConnectionBuilder,
  HubConnectionState,
} from "@microsoft/signalr";
import { useQueryClient } from "@tanstack/react-query";
import { useLocalObservable } from "mobx-react-lite";
import { useEffect, useRef } from "react";

export const useChatRoomsProfileImageRealtime = () => {
  const queryClient = useQueryClient();
  const created = useRef(false);

  const store = useLocalObservable(() => ({
    hubConnection: null as HubConnection | null,

    createHubConnection() {
      this.hubConnection = new HubConnectionBuilder()
        .withUrl(import.meta.env.VITE_CHATROOM_IMAGES_URL, {
          withCredentials: true,
        })
        .withAutomaticReconnect()
        .build();

      this.hubConnection
        .start()
        .then(() => {})
        .catch((error) => {
          if (import.meta.env.DEV) {
            console.error("Error starting chatroom images connection:", error);
          }
        });

      this.hubConnection.on("ChatRoomImageUpdated", () => {
        queryClient.invalidateQueries({ queryKey: ["chatRooms"] });
      });
    },

    stopHubConnection() {
      if (this.hubConnection?.state === HubConnectionState.Connected) {
        this.hubConnection.stop().catch((error) => {
          if (import.meta.env.DEV) {
            console.error("Error stopping chatroom images connection:", error);
          }
        });
      }
    },
  }));

  useEffect(() => {
    if (!created.current) {
      store.createHubConnection();
      created.current = true;
    }

    return () => {
      store.stopHubConnection();
    };
  }, [store]);

  return {
    store,
  };
};
