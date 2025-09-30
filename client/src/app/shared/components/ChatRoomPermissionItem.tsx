import {Box, Switch, Typography} from "@mui/material";
import type {ChatRoomRolePermissionFromServer} from "../../../lib/schemas/chatRoomRoleSchema";

// Add onChange prop to notify parent about permission change
interface Props {
  rolePermission: ChatRoomRolePermissionFromServer;
  onChange?: (id: string, isAllowed: boolean) => void;
  isDisabled?: boolean;
}

export function ChatRoomRolePermissionItem(
  {
    rolePermission: permission,
    onChange,
    isDisabled,
  }: Props) {
  return (
    <Box sx={{display: "flex", alignItems: "center", gap: 2, py: 0.5}}>
      <Box sx={{flex: 1}}>
        <Typography variant="subtitle2">
          {permission.permission.name}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {permission.permission.description}
        </Typography>
      </Box>
      <Switch
        checked={permission.isAllowed}
        onChange={(e) => onChange?.(permission.permission.id, e.target.checked)}
        disabled={isDisabled}
      />
    </Box>
  );
}
