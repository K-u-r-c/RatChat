import { useForm } from "react-hook-form";
import { useAccount } from "../../lib/hooks/useAccount";
import { loginSchema, type LoginSchema } from "../../lib/schemas/loginSchema";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Box,
  Button,
  Paper,
  Typography,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import { GitHub } from "@mui/icons-material";
import { FcGoogle } from "react-icons/fc";
import TextInput from "../../app/shared/components/TextInput";
import { Link, useLocation, useNavigate } from "react-router";
import { useState } from "react";
import { toast } from "react-toastify";
import PasswordInput from "../../app/shared/components/PasswordInput";

export default function LoginForm() {
  const [notVerified, setNotVerified] = useState(false);
  const { loginUser, resendConfirmationEmail } = useAccount();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const {
    control,
    handleSubmit,
    watch,
    formState: { isValid, isSubmitting },
  } = useForm<LoginSchema>({
    mode: "onTouched",
    resolver: zodResolver(loginSchema),
  });
  const email = watch("email");

  const handleResendEmail = async () => {
    try {
      await resendConfirmationEmail.mutateAsync({ email });
      setNotVerified(false);
    } catch (error) {
      if (import.meta.env.DEV) console.log(error);
      toast.error("Problem sending email - please check email address");
    }
  };

  const onSubmit = async (data: LoginSchema) => {
    await loginUser.mutateAsync(data, {
      onSuccess: () => {
        navigate(location.state?.from || "/chat-rooms");
      },
      onError: (error) => {
        if (error.message === "NotAllowed") setNotVerified(true);
      },
    });
  };

  const loginWithGithub = () => {
    const clientId = import.meta.env.VITE_GITHUB_CLIENT_ID;
    const redirectUrl = import.meta.env.VITE_REDIRECT_URL;

    window.location.href = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUrl}?provider=github&scope=read:user user:email`;
  };

  const loginWithGoogle = () => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    const redirectUrl = import.meta.env.VITE_REDIRECT_URL;
    const scope = "openid email profile";

    window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUrl}?provider=google&scope=${scope}&response_type=code`;
  };

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
        component="form"
        onSubmit={handleSubmit(onSubmit)}
        sx={{
          display: "flex",
          flexDirection: "column",
          backgroundColor: "rgba(19, 19, 22, 0.8)",
          boxShadow: {
            xs: "20px 20px 40px rgba(30, 31, 33, 0.8)",
            sm: "40px 40px 60px rgba(30, 31, 33, 1)",
          },
          justifyContent: "center",
          width: {
            xs: "100%",
            sm: "400px",
            md: "480px",
            lg: "540px",
          },
          maxWidth: "540px",
          minHeight: {
            xs: "100%",
            sm: "600px",
            md: "690px",
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
            fontSize: { xs: "24px", sm: "26px", md: "28px" },
            fontWeight: "550",
            textAlign: { xs: "center", sm: "left" },
            mb: { xs: 1, sm: 0 },
          }}
        >
          Login to your account
        </Typography>

        <Box>
          <Box sx={{ mb: { xs: 1.5, sm: 2 } }}>
            <Typography
              sx={{
                color: "#D1D1D6",
                mb: 0.5,
                ml: 0.5,
                fontSize: { xs: 14, sm: 15 },
              }}
            >
              Email
            </Typography>
            <TextInput
              placeholder="Enter your email"
              control={control}
              name="email"
              tabIndex={1}
            />
          </Box>

          <Box sx={{ color: "#D1D1D6", textDecoration: "none", mb: 1 }}>
            <Box
              sx={{
                display: "flex",
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 0.5,
                ml: 0.5,
              }}
            >
              <Typography sx={{ fontSize: { xs: 14, sm: 15 } }}>
                Password
              </Typography>
              <Typography>
                <Link
                  to="/forgot-password"
                  style={{
                    color: "#A0A0AB",
                    textDecoration: "none",
                    cursor: "pointer",
                    fontSize: isMobile ? "14px" : "inherit",
                  }}
                  tabIndex={3}
                >
                  Forgot?
                </Link>
              </Typography>
            </Box>
            <PasswordInput
              placeholder="Enter your password"
              control={control}
              name="password"
              tabIndex={2}
            />
          </Box>
        </Box>

        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: { xs: 2, sm: 2.5 },
            mt: { xs: 1, sm: 0 },
          }}
        >
          <Button
            type="submit"
            disabled={!isValid || isSubmitting}
            variant="contained"
            size="large"
            fullWidth
            sx={{
              py: { xs: 1.2, sm: 1.5 },
              textTransform: "none",
              fontWeight: "bold",
              fontSize: { xs: "14px", sm: "16px" },
              backgroundColor: !isValid || isSubmitting ? "#333" : "primary",
              color: !isValid || isSubmitting ? "#888" : "white",
              borderRadius: "8px",
              "&.Mui-disabled": {
                backgroundColor: "#333",
                color: "#888",
                opacity: 1,
              },
            }}
          >
            Login now
          </Button>

          <Button
            onClick={loginWithGoogle}
            startIcon={<FcGoogle size={isMobile ? 18 : 20} />}
            sx={{
              py: { xs: 1.2, sm: 1.5 },
              backgroundColor: "#26272B",
              color: "#A0A0AB",
              fontWeight: "bold",
              textTransform: "none",
              borderRadius: "8px",
              fontSize: { xs: "14px", sm: "16px" },
              "&:hover": {
                backgroundColor: "#2A2B30",
              },
            }}
            type="button"
            variant="contained"
            size="large"
            fullWidth
          >
            Continue with Google
          </Button>

          <Button
            onClick={loginWithGithub}
            startIcon={
              <GitHub sx={{ color: "white", fontSize: isMobile ? 18 : 20 }} />
            }
            sx={{
              py: { xs: 1.2, sm: 1.5 },
              backgroundColor: "#26272B",
              color: "#A0A0AB",
              fontWeight: "bold",
              textTransform: "none",
              borderRadius: "8px",
              fontSize: { xs: "14px", sm: "16px" },
              "&:hover": {
                backgroundColor: "#2A2B30",
              },
            }}
            type="button"
            variant="contained"
            size="large"
            fullWidth
          >
            Continue with GitHub
          </Button>
        </Box>

        {notVerified ? (
          <Box
            display="flex"
            flexDirection="column"
            justifyContent="center"
            gap={2}
            sx={{ mt: { xs: 1, sm: 0 } }}
          >
            <Typography
              textAlign="center"
              color="error"
              sx={{
                fontSize: { xs: "14px", sm: "16px" },
                px: { xs: 1, sm: 0 },
              }}
            >
              Your email has not been verified. You can click the button to
              re-send the verification email
            </Typography>
            <Button
              onClick={handleResendEmail}
              disabled={resendConfirmationEmail.isPending}
              variant="outlined"
              sx={{
                py: 1,
                fontSize: { xs: "14px", sm: "16px" },
                textTransform: "none",
              }}
            >
              Re-send email link
            </Button>
          </Box>
        ) : (
          <Box
            display="flex"
            alignItems="center"
            justifyContent="center"
            gap={{ xs: 1, sm: 3 }}
            sx={{
              mt: { xs: 1, sm: 0 },
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
              Don't Have An Account?
            </Typography>
            <Typography
              sx={{
                color: "#A0A0AB",
                textDecoration: "none",
                fontSize: { xs: "14px", sm: "16px" },
              }}
              component={Link}
              to="/register"
            >
              Sign Up
            </Typography>
          </Box>
        )}
      </Paper>
    </Box>
  );
}
