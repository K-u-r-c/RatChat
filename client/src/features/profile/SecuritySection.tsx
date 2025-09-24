import { Box, Button, Stack, TextField, Typography } from "@mui/material";

type SecuritySectionProps = {
  hasPassword: boolean;
  highlightPassword: boolean;
  onChangePassword: () => void;
};

export function SecuritySection({
  hasPassword,
  highlightPassword,
  onChangePassword,
}: SecuritySectionProps) {
  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          Account security
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          Keep your account protected by regularly updating your password.
        </Typography>
      </Box>

      {hasPassword ? (
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={2}
          alignItems={{ xs: "stretch", sm: "center" }}
        >
          <TextField
            label="Current password"
            type="password"
            value="********"
            disabled
            InputProps={{ readOnly: true }}
            sx={{
              width: { xs: "100%", sm: 260 },
              "& .MuiOutlinedInput-root": {
                ...(highlightPassword
                  ? {
                      boxShadow: "0 0 0 2px rgba(88,101,242,0.35)",
                      "& .MuiOutlinedInput-notchedOutline": {
                        borderColor: "primary.main",
                      },
                    }
                  : {}),
              },
            }}
          />
          <Button variant="contained" onClick={onChangePassword}>
            Change password
          </Button>
        </Stack>
      ) : (
        <Typography variant="body2" color="text.secondary">
          You are currently signed in without a password. Add one to enable
          email sign in.
        </Typography>
      )}
    </Stack>
  );
}
