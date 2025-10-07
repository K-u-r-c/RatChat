import { type JSX, useMemo, useState } from "react";
import {
  Box,
  Button,
  Chip,
  Collapse,
  Container,
  CssBaseline,
  Divider,
  Grid,
  Link,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import {
  ArrowBack,
  BugReport,
  CheckCircle,
  Download as DownloadIcon,
  KeyboardArrowDown,
  KeyboardArrowUp,
  LaptopMac,
  LaptopWindows,
  OpenInNew,
  Terminal,
} from "@mui/icons-material";
import { useNavigate } from "react-router";

const DOWNLOAD_BASE_URL =
  import.meta.env.VITE_DESKTOP_DOWNLOAD_BASE_URL ??
  "https://downloads.ratchat.app";

type PlatformId = "windows" | "mac" | "linux";

const PLATFORM_LABELS: Record<PlatformId, string> = {
  windows: "Windows",
  mac: "macOS",
  linux: "Linux",
};

type DownloadOption = {
  id: PlatformId;
  label: string;
  description: string;
  icon: JSX.Element;
  filename: string;
  size?: string;
  footnote?: string;
  extras?: Array<{ label: string; filename: string }>;
};

type ReleaseEntry = {
  version: string;
  releaseDate: string;
  features: string[];
  fixes: string[];
};

const releaseHistory: ReleaseEntry[] = [
  {
    version: "0.1.0",
    releaseDate: "October 1, 2025",
    features: [
      "New confirm prompt for important actions",
      "System sound sharing for desktop builds on Windows and MacOS, experimental for Linux",
    ],
    fixes: [
      "Fixed dissapearing chat room profile images",
      "Fixed errors during chat room joining",
    ],
  },
];

const latestVersion = releaseHistory[0]?.version ?? "0.0.0";

const downloadOptions: DownloadOption[] = [
  {
    id: "windows",
    label: "Windows Installer",
    description: "Compatible with Windows 10 & 11 (x64)",
    icon: <LaptopWindows sx={{ fontSize: 36 }} />,
    filename: `RatChat-Setup-${latestVersion}.exe`,
    size: "117 MB",
    footnote: "Supports auto-updates and background patching",
    extras: [
      {
        label: "Portable ZIP",
        filename: `RatChat-Setup-${latestVersion}.zip`,
      },
    ],
  },
  {
    id: "mac",
    label: "macOS Universal DMG",
    description: "Works on Apple silicon & Intel Macs (13.0+)",
    icon: <LaptopMac sx={{ fontSize: 36 }} />,
    filename: `RatChat-${latestVersion}-mac.dmg`,
    size: "124 MB",
    footnote: "Notarized and signed — drag & drop into Applications",
    extras: [
      {
        label: "ZIP Archive",
        filename: `RatChat-${latestVersion}-mac.zip`,
      },
    ],
  },
  {
    id: "linux",
    label: "Linux Builds",
    description: "AppImage + DEB packages (x64)",
    icon: <Terminal sx={{ fontSize: 36 }} />,
    filename: `RatChat-${latestVersion}.AppImage`,
    size: "116 MB",
    footnote: "Make executable then run — integrates with most desktops",
    extras: [
      {
        label: "Debian / Ubuntu",
        filename: `RatChat-${latestVersion}.deb`,
      },
    ],
  },
];

function detectPlatform(): PlatformId | null {
  if (typeof navigator === "undefined") return null;

  const ua = navigator.userAgent || "";
  const platform =
    (navigator as Navigator & { userAgentData?: { platform?: string } })
      .userAgentData?.platform ??
    navigator.platform ??
    "";

  if (/windows|win32/i.test(platform) || /windows/i.test(ua)) {
    return "windows";
  }

  // Treat iPadOS 13+ desktop mode as macOS for downloads
  if (
    /mac/i.test(platform) ||
    (/macintosh|mac os x/i.test(ua) && !/iphone|ipad|ipod/i.test(ua))
  ) {
    return "mac";
  }

  if (/linux/i.test(platform) || (/linux/i.test(ua) && !/android/i.test(ua))) {
    return "linux";
  }

  return null;
}

function buildDownloadUrl(filename: string) {
  return `${DOWNLOAD_BASE_URL.replace(/\/$/, "")}/${filename}`;
}

export default function DownloadPage() {
  const [showAllDownloads, setShowAllDownloads] = useState(false);
  const navigate = useNavigate();

  const detectedPlatform = useMemo(() => detectPlatform(), []);

  const primaryOption = useMemo(() => {
    if (!detectedPlatform) return null;
    return (
      downloadOptions.find((option) => option.id === detectedPlatform) ?? null
    );
  }, [detectedPlatform]);

  return (
    <>
      <CssBaseline />
      <Box
        sx={{
          bgcolor:
            "linear-gradient(160deg, #1c1d21 0%, #101117 45%, #1f2350 100%)",
          minHeight: "100vh",
          py: { xs: 8, md: 12 },
          color: "text.primary",
        }}
      >
        <Container maxWidth="lg">
          <Box sx={{ mb: { xs: 3, md: 4 } }}>
            <Button
              variant="text"
              color="inherit"
              startIcon={<ArrowBack />}
              onClick={() => navigate(-1)}
              sx={{
                color: "rgba(212,216,255,0.8)",
                textTransform: "none",
                fontWeight: 600,
                px: 0,
              }}
            >
              Back
            </Button>
          </Box>
          <HeroSection
            detectedPlatform={detectedPlatform}
            primaryOption={primaryOption}
          />
          <Divider
            sx={{
              my: { xs: 6, md: 10 },
              borderColor: "rgba(255,255,255,0.08)",
            }}
          />
          <WhatIsRatChat />
          <Divider
            sx={{
              my: { xs: 6, md: 10 },
              borderColor: "rgba(255,255,255,0.08)",
            }}
          />
          <DownloadOptions
            primaryOption={primaryOption}
            showAllDownloads={showAllDownloads}
            onToggle={() => setShowAllDownloads((prev) => !prev)}
          />
          <Divider
            sx={{
              my: { xs: 6, md: 10 },
              borderColor: "rgba(255,255,255,0.08)",
            }}
          />
          <ReleaseHighlights />
        </Container>
      </Box>
    </>
  );
}

type HeroSectionProps = {
  detectedPlatform: PlatformId | null;
  primaryOption: DownloadOption | null;
};

function HeroSection({ detectedPlatform, primaryOption }: HeroSectionProps) {
  return (
    <Grid
      container
      spacing={{ xs: 4, md: 6 }}
      alignItems="center"
      sx={{
        background:
          "linear-gradient(135deg, rgba(34,36,43,0.92), rgba(18,20,32,0.88))",
        borderRadius: 6,
        px: { xs: 4, md: 8 },
        py: { xs: 6, md: 10 },
        boxShadow: "0 40px 120px rgba(11,14,40,0.35)",
        border: "1px solid rgba(138, 147, 255, 0.18)",
      }}
    >
      <Grid size={{ xs: 12, md: 7 }}>
        <Stack spacing={3}>
          <Chip
            label={
              detectedPlatform
                ? `Looking for ${PLATFORM_LABELS[detectedPlatform]}? We've got you covered.`
                : "Multiplatform • Fast • Encrypted"
            }
            color="primary"
            variant="outlined"
            sx={{
              alignSelf: "flex-start",
              fontWeight: 600,
              fontSize: 14,
              textTransform: "uppercase",
              letterSpacing: 1.2,
              borderRadius: 2,
            }}
          />
          <Typography
            component="h1"
            variant="h2"
            sx={{ fontWeight: 700, lineHeight: 1.1 }}
          >
            Chat faster with the RatChat desktop app
          </Typography>
          <Typography
            variant="subtitle1"
            sx={{ color: "rgba(255,255,255,0.72)", maxWidth: 520 }}
          >
            Experience RatChat with native notifications, streamlined keyboard
            support, and deep integration for calls. Built with privacy in mind
            and optimized for low-latency.
          </Typography>
          <Stack
            direction="row"
            spacing={2}
            alignItems="center"
            flexWrap="wrap"
          >
            <PrimaryDownloadButton option={primaryOption} />
            <Typography
              variant="body2"
              sx={{
                color: "rgba(255,255,255,0.6)",
                display: "inline-flex",
                gap: 1,
              }}
            >
              Latest version &nbsp;
              <Chip
                size="small"
                label={`v${latestVersion}`}
                sx={{
                  bgcolor: "rgba(88,101,242,0.2)",
                  color: "#d4d8ff",
                  fontWeight: 600,
                }}
              />
            </Typography>
          </Stack>
        </Stack>
      </Grid>
      <Grid size={{ xs: 12, md: 5 }}>
        <Paper
          elevation={0}
          sx={{
            p: 4,
            borderRadius: 5,
            bgcolor: "rgba(21,22,29,0.9)",
            border: "1px solid rgba(255,255,255,0.05)",
            display: "flex",
            flexDirection: "column",
            gap: 3,
          }}
        >
          <Stack spacing={1.5}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Why desktop?
            </Typography>
            <Stack spacing={1.2}>
              {desktopBenefits.map((benefit) => (
                <Stack
                  key={benefit.title}
                  direction="row"
                  spacing={2}
                  alignItems="flex-start"
                >
                  <Box
                    sx={{
                      width: 36,
                      height: 36,
                      borderRadius: 12,
                      bgcolor: "rgba(88,101,242,0.15)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {benefit.icon}
                  </Box>
                  <Box>
                    <Typography sx={{ fontWeight: 600 }}>
                      {benefit.title}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{ color: "rgba(255,255,255,0.65)" }}
                    >
                      {benefit.description}
                    </Typography>
                  </Box>
                </Stack>
              ))}
            </Stack>
          </Stack>
        </Paper>
      </Grid>
    </Grid>
  );
}

const desktopBenefits = [
  {
    title: "Stay focused",
    description:
      "Dedicated desktop notifications, badge counts, and quick reply shortcuts.",
    icon: <CheckCircle sx={{ color: "#5865f2" }} fontSize="small" />,
  },
  {
    title: "True low-latency",
    description:
      "Optimized voice and screen share pipeline tuned for long-lived sessions.",
    icon: <CheckCircle sx={{ color: "#5865f2" }} fontSize="small" />,
  },
  {
    title: "Secure by default",
    description:
      "Encrypted storage on disk with automatic session locking on idle.",
    icon: <CheckCircle sx={{ color: "#5865f2" }} fontSize="small" />,
  },
];

type PrimaryDownloadButtonProps = {
  option: DownloadOption | null;
};

function PrimaryDownloadButton({ option }: PrimaryDownloadButtonProps) {
  if (!option) {
    return (
      <Button
        size="large"
        variant="contained"
        color="primary"
        href={buildDownloadUrl(downloadOptions[0].filename)}
        startIcon={<DownloadIcon />}
      >
        Download for desktop
      </Button>
    );
  }

  return (
    <Button
      size="large"
      variant="contained"
      color="primary"
      href={buildDownloadUrl(option.filename)}
      startIcon={<DownloadIcon />}
    >
      Download for {PLATFORM_LABELS[option.id]}
    </Button>
  );
}

function WhatIsRatChat() {
  return (
    <Grid container spacing={{ xs: 4, md: 6 }} alignItems="stretch">
      <Grid size={{ xs: 12, md: 5 }}>
        <Typography component="h2" variant="h4" sx={{ fontWeight: 700, mb: 2 }}>
          What is RatChat?
        </Typography>
        <Typography variant="body1" sx={{ color: "rgba(255,255,255,0.7)" }}>
          RatChat is a discord like text and voice communicator designed for
          groups of friends and small communities. We balance modern
          collaboration features with a focus on trust, transparency, and
          delightful details. Join real-time chat rooms, hop into encrypted
          direct messages, and keep your conversations synced across web and
          desktop.
        </Typography>
      </Grid>
      <Grid size={{ xs: 12, md: 7 }}>
        <Paper
          elevation={0}
          sx={{
            p: { xs: 4, md: 5 },
            borderRadius: 5,
            bgcolor: "rgba(19,20,27,0.85)",
            border: "1px solid rgba(255,255,255,0.05)",
          }}
        >
          <Stack spacing={3}>
            {ratchatHighlights.map((highlight) => (
              <Stack
                key={highlight.title}
                direction="row"
                spacing={3}
                alignItems="flex-start"
              >
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: 16,
                    bgcolor: "rgba(88,101,242,0.2)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "primary.main",
                  }}
                >
                  {highlight.icon}
                </Box>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.8 }}>
                    {highlight.title}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{ color: "rgba(255,255,255,0.65)" }}
                  >
                    {highlight.description}
                  </Typography>
                </Box>
              </Stack>
            ))}
          </Stack>
        </Paper>
      </Grid>
    </Grid>
  );
}

const ratchatHighlights = [
  {
    title: "Encrypted where it matters",
    description:
      "Message bodies are encrypted at rest with AES-256-GCM and optional end-to-end direct chats.",
    icon: <CheckCircle sx={{ color: "#d1d7ff" }} fontSize="small" />,
  },
  {
    title: "Real-time by design",
    description:
      "SignalR-powered updates keep chats, presence, and voice status instantly in sync.",
    icon: <CheckCircle sx={{ color: "#d1d7ff" }} fontSize="small" />,
  },
  {
    title: "Crafted for teams",
    description:
      "Role-based permissions, channel threads, and focused notifications help teams stay organized.",
    icon: <CheckCircle sx={{ color: "#d1d7ff" }} fontSize="small" />,
  },
];

type DownloadOptionsProps = {
  primaryOption: DownloadOption | null;
  showAllDownloads: boolean;
  onToggle: () => void;
};

function DownloadOptions({
  primaryOption,
  showAllDownloads,
  onToggle,
}: DownloadOptionsProps) {
  return (
    <Stack spacing={3}>
      <Typography component="h2" variant="h4" sx={{ fontWeight: 700 }}>
        Choose your build
      </Typography>
      <Typography variant="body1" sx={{ color: "rgba(255,255,255,0.65)" }}>
        We detected {primaryOption ? `${primaryOption.label}.` : "your device."}{" "}
        Need something else? You can grab installers for every supported
        platform below.
      </Typography>
      <Grid container spacing={3}>
        {downloadOptions.map((option) => (
          <Grid key={option.id} size={{ xs: 12, md: 4 }}>
            <DownloadCard
              option={option}
              highlight={primaryOption?.id === option.id}
            />
          </Grid>
        ))}
      </Grid>
      <Box>
        <Button
          variant="text"
          color="inherit"
          endIcon={
            showAllDownloads ? <KeyboardArrowUp /> : <KeyboardArrowDown />
          }
          onClick={onToggle}
          sx={{ color: "rgba(212,216,255,0.8)", fontWeight: 600 }}
        >
          {showAllDownloads
            ? "Hide additional formats"
            : "See other download formats"}
        </Button>
        <Collapse in={showAllDownloads} timeout="auto" unmountOnExit>
          <Paper
            elevation={0}
            sx={{
              mt: 3,
              p: 3,
              borderRadius: 4,
              bgcolor: "rgba(18,19,26,0.9)",
              border: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1.5 }}>
              Additional downloads
            </Typography>
            <Stack spacing={1.5}>
              {downloadOptions.flatMap(
                (option) =>
                  option.extras?.map((extra) => (
                    <Stack
                      key={`${option.id}-${extra.label}`}
                      direction={{ xs: "column", sm: "row" }}
                      spacing={1.5}
                      justifyContent="space-between"
                      sx={{
                        p: { xs: 1.5, sm: 2 },
                        borderRadius: 2,
                        bgcolor: "rgba(255,255,255,0.02)",
                      }}
                    >
                      <Stack>
                        <Typography sx={{ fontWeight: 600 }}>
                          {extra.label}
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{ color: "rgba(255,255,255,0.6)" }}
                        >
                          {option.label}
                        </Typography>
                      </Stack>
                      <Link
                        href={buildDownloadUrl(extra.filename)}
                        underline="none"
                        sx={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 1,
                          color: "primary.main",
                          fontWeight: 600,
                        }}
                      >
                        Download <OpenInNew sx={{ fontSize: 18 }} />
                      </Link>
                    </Stack>
                  )) ?? [],
              )}
            </Stack>
          </Paper>
        </Collapse>
      </Box>
    </Stack>
  );
}

type DownloadCardProps = {
  option: DownloadOption;
  highlight: boolean;
};

function DownloadCard({ option, highlight }: DownloadCardProps) {
  return (
    <Paper
      elevation={0}
      sx={{
        height: "100%",
        p: 3,
        borderRadius: 4,
        bgcolor: highlight ? "rgba(88,101,242,0.12)" : "rgba(19,20,27,0.85)",
        border: highlight
          ? "1px solid rgba(138,147,255,0.45)"
          : "1px solid rgba(255,255,255,0.05)",
        transition: "transform 0.2s ease, box-shadow 0.2s ease",
        "&:hover": {
          transform: "translateY(-4px)",
          boxShadow: "0 24px 60px rgba(10,12,30,0.35)",
        },
        display: "flex",
        flexDirection: "column",
        gap: 2.5,
      }}
    >
      <Stack direction="row" spacing={2} alignItems="center">
        <Box
          sx={{
            width: 52,
            height: 52,
            borderRadius: 18,
            bgcolor: "rgba(88,101,242,0.2)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "primary.main",
          }}
        >
          {option.icon}
        </Box>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            {option.label}
          </Typography>
          <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.6)" }}>
            {option.description}
          </Typography>
        </Box>
      </Stack>
      <Stack spacing={1.2}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <DownloadIcon sx={{ color: "rgba(255,255,255,0.5)" }} />
          <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.7)" }}>
            {option.filename}
          </Typography>
        </Stack>
        {option.size && (
          <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.5)" }}>
            Approx. {option.size}
          </Typography>
        )}
        {option.footnote && (
          <Typography
            variant="caption"
            sx={{ color: "rgba(255,255,255,0.45)" }}
          >
            {option.footnote}
          </Typography>
        )}
      </Stack>
      <Button
        variant={highlight ? "contained" : "outlined"}
        color="primary"
        href={buildDownloadUrl(option.filename)}
        startIcon={<DownloadIcon />}
        sx={{ mt: "auto", fontWeight: 600 }}
      >
        Download
      </Button>
    </Paper>
  );
}

function ReleaseHighlights() {
  return (
    <Stack spacing={3.5}>
      <Typography component="h2" variant="h4" sx={{ fontWeight: 700 }}>
        Release notes
      </Typography>
      <Typography
        variant="body1"
        sx={{ color: "rgba(255,255,255,0.65)", maxWidth: 720 }}
      >
        Every RatChat release ships with improvements driven by our community.
        Catch up on what changed recently and what to expect when you update.
      </Typography>
      <Stack spacing={3}>
        {releaseHistory.map((entry) => (
          <Paper
            key={entry.version}
            elevation={0}
            sx={{
              p: { xs: 3, md: 4 },
              borderRadius: 4,
              bgcolor: "rgba(19,20,27,0.88)",
              border: "1px solid rgba(255,255,255,0.05)",
            }}
          >
            <Stack spacing={2.5}>
              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={1.5}
                justifyContent="space-between"
              >
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  RatChat {entry.version}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ color: "rgba(255,255,255,0.5)" }}
                >
                  Released {entry.releaseDate}
                </Typography>
              </Stack>
              <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Typography
                    sx={{
                      fontWeight: 600,
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                    }}
                  >
                    <CheckCircle sx={{ color: "#7dd6ff" }} fontSize="small" />
                    New features
                  </Typography>
                  <Stack
                    component="ul"
                    spacing={1.2}
                    sx={{ m: 0, mt: 1.5, pl: 2.5 }}
                  >
                    {entry.features.map((feature) => (
                      <Typography
                        key={feature}
                        component="li"
                        variant="body2"
                        sx={{ color: "rgba(255,255,255,0.68)" }}
                      >
                        {feature}
                      </Typography>
                    ))}
                  </Stack>
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Typography
                    sx={{
                      fontWeight: 600,
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                    }}
                  >
                    <BugReport sx={{ color: "#ffa392" }} fontSize="small" />
                    Bug fixes & polish
                  </Typography>
                  <Stack
                    component="ul"
                    spacing={1.2}
                    sx={{ m: 0, mt: 1.5, pl: 2.5 }}
                  >
                    {entry.fixes.map((fix) => (
                      <Typography
                        key={fix}
                        component="li"
                        variant="body2"
                        sx={{ color: "rgba(255,255,255,0.68)" }}
                      >
                        {fix}
                      </Typography>
                    ))}
                  </Stack>
                </Grid>
              </Grid>
            </Stack>
          </Paper>
        ))}
      </Stack>
    </Stack>
  );
}
