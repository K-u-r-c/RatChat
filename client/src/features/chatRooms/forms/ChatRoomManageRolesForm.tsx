import {
  Avatar,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
  TextField,
  MenuItem,
} from "@mui/material";
import type { Profile } from "../../../lib/types";
import { useState, useEffect, useMemo, useCallback } from "react";
import type {
  AssignChatRoomRole,
  UnassignChatRoomRole,
  SetMemberDisplayRole,
} from "../../../lib/schemas/chatRoomRoleSchema";
import { useChatRoomRoles } from "../../../lib/hooks/useChatRoomRoles";
import { CHATROOM_PERMISSIONS } from "../../../lib/types/chatroomPermissions.ts";

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
  const {
    roles,
    usersRolesMap,
    userPermissions,
    assignRole,
    unassignRole,
    setDisplayRole,
  } = useChatRoomRoles(chatRoomId, currentUserId);

  const [localAssignments, setLocalAssignments] = useState<
    Map<string, Set<string>>
  >(new Map());
  const [displayRoleSelections, setDisplayRoleSelections] = useState<
    Map<string, string | null>
  >(new Map());
  const canManageRoles = useMemo(
    () => userPermissions[CHATROOM_PERMISSIONS.ManageChatRoomRoles],
    [userPermissions]
  );

  const orderedRoles = useMemo(
    () => [...roles].sort((a, b) => a.name.localeCompare(b.name)),
    [roles]
  );

  useEffect(() => {
    const initial = new Map<string, Set<string>>();
    const selection = new Map<string, string | null>();
    members.forEach((member) => {
      const assignedRoles = usersRolesMap.get(member.id) || [];
      initial.set(
        member.id,
        new Set(assignedRoles.map((r) => r.id))
      );
      const displayRoleId =
        assignedRoles.find((role) => role.isDisplayRole)?.id ??
        member.chatRoomDisplayRoleId ??
        null;
      selection.set(member.id, displayRoleId);
    });
    setLocalAssignments(initial);
    setDisplayRoleSelections(selection);
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
      const previousDisplayRole =
        (usersRolesMap.get(member.id) || []).find((r) => r.isDisplayRole)?.id ??
        member.chatRoomDisplayRoleId ??
        null;
      const nextDisplayRole = displayRoleSelections.get(member.id) ?? null;
      if ((previousDisplayRole ?? null) !== (nextDisplayRole ?? null)) return true;
    }
    return false;
  }, [members, usersRolesMap, localAssignments, displayRoleSelections]);

  const handleToggle = useCallback(
    (userId: string, roleId: string, checked: boolean) => {
      if (!canManageRoles) return;
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
      if (!checked) {
        setDisplayRoleSelections((prev) => {
          if (prev.get(userId) !== roleId) return prev;
          const next = new Map(prev);
          next.set(userId, null);
          return next;
        });
      }
    },
    [canManageRoles]
  );

  const handleDisplayRoleSelection = useCallback(
    (userId: string, roleId: string | null) => {
      if (!canManageRoles) return;
      setDisplayRoleSelections((prev) => {
        const next = new Map(prev);
        next.set(userId, roleId);
        return next;
      });
    },
    [canManageRoles]
  );

  const handleConfirm = useCallback(async () => {
    if (!canManageRoles) return;
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
      const previousDisplayRoleId =
        (usersRolesMap.get(member.id) || []).find((r) => r.isDisplayRole)?.id ??
        member.chatRoomDisplayRoleId ??
        null;
      const nextDisplayRoleId = displayRoleSelections.get(member.id) ?? null;
      if (previousDisplayRoleId !== nextDisplayRoleId && chatRoomId) {
        const payload: SetMemberDisplayRole = {
          chatRoomId,
          userId: member.id,
          roleId: nextDisplayRoleId,
        };
        await setDisplayRole(payload);
      }
    }
    onClose();
  }, [assignRole, unassignRole, setDisplayRole, chatRoomId, canManageRoles, localAssignments, displayRoleSelections, members, onClose, usersRolesMap]);

  const tableContent = useMemo(() => {
    if (loading) {
      return (
        <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
          <CircularProgress size={28} />
        </Box>
      );
    }

    if (!orderedRoles.length) {
      return (
        <Paper variant="outlined" sx={{ p: 3, textAlign: "center" }}>
          <Typography variant="subtitle1" gutterBottom>
            No roles yet
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Create a role first to start assigning them to members.
          </Typography>
        </Paper>
      );
    }

    return (
      <Stack spacing={2}>
        {!canManageRoles && (
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Typography variant="body2" color="text.secondary">
              You can view current assignments, but only members with the Manage Roles permission can make changes.
            </Typography>
          </Paper>
        )}

        <TableContainer
          component={Paper}
          variant="outlined"
          sx={{ maxHeight: 440 }}
        >
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>Member</TableCell>
                <TableCell sx={{ fontWeight: 600, width: 180 }}>Display Role</TableCell>
                {orderedRoles.map((role) => (
                  <TableCell
                    key={role.id}
                    align="center"
                    sx={{ fontWeight: 600, width: 160 }}
                  >
                    <Tooltip
                      title={role.description ? role.description : `${role.name} role`}
                      placement="top"
                      arrow
                    >
                      <Box
                        sx={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          gap: 0.75,
                        }}
                      >
                        <Box
                          sx={{
                            width: 18,
                            height: 18,
                            borderRadius: "50%",
                            bgcolor: role.color,
                            border: "1px solid rgba(0,0,0,0.12)",
                            boxShadow: "0 0 0 2px rgba(255,255,255,0.6)",
                          }}
                        />
                        <Typography
                          variant="subtitle2"
                          sx={{ fontSize: "0.85rem", color: "text.primary" }}
                        >
                          {role.name}
                        </Typography>
                      </Box>
                    </Tooltip>
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {members.map((member) => {
                const assignedRoles = localAssignments.get(member.id) || new Set();
                return (
                  <TableRow key={member.id} hover>
                    <TableCell sx={{ minWidth: 220 }}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                        <Avatar src={member.imageUrl} alt={member.displayName}>
                          {member.displayName?.slice(0, 1).toUpperCase()}
                        </Avatar>
                        <Box sx={{ minWidth: 0 }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 600 }} noWrap>
                            {member.displayName}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" noWrap>
                            @{member.slug}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell sx={{ width: 180 }}>
                      <TextField
                        select
                        size="small"
                        fullWidth
                        label="Display role"
                        value={displayRoleSelections.get(member.id) ?? ""}
                        onChange={(event) =>
                          handleDisplayRoleSelection(
                            member.id,
                            event.target.value ? event.target.value : null
                          )
                        }
                        disabled={!canManageRoles || assignedRoles.size === 0}
                      >
                        <MenuItem value="">Automatic</MenuItem>
                        {orderedRoles
                          .filter((role) => assignedRoles.has(role.id))
                          .map((role) => (
                            <MenuItem key={role.id} value={role.id}>
                              <Box
                                component="span"
                                sx={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: 1,
                                }}
                              >
                                <Box
                                  sx={{
                                    width: 12,
                                    height: 12,
                                    borderRadius: "50%",
                                    bgcolor: role.color,
                                    border: "1px solid rgba(0,0,0,0.24)",
                                  }}
                                />
                                {role.name}
                              </Box>
                            </MenuItem>
                          ))}
                      </TextField>
                    </TableCell>
                    {orderedRoles.map((role) => (

                      <TableCell key={`${member.id}-${role.id}`} align="center">
                        <Checkbox
                          checked={assignedRoles.has(role.id)}
                          disabled={loading || !canManageRoles}
                          onChange={(event) =>
                            handleToggle(member.id, role.id, event.target.checked)
                          }
                          color="primary"
                          inputProps={{ "aria-label": `${role.name} for ${member.displayName}` }}
                        />
                      </TableCell>
                    ))}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </Stack>
    );
  }, [loading, orderedRoles, canManageRoles, members, localAssignments, handleToggle]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>Manage Roles</DialogTitle>
      <DialogContent dividers sx={{ pt: 2 }}>
        <Stack spacing={2}>
          <Typography variant="body2" color="text.secondary">
            Toggle the checkboxes to assign or remove roles. Changes are saved once you confirm.
          </Typography>
          {tableContent}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2.5 }}>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          onClick={handleConfirm}
          variant="contained"
          color="primary"
          disabled={loading || !isDirty || !canManageRoles}
        >
          Confirm changes
        </Button>
      </DialogActions>
    </Dialog>
  );
}
