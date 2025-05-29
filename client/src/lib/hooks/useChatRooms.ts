import {
  keepPreviousData,
  useInfiniteQuery,
  useQuery,
} from "@tanstack/react-query";
import agent from "../api/agent";
import { useLocation } from "react-router";
import { useAccount } from "./useAccount";
import type { ChatRoom, PagedList } from "../types";
import { useStore } from "./useStore";

export const useChatRooms = (id?: string) => {
  const { currentUser } = useAccount();
  const location = useLocation();
  const {
    chatRoomsStore: { filter, startDate },
  } = useStore();

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

  return {
    chatRoomsGroup: chatRoomsGroup,
    isLoading,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
    chatRoom,
    isLoadingChatRoom,
  };
};
