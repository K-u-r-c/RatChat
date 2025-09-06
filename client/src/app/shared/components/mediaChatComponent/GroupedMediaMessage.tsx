import { Box, Typography } from "@mui/material";
import type { BaseMessage } from "../../../../lib/types";
import Linkify from "linkify-react";
import { convertTextToEmoji } from "../../../../lib/util/emojiUtils";

type Props = {
  type: "Image" | "Video";
  messages: BaseMessage[];
  onImageClick: (src: string) => void;
};

export default function GroupedMediaMessage({ type, messages, onImageClick }: Props) {
  const first = messages[0];
  const showBody = first.body && first.body !== first.mediaOriginalFileName;

  const linkifyOptions = {
    target: "_blank",
    rel: "noopener noreferrer",
    className: undefined,
    attributes: () => ({ rel: "noopener noreferrer", target: "_blank" }),
  };

  return (
    <Box>
      {showBody && (
        <Typography sx={{ whiteSpace: "pre-wrap", wordBreak: "break-word", mb: 1 }}>
          <Linkify options={linkifyOptions}>{convertTextToEmoji(first.body)}</Linkify>
        </Typography>
      )}

      <Box
        sx={{
          display: "grid",
          gap: 1,
          gridTemplateColumns: {
            xs: "repeat(2, 1fr)",
            sm: "repeat(3, 1fr)",
            md: "repeat(4, 1fr)",
          },
        }}
      >
        {messages.map((m) => (
          <Box key={m.id} sx={{ borderRadius: 2, overflow: "hidden" }}>
            {type === "Image" ? (
              <img
                src={m.mediaUrl || ""}
                alt={m.mediaOriginalFileName || "image"}
                style={{ width: "100%", height: 180, objectFit: "cover", cursor: "pointer" }}
                onClick={() => m.mediaUrl && onImageClick(m.mediaUrl)}
              />
            ) : (
              <video
                src={m.mediaUrl || ""}
                style={{ width: "100%", height: 200, objectFit: "cover" }}
                controls
              />
            )}
          </Box>
        ))}
      </Box>
    </Box>
  );
}

