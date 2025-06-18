import { useNavigate, useSearchParams } from "react-router";
import { useAccount } from "../../lib/hooks/useAccount";
import { useEffect, useRef, useState } from "react";
import {
  Box,
  CircularProgress,
  Paper,
  Typography,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import { GitHub } from "@mui/icons-material";
import { FcGoogle } from "react-icons/fc";

export default function AuthCallback() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { fetchGithubToken, fetchGoogleToken } = useAccount();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const code = params.get("code");
  const [loading, setLoading] = useState(true);
  const provider = params.get("provider") as "github" | "google" | null;
  const fetched = useRef(false);

  useEffect(() => {
    if (!code || fetched.current || !provider) return;
    fetched.current = true;

    const tokenMutation =
      provider === "github" ? fetchGithubToken : fetchGoogleToken;

    tokenMutation
      .mutateAsync(code)
      .then(() => {
        navigate("/chat-rooms");
      })
      .catch((error) => {
        if (import.meta.env.DEV) console.log(error);
        setLoading(false);
      });
  }, [code, provider, fetchGithubToken, fetchGoogleToken, navigate]);

  if (!code || !provider) {
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
              sm: "400px",
              md: "450px",
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
            Authentication Error
          </Typography>
          <Typography
            sx={{
              color: "#A0A0AB",
              fontSize: { xs: "14px", sm: "16px" },
              textAlign: "center",
            }}
          >
            Problem authenticating with OAuth provider
          </Typography>
        </Paper>
      </Box>
    );
  }

  const providerName =
    provider === "github"
      ? "GitHub"
      : provider === "google"
      ? "Google"
      : "Unknown Provider";

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
            sm: "400px",
            md: "450px",
          },
          gap: { xs: "16px", sm: "20px", md: "24px" },
          px: { xs: "24px", sm: "48px", md: "72px" },
          py: { xs: "32px", sm: "40px", md: "48px" },
          borderRadius: { xs: "16px 16px 0 0", sm: 3 },
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: { xs: 2, sm: 3 },
            flexDirection: { xs: "column", sm: "row" },
          }}
        >
          {provider === "github" ? (
            <GitHub
              sx={{
                color: "white",
                fontSize: { xs: 32, sm: 40, md: 48 },
              }}
            />
          ) : (
            <FcGoogle size={isMobile ? 32 : 48} />
          )}
          <Typography
            sx={{
              color: "white",
              fontSize: { xs: "20px", sm: "22px", md: "24px" },
              fontWeight: "550",
              textAlign: "center",
            }}
          >
            Logging in with {providerName}
          </Typography>
        </Box>

        {loading ? (
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 2,
            }}
          >
            <CircularProgress
              sx={{
                color: "white",
                size: { xs: 32, sm: 40 },
              }}
            />
            <Typography
              sx={{
                color: "#A0A0AB",
                fontSize: { xs: "14px", sm: "16px" },
                textAlign: "center",
              }}
            >
              Please wait...
            </Typography>
          </Box>
        ) : (
          <Typography
            sx={{
              color: "#ff6b6b",
              fontSize: { xs: "14px", sm: "16px" },
              textAlign: "center",
              fontWeight: "500",
            }}
          >
            Problem signing in with {providerName}
          </Typography>
        )}
      </Paper>
    </Box>
  );
}
