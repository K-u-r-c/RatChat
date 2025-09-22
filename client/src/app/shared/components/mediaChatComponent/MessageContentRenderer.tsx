import { Box, Typography, Paper, IconButton } from "@mui/material";
import { Download, InsertDriveFile, Code, Archive } from "@mui/icons-material";
import {
  convertTextToEmoji,
  formatMessageWithEmojis,
} from "../../../../lib/util/emojiUtils";
import type { BaseMessage } from "../../../../lib/types";
import React, { Fragment } from "react";
import Linkify from "linkify-react";
import LinkPreview, { type LinkPreviewData } from "./LinkPreview";

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

function resolveLinkPreview(
  url: URL,
  normalized: string
): LinkPreviewData | null {
  const host = url.hostname.replace(/^www\./i, "");
  if (
    ["youtube.com", "youtu.be", "m.youtube.com", "music.youtube.com"].includes(
      host
    )
  ) {
    let videoId = url.searchParams.get("v");
    if (!videoId) {
      const segments = url.pathname.split("/").filter(Boolean);
      if (host === "youtu.be") {
        videoId = segments[0] || null;
      } else if (segments[0] === "shorts" || segments[0] === "embed") {
        videoId = segments[1] || null;
      }
    }
    if (!videoId) return null;
    return {
      type: "youtube",
      originalUrl: normalized,
      embedUrl: `https://www.youtube.com/embed/${videoId}`,
    };
  }
  return null;
}

function getLinkPreviewData(text?: string): LinkPreviewData | null {
  const urls = extractUrls(text);
  for (const raw of urls) {
    const normalized = normalizeRawUrl(raw);
    if (!normalized) continue;
    try {
      const parsed = new URL(normalized);
      const preview = resolveLinkPreview(parsed, normalized);
      if (preview) return preview;
    } catch {
      continue;
    }
  }
  return null;
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
      if (/^https?:\/\//i.test(href)) {
        nodes.push(
          <a
            key={`lnk-${idx}`}
            href={href}
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
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const commonProps = {
    sx: { maxWidth: "100%", borderRadius: 2, mt: 1 },
  };

  const linkPreview = getLinkPreviewData(message.body);

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
        {linkPreview && (
          <Box sx={{ mt: 1.25 }}>
            <LinkPreview preview={linkPreview} />
          </Box>
        )}
      </Box>
    );
  }

  const renderMessageBody = () => {
    if (message.body && message.body !== message.mediaOriginalFileName) {
      return (
        <Box sx={{ mb: linkPreview ? 1.5 : 1 }}>
          <Typography sx={textBaseSx}>
            <Linkify options={linkifyOptions}>
              {convertTextToEmoji(message.body)}
            </Linkify>
          </Typography>
          {linkPreview && (
            <Box sx={{ mt: 1.25 }}>
              <LinkPreview preview={linkPreview} />
            </Box>
          )}
        </Box>
      );
    }
    return null;
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
          {linkPreview && (
            <Box sx={{ mt: 1.25 }}>
              <LinkPreview preview={linkPreview} />
            </Box>
          )}
        </Box>
      );
  }
}
