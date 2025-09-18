import { Box, Switch, Typography } from "@mui/material";
import type { ChatRoomPermission } from "../../../lib/types";

// Add onChange prop to notify parent about permission change
interface Props {
  permission: ChatRoomPermission;
  onChange?: (id: string, isAllowed: boolean) => void;
}

export function ChatRoomRolePermissionItem({ permission, onChange }: Props) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 2, py: 0.5 }}>
      <Box sx={{ flex: 1 }}>
        <Typography variant="subtitle2">{permission.name}</Typography>
        <Typography variant="body2" color="text.secondary">
          {permission.description}
        </Typography>
      </Box>
      <Switch
        checked={permission.isAllowed}
        onChange={(e) => onChange?.(permission.id, e.target.checked)}
      />
    </Box>
  );
}
