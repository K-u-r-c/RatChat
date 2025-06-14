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

export const useFriends = () => {
  const queryClient = useQueryClient();

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
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["friend-requests"] });
      toast.success("Friend request sent!");
    },
    onError: () => {
      toast.error("Failed to send friend request");
    },
  });

  const respondToFriendRequest = useMutation({
    mutationFn: async (data: RespondToFriendRequestRequest) => {
      await agent.post("/friends/request/respond", data);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["friend-requests"] });
      queryClient.invalidateQueries({ queryKey: ["friends"] });
      toast.success(
        variables.accept
          ? "Friend request accepted!"
          : "Friend request declined"
      );
    },
    onError: () => {
      toast.error("Failed to respond to friend request");
    },
  });

  const cancelFriendRequest = useMutation({
    mutationFn: async (requestId: string) => {
      await agent.delete(`/friends/request/${requestId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["friend-requests"] });
      toast.success("Friend request cancelled");
    },
    onError: () => {
      toast.error("Failed to cancel friend request");
    },
  });

  const removeFriend = useMutation({
    mutationFn: async (friendId: string) => {
      await agent.delete(`/friends/${friendId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["friends"] });
      toast.success("Friend removed");
    },
    onError: () => {
      toast.error("Failed to remove friend");
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
