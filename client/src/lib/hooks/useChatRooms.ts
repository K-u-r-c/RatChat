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
import type { ChatRoom, ChatRoomIdentifier, PagedList, ChatChannel } from "../types";
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
            const owner = chatRoom.members.find(
              (x) => x.id === chatRoom.ownerId
            );
            return {
              ...chatRoom,
              isOwner: currentUser?.id === chatRoom.ownerId,
              isMember: chatRoom.members.some((x) => x.id === currentUser?.id),
              ownerImageUrl: owner?.imageUrl,
              channels: (chatRoom.channels ?? []).slice().sort((a, b) => a.position - b.position),
            } as ChatRoom & {
              isOwner: boolean;
              isMember: boolean;
              ownerImageUrl?: string;
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
      const owner = dto.members.find((x) => x.id === dto.ownerId);
      return {
        ...dto,
        isOwner: currentUser?.id === dto.ownerId,
        isMember: dto.members.some((x) => x.id === currentUser?.id),
        ownerImageUrl: owner?.imageUrl,
        channels: (dto.channels ?? []).slice().sort((a, b) => a.position - b.position),
      };
    },
  });

  useEffect(() => {
    if (!chatRoom) return;
    queryClient.setQueryData(["chatRooms", chatRoom.id], chatRoom);
    queryClient.setQueryData(["chatRooms", chatRoom.slug], chatRoom);
  }, [chatRoom, queryClient]);

  const updateRoomChannelsCache = (
    roomId: string,
    updater: (channels: ChatChannel[]) => ChatChannel[]
  ) => {
    const applyUpdate = (room?: ChatRoom) => {
      if (!room) return room;
      const updatedChannels = updater([...(room.channels ?? [])]);
      return {
        ...room,
        channels: updatedChannels
          .slice()
          .sort((a, b) => a.position - b.position),
      } as ChatRoom;
    };

    queryClient.setQueryData<ChatRoom>(["chatRooms", roomId], applyUpdate);

    const cachedById = queryClient.getQueryData<ChatRoom>(["chatRooms", roomId]);
    const slugKey = cachedById?.slug ?? (chatRoom?.id === roomId ? chatRoom.slug : undefined);
    if (slugKey) {
      queryClient.setQueryData<ChatRoom>(["chatRooms", slugKey], applyUpdate);
    }

    queryClient.setQueryData<any>(["chatRooms"], (prev: any) => {
      if (!prev) return prev;
      return {
        ...prev,
        pages: prev.pages.map((page: any) => ({
          ...page,
          items: page.items.map((item: ChatRoom) =>
            item.id === roomId ? applyUpdate(item)! : item
          ),
        })),
      };
    });
  };

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
        const response = await agent.post<string>(`/chatRooms/${id}/invites`, {
          allowedUserId,
          maxUses,
          expiresInMinutes,
          sendToFriend,
        });

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

  const createChannel = useMutation({
    mutationFn: async (params: {
      chatRoomId: string;
      name: string;
      type: ChatChannel["type"];
    }) => {
      const response = await agent.post<ChatChannel>(
        `/chatRooms/${params.chatRoomId}/channels`,
        {
          name: params.name,
          type: params.type,
        }
      );
      return response.data;
    },
    onSuccess: async (channel, variables) => {
      const normalized: ChatChannel = {
        ...channel,
        chatRoomId: channel.chatRoomId ?? variables.chatRoomId,
      };

      updateRoomChannelsCache(variables.chatRoomId, (channels) => [
        ...channels.filter((c) => c.id !== normalized.id),
        normalized,
      ]);
      await queryClient.invalidateQueries({
        queryKey: ["chatRooms"],
        exact: false,
      });
    },
    onError: () => {
      toast.error("Failed to create channel");
    },
  });

  const updateChannel = useMutation({
    mutationFn: async (params: {
      chatRoomId: string;
      channelId: string;
      name?: string;
      position?: number;
    }) => {
      const response = await agent.put<ChatChannel>(
        `/chatRooms/${params.chatRoomId}/channels/${params.channelId}`,
        {
          name: params.name,
          position: params.position,
        }
      );
      return response.data;
    },
    onSuccess: async (channel, variables) => {
      const normalized: ChatChannel = {
        ...channel,
        chatRoomId: channel.chatRoomId ?? variables.chatRoomId,
      };

      updateRoomChannelsCache(variables.chatRoomId, (channels) =>
        channels.map((c) => (c.id === normalized.id ? normalized : c))
      );
      await queryClient.invalidateQueries({
        queryKey: ["chatRooms"],
        exact: false,
      });
    },
    onError: () => {
      toast.error("Failed to update channel");
    },
  });

  const deleteChannel = useMutation({
    mutationFn: async (params: { chatRoomId: string; channelId: string }) => {
      await agent.delete(
        `/chatRooms/${params.chatRoomId}/channels/${params.channelId}`
      );
    },
    onSuccess: async (_, variables) => {
      updateRoomChannelsCache(variables.chatRoomId, (channels) =>
        channels.filter((c) => c.id !== variables.channelId)
      );
      await queryClient.invalidateQueries({
        queryKey: ["chatRooms"],
        exact: false,
      });
    },
    onError: () => {
      toast.error("Failed to delete channel");
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
    createChannel,
    updateChannel,
    deleteChannel,
    setChatRoomImage,
    deleteChatRoomImage,
  };
};
