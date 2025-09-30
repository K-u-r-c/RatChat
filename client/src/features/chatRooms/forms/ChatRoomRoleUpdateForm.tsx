import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
} from "@mui/material";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import {
  UpdateChatRoomRoleSchema,
  type ChatRoomRole,
  type UpdateChatRoomRole,
} from "../../../lib/schemas/chatRoomRoleSchema";
import { ChatRoomRolePermissionItem } from "../../../app/shared/components/ChatRoomPermissionItem";
import { useChatRoomRoles } from "../../../lib/hooks/useChatRoomRoles";
import { toast } from "react-toastify";

type Props = {
  open: boolean;
  onClose: () => void;
  role: ChatRoomRole;
  chatRoomId?: string;
  currentUserId?: string;
  disableDelete?: boolean;
};

const COLOR_INPUT_STYLE: React.CSSProperties = {
  width: 40,
  height: 40,
  border: "none",
  background: "none",
  padding: 0,
  cursor: "pointer",
};

export default function ChatRoomRoleUpdateForm({
  open,
  onClose,
  role,
  chatRoomId,
  currentUserId,
  disableDelete,
}: Props) {
  const { updateRole, deleteRole } = useChatRoomRoles(
    chatRoomId,
    currentUserId
  );

  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const defaults = useMemo<UpdateChatRoomRole>(
    () => ({
      id: role.id,
      name: role.name,
      color: role.color,
      description: role.description ?? "",
      permissions: role.permissions.map((permission) => ({
        id: permission.permission.id,
        isAllowed: permission.isAllowed,
      })),
    }),
    [role]
  );

  const {
    control,
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: { errors, isDirty },
  } = useForm<UpdateChatRoomRole>({
    mode: "onTouched",
    resolver: zodResolver(UpdateChatRoomRoleSchema),
    defaultValues: defaults,
  });

  useEffect(() => {
    if (!open) return;
    reset(defaults);
  }, [open, defaults, reset]);

  const permissions = watch("permissions") ?? [];
  const colorValue = watch("color");

  const handlePermissionChange = useCallback(
    (permissionId: string, isAllowed: boolean) => {
      setValue(
        "permissions",
        permissions.map((permission) =>
          permission.id === permissionId
            ? { ...permission, isAllowed }
            : permission
        ),
        { shouldDirty: true }
      );
    },
    [permissions, setValue]
  );

  const onSubmit = handleSubmit(async (formValues) => {
    if (!updateRole) return;
    setSubmitting(true);
    try {
      await updateRole(formValues);
      onClose();
      toast.success("Role updated");
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error("Failed to update role", error);
      }
      toast.error("Failed to update role");
    } finally {
      setSubmitting(false);
    }
  });

  const handleDelete = useCallback(async () => {
    if (!deleteRole || disableDelete || role.isDefault) return;
    setDeleting(true);
    try {
      await deleteRole({ id: role.id });
      onClose();
      toast.success("Role deleted");
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error("Failed to delete role", error);
      }
      toast.error("Failed to delete role");
    } finally {
      setDeleting(false);
    }
  }, [deleteRole, disableDelete, role, onClose]);

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Edit role</DialogTitle>
      <form onSubmit={onSubmit} noValidate>
        <DialogContent
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: 2,
            minWidth: 320,
          }}
        >
          <Controller
            name="name"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Name"
                error={Boolean(errors.name)}
                helperText={errors.name?.message}
                fullWidth
                autoFocus
                margin="normal"
              />
            )}
          />
          <Controller
            name="description"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Description"
                error={Boolean(errors.description)}
                helperText={errors.description?.message}
                fullWidth
                multiline
                margin="normal"
              />
            )}
          />
          <Box sx={{ display: "flex", alignItems: "center", gap: 2, mt: 1 }}>
            <Typography variant="subtitle2">Color</Typography>
            <Controller
              name="color"
              control={control}
              render={({ field }) => (
                <input type="color" {...field} style={COLOR_INPUT_STYLE} />
              )}
            />
            <Typography
              variant="body2"
              sx={{ fontFamily: "monospace", color: "text.secondary" }}
            >
              {colorValue}
            </Typography>
            {errors.color && (
              <Typography color="error" variant="body2">
                {errors.color.message}
              </Typography>
            )}
          </Box>

          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Permissions
            </Typography>
            {permissions.map((permission) => {
              const basePermission = role.permissions.find(
                (item) => item.permission.id === permission.id
              );
              if (!basePermission) return null;

              return (
                <ChatRoomRolePermissionItem
                  key={permission.id}
                  rolePermission={{
                    ...basePermission,
                    isAllowed: permission.isAllowed,
                  }}
                  onChange={handlePermissionChange}
                />
              );
            })}
            {permissions.length === 0 && (
              <Typography variant="body2" color="text.secondary">
                This role has no permissions yet.
              </Typography>
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={onClose}>Cancel</Button>
          <Button
            color="error"
            variant="contained"
            onClick={handleDelete}
            disabled={
              disableDelete || role.isDefault || deleting || !deleteRole
            }
          >
            Delete
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={!isDirty || submitting || !updateRole}
          >
            Update
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
