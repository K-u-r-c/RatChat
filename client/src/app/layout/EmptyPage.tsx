import { Box, Typography } from "@mui/material";

export default function EmptyPage() {
  return (
    <Box
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        textAlign: "center",
      }}
    >
      <Typography variant="h5" gutterBottom>
        Welcome to RatChat
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 2 }}>
        To get started add friends and start chatting or create/join chat rooms.
      </Typography>
    </Box>
  );
}
