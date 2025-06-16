import { useEffect, useRef } from "react";
import { useLocalObservable } from "mobx-react-lite";
import {
  HubConnection,
  HubConnectionBuilder,
  HubConnectionState,
} from "@microsoft/signalr";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import type { Friend, FriendRequest, FriendRequestsResponse } from "../types";

export const useFriendsRealtime = () => {
  const queryClient = useQueryClient();
  const created = useRef(false);

  const friendsStore = useLocalObservable(() => ({
    hubConnection: null as HubConnection | null,

    createHubConnection() {
      this.hubConnection = new HubConnectionBuilder()
        .withUrl(
          import.meta.env.VITE_FRIENDS_URL || "https://localhost:5001/friends",
          {
            withCredentials: true,
          }
        )
        .withAutomaticReconnect()
        .build();

      this.hubConnection.start().catch((error) => {
        console.error("Error establishing friends connection:", error);
      });

      this.hubConnection.on(
        "FriendRequestReceived",
        (friendRequest: FriendRequest) => {
          queryClient.setQueryData(
            ["friend-requests"],
            (old: FriendRequestsResponse | undefined) => {
              if (!old) return old;
              return {
                ...old,
                received: [friendRequest, ...old.received],
              };
            }
          );

          toast.info(
            `${friendRequest.senderDisplayName} sent you a friend request!`,
            {
              autoClose: 5000,
            }
          );
        }
      );

      this.hubConnection.on(
        "FriendRequestAccepted",
        (receiverId: string, newFriend: Friend) => {
          queryClient.setQueryData(["friends"], (old: Friend[] | undefined) => {
            if (!old) return [newFriend];
            return [newFriend, ...old].sort((a, b) =>
              a.displayName.localeCompare(b.displayName)
            );
          });

          queryClient.setQueryData(
            ["friend-requests"],
            (old: FriendRequestsResponse | undefined) => {
              if (!old) return old;
              return {
                ...old,
                sent: old.sent.filter((req) => req.receiverId !== receiverId),
              };
            }
          );

          queryClient.invalidateQueries({ queryKey: ["direct-chats"] });

          toast.success(
            `${newFriend.displayName} accepted your friend request!`
          );
        }
      );

      this.hubConnection.on("FriendRequestDeclined", (receiverId: string) => {
        queryClient.setQueryData(
          ["friend-requests"],
          (old: FriendRequestsResponse | undefined) => {
            if (!old) return old;
            return {
              ...old,
              sent: old.sent.filter((req) => req.receiverId !== receiverId),
            };
          }
        );

        toast.info("Your friend request was declined");
      });

      this.hubConnection.on(
        "FriendRequestRemoved",
        (receiverId: string, senderId: string) => {
          queryClient.setQueryData(
            ["friend-requests"],
            (old: FriendRequestsResponse | undefined) => {
              if (!old) return old;
              return {
                sent: old.sent.filter(
                  (req) =>
                    !(
                      req.receiverId === receiverId && req.senderId === senderId
                    )
                ),
                received: old.received.filter(
                  (req) =>
                    !(
                      req.receiverId === receiverId && req.senderId === senderId
                    )
                ),
              };
            }
          );
        }
      );

      this.hubConnection.on("FriendRequestCancelled", (requestId: string) => {
        queryClient.setQueryData(
          ["friend-requests"],
          (old: FriendRequestsResponse | undefined) => {
            if (!old) return old;
            return {
              ...old,
              received: old.received.filter((req) => req.id !== requestId),
            };
          }
        );
      });

      this.hubConnection.on("FriendAdded", (newFriend: Friend) => {
        queryClient.setQueryData(["friends"], (old: Friend[] | undefined) => {
          if (!old) return [newFriend];
          return [newFriend, ...old].sort((a, b) =>
            a.displayName.localeCompare(b.displayName)
          );
        });

        queryClient.invalidateQueries({ queryKey: ["direct-chats"] });
      });

      this.hubConnection.on("FriendRemoved", (removedByUserId: string) => {
        queryClient.setQueryData(["friends"], (old: Friend[] | undefined) => {
          if (!old) return old;
          const removedFriend = old.find(
            (friend) => friend.id === removedByUserId
          );
          const updatedFriends = old.filter(
            (friend) => friend.id !== removedByUserId
          );

          if (removedFriend) {
            toast.info(`${removedFriend.displayName} removed you as a friend`);
          }

          return updatedFriends;
        });

        queryClient.invalidateQueries({ queryKey: ["direct-chats"] });
      });
    },

    stopHubConnection() {
      if (this.hubConnection?.state === HubConnectionState.Connected) {
        this.hubConnection.stop().catch((error) => {
          console.error("Error stopping friends connection:", error);
        });
      }
    },
  }));

  useEffect(() => {
    if (!created.current) {
      friendsStore.createHubConnection();
      created.current = true;
    }

    return () => {
      friendsStore.stopHubConnection();
    };
  }, [queryClient, friendsStore]);

  return {
    friendsStore,
  };
};
