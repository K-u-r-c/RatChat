import { Box, Divider, Stack, Typography } from "@mui/material";

type VisitorSectionProps = {
  bio?: string | null;
  totalFriends: number;
};

export function VisitorSection({ bio, totalFriends }: VisitorSectionProps) {
  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="subtitle2" color="text.secondary">
          Bio
        </Typography>
        <Typography variant="body1" sx={{ mt: 1 }}>
          {bio?.trim() ? bio : "This user has not added a bio yet."}
        </Typography>
      </Box>

      <Divider flexItem sx={{ borderColor: "rgba(255,255,255,0.08)" }} />

      <Box>
        <Typography variant="subtitle2" color="text.secondary">
          Friends ({totalFriends})
        </Typography>
      </Box>
    </Stack>
  );
}
