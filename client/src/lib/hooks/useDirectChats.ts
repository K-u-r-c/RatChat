import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import agent from "../api/agent";
import type { DirectChat } from "../types";
import { toast } from "react-toastify";

export const useDirectChats = () => {
  const queryClient = useQueryClient();

  const {
    data: directChats,
    isLoading: isLoadingChats,
    error,
  } = useQuery({
    queryKey: ["direct-chats"],
    queryFn: async () => {
      try {
        const response = await agent.get<DirectChat[]>("/directChats");
        console.log("API Response:", response.data);
        return response.data;
      } catch (error) {
        console.error("Error fetching direct chats:", error);
        throw error;
      }
    },
    retry: 3,
    retryDelay: 1000,
  });

  const createDirectChat = useMutation({
    mutationFn: async (otherUserId: string) => {
      const response = await agent.post<string>("/directChats", {
        otherUserId,
      });
      return response.data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["direct-chats"],
      });
    },
    onError: () => {
      toast.error("Failed to create direct chat");
    },
  });

  return {
    directChats: directChats || [],
    isLoadingChats,
    error,
    createDirectChat,
  };
};
