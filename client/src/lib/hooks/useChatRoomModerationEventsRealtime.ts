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

export const useChatRoomModerationEventsRealtime = (
  chatRoom?: ChatRoom,
  userId?: string
) => {
  const queryClient = useQueryClient();
  const userIdRef = useRef(userId);
  const chatRoomRef = useRef(chatRoom);

  const moderationEventStore = useLocalObservable(() => ({
    hubConnection: null as HubConnection | null,
    connectedChatRoomId: null as string | null,

    createHubConnection() {
      const chatRoom = chatRoomRef.current;
      if (!chatRoom) return;

      if (
        this.hubConnection &&
        this.hubConnection.state !== HubConnectionState.Disconnected &&
        this.connectedChatRoomId === chatRoom.id
      ) {
        return;
      }

      if (this.hubConnection && this.connectedChatRoomId !== chatRoom.id) {
        this.stopHubConnection();
      }

      this.hubConnection = new HubConnectionBuilder()
        .withUrl(
          `${import.meta.env.VITE_CHATROOM_NOTIFICATIONS_URL}?chatRoomId=${
            chatRoom.id
          }`,
          { withCredentials: true }
        )
        .withAutomaticReconnect()
        .build();

      this.connectedChatRoomId = chatRoom.id;

      this.hubConnection.start().catch((error) => {
        if (import.meta.env.DEV) {
          console.error(
            "Error establishing chatroom-moderationevents connection:",
            error
          );
        }
      });

      // Server events
      this.hubConnection.on("UserKicked", (kickedUser: User) => {
        const currentUserId = userIdRef.current;
        const currentChatRoom = chatRoomRef.current;
        if (!currentChatRoom) return;

        if (currentUserId && kickedUser.id === currentUserId) {
          toast.error(
            `You have been kicked from the ${currentChatRoom.title}.`
          );
          router.navigate("/");
          return;
        }

        toast.info(
          `User ${kickedUser.displayName} has been kicked from the ${currentChatRoom.title}.`
        );

        queryClient.setQueryData<ChatRoom>(
          ["chatRooms", currentChatRoom.id],
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
        const currentChatRoom = chatRoomRef.current;
        if (!currentChatRoom) return;

        const currentUserId = userIdRef.current;
        if (currentUserId && bannedUser.id === currentUserId) {
          toast.error(
            `You have been banned from the ${currentChatRoom.title}.`
          );
          router.navigate("/");
          return;
        }

        toast.info(
          `User ${bannedUser.displayName} has been banned from the ${currentChatRoom.title}.`
        );

        queryClient.setQueryData<ChatRoom>(
          ["chatRooms", currentChatRoom.id],
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
                chatRoomId: currentChatRoom.id,
                dateBanned: new Date().toISOString(),
              } as ChatRoomBan,
            ];
            return { ...prev, members, bans };
          }
        );
        queryClient.invalidateQueries({ queryKey: ["chatRooms"] });
      });

      this.hubConnection.on("UserUnbanned", (unbannedUser: User) => {
        const currentChatRoom = chatRoomRef.current;
        if (!currentChatRoom) return;

        const currentUserId = userIdRef.current;
        if (currentUserId && unbannedUser.id === currentUserId) {
          toast.info(
            `You have been unbanned from the ${currentChatRoom.title}.`
          );
        } else {
          toast.info(
            `User ${unbannedUser.displayName} has been unbanned from the ${currentChatRoom.title}.`
          );
        }

        queryClient.setQueryData<ChatRoom>(
          ["chatRooms", currentChatRoom.id],
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
      if (!this.hubConnection) return;

      this.hubConnection.off("UserKicked");
      this.hubConnection.off("UserBanned");
      this.hubConnection.off("UserUnbanned");

      this.hubConnection
        .stop()
        .catch((error) => {
          if (import.meta.env.DEV) {
            console.error(
              "Error stopping chatroom-moderationevents connection:",
              error
            );
          }
        })
        .finally(() => {
          this.hubConnection = null;
        });
    },
  }));

  useEffect(() => {
    if (chatRoom && chatRoomRef.current !== chatRoom) {
      chatRoomRef.current = chatRoom;
      moderationEventStore.createHubConnection();
    }
  }, [chatRoom, moderationEventStore]);

  useEffect(() => {
    if (userIdRef.current !== userId) {
      userIdRef.current = userId;
    }
  }, [userId]);

  useEffect(() => {
    return () => {
      moderationEventStore.stopHubConnection();
    };
  }, [moderationEventStore]);

  return { notificationsStore: moderationEventStore };
};
