import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Checkbox,
} from "@mui/material";
import type { Profile } from "../../../lib/types";
import { useState, useEffect, useMemo, useCallback } from "react";
import type {
  AssignChatRoomRole,
  UnassignChatRoomRole,
} from "../../../lib/schemas/chatRoomRoleSchema";
import { useChatRoomRoles } from "../../../lib/hooks/useChatRoomRoles";
import {CHATROOM_PERMISSIONS} from "../../../lib/types/chatroomPermissions.ts";

type Props = {
  open: boolean;
  onClose: () => void;
  chatRoomId?: string;
  currentUserId?: string;
  members: Profile[];
  loading?: boolean;
};

export default function ChatRoomManageRolesForm({
  open,
  onClose,
  chatRoomId,
  currentUserId,
  members,
  loading,
}: Props) {
  const { roles, usersRolesMap, userPermissions, assignRole, unassignRole } = useChatRoomRoles(
    chatRoomId,
    currentUserId
  );
  // Local state for role assignments
  const [localAssignments, setLocalAssignments] = useState<
    Map<string, Set<string>>
  >(new Map());
  const canManageRoles = useMemo(() => userPermissions[CHATROOM_PERMISSIONS.ManageChatRoomRoles], [userPermissions]);

  // Stable, memoized ordering of roles (alphabetical) so table columns don't jump
  const orderedRoles = useMemo(() => {
    return [...roles].sort((a, b) => a.name.localeCompare(b.name));
  }, [roles]);

  useEffect(() => {
    const initial = new Map<string, Set<string>>();
    members.forEach((member) => {
      initial.set(
        member.id,
        new Set((usersRolesMap.get(member.id) || []).map((r) => r.id))
      );
    });
    setLocalAssignments(initial);
  }, [open, members, usersRolesMap, roles]);

  const isDirty = useMemo(() => {
    for (const member of members) {
      const prevRoles = new Set(
        (usersRolesMap.get(member.id) || []).map((r) => r.id)
      );
      const newRoles = localAssignments.get(member.id) || new Set();
      if (prevRoles.size !== newRoles.size) return true;
      for (const roleId of prevRoles) {
        if (!newRoles.has(roleId)) return true;
      }
      for (const roleId of newRoles) {
        if (!prevRoles.has(roleId)) return true;
      }
    }
    return false;
  }, [members, usersRolesMap, localAssignments]);

  const handleToggle = useCallback(
    (userId: string, roleId: string, checked: boolean) => {
      if (!canManageRoles) return; // gate interaction
      setLocalAssignments((prev) => {
        const updated = new Map(prev);
        const userRoles = new Set(updated.get(userId) || []);
        if (checked) {
          userRoles.add(roleId);
        } else {
          userRoles.delete(roleId);
        }
        updated.set(userId, userRoles);
        return updated;
      });
    },
    [canManageRoles]
  );

  const handleConfirm = useCallback(async () => {
    if (!canManageRoles) return; // gate
    for (const member of members) {
      const prevRoles = new Set(
        (usersRolesMap.get(member.id) || []).map((r) => r.id)
      );
      const newRoles = localAssignments.get(member.id) || new Set();

      for (const roleId of newRoles) {
        if (!prevRoles.has(roleId)) {
          const assignment: AssignChatRoomRole = {
            id: roleId,
            userId: member.id,
          };
          await assignRole(assignment);
        }
      }
      for (const roleId of prevRoles) {
        if (!newRoles.has(roleId)) {
          const unassignment: UnassignChatRoomRole = {
            id: roleId,
            userId: member.id,
          };
          await unassignRole(unassignment);
        }
      }
    }
    onClose();
  }, [assignRole, unassignRole, canManageRoles, localAssignments, members, onClose, usersRolesMap]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>Manage Roles</DialogTitle>
      <DialogContent>
        <Box sx={{ overflowX: "auto" }}>
          {!orderedRoles || orderedRoles.length === 0 ? (
            <Typography color="text.secondary" sx={{ p: 2 }}>
              No roles available.
            </Typography>
          ) : !canManageRoles ? (
            <Typography color="text.secondary" sx={{ p: 2 }}>
              You don't have permission to manage roles in this chat room.
            </Typography>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={{ textAlign: "left", padding: 8 }}>User</th>
                  {orderedRoles.map((role) => (
                    <th
                      key={role.id}
                      style={{
                        padding: 8,
                        background: role.color,
                        color: "#fff",
                      }}
                    >
                      {role.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {members.map((member) => (
                  <tr key={member.id}>
                    <td style={{ padding: 8 }}>
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        <img
                          src={member.imageUrl}
                          alt={member.displayName}
                          width={32}
                          height={32}
                          style={{ borderRadius: "50%" }}
                        />
                      </Box>
                    </td>
                    {orderedRoles.map((role) => {
                      const checked =
                        localAssignments.get(member.id)?.has(role.id) ?? false;
                      return (
                        <td
                          key={role.id}
                          style={{ textAlign: "center", padding: 8 }}
                        >
                          <Checkbox
                            checked={checked}
                            disabled={loading || !canManageRoles}
                            onChange={(e) =>
                              handleToggle(member.id, role.id, e.target.checked)
                            }
                            color="primary"
                          />
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
        <Button
          onClick={handleConfirm}
          variant="contained"
            color="primary"
            disabled={loading || !isDirty || !canManageRoles}
        >
          Confirm
        </Button>
      </DialogActions>
    </Dialog>
  );
}
