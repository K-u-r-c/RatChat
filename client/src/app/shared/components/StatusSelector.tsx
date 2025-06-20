import { useState } from "react";
import {
  Button,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
} from "@mui/material";
import {
  FiberManualRecord,
  Schedule,
  DoNotDisturb,
  VisibilityOff,
  Edit,
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
  const [customMessageDialog, setCustomMessageDialog] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<UserStatus>("Online");
  const [customMessage, setCustomMessage] = useState("");

  const currentStatus = (currentUser?.status as UserStatus) || "Offline";
  const currentCustomMessage = currentUser?.customStatusMessage;

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleStatusSelect = async (status: UserStatus) => {
    setSelectedStatus(status);
    if (status === currentStatus) {
      setCustomMessage(currentCustomMessage || "");
      setCustomMessageDialog(true);
    } else {
      await updateStatus.mutateAsync({
        status,
        customMessage: undefined,
      });
    }
    handleClose();
  };

  const handleCustomMessageSubmit = async () => {
    await updateStatus.mutateAsync({
      status: selectedStatus,
      customMessage: customMessage.trim() || undefined,
    });

    setCustomMessageDialog(false);
    setCustomMessage("");
  };

  const handleEditCustomMessage = () => {
    setSelectedStatus(currentStatus);
    setCustomMessage(currentCustomMessage || "");
    setCustomMessageDialog(true);
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
          color: "white",
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
          customMessage={currentCustomMessage}
          size="small"
          showTooltip={false}
        />
        <Box sx={{ textAlign: "left", flex: 1 }}>
          <Typography variant="body2" component="div">
            {currentStatusOption?.label || "Offline"}
          </Typography>
          {currentCustomMessage && (
            <Typography
              variant="caption"
              component="div"
              sx={{
                opacity: 0.8,
                maxWidth: 100,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {currentCustomMessage}
            </Typography>
          )}
        </Box>
      </Button>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        PaperProps={{
          sx: { minWidth: 200 },
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

        {currentCustomMessage && (
          <>
            <MenuItem onClick={handleEditCustomMessage}>
              <ListItemIcon>
                <Edit />
              </ListItemIcon>
              <ListItemText>Edit Custom Message</ListItemText>
            </MenuItem>
          </>
        )}
      </Menu>

      {/* Custom Message Dialog */}
      <Dialog
        open={customMessageDialog}
        onClose={() => setCustomMessageDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Set Custom Status Message</DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
            <StatusIndicator
              status={selectedStatus}
              size="medium"
              showTooltip={false}
            />
            <Typography variant="body1">
              {statusOptions.find((opt) => opt.value === selectedStatus)?.label}
            </Typography>
          </Box>
          <TextField
            fullWidth
            label="Custom message (optional)"
            value={customMessage}
            onChange={(e) => setCustomMessage(e.target.value)}
            placeholder="What's happening?"
            multiline
            rows={2}
            inputProps={{ maxLength: 100 }}
            helperText={`${customMessage.length}/100`}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCustomMessageDialog(false)}>Cancel</Button>
          <Button
            onClick={handleCustomMessageSubmit}
            variant="contained"
            disabled={updateStatus.isPending}
          >
            {updateStatus.isPending ? "Updating..." : "Update Status"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
