import { keepPreviousData, useInfiniteQuery } from "@tanstack/react-query";
import agent from "../api/agent";
import { useAccount } from "./useAccount";
import type { ChatRoom, PagedList } from "../types";

export const useSidebarChatRooms = () => {
  const { currentUser } = useAccount();

  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useInfiniteQuery<PagedList<ChatRoom, string>>({
      queryKey: ["sidebar-chatRooms"],
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

  return {
    chatRooms: items,
    isLoading,
    fetchNextPage,
    hasNextPage: !!hasNextPage,
    isFetchingNextPage,
  };
};
