import {
  Box,
  Button,
  CssBaseline,
  Container,
  IconButton,
  Stack,
  Typography,
} from "@mui/material";
import { Close } from "@mui/icons-material";
import { Outlet, ScrollRestoration, Navigate, Link as RouterLink } from "react-router";
import { useAccount } from "../../lib/hooks/useAccount";
import { useEffect, useState } from "react";
import { isRunningInDesktopShell } from "./desktopDownloadPromo";

export default function AuthLayout() {
  const { currentUser, loadingUserInfo } = useAccount();

  // If we already know the user is logged in, send them into the app.
  if (!loadingUserInfo && currentUser) {
    return <Navigate to="/" replace />;
  }

  return (
    <Box
      sx={{
        bgcolor: "#27262C",
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: { sm: "center", md: "center" },
        width: "100%",
      }}
    >
      <ScrollRestoration />
      <CssBaseline />
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          justifyContent: { sm: "center", md: "center" },
          alignItems: "center",
          height: "100%",
          width: "100%",
        }}
      >
        <Typography
          variant="h1"
          sx={{
            color: "white",
            fontSize: { xs: "2.2rem", sm: "3rem", md: "4rem" },
            fontWeight: "medium",
            textAlign: "center",
            textShadow: "9px 12px 2px rgba(0, 0, 0, 0.25)",
            letterSpacing: "4px",
            height: { xs: "10vh", sm: "auto", md: "auto" },
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          RatChat
        </Typography>
        <Container
          sx={{
            px: 0,
            minHeight: { xs: "90vh", sm: "auto", md: "auto" },
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Outlet />
        </Container>
      </Box>
      <AuthDownloadBar />
    </Box>
  );
}

function AuthDownloadBar() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    if (isRunningInDesktopShell()) return;

    setVisible(true);
  }, []);

  if (!visible) return null;

  const handleDismiss = () => {
    setVisible(false);
  };

  return (
    <Box
      sx={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        bgcolor: "rgba(23,24,31,0.92)",
        borderTop: "1px solid rgba(138,147,255,0.35)",
        px: { xs: 2, md: 4 },
        py: 1.25,
        zIndex: (theme) => theme.zIndex.snackbar,
      }}
    >
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={1.5}
        alignItems="center"
        justifyContent="center"
        sx={{
          gap: { xs: 1, sm: 2 },
          textAlign: { xs: "center", sm: "left" },
        }}
      >
        <Typography
          variant="body2"
          sx={{ color: "rgba(255,255,255,0.82)", fontWeight: 500, maxWidth: 460 }}
        >
          Prefer desktop? Install the RatChat app for Windows, macOS, or Linux to stay connected.
        </Typography>
        <Button
          component={RouterLink}
          to="/download"
          variant="contained"
          color="primary"
          size="small"
          sx={{ fontWeight: 600, textTransform: "none", px: 3 }}
        >
          Download the desktop app
        </Button>
        <IconButton
          size="small"
          onClick={handleDismiss}
          sx={{
            bgcolor: "rgba(255,255,255,0.08)",
            "&:hover": { bgcolor: "rgba(255,255,255,0.15)" },
          }}
          aria-label="Dismiss desktop download prompt"
        >
          <Close fontSize="small" />
        </IconButton>
      </Stack>
    </Box>
  );
}
