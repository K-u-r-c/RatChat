import { Box, Divider, ListItemIcon, ListItemText } from "@mui/material";
import Button from "@mui/material/Button";
import Menu from "@mui/material/Menu";
import Grow from "@mui/material/Grow";
import MenuItem from "@mui/material/MenuItem";
import { useState } from "react";
import { Link } from "react-router";
import { Password, Person, Logout, Settings } from "@mui/icons-material";
import { useAccount } from "../../lib/hooks/useAccount";
import StatusSelector from "../shared/components/StatusSelector";
import AvatarWithStatus from "../shared/components/AvatarWithStatus";
import AudioSettingsDialog from "../shared/components/AudioSettingsDialog";

export default function UserMenu() {
  const { currentUser, logoutUser } = useAccount();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <>
      <Button
        onClick={handleClick}
        color="inherit"
        size="large"
        sx={{ fontSize: "1.1rem" }}
      >
        <Box display="flex" alignItems="center" gap={2}>
          <AvatarWithStatus
            src={currentUser?.imageUrl}
            alt="Current user image"
            status={currentUser?.status || "Offline"}
          />
          {currentUser?.displayName}
        </Box>
      </Button>
      <Menu
        id="basic-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        MenuListProps={{
          "aria-labelledby": "basic-button",
        }}
        slotProps={{
          paper: {
            sx: {
              minWidth: 240,
              bgcolor: "rgba(19,19,22,0.95)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 2,
              boxShadow: "0 14px 40px rgba(0,0,0,0.7)",
              backdropFilter: "blur(6px)",
            },
          },
        }}
        TransitionComponent={Grow}
      >
        {/* Status Selector at the top */}
        <Box sx={{ px: 2, py: 1 }}>
          <StatusSelector />
        </Box>

        <Divider />

        {/* Create chat room moved to sidebar */}
        <MenuItem
          component={Link}
          to={`/profiles/${currentUser?.slug}`}
          onClick={handleClose}
        >
          <ListItemIcon>
            <Person />
          </ListItemIcon>
          <ListItemText>My profile</ListItemText>
        </MenuItem>
        <MenuItem
          onClick={() => {
            handleClose();
            setSettingsOpen(true);
          }}
        >
          <ListItemIcon>
            <Settings />
          </ListItemIcon>
          <ListItemText>Settings</ListItemText>
        </MenuItem>
        {currentUser?.hasPassword && (
          <MenuItem
            component={Link}
            to={currentUser ? `/profiles/${currentUser.slug}#password` : "/"}
            onClick={handleClose}
          >
            <ListItemIcon>
              <Password />
            </ListItemIcon>
            <ListItemText>Change password</ListItemText>
          </MenuItem>
        )}
        <Divider />
        <MenuItem
          onClick={() => {
            logoutUser.mutate();
            handleClose();
          }}
        >
          <ListItemIcon>
            <Logout />
          </ListItemIcon>
          <ListItemText>Logout</ListItemText>
        </MenuItem>
      </Menu>
      <AudioSettingsDialog
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />
    </>
  );
}
