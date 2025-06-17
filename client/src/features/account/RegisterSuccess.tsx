import { Box, Button, Divider, Paper, Typography } from "@mui/material";
import { useAccount } from "../../lib/hooks/useAccount";
import { Check } from "@mui/icons-material";

type Props = {
  email?: string;
};

export default function RegisterSuccess({ email }: Props) {
  const { resendConfirmationEmail } = useAccount();

  if (!email) return null;

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        px: { xs: 0, sm: 0, md: 4 },
        pt: { xs: 2, sm: 3 },
        width: "100%",
        minHeight: "90vh",
      }}
    >
      <Paper
        sx={{
          display: "flex",
          flexDirection: "column",
          backgroundColor: "rgba(19, 19, 22, 0.8)",
          boxShadow: {
            xs: "20px 20px 40px rgba(30, 31, 33, 0.8)",
            sm: "40px 40px 60px rgba(30, 31, 33, 1)",
          },
          justifyContent: "center",
          alignItems: "center",
          width: {
            xs: "100%",
            sm: "400px",
            md: "480px",
            lg: "540px",
          },
          maxWidth: "540px",
          minHeight: {
            xs: "100%",
            sm: "500px",
            md: "580px",
          },
          gap: { xs: "16px", sm: "20px", md: "24px" },
          px: { xs: "24px", sm: "48px", md: "72px" },
          py: { xs: "32px", sm: "40px", md: "48px" },
          borderRadius: { xs: "16px 16px 0 0", sm: 3 },
        }}
      >
        <Check
          sx={{
            fontSize: { xs: 60, sm: 80, md: 100 },
            color: "primary.main",
            mb: { xs: 1, sm: 2 },
          }}
        />

        <Typography
          sx={{
            color: "white",
            fontSize: { xs: "22px", sm: "24px", md: "26px" },
            fontWeight: "550",
            textAlign: "center",
            mb: { xs: 1, sm: 2 },
          }}
        >
          Registration successful!
        </Typography>

        <Typography
          sx={{
            color: "#D1D1D6",
            fontSize: { xs: "14px", sm: "16px" },
            textAlign: "center",
            px: { xs: 1, sm: 0 },
            mb: { xs: 2, sm: 3 },
          }}
        >
          Please check your email to confirm your account
        </Typography>

        <Divider
          sx={{
            width: "100%",
            backgroundColor: "#333",
            mb: { xs: 2, sm: 3 },
          }}
        />

        <Button
          onClick={() => resendConfirmationEmail.mutate({ email })}
          disabled={resendConfirmationEmail.isPending}
          variant="contained"
          size="large"
          fullWidth
          sx={{
            py: { xs: 1.2, sm: 1.5 },
            textTransform: "none",
            fontWeight: "bold",
            fontSize: { xs: "14px", sm: "16px" },
            backgroundColor: resendConfirmationEmail.isPending
              ? "#333"
              : "primary",
            color: resendConfirmationEmail.isPending ? "#888" : "white",
            borderRadius: "8px",
            "&.Mui-disabled": {
              backgroundColor: "#333",
              color: "#888",
              opacity: 1,
            },
          }}
        >
          Re-send confirmation email
        </Button>
      </Paper>
    </Box>
  );
}
