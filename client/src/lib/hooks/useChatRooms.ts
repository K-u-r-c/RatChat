import {
  keepPreviousData,
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import agent from "../api/agent";
import { useLocation, useNavigate } from "react-router";
import { useAccount } from "./useAccount";
import type { ChatRoom, PagedList } from "../types";
import { useStore } from "./useStore";
import type { FieldValues } from "react-hook-form";
import { useState } from "react";
import { toast } from "react-toastify";

export const useChatRooms = (id?: string) => {
  const queryClient = useQueryClient();
  const { currentUser } = useAccount();
  const location = useLocation();
  const navigate = useNavigate();
  const {
    chatRoomsStore: { filter, startDate },
  } = useStore();

  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [isGeneratingInvite, setIsGeneratingInvite] = useState(false);

  const {
    data: chatRoomsGroup,
    isLoading,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
  } = useInfiniteQuery<PagedList<ChatRoom, string>>({
    queryKey: ["chatRooms", filter, startDate],
    queryFn: async ({ pageParam = null }) => {
      const response = await agent.get<PagedList<ChatRoom, string>>(
        "/chatRooms",
        {
          params: {
            cursor: pageParam,
            pageSize: 3,
            filter,
            startDate,
          },
        }
      );
      return response.data;
    },
    placeholderData: keepPreviousData,
    initialPageParam: null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    enabled: !id && location.pathname == "/chat-rooms" && !!currentUser,
    select: (data) => ({
      ...data,
      pages: data.pages.map((page) => ({
        ...page,
        items: page.items.map((chatRoom) => {
          const admin = chatRoom.members.find((x) => x.id === chatRoom.adminId);
          return {
            ...chatRoom,
            isAdmin: currentUser?.id === chatRoom.adminId,
            isMember: chatRoom.members.some((x) => x.id === currentUser?.id),
            adminImageUrl: admin?.imageUrl,
          };
        }),
      })),
    }),
  });

  const { data: chatRoom, isLoading: isLoadingChatRoom } = useQuery({
    queryKey: ["chatRooms", id],
    queryFn: async () => {
      const response = await agent.get<ChatRoom>(`/chatRooms/${id}`);
      return response.data;
    },
    enabled: !!id && !!currentUser,
    select: (data) => {
      const admin = data.members.find((x) => x.id === data.adminId);
      return {
        ...data,
        isAdmin: currentUser?.id === data.adminId,
        isMember: data.members.some((x) => x.id === currentUser?.id),
        adminImageUrl: admin?.imageUrl,
      };
    },
  });

  const updateChatRoom = useMutation({
    mutationFn: async (chatRoom: ChatRoom) => {
      await agent.put("/chatRooms", chatRoom);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["chatRooms"],
      });
    },
  });

  const createChatRoom = useMutation({
    mutationFn: async (chatRoom: FieldValues) => {
      const response = await agent.post("/chatRooms", chatRoom);
      return response.data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["chatRooms"],
      });
    },
  });

  const deleteChatRooms = useMutation({
    mutationFn: async (id: string) => {
      await agent.delete(`/chatRooms/${id}`);
    },
    onSuccess: async () => {
      navigate("/chat-rooms");
      toast.success("Chat room deleted successfully");
    },
    onError: () => {
      toast.error("Failed to delete chat room");
    },
  });

  const generateInviteLink = useMutation({
    mutationFn: async (id: string) => {
      setIsGeneratingInvite(true);
      setInviteLink(null);
      const response = await agent.post<string>(
        `/chatRooms/${id}/generateInviteLink`
      );
      return response.data;
    },
    onSuccess: (data) => {
      setInviteLink(data);
      setIsGeneratingInvite(false);
    },
    onError: () => {
      setIsGeneratingInvite(false);
    },
  });

  const joinChatRoom = useMutation({
    mutationFn: async ({ id, token }: { id: string; token: string }) => {
      const response = await agent.post(`/chatRooms/${id}/${token}/join`);
      return response.data;
    },
  });

  const leaveChatRoom = useMutation({
    mutationFn: async (id: string) => {
      await agent.post(`/chatRooms/${id}/leave`);
    },
    onSuccess: async () => {
      navigate("/chat-rooms");
      toast.success("You have left the chat room");
    },
    onError: () => {
      toast.error("Failed to leave chat room");
    },
  });

  return {
    chatRoomsGroup: chatRoomsGroup,
    isLoading,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
    chatRoom,
    isLoadingChatRoom,
    updateChatRoom,
    createChatRoom,
    deleteChatRooms,
    generateInviteLink,
    inviteLink,
    isGeneratingInvite,
    joinChatRoom,
    leaveChatRoom,
  };
};
