import {
  Box,
  CssBaseline,
  Drawer,
  IconButton,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { Outlet, ScrollRestoration, useLocation } from "react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Menu, ViewSidebar } from "@mui/icons-material";
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
import { useChatRooms } from "../../lib/hooks/useChatRooms";
import { useDirectChats } from "../../lib/hooks/useDirectChats";
import { useEncryptedDirectChats } from "../../lib/hooks/useEncryptedDirectChats";
import UserActionRibbon from "./UserActionRibbon";
import { NAV_WIDTH } from "../../lib/types/constants";

function App() {
  const { currentUser } = useAccount();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const location = useLocation();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const actionRibbonRef = useRef<HTMLDivElement | null>(null);
  const topBarRef = useRef<HTMLDivElement | null>(null);
  const { chatRooms } = useChatRooms();
  const { directChats } = useDirectChats();
  const { encryptedDirectChats } = useEncryptedDirectChats();

  const mobileTitle = useMemo(() => {
    const segments = location.pathname.split("/").filter(Boolean);
    const root = segments[0] ?? "";
    if (root === "friends") return "Friends";
    if (root === "profiles") return "Profile";
    if (root === "chat-rooms" && segments[1]) {
      const room = chatRooms?.find((entry) => entry.slug === segments[1]);
      return room?.title ?? "Chat Room";
    }
    if (root === "direct-chats" && segments[1]) {
      const chat = directChats?.find(
        (entry) => entry.otherUserSlug === segments[1]
      );
      return chat?.otherUserDisplayName ?? "Direct Chat";
    }
    if (root === "encrypted-direct-chats" && segments[1]) {
      const chat = encryptedDirectChats?.find(
        (entry) => entry.otherUserSlug === segments[1]
      );
      return chat?.otherUserDisplayName ?? "Encrypted Chat";
    }
    return "RatChat";
  }, [chatRooms, directChats, encryptedDirectChats, location.pathname]);

  useEffect(() => {
    setMobileNavOpen(false);
    setMobileSidebarOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (typeof document === "undefined") return;
    if (!isMobile || !actionRibbonRef.current) {
      document.documentElement.style.setProperty(
        "--mobile-action-ribbon-height",
        "0px"
      );
      return;
    }

    const element = actionRibbonRef.current;
    const updateHeight = () => {
      const height = element.getBoundingClientRect().height;
      document.documentElement.style.setProperty(
        "--mobile-action-ribbon-height",
        `${Math.max(0, Math.round(height))}px`
      );
    };

    updateHeight();

    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", updateHeight);
      return () => window.removeEventListener("resize", updateHeight);
    }

    const observer = new ResizeObserver(updateHeight);
    observer.observe(element);
    return () => observer.disconnect();
  }, [isMobile, currentUser]);

  useEffect(() => {
    if (typeof document === "undefined") return;
    if (!isMobile || !topBarRef.current) {
      document.documentElement.style.setProperty(
        "--mobile-topbar-height",
        "0px"
      );
      return;
    }

    const element = topBarRef.current;
    const updateHeight = () => {
      const height = element.getBoundingClientRect().height;
      document.documentElement.style.setProperty(
        "--mobile-topbar-height",
        `${Math.max(0, Math.round(height))}px`
      );
    };

    updateHeight();

    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", updateHeight);
      return () => window.removeEventListener("resize", updateHeight);
    }

    const observer = new ResizeObserver(updateHeight);
    observer.observe(element);
    return () => observer.disconnect();
  }, [isMobile, mobileTitle]);

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
            pb: { xs: "var(--mobile-action-ribbon-height, 0px)", sm: 0 },
          }}
        >
          <Box
            ref={topBarRef}
            sx={{
              display: { xs: "flex", sm: "none" },
              alignItems: "center",
              justifyContent: "space-between",
              px: 2,
              py: 1.5,
              position: "sticky",
              top: 0,
              zIndex: 20,
              bgcolor: "background.default",
              borderBottom: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <IconButton
              aria-label="Open servers"
              onClick={() => setMobileNavOpen(true)}
              size="small"
            >
              <Menu />
            </IconButton>
            <Typography variant="subtitle1" fontWeight={700} noWrap>
              {mobileTitle}
            </Typography>
            <IconButton
              aria-label="Open channels"
              onClick={() => setMobileSidebarOpen(true)}
              size="small"
            >
              <ViewSidebar />
            </IconButton>
          </Box>
          <DesktopDownloadBanner />
          <Outlet />
        </Box>
      </Box>
      {currentUser && (
        <Box
          ref={actionRibbonRef}
          sx={{
            position: "fixed",
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 1200,
            display: { xs: "block", sm: "none" },
          }}
        >
          <UserActionRibbon />
        </Box>
      )}
      <Drawer
        anchor="left"
        open={mobileNavOpen}
        onClose={() => setMobileNavOpen(false)}
        ModalProps={{ keepMounted: true }}
        sx={{ display: { xs: "block", sm: "none" } }}
        PaperProps={{
          sx: {
            width: NAV_WIDTH,
            bgcolor: "#1e1f24",
            borderRight: "1px solid rgba(255,255,255,0.08)",
          },
        }}
      >
        <SideNav variant="drawer" />
      </Drawer>
      <Drawer
        anchor="right"
        open={mobileSidebarOpen}
        onClose={() => setMobileSidebarOpen(false)}
        ModalProps={{ keepMounted: true }}
        sx={{ display: { xs: "block", sm: "none" } }}
        PaperProps={{
          sx: {
            width: "min(320px, 100vw)",
            bgcolor: "#1e1f24",
            borderLeft: "1px solid rgba(255,255,255,0.08)",
          },
        }}
      >
        <SecondarySidebar variant="drawer" showActionRibbon={false} />
      </Drawer>
      <NewChatRoomModal />
    </Box>
  );
}

export default App;
