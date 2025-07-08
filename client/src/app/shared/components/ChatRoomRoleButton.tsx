import { Box, Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Typography } from "@mui/material";
import { useState } from "react";
import type { ChatRoomRole, ChatRoomPermission } from "../../../lib/types";
import { useChatRoomRolesRealtime } from "../../../lib/hooks/useChatRoomRolesRealtime";
import { ChatRoomRolePermissionItem } from "./ChatRoomPermissionItem";

type Props = {
  role: ChatRoomRole;
};

export function ChatRoomRoleButton({ role }: Props) {
  const { roles } = useChatRoomRolesRealtime(role.chatRoomId);
  const [open, setOpen] = useState(false);

  const [editName, setEditName] = useState(role.name);
  const [editDescription, setEditDescription] = useState(role.description || "");
  const [editColor, setEditColor] = useState(role.color);
  // Add local state for permissions
  const [editPermissions, setEditPermissions] = useState<ChatRoomPermission[]>(role.permissions || []);

  const [changed, setChanged] = useState(false);

  const handleClose = () => {
    setOpen(false);
    setEditName(role.name);
    setEditDescription(role.description || "");
    setEditColor(role.color);
    setEditPermissions(role.permissions || []);
    setChanged(false);
  };

  const handleFieldChange = (field: "name" | "description" | "color", value: string) => {
    if (field === "name") setEditName(value);
    if (field === "description") setEditDescription(value);
    if (field === "color") setEditColor(value);

    setChanged(
      (field === "name" && value !== role.name) ||
      (field === "description" && value !== (role.description || "")) ||
      (field === "color" && value !== (role.color)) ||
      (field !== "name" && editName !== role.name) ||
      (field !== "description" && editDescription !== (role.description || "")) ||
      (field !== "color" && editColor !== (role.color)) ||
      JSON.stringify(editPermissions) !== JSON.stringify(role.permissions)
    );
  };

  // Handle permission change
  const handlePermissionChange = (id: string, isAllowed: boolean) => {
    setEditPermissions((prev) => {
      const updated = prev.map((perm) =>
        perm.id === id ? { ...perm, isAllowed } : perm
      );
      // Check if any permission changed
      setChanged(
        editName !== role.name ||
        editDescription !== (role.description || "") ||
        editColor !== (role.color) ||
        JSON.stringify(updated) !== JSON.stringify(role.permissions)
      );
      return updated;
    });
  };

  const handleUpdate = async () => {
    if (!roles.updateRole) return;
    // Prepare changed permissions (only those that differ)
    const changedPermissions = editPermissions
      .filter((perm, idx) => perm.isAllowed !== (role.permissions[idx]?.isAllowed))
      .map((perm) => ({ id: perm.id, isAllowed: perm.isAllowed }));
    await roles.updateRole({
      id: role.id,
      name: editName !== role.name ? editName : role.name,
      description: editDescription !== (role.description || "") ? editDescription : (role.description || ""),
      color: editColor !== (role.color) ? editColor : (role.color),
      permissions: changedPermissions.length > 0 ? changedPermissions : undefined,
    });
    setChanged(false);
    setOpen(false);
  };

  // Usuwanie roli
  const handleDelete = async () => {
    if (!roles.deleteRole || role.isDefault) return;
    await roles.deleteRole(role.id);
    setOpen(false);
  };

  return (
    <>
      <Box
        component="button"
        onClick={() => setOpen(true)}
        sx={{
          px: 2,
          py: 0.5,
          borderRadius: 2,
          bgcolor: role.color || "grey.300",
          color: "#fff",
          border: "none",
          outline: "none",
          cursor: "pointer",
          opacity: 1,
          transition: "background 0.2s",
          fontWeight: 500,
          fontSize: 14,
          minWidth: 60,
          textAlign: "center",
          userSelect: "none",
          "&:hover": { filter: "brightness(0.9)" },
        }}
        title={role.description}
      >
        {role.name}
      </Box>
      <Dialog open={open} onClose={handleClose}>
        <DialogTitle >Role info</DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 320 }}>
          <TextField
            label="Name"
            value={editName}
            onChange={e => handleFieldChange("name", e.target.value)}
            fullWidth
            sx = {{ mt: 2}}
          />
          <TextField
            label="Description"
            value={editDescription}
            onChange={e => handleFieldChange("description", e.target.value)}
            fullWidth
            multiline
          />
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <span>Color:</span>
            <input
              type="color"
              value={editColor}
              onChange={e => handleFieldChange("color", e.target.value)}
              style={{ width: 40, height: 40, border: "none", background: "none", padding: 0 }}
            />
            <span style={{ fontFamily: "monospace" }}>{editColor}</span>
          </Box>
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Permissions
            </Typography>
            {editPermissions?.map((perm) => (
              <ChatRoomRolePermissionItem key={perm.id} permission={perm} onChange={handlePermissionChange} />
            ))}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button
            onClick={handleDelete}
            color="error"
            variant="contained"
            disabled={role.isDefault}
          >
            Delete
          </Button>
          <Button
            onClick={handleUpdate}
            variant="contained"
            disabled={!changed}
          >
            Update
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}