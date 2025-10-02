import { Box, Typography, Paper, IconButton } from "@mui/material";
import { Download, InsertDriveFile, Code, Archive } from "@mui/icons-material";
import {
  convertTextToEmoji,
  formatMessageWithEmojis,
} from "../../../../lib/util/emojiUtils";
import type { BaseMessage } from "../../../../lib/types";
import React, { Fragment, useMemo } from "react";
import Linkify from "linkify-react";
import LinkPreview from "./LinkPreview";
import { useLinkPreview } from "../../../../lib/hooks/useLinkPreview";
import type { LinkPreviewData } from "../../../../lib/types/linkPreview";

const URL_PATTERN = /((https?:\/\/|www\.)[^\s<]+)/gi;

const linkTypographyStyles = {
  "& a": {
    color: "#d7ddff",
    textDecoration: "none",
    fontWeight: 600,
    borderBottom: "1px solid rgba(88, 101, 242, 0.45)",
    textUnderlineOffset: "4px",
    transition:
      "color 0.2s ease, border-color 0.2s ease, background-color 0.2s ease",
    borderRadius: 6,
    paddingInline: "2px",
  },
  "& a:hover": {
    color: "#ffffff",
    borderBottomColor: "rgba(88, 101, 242, 0.75)",
    backgroundColor: "rgba(88, 101, 242, 0.18)",
  },
  "& a:focus-visible": {
    outline: "2px solid rgba(88, 101, 242, 0.9)",
    outlineOffset: "2px",
  },
} as const;

const textBaseSx = {
  whiteSpace: "pre-wrap",
  wordBreak: "break-word",
  ...linkTypographyStyles,
} as const;

function normalizeRawUrl(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (/^www\./i.test(trimmed)) return `https://${trimmed}`;
  return null;
}

function extractUrls(text?: string): string[] {
  if (!text) return [];
  const regex = new RegExp(URL_PATTERN.source, "gi");
  const result: string[] = [];
  let match: RegExpExecArray | null;
  while ((match = regex.exec(text)) !== null) {
    result.push(match[0]);
  }
  return result;
}

function findPreviewUrl(text?: string): string | null {
  const urls = extractUrls(text);
  for (const candidate of urls) {
    const normalized = normalizeRawUrl(candidate);
    if (normalized) {
      return normalized;
    }
  }
  return null;
}

function getYouTubePreview(rawUrl: string | null): LinkPreviewData | null {
  if (!rawUrl) return null;
  const normalized = normalizeRawUrl(rawUrl) ?? rawUrl;

  try {
    const u = new URL(normalized);
    const host = u.hostname.replace(/^www\./i, "");
    const isYouTube =
      /(^|\.)youtube\.com$/i.test(host) ||
      /^youtu\.be$/i.test(host) ||
      /(^|\.)youtube-nocookie\.com$/i.test(host);
    if (!isYouTube) return null;

    let videoId: string | null = null;
    let embedUrl: string | null = null;

    if (/^youtu\.be$/i.test(host)) {
      videoId = u.pathname.split("/").filter(Boolean)[0] ?? null;
    }

    if (!videoId && /^shorts\//i.test(u.pathname.replace(/^\//, ""))) {
      const parts = u.pathname.split("/").filter(Boolean);
      videoId = parts[1] ?? null;
    }

    if (!videoId && /^\/embed\//i.test(u.pathname)) {
      const parts = u.pathname.split("/").filter(Boolean);
      videoId = parts[1] ?? null;
    }

    if (!videoId && /^\/live\//i.test(u.pathname)) {
      const parts = u.pathname.split("/").filter(Boolean);
      videoId = parts[1] ?? null;
    }

    if (!videoId && /^\/watch\/?$/i.test(u.pathname)) {
      videoId = u.searchParams.get("v");
    }

    if (videoId) {
      embedUrl = `https://www.youtube-nocookie.com/embed/${videoId}`;
    } else {
      // Playlist-only link
      const listId = u.searchParams.get("list");
      if (listId) {
        embedUrl = `https://www.youtube-nocookie.com/embed/videoseries?list=${listId}`;
      }
    }

    if (!embedUrl) return null;

    return {
      url: normalized,
      siteName: "YouTube",
      providerName: "YouTube",
      embedUrl,
      embedType: "video",
    };
  } catch {
    return null;
  }
}

interface MessageContentRendererProps {
  message: BaseMessage;
  onImageClick: (src: string) => void;
  onFileDownload: (url: string, filename: string) => void;
}

export default function MessageContentRenderer({
  message,
  onImageClick,
  onFileDownload,
}: MessageContentRendererProps) {
  const linkifyOptions = {
    target: "_blank",
    rel: "noopener noreferrer",
    className: undefined,
    attributes: () => ({
      rel: "noopener noreferrer",
      target: "_blank",
    }),
  };

  const linkify = (text: string) => {
    if (!text) return text;
    const urlRegex = new RegExp(URL_PATTERN.source, "gi");
    const nodes: (string | React.ReactNode)[] = [];
    let lastIndex = 0;

    const str = text;
    str.replace(urlRegex, (match, _g1, _g2, offset) => {
      const idx = offset as number;
      if (lastIndex < idx) {
        nodes.push(str.slice(lastIndex, idx));
      }
      const href = match;
      if (/^https?:\/\//i.test(href) || /^www\./i.test(href)) {
        const normalized = normalizeRawUrl(href);
        nodes.push(
          <a
            key={`lnk-${idx}`}
            href={normalized ?? href}
            target="_blank"
            rel="noopener noreferrer"
          >
            {match}
          </a>
        );
      } else {
        nodes.push(match);
      }
      lastIndex = idx + match.length;
      return match;
    });
    if (lastIndex < str.length) {
      nodes.push(str.slice(lastIndex));
    }
    return nodes.length
      ? nodes.map((n, i) => <Fragment key={i}>{n}</Fragment>)
      : str;
  };

  const previewUrl = useMemo(
    () => findPreviewUrl(message.body),
    [message.body]
  );
  const youTubePreview = useMemo(
    () => getYouTubePreview(previewUrl),
    [previewUrl]
  );
  const { data: fetchedPreview } = useLinkPreview(previewUrl);
  const effectivePreview = youTubePreview ?? fetchedPreview;

  const previewNode = effectivePreview ? (
    <Box sx={{ mt: 1.25 }}>
      <LinkPreview preview={effectivePreview} />
    </Box>
  ) : null;

  const getFileIcon = (fileName: string) => {
    const extension = fileName.toLowerCase().split(".").pop() || "";

    const codeExtensions = [
      "js",
      "ts",
      "tsx",
      "jsx",
      "py",
      "java",
      "cs",
      "cpp",
      "c",
      "h",
      "hpp",
      "php",
      "rb",
      "go",
      "rs",
      "swift",
      "kt",
      "scala",
      "yml",
      "yaml",
      "json",
      "xml",
      "html",
      "css",
      "md",
      "sql",
      "sh",
      "bat",
      "ps1",
      "dockerfile",
    ];

    const archiveExtensions = ["zip", "rar", "7z", "gz", "tar", "bz2"];

    if (codeExtensions.includes(extension)) {
      return <Code color="primary" />;
    }

    if (archiveExtensions.includes(extension)) {
      return <Archive color="secondary" />;
    }

    return <InsertDriveFile color="primary" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  const commonProps = {
    sx: { maxWidth: "100%", borderRadius: 2, mt: 1 },
  };

  if (message.type === "Text" || !message.mediaUrl) {
    const formatted = formatMessageWithEmojis(message.body || "");
    const largeEmojiStyles = formatted.isLargeEmoji
      ? { fontSize: "2rem", lineHeight: 1.2 }
      : {};

    return (
      <Box>
        <Typography sx={{ ...textBaseSx, ...largeEmojiStyles }}>
          <Linkify options={linkifyOptions}>{formatted.text}</Linkify>
        </Typography>
        {previewNode}
      </Box>
    );
  }

  const renderMessageBody = () => {
    if (message.body && message.body !== message.mediaOriginalFileName) {
      return (
        <Box sx={{ mb: effectivePreview ? 1.5 : 1 }}>
          <Typography sx={textBaseSx}>
            <Linkify options={linkifyOptions}>
              {convertTextToEmoji(message.body)}
            </Linkify>
          </Typography>
          {previewNode}
        </Box>
      );
    }
    return previewNode;
  };

  switch (message.type) {
    case "Image":
      return (
        <Box>
          {renderMessageBody()}
          <img
            {...commonProps}
            src={message.mediaUrl}
            alt={message.mediaOriginalFileName || "Image"}
            style={{ maxHeight: 300, cursor: "pointer" }}
            onClick={() => onImageClick(message.mediaUrl!)}
          />
        </Box>
      );

    case "Video":
      return (
        <Box>
          {renderMessageBody()}
          <video
            {...commonProps}
            controls
            style={{ maxHeight: 300 }}
            src={message.mediaUrl}
          >
            Your browser does not support the video tag.
          </video>
        </Box>
      );

    case "Audio":
      return (
        <Box>
          {renderMessageBody()}
          <audio {...commonProps} controls src={message.mediaUrl}>
            Your browser does not support the audio tag.
          </audio>
        </Box>
      );

    case "Document":
      return (
        <Box>
          {renderMessageBody()}
          <Paper
            sx={{
              p: 2,
              mt: 1,
              display: "flex",
              alignItems: "center",
              gap: 2,
              cursor: "pointer",
              "&:hover": { backgroundColor: "action.hover" },
            }}
            onClick={() =>
              onFileDownload(message.mediaUrl!, message.mediaOriginalFileName!)
            }
          >
            {getFileIcon(message.mediaOriginalFileName || "")}
            <Box sx={{ flex: 1 }}>
              <Typography variant="body2" fontWeight="bold">
                {message.mediaOriginalFileName}
              </Typography>
              {message.mediaFileSize && (
                <Typography variant="caption" color="text.secondary">
                  {formatFileSize(message.mediaFileSize)}
                </Typography>
              )}
            </Box>
            <IconButton size="small" color="primary">
              <Download />
            </IconButton>
          </Paper>
        </Box>
      );

    default:
      return (
        <Box>
          <Typography sx={textBaseSx}>
            {linkify(convertTextToEmoji(message.body || ""))}
          </Typography>
          {previewNode}
        </Box>
      );
  }
}
