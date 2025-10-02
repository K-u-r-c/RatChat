import { useQuery } from "@tanstack/react-query";
import agent from "../api/agent";
import type { EncryptedDirectChat } from "../types";

export const useEncryptedDirectChats = () => {
  const {
    data: encryptedDirectChats,
    isLoading: isLoadingEncryptedChats,
    error,
  } = useQuery({
    queryKey: ["encrypted-direct-chats"],
    queryFn: async () => {
      try {
        const response = await agent.get<EncryptedDirectChat[]>(
          "/encryptedDirectChats"
        );
        return response.data;
      } catch (error) {
        console.error("Error fetching encrypted direct chats:", error);
        throw error;
      }
    },
    retry: 3,
    retryDelay: 1000,
  });

  return {
    encryptedDirectChats: encryptedDirectChats || [],
    isLoadingEncryptedChats,
    error,
  };
};
