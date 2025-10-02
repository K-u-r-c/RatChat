import { Box, Paper, Typography } from "@mui/material";
import React from "react";
import type { LinkPreviewData } from "../../../../lib/types/linkPreview";

type Props = {
  preview: LinkPreviewData;
};

const LinkPreview: React.FC<Props> = ({ preview }) => {
  const hostname = React.useMemo(() => {
    try {
      const parsed = new URL(preview.url);
      return parsed.hostname.startsWith("www.")
        ? parsed.hostname.slice(4)
        : parsed.hostname;
    } catch {
      return preview.siteName ?? preview.url;
    }
  }, [preview.siteName, preview.url]);

  const title = preview.title ?? preview.siteName ?? hostname;
  const description = preview.description?.trim();
  const provider = [preview.providerName, preview.authorName]
    .filter(Boolean)
    .join(" • ");

  const aspectRatio = React.useMemo(() => {
    if (
      preview.width &&
      preview.height &&
      preview.width > 0 &&
      preview.height > 0
    ) {
      return `${(preview.height / preview.width) * 100}%`;
    }
    return "56.25%";
  }, [preview.height, preview.width]);

  const isDirectVideoFile = React.useMemo(() => {
    const url = preview.embedUrl;
    if (!url) return false;
    try {
      const u = new URL(url);
      return /\.(mp4|m4v|webm|ogv|mov|m3u8)(?:$|\?)/i.test(u.pathname);
    } catch {
      return /\.(mp4|m4v|webm|ogv|mov|m3u8)(?:$|\?)/i.test(url);
    }
  }, [preview.embedUrl]);

  const isKnownIframeProvider = React.useMemo(() => {
    const url = preview.embedUrl;
    if (!url) return false;
    try {
      const host = new URL(url).hostname.replace(/^www\./i, "");
      return /(youtube\.com|youtu\.be|youtube-nocookie\.com|vimeo\.com|player\.vimeo\.com|twitch\.tv|spotify\.com|soundcloud\.com)/i.test(
        host
      );
    } catch {
      return false;
    }
  }, [preview.embedUrl]);

  const embedNode = React.useMemo(() => {
    const embedUrl = preview.embedUrl;
    if (!embedUrl) return null;

    const shouldUseIframe =
      isKnownIframeProvider ||
      !isDirectVideoFile ||
      preview.embedType === "iframe";

    if (
      !shouldUseIframe &&
      (preview.embedType === "video" || isDirectVideoFile)
    ) {
      return (
        <Box
          component="video"
          controls
          preload="metadata"
          src={embedUrl}
          sx={{
            width: "100%",
            maxHeight: 360,
            display: "block",
            backgroundColor: "rgba(0,0,0,0.12)",
            borderRadius: 8,
          }}
        />
      );
    }

    return (
      <Box
        sx={{
          position: "relative",
          paddingTop: aspectRatio,
          bgcolor: "rgba(0,0,0,0.12)",
          borderRadius: 2,
          overflow: "hidden",
        }}
      >
        <Box
          component="iframe"
          src={embedUrl}
          title={title ?? hostname}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          loading="lazy"
          sx={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            border: 0,
          }}
        />
      </Box>
    );
  }, [
    aspectRatio,
    hostname,
    isDirectVideoFile,
    isKnownIframeProvider,
    preview.embedType,
    preview.embedUrl,
    title,
  ]);

  return (
    <Paper
      variant="outlined"
      sx={{
        borderRadius: 2,
        overflow: "hidden",
        bgcolor: "background.paper",
        borderColor: "divider",
        display: "flex",
        flexDirection: "column",
        gap: 0.5,
      }}
    >
      {embedNode}

      {!embedNode && preview.imageUrl && (
        <Box
          component="img"
          src={preview.imageUrl}
          alt={title ?? hostname}
          loading="lazy"
          sx={{
            width: "100%",
            maxHeight: 220,
            objectFit: "cover",
            backgroundColor: "rgba(0,0,0,0.12)",
          }}
          onError={(event: React.SyntheticEvent<HTMLImageElement>) => {
            event.currentTarget.remove();
          }}
        />
      )}

      <Box
        sx={{
          px: 1.5,
          pt: 1.25,
          display: "flex",
          alignItems: "center",
          gap: 1,
        }}
      >
        {preview.faviconUrl && (
          <Box
            component="img"
            src={preview.faviconUrl}
            alt=""
            loading="lazy"
            sx={{
              width: 18,
              height: 18,
              borderRadius: "50%",
              objectFit: "contain",
            }}
            onError={(event: React.SyntheticEvent<HTMLImageElement>) => {
              event.currentTarget.style.display = "none";
            }}
          />
        )}
        <Typography variant="caption" color="text.secondary">
          {preview.siteName ?? hostname}
        </Typography>
      </Box>

      <Box
        sx={{
          px: 1.5,
          pb: 1.5,
          display: "flex",
          flexDirection: "column",
          gap: 0.5,
        }}
      >
        {title && (
          <Typography
            component="a"
            href={preview.url}
            target="_blank"
            rel="noopener noreferrer"
            variant="subtitle2"
            sx={{
              color: "inherit",
              textDecoration: "none",
              fontWeight: 600,
              lineHeight: 1.3,
              ":hover": {
                textDecoration: "underline",
              },
            }}
          >
            {title}
          </Typography>
        )}

        {description && (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              display: "-webkit-box",
              overflow: "hidden",
              WebkitLineClamp: 3,
              WebkitBoxOrient: "vertical",
            }}
          >
            {description}
          </Typography>
        )}

        {provider && (
          <Typography variant="caption" color="text.secondary">
            {provider}
          </Typography>
        )}
      </Box>
    </Paper>
  );
};

export default LinkPreview;
