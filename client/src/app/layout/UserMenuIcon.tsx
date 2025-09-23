import {
  Box,
  IconButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Tooltip,
} from "@mui/material";
import Menu from "@mui/material/Menu";
import Grow from "@mui/material/Grow";
import MenuItem from "@mui/material/MenuItem";
import { Password, Person, Logout } from "@mui/icons-material";
import { useState } from "react";
import { Link } from "react-router";
import { useAccount } from "../../lib/hooks/useAccount";
import StatusSelector from "../shared/components/StatusSelector";
import AvatarWithStatus from "../shared/components/AvatarWithStatus";

export default function UserMenuIcon() {
  const { currentUser, logoutUser } = useAccount();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  if (!currentUser) return null;

  return (
    <>
      <Tooltip title={currentUser.displayName} placement="right">
        <IconButton
          onClick={handleClick}
          color="inherit"
          size="large"
          sx={{ width: 52, height: 52, p: 0 }}
        >
          <AvatarWithStatus
            src={currentUser?.imageUrl}
            alt="Current user image"
            status={currentUser?.status || "Offline"}
            size={48}
          />
        </IconButton>
      </Tooltip>
      <Menu
        id="user-menu-icon"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        MenuListProps={{ "aria-labelledby": "user-menu-icon" }}
        PaperProps={{
          sx: {
            minWidth: 240,
            bgcolor: "rgba(19,19,22,0.95)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 2,
            boxShadow: "0 14px 40px rgba(0,0,0,0.7)",
            backdropFilter: "blur(6px)",
          },
        }}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
        transformOrigin={{ vertical: "bottom", horizontal: "right" }}
        TransitionComponent={Grow}
      >
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
    </>
  );
}
