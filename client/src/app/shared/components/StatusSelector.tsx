import { useState } from "react";
import {
  Button,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Box,
  Typography,
} from "@mui/material";
import {
  FiberManualRecord,
  Schedule,
  DoNotDisturb,
  VisibilityOff,
} from "@mui/icons-material";
import StatusIndicator from "./StatusIndicator";
import { useAccount } from "../../../lib/hooks/useAccount";
import { useStatus, type UserStatus } from "../../../lib/hooks/useStatus";

const statusOptions: Array<{
  value: UserStatus;
  label: string;
  icon: React.ReactNode;
  color: string;
}> = [
  {
    value: "Online",
    label: "Online",
    icon: <FiberManualRecord />,
    color: "#4CAF50",
  },
  {
    value: "Away",
    label: "Away",
    icon: <Schedule />,
    color: "#FF9800",
  },
  {
    value: "DoNotDisturb",
    label: "Do Not Disturb",
    icon: <DoNotDisturb />,
    color: "#F44336",
  },
  {
    value: "Invisible",
    label: "Invisible",
    icon: <VisibilityOff />,
    color: "#9E9E9E",
  },
];

export default function StatusSelector() {
  const { currentUser } = useAccount();
  const { updateStatus } = useStatus();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const currentStatus = (currentUser?.status as UserStatus) || "Offline";

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleStatusSelect = async (status: UserStatus) => {
    if (status !== currentStatus) {
      await updateStatus.mutateAsync({
        status,
      });
    }
    handleClose();
  };

  const currentStatusOption = statusOptions.find(
    (opt) => opt.value === currentStatus
  );

  return (
    <>
      <Button
        onClick={handleClick}
        sx={{
          color: "black",
          textTransform: "none",
          display: "flex",
          alignItems: "center",
          gap: 1,
          justifyContent: "flex-start",
          minWidth: 120,
        }}
      >
        <StatusIndicator
          status={currentStatus}
          size="small"
          showTooltip={false}
        />
        <Box sx={{ textAlign: "left", flex: 1 }}>
          <Typography variant="body2" component="div">
            {currentStatusOption?.label || "Offline"}
          </Typography>
        </Box>
      </Button>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        slotProps={{
          paper: {
            sx: { borderRadius: 2, minWidth: 200 },
          },
        }}
      >
        {statusOptions.map((option) => (
          <MenuItem
            key={option.value}
            onClick={() => handleStatusSelect(option.value)}
            selected={option.value === currentStatus}
          >
            <ListItemIcon>
              <FiberManualRecord sx={{ color: option.color }} />
            </ListItemIcon>
            <ListItemText>{option.label}</ListItemText>
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}
