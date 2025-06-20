import {
  Avatar,
  Box,
  Divider,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import Button from "@mui/material/Button";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import { useState } from "react";
import { Link } from "react-router";
import { Add, Password, Person, Logout } from "@mui/icons-material";
import { useAccount } from "../../lib/hooks/useAccount";
import StatusSelector from "../shared/components/StatusSelector";
import StatusIndicator from "../shared/components/StatusIndicator";

export default function UserMenu() {
  const { currentUser, logoutUser } = useAccount();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
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
          <Box sx={{ position: "relative" }}>
            <Avatar src={currentUser?.imageUrl} alt="Current user image" />
            {/* Status indicator overlay on avatar */}
            <Box
              sx={{
                position: "absolute",
                bottom: -2,
                right: -2,
                backgroundColor: "white",
                borderRadius: "50%",
                padding: "2px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <StatusIndicator
                status={currentUser?.status || "Offline"}
                customMessage={currentUser?.customStatusMessage}
                size="small"
              />
            </Box>
          </Box>
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
        PaperProps={{
          sx: { minWidth: 220 },
        }}
      >
        {/* Status Selector at the top */}
        <Box sx={{ px: 2, py: 1 }}>
          <StatusSelector />
        </Box>

        <Divider />

        <MenuItem component={Link} to="/create-chat-room" onClick={handleClose}>
          <ListItemIcon>
            <Add />
          </ListItemIcon>
          <ListItemText>Create chat room</ListItemText>
        </MenuItem>
        <MenuItem
          component={Link}
          to={`/profiles/${currentUser?.id}`}
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
            to={"/change-password"}
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
