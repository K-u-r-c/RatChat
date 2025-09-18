import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import agent from "../api/agent";

type EmojiPreference = {
  id: string;
  userId: string;
  chatType: string;
  chatId: string;
  defaultEmoji: string;
  createdAt: Date;
  updatedAt: Date;
};

type SetEmojiPreferenceRequest = {
  chatType: string;
  chatId: string;
  defaultEmoji: string;
};

export function useEmojiPreferences() {
  const queryClient = useQueryClient();

  const useEmojiPreference = (chatType: string, chatId: string) => {
    return useQuery({
      queryKey: ["emoji-preferences", chatType, chatId],
      queryFn: async () => {
        const response = await agent.get<EmojiPreference>(
          `/emojipreferences?chatType=${encodeURIComponent(
            chatType
          )}&chatId=${encodeURIComponent(chatId)}`
        );
        return response.data;
      },
      enabled: !!chatType && !!chatId,
    });
  };

  const setEmojiPreference = useMutation({
    mutationFn: async (data: SetEmojiPreferenceRequest) => {
      const response = await agent.post<EmojiPreference>(
        "/emojipreferences",
        data
      );
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(
        ["emoji-preferences", data.chatType, data.chatId],
        data
      );
      toast.success("Default emoji updated successfully!");
    },
    onError: () => {
      toast.error("Failed to update default emoji");
    },
  });

  return {
    useEmojiPreference,
    setEmojiPreference,
  };
}
