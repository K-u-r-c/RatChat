import { Box, Typography } from "@mui/material";
import { format } from "date-fns";

export default function DateDivider({ date }: { date: Date }) {
  const label = format(date, "dd MMMM yyyy");
  return (
    <Box sx={{ my: 1.5, position: "relative" }}>
      <Box
        sx={{
          position: "absolute",
          top: "50%",
          left: 0,
          right: 0,
          borderTop: "1px solid",
          borderColor: "divider",
        }}
      />
      <Box sx={{ display: "flex", justifyContent: "center" }}>
        <Typography
          variant="caption"
          sx={{
            px: 1,
            bgcolor: "background.default",
            zIndex: 1,
            color: "text.secondary",
          }}
        >
          {label}
        </Typography>
      </Box>
    </Box>
  );
}
