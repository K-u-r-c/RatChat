import { SearchOff } from "@mui/icons-material";
import { Button, Paper, Typography } from "@mui/material";
import { Link } from "react-router";

export default function NotFound() {
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
      <SearchOff sx={{ fontSize: 100 }} color="primary" />
      <Typography gutterBottom variant="h3">
        Oops - we could not find what you are looking for
      </Typography>
      <Button fullWidth component={Link} to="/">
        Return to the app
      </Button>
    </Paper>
  );
}
