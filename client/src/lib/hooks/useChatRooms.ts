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
import type { ChatRoom, ChatRoomIdentifier, PagedList } from "../types";
import { useStore } from "./useStore";
import type { FieldValues } from "react-hook-form";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";

export const useChatRooms = (identifier?: string) => {
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
      select: (paged) => ({
        ...paged,
        pages: paged.pages.map((page) => ({
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
    queryKey: ["chatRooms", identifier],
    queryFn: async () => {
      const response = await agent.get<ChatRoom>(`/chatRooms/${identifier}`);
      return response.data;
    },
    enabled: !!identifier && !!currentUser,
    select: (dto) => {
      const admin = dto.members.find((x) => x.id === dto.adminId);
      return {
        ...dto,
        isAdmin: currentUser?.id === dto.adminId,
        isMember: dto.members.some((x) => x.id === currentUser?.id),
        adminImageUrl: admin?.imageUrl,
      };
    },
  });

  useEffect(() => {
    if (!chatRoom) return;
    queryClient.setQueryData(["chatRooms", chatRoom.id], chatRoom);
    queryClient.setQueryData(["chatRooms", chatRoom.slug], chatRoom);
  }, [chatRoom, queryClient]);

  const updateChatRoom = useMutation({
    mutationFn: async (chatRoom: ChatRoom) => {
      await agent.put(`/chatRooms/${chatRoom.id}`, chatRoom);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["chatRooms"] });
    },
  });

  const createChatRoom = useMutation({
    mutationFn: async (payload: FieldValues) => {
      const response = await agent.post<ChatRoomIdentifier>(
        "/chatRooms",
        payload
      );
      return response.data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["chatRooms"] });
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
      sendToFriend?: boolean;
    }) => {
      setIsGeneratingInvite(true);
      const {
        id,
        allowedUserId,
        maxUses,
        expiresInMinutes,
        sendToFriend = true,
      } = params;

      if (allowedUserId) {
        const response = await agent.post<string>(
          `/chatRooms/${id}/invites`,
          {
            allowedUserId,
            maxUses,
            expiresInMinutes,
            sendToFriend,
          }
        );

        return { link: response.data, sentToFriend: sendToFriend };
      }

      const response = await agent.post<string>(
        `/chatRooms/${id}/generateInviteLink`,
        {
          maxUses,
          expiresInMinutes,
        }
      );

      return { link: response.data, sentToFriend: false };
    },
    onSuccess: async ({ link, sentToFriend }) => {
      setInviteLink(link);
      setIsGeneratingInvite(false);

      if (sentToFriend) {
        await queryClient.invalidateQueries({ queryKey: ["direct-chats"] });
        toast.success("Invite sent to your friend via direct message");
        return;
      }

      try {
        await navigator.clipboard.writeText(link);
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
    mutationFn: async ({
      identifier: target,
      token,
    }: {
      identifier: string;
      token: string;
    }) => {
      const response = await agent.post<ChatRoomIdentifier>(
        `/chatRooms/${target}/${token}/join`
      );
      return response.data;
    },
    onSuccess: (joined) => {
      uiStore.suppressNextChatRoomForbiddenToast();
      navigate(`/chat-rooms/${joined.slug}`);
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
      const matchesKey = (key: readonly unknown[]) =>
        key[0] === "chatRooms" &&
        (key[1] === data.id || key[1] === chatRoom?.slug);

      await queryClient.cancelQueries({
        predicate: (query) => matchesKey(query.queryKey),
      });

      const previousById = queryClient.getQueryData<ChatRoom>([
        "chatRooms",
        data.id,
      ]);
      const previousBySlug = chatRoom?.slug
        ? queryClient.getQueryData<ChatRoom>(["chatRooms", chatRoom.slug])
        : undefined;

      queryClient.setQueryData<ChatRoom>(["chatRooms", data.id], (old) =>
        old ? { ...old, imageUrl: data.imageUrl } : old
      );
      if (chatRoom?.slug) {
        queryClient.setQueryData<ChatRoom>(
          ["chatRooms", chatRoom.slug],
          (old) => (old ? { ...old, imageUrl: data.imageUrl } : old)
        );
      }

      return { previousById, previousBySlug };
    },
    onSuccess: async (data) => {
      await queryClient.invalidateQueries({
        predicate: (query) =>
          query.queryKey[0] === "chatRooms" &&
          (query.queryKey[1] === data.id || query.queryKey[1] === data.slug),
      });
      toast.success("Chat room image updated successfully");
    },
    onError: (err, data, context) => {
      if (context?.previousById) {
        queryClient.setQueryData(["chatRooms", data.id], context.previousById);
      }
      if (chatRoom?.slug && context?.previousBySlug) {
        queryClient.setQueryData(
          ["chatRooms", chatRoom.slug],
          context.previousBySlug
        );
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
      const slug = chatRoom?.slug;

      await queryClient.cancelQueries({
        predicate: (query) =>
          query.queryKey[0] === "chatRooms" &&
          (query.queryKey[1] === id || query.queryKey[1] === slug),
      });

      const previousById = queryClient.getQueryData<ChatRoom>([
        "chatRooms",
        id,
      ]);
      const previousBySlug = slug
        ? queryClient.getQueryData<ChatRoom>(["chatRooms", slug])
        : undefined;

      queryClient.setQueryData<ChatRoom>(["chatRooms", id], (old) =>
        old ? { ...old, imageUrl: undefined } : old
      );
      if (slug) {
        queryClient.setQueryData<ChatRoom>(["chatRooms", slug], (old) =>
          old ? { ...old, imageUrl: undefined } : old
        );
      }

      return { previousById, previousBySlug };
    },
    onSuccess: async (data) => {
      await queryClient.invalidateQueries({
        predicate: (query) =>
          query.queryKey[0] === "chatRooms" &&
          (query.queryKey[1] === data.id || query.queryKey[1] === data.slug),
      });
      toast.success("Chat room image deleted successfully");
    },
    onError: (err, id, context) => {
      if (context?.previousById) {
        queryClient.setQueryData(["chatRooms", id], context.previousById);
      }
      if (chatRoom?.slug && context?.previousBySlug) {
        queryClient.setQueryData(
          ["chatRooms", chatRoom.slug],
          context.previousBySlug
        );
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
