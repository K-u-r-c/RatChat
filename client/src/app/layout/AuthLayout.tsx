import { Box, CssBaseline, Container, Typography } from "@mui/material";
import { Outlet, ScrollRestoration } from "react-router";

export default function AuthLayout() {
  return (
    <Box sx={{ bgcolor: "#27262C", minHeight: "100vh" }}>
      <ScrollRestoration />
      <CssBaseline />
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Typography
          variant="h1"
          sx={{
            mt: 6,
            color: "white",
            fontSize: { xs: "2.2rem", sm: "3rem", md: "4rem" },
            fontWeight: "medium",
            textAlign: "center",
            textShadow: "9px 12px 2px rgba(0, 0, 0, 0.25)",
            letterSpacing: "4px",
          }}
        >
          RatChat
        </Typography>
        <Container>
          <Outlet />
        </Container>
      </Box>
    </Box>
  );
}
