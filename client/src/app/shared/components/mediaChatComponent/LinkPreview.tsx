import { Box, Paper, Typography } from "@mui/material";
import { YouTube } from "@mui/icons-material";
import React from "react";

export interface LinkPreviewData {
  type: "youtube";
  originalUrl: string;
  embedUrl: string;
}

interface LinkPreviewProps {
  preview: LinkPreviewData;
}

const LinkPreview: React.FC<LinkPreviewProps> = ({ preview }) => {
  if (preview.type === "youtube") {
    return (
      <Paper
        variant="outlined"
        sx={{
          borderRadius: 2,
          overflow: "hidden",
          bgcolor: "background.paper",
          borderColor: "divider",
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            px: 1.5,
            py: 1,
            borderBottom: "1px solid",
            borderColor: "divider",
            bgcolor: "rgba(88, 101, 242, 0.08)",
          }}
        >
          <YouTube fontSize="small" sx={{ color: "#ff4e45" }} />
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            YouTube Preview
          </Typography>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ marginLeft: "auto" }}
          >
            youtube.com
          </Typography>
        </Box>
        <Box
          sx={{ position: "relative", paddingTop: "56.25%", bgcolor: "black" }}
        >
          <Box
            component="iframe"
            src={`${preview.embedUrl}?rel=0`}
            title="YouTube video preview"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            sx={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              border: 0,
            }}
          />
        </Box>
      </Paper>
    );
  }

  return null;
};

export default LinkPreview;
