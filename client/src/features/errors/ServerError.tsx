import { ErrorOutline } from "@mui/icons-material";
import { Button, Paper, Typography, Box } from "@mui/material";
import { Link } from "react-router";

export default function ServerError() {
  return (
    <Paper
      sx={{
        height: "100vh",
        width: "100vw",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <ErrorOutline sx={{ fontSize: 96 }} color="error" />
      <Typography gutterBottom variant="h3">
        Server Error
      </Typography>

      <Box sx={{ display: "flex", gap: 2, width: { xs: "100%", sm: "auto" } }}>
        <Button component={Link} to="/" variant="contained" color="primary">
          Return to the app
        </Button>
      </Box>
    </Paper>
  );
}
