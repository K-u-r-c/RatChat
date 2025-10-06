import { Box, CssBaseline } from "@mui/material";
import { Outlet, ScrollRestoration } from "react-router";
import { useAccount } from "../../lib/hooks/useAccount";
import FriendsRealtimeProvider from "../shared/components/FriendsRealtimeProvider";
import StatusRealtimeProvider from "../shared/components/StatusRealtimeProvider";
import SideNav from "./SideNav/SideNav";
import SecondarySidebar from "./SideNav/SecondarySidebar";
import ChatRoomsProfileImageRealtimeProvider from "../shared/components/ChatRoomsProfileImageRealtimeProvider";
import NewChatRoomModal from "../../features/chatRooms/create/NewChatRoomModal";
import MessagesRealtimeProvider from "../shared/components/MessagesRealtimeProvider";
import VoiceAudioLayer from "../shared/components/VoiceAudioLayer";
import DesktopDownloadBanner from "./DesktopDownloadBanner";

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
          <MessagesRealtimeProvider />
          <VoiceAudioLayer />
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
          <DesktopDownloadBanner />
          <Outlet />
        </Box>
      </Box>
      <NewChatRoomModal />
    </Box>
  );
}

export default App;
