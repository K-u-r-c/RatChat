import type { FieldValues } from "react-hook-form";
import { useAccount } from "../../lib/hooks/useAccount";
import { toast } from "react-toastify";
import { useNavigate } from "react-router";
import AccountFormWrapper from "./AccountFormWrapper";
import { LockOpen } from "@mui/icons-material";
import TextInput from "../../app/shared/components/TextInput";
import { Typography, Box } from "@mui/material";
import { Link } from "react-router";

export default function ForgotPasswordForm() {
  const { forgotPassword } = useAccount();
  const navigate = useNavigate();

  const onSubmit = async (data: FieldValues) => {
    try {
      await forgotPassword.mutateAsync(data.email, {
        onSuccess: () => {
          toast.success("Password reset requested - please check your email");
          navigate("/login");
        },
      });
    } catch (error) {
      if (import.meta.env.DEV) console.log(error);
    }
  };

  return (
    <AccountFormWrapper
      title="Reset your password"
      icon={<LockOpen sx={{ fontSize: { xs: 32, sm: 40, md: 48 } }} />}
      submitButtonText="Send reset link"
      onSubmit={onSubmit}
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
          Email Address
        </Typography>
        <TextInput
          placeholder="Enter your email address"
          rules={{
            required: "Email is required",
            pattern: {
              value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
              message: "Invalid email address",
            },
          }}
          name="email"
          tabIndex={1}
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
        Enter your email address and we'll send you a link to reset your
        password.
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
