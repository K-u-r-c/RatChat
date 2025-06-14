import { Box, Container, CssBaseline } from "@mui/material";
import NavBar from "./NavBar";
import { Outlet, ScrollRestoration, useLocation } from "react-router";
import HomePage from "../../features/home/HomePage";
import { useAccount } from "../../lib/hooks/useAccount";
import FriendsRealtimeProvider from "../shared/components/FriendsRealtimeProvider";

function App() {
  const location = useLocation();
  const { currentUser } = useAccount();

  return (
    <Box sx={{ bgcolor: "#eeeeee", minHeight: "100vh" }}>
      <ScrollRestoration />
      <CssBaseline />
      {currentUser && <FriendsRealtimeProvider />}
      {location.pathname === "/" ? (
        <HomePage />
      ) : (
        <>
          <NavBar />
          <Container maxWidth="xl" sx={{ pt: 14 }}>
            <Outlet />
          </Container>
        </>
      )}
    </Box>
  );
}

export default App;
