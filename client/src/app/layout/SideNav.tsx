import {
  Box,
  Avatar,
  CircularProgress,
  IconButton,
  Tooltip,
} from "@mui/material";
import { Forum, Add } from "@mui/icons-material";
import { NavLink } from "react-router";
import { useSidebarChatRooms } from "../../lib/hooks/useSidebarChatRooms";
import { NAV_WIDTH } from "../../lib/types/constants";
import UserMenuIcon from "./UserMenuIcon";

export default function SideNav() {
  const { chatRooms, isLoading } = useSidebarChatRooms();

  return (
    <Box
      component="nav"
      sx={{
        width: NAV_WIDTH,
        flex: `0 0 ${NAV_WIDTH}px`,
        bgcolor: "#1e1f24",
        borderRight: "1px solid rgba(255,255,255,0.08)",
        height: "100vh",
        position: "sticky",
        top: 0,
        display: { xs: "none", sm: "flex" },
        flexDirection: "column",
        alignItems: "center",
        gap: 1,
        py: 1.5,
      }}
    >
      {/* Direct Messages entry */}
      <Tooltip title="Direct Messages" placement="right">
        <IconButton
          component={NavLink}
          to="/direct-chats"
          sx={{
            width: 52,
            height: 52,
            borderRadius: 2,
            bgcolor: ({ palette }) => palette.grey[900],
            color: "#fff",
            "&.active": {
              bgcolor: "primary.main",
            },
          }}
        >
          <Forum />
        </IconButton>
      </Tooltip>

      {/* Separator */}
      <Box
        sx={{ width: 36, height: 2, bgcolor: "rgba(255,255,255,0.1)", my: 1 }}
      />

      {/* Chat rooms as icons */}
      <Box
        sx={{
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 1,
          width: "100%",
          py: 1,
          boxSizing: "border-box",
        }}
      >
        {isLoading && <CircularProgress size={24} />}
        {!isLoading &&
          chatRooms?.map((room) => (
            <Tooltip key={room.id} title={room.title} placement="right">
              <IconButton
                component={NavLink}
                to={`/chat-rooms/${room.id}`}
                sx={{
                  width: 52,
                  height: 52,
                  borderRadius: 2,
                  p: 0,
                  bgcolor: "transparent",
                  "&.active": {
                    outline: "2px solid",
                    outlineColor: "primary.main",
                    outlineOffset: 2,
                  },
                }}
              >
                <Avatar
                  sx={{
                    width: 52,
                    height: 52,
                    borderRadius: 2,
                    bgcolor: "#2f3136",
                    fontWeight: 700,
                  }}
                  src={room.adminImageUrl}
                  alt={room.title}
                >
                  {room.title?.charAt(0).toUpperCase()}
                </Avatar>
              </IconButton>
            </Tooltip>
          ))}

        {/* Add chat room button after the list */}
        <Tooltip title="Create chat room" placement="right">
          <IconButton
            component={NavLink}
            to="/create-chat-room"
            sx={{
              width: 52,
              height: 52,
              borderRadius: 2,
              bgcolor: "#2f3136",
              color: "#fff",
              "&:hover": { bgcolor: "#3a3c43" },
            }}
          >
            <Add />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Bottom user menu (Discord-like) */}
      <Box sx={{ flexGrow: 1 }} />
      <Box sx={{ pb: 0.5 }}>
        <UserMenuIcon />
      </Box>
    </Box>
  );
}
