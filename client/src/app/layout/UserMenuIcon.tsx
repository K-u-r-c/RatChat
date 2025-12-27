import {Box, Divider, IconButton, ListItemIcon, ListItemText, Tooltip, type TooltipProps,} from "@mui/material";
import Grow from "@mui/material/Grow";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import {Logout, Person, Settings} from "@mui/icons-material";
import {type MouseEvent, type ReactNode, useState} from "react";
import {Link} from "react-router";
import {useAccount} from "../../lib/hooks/useAccount";
import StatusSelector from "../shared/components/StatusSelector";
import AvatarWithStatus from "../shared/components/AvatarWithStatus";
import AudioSettingsDialog from "../shared/components/AudioSettingsDialog";

type UserMenuIconProps = {
  renderTrigger?: (handlers: {
    openMenu: (event: MouseEvent<HTMLElement>) => void;
    closeMenu: () => void;
    isOpen: boolean;
  }) => ReactNode;
  tooltipPlacement?: TooltipProps["placement"];
};

export default function UserMenuIcon(
  {
    renderTrigger,
    tooltipPlacement = "right",
  }: UserMenuIconProps) {
  const {currentUser, logoutUser} = useAccount();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget as HTMLElement);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  if (!currentUser) return null;

  const defaultTrigger = (
    <Tooltip title={currentUser.displayName} placement={tooltipPlacement}>
      <IconButton
        onClick={handleClick}
        color="inherit"
        size="large"
        sx={{width: 52, height: 52, p: 0}}
      >
        <AvatarWithStatus
          src={currentUser?.imageUrl}
          alt="Current user image"
          status={currentUser?.status || "Offline"}
          size={48}
        />
      </IconButton>
    </Tooltip>
  );

  const trigger: ReactNode = renderTrigger
    ? renderTrigger({
      openMenu: handleClick,
      closeMenu: handleClose,
      isOpen: open,
    })
    : defaultTrigger;

  return (
    <>
      {trigger}
      <Menu
        id="user-menu-icon"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        MenuListProps={{"aria-labelledby": "user-menu-icon"}}
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
        anchorOrigin={{vertical: "top", horizontal: "right"}}
        transformOrigin={{vertical: "bottom", horizontal: "right"}}
        TransitionComponent={Grow}
      >
        <Box sx={{px: 2, py: 1}}>
          <StatusSelector/>
        </Box>
        <Divider/>
        <MenuItem
          component={Link}
          to={`/profiles/${currentUser?.slug}`}
          onClick={handleClose}
        >
          <ListItemIcon>
            <Person/>
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
            <Settings/>
          </ListItemIcon>
          <ListItemText>Settings</ListItemText>
        </MenuItem>
        <Divider/>
        <MenuItem
          onClick={() => {
            logoutUser.mutate();
            handleClose();
          }}
        >
          <ListItemIcon>
            <Logout/>
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
