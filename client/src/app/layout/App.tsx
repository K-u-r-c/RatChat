import { Box, CssBaseline } from "@mui/material";
import { Outlet, ScrollRestoration, useLocation } from "react-router";
import { useAccount } from "../../lib/hooks/useAccount";
import FriendsRealtimeProvider from "../shared/components/FriendsRealtimeProvider";
import StatusRealtimeProvider from "../shared/components/StatusRealtimeProvider";
import HomePage from "../../features/home/HomePage";
import SideNav from "./SideNav";
import DirectSidebar from "./DirectSidebar";

function App() {
  const { currentUser } = useAccount();
  const location = useLocation();

  return (
    <Box sx={{ bgcolor: "#27262C", minHeight: "100vh" }}>
      <ScrollRestoration />
      <CssBaseline />
      {currentUser && (
        <>
          <FriendsRealtimeProvider />
          <StatusRealtimeProvider />
        </>
      )}
      {location.pathname === "/" ? (
        <HomePage />
      ) : (
        <Box sx={{ display: "flex", minHeight: "100vh" }}>
          <SideNav />
          <DirectSidebar />

          <Box
            component="main"
            sx={{
              flex: 1,
              minWidth: 0,
              display: "flex",
              flexDirection: "column",
              px: { xs: 1.5, md: 3 },
              py: 2,
            }}
          >
            <Outlet />
          </Box>
        </Box>
      )}
    </Box>
  );
}

export default App;
