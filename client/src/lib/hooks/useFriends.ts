import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import agent from "../api/agent";
import { toast } from "react-toastify";
import type {
  Friend,
  FriendRequestsResponse,
  FriendSearch,
  SendFriendRequestRequest,
  RespondToFriendRequestRequest,
} from "../types";
import { useAccount } from "./useAccount";

export const useFriends = () => {
  const queryClient = useQueryClient();
  const { currentUser } = useAccount();

  const { data: friends, isLoading: isLoadingFriends } = useQuery({
    queryKey: ["friends"],
    queryFn: async () => {
      const response = await agent.get<Friend[]>("/friends");
      return response.data;
    },
  });

  const { data: friendRequests, isLoading: isLoadingRequests } = useQuery({
    queryKey: ["friend-requests"],
    queryFn: async () => {
      const response = await agent.get<FriendRequestsResponse>(
        "/friends/requests"
      );
      return response.data;
    },
  });

  const searchUserByFriendCode = useMutation({
    mutationFn: async (friendCode: string) => {
      const response = await agent.get<FriendSearch>(
        `/friends/search/${friendCode}`
      );
      return response.data;
    },
  });

  const sendFriendRequest = useMutation({
    mutationFn: async (data: SendFriendRequestRequest) => {
      await agent.post("/friends/request", data);
      return data;
    },
    onSuccess: async (requestData) => {
      queryClient.setQueryData(
        ["friend-requests"],
        (old: FriendRequestsResponse | undefined) => {
          if (!old) return old;

          const tempRequest = {
            id: `temp-${Date.now()}`,
            senderId: currentUser?.id || "",
            senderDisplayName: currentUser?.displayName || "",
            senderImageUrl: currentUser?.imageUrl,
            receiverId: "",
            receiverDisplayName: "",
            receiverImageUrl: undefined,
            status: "Pending" as const,
            createdAt: new Date(),
            message: requestData.message,
          };

          return {
            ...old,
            sent: [tempRequest, ...old.sent],
          };
        }
      );

      await queryClient.invalidateQueries({
        queryKey: ["friend-requests"],
      });
    },
    onError: () => {
      toast.error("Failed to send friend request");
      queryClient.invalidateQueries({
        queryKey: ["friend-requests"],
      });
    },
  });

  const respondToFriendRequest = useMutation({
    mutationFn: async (data: RespondToFriendRequestRequest) => {
      await agent.post("/friends/request/respond", data);
      return data;
    },
    onSuccess: async (responseData) => {
      queryClient.setQueryData(
        ["friend-requests"],
        (old: FriendRequestsResponse | undefined) => {
          if (!old) return old;

          return {
            ...old,
            received: old.received.filter(
              (req) => req.id !== responseData.requestId
            ),
          };
        }
      );

      if (responseData.accept) {
        await queryClient.invalidateQueries({
          queryKey: ["friends"],
        });
      }
    },
    onError: () => {
      toast.error("Failed to respond to friend request");
    },
  });

  const cancelFriendRequest = useMutation({
    mutationFn: async (requestId: string) => {
      await agent.delete(`/friends/request/${requestId}`);
      return requestId;
    },
    onSuccess: async (requestId) => {
      queryClient.setQueryData(
        ["friend-requests"],
        (old: FriendRequestsResponse | undefined) => {
          if (!old) return old;

          return {
            ...old,
            sent: old.sent.filter((req) => req.id !== requestId),
          };
        }
      );
    },
    onError: () => {
      toast.error("Failed to cancel friend request");
    },
  });

  const removeFriend = useMutation({
    mutationFn: async (friendId: string) => {
      await agent.delete(`/friends/${friendId}`);
      return friendId;
    },
    onSuccess: (friendId) => {
      queryClient.setQueryData(["friends"], (old: Friend[] | undefined) => {
        if (!old) return old;
        return old.filter((friend) => friend.id !== friendId);
      });
      toast.success("Friend removed");
    },
    onError: () => {
      toast.error("Failed to remove friend");
      queryClient.invalidateQueries({ queryKey: ["friends"] });
    },
  });

  return {
    friends,
    isLoadingFriends,
    friendRequests,
    isLoadingRequests,
    searchUserByFriendCode,
    sendFriendRequest,
    respondToFriendRequest,
    cancelFriendRequest,
    removeFriend,
  };
};
