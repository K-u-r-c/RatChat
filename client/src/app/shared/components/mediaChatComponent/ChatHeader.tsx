import {
  Box,
  Typography,
  Button,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Paper,
} from "@mui/material";
import { MoreVert, Settings } from "@mui/icons-material";
import { useState } from "react";

interface ChatHeaderProps {
  title: string;
  isAtBottom: boolean;
  newMessageCount: number;
  onScrollToBottom: () => void;
  onEmojiSettingsOpen: () => void;
}

export default function ChatHeader({
  title,
  isAtBottom,
  newMessageCount,
  onScrollToBottom,
  onEmojiSettingsOpen,
}: ChatHeaderProps) {
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setMenuAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
  };

  const handleEmojiSettingsClick = () => {
    onEmojiSettingsOpen();
    handleMenuClose();
  };

  return (
    <Paper
      elevation={0}
      className="rc-panel"
      sx={{
        p: 1.5,
        mb: 1.5,
        bgcolor: "rgba(19,19,22,0.8)",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      <Typography variant="h6">{title}</Typography>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        {!isAtBottom && (
          <Button
            onClick={onScrollToBottom}
            variant="contained"
            size="small"
            sx={{
              backgroundColor: "rgba(255,255,255,0.2)",
              "&:hover": { backgroundColor: "rgba(255,255,255,0.3)" },
              position: "relative",
            }}
          >
            {newMessageCount > 0 && (
              <Box
                sx={{
                  position: "absolute",
                  top: -8,
                  right: -8,
                  backgroundColor: "error.main",
                  color: "white",
                  borderRadius: "50%",
                  width: 20,
                  height: 20,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "0.75rem",
                  fontWeight: "bold",
                }}
              >
                {newMessageCount}
              </Box>
            )}
            New messages
          </Button>
        )}
        <IconButton
          onClick={handleMenuClick}
          sx={{
            color: "white",
            "&:hover": { backgroundColor: "rgba(255,255,255,0.1)" },
          }}
        >
          <MoreVert />
        </IconButton>
        <Menu
          anchorEl={menuAnchorEl}
          open={Boolean(menuAnchorEl)}
          onClose={handleMenuClose}
          slotProps={{
            paper: {
              sx: {
                bgcolor: "rgba(19,19,22,0.95)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 2,
              },
            },
          }}
        >
          <MenuItem onClick={handleEmojiSettingsClick}>
            <ListItemIcon>
              <Settings fontSize="small" />
            </ListItemIcon>
            <ListItemText>Emoji Settings</ListItemText>
          </MenuItem>
        </Menu>
      </Box>
    </Paper>
  );
}
