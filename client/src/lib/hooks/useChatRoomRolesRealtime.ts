import { useEffect, useRef } from "react";
import { useLocalObservable } from "mobx-react-lite";
import {
  HubConnection,
  HubConnectionBuilder,
  HubConnectionState,
} from "@microsoft/signalr";
import { runInAction } from "mobx";
import type { ChatRoomRole } from "../types";
import { ChatRoomRoleSchema } from "../schemas/chatRoomRoleSchema";

export const useChatRoomRolesRealtime = (chatRoomId?: string) => {
  const created = useRef(false);

  const rolesStore = useLocalObservable(() => ({
    roles: [] as ChatRoomRole[],
    hubConnection: null as HubConnection | null,

    createHubConnection(chatRoomId: string) {
      if (!chatRoomId) return;

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
        "LoadChatRoomRoles",
        (retrievedRoles: any[]) => {
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
            this.roles = parsed;
          });
        }
      )

      this.hubConnection.on("RoleCreated", (retrievedRole: any) => {
        runInAction(() => {
          const result = ChatRoomRoleSchema.safeParse(retrievedRole);
          if (!result.success) {
            if (import.meta.env.DEV) {
              console.error("Role validation error (RoleCreated):", result.error, retrievedRole);
            }
            return;
          }
          this.roles.push(result.data);
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
          const role = result.data;
          const idx = this.roles.findIndex((r) => r.id === role.id);
          if (idx !== -1) this.roles[idx] = role;
        });
      });

      this.hubConnection.on("RoleDeleted", (roleId: string) => {
        runInAction(() => {
          this.roles = this.roles.filter((r) => r.id !== roleId);
        });
      });
    },

    async createRole(options: { name: string; color: string; description?: string }) {
      if (!this.hubConnection || this.hubConnection.state !== HubConnectionState.Connected) return;
      try {
        await this.hubConnection.invoke("CreateRole", {
          chatRoomId,
          name: options.name,
          color: options.color,
          description: options.description,
        });
      } catch (error) {
        if (import.meta.env.DEV) {
          console.error("Error creating role:", error);
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
    
    async updateRole(options: { id: string; name?: string; color?: string; description?: string; permissions?: { id: string; isAllowed: boolean }[] }) {
      if (!this.hubConnection || this.hubConnection.state !== HubConnectionState.Connected) return;
      try {
        await this.hubConnection.invoke("UpdateRole", {
          chatRoomId,
          id: options.id,
          name: options.name,
          color: options.color,
          description: options.description,
          permissions: options.permissions,
        });
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
      }
    },
  }));

   useEffect(() => {
    if (chatRoomId && !created.current) {
      rolesStore.createHubConnection(chatRoomId);
      created.current = true;
    }
    return () => {
      rolesStore.stopHubConnection();
    };
  }, [chatRoomId, rolesStore]);

  return {
    roles: rolesStore
  };
};