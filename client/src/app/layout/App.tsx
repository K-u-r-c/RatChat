import { Box, CssBaseline } from "@mui/material";
import { Outlet, ScrollRestoration } from "react-router";
import { useAccount } from "../../lib/hooks/useAccount";
import FriendsRealtimeProvider from "../shared/components/FriendsRealtimeProvider";
import StatusRealtimeProvider from "../shared/components/StatusRealtimeProvider";
import SideNav from "./SideNav/SideNav";
import SecondarySidebar from "./SideNav/SecondarySidebar";
import ChatRoomsProfileImageRealtimeProvider from "../shared/components/ChatRoomsProfileImageRealtimeProvider";
import NewChatRoomModal from "../../features/chatRooms/create/NewChatRoomModal";

function App() {
  const { currentUser } = useAccount();

  return (
    <Box sx={{ bgcolor: "background.default", minHeight: "100vh" }}>
      <ScrollRestoration />
      <CssBaseline />
      {currentUser && (
        <>
          <FriendsRealtimeProvider />
          <StatusRealtimeProvider />
          <ChatRoomsProfileImageRealtimeProvider />
        </>
      )}
      <Box sx={{ display: "flex", minHeight: "100vh" }}>
        <SideNav />
        <SecondarySidebar />

        <Box
          component="main"
          sx={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <Outlet />
        </Box>
      </Box>
      <NewChatRoomModal />
    </Box>
  );
}

export default App;
