import {useEffect, useRef} from "react";
import {HubConnection, HubConnectionBuilder, HubConnectionState,} from "@microsoft/signalr";
import {useQueryClient} from "@tanstack/react-query";
import type {ChatRoom} from "../types";
import {useLocalObservable} from "mobx-react-lite";
import type {AssignedChatRoomRole, ChatRoomRole, UnassignedChatRoomRole,} from "../schemas/chatRoomRoleSchema";
import {chatRoomRolesQueryKeys} from "./useChatRoomRoles";
import {hubLogger} from "../util/hubLogger.ts";

export function useChatRoomRolesRealtime(
  chatRoom?: ChatRoom,
  userId?: string
) {
  const created = useRef<boolean>(false);
  const queryClient = useQueryClient();
  const chatRoomRef = useRef<ChatRoom | undefined>(chatRoom);
  const currentUserIdRef = useRef<string | undefined>(userId);

  const chatRoomRolesStore = useLocalObservable(() => ({
    hubConnection: null as HubConnection | null,
    connectedChatRoomId: null as string | null,

    createHubConnection() {
      const chatRoom = chatRoomRef.current;
      if (!chatRoom) return;

      if (
        this.hubConnection &&
        this.hubConnection.state !== HubConnectionState.Disconnected &&
        this.connectedChatRoomId === chatRoom.id
      ) {
        return;
      }

      if (this.hubConnection && this.connectedChatRoomId !== chatRoom.id) {
        this.stopHubConnection();
      }

      this.hubConnection = new HubConnectionBuilder()
        .withUrl(
          `${
            import.meta.env.VITE_CHATROOM_ROLES_URL ||
            "https://localhost:5001/chatroom-roles"
          }?chatRoomId=${chatRoom.id}`,
          {
            withCredentials: true,
          }
        )
        .configureLogging(new hubLogger())
        .withAutomaticReconnect()
        .build();

      this.connectedChatRoomId = chatRoom.id;

      this.hubConnection.start().catch((error) => {
        if (import.meta.env.DEV)
          console.error("Error establishing chatroom-roles connection:", error);
      });

      // ROLE CREATED
      this.hubConnection.on("RoleCreated", (createdRole: ChatRoomRole) => {
        queryClient.setQueryData(
          chatRoomRolesQueryKeys.rolesKey(chatRoom.id),
          (old?: ChatRoomRole[]) => {
            if (!old) return [createdRole];
            // Replace existing if duplicate id exists
            if (old.some((r) => r.name === createdRole.name)) {
              return old.map((r) => (r.name === createdRole.name ? createdRole : r));
            }
            return [createdRole, ...old];
          }
        );

        queryClient.invalidateQueries({
          queryKey: chatRoomRolesQueryKeys.rolesKey(chatRoom.id),
        });
      });

      // ROLE UPDATED
      this.hubConnection.on("RoleUpdated", (updatedRole: ChatRoomRole) => {
        queryClient.setQueryData(
          chatRoomRolesQueryKeys.rolesKey(chatRoom.id),
          (old?: ChatRoomRole[]) =>
            old?.map((role) =>
              role.id === updatedRole.id ? updatedRole : role
            ) ?? old
        );
        queryClient.setQueryData(
          chatRoomRolesQueryKeys.usersRolesKey(chatRoom.id),
          (old: Map<string, ChatRoomRole[]>) => {
            if (!old) return old;
            const newMap = new Map(old);
            for (const [key, roles] of newMap.entries()) {
              newMap.set(
                key,
                roles.map((role) =>
                  role.id === updatedRole.id ? updatedRole : role
                )
              );
            }
            return newMap;
          }
        );


        queryClient.invalidateQueries({
          queryKey: chatRoomRolesQueryKeys.rolesKey(chatRoom.id),
        });
        queryClient.invalidateQueries({
          queryKey: chatRoomRolesQueryKeys.usersRolesKey(chatRoom.id),
        });
        queryClient.invalidateQueries({
          queryKey: chatRoomRolesQueryKeys.userPermsKey(
            chatRoom.id,
            currentUserIdRef.current
          ),
        });
      });

      // ROLE DELETED
      this.hubConnection.on("RoleDeleted", (deletedRoleId: string) => {
        queryClient.setQueryData(
          chatRoomRolesQueryKeys.rolesKey(chatRoom.id),
          (old?: ChatRoomRole[]) => old?.filter((role) => role.id !== deletedRoleId)
        );
        queryClient.setQueryData(
          chatRoomRolesQueryKeys.usersRolesKey(chatRoom.id),
          (old: Map<string, ChatRoomRole[]>) => {
            if (!old) return old;
            const newMap = new Map(old);
            for (const [key, roles] of newMap.entries()) {
              newMap.set(
                key,
                roles.filter((role) => role.id !== deletedRoleId)
              );
            }
            return newMap;
          }
        );


        queryClient.invalidateQueries({
          queryKey: chatRoomRolesQueryKeys.rolesKey(chatRoom.id),
        });
        queryClient.invalidateQueries({
          queryKey: chatRoomRolesQueryKeys.usersRolesKey(chatRoom.id),
        });
        queryClient.invalidateQueries({
          queryKey: chatRoomRolesQueryKeys.userPermsKey(
            chatRoom.id,
            currentUserIdRef.current
          ),
        });
      });

      // ROLE ASSIGNED
      this.hubConnection.on(
        "RoleAssigned",
        (assignedRole: AssignedChatRoomRole) => {
          queryClient.setQueryData(
            chatRoomRolesQueryKeys.usersRolesKey(chatRoom.id),
            (old: Map<string, ChatRoomRole[]>) => {
              if (!old) return old;
              const newMap = new Map(old);
              const existing = newMap.get(assignedRole.userId) ?? [];
              const withoutDuplicate = existing.filter(
                (r) => r.id !== assignedRole.role.id
              );
              newMap.set(assignedRole.userId, [assignedRole.role, ...withoutDuplicate]);
              return newMap;
            }
          );

          queryClient.invalidateQueries({
            queryKey: chatRoomRolesQueryKeys.usersRolesKey(chatRoom.id),
          });
          if (assignedRole.userId === currentUserIdRef.current) {
            queryClient.invalidateQueries({
              queryKey: chatRoomRolesQueryKeys.userPermsKey(
                chatRoom.id,
                assignedRole.userId
              ),
            });
          }
        }
      );

      // ROLE UNASSIGNED
      this.hubConnection.on(
        "RoleUnassigned",
        (unassignedRole: UnassignedChatRoomRole) => {
          queryClient.setQueryData(
            chatRoomRolesQueryKeys.usersRolesKey(chatRoom.id),
            (old: Map<string, ChatRoomRole[]>) => {
              if (!old) return old;
              const newMap = new Map(old);
              const list = newMap.get(unassignedRole.userId) ?? [];
              newMap.set(
                unassignedRole.userId,
                list.filter((role) => role.id !== unassignedRole.id)
              );
              return newMap;
            }
          );

          queryClient.invalidateQueries({
            queryKey: chatRoomRolesQueryKeys.usersRolesKey(chatRoom.id),
          });
          if (unassignedRole.userId === currentUserIdRef.current) {
            queryClient.invalidateQueries({
              queryKey: chatRoomRolesQueryKeys.userPermsKey(
                chatRoom.id,
                unassignedRole.userId
              ),
            });
          }
        }
      );

      // ROLES REORDERED
      this.hubConnection.on("RolesReordered", (reorderedRoles: ChatRoomRole[]) => {
        const sorted = reorderedRoles.slice().sort((a, b) => a.importance - b.importance);

        queryClient.setQueryData(
          chatRoomRolesQueryKeys.rolesKey(chatRoom.id),
          () => sorted
        );

        queryClient.setQueryData(
          chatRoomRolesQueryKeys.usersRolesKey(chatRoom.id),
          (old: Map<string, ChatRoomRole[]>) => {
            if (!old) return old;
            const importanceLookup = new Map(sorted.map((role) => [role.id, role.importance]));
            const updated = new Map<string, ChatRoomRole[]>();
            old.forEach((roles, key) => {
              const mapped = roles.map((role) => ({
                ...role,
                importance: importanceLookup.get(role.id) ?? role.importance,
              }));
              const ordered = mapped
                .slice()
                .sort((a, b) => {
                  if (a.isDisplayRole !== b.isDisplayRole) return a.isDisplayRole ? -1 : 1;
                  const aImportance = importanceLookup.get(a.id) ?? a.importance;
                  const bImportance = importanceLookup.get(b.id) ?? b.importance;
                  if (aImportance !== bImportance) return aImportance - bImportance;
                  return 0;
                });
              updated.set(key, ordered);
            });
            return updated;
          }
        );

        queryClient.invalidateQueries({
          queryKey: chatRoomRolesQueryKeys.rolesKey(chatRoom.id),
        });
        queryClient.invalidateQueries({
          queryKey: chatRoomRolesQueryKeys.usersRolesKey(chatRoom.id),
        });
      });
      // MEMBER DISPLAY ROLE UPDATED
      this.hubConnection.on(
        "MemberDisplayRoleChanged",
        (payload: { userId: string; roleId?: string | null }) => {
          queryClient.setQueryData(
            chatRoomRolesQueryKeys.usersRolesKey(chatRoom.id),
            (old: Map<string, ChatRoomRole[]>) => {
              if (!old) return old;
              const updated = new Map(old);
              const roles = updated.get(payload.userId);
              if (!roles) return updated;
              const nextRoles = roles.map((role) => ({
                ...role,
                isDisplayRole: payload.roleId ? role.id === payload.roleId : false,
              }));
              updated.set(payload.userId, nextRoles);

              const applyMemberUpdate = (room?: any) => {
                if (!room || !room.members) return room;
                const selectedRole = nextRoles.find((role) => role.isDisplayRole);
                const members = room.members.map((member: any) =>
                  member.id === payload.userId
                    ? {
                      ...member,
                      chatRoomDisplayRoleId: payload.roleId ?? null,
                      chatRoomDisplayRoleColor: selectedRole?.color ?? null,
                    }
                    : member
                );
                return {...room, members};
              };

              queryClient.setQueryData(["chatRooms", chatRoom.id], applyMemberUpdate);
              if (chatRoom.slug) {
                queryClient.setQueryData(["chatRooms", chatRoom.slug], applyMemberUpdate);
              }

              return updated;
            }
          );

          queryClient.invalidateQueries({
            queryKey: chatRoomRolesQueryKeys.usersRolesKey(chatRoom.id),
          });
          queryClient.invalidateQueries({
            predicate: (query) =>
              query.queryKey[0] === "chatRooms" &&
              (query.queryKey[1] === chatRoom.id || query.queryKey[1] === chatRoom.slug),
          });
        }
      );
    },

    reset() {
      if (!this.hubConnection) return;

      this.hubConnection.off("RoleCreated");
      this.hubConnection.off("RoleUpdated");
      this.hubConnection.off("RoleDeleted");
      this.hubConnection.off("RoleAssigned");
      this.hubConnection.off("RoleUnassigned");
      this.hubConnection.off("RolesReordered");
      this.hubConnection.off("MemberDisplayRoleChanged");

      this.connectedChatRoomId = null;
      this.hubConnection = null;
    },
    stopHubConnection() {
      if (this.hubConnection?.state === HubConnectionState.Connected) {
        this.hubConnection.stop().catch((error) => {
          if (import.meta.env.DEV)
            console.error("Error stopping chatroom-roles connection:", error);
        });
      }
    },
  }));

  useEffect(() => {
    if (chatRoom && chatRoomRef.current !== chatRoom) {
      chatRoomRef.current = chatRoom;
      chatRoomRolesStore.createHubConnection();
    }
  }, [chatRoom, chatRoomRolesStore]);

  useEffect(() => {
    if (currentUserIdRef.current !== userId) {
      currentUserIdRef.current = userId;
    }
  }, [userId]);

  useEffect(() => {
    return () => {
      chatRoomRolesStore.stopHubConnection();
    };
  }, [chatRoomRolesStore]);

  useEffect(() => {
    if (chatRoom && !created.current) {
      chatRoomRolesStore.createHubConnection();
      created.current = true;
    }

    return () => {
      chatRoomRolesStore.stopHubConnection();
      chatRoomRolesStore.reset();
      created.current = false;
    };
  }, [chatRoom, chatRoomRolesStore]);
}
