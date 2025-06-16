import { useNavigate, useSearchParams } from "react-router";
import { useAccount } from "../../lib/hooks/useAccount";
import { Typography, Box } from "@mui/material";
import {
  resetPasswordSchema,
  type ResetPasswordSchema,
} from "../../lib/schemas/resetPasswordSchema";
import { toast } from "react-toastify";
import AccountFormWrapper from "./AccountFormWrapper";
import { zodResolver } from "@hookform/resolvers/zod";
import { LockOpen } from "@mui/icons-material";
import PasswordInput from "../../app/shared/components/PasswordInput";
import { Link } from "react-router";

export default function ResetPasswordForm() {
  const [params] = useSearchParams();
  const { resetPassword } = useAccount();
  const navigate = useNavigate();
  const email = params.get("email");
  const code = params.get("code");

  if (!email || !code) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          px: { xs: 0, sm: 0, md: 4 },
          pt: { xs: 2, sm: 3 },
          width: "100%",
          height: "100%",
        }}
      >
        <Box
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
              sm: "300px",
              md: "350px",
            },
            gap: { xs: "16px", sm: "20px", md: "24px" },
            px: { xs: "24px", sm: "48px", md: "72px" },
            py: { xs: "32px", sm: "40px", md: "48px" },
            borderRadius: { xs: "16px 16px 0 0", sm: 3 },
          }}
        >
          <Typography
            sx={{
              color: "white",
              fontSize: { xs: "20px", sm: "22px", md: "24px" },
              fontWeight: "550",
              textAlign: "center",
            }}
          >
            Invalid Reset Link
          </Typography>
          <Typography
            sx={{
              color: "#A0A0AB",
              fontSize: { xs: "14px", sm: "16px" },
              textAlign: "center",
              lineHeight: 1.4,
            }}
          >
            The password reset link is invalid or has expired.
          </Typography>
          <Typography
            sx={{
              color: "#A0A0AB",
              textDecoration: "none",
              fontSize: { xs: "14px", sm: "16px" },
              "&:hover": {
                color: "#D1D1D6",
              },
            }}
            component={Link}
            to="/forgot-password"
          >
            Request a new reset link
          </Typography>
        </Box>
      </Box>
    );
  }

  const onSubmit = async (data: ResetPasswordSchema) => {
    try {
      await resetPassword.mutateAsync(
        {
          email,
          resetCode: code,
          newPassword: data.newPassword,
        },
        {
          onSuccess: () => {
            toast.success("Password reset successfully - You can now sign in");
            navigate("/login");
          },
        }
      );
    } catch (error) {
      if (import.meta.env.DEV) console.log(error);
    }
  };

  return (
    <AccountFormWrapper<ResetPasswordSchema>
      title="Create new password"
      submitButtonText="Reset password"
      onSubmit={onSubmit}
      resolver={zodResolver(resetPasswordSchema)}
      icon={<LockOpen sx={{ fontSize: { xs: 32, sm: 40, md: 48 } }} />}
    >
      <Box sx={{ mb: { xs: 1, sm: 1.5 } }}>
        <Typography
          sx={{
            color: "#D1D1D6",
            mb: 0.5,
            ml: 0.5,
            fontSize: { xs: 14, sm: 15 },
          }}
        >
          New Password
        </Typography>
        <PasswordInput
          placeholder="Enter your new password"
          name="newPassword"
          tabIndex={1}
        />
      </Box>

      <Box sx={{ mb: { xs: 1, sm: 1.5 } }}>
        <Typography
          sx={{
            color: "#D1D1D6",
            mb: 0.5,
            ml: 0.5,
            fontSize: { xs: 14, sm: 15 },
          }}
        >
          Confirm Password
        </Typography>
        <PasswordInput
          placeholder="Confirm your new password"
          name="confirmPassword"
          tabIndex={2}
        />
      </Box>

      <Typography
        sx={{
          color: "#A0A0AB",
          fontSize: { xs: "14px", sm: "15px" },
          textAlign: "center",
          lineHeight: 1.4,
          mt: { xs: 1, sm: 1.5 },
        }}
      >
        Your new password must be different from your previous password.
      </Typography>

      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: { xs: 1, sm: 2 },
          mt: { xs: 2, sm: 2.5 },
          flexDirection: { xs: "column", sm: "row" },
        }}
      >
        <Typography
          sx={{
            textAlign: "center",
            color: "#70707B",
            fontSize: { xs: "14px", sm: "16px" },
          }}
        >
          Remember your password?
        </Typography>
        <Typography
          sx={{
            color: "#A0A0AB",
            textDecoration: "none",
            fontSize: { xs: "14px", sm: "16px" },
            "&:hover": {
              color: "#D1D1D6",
            },
          }}
          component={Link}
          to="/login"
        >
          Back to Login
        </Typography>
      </Box>
    </AccountFormWrapper>
  );
}
