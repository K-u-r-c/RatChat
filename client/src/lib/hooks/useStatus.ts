import { useMutation, useQuery } from "@tanstack/react-query";
import agent from "../api/agent";
import { toast } from "react-toastify";

export type UserStatus =
  | "Online"
  | "Away"
  | "DoNotDisturb"
  | "Invisible"
  | "Offline";

export type UpdateStatusRequest = {
  status: UserStatus;
  customMessage?: string;
};

export type UserStatusDto = {
  userId: string;
  status: string;
  customMessage?: string;
  lastSeen: Date;
  isOnline: boolean;
};

export type OnlineUsersDto = {
  userIds: string[];
};

export const useStatus = () => {
  const updateStatus = useMutation({
    mutationFn: async (data: UpdateStatusRequest) => {
      await agent.post("/status/update", data);
      return data;
    },
    onSuccess: (data) => {
      toast.success(`Status updated to ${data.status}`);
    },
    onError: () => {
      toast.error("Failed to update status");
    },
  });

  const useUserStatus = (userId: string) => {
    return useQuery({
      queryKey: ["user-status", userId],
      queryFn: async () => {
        const response = await agent.get<UserStatusDto>(`/status/${userId}`);
        return response.data;
      },
      enabled: !!userId,
    });
  };

  const useOnlineUsers = (userIds: string[]) => {
    return useQuery({
      queryKey: ["online-users", userIds],
      queryFn: async () => {
        const params = new URLSearchParams();
        userIds.forEach((id) => params.append("userIds", id));
        const response = await agent.get<OnlineUsersDto>(
          `/status/users?${params.toString()}`
        );
        return response.data;
      },
      enabled: userIds.length > 0,
      refetchInterval: 5000,
    });
  };

  return {
    updateStatus,
    useUserStatus,
    useOnlineUsers,
  };
};
