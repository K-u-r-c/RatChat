import { useEffect, useState } from "react";
import { Box, Button, IconButton, Stack, Typography } from "@mui/material";
import { Close } from "@mui/icons-material";
import { Link as RouterLink } from "react-router";
import { isRunningInDesktopShell } from "./desktopDownloadPromo";

export default function DesktopDownloadBanner() {
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
        bgcolor: "rgba(88,101,242,0.12)",
        borderBottom: "1px solid rgba(138,147,255,0.4)",
        px: { xs: 2, md: 3 },
        py: 1,
      }}
    >
      <Stack
        direction="row"
        spacing={1.5}
        alignItems="center"
        justifyContent="center"
        sx={{
          flexWrap: "wrap",
          textAlign: { xs: "center", sm: "left" },
          gap: 1,
        }}
      >
        <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.85)", fontWeight: 500 }}>
          RatChat desktop delivers faster calls and richer notifications.
        </Typography>
        <Button
          component={RouterLink}
          to="/download"
          variant="contained"
          color="primary"
          size="small"
          sx={{
            fontWeight: 600,
            textTransform: "none",
            px: 2.5,
            borderRadius: 99,
          }}
        >
          Get the desktop app
        </Button>
        <IconButton
          size="small"
          onClick={handleDismiss}
          sx={{
            ml: { xs: 0, sm: 1 },
            bgcolor: "rgba(255,255,255,0.08)",
            "&:hover": { bgcolor: "rgba(255,255,255,0.16)" },
          }}
          aria-label="Dismiss desktop download banner"
        >
          <Close fontSize="small" />
        </IconButton>
      </Stack>
    </Box>
  );
}
