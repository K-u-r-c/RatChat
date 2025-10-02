import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import agent from "../api/agent";
import { toast } from "react-toastify";

export type ChatAppearance = {
  id: string;
  chatType: string;
  chatId: string;
  defaultEmoji: string;
  backgroundKey: string;
  backgroundCustomUrl?: string | null;
  backgroundCustomPublicId?: string | null;
  updatedByUserId?: string;
  updatedAt: string;
};

export type SetChatAppearanceRequest = {
  chatType: string;
  chatId: string;
  defaultEmoji?: string;
  backgroundKey?: string;
  backgroundCustomUrl?: string | null;
  backgroundCustomPublicId?: string | null;
};

export function useChatAppearance() {
  const queryClient = useQueryClient();

  const useAppearance = (chatType: string, chatId: string) => {
    return useQuery({
      queryKey: ["chat-appearance", chatType, chatId],
      queryFn: async () => {
        const response = await agent.get<ChatAppearance>(
          `/chatappearances?chatType=${encodeURIComponent(
            chatType
          )}&chatId=${encodeURIComponent(chatId)}`
        );
        return response.data;
      },
      enabled: !!chatType && !!chatId,
    });
  };

  const setAppearance = useMutation({
    mutationFn: async (data: SetChatAppearanceRequest) => {
      const response = await agent.post<ChatAppearance>(
        "/chatappearances",
        data
      );
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(
        ["chat-appearance", data.chatType, data.chatId],
        data
      );
      toast.success("Appearance updated successfully!");
    },
    onError: () => {
      toast.error("Failed to update appearance");
    },
  });

  return {
    useAppearance,
    setAppearance,
  };
}
