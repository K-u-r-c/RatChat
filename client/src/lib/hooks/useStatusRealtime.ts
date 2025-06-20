import { useEffect, useRef } from "react";
import { useLocalObservable } from "mobx-react-lite";
import {
  HubConnection,
  HubConnectionBuilder,
  HubConnectionState,
} from "@microsoft/signalr";
import { useQueryClient } from "@tanstack/react-query";
import type { Friend, UserStatusDto } from "../types";

export const useStatusRealtime = () => {
  const queryClient = useQueryClient();
  const created = useRef(false);

  const statusStore = useLocalObservable(() => ({
    hubConnection: null as HubConnection | null,

    createHubConnection() {
      this.hubConnection = new HubConnectionBuilder()
        .withUrl(
          import.meta.env.VITE_STATUS_URL || "https://localhost:5001/status",
          {
            withCredentials: true,
          }
        )
        .withAutomaticReconnect()
        .build();

      this.hubConnection.start().catch((error) => {
        console.error("Error establishing status connection:", error);
      });

      // Listen for status changes from friends
      this.hubConnection.on(
        "UserStatusChanged",
        (statusData: {
          UserId: string;
          Status: string;
          CustomMessage?: string;
          Timestamp: Date;
        }) => {
          // Update friends list with new status
          queryClient.setQueryData(["friends"], (old: Friend[] | undefined) => {
            if (!old) return old;
            return old.map((friend) =>
              friend.id === statusData.UserId
                ? {
                    ...friend,
                    status: statusData.Status,
                    customStatusMessage: statusData.CustomMessage,
                    isOnline: ["Online", "Away", "DoNotDisturb"].includes(
                      statusData.Status
                    ),
                  }
                : friend
            );
          });

          // Update individual user status queries
          queryClient.setQueryData(
            ["user-status", statusData.UserId],
            (old: UserStatusDto | undefined) => {
              if (!old) return old;
              return {
                ...old,
                status: statusData.Status,
                customMessage: statusData.CustomMessage,
                isOnline: ["Online", "Away", "DoNotDisturb"].includes(
                  statusData.Status
                ),
              };
            }
          );

          // Update chat room members if they exist
          queryClient.invalidateQueries({ queryKey: ["chatRooms"] });
        }
      );
    },

    updateStatus(status: string, customMessage?: string) {
      if (this.hubConnection?.state === HubConnectionState.Connected) {
        this.hubConnection.invoke("UpdateStatus", {
          status,
          customMessage,
        });
      }
    },

    stopHubConnection() {
      if (this.hubConnection?.state === HubConnectionState.Connected) {
        this.hubConnection.stop().catch((error) => {
          console.error("Error stopping status connection:", error);
        });
      }
    },
  }));

  useEffect(() => {
    if (!created.current) {
      statusStore.createHubConnection();
      created.current = true;
    }

    return () => {
      statusStore.stopHubConnection();
    };
  }, [queryClient, statusStore]);

  return {
    statusStore,
  };
};
