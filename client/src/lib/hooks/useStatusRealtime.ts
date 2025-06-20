import { useEffect, useRef } from "react";
import { useLocalObservable } from "mobx-react-lite";
import {
  HubConnection,
  HubConnectionBuilder,
  HubConnectionState,
} from "@microsoft/signalr";
import { useQueryClient } from "@tanstack/react-query";
import type {
  Friend,
  UserStatusDto,
  User,
  ChatRoom,
  PagedList,
  DirectChat,
} from "../types";

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

      this.hubConnection
        .start()
        .then(() => {
          queryClient.invalidateQueries({ queryKey: ["user"] });
        })
        .catch((error) => {
          if (import.meta.env.DEV) {
            console.error("Error starting status connection:", error);
          }
        });

      this.hubConnection.on(
        "UserStatusChanged",
        (statusData: {
          UserId: string;
          Status: string;
          CustomMessage?: string;
          Timestamp: Date;
        }) => {
          const isOnline = ["Online", "Away", "DoNotDisturb"].includes(
            statusData.Status
          );

          queryClient.setQueryData<User>(["user"], (old) => {
            if (!old || old.id !== statusData.UserId) return old;
            return {
              ...old,
              status: statusData.Status,
              customStatusMessage: statusData.CustomMessage,
              lastSeen: new Date(),
            };
          });

          queryClient.setQueryData<Friend[]>(["friends"], (old) => {
            if (!old) return old;
            const updated = old.map((friend) =>
              friend.id === statusData.UserId
                ? {
                    ...friend,
                    status: statusData.Status,
                    customStatusMessage: statusData.CustomMessage,
                    isOnline,
                    lastSeen: isOnline ? friend.lastSeen : new Date(),
                  }
                : friend
            );
            return updated;
          });

          queryClient.setQueryData<UserStatusDto>(
            ["user-status", statusData.UserId],
            (old) => {
              if (!old) return old;
              return {
                ...old,
                status: statusData.Status,
                customMessage: statusData.CustomMessage,
                isOnline,
                lastSeen: new Date(),
              };
            }
          );

          queryClient.setQueryData<{
            pages: Array<PagedList<ChatRoom, string>>;
            pageParams: (string | null)[];
          }>(["chatRooms"], (old) => {
            if (!old) return old;

            return {
              ...old,
              pages: old.pages.map((page) => ({
                ...page,
                items: page.items.map((chatRoom) => ({
                  ...chatRoom,
                  members: chatRoom.members.map((member) =>
                    member.id === statusData.UserId
                      ? {
                          ...member,
                          status: statusData.Status,
                          customStatusMessage: statusData.CustomMessage,
                          isOnline,
                          lastSeen: isOnline ? member.lastSeen : new Date(),
                        }
                      : member
                  ),
                })),
              })),
            };
          });

          queryClient.invalidateQueries({
            queryKey: ["chatRooms"],
            type: "active",
          });

          queryClient.invalidateQueries({
            queryKey: ["friends"],
            type: "active",
          });

          queryClient.invalidateQueries({
            queryKey: ["direct-chats"],
            type: "active",
          });

          queryClient.setQueryData<DirectChat[]>(["direct-chats"], (old) => {
            if (!old || !Array.isArray(old)) return old;
            return old.map((chat) =>
              chat.otherUserId === statusData.UserId
                ? {
                    ...chat,
                    status: statusData.Status,
                    customStatusMessage: statusData.CustomMessage,
                    isOnline,
                  }
                : chat
            );
          });
        }
      );
    },

    updateStatus(status: string, customMessage?: string) {
      queryClient.setQueryData<User>(["user"], (old) => {
        if (!old) return old;
        return {
          ...old,
          status: status,
          customStatusMessage:
            customMessage !== undefined
              ? customMessage
              : old.customStatusMessage,
        };
      });

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
          if (import.meta.env.DEV) {
            console.error("Error stopping status connection:", error);
          }
        });
      }
    },
  }));

  useEffect(() => {
    if (!created.current) {
      statusStore.createHubConnection();
      created.current = true;
    }

    const INACTIVITY_TIMEOUT = 5 * 60 * 1000;
    let inactivityTimer: number;

    const handleInactivity = () => {
      const currentUser = queryClient.getQueryData<User>(["user"]);
      if (currentUser?.status === "Online") {
        statusStore.updateStatus("Away", currentUser.customStatusMessage);
      }
    };

    const resetInactivityTimer = () => {
      clearTimeout(inactivityTimer);
      const currentUser = queryClient.getQueryData<User>(["user"]);
      if (currentUser?.status === "Away") {
        statusStore.updateStatus("Online", currentUser.customStatusMessage);
      }
      inactivityTimer = setTimeout(handleInactivity, INACTIVITY_TIMEOUT);
    };

    const activityEvents = [
      "mousemove",
      "keydown",
      "mousedown",
      "scroll",
      "touchstart",
    ];

    activityEvents.forEach((event) => {
      window.addEventListener(event, resetInactivityTimer);
    });

    resetInactivityTimer();

    return () => {
      statusStore.stopHubConnection();
      clearTimeout(inactivityTimer);
      activityEvents.forEach((event) => {
        window.removeEventListener(event, resetInactivityTimer);
      });
    };
  }, [queryClient, statusStore]);

  return {
    statusStore,
  };
};
