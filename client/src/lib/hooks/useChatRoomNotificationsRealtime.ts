import { useEffect, useRef } from "react";
import { useLocalObservable } from "mobx-react-lite";
import {
  HubConnection,
  HubConnectionBuilder,
  HubConnectionState,
} from "@microsoft/signalr";
import { toast } from "react-toastify";
import { router } from "../../app/router/Routes";
import { useQueryClient } from "@tanstack/react-query";

export const useChatRoomNotificationsRealtime = (
  chatRoomId?: string,
  userId?: string
) => {
  const created = useRef(false);
  const queryClient = useQueryClient();

  const notificationsStore = useLocalObservable(() => ({
    hubConnection: null as HubConnection | null,

    createHubConnection() {
      if (!chatRoomId) return;

      this.hubConnection = new HubConnectionBuilder()
        .withUrl(
          `${
            import.meta.env.VITE_CHATROOM_NOTIFICATIONS_URL ||
            "https://localhost:5001/chatroom-notifications"
          }?chatRoomId=${chatRoomId}`,
          { withCredentials: true }
        )
        .withAutomaticReconnect()
        .build();

      this.hubConnection.start().catch((error) => {
        if (import.meta.env.DEV) {
          console.error(
            "Error starting chatroom-notifications connection:",
            error
          );
        }
      });

      // Server events
      this.hubConnection.on("UserKicked", (kickedUserId: string) => {
        if (userId && kickedUserId === userId) {
          toast.error("You have been kicked from this chat room.");
          router.navigate("/");
        } else {
          toast.info(
            `User ${kickedUserId} has been kicked from the chat room.`
          );

          queryClient.setQueryData<any>(
            ["chatRooms", chatRoomId],
            (prev: any) => {
              if (!prev) return prev;
              const members = (prev.members ?? []).filter(
                (m: any) => m.id !== kickedUserId
              );
              return { ...prev, members };
            }
          );
          queryClient.invalidateQueries({ queryKey: ["chatRooms"] });
        }
      });

      this.hubConnection.on("UserBanned", (bannedUserId: string) => {
        if (userId && bannedUserId === userId) {
          toast.error("You have been banned from this chat room.");
          router.navigate("/");
        } else {
          toast.info(
            `User ${bannedUserId} has been banned from the chat room.`
          );

          queryClient.setQueryData<any>(
            ["chatRooms", chatRoomId],
            (prev: any) => {
              if (!prev) return prev;
              const members = (prev.members ?? []).filter(
                (m: any) => m.id !== bannedUserId
              );
              const bans = [
                ...(prev.bans ?? []),
                {
                  userId: bannedUserId,
                  chatRoomId,
                  dateBanned: new Date().toISOString(),
                },
              ];
              return { ...prev, members, bans };
            }
          );
          queryClient.invalidateQueries({ queryKey: ["chatRooms"] });
        }
      });

      this.hubConnection.on("UserUnbanned", (unbannedUserId: string) => {
        if (userId && unbannedUserId === userId) {
          toast.info("You have been unbanned from this chat room.");
        } else {
          toast.info(
            `User ${unbannedUserId} has been unbanned from the chat room.`
          );

          if (chatRoomId) {
            queryClient.setQueryData<any>(
              ["chatRooms", chatRoomId],
              (prev: any) => {
                if (!prev) return prev;
                const bans = (prev.bans ?? []).filter(
                  (b: any) => b.userId !== unbannedUserId
                );
                return { ...prev, bans };
              }
            );
            queryClient.invalidateQueries({ queryKey: ["chatRooms"] });
          }
        }
      });
    },
    stopHubConnection() {
      if (this.hubConnection?.state === HubConnectionState.Connected) {
        this.hubConnection
          .stop()
          .catch((error) => {
            console.error(
              "Error stopping chatroom-notifications connection:",
              error
            );
          })
          .finally(() => {
            this.hubConnection = null;
          });
      }
    },
  }));

  useEffect(() => {
    if (chatRoomId && !created.current) {
      notificationsStore.createHubConnection();
      created.current = true;
    }
    return () => {
      notificationsStore.stopHubConnection();
    };
  }, [chatRoomId, notificationsStore]);

  return { notificationsStore };
};
