import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {restrictToVerticalAxis} from "@dnd-kit/modifiers";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import {CSS} from "@dnd-kit/utilities";
import AddIcon from "@mui/icons-material/Add";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import EditIcon from "@mui/icons-material/Edit";
import GroupIcon from "@mui/icons-material/Group";
import SearchIcon from "@mui/icons-material/Search";
import {
  Avatar,
  Box,
  Button,
  Chip,
  IconButton,
  InputAdornment,
  Paper,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import type {CSSProperties} from "react";
import {useCallback, useMemo, useState} from "react";
import {toast} from "react-toastify";
import {useAccount} from "../../../lib/hooks/useAccount";
import {useChatRoomRoles} from "../../../lib/hooks/useChatRoomRoles";
import {useChatRooms} from "../../../lib/hooks/useChatRooms";
import type {ChatRoomRole, CreateChatRoomRole} from "../../../lib/schemas/chatRoomRoleSchema";
import {CHATROOM_PERMISSIONS} from "../../../lib/types/chatroomPermissions.ts";
import ChatRoomRoleEditorModal from "../forms/ChatRoomRoleEditorModal";
import ChatRoomRoleForm from "../forms/ChatRoomRoleForm";

const ensureReadableColor = (hex?: string) => {
  const fallback = "#5865F2";
  if (!hex) return fallback;
  const normalized = hex.replace("#", "");
  if (normalized.length !== 6) return `#${normalized}`;
  const r = parseInt(normalized.slice(0, 2), 16) / 255;
  const g = parseInt(normalized.slice(2, 4), 16) / 255;
  const b = parseInt(normalized.slice(4, 6), 16) / 255;
  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return luminance > 0.75 ? fallback : `#${normalized}`;
};

type Props = { chatRoomId: string };

export default function ChatRoomSettingsRoles({chatRoomId}: Props) {
  const {currentUser} = useAccount();
  const {chatRoom, isLoadingChatRoom} = useChatRooms(chatRoomId);
  const [searchValue, setSearchValue] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [editingRoleId, setEditingRoleId] = useState<string | null>(null);

  const {
    roles,
    usersRolesMap,
    userPermissions,
    createRole,
    updateRole,
    deleteRole,
    assignRole,
    unassignRole,
    isLoading,
    reorderRoles,
  } = useChatRoomRoles(chatRoom?.id, currentUser?.id);

  const canManageRoles = userPermissions[CHATROOM_PERMISSIONS.ManageChatRoomRoles];

  const memberCounts = useMemo(() => {
    const counts = new Map<string, number>();
    usersRolesMap.forEach((roleList) => {
      roleList.forEach((role) => {
        counts.set(role.id, (counts.get(role.id) ?? 0) + 1);
      });
    });
    return counts;
  }, [usersRolesMap]);

  const filteredRoles = useMemo(() => {
    const query = searchValue.trim().toLowerCase();
    if (!query) return roles;
    return roles.filter((role) =>
      role.name.toLowerCase().includes(query) ||
      (role.description ?? "").toLowerCase().includes(query)
    );
  }, [roles, searchValue]);

  const editingRole = useMemo(
    () => roles.find((role) => role.id === editingRoleId),
    [roles, editingRoleId]
  );

  const handleDelete = async (roleId: string) => {
    if (!deleteRole) return;
    const role = roles.find((item) => item.id === roleId);
    if (!role) return;
    if (role.isDefault) {
      toast.info("Default roles cannot be deleted");
      return;
    }

    const confirmed = window.confirm(`Delete the role "${role.name}"?`);
    if (!confirmed) return;

    try {
      await deleteRole({id: roleId});
      toast.success("Role deleted");
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error("Failed to delete role", error);
      }
      toast.error("Unable to delete this role");
    }
  };

  const handleCreateRole = async (payload: CreateChatRoomRole) => {
    if (!createRole) return;
    try {
      await createRole(payload);
      toast.success("Role created");
      setCreateOpen(false);
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error("Failed to create role", error);
      }
      toast.error("Unable to create role");
    }
  };

  const sensors = useSensors(
    useSensor(PointerSensor, {activationConstraint: {distance: 6}}),
    useSensor(KeyboardSensor, {coordinateGetter: sortableKeyboardCoordinates})
  );

  const isFiltering = searchValue.trim().length > 0;
  const isReorderEnabled = Boolean(
    chatRoom?.isOwner &&
    !isFiltering &&
    filteredRoles.length === roles.length &&
    roles.length > 1 &&
    reorderRoles
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      if (!isReorderEnabled) return;
      const {active, over} = event;
      if (!over || active.id === over.id) return;
      const activeId = String(active.id);
      const overId = String(over.id);
      const order = roles.map((role) => role.id);
      const oldIndex = order.indexOf(activeId);
      const newIndex = order.indexOf(overId);
      if (oldIndex === -1 || newIndex === -1) return;
      const newOrderIds = arrayMove(order, oldIndex, newIndex);
      reorderRoles(newOrderIds).catch((error) => {
        if (import.meta.env.DEV) {
          console.error("Failed to reorder roles", error);
        }
        toast.error("Unable to reorder roles right now");
      });
    },
    [isReorderEnabled, roles, reorderRoles]
  );

  return (
    <Stack gap={3} sx={{height: "100%"}}>
      <Stack
        direction={{xs: "column", sm: "row"}}
        spacing={2}
        alignItems={{xs: "stretch", sm: "center"}}
      >
        <TextField
          value={searchValue}
          onChange={(event) => setSearchValue(event.target.value)}
          placeholder="Search roles"
          fullWidth
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small"/>
              </InputAdornment>
            ),
          }}
        />
        <Button
          variant="contained"
          startIcon={<AddIcon/>}
          onClick={() => setCreateOpen(true)}
          disabled={!canManageRoles}
        >
          Create Role
        </Button>
      </Stack>

      <Typography variant="body2" color="text.secondary">
        Members show the colour of their selected display role, or their highest role if none is chosen.
      </Typography>

      <Paper variant="outlined" sx={{p: 2, bgcolor: "background.paper", flex: 1, overflow: "auto"}}>
        <Stack spacing={1.5}>
          <Typography variant="subtitle2" color="text.secondary">
            Roles: {filteredRoles.length}
          </Typography>

          {isLoading || isLoadingChatRoom ? (
            <Typography variant="body2" color="text.secondary">
              Loading roles...
            </Typography>
          ) : filteredRoles.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              No roles match your search.
            </Typography>
          ) : (
            <>
              {chatRoom?.isOwner && isFiltering && (
                <Typography variant="caption" color="text.secondary">
                  Clear the search to reorder roles.
                </Typography>
              )}
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                modifiers={[restrictToVerticalAxis]}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={filteredRoles.map((role) => role.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {filteredRoles.map((role) => (
                    <SortableRoleRow
                      key={role.id}
                      role={role}
                      memberCount={memberCounts.get(role.id) ?? 0}
                      canManageRoles={canManageRoles}
                      canReorder={isReorderEnabled}
                      onEdit={() => setEditingRoleId(role.id)}
                      onDelete={() => handleDelete(role.id)}
                    />
                  ))}
                </SortableContext>
              </DndContext>
            </>
          )}
        </Stack>
      </Paper>

      <ChatRoomRoleForm
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSubmit={async (values) => {
          await handleCreateRole(values);
        }}
      />

      <ChatRoomRoleEditorModal
        open={Boolean(editingRole)}
        onClose={() => setEditingRoleId(null)}
        role={editingRole}
        chatRoomId={chatRoom?.id}
        currentUserId={currentUser?.id}
        members={chatRoom?.members ?? []}
        usersRolesMap={usersRolesMap}
        canManageRoles={canManageRoles}
        updateRole={updateRole}
        assignRole={assignRole}
        unassignRole={unassignRole}
      />
    </Stack>
  );
}


type SortableRoleRowProps = {
  role: ChatRoomRole;
  memberCount: number;
  canManageRoles: boolean;
  canReorder: boolean;
  onEdit: () => void;
  onDelete: () => void;
};

function SortableRoleRow(
  {
    role,
    memberCount,
    canManageRoles,
    canReorder,
    onEdit,
    onDelete,
  }: SortableRoleRowProps) {
  const {attributes, listeners, setNodeRef, transform, transition, isDragging} = useSortable({
    id: role.id,
    disabled: !canReorder,
  });

  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  };

  const color = ensureReadableColor(role.color);
  const dragHandleProps = canReorder
    ? ({...listeners, ...attributes} as Record<string, unknown>)
    : undefined;
  const deleteDisabled = role.isDefault || !canManageRoles;

  return (
    <Box ref={setNodeRef} style={style}>
      <Paper
        variant="outlined"
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          px: 2,
          py: 1.5,
          bgcolor: "background.default",
          borderColor: "divider",
        }}
      >
        <Stack direction="row" spacing={1.5} alignItems="center" sx={{flex: 1, minWidth: 0}}>
          <Tooltip
            title={canReorder ? "Drag to reorder" : "Only administrators can reorder roles"}
            disableHoverListener={!canReorder}
          >
            <span>
              <IconButton
                {...(dragHandleProps ?? {})}
                size="small"
                tabIndex={canReorder ? 0 : -1}
                disabled={!canReorder}
                aria-label={canReorder ? `Reorder ${role.name}` : undefined}
                sx={{
                  cursor: canReorder ? "grab" : "default",
                  color: canReorder ? "text.secondary" : "text.disabled",
                }}
              >
                <DragIndicatorIcon fontSize="small"/>
              </IconButton>
            </span>
          </Tooltip>
          <Avatar
            sx={{
              bgcolor: color,
              color: "#fff",
              width: 36,
              height: 36,
              fontSize: "0.9rem",
              textTransform: "uppercase",
            }}
          >
            {role.name.slice(0, 1)}
          </Avatar>
          <Box sx={{minWidth: 0, flex: 1}}>
            <Typography variant="subtitle1" noWrap>
              {role.name}
            </Typography>
            <Stack direction="row" spacing={1} alignItems="center" sx={{color: "text.secondary"}}>
              <GroupIcon fontSize="small"/>
              <Typography variant="caption">
                {memberCount} {memberCount === 1 ? "member" : "members"}
              </Typography>
              {role.isDefault && <Chip label="Default" size="small"/>}
            </Stack>
          </Box>
        </Stack>
        <Stack direction="row" spacing={1} alignItems="center">
          <Tooltip title={canManageRoles ? "Edit role" : "You cannot manage roles"}>
            <span>
              <IconButton
                onClick={onEdit}
                disabled={!canManageRoles}
                aria-label={`Edit ${role.name}`}
                size="small"
              >
                <EditIcon fontSize="small"/>
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip
            title={role.isDefault ? "Default roles cannot be deleted" : "Delete role"}
          >
            <span>
              <IconButton
                onClick={onDelete}
                disabled={deleteDisabled}
                aria-label={`Delete ${role.name}`}
                size="small"
              >
                <DeleteOutlineIcon fontSize="small"/>
              </IconButton>
            </span>
          </Tooltip>
        </Stack>
      </Paper>
    </Box>
  );
}
