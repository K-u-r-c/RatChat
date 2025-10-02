import {
  Autocomplete,
  Avatar,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";
import {useCallback, useEffect, useMemo, useRef, useState} from "react";
import {toast} from "react-toastify";
import GroupRemoveIcon from "@mui/icons-material/GroupRemove";
import type {
  AssignChatRoomRole,
  ChatRoomRole,
  ChatRoomRolePermissionFromServer,
  UpdateChatRoomRole,
  UnassignChatRoomRole,
} from "../../../lib/schemas/chatRoomRoleSchema";
import type {Profile} from "../../../lib/types";
import {ChatRoomRolePermissionItem} from "../../../app/shared/components/ChatRoomPermissionItem";

const PERMISSIONS_TAB = 0;
const MEMBERS_TAB = 1;

type Props = {
  open: boolean;
  onClose: () => void;
  role?: ChatRoomRole;
  chatRoomId?: string;
  currentUserId?: string;
  members: Profile[];
  usersRolesMap: Map<string, ChatRoomRole[]>;
  canManageRoles: boolean;
  updateRole?: (payload: UpdateChatRoomRole) => Promise<void>;
  assignRole?: (payload: AssignChatRoomRole) => Promise<void>;
  unassignRole?: (payload: UnassignChatRoomRole) => Promise<void>;
};

const tabA11yProps = (index: number) => ({
  id: `chatroom-role-editor-tab-${index}`,
  "aria-controls": `chatroom-role-editor-panel-${index}`,
});

export default function ChatRoomRoleEditorModal({
  open,
  onClose,
  role,
  chatRoomId,
  currentUserId,
  members,
  usersRolesMap,
  canManageRoles,
  updateRole,
  assignRole,
  unassignRole,
}: Props) {
  const [activeTab, setActiveTab] = useState(PERMISSIONS_TAB);
  const [permissionState, setPermissionState] = useState<ChatRoomRolePermissionFromServer[]>([]);
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const initialMemberIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!open || !role) return;

    setActiveTab(PERMISSIONS_TAB);
    setPermissionState(role.permissions);

    const assignedIds = Array.from(usersRolesMap.entries())
      .filter(([, roles]) => roles.some((r) => r.id === role.id))
      .map(([userId]) => userId);

    initialMemberIdsRef.current = new Set(assignedIds);
    setSelectedMemberIds(assignedIds);
  }, [open, role, usersRolesMap]);

  const handlePermissionChange = useCallback(
    (permissionId: string, isAllowed: boolean) => {
      if (!canManageRoles) return;
      setPermissionState((prev) =>
        prev.map((permission) =>
          permission.permission.id === permissionId
            ? {...permission, isAllowed}
            : permission
        )
      );
    },
    [canManageRoles]
  );

  const handleMemberSelection = useCallback(
    (_event: unknown, value: Profile[]) => {
      if (!canManageRoles) return;
      setSelectedMemberIds(value.map((profile) => profile.id));
    },
    [canManageRoles]
  );

  const handleRemoveMember = useCallback(
    (memberId: string) => {
      if (!canManageRoles) return;
      setSelectedMemberIds((prev) => prev.filter((id) => id !== memberId));
    },
    [canManageRoles]
  );

  const assignedMembers = useMemo(
    () => members.filter((member) => selectedMemberIds.includes(member.id)),
    [members, selectedMemberIds]
  );

  const handleSave = useCallback(async () => {
    if (!role || !canManageRoles) {
      onClose();
      return;
    }

    const permissionPayload = permissionState.map((permission) => ({
      id: permission.permission.id,
      isAllowed: permission.isAllowed,
    }));

    const initialSet = initialMemberIdsRef.current ?? new Set<string>();
    const selectedSet = new Set(selectedMemberIds);

    const toAssign = Array.from(selectedSet).filter((id) => !initialSet.has(id));
    const toUnassign = Array.from(initialSet).filter((id) => !selectedSet.has(id));

    setSaving(true);
    try {
      if (updateRole) {
        const payload: UpdateChatRoomRole = {
          id: role.id,
          permissions: permissionPayload,
        };
        await updateRole(payload);
      }

      const effectiveChatRoomId = chatRoomId ?? role.chatRoomId;

      if (assignRole && effectiveChatRoomId) {
        for (const userId of toAssign) {
          const assignment: AssignChatRoomRole = {
            id: role.id,
            userId,
            chatRoomId: effectiveChatRoomId,
            assignedById: currentUserId,
          };
          await assignRole(assignment);
        }
      }

      if (unassignRole && effectiveChatRoomId) {
        for (const userId of toUnassign) {
          const unassignment: UnassignChatRoomRole = {
            id: role.id,
            userId,
            chatRoomId: effectiveChatRoomId,
          };
          await unassignRole(unassignment);
        }
      }

      toast.success("Role updated");
      onClose();
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error("Failed to update role", error);
      }
      toast.error("Unable to update this role");
    } finally {
      setSaving(false);
    }
  }, [
    assignRole,
    canManageRoles,
    chatRoomId,
    currentUserId,
    onClose,
    permissionState,
    role,
    selectedMemberIds,
    unassignRole,
    updateRole,
  ]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="md"
      aria-labelledby="chatroom-role-editor-title"
    >
      <DialogTitle id="chatroom-role-editor-title">
        {role?.name ?? "Role"}
      </DialogTitle>
      <DialogContent dividers>
        <Stack spacing={3}>
          <Typography variant="body2" color="text.secondary">
            Configure permissions and manage members belonging to this role.
          </Typography>

          <Tabs
            value={activeTab}
            onChange={(_, value) => setActiveTab(value)}
            aria-label="Role editor tabs"
            variant="scrollable"
          >
            <Tab label="Permissions" {...tabA11yProps(PERMISSIONS_TAB)} />
            <Tab label="Members" {...tabA11yProps(MEMBERS_TAB)} />
          </Tabs>

          {activeTab === PERMISSIONS_TAB && (
            <Box
              role="tabpanel"
              id={tabA11yProps(PERMISSIONS_TAB)["aria-controls"]}
              aria-labelledby={tabA11yProps(PERMISSIONS_TAB).id}
            >
              <Stack spacing={2}>
                {permissionState.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    No permissions are defined for this role yet.
                  </Typography>
                ) : (
                  permissionState.map((permission) => (
                    <ChatRoomRolePermissionItem
                      key={permission.permission.id}
                      rolePermission={permission}
                      onChange={handlePermissionChange}
                      isDisabled={!canManageRoles}
                    />
                  ))
                )}
              </Stack>
            </Box>
          )}

          {activeTab === MEMBERS_TAB && (
            <Box
              role="tabpanel"
              id={tabA11yProps(MEMBERS_TAB)["aria-controls"]}
              aria-labelledby={tabA11yProps(MEMBERS_TAB).id}
            >
              <Stack spacing={2}>
                <Autocomplete
                  multiple
                  options={members}
                  value={assignedMembers}
                  onChange={handleMemberSelection}
                  getOptionLabel={(option) => option.displayName ?? option.slug}
                  isOptionEqualToValue={(option, value) => option.id === value.id}
                  disableCloseOnSelect
                  disabled={!canManageRoles}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Members"
                      placeholder="Search members"
                    />
                  )}
                  renderOption={(props, option) => (
                    <li {...props} key={option.id}>
                      <Box sx={{display: "flex", alignItems: "center", gap: 1}}>
                        <Avatar
                          src={option.imageUrl}
                          alt={option.displayName}
                          sx={{width: 32, height: 32}}
                        >
                          {option.displayName?.[0]}
                        </Avatar>
                        <Box>
                          <Typography variant="body2">{option.displayName}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            @{option.slug ?? option.id}
                          </Typography>
                        </Box>
                      </Box>
                    </li>
                  )}
                />

                <Divider />

                <Stack spacing={1.5}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Assigned members
                  </Typography>
                  {assignedMembers.length === 0 ? (
                    <Typography variant="body2" color="text.secondary">
                      No members currently have this role.
                    </Typography>
                  ) : (
                    assignedMembers.map((member) => (
                      <Box
                        key={member.id}
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          px: 1.5,
                          py: 1,
                          borderRadius: 1,
                          bgcolor: "action.hover",
                        }}
                      >
                        <Box sx={{display: "flex", alignItems: "center", gap: 1.5}}>
                          <Avatar
                            src={member.imageUrl}
                            alt={member.displayName}
                            sx={{width: 32, height: 32}}
                          >
                            {member.displayName?.[0]}
                          </Avatar>
                          <Box>
                            <Typography variant="subtitle2">
                              {member.displayName}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              @{member.slug ?? member.id}
                            </Typography>
                          </Box>
                        </Box>
                        <IconButton
                          color="inherit"
                          size="small"
                          onClick={() => handleRemoveMember(member.id)}
                          disabled={!canManageRoles}
                          aria-label={`Remove ${member.displayName}`}
                        >
                          <GroupRemoveIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    ))
                  )}
                </Stack>
              </Stack>
            </Box>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving}>Cancel</Button>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={saving || !canManageRoles}
        >
          {saving ? "Saving..." : "Save"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

