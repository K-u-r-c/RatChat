import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import agent from "../api/agent";
import { toast } from "react-toastify";
import type { User, Friend } from "../types";

export type UserStatus =
  | "Online"
  | "Away"
  | "DoNotDisturb"
  | "Invisible"
  | "Offline";

export type UpdateStatusRequest = {
  status: UserStatus;
};

export type UserStatusDto = {
  userId: string;
  status: string;
  lastSeen: Date;
  isOnline: boolean;
};

export type OnlineUsersDto = {
  userIds: string[];
};

export const useStatus = () => {
  const queryClient = useQueryClient();

  const updateStatus = useMutation({
    mutationFn: async (data: UpdateStatusRequest) => {
      await agent.post("/status/update", data);
      return data;
    },
    onMutate: async (newStatus) => {
      await queryClient.cancelQueries({ queryKey: ["user"] });
      await queryClient.cancelQueries({ queryKey: ["friends"] });
      await queryClient.cancelQueries({ queryKey: ["chatRooms"] });

      const previousUser = queryClient.getQueryData<User>(["user"]);
      const previousFriends = queryClient.getQueryData<Friend[]>(["friends"]);
      const previousChatRooms = queryClient.getQueryData(["chatRooms"]);

      if (previousUser) {
        queryClient.setQueryData<User>(["user"], {
          ...previousUser,
          status: newStatus.status,
          lastSeen: new Date(),
        });
      }

      return { previousUser, previousFriends, previousChatRooms };
    },
    onError: (err, _, context) => {
      if (import.meta.env.DEV) {
        console.error("Error updating status:", err);
      }

      if (context?.previousUser) {
        queryClient.setQueryData(["user"], context.previousUser);
      }
      if (context?.previousFriends) {
        queryClient.setQueryData(["friends"], context.previousFriends);
      }
      if (context?.previousChatRooms) {
        queryClient.setQueryData(["chatRooms"], context.previousChatRooms);
      }
      toast.error("Failed to update status");
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["user"] });
      toast.success(`Status updated to ${data.status}`);
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
      staleTime: 5000,
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
      refetchInterval: 30000,
      staleTime: 10000,
    });
  };

  return {
    updateStatus,
    useUserStatus,
    useOnlineUsers,
  };
};
