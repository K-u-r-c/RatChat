import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import agent from "../api/agent";
import { CHATROOM_PERMISSIONS } from "../types/chatroomPermissions";
import type {
  ChatRoomRole,
  ChatRoomUserPermission,
  CreateChatRoomRole,
  UpdateChatRoomRole,
  DeleteChatRoomRole,
  AssignChatRoomRole,
  UnassignChatRoomRole,
} from "../schemas/chatRoomRoleSchema";

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
      return res.data;
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
      return new Map<string, ChatRoomRole[]>(Object.entries(res.data));
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
      await queryClient.cancelQueries({ queryKey: rolesKey(chatRoomId) });
      const previousRoles = queryClient.getQueryData<ChatRoomRole[]>(
        rolesKey(chatRoomId)
      );
      const optimisticRole: ChatRoomRole = {
        id: `temp-${Date.now()}-${Math.random().toString(16).slice(2)}`,
        chatRoomId,
        name: payload.name,
        description:
          payload.description === undefined ? null : payload.description,
        color: payload.color,
        isDefault: false,
        permissions: [],
      };
      queryClient.setQueryData(rolesKey(chatRoomId), (old?: ChatRoomRole[]) => [
        optimisticRole,
        ...(old ?? []),
      ]);
      return { previousRoles, chatRoomId };
    },
    onError: (_error, _payload, context) => {
      if (!context?.chatRoomId) return;
      queryClient.setQueryData(
        rolesKey(context.chatRoomId),
        context.previousRoles ?? undefined
      );
    },
    onSettled: (_data, _error, _payload, context) => {
      const roomId = context?.chatRoomId ?? chatRoomId;
      if (!roomId) return;
      queryClient.invalidateQueries({ queryKey: rolesKey(roomId) });
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
        queryClient.cancelQueries({ queryKey: rolesKey(chatRoomId) }),
        queryClient.cancelQueries({ queryKey: usersRolesKey(chatRoomId) }),
      ]);
      const previousRoles = queryClient.getQueryData<ChatRoomRole[]>(
        rolesKey(chatRoomId)
      );
      const previousUsersRoles = queryClient.getQueryData<
        Map<string, ChatRoomRole[]>
      >(usersRolesKey(chatRoomId));
      let updatedRole: ChatRoomRole | undefined;

      queryClient.setQueryData<ChatRoomRole[]>(rolesKey(chatRoomId), (old?: ChatRoomRole[]) => {
        if (!old) return [];
        return old.map((role) => {
          if (role.id !== payload.id) return role;
          const nextPermissions = payload.permissions
            ? role.permissions.map((perm) => {
                const update = payload.permissions?.find(
                  (p) => p.id === perm.permission.id
                );
                return update ? { ...perm, isAllowed: update.isAllowed } : perm;
              })
            : role.permissions;
          updatedRole = {
            ...role,
            name: payload.name ?? role.name,
            color: payload.color ?? role.color,
            description:
              payload.description !== undefined
                ? payload.description
                : role.description,
            permissions: nextPermissions,
          };
          return updatedRole;
        });
      });

      if (previousUsersRoles && updatedRole) {
        const nextUsersRoles = new Map(previousUsersRoles);
        nextUsersRoles.forEach((list, key) => {
          if (list.some((role) => role.id === updatedRole?.id)) {
            nextUsersRoles.set(
              key,
              list.map((role) =>
                role.id === updatedRole?.id ? updatedRole! : role
              )
            );
          }
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
    onSettled: (_data, _error, _payload, context) => {
      const roomId = context?.chatRoomId ?? chatRoomId;
      if (!roomId) return;
      queryClient.invalidateQueries({ queryKey: rolesKey(roomId) });
      queryClient.invalidateQueries({ queryKey: usersRolesKey(roomId) });
      queryClient.invalidateQueries({
        predicate: (query) =>
          Array.isArray(query.queryKey) &&
          query.queryKey[0] === "chatroom-user-permissions" &&
          query.queryKey[1] === roomId,
      });
    },
  });

  const deleteRoleMutation = useMutation({
    mutationFn: async ({ id }: DeleteChatRoomRole) => {
      if (!chatRoomId) {
        if (import.meta.env.DEV) console.error("chatRoomId is required");
        throw new Error("chatRoomId is required");
      }
      await agent.delete(
        `/chatrooms/role?roleId=${id}&chatRoomId=${chatRoomId}`
      );
    },
    onMutate: async ({ id }) => {
      if (!chatRoomId) return {};
      await Promise.all([
        queryClient.cancelQueries({ queryKey: rolesKey(chatRoomId) }),
        queryClient.cancelQueries({ queryKey: usersRolesKey(chatRoomId) }),
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
    onSettled: (_data, _error, _payload, context) => {
      const roomId = context?.chatRoomId ?? chatRoomId;
      if (!roomId) return;
      queryClient.invalidateQueries({ queryKey: rolesKey(roomId) });
      queryClient.invalidateQueries({ queryKey: usersRolesKey(roomId) });
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
        ? [assignedRole, ...withoutDuplicate]
        : withoutDuplicate;

      nextUsersRoles.set(payload.userId, updatedList);
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
    onSettled: (_data, _error, variables, context) => {
      const roomId = context?.chatRoomId ?? chatRoomId;
      if (!roomId) return;
      queryClient.invalidateQueries({ queryKey: usersRolesKey(roomId) });
      if (variables?.userId) {
        queryClient.invalidateQueries({
          queryKey: userPermsKey(roomId, variables.userId),
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
        current.filter((role) => role.id !== payload.id)
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
    onSettled: (_data, _error, variables, context) => {
      const roomId = context?.chatRoomId ?? chatRoomId;
      if (!roomId) return;
      queryClient.invalidateQueries({ queryKey: usersRolesKey(roomId) });
      if (variables?.userId) {
        queryClient.invalidateQueries({
          queryKey: userPermsKey(roomId, variables.userId),
        });
      }
    },
  });

  const { mutateAsync: createRoleRaw } = createRoleMutation;
  const { mutateAsync: updateRoleRaw } = updateRoleMutation;
  const { mutateAsync: deleteRoleRaw } = deleteRoleMutation;
  const { mutateAsync: assignRoleRaw } = assignRoleMutation;
  const { mutateAsync: unassignRoleRaw } = unassignRoleMutation;

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
  };
}

export const chatRoomRolesQueryKeys = {
  rolesKey,
  usersRolesKey,
  userPermsKey,
};

