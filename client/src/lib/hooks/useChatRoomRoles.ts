import {useMutation, useQuery, useQueryClient} from "@tanstack/react-query";
import {useCallback} from "react";
import agent from "../api/agent";
import type {
  AssignChatRoomRole,
  ChatRoomRole,
  ChatRoomUserPermission,
  CreateChatRoomRole,
  DeleteChatRoomRole,
  SetMemberDisplayRole,
  UnassignChatRoomRole,
  UpdateChatRoomRole,
} from "../schemas/chatRoomRoleSchema";
import {CHATROOM_PERMISSIONS} from "../types/chatroomPermissions";

const rolesKey = (chatRoomId?: string) => [
  "chatroom-roles",
  chatRoomId ? chatRoomId : null,
];
const usersRolesKey = (chatRoomId?: string) => [
  "chatroom-users-roles",
  chatRoomId ? chatRoomId : null,
];
const userPermsKey = (chatRoomId?: string, userId?: string) => [
  "chatroom-user-permissions",
  chatRoomId ? chatRoomId : null,
  userId ? userId : null,
];

const sortRolesByImportance = (roles: ChatRoomRole[]) =>
  roles.slice().sort((a, b) => a.importance - b.importance);

const sortMemberRoles = (roles: ChatRoomRole[]) =>
  roles
    .slice()
    .sort((a, b) => {
      if (a.isDisplayRole !== b.isDisplayRole) return a.isDisplayRole ? -1 : 1;
      return a.importance - b.importance;
    });

type ReorderRolesContext = {
  previousRoles?: ChatRoomRole[];
  previousUsersRoles?: Map<string, ChatRoomRole[]>;
  chatRoomId?: string;
};

export function useChatRoomRoles(chatRoomId?: string, userId?: string) {
  const queryClient = useQueryClient();

  const {
    data: roles = [],
    isLoading: isLoadingRoles,
    error: rolesError,
  } = useQuery({
    queryKey: rolesKey(chatRoomId),
    enabled: !!chatRoomId,
    queryFn: async () => {
      const res = await agent.get<ChatRoomRole[]>(
        `/chatrooms/roles?chatRoomId=${chatRoomId}`
      );
      return sortRolesByImportance(res.data);
    },
  });

  const {
    data: usersRolesMap = new Map<string, ChatRoomRole[]>(),
    isLoading: isLoadingMemberRoles,
    error: memberRolesError,
  } = useQuery({
    queryKey: usersRolesKey(chatRoomId),
    enabled: !!chatRoomId,
    queryFn: async () => {
      const res = await agent.get<Record<string, ChatRoomRole[]>>(
        `/chatrooms/users-roles?chatRoomId=${chatRoomId}`
      );
      const entries = Object.entries(res.data).map(
        ([userId, roles]): [string, ChatRoomRole[]] => [
          userId,
          sortMemberRoles(roles),
        ]
      );
      return new Map<string, ChatRoomRole[]>(entries);
    },
  });

  const {
    data: userPermissions = {},
    isLoading: isLoadingUserPermissions,
    error: userPermissionsError,
  } = useQuery({
    queryKey: userPermsKey(chatRoomId, userId),
    enabled: !!chatRoomId && !!userId,
    queryFn: async () => {
      const res = await agent.get<ChatRoomUserPermission>(
        `/chatrooms/user-permissions?chatRoomId=${chatRoomId}&userId=${userId}`
      );
      const map: Record<string, boolean> = {};
      if (res.data.isOwner) {
        Object.values(CHATROOM_PERMISSIONS).forEach((p) => (map[p] = true));
      } else {
        Object.values(CHATROOM_PERMISSIONS).forEach((p) => {
          map[p] = res.data.permissions.some((perm) => perm.name === p);
        });
      }
      return map;
    },
  });

  const isLoading =
    isLoadingRoles || isLoadingMemberRoles || isLoadingUserPermissions;
  const hasError = !!rolesError || !!memberRolesError || !!userPermissionsError;

  const createRoleMutation = useMutation({
    mutationFn: async (payload: CreateChatRoomRole) => {
      if (!chatRoomId) {
        if (import.meta.env.DEV) console.error("chatRoomId is required");
        throw new Error("chatRoomId is required");
      }
      await agent.post(`/chatrooms/role?chatRoomId=${chatRoomId}`, {
        chatRoomId,
        ...payload,
      });
    },
    onMutate: async (payload) => {
      if (!chatRoomId) return {};
      await queryClient.cancelQueries({queryKey: rolesKey(chatRoomId)});
      const previousRoles = queryClient.getQueryData<ChatRoomRole[]>(
        rolesKey(chatRoomId)
      );
      const nextImportance = (previousRoles ?? []).reduce(
        (max, role) => Math.max(max, role.importance ?? -1),
        -1
      ) + 1;
      const optimisticRole: ChatRoomRole = {
        id: `temp-${Date.now()}-${Math.random().toString(16).slice(2)}`,
        chatRoomId,
        name: payload.name,
        description:
          payload.description === undefined ? null : payload.description,
        color: payload.color,
        isDefault: false,
        importance: nextImportance,
        isDisplayRole: false,
        createdAt: new Date(),
        permissions: [],
      };
      queryClient.setQueryData(rolesKey(chatRoomId), (old?: ChatRoomRole[]) =>
        sortRolesByImportance([...(old ?? []), optimisticRole])
      );
      return {previousRoles, chatRoomId};
    },
    onError: (_error, _payload, context) => {
      if (!context?.chatRoomId) return;
      queryClient.setQueryData(
        rolesKey(context.chatRoomId),
        context.previousRoles ?? undefined
      );
    },
    onSettled: (_data, _error, _variables, context) => {
      const roomId = context?.chatRoomId ?? chatRoomId;
      if (!roomId) return;
      queryClient.invalidateQueries({queryKey: rolesKey(roomId)});
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: async (payload: UpdateChatRoomRole) => {
      if (!chatRoomId) {
        if (import.meta.env.DEV) console.error("chatRoomId is required");
        throw new Error("chatRoomId is required");
      }
      await agent.put(`/chatrooms/role?chatRoomId=${chatRoomId}`, payload);
    },
    onMutate: async (payload) => {
      if (!chatRoomId) return {};
      await Promise.all([
        queryClient.cancelQueries({queryKey: rolesKey(chatRoomId)}),
        queryClient.cancelQueries({queryKey: usersRolesKey(chatRoomId)}),
      ]);
      const previousRoles = queryClient.getQueryData<ChatRoomRole[]>(
        rolesKey(chatRoomId)
      );
      const previousUsersRoles = queryClient.getQueryData<
        Map<string, ChatRoomRole[]>
      >(usersRolesKey(chatRoomId));

      if (previousRoles) {
        const updatedRoles = previousRoles.map((role) => {
          if (role.id !== payload.id) return role;
          return {
            ...role,
            name: payload.name ?? role.name,
            description:
              payload.description === undefined
                ? role.description ?? null
                : payload.description,
            color: payload.color ?? role.color,
          };
        });
        queryClient.setQueryData(
          rolesKey(chatRoomId),
          sortRolesByImportance(updatedRoles)
        );
      }

      if (previousUsersRoles) {
        const updatedUsersRoles = new Map(previousUsersRoles);
        updatedUsersRoles.forEach((list, key) => {
          const mapped = list.map((role) => {
            if (role.id !== payload.id) return role;
            return {
              ...role,
              name: payload.name ?? role.name,
              description:
                payload.description === undefined
                  ? role.description ?? null
                  : payload.description,
              color: payload.color ?? role.color,
            };
          });
          updatedUsersRoles.set(key, sortMemberRoles(mapped));
        });
        queryClient.setQueryData(
          usersRolesKey(chatRoomId),
          updatedUsersRoles
        );
      }

      return {previousRoles, previousUsersRoles, chatRoomId};
    },
    onError: (_error, _payload, context) => {
      if (!context?.chatRoomId) return;
      queryClient.setQueryData(
        rolesKey(context.chatRoomId),
        context.previousRoles ?? undefined
      );
      queryClient.setQueryData(
        usersRolesKey(context.chatRoomId),
        context.previousUsersRoles ?? undefined
      );
    },
    onSettled: (_data, _error, _variables, context) => {
      const roomId = context?.chatRoomId ?? chatRoomId;
      if (!roomId) return;
      queryClient.invalidateQueries({queryKey: rolesKey(roomId)});
      queryClient.invalidateQueries({queryKey: usersRolesKey(roomId)});
      queryClient.invalidateQueries({
        predicate: (query) =>
          Array.isArray(query.queryKey) &&
          query.queryKey[0] === "chatroom-user-permissions" &&
          query.queryKey[1] === roomId,
      });
    },
  });

  const deleteRoleMutation = useMutation({
    mutationFn: async ({id}: DeleteChatRoomRole) => {
      if (!chatRoomId) {
        if (import.meta.env.DEV) console.error("chatRoomId is required");
        throw new Error("chatRoomId is required");
      }
      await agent.delete(
        `/chatrooms/role?roleId=${id}&chatRoomId=${chatRoomId}`
      );
    },
    onMutate: async ({id}) => {
      if (!chatRoomId) return {};
      await Promise.all([
        queryClient.cancelQueries({queryKey: rolesKey(chatRoomId)}),
        queryClient.cancelQueries({queryKey: usersRolesKey(chatRoomId)}),
      ]);
      const previousRoles = queryClient.getQueryData<ChatRoomRole[]>(
        rolesKey(chatRoomId)
      );
      const previousUsersRoles = queryClient.getQueryData<
        Map<string, ChatRoomRole[]>
      >(usersRolesKey(chatRoomId));

      queryClient.setQueryData<ChatRoomRole[]>(rolesKey(chatRoomId), (old?: ChatRoomRole[]) => {
        if (!old) return [];
        return old.filter((role) => role.id !== id);
      });

      if (previousUsersRoles) {
        const nextUsersRoles = new Map(previousUsersRoles);
        nextUsersRoles.forEach((list, key) => {
          const filtered = list.filter((role) => role.id !== id);
          nextUsersRoles.set(key, filtered);
        });
        queryClient.setQueryData(usersRolesKey(chatRoomId), nextUsersRoles);
      }

      return {
        previousRoles,
        previousUsersRoles,
        chatRoomId,
      };
    },
    onError: (_error, _payload, context) => {
      if (!context?.chatRoomId) return;
      queryClient.setQueryData(
        rolesKey(context.chatRoomId),
        context.previousRoles ?? undefined
      );
      queryClient.setQueryData(
        usersRolesKey(context.chatRoomId),
        context.previousUsersRoles ?? undefined
      );
    },
    onSettled: (_data, _error, _variables, context) => {
      const roomId = context?.chatRoomId ?? chatRoomId;
      if (!roomId) return;
      queryClient.invalidateQueries({queryKey: rolesKey(roomId)});
      queryClient.invalidateQueries({queryKey: usersRolesKey(roomId)});
      queryClient.invalidateQueries({
        predicate: (query) =>
          Array.isArray(query.queryKey) &&
          query.queryKey[0] === "chatroom-user-permissions" &&
          query.queryKey[1] === roomId,
      });
    },
  });

  const assignRoleMutation = useMutation({
    mutationFn: async (payload: AssignChatRoomRole) => {
      if (!chatRoomId || !userId) {
        if (import.meta.env.DEV)
          console.error("chatRoomId and userId is required");
        throw new Error("chatRoomId and userId is required");
      }
      await agent.post(`/chatrooms/assign-role?chatRoomId=${chatRoomId}`, {
        ...payload,
        chatRoomId,
        assignedById: userId,
      });
    },
    onMutate: async (payload) => {
      if (!chatRoomId) return {};
      await queryClient.cancelQueries({
        queryKey: usersRolesKey(chatRoomId),
      });

      const previousUsersRoles = queryClient.getQueryData<
        Map<string, ChatRoomRole[]>
      >(usersRolesKey(chatRoomId));
      const rolesSnapshot =
        queryClient.getQueryData<ChatRoomRole[]>(rolesKey(chatRoomId)) ?? [];
      const assignedRole = rolesSnapshot.find((role) => role.id === payload.id);

      const nextUsersRoles = previousUsersRoles
        ? new Map(previousUsersRoles)
        : new Map<string, ChatRoomRole[]>();

      const current = nextUsersRoles.get(payload.userId) ?? [];
      const withoutDuplicate = current.filter((role) => role.id !== payload.id);
      const updatedList = assignedRole
        ? [{...assignedRole, isDisplayRole: false}, ...withoutDuplicate]
        : withoutDuplicate;

      nextUsersRoles.set(payload.userId, sortMemberRoles(updatedList));
      queryClient.setQueryData(usersRolesKey(chatRoomId), nextUsersRoles);

      return {
        previousUsersRoles,
        chatRoomId,
        userId: payload.userId,
      };
    },
    onError: (_error, _payload, context) => {
      if (!context?.chatRoomId) return;
      queryClient.setQueryData(
        usersRolesKey(context.chatRoomId),
        context.previousUsersRoles ?? undefined
      );
    },
    onSettled: (_data, _error, _variables, context) => {
      const roomId = context?.chatRoomId ?? chatRoomId;
      if (!roomId) return;
      queryClient.invalidateQueries({queryKey: usersRolesKey(roomId)});
      if (_variables?.userId) {
        queryClient.invalidateQueries({
          queryKey: userPermsKey(roomId, _variables.userId),
        });
      }
    },
  });

  const unassignRoleMutation = useMutation({
    mutationFn: async (payload: UnassignChatRoomRole) => {
      if (!chatRoomId) {
        if (import.meta.env.DEV) console.error("chatRoomId is required");
        throw new Error("chatRoomId is required");
      }
      await agent.post(`/chatrooms/unassign-role?chatRoomId=${chatRoomId}`, {
        ...payload,
        chatRoomId,
      });
    },
    onMutate: async (payload) => {
      if (!chatRoomId) return {};
      await queryClient.cancelQueries({
        queryKey: usersRolesKey(chatRoomId),
      });

      const previousUsersRoles = queryClient.getQueryData<
        Map<string, ChatRoomRole[]>
      >(usersRolesKey(chatRoomId));

      const nextUsersRoles = previousUsersRoles
        ? new Map(previousUsersRoles)
        : new Map<string, ChatRoomRole[]>();

      const current = nextUsersRoles.get(payload.userId) ?? [];
      nextUsersRoles.set(
        payload.userId,
        sortMemberRoles(current.filter((role) => role.id !== payload.id))
      );

      queryClient.setQueryData(usersRolesKey(chatRoomId), nextUsersRoles);

      return {
        previousUsersRoles,
        chatRoomId,
        userId: payload.userId,
      };
    },
    onError: (_error, _payload, context) => {
      if (!context?.chatRoomId) return;
      queryClient.setQueryData(
        usersRolesKey(context.chatRoomId),
        context.previousUsersRoles ?? undefined
      );
    },
    onSettled: (_data, _error, _variables, context) => {
      const roomId = context?.chatRoomId ?? chatRoomId;
      if (!roomId) return;
      queryClient.invalidateQueries({queryKey: usersRolesKey(roomId)});
      if (_variables?.userId) {
        queryClient.invalidateQueries({
          queryKey: userPermsKey(roomId, _variables.userId),
        });
      }
    },
  });

  const setDisplayRoleMutation = useMutation({
    mutationFn: async (payload: SetMemberDisplayRole) => {
      if (!chatRoomId) {
        if (import.meta.env.DEV) console.error("chatRoomId is required");
        throw new Error("chatRoomId is required");
      }
      await agent.post(`/chatrooms/member-display-role?chatRoomId=${chatRoomId}`, payload);
    },
    onMutate: async (payload) => {
      if (!chatRoomId) return {};
      await queryClient.cancelQueries({queryKey: usersRolesKey(chatRoomId)});

      const previousUsersRoles = queryClient.getQueryData<
        Map<string, ChatRoomRole[]>
      >(usersRolesKey(chatRoomId));

      const nextUsersRoles = previousUsersRoles
        ? new Map(previousUsersRoles)
        : new Map<string, ChatRoomRole[]>();

      const currentRoles = nextUsersRoles.get(payload.userId) ?? [];
      const updatedRoles = currentRoles.map((role) => ({
        ...role,
        isDisplayRole: payload.roleId ? role.id === payload.roleId : false,
      }));
      nextUsersRoles.set(payload.userId, sortMemberRoles(updatedRoles));
      queryClient.setQueryData(usersRolesKey(chatRoomId), nextUsersRoles);

      const chatRoomCache = queryClient.getQueryData<any>([
        "chatRooms",
        chatRoomId,
      ]);
      const slugKey = chatRoomCache?.slug;
      const chatRoomBySlug = slugKey
        ? queryClient.getQueryData<any>(["chatRooms", slugKey])
        : undefined;

      const applyMemberUpdate = (room?: any) => {
        if (!room || !room.members) return room;
        const targetRole = updatedRoles.find((role) => role.isDisplayRole);
        const nextMembers = room.members.map((member: any) =>
          member.id === payload.userId
            ? {
              ...member,
              chatRoomDisplayRoleId: payload.roleId ?? null,
              chatRoomDisplayRoleColor: targetRole?.color ?? null,
            }
            : member
        );
        return {...room, members: nextMembers};
      };

      if (chatRoomCache) {
        queryClient.setQueryData(["chatRooms", chatRoomId], (old: any) =>
          applyMemberUpdate(old)
        );
        if (slugKey) {
          queryClient.setQueryData(["chatRooms", slugKey], (old: any) =>
            applyMemberUpdate(old)
          );
        }
      }

      return {
        previousUsersRoles,
        previousChatRoom: chatRoomCache,
        previousChatRoomBySlug: chatRoomBySlug,
        chatRoomSlug: slugKey,
        chatRoomId,
        userId: payload.userId,
      };
    },
    onError: (_error, _payload, context) => {
      if (!chatRoomId) return;
      if (context?.previousUsersRoles) {
        queryClient.setQueryData(
          usersRolesKey(chatRoomId),
          context.previousUsersRoles
        );
      }
      if (context?.previousChatRoom) {
        queryClient.setQueryData(
          ["chatRooms", chatRoomId],
          context.previousChatRoom
        );
      }
      if (context?.chatRoomSlug && context?.previousChatRoomBySlug) {
        queryClient.setQueryData(
          ["chatRooms", context.chatRoomSlug],
          context.previousChatRoomBySlug
        );
      }
    },
    onSettled: (_data, _error, _variables, context) => {
      const roomId = context?.chatRoomId ?? chatRoomId;
      if (!roomId) return;
      queryClient.invalidateQueries({queryKey: usersRolesKey(roomId)});
      queryClient.invalidateQueries({
        predicate: (query) =>
          query.queryKey[0] === "chatRooms" &&
          (query.queryKey[1] === roomId ||
            (context?.chatRoomSlug && query.queryKey[1] === context.chatRoomSlug)),
      });

    },
  });

  const reorderRolesMutation = useMutation<void, unknown, string[], ReorderRolesContext>({
    mutationFn: async (orderedRoleIds: string[]) => {
      if (!chatRoomId) {
        if (import.meta.env.DEV) console.error("chatRoomId is required");
        throw new Error("chatRoomId is required");
      }
      await agent.post(`/chatrooms/${chatRoomId}/roles/reorder`, {
        chatRoomId,
        orderedRoleIds,
      });
    },
    onMutate: async (orderedRoleIds) => {
      if (!chatRoomId) return {};
      await Promise.all([
        queryClient.cancelQueries({queryKey: rolesKey(chatRoomId)}),
        queryClient.cancelQueries({queryKey: usersRolesKey(chatRoomId)}),
      ]);

      const previousRoles = queryClient.getQueryData<ChatRoomRole[]>(
        rolesKey(chatRoomId)
      );
      const previousUsersRoles = queryClient.getQueryData<
        Map<string, ChatRoomRole[]>
      >(usersRolesKey(chatRoomId));

      const importanceOrder = new Map<string, number>();
      orderedRoleIds.forEach((id, index) => importanceOrder.set(id, index));

      if (previousRoles) {
        let counter = orderedRoleIds.length;
        const updatedRoles = previousRoles.map((role) => {
          if (!importanceOrder.has(role.id)) {
            importanceOrder.set(role.id, counter++);
          }
          return {
            ...role,
            importance: importanceOrder.get(role.id) ?? role.importance,
          };
        });
        queryClient.setQueryData(
          rolesKey(chatRoomId),
          sortRolesByImportance(updatedRoles)
        );
      }

      if (previousUsersRoles && previousUsersRoles.size > 0) {
        const importanceLookup = new Map(importanceOrder);
        if (previousRoles) {
          previousRoles.forEach((role) => {
            if (!importanceLookup.has(role.id)) {
              importanceLookup.set(role.id, role.importance);
            }
          });
        }

        const updatedUsersRoles = new Map(previousUsersRoles);
        updatedUsersRoles.forEach((list, key) => {
          const mapped = list.map((role) => ({
            ...role,
            importance: importanceLookup.get(role.id) ?? role.importance,
          }));
          updatedUsersRoles.set(key, sortMemberRoles(mapped));
        });

        queryClient.setQueryData(
          usersRolesKey(chatRoomId),
          updatedUsersRoles
        );
      }

      return {previousRoles, previousUsersRoles, chatRoomId};
    },
    onError: (_error, _variables, context) => {
      if (!chatRoomId) return;
      if (context?.previousRoles) {
        queryClient.setQueryData(
          rolesKey(chatRoomId),
          context.previousRoles
        );
      }
      if (context?.previousUsersRoles) {
        queryClient.setQueryData(
          usersRolesKey(chatRoomId),
          context.previousUsersRoles
        );
      }
    },
    onSettled: (_data, _error, _variables, _context) => {
      if (!chatRoomId) return;
      queryClient.invalidateQueries({queryKey: rolesKey(chatRoomId)});
      queryClient.invalidateQueries({queryKey: usersRolesKey(chatRoomId)});
    },
  });
  const {mutateAsync: createRoleRaw} = createRoleMutation;
  const {mutateAsync: updateRoleRaw} = updateRoleMutation;
  const {mutateAsync: deleteRoleRaw} = deleteRoleMutation;
  const {mutateAsync: assignRoleRaw} = assignRoleMutation;
  const {mutateAsync: unassignRoleRaw} = unassignRoleMutation;
  const {mutateAsync: setDisplayRoleRaw} = setDisplayRoleMutation;
  const {mutateAsync: reorderRolesRaw} = reorderRolesMutation;

  const createRole = useCallback(
    (payload: CreateChatRoomRole) => createRoleRaw(payload),
    [createRoleRaw]
  );
  const updateRole = useCallback(
    (payload: UpdateChatRoomRole) => updateRoleRaw(payload),
    [updateRoleRaw]
  );
  const deleteRole = useCallback(
    (payload: DeleteChatRoomRole) => deleteRoleRaw(payload),
    [deleteRoleRaw]
  );
  const assignRole = useCallback(
    (payload: AssignChatRoomRole) => assignRoleRaw(payload),
    [assignRoleRaw]
  );
  const unassignRole = useCallback(
    (payload: UnassignChatRoomRole) => unassignRoleRaw(payload),
    [unassignRoleRaw]
  );
  const setDisplayRole = useCallback(
    (payload: SetMemberDisplayRole) => setDisplayRoleRaw(payload),
    [setDisplayRoleRaw]
  );

  const reorderRoles = useCallback(
    (orderedRoleIds: string[]) => reorderRolesRaw(orderedRoleIds),
    [reorderRolesRaw]
  );

  return {
    roles, // always an array via query default
    usersRolesMap,
    userPermissions,
    isLoading,
    hasError,
    isLoadingRoles,
    isLoadingMemberRoles,
    isLoadingUserPermissions,
    createRole,
    updateRole,
    deleteRole,
    assignRole,
    unassignRole,
    setDisplayRole,
    reorderRoles,
  };
}

export const chatRoomRolesQueryKeys = {
  rolesKey,
  usersRolesKey,
  userPermsKey,
};