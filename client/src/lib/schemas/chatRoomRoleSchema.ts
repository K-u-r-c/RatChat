import { z } from "zod";

// Schema pojedynczej permisji z backendu (zagnieżdżone "permission")
const ChatRoomPermissionFromServerSchema = z.object({
  roleId: z.string(),
  isAllowed: z.boolean(),
  permission: z.object({
    id: z.string(),
    name: z.string(),
    description: z.string(),
  }),
});

// Spłaszczona permisja (frontend)
export const ChatRoomPermissionSchema = ChatRoomPermissionFromServerSchema.transform((val) => ({
  roleId: val.roleId,
  isAllowed: val.isAllowed,
  id: val.permission.id,
  name: val.permission.name,
  description: val.permission.description,
}));

// Schema roli z backendu
export const ChatRoomRoleSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  color: z.string(),
  createdAt: z.string().transform((str) => new Date(str)).optional(),
  isDefault: z.boolean(),
  chatRoomId: z.string(),
  permissions: z
    .array(ChatRoomPermissionFromServerSchema)
    .transform((arr) => arr.map((val) => ChatRoomPermissionSchema.parse(val))),
});

export type ChatRoomPermissionFromServer = z.input<typeof ChatRoomPermissionSchema>;
export type ChatRoomRoleFromServer = z.input<typeof ChatRoomRoleSchema>;
