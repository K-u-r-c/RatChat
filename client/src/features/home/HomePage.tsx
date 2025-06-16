import { Button, Paper, Typography } from "@mui/material";
import { Link } from "react-router";

export default function HomePage() {
  return (
    <Paper
      sx={{
        color: "white",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        backgroundColor: "#27262C",
        borderRadius: 0,
        px: { xs: 2, sm: 4 },
      }}
    >
      <Typography
        variant="h1"
        sx={{
          fontSize: { xs: "2.2rem", sm: "3rem", md: "4rem" },
          fontWeight: "bold",
          textAlign: "center",
          textShadow: "9px 12px 2px rgba(0, 0, 0, 0.25)",
          mt: { xs: 2, sm: 0 },
        }}
      >
        Welcome To RatChat
      </Typography>

      <Typography
        variant="h5"
        sx={{
          fontSize: { xs: "1.1rem", sm: "1.3rem", md: "1.5rem" },
          fontWeight: "normal",
          textAlign: "center",
          textShadow: "9px 12px 2px rgba(0, 0, 0, 0.25)",
          mb: { xs: 3, sm: 4 },
          mt: { xs: 2, sm: 3 },
        }}
      >
        Your One Place For All Communication
      </Typography>

      <Button
        component={Link}
        to="/chat-rooms"
        variant="contained"
        sx={{
          height: { xs: 48, sm: 60 },
          px: { xs: 4, sm: 8, md: 12 },
          borderRadius: 2,
          fontSize: { xs: "1rem", sm: "1.2rem", md: "1.5rem" },
          backgroundColor: "#1570EF",
          textTransform: "none",
          "&:hover": {
            backgroundColor: "#3367d6",
          },
        }}
      >
        Take me to RatChat
      </Button>
    </Paper>
  );
}
