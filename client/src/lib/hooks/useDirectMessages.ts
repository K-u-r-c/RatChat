import { useLocalObservable } from "mobx-react-lite";
import {
  HubConnection,
  HubConnectionBuilder,
  HubConnectionState,
} from "@microsoft/signalr";
import { useEffect, useRef } from "react";
import type { DirectMessage, PagedList } from "../types";
import { runInAction } from "mobx";
import { toast } from "react-toastify";
import { calculatePageSizeForMessages } from "../util/util";

export const useDirectMessages = (directChatId?: string) => {
  const created = useRef(false);

  const directMessageStore = useLocalObservable(() => ({
    messages: [] as DirectMessage[],
    hubConnection: null as HubConnection | null,
    hasOlderMessages: false,
    isLoadingOlder: false,
    oldestMessageCursor: null as Date | null,

    createHubConnection(directChatId: string) {
      if (!directChatId) return;

      const initialPageSize = calculatePageSizeForMessages();

      this.hubConnection = new HubConnectionBuilder()
        .withUrl(
          `${
            import.meta.env.VITE_DIRECT_MESSAGE_URL ||
            "https://localhost:5001/direct-messages"
          }?directChatId=${directChatId}&initialPageSize=${initialPageSize}`,
          {
            withCredentials: true,
          }
        )
        .withAutomaticReconnect()
        .build();

      this.hubConnection
        .start()
        .catch((error) =>
          console.log("Error establishing direct message connection: ", error)
        );

      this.hubConnection.on(
        "LoadDirectMessages",
        (pagedResult: PagedList<DirectMessage, Date>) => {
          runInAction(() => {
            this.messages = pagedResult.items;
            this.hasOlderMessages = !!pagedResult.nextCursor;
            this.oldestMessageCursor = pagedResult.nextCursor;
          });
        }
      );

      this.hubConnection.on(
        "ReceiveOlderDirectMessages",
        (pagedResult: PagedList<DirectMessage, Date>) => {
          runInAction(() => {
            this.messages = [...pagedResult.items, ...this.messages];
            this.hasOlderMessages = !!pagedResult.nextCursor;
            this.oldestMessageCursor = pagedResult.nextCursor;
            this.isLoadingOlder = false;
          });
        }
      );

      this.hubConnection.on(
        "ReceiveDirectMessage",
        (message: DirectMessage) => {
          runInAction(() => {
            this.messages.push(message);
          });
        }
      );

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
          "LoadMoreDirectMessages",
          directChatId,
          this.oldestMessageCursor,
          pageSize
        )
        .catch((error) => {
          runInAction(() => {
            this.isLoadingOlder = false;
          });
          console.log("Error loading older direct messages: ", error);
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
    if (directChatId && !created.current) {
      directMessageStore.createHubConnection(directChatId);
      created.current = true;
    }

    return () => {
      directMessageStore.stopHubConnection();
      directMessageStore.reset();
    };
  }, [directChatId, directMessageStore]);

  return {
    directMessageStore,
  };
};
