import { Box, Typography, Paper, IconButton } from "@mui/material";
import { Download, InsertDriveFile, Code, Archive } from "@mui/icons-material";
import {
  convertTextToEmoji,
  formatMessageWithEmojis,
} from "../../../../lib/util/emojiUtils";
import type { BaseMessage } from "../../../../lib/types";
import React, { Fragment } from "react";
import Linkify from "linkify-react";

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
    const urlRegex = /((https?:\/\/|www\.)[^\s<]+)/gi;
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

  if (message.type === "Text" || !message.mediaUrl) {
    const formatted = formatMessageWithEmojis(message.body);
    return (
      <Typography
        sx={{
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
          fontSize: formatted.isLargeEmoji ? "2rem" : "inherit",
          lineHeight: formatted.isLargeEmoji ? 1.2 : "inherit",
        }}
      >
        <Linkify options={linkifyOptions}>{formatted.text}</Linkify>
      </Typography>
    );
  }

  const renderMessageBody = () => {
    if (message.body && message.body !== message.mediaOriginalFileName) {
      return (
        <Typography
          sx={{ whiteSpace: "pre-wrap", wordBreak: "break-word", mb: 1 }}
        >
          <Linkify options={linkifyOptions}>
            {convertTextToEmoji(message.body)}
          </Linkify>
        </Typography>
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
        <Typography sx={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
          {linkify(convertTextToEmoji(message.body))}
        </Typography>
      );
  }
}
