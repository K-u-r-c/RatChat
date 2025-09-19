import { useEffect, useRef } from "react";
import { useLocalObservable } from "mobx-react-lite";
import {
  HubConnection,
  HubConnectionBuilder,
  HubConnectionState,
} from "@microsoft/signalr";
import { runInAction } from "mobx";
import type { ChatRoomRole } from "../types";
import {
  AssignedChatRoomRoleSchema,
  ChatRoomRoleSchema,
  UnassignedChatRoomRoleSchema,
  UserChatRoomPermissionsSchema,
  type AssignChatRoomRole,
  type CreateChatRoomRole,
  type UnassignChatRoomRole,
  type UpdateChatRoomRole,
  type UserChatRoomPermissions,
} from "../schemas/chatRoomRoleSchema";
import { CHATROOM_PERMISSIONS } from "../types/chatroomPermissions";

export const useChatRoomRolesRealtime = (
  chatRoomId?: string,
  userId?: string
) => {
  const chatRoomIdRef = useRef<string | undefined>(chatRoomId);
  const userIdRef = useRef<string | undefined>(userId);

  useEffect(() => {
    chatRoomIdRef.current = chatRoomId;
  }, [chatRoomId]);

  useEffect(() => {
    userIdRef.current = userId;
  }, [userId]);

  const rolesStore = useLocalObservable(() => ({
    roles: [] as ChatRoomRole[],
    memberRoles: new Map<string, ChatRoomRole[]>(),
    userPermissions: {} as Record<string, boolean>,
    hubConnection: null as HubConnection | null,
    currentChatRoomId: null as string | null,
    currentUserId: null as string | null,

    ensureContext(roomId?: string, user?: string) {
      const resolvedRoomId = roomId ?? chatRoomIdRef.current;
      const resolvedUserId = user ?? userIdRef.current;
      if (!resolvedRoomId || !resolvedUserId) {
        return null;
      }
      this.currentChatRoomId = resolvedRoomId;
      this.currentUserId = resolvedUserId;
      return { roomId: resolvedRoomId, userId: resolvedUserId };
    },

    async reloadUserPermissions() {
      const context = this.ensureContext();
      if (!context) return;

      const userPerms = await this.getUserPermissions(context.userId);
      if (userPerms === null) return;

      const map: Record<string, boolean> = {};
      if (userPerms.isOwner) {
        Object.values(CHATROOM_PERMISSIONS).forEach((val) => {
          map[val] = true;
        });
      } else {
        Object.values(CHATROOM_PERMISSIONS).forEach((val) => {
          map[val] = userPerms.permissions.some((p) => p.name === val);
        });
      }

      runInAction(() => {
        this.userPermissions = map;
      });
    },

    createHubConnection(roomIdArg?: string, userIdArg?: string) {
      const context = this.ensureContext(roomIdArg, userIdArg);
      if (!context) return;

      const { roomId } = context;

      if (
        this.hubConnection &&
        this.hubConnection.state === HubConnectionState.Connected
      ) {
        this.hubConnection.stop();
      }

      this.hubConnection = new HubConnectionBuilder()
        .withUrl(
          `${
            import.meta.env.VITE_CHATROOM_ROLES_URL ||
            "https://localhost:5001/chatroom-dupa"
          }?chatRoomId=${roomId}`,
          { withCredentials: true }
        )
        .withAutomaticReconnect()
        .build();

      this.hubConnection
        .start()
        .then(() => {
          this.reloadUserPermissions();
        })
        .catch((error) => {
          if (import.meta.env.DEV) {
            console.error("Error starting chatroom-roles connection:", error);
          }
        });

      this.hubConnection.on("LoadChatRoomRoles", (retrievedRoles: any[]) => {
        const parsed = retrievedRoles
          .map((role: any) => {
            const result = ChatRoomRoleSchema.safeParse(role);
            if (!result.success) {
              if (import.meta.env.DEV) {
                console.error("Role validation error:", result.error, role);
              }
              return null;
            }
            return result.data;
          })
          .filter(Boolean) as ChatRoomRole[];
        runInAction(() => {
          this.roles = parsed.sort(
            (a, b) =>
              new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );
        });
      });

      this.hubConnection.on("RoleCreated", (retrievedRole: any) => {
        const result = ChatRoomRoleSchema.safeParse(retrievedRole);
        if (!result.success) {
          if (import.meta.env.DEV) {
            console.error(
              "Role validation error (RoleCreated):",
              result.error,
              retrievedRole
            );
          }
          return;
        }
        runInAction(() => {
          this.roles = [...this.roles, result.data].sort(
            (a, b) =>
              new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );
        });
      });

      this.hubConnection.on("RoleUpdated", (retrievedRole: any) => {
        const result = ChatRoomRoleSchema.safeParse(retrievedRole);
        if (!result.success) {
          if (import.meta.env.DEV) {
            console.error(
              "Role validation error (RoleUpdated):",
              result.error,
              retrievedRole
            );
          }
          return;
        }
        runInAction(() => {
          this.roles = this.roles
            .map((r) => (r.id === result.data.id ? result.data : r))
            .sort(
              (a, b) =>
                new Date(a.createdAt).getTime() -
                new Date(b.createdAt).getTime()
            );
        });
      });

      this.hubConnection.on("RoleDeleted", (roleId: string) => {
        runInAction(() => {
          this.roles = this.roles.filter((r) => r.id !== roleId);
        });

        runInAction(() => {
          const newMemberRoles = new Map(this.memberRoles);
          newMemberRoles.forEach((roles, userKey) => {
            newMemberRoles.set(
              userKey,
              roles.filter((role) => role.id !== roleId)
            );
          });
          this.memberRoles = newMemberRoles;
        });

        this.reloadUserPermissions();
      });

      this.hubConnection.on("RoleAssigned", (retrievedRole: any) => {
        const result = AssignedChatRoomRoleSchema.safeParse(retrievedRole);
        if (!result.success) {
          if (import.meta.env.DEV)
            console.error(
              "Role validation error (RoleAssigned):",
              result.error,
              retrievedRole
            );
          return;
        }
        const { userId: dataUserId, role } = result.data;
        const roleObj = this.roles.find((r) => r.id === role.id);
        if (!roleObj) return;
        const userRoles = this.memberRoles.get(dataUserId) || [];
        const updatedRoles = [...userRoles, roleObj];
        const newMemberRoles = new Map(this.memberRoles);
        newMemberRoles.set(dataUserId, updatedRoles);

        runInAction(() => {
          this.memberRoles = newMemberRoles;
        });

        if (dataUserId === this.currentUserId) this.reloadUserPermissions();
      });

      this.hubConnection.on("RoleUnassigned", (retrievedRole: any) => {
        const result = UnassignedChatRoomRoleSchema.safeParse(retrievedRole);
        if (!result.success) {
          if (import.meta.env.DEV)
            console.error(
              "Role validation error (RoleUnassigned):",
              result.error,
              retrievedRole
            );
          return;
        }
        const { userId: dataUserId, id: roleId } = result.data;
        const userRoles = this.memberRoles.get(dataUserId) || [];
        const updatedRoles = userRoles.filter((r) => r.id !== roleId);
        const newMemberRoles = new Map(this.memberRoles);
        newMemberRoles.set(dataUserId, updatedRoles);

        runInAction(() => {
          this.memberRoles = newMemberRoles;
        });

        if (dataUserId === this.currentUserId) this.reloadUserPermissions();
      });

      this.hubConnection.on(
        "UsersRoleLoaded",
        (data: { [userId: string]: any[] }) => {
          const newMemberRoles = new Map<string, ChatRoomRole[]>();
          for (const [userKey, roles] of Object.entries(data)) {
            const parsedRoles = roles
              .map((role: any) => {
                const result = ChatRoomRoleSchema.safeParse(role);
                if (!result.success) {
                  if (import.meta.env.DEV) {
                    console.error(
                      "Role validation error (UsersRoleLoaded):",
                      result.error,
                      role
                    );
                  }
                  return null;
                }
                return result.data;
              })
              .filter(Boolean) as ChatRoomRole[];
            newMemberRoles.set(userKey, parsedRoles);
          }

          runInAction(() => {
            this.memberRoles = newMemberRoles;
          });

          if (data[this.currentUserId ?? ""]) this.reloadUserPermissions();
        }
      );

      this.hubConnection.on("RoleDeletedForUser", (payload: any) => {
        const result = UnassignedChatRoomRoleSchema.safeParse(payload);
        if (!result.success) {
          if (import.meta.env.DEV) {
            console.error(
              "Role validation error (RoleDeletedForUser):",
              result.error,
              payload
            );
          }
          return;
        }

        const newMemberRoles = new Map(this.memberRoles);
        newMemberRoles.forEach((roles, userKey) => {
          newMemberRoles.set(
            userKey,
            roles.filter((role) => role.id !== result.data.id)
          );
        });

        runInAction(() => {
          this.memberRoles = newMemberRoles;
        });

        this.reloadUserPermissions();
      });
    },

    async createRole(role: CreateChatRoomRole) {
      if (
        !this.hubConnection ||
        this.hubConnection.state !== HubConnectionState.Connected
      )
        return;
      const context = this.ensureContext();
      if (!context) return;
      try {
        await this.hubConnection.invoke("CreateRole", {
          ChatRoomId: context.roomId,
          ...role,
        });
      } catch (error) {
        if (import.meta.env.DEV) {
          console.error("Error creating role:", error);
        }
      }
    },

    async assignRole(assignment: AssignChatRoomRole) {
      if (
        !this.hubConnection ||
        this.hubConnection.state !== HubConnectionState.Connected
      )
        return;
      const context = this.ensureContext();
      if (!context) return;
      try {
        assignment.chatRoomId = context.roomId;
        assignment.assignedById = context.userId;
        await this.hubConnection.invoke("AssignRole", assignment);
      } catch (error) {
        if (import.meta.env.DEV) {
          console.error("Error assigning role:", error);
        }
      }
    },

    async unassignRole(assignment: UnassignChatRoomRole) {
      if (
        !this.hubConnection ||
        this.hubConnection.state !== HubConnectionState.Connected
      )
        return;
      const context = this.ensureContext();
      if (!context) return;
      try {
        assignment.chatRoomId = context.roomId;
        await this.hubConnection.invoke("UnassignRole", assignment);
      } catch (error) {
        if (import.meta.env.DEV) {
          console.error("Error unassigning role:", error);
        }
      }
    },

    async getUserRoles(targetUserId: string) {
      if (
        !this.hubConnection ||
        this.hubConnection.state !== HubConnectionState.Connected
      )
        return [];
      const context = this.ensureContext();
      if (!context) return [];
      try {
        const userRoles = await this.hubConnection.invoke(
          "GetUserRoles",
          context.roomId,
          targetUserId
        );
        return userRoles
          .map((role: any) => {
            const result = ChatRoomRoleSchema.safeParse(role);
            if (!result.success) {
              if (import.meta.env.DEV) {
                console.error(
                  "Role validation error (getUserRoles):",
                  result.error,
                  role
                );
              }
              return null;
            }
            return result.data;
          })
          .filter(Boolean) as ChatRoomRole[];
      } catch (error) {
        if (import.meta.env.DEV) {
          console.error("Error fetching user roles:", error);
        }
        return [];
      }
    },

    async getUserPermissions(
      targetUserId: string
    ): Promise<UserChatRoomPermissions | null> {
      if (
        !this.hubConnection ||
        this.hubConnection.state !== HubConnectionState.Connected
      )
        return null;
      const context = this.ensureContext();
      if (!context) return null;
      try {
        const permissions = await this.hubConnection.invoke(
          "GetUserPermissions",
          context.roomId,
          targetUserId
        );
        const result = UserChatRoomPermissionsSchema.safeParse(permissions);
        if (!result.success) {
          if (import.meta.env.DEV) {
            console.error(
              "User Permissions validation error (getUserPermissions):",
              result.error,
              permissions
            );
          }
          return null;
        }
        return result.data;
      } catch (error) {
        if (import.meta.env.DEV) {
          console.error("Error fetching user permissions:", error);
        }
        return null;
      }
    },

    async updateRole(role: UpdateChatRoomRole) {
      if (
        !this.hubConnection ||
        this.hubConnection.state !== HubConnectionState.Connected
      )
        return;
      try {
        await this.hubConnection.invoke("UpdateRole", role);
      } catch (error) {
        if (import.meta.env.DEV) {
          console.error("Error updating role:", error);
        }
      }
    },

    async deleteRole(roleId: string) {
      if (
        !this.hubConnection ||
        this.hubConnection.state !== HubConnectionState.Connected
      )
        return;
      const context = this.ensureContext();
      if (!context) return;
      try {
        await this.hubConnection.invoke("DeleteRole", roleId, context.roomId);
      } catch (error) {
        if (import.meta.env.DEV) {
          console.error("Error deleting role:", error);
        }
      }
    },

    stopHubConnection() {
      if (this.hubConnection?.state === HubConnectionState.Connected) {
        this.hubConnection.stop();
      }
      this.hubConnection = null;
      this.currentChatRoomId = null;
    },
  }));

  useEffect(() => {
    const roomId = chatRoomId ?? chatRoomIdRef.current;
    const resolvedUserId = userId ?? userIdRef.current;

    if (!roomId || !resolvedUserId) return;

    rolesStore.createHubConnection(roomId, resolvedUserId);

    return () => {
      rolesStore.stopHubConnection();
    };
  }, [chatRoomId, userId, rolesStore]);

  return {
    rolesStore,
    roles: rolesStore.roles,
    memberRoles: rolesStore.memberRoles,
    userPermissions: rolesStore.userPermissions,
    createRole: rolesStore.createRole,
    assignRole: rolesStore.assignRole,
    unassignRole: rolesStore.unassignRole,
    getUserRoles: rolesStore.getUserRoles,
    getUserPermissions: rolesStore.getUserPermissions,
    updateRole: rolesStore.updateRole,
    deleteRole: rolesStore.deleteRole,
  };
};
