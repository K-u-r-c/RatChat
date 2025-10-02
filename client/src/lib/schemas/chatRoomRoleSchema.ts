import { z } from "zod";

const ChatRoomPermissionSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
});

const ChatRoomRolePermissionSchema = z.object({
  roleId: z.string(),
  isAllowed: z.boolean(),
  permission: ChatRoomPermissionSchema,
});

export const ChatRoomRoleSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable().optional(),
  color: z.string(),
  isDefault: z.boolean(),
  importance: z.number(),
  chatRoomId: z.string(),
  isDisplayRole: z.boolean(),
  createdAt: z.union([z.string(), z.date()]),
  permissions: z.array(ChatRoomRolePermissionSchema),
});

export const CreateChatRoomRoleSchema = z.object({
  name: z.string().max(50, "Role name is too long"),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Pass color in format #xxxxxx"),
  description: z
    .string()
    .max(200, "Description is too long")
    .nullable()
    .optional(),
});

export const UpdateRolePermissionSchema = z.object({
  id: z.string(),
  isAllowed: z.boolean(),
});

export const UpdateChatRoomRoleSchema = z.object({
  id: z.string(),
  name: z.string().max(50, "Role name is too long").optional(),
  description: z
    .string()
    .max(200, "Description is too long")
    .nullable()
    .optional(),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "Pass color in format #xxxxxx")
    .optional(),
  permissions: z.array(UpdateRolePermissionSchema).optional(),
});

export const DeleteChatRoomRoleSchema = z.object({
  id: z.string(),
});

export const AssignChatRoomRoleSchema = z.object({
  id: z.string(),
  userId: z.string(),
  chatRoomId: z.string().optional(),
  assignedById: z.string().optional(),
});

export const UnassignChatRoomRoleSchema = z.object({
  id: z.string(),
  userId: z.string(),
  chatRoomId: z.string().optional(),
});


export const ReorderChatRoomRolesSchema = z.object({
  chatRoomId: z.string(),
  orderedRoleIds: z.array(z.string()).nonempty(),
});

export const SetMemberDisplayRoleSchema = z.object({
  chatRoomId: z.string(),
  userId: z.string(),
  roleId: z.string().nullable().optional(),
});

export const AssignedChatRoomRoleSchema = z.object({
  userId: z.string(),
  role: ChatRoomRoleSchema,
});

export const UnassignedChatRoomRoleSchema = z.object({
  id: z.string(),
  userId: z.string(),
});

export type ChatRoomRole = z.input<typeof ChatRoomRoleSchema>;
export type CreateChatRoomRole = z.infer<typeof CreateChatRoomRoleSchema>;
export type UpdateRolePermission = z.infer<typeof UpdateRolePermissionSchema>;
export type UpdateChatRoomRole = z.infer<typeof UpdateChatRoomRoleSchema>;
export type DeleteChatRoomRole = z.infer<typeof DeleteChatRoomRoleSchema>;
export type AssignChatRoomRole = z.infer<typeof AssignChatRoomRoleSchema>;
export type UnassignChatRoomRole = z.infer<typeof UnassignChatRoomRoleSchema>;
export type ReorderChatRoomRoles = z.infer<typeof ReorderChatRoomRolesSchema>;
export type SetMemberDisplayRole = z.infer<typeof SetMemberDisplayRoleSchema>;
export type AssignedChatRoomRole = z.infer<typeof AssignedChatRoomRoleSchema>;
export type UnassignedChatRoomRole = z.infer<
  typeof UnassignedChatRoomRoleSchema
>;
export type ChatRoomRolePermissionFromServer = z.infer<
  typeof ChatRoomRolePermissionSchema
>;
export type ChatRoomPermission = z.infer<typeof ChatRoomPermissionSchema>;
export type ChatRoomUserPermission = {
  isOwner: boolean;
  permissions: ChatRoomPermission[];
};
