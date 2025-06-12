import { useLocalObservable } from "mobx-react-lite";
import {
  HubConnection,
  HubConnectionBuilder,
  HubConnectionState,
} from "@microsoft/signalr";
import { useEffect, useRef } from "react";
import type { ChatMessage, PagedList } from "../types";
import { runInAction } from "mobx";
import { toast } from "react-toastify";
import { calculatePageSizeForMessages } from "../util/util";

export const useMessages = (chatRoomId?: string) => {
  const created = useRef(false);

  const messageStore = useLocalObservable(() => ({
    messages: [] as ChatMessage[],
    hubConnection: null as HubConnection | null,
    hasOlderMessages: false,
    isLoadingOlder: false,
    oldestMessageCursor: null as Date | null,

    createHubConnection(chatRoomId: string) {
      if (!chatRoomId) return;

      const initialPageSize = calculatePageSizeForMessages();

      this.hubConnection = new HubConnectionBuilder()
        .withUrl(
          `${
            import.meta.env.VITE_MESSAGE_URL
          }?chatRoomId=${chatRoomId}&initialPageSize=${initialPageSize}`,
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

      this.hubConnection.on(
        "LoadMessages",
        (pagedResult: PagedList<ChatMessage, Date>) => {
          runInAction(() => {
            this.messages = pagedResult.items;
            this.hasOlderMessages = !!pagedResult.nextCursor;
            this.oldestMessageCursor = pagedResult.nextCursor;
          });
        }
      );

      this.hubConnection.on(
        "ReceiveOlderMessages",
        (pagedResult: PagedList<ChatMessage, Date>) => {
          runInAction(() => {
            this.messages = [...pagedResult.items, ...this.messages];
            this.hasOlderMessages = !!pagedResult.nextCursor;
            this.oldestMessageCursor = pagedResult.nextCursor;
            this.isLoadingOlder = false;
          });
        }
      );

      this.hubConnection.on("ReceiveMessage", (message: ChatMessage) => {
        runInAction(() => {
          this.messages.push(message);
        });
      });

      this.hubConnection.on(
        "ReceiveError",
        (errorCode: number, message: string) => {
          runInAction(() => {
            this.isLoadingOlder = false;
          });
          if (import.meta.env.DEV) console.log(errorCode, message);
          toast.error(message);
        }
      );
    },

    loadOlderMessages() {
      if (!this.hubConnection || !this.hasOlderMessages || this.isLoadingOlder)
        return;

      runInAction(() => {
        this.isLoadingOlder = true;
      });

      const pageSize = Math.max(
        10,
        Math.floor(calculatePageSizeForMessages() / 2)
      );

      this.hubConnection
        .invoke(
          "LoadMoreMessages",
          chatRoomId,
          this.oldestMessageCursor,
          pageSize
        )
        .catch((error) => {
          runInAction(() => {
            this.isLoadingOlder = false;
          });
          console.log("Error loading older messages: ", error);
          toast.error("Failed to load older messages");
        });
    },

    stopHubConnection() {
      if (this.hubConnection?.state === HubConnectionState.Connected) {
        this.hubConnection
          .stop()
          .catch((error) => console.log("Error stopping connection: ", error));
      }
    },

    reset() {
      this.messages = [];
      this.hasOlderMessages = false;
      this.isLoadingOlder = false;
      this.oldestMessageCursor = null;
    },
  }));

  useEffect(() => {
    if (chatRoomId && !created.current) {
      messageStore.createHubConnection(chatRoomId);
      created.current = true;
    }

    return () => {
      messageStore.stopHubConnection();
      messageStore.reset();
    };
  }, [chatRoomId, messageStore]);

  return {
    messageStore,
  };
};
