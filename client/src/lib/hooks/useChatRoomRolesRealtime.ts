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
  type AssignChatRoomRole, 
  type CreateChatRoomRole, 
  type UnassignChatRoomRole, 
  type UpdateChatRoomRole
} from "../schemas/chatRoomRoleSchema";
import { CHATROOM_PERMISSIONS } from "../types/chatroomPermissions";

export const useChatRoomRolesRealtime = (
  chatRoomId?: string, 
  userId?: string,
  isAdmin?: boolean) => {
  const created = useRef(false);

  const rolesStore = useLocalObservable(() => ({
    roles: [] as ChatRoomRole[],
    memberRoles: new Map<string, ChatRoomRole[]>(),
    isAdmin: isAdmin,
    hubConnection: null as HubConnection | null,

    get userPermissions() {
      if (!userId) return {};
      const map: Record<string, boolean> = {};
      if (this.isAdmin) {
        Object.values(CHATROOM_PERMISSIONS).forEach(name => {
          map[name] = true;
        });
        return map;
      }
      const userRoles = this.memberRoles.get(userId) || [];
      const allPermissions = userRoles.flatMap(role => role.permissions);
      const allowedNames = allPermissions.filter(
        p => p.isAllowed).map(p => p.name);

      Object.values(CHATROOM_PERMISSIONS).forEach(name => {
        map[name] = allowedNames.includes(name);
      });
      return map;
    },

    createHubConnection() {
      if (!chatRoomId) return;
      if (!userId) return;

      this.hubConnection = new HubConnectionBuilder()
        .withUrl(
          `${
            import.meta.env.VITE_CHATROOM_ROLES_URL ||
            "https://localhost:5001/chatroom-roles"
          }?chatRoomId=${chatRoomId}`,
          { withCredentials: true }
        )
        .withAutomaticReconnect()
        .build();

      this.hubConnection
        .start()
        .catch((error) => {
          if (import.meta.env.DEV) {
            console.error("Error starting chatroom-roles connection:", error);
          }});

      this.hubConnection.on(
        "LoadChatRoomRoles", (retrievedRoles: any[]) => {
          runInAction(() => {
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
            this.roles = parsed.sort((a, b) => 
              new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
          });
        }
      );

      this.hubConnection.on("RoleCreated", (retrievedRole: any) => {
        runInAction(() => {
          const result = ChatRoomRoleSchema.safeParse(retrievedRole);
          if (!result.success) {
            if (import.meta.env.DEV) {
              console.error("Role validation error (RoleCreated):", result.error, retrievedRole);
            }
            return;
          }
          this.roles = [...this.roles, result.data].sort((a, b) => 
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        });
      });

      this.hubConnection.on("RoleUpdated", (retrievedRole: any) => {
        runInAction(() => {
          const result = ChatRoomRoleSchema.safeParse(retrievedRole);
          if (!result.success) {
            if (import.meta.env.DEV) {
              console.error("Role validation error (RoleUpdated):", result.error, retrievedRole);
            }
            return;
          }
          const updatedRole = result.data;
          this.roles = this.roles.map(r => r.id === updatedRole.id ? updatedRole : r);

          const newMemberRoles = new Map<string, ChatRoomRole[]>();
          for (const [userId, userRoles] of this.memberRoles.entries()) {
            const updatedUserRoles = userRoles.map(role => role.id === updatedRole.id ? updatedRole : role);
            newMemberRoles.set(userId, updatedUserRoles);
          }
          this.memberRoles = newMemberRoles;
        });
      });

      this.hubConnection.on("RoleDeleted", (roleId: string) => {
        runInAction(() => {
          this.roles = this.roles.filter((r) => r.id !== roleId);
          for (const [userId, roleObjs] of this.memberRoles.entries()) {
            const updatedRoles = roleObjs.filter((r) => r.id !== roleId);
            this.memberRoles.set(userId, updatedRoles);
          }
        });
      });

      this.hubConnection.on("UsersRoleLoaded", (data: { [userId: string]: any[] }) => {
        runInAction(() => {
          const newMemberRoles = new Map<string, ChatRoomRole[]>();
          for (const userId in data) {
            const roleIds = data[userId]
              .map(role => {
                const result = ChatRoomRoleSchema.safeParse(role);
                if (!result.success) {
                  if (import.meta.env.DEV) 
                    console.error("Role validation error (UsersRoleLoaded):", result.error, role);
                  return null;
                }
                return result.data.id;
              })
              .filter(Boolean) as string[];

            const roleObjects = roleIds
              .map(id => this.roles.find(r => r.id === id))
              .filter(Boolean) as ChatRoomRole[];
            newMemberRoles.set(userId, roleObjects);
          }
          this.memberRoles = newMemberRoles;
        });
      });

      this.hubConnection.on("RoleAssigned", (retrievedRole: any) => {
        runInAction(() => {
          const result = AssignedChatRoomRoleSchema.safeParse(retrievedRole);
          if (!result.success) {
            if (import.meta.env.DEV)
              console.error("Role validation error (RoleAssigned):", result.error, retrievedRole);
            return;
          }
          const { userId, role } = result.data;
          const roleObj = this.roles.find(r => r.id === role.id);
          if (!roleObj) return;
          const userRoles = this.memberRoles.get(userId) || [];
          const updatedRoles = [...userRoles, roleObj];
          const newMemberRoles = new Map(this.memberRoles);
          newMemberRoles.set(userId, updatedRoles);
          this.memberRoles = newMemberRoles;
        });
      });

      this.hubConnection.on("RoleUnassigned", (retrievedRole: any) => {
        runInAction(() => {
          const result = UnassignedChatRoomRoleSchema.safeParse(retrievedRole);
          if (!result.success) {
            if (import.meta.env.DEV) 
              console.error("Role validation error (RoleUnassigned):", result.error, retrievedRole);
            return;
          }
          const { userId, id: roleId } = result.data;
          const userRoles = this.memberRoles.get(userId) || [];
          const updatedRoles = userRoles.filter(r => r.id !== roleId);
          const newMemberRoles = new Map(this.memberRoles);
          newMemberRoles.set(userId, updatedRoles);
          this.memberRoles = newMemberRoles;
        });
      });
    },

    async createRole(role: CreateChatRoomRole) {
      if (!this.hubConnection || this.hubConnection.state !== HubConnectionState.Connected) return;
      try {
        await this.hubConnection.invoke("CreateRole", {
          ChatRoomId: chatRoomId,
          ...role
        });
      } catch (error) {
        if (import.meta.env.DEV) {
          console.error("Error creating role:", error);
        }
      }
    },

    async assignRole(assignment: AssignChatRoomRole) {
      if (!this.hubConnection || this.hubConnection.state !== HubConnectionState.Connected) return;
      try {
        assignment.chatRoomId = chatRoomId;
        assignment.assignedById = userId;
        await this.hubConnection.invoke("AssignRole", assignment);
      } catch (error) {
        if (import.meta.env.DEV) {
          console.error("Error assigning role:", error);
        }
      }
    },

    async unassignRole(assignment: UnassignChatRoomRole) {
      if (!this.hubConnection || this.hubConnection.state !== HubConnectionState.Connected) return;
      try {
        assignment.chatRoomId = chatRoomId;
        await this.hubConnection.invoke("UnassignRole", assignment);
      } catch (error) {
        if (import.meta.env.DEV) {
          console.error("Error unassigning role:", error);
        }
      }
    },

    async getUserRoles(userId: string) {
      if (!this.hubConnection || this.hubConnection.state !== HubConnectionState.Connected) return [];
      try {
        const userRoles = await this.hubConnection.invoke("GetUserRoles", chatRoomId, userId);
        return userRoles
          .map((role: any) => {
            const result = ChatRoomRoleSchema.safeParse(role);
            if (!result.success) {
              if (import.meta.env.DEV) {
                console.error("Role validation error (getUserRoles):", result.error, role);
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

    async getUserPermissions(userId: string) {
      if (!this.hubConnection || this.hubConnection.state !== HubConnectionState.Connected) return [];
      try {
        const permissions = await this.hubConnection.invoke("GetUserPermissions", chatRoomId, userId);
        return permissions;
      } catch (error) {
        if (import.meta.env.DEV) {
          console.error("Error fetching user permissions:", error);
        }
        return [];
      }
    },
    
    async updateRole(role: UpdateChatRoomRole) {
      if (!this.hubConnection || this.hubConnection.state !== HubConnectionState.Connected) return;
      try {
        await this.hubConnection.invoke("UpdateRole", role);
      } catch (error) {
        if (import.meta.env.DEV) {
          console.error("Error updating role:", error);
        }
      }
    },

    async deleteRole(roleId: string) {
      if (!this.hubConnection || this.hubConnection.state !== HubConnectionState.Connected) return;
      try {
        await this.hubConnection.invoke("DeleteRole", roleId, chatRoomId);
      } catch (error) {
        if (import.meta.env.DEV) {
          console.error("Error deleting role:", error);
        }
      }
    },

    stopHubConnection() {
      if (this.hubConnection?.state === HubConnectionState.Connected) {
        this.hubConnection.stop().catch(() => {});
        this.hubConnection = null;
      }
    },
  }));

  // EFEKT 1: Zarządzanie połączeniem SignalR
  useEffect(() => {
    if (chatRoomId && userId && !created.current) {
      rolesStore.createHubConnection();
      created.current = true;
    }
    return () => {
      rolesStore.stopHubConnection();
      created.current = false;
    };
  }, [chatRoomId, userId, rolesStore]);


  // EFEKT 2: Synchronizacja stanu isAdmin
  useEffect(() => {
    runInAction(() => {
      rolesStore.isAdmin = isAdmin;
    });
  }, [isAdmin, rolesStore]);


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