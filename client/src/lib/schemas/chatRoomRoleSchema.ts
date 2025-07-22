import { z } from "zod";

const ChatRoomPermissionFromServerSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
});

const ChatRoomRolePermissionFromServerSchema = z.object({
  roleId: z.string(),
  isAllowed: z.boolean(),
  permission: ChatRoomPermissionFromServerSchema,
});

export const ChatRoomRoleSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable().optional(),
  color: z.string(),
  createdAt: z.string().transform((str) => new Date(str)),
  isDefault: z.boolean(),
  chatRoomId: z.string(),
  permissions: z
    .array(ChatRoomRolePermissionFromServerSchema)
    .transform((arr) => 
      arr.map((val) => ({
        roleId: val.roleId,
        isAllowed: val.isAllowed,
        id: val.permission.id,
        name: val.permission.name,
        description: val.permission.description,
      }))
    ),
});

export const CreateChatRoomRoleSchema = z.object({
  name: z.string().max(50, "Role name is too long"),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Pass color in format #xxxxxx"),
  description: z.string().max(200, "Description is too long").nullable().optional(),
});

export const UpdateRolePermissionSchema = z.object({
  id: z.string(),
  isAllowed: z.boolean(),
});

export const UpdateChatRoomRoleSchema = z.object({
  id: z.string(),
  name: z.string().max(50, "Role name is too long").optional(),
  description: z.string().max(200, "Description is too long").nullable().optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Pass color in format #xxxxxx").optional(),
  permissions: z.array(UpdateRolePermissionSchema).optional(),
});

export const DeleteChatRoomRoleSchema = z.object({
  id: z.string(),
});

export const AssignChatRoomRoleSchema = z.object({
  id: z.string(),
  userId: z.string(),
  chatRoomId: z.string().optional(),
  assignedById: z.string().optional()
})

export const UnassignChatRoomRoleSchema = z.object({
  id: z.string(),
  userId: z.string(),
  chatRoomId: z.string().optional()
})

export const AssignedChatRoomRoleSchema = z.object({
  userId: z.string(),
  role: ChatRoomRoleSchema
})

export const UnassignedChatRoomRoleSchema = z.object({
  id: z.string(),
  userId: z.string()
})

export const UserChatRoomPermissionsSchema = z.object({
  isOwner: z.boolean(),
  permissions: z.array(ChatRoomPermissionFromServerSchema)
});

export type ChatRoomRoleFromServer = z.input<typeof ChatRoomRoleSchema>;
export type CreateChatRoomRole = z.infer<typeof CreateChatRoomRoleSchema>;
export type UpdateRolePermission = z.infer<typeof UpdateRolePermissionSchema>;
export type UpdateChatRoomRole = z.infer<typeof UpdateChatRoomRoleSchema>;
export type DeleteChatRoomRole = z.infer<typeof DeleteChatRoomRoleSchema>;
export type AssignChatRoomRole = z.infer<typeof AssignChatRoomRoleSchema>;
export type UnassignChatRoomRole = z.infer<typeof UnassignChatRoomRoleSchema>;
export type AssignedChatRoomRole = z.infer<typeof AssignedChatRoomRoleSchema>;
export type UnassignedChatRoomRole = z.infer<typeof UnassignedChatRoomRoleSchema>;
export type UserChatRoomPermissions = z.infer<typeof UserChatRoomPermissionsSchema>;