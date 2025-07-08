import type { ChatRoomRole } from "../types";

export function mapChatRoomRoleFromServer(serverRole: any): ChatRoomRole {
  return {
    id: serverRole.id,
    name: serverRole.name,
    description: serverRole.description,
    color: serverRole.color,
    createdAt: serverRole.createdAt,
    isDefault: serverRole.isDefault,
    chatRoomId: serverRole.chatRoomId,
    permissions: (serverRole.permissions || []).map((serverRolePermission: any) => ({
      roleId: serverRolePermission.roleId,
      isAllowed: serverRolePermission.isAllowed,
      id: serverRolePermission.permission.id,
      name: serverRolePermission.permission.name,
      description: serverRolePermission.permission.description
    })),
  };
}