import { useQuery } from "@tanstack/react-query";
import agent from "../api/agent";
import type { DirectChat } from "../types";

export const useDirectChats = () => {
  const {
    data: directChats,
    isLoading: isLoadingChats,
    error,
  } = useQuery({
    queryKey: ["direct-chats"],
    queryFn: async () => {
      try {
        const response = await agent.get<DirectChat[]>("/directChats");
        return response.data;
      } catch (error) {
        console.error("Error fetching direct chats:", error);
        throw error;
      }
    },
    retry: 3,
    retryDelay: 1000,
  });

  return {
    directChats: directChats || [],
    isLoadingChats,
    error,
  };
};
