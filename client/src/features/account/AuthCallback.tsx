import { useNavigate, useSearchParams } from "react-router";
import { useAccount } from "../../lib/hooks/useAccount";
import { useEffect, useRef, useState } from "react";
import { Box, CircularProgress, Paper, Typography } from "@mui/material";
import { GitHub, Google } from "@mui/icons-material";

export default function AuthCallback() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { fetchGithubToken, fetchGoogleToken } = useAccount();
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

  if (!code || !provider)
    return <Typography>Problem authenticating with OAuth provider</Typography>;

  const ProviderIcon =
    provider === "github" ? GitHub : provider === "google" ? Google : null;
  const providerName =
    provider === "github"
      ? "GitHub"
      : provider === "google"
      ? "Google"
      : "Unknown Provider";

  return (
    <Paper
      sx={{
        height: 400,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        p: 3,
        gap: 3,
        maxWidth: "md",
        mx: "auto",
        borderRadius: 3,
      }}
    >
      <Box
        display={"flex"}
        alignItems={"center"}
        justifyContent={"center"}
        gap={3}
      >
        {ProviderIcon ? <ProviderIcon fontSize="large" /> : null}
        <Typography variant="h4">Logging in with {providerName}</Typography>
      </Box>
      {loading ? (
        <CircularProgress />
      ) : (
        <Typography>Problem signing in with {providerName}</Typography>
      )}
    </Paper>
  );
}
