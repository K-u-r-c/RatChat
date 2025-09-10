import { Box, CssBaseline } from "@mui/material";
import { Outlet, ScrollRestoration } from "react-router";
import { useAccount } from "../../lib/hooks/useAccount";
import FriendsRealtimeProvider from "../shared/components/FriendsRealtimeProvider";
import StatusRealtimeProvider from "../shared/components/StatusRealtimeProvider";
import SideNav from "./SideNav/SideNav";
import SecondarySidebar from "./SideNav/SecondarySidebar";

function App() {
  const { currentUser } = useAccount();

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
      <Box sx={{ display: "flex", minHeight: "100vh" }}>
        <SideNav />
        <SecondarySidebar />

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
    </Box>
  );
}

export default App;
