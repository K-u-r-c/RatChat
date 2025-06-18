import { Box, CssBaseline, Container, Typography } from "@mui/material";
import { Outlet, ScrollRestoration } from "react-router";

export default function AuthLayout() {
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
    </Box>
  );
}
