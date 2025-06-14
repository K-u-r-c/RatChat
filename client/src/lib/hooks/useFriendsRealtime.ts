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
      // Create SignalR connection
      this.hubConnection = new HubConnectionBuilder()
        .withUrl(
          import.meta.env.VITE_FRIENDS_URL || "https://localhost:5001/friends",
          {
            withCredentials: true,
          }
        )
        .withAutomaticReconnect()
        .build();

      // Start connection
      this.hubConnection
        .start()
        .then(() => {
          console.log("Friends SignalR connection established");
        })
        .catch((error) => {
          console.error("Error establishing friends connection:", error);
        });

      // Handle friend request received
      this.hubConnection.on(
        "FriendRequestReceived",
        (friendRequest: FriendRequest) => {
          console.log("Friend request received:", friendRequest);

          // Update friend requests cache
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

          // Show notification
          toast.info(
            `${friendRequest.senderDisplayName} sent you a friend request!`,
            {
              autoClose: 5000,
            }
          );
        }
      );

      // Handle friend request accepted
      this.hubConnection.on(
        "FriendRequestAccepted",
        (receiverId: string, newFriend: Friend) => {
          console.log("Friend request accepted:", newFriend);

          // Add to friends list
          queryClient.setQueryData(["friends"], (old: Friend[] | undefined) => {
            if (!old) return [newFriend];
            return [newFriend, ...old].sort((a, b) =>
              a.displayName.localeCompare(b.displayName)
            );
          });

          // Remove from sent requests
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

          toast.success(
            `${newFriend.displayName} accepted your friend request!`
          );
        }
      );

      // Handle friend request declined
      this.hubConnection.on("FriendRequestDeclined", (receiverId: string) => {
        console.log("Friend request declined by:", receiverId);

        // Remove from sent requests
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

      // Handle friend request removed (after accept/decline)
      this.hubConnection.on(
        "FriendRequestRemoved",
        (receiverId: string, senderId: string) => {
          console.log("Friend request removed:", { receiverId, senderId });

          // Remove from both sent and received requests
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

      // Handle friend request cancelled
      this.hubConnection.on("FriendRequestCancelled", (requestId: string) => {
        console.log("Friend request cancelled:", requestId);

        // Remove from received requests
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

      // Handle friend added (when current user accepts a request)
      this.hubConnection.on("FriendAdded", (newFriend: Friend) => {
        console.log("Friend added:", newFriend);

        // Add to friends list
        queryClient.setQueryData(["friends"], (old: Friend[] | undefined) => {
          if (!old) return [newFriend];
          return [newFriend, ...old].sort((a, b) =>
            a.displayName.localeCompare(b.displayName)
          );
        });
      });

      // Handle friend removed
      this.hubConnection.on("FriendRemoved", (removedByUserId: string) => {
        console.log("Friend removed by:", removedByUserId);

        // Remove from friends list
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
