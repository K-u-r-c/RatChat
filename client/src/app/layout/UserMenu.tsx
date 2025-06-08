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
import { Add, Password, Person } from "@mui/icons-material";
import { useAccount } from "../../lib/hooks/useAccount";

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
          <Avatar src={currentUser?.imageUrl} alt="Current user image" />
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
      >
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
            <Person />
          </ListItemIcon>
          <ListItemText>Logout</ListItemText>
        </MenuItem>
      </Menu>
    </>
  );
}
