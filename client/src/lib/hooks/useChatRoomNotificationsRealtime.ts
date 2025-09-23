import {
  HubConnectionBuilder,
  HubConnectionState,
  type HubConnection,
} from "@microsoft/signalr";
import { useLocalObservable } from "mobx-react-lite";
import { useEffect, useRef } from "react";
import type { ChatRoom, ChatRoomBan, Profile, User } from "../types";
import { toast } from "react-toastify";
import { router } from "../../app/router/Routes";
import { useQueryClient } from "@tanstack/react-query";

export const useChatRoomNotificationsRealtime = (
  chatRoomId?: string,
  userId?: string
) => {
  const queryClient = useQueryClient();
  const userIdRef = useRef(userId);
  const chatRoomIdRef = useRef(chatRoomId);

  const notificationsStore = useLocalObservable(() => ({
    hubConnection: null as HubConnection | null,
    currentChatRoomId: null as string | null,

    createHubConnection() {
      const roomId = chatRoomIdRef.current;
      if (!roomId) return;

      if (
        this.hubConnection &&
        this.currentChatRoomId === roomId &&
        this.hubConnection.state !== HubConnectionState.Disconnected
      ) {
        return;
      }

      if (this.hubConnection) {
        this.stopHubConnection();
      }

      this.currentChatRoomId = roomId;

      this.hubConnection = new HubConnectionBuilder()
        .withUrl(
          `${
            import.meta.env.VITE_CHATROOM_NOTIFICATIONS_URL ||
            "https://localhost:5001/chatroom-notifications"
          }?chatRoomId=${roomId}`,
          { withCredentials: true }
        )
        .withAutomaticReconnect()
        .build();

      this.hubConnection.start().catch((error) => {
        if (import.meta.env.DEV) {
          console.error(
            "Error establishing chatroom-notifications connection:",
            error
          );
        }
      });

      // Server events
      this.hubConnection.on("UserKicked", (kickedUser: User) => {
        const me = userIdRef.current;
        if (me && kickedUser.id === me) {
          toast.error("You have been kicked from this chat room.");
          router.navigate("/chat-rooms");
          return;
        }

        toast.info(
          `User ${kickedUser.displayName} has been kicked from the chat room.`
        );

        const chatRoomId = chatRoomIdRef.current;
        if (!chatRoomId) return;
        queryClient.setQueryData<ChatRoom>(
          ["chatRooms", chatRoomId],
          (prev) => {
            if (!prev) return prev;
            const members = (prev.members ?? []).filter(
              (m: Profile) => m.id !== kickedUser.id
            );
            return { ...prev, members };
          }
        );
        queryClient.invalidateQueries({ queryKey: ["chatRooms"] });
      });

      this.hubConnection.on("UserBanned", (bannedUser: User) => {
        const userId = userIdRef.current;
        if (userId && bannedUser.id === userId) {
          toast.error("You have been banned from this chat room.");
          router.navigate("/chat-rooms");
          return;
        }

        toast.info(
          `User ${bannedUser.displayName} has been banned from the chat room.`
        );

        const chatRoomId = chatRoomIdRef.current;
        if (!chatRoomId) return;
        queryClient.setQueryData<ChatRoom>(
          ["chatRooms", chatRoomId],
          (prev) => {
            if (!prev) return prev;
            const members = (prev.members ?? []).filter(
              (m: Profile) => m.id !== bannedUser.id
            );
            const bans = [
              ...(prev.bans ?? []),
              {
                userId: bannedUser.id,
                user: bannedUser,
                chatRoomId: chatRoomId,
                dateBanned: new Date().toISOString(),
              } as ChatRoomBan,
            ];
            return { ...prev, members, bans };
          }
        );
        queryClient.invalidateQueries({ queryKey: ["chatRooms"] });
      });

      this.hubConnection.on("UserUnbanned", (unbannedUser: User) => {
        const userId = userIdRef.current;
        if (userId && unbannedUser.id === userId) {
          toast.info("You have been unbanned from this chat room.");
        } else {
          toast.info(
            `User ${unbannedUser.displayName} has been unbanned from the chat room.`
          );
        }

        const chatRoomId = chatRoomIdRef.current;
        if (!chatRoomId) return;
        queryClient.setQueryData<ChatRoom>(
          ["chatRooms", chatRoomId],
          (prev) => {
            if (!prev) return prev;
            const bans = (prev.bans ?? []).filter(
              (b: ChatRoomBan) => b.userId !== unbannedUser.id
            );
            return { ...prev, bans };
          }
        );
        queryClient.invalidateQueries({ queryKey: ["chatRooms"] });
      });
    },

    stopHubConnection() {
      if (!this.hubConnection) {
        this.currentChatRoomId = null;
        return;
      }

      this.hubConnection.off("UserKicked");
      this.hubConnection.off("UserBanned");
      this.hubConnection.off("UserUnbanned");

      this.hubConnection
        .stop()
        .catch((error) => {
          if (import.meta.env.DEV) {
            console.error(
              "Error stopping chatroom-notifications connection:",
              error
            );
          }
        })
        .finally(() => {
          this.hubConnection = null;
          this.currentChatRoomId = null;
        });
    },
  }));

  useEffect(() => {
    if (chatRoomId && chatRoomIdRef.current !== chatRoomId) {
      chatRoomIdRef.current = chatRoomId;
      notificationsStore.createHubConnection();
    }
  }, [chatRoomId, notificationsStore]);

  useEffect(() => {
    if (userIdRef.current !== userId) {
      userIdRef.current = userId;
    }
  }, [userId]);

  useEffect(() => {
    return () => {
      notificationsStore.stopHubConnection();
    };
  }, [notificationsStore]);

  return { notificationsStore };
};
