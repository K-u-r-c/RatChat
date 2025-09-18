import { useEffect, useRef, useState } from "react";
import { useAccount } from "../../lib/hooks/useAccount";
import { Link, useSearchParams } from "react-router";
import { Box, Button, Divider, Paper, Typography } from "@mui/material";
import { EmailRounded } from "@mui/icons-material";

export default function VerifyEmail() {
  const { verifyEmail, resendConfirmationEmail } = useAccount();
  const [status, setStatus] = useState("verifying");
  const [searchParams] = useSearchParams();
  const userId = searchParams.get("userId");
  const code = searchParams.get("code");
  const hasRun = useRef(false);

  useEffect(() => {
    if (code && userId && !hasRun.current) {
      hasRun.current = true;
      verifyEmail
        .mutateAsync({ userId, code })
        .then(() => setStatus("verified"))
        .catch(() => setStatus("failed"));
    }
  }, [code, userId, verifyEmail]);

  const getBody = () => {
    switch (status) {
      case "verifying":
        return (
          <Typography
            sx={{
              color: "#D1D1D6",
              fontSize: { xs: "16px", sm: "18px" },
              textAlign: "center",
            }}
          >
            Verifying your email...
          </Typography>
        );
      case "failed":
        return (
          <Box
            display="flex"
            flexDirection="column"
            gap={{ xs: 2, sm: 2.5 }}
            justifyContent="center"
            alignItems="center"
            sx={{ width: "100%" }}
          >
            <Typography
              sx={{
                color: "#D1D1D6",
                fontSize: { xs: "14px", sm: "16px" },
                textAlign: "center",
                px: { xs: 1, sm: 0 },
              }}
            >
              Verification failed. You can try resending the verify link to your
              email
            </Typography>
            <Button
              onClick={() => resendConfirmationEmail.mutate({ userId })}
              disabled={resendConfirmationEmail.isPending}
              variant="contained"
              size="large"
              sx={{
                py: { xs: 1.2, sm: 1.5 },
                px: { xs: 3, sm: 4 },
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
              Resend verification email
            </Button>
          </Box>
        );
      case "verified":
        return (
          <Box
            display="flex"
            flexDirection="column"
            gap={{ xs: 2, sm: 2.5 }}
            justifyContent="center"
            alignItems="center"
            sx={{ width: "100%" }}
          >
            <Typography
              sx={{
                color: "#D1D1D6",
                fontSize: { xs: "14px", sm: "16px" },
                textAlign: "center",
                px: { xs: 1, sm: 0 },
              }}
            >
              Email has been verified - You can now login
            </Typography>
            <Button
              component={Link}
              to="/login"
              variant="contained"
              size="large"
              sx={{
                py: { xs: 1.2, sm: 1.5 },
                px: { xs: 3, sm: 4 },
                textTransform: "none",
                fontWeight: "bold",
                fontSize: { xs: "14px", sm: "16px" },
                backgroundColor: "primary",
                color: "white",
                borderRadius: "8px",
              }}
            >
              Go to login
            </Button>
          </Box>
        );
    }
  };

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        px: { xs: 0, sm: 0, md: 4 },
        pt: { xs: 2, sm: 3 },
        width: "100%",
        minHeight: { xs: "90vh", sm: "90vh", md: "auto" },
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
        <EmailRounded
          sx={{
            fontSize: { xs: 60, sm: 80, md: 100 },
            color: "primary.main",
            mb: { xs: 1, sm: 2 },
          }}
        />

        <Typography
          sx={{
            color: "white",
            fontSize: { xs: "24px", sm: "26px", md: "28px" },
            fontWeight: "550",
            textAlign: "center",
            mb: { xs: 2, sm: 3 },
          }}
        >
          Email verification
        </Typography>

        <Divider
          sx={{
            width: "100%",
            backgroundColor: "#333",
            mb: { xs: 2, sm: 3 },
          }}
        />

        {getBody()}
      </Paper>
    </Box>
  );
}
