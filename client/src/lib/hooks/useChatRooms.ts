import {
  keepPreviousData,
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import agent from "../api/agent";
import { useNavigate } from "react-router";
import { useAccount } from "./useAccount";
import type { ChatRoom, PagedList } from "../types";
import { useStore } from "./useStore";
import type { FieldValues } from "react-hook-form";
import { useState } from "react";
import { toast } from "react-toastify";

export const useChatRooms = (id?: string) => {
  const queryClient = useQueryClient();
  const { currentUser } = useAccount();
  const navigate = useNavigate();
  const { uiStore } = useStore();

  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [isGeneratingInvite, setIsGeneratingInvite] = useState(false);

  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useInfiniteQuery<PagedList<ChatRoom, string>>({
      queryKey: ["chatRooms"],
      queryFn: async ({ pageParam = null }) => {
        const response = await agent.get<PagedList<ChatRoom, string>>(
          "/chatRooms",
          {
            params: {
              cursor: pageParam,
              pageSize: 20,
              filter: "all",
            },
          }
        );
        return response.data;
      },
      placeholderData: keepPreviousData,
      initialPageParam: null,
      getNextPageParam: (lastPage) => lastPage.nextCursor,
      enabled: !!currentUser,
      select: (data) => ({
        ...data,
        pages: data.pages.map((page) => ({
          ...page,
          items: page.items.map((chatRoom) => {
            const admin = chatRoom.members.find(
              (x) => x.id === chatRoom.adminId
            );
            return {
              ...chatRoom,
              isAdmin: currentUser?.id === chatRoom.adminId,
              isMember: chatRoom.members.some((x) => x.id === currentUser?.id),
              adminImageUrl: admin?.imageUrl,
            } as ChatRoom & {
              isAdmin: boolean;
              isMember: boolean;
              adminImageUrl?: string;
            };
          }),
        })),
      }),
    });

  const items = (data?.pages ?? []).flatMap((p) => p.items);

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
      await agent.put(`/chatRooms/${chatRoom.id}`, chatRoom);
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
      navigate("/");
      toast.success("Chat room deleted successfully");
    },
    onError: () => {
      toast.error("Failed to delete chat room");
    },
  });

  const createInviteLink = useMutation({
    mutationFn: async (params: {
      id: string;
      allowedUserId?: string | null;
      maxUses?: number | null;
      expiresInMinutes?: number | null;
    }) => {
      const { id, ...body } = params;
      setIsGeneratingInvite(true);
      setInviteLink(null);
      const response = await agent.post<string>(
        `/chatRooms/${id}/invites`,
        body
      );
      return response.data;
    },
    onSuccess: async (data) => {
      setInviteLink(data);
      setIsGeneratingInvite(false);
      try {
        await navigator.clipboard.writeText(data);
        toast.success("Invite link created and copied to clipboard");
      } catch {
        // ignore
      }
    },
    onError: () => {
      setIsGeneratingInvite(false);
      toast.error("Failed to create invite link");
    },
  });

  const joinChatRoom = useMutation({
    mutationFn: async ({ id, token }: { id: string; token: string }) => {
      const response = await agent.post(`/chatRooms/${id}/${token}/join`);
      return response.data;
    },
    onSuccess: (joinedChatRoomId: string) => {
      navigate(`/chat-rooms/${joinedChatRoomId}`);
      toast.success("Successfully joined the chat room!");
    },
    onError: () => {
      toast.error("Failed to join the chat room");
    },
  });

  const leaveChatRoom = useMutation({
    mutationFn: async (id: string) => {
      await agent.post(`/chatRooms/${id}/leave`);
    },
    onMutate: async () => {
      uiStore.suppressNextChatRoomForbiddenToast();
    },
    onSuccess: async () => {
      navigate("/");
      toast.success("You have left the chat room");
    },
    onError: () => {
      toast.error("Failed to leave chat room");
    },
  });

  const setChatRoomImage = useMutation({
    mutationFn: async (params: { id: string; imageUrl: string }) => {
      const response = await agent.put<ChatRoom>(
        `/chatRooms/${params.id}/image`,
        params
      );
      return response.data;
    },
    onMutate: async (data) => {
      await queryClient.cancelQueries({ queryKey: ["chatRooms", data.id] });
      const previous = queryClient.getQueryData<ChatRoom>([
        "chatRooms",
        data.id,
      ]);
      queryClient.setQueryData<ChatRoom>(["chatRooms", data.id], (old) =>
        old ? { ...old, imageUrl: data.imageUrl } : old
      );
      return { previous };
    },
    onSuccess: async (data) => {
      await queryClient.invalidateQueries({
        queryKey: ["chatRooms", data.id],
      });
      toast.success("Chat room image updated successfully");
    },
    onError: (err, data, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["chatRooms", data.id], context.previous);
      }
      toast.error("Failed to update chat room image");
      if (import.meta.env.DEV) console.error(err);
    },
  });

  const deleteChatRoomImage = useMutation({
    mutationFn: async (id: string) => {
      const response = await agent.delete<ChatRoom>(`/chatRooms/${id}/image`);
      return response.data;
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["chatRooms", id] });
      const previous = queryClient.getQueryData<ChatRoom>(["chatRooms", id]);
      queryClient.setQueryData<ChatRoom>(["chatRooms", id], (old) =>
        old ? { ...old, imageUrl: undefined } : old
      );
      return { previous };
    },
    onSuccess: async (data) => {
      await queryClient.invalidateQueries({
        queryKey: ["chatRooms", data.id],
      });
      toast.success("Chat room image deleted successfully");
    },
    onError: (err, id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["chatRooms", id], context.previous);
      }
      toast.error("Failed to delete chat room image");
      if (import.meta.env.DEV) console.error(err);
    },
  });

  return {
    chatRooms: items,
    isLoading,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage: !!hasNextPage,
    chatRoom,
    isLoadingChatRoom,
    updateChatRoom,
    createChatRoom,
    deleteChatRooms,
    createInviteLink,
    inviteLink,
    isGeneratingInvite,
    joinChatRoom,
    leaveChatRoom,
    setChatRoomImage,
    deleteChatRoomImage,
  };
};
