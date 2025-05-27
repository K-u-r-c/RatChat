import { useQuery, useQueryClient } from "@tanstack/react-query";
import agent from "../api/agent";
import type { User } from "../types";

export const useAccount = () => {
  const queryClient = useQueryClient();

  const { data: currentUser, isLoading: loadingUserInfo } = useQuery({
    queryKey: ["user"],
    queryFn: async () => {
      const response = await agent.get<User>("/account/user-info");
      return response.data;
    },
    enabled: !queryClient.getQueryData(["user"]),
  });

  return {
    currentUser,
    loadingUserInfo,
  };
};
