import { useEffect } from "react";
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Box, Typography } from "@mui/material";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, Controller } from "react-hook-form";
import { UpdateChatRoomRoleSchema } from "../../../lib/schemas/chatRoomRoleSchema";
import type { UpdateChatRoomRole } from "../../../lib/schemas/chatRoomRoleSchema";
import type { ChatRoomRole } from "../../../lib/types";
import { ChatRoomRolePermissionItem } from "../../../app/shared/components/ChatRoomPermissionItem";

type Props = {
  open: boolean;
  onClose: () => void;
  role: ChatRoomRole;
  onSubmit: (data: UpdateChatRoomRole) => Promise<void>;
  onDelete?: () => Promise<void>;
  loading?: boolean;
  disableDelete?: boolean;
};

export default function ChatRoomRoleUpdateForm({ open, onClose, role, onSubmit, onDelete, loading, disableDelete }: Props) {
  const { control, handleSubmit, watch, setValue, reset, formState: { errors, isDirty } } = useForm<UpdateChatRoomRole>({
    resolver: zodResolver(UpdateChatRoomRoleSchema),
    defaultValues: {
      id: role.id,
      name: role.name,
      color: role.color,
      description: role.description ?? "",
      permissions: role.permissions?.map(p => ({ id: p.id, isAllowed: p.isAllowed })) ?? [],
    },
  });

  useEffect(() => {
    reset({
      id: role.id,
      name: role.name,
      color: role.color,
      description: role.description ?? "",
      permissions: role.permissions?.map(p => ({ id: p.id, isAllowed: p.isAllowed })) ?? [],
    });
  }, [role, open, reset]);

  const permissions = watch("permissions") || [];

  const handlePermissionChange = (id: string, isAllowed: boolean) => {
    setValue(
      "permissions",
      permissions.map((perm) => perm.id === id ? { ...perm, isAllowed } : perm),
      { shouldDirty: true }
    );
  };

  const handleDelete = async () => {
    if (onDelete) await onDelete();
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Edit Role</DialogTitle>
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 320 }}>
          <Controller
            name="name"
            control={control}
            render={({ field }) => (
              <TextField
                label="Name"
                {...field}
                error={!!errors.name}
                helperText={errors.name?.message}
                fullWidth
                sx={{ mt: 2 }}
              />
            )}
          />
          <Controller
            name="description"
            control={control}
            render={({ field }) => (
              <TextField
                label="Description"
                {...field}
                error={!!errors.description}
                helperText={errors.description?.message}
                fullWidth
                multiline
              />
            )}
          />
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <span>Color:</span>
            <Controller
              name="color"
              control={control}
              render={({ field }) => (
                <input
                  type="color"
                  {...field}
                  style={{ width: 40, height: 40, border: "none", background: "none", padding: 0 }}
                />
              )}
            />
            <span style={{ fontFamily: "monospace" }}>{watch("color")}</span>
            {errors.color && <Typography color="error">{errors.color.message}</Typography>}
          </Box>
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Permissions
            </Typography>
            {permissions?.map((perm) => (
              <ChatRoomRolePermissionItem
                key={perm.id}
                permission={{ ...role.permissions.find(p => p.id === perm.id)!, ...perm }}
                onChange={handlePermissionChange}
              />
            ))}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          {onDelete && (
            <Button
              onClick={handleDelete}
              color="error"
              variant="contained"
              disabled={disableDelete}
            >
              Delete
            </Button>
          )}
          <Button
            type="submit"
            variant="contained"
            disabled={!isDirty || loading}
          >
            Update
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
