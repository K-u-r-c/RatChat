import { useForm } from "react-hook-form";
import { useAccount } from "../../lib/hooks/useAccount";
import { loginSchema, type LoginSchema } from "../../lib/schemas/loginSchema";
import { zodResolver } from "@hookform/resolvers/zod";
import { Box, Button, Paper, Typography } from "@mui/material";
import { GitHub, Google, LockOpen } from "@mui/icons-material";
import TextInput from "../../app/shared/components/TextInput";
import { Link, useLocation, useNavigate } from "react-router";
import { useState } from "react";
import { toast } from "react-toastify";

export default function LoginForm() {
  const [notVerified, setNotVerified] = useState(false);
  const { loginUser, resendConfirmationEmail } = useAccount();
  const navigate = useNavigate();
  const location = useLocation();
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
    <Paper
      component="form"
      onSubmit={handleSubmit(onSubmit)}
      sx={{
        display: "flex",
        flexDirection: "column",
        p: 3,
        gap: 3,
        maxWidth: "md",
        mx: "auto",
        borderRadius: 3,
      }}
    >
      <Box
        display="flex"
        alignItems="center"
        justifyContent="center"
        gap={3}
        color="secondary.main"
      >
        <LockOpen fontSize="large" />
        <Typography variant="h4">Sign in</Typography>
      </Box>
      <TextInput label="Email" control={control} name="email" />
      <TextInput
        label="Password"
        type="password"
        control={control}
        name="password"
      />
      <Button
        type="submit"
        disabled={!isValid || isSubmitting}
        variant="contained"
        size="large"
      >
        Login
      </Button>
      <Box display="flex" flexDirection="row" gap={2}>
        <Button
          onClick={loginWithGoogle}
          startIcon={<Google />}
          sx={{ backgroundColor: "black" }}
          type="button"
          variant="contained"
          size="large"
          fullWidth
        >
          Login with Google
        </Button>
        <Button
          onClick={loginWithGithub}
          startIcon={<GitHub />}
          sx={{ backgroundColor: "black" }}
          type="button"
          variant="contained"
          size="large"
          fullWidth
        >
          Login with GitHub
        </Button>
      </Box>
      {notVerified ? (
        <Box
          display={"flex"}
          flexDirection={"column"}
          justifyContent={"center"}
        >
          <Typography textAlign={"center"} color="error">
            Your email has not been verified. You can click the button to
            re-send the verification email
          </Typography>
          <Button
            onClick={handleResendEmail}
            disabled={resendConfirmationEmail.isPending}
          >
            Re-send email link
          </Button>
        </Box>
      ) : (
        <Box
          display={"flex"}
          alignItems={"center"}
          justifyContent={"center"}
          gap={3}
        >
          <Typography>
            Forgot password ? Click <Link to={"/forgot-password"}>Here</Link>
          </Typography>
          <Typography sx={{ textAlign: "center" }}>
            Don't have an account?
            <Typography
              sx={{ ml: 2 }}
              component={Link}
              to="/register"
              color="primary"
            >
              Sign up
            </Typography>
          </Typography>
        </Box>
      )}
    </Paper>
  );
}
