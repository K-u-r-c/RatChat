import { Box, Container, CssBaseline } from "@mui/material";
import NavBar from "./NavBar";
import { Outlet, ScrollRestoration } from "react-router";
import { useAccount } from "../../lib/hooks/useAccount";
import FriendsRealtimeProvider from "../shared/components/FriendsRealtimeProvider";
import HomePage from "../../features/home/HomePage";

function App() {
  const { currentUser } = useAccount();

  return (
    <Box sx={{ bgcolor: "#27262C", minHeight: "100vh" }}>
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
