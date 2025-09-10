import { Box } from "@mui/material";
import { useLocation } from "react-router";
import DefaultSidebarContent from "./DefaultSidebarContent";
import ChatRoomSidebarContent from "../../../features/chatRooms/ChatRoomSidebarContent";

export const DIRECT_SIDEBAR_WIDTH = 280;

export default function SecondarySidebar() {
  const location = useLocation();
  const showDefaultContent = !location.pathname.startsWith("/chat-rooms");

  return (
    <Box
      component="aside"
      sx={{
        width: { xs: 0, sm: DIRECT_SIDEBAR_WIDTH },
        flex: { xs: "0 0 0px", sm: `0 0 ${DIRECT_SIDEBAR_WIDTH}px` },
        display: { xs: "none", sm: "flex" },
        flexDirection: "column",
        height: "100vh",
        position: "sticky",
        top: 0,
        bgcolor: "#2b2d31",
        borderRight: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      {showDefaultContent ? (
        <DefaultSidebarContent />
      ) : (
        <ChatRoomSidebarContent />
      )}
    </Box>
  );
}
