import { Group } from "@mui/icons-material";
import { Box, Button, Paper, Typography } from "@mui/material";
import { Link } from "react-router";

export default function HomePage() {
  return (
    <Paper
      sx={{
        color: "white",
        display: "flex",
        flexDirection: "column",
        gap: 6,
        alignItems: "center",
        alignContent: "center",
        justifyContent: "center",
        height: "100vh",
        backgroundImage:
          "linear-gradient(135deg, #40356e 0%, #7867BD 69%,rgb(174, 157, 241) 89%)",
        borderRadius: 0,
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          alignContent: "center",
          color: "white",
          gap: 3,
        }}
      >
        <Group sx={{ height: 110, width: 110 }} />
        <Typography variant="h1">RatChat</Typography>
      </Box>
      <Typography variant="h1">Welcome to RatChat</Typography>
      <Button
        component={Link}
        to="/activities"
        size="large"
        variant="contained"
        sx={{
          height: 80,
          borderRadius: 4,
          fontSize: "1.5rem",
          backgroundColor: "#40356e",
        }}
      >
        Take me to chats!
      </Button>
    </Paper>
  );
}
