import {Box, Typography} from "@mui/material";
import {useAccount} from "../../../lib/hooks/useAccount";
import {useVoiceChannel} from "../../../lib/hooks/useVoiceChannel";

type Props = {
  chatRoomId: string;
};

export default function ChatRoomScreenSharePanel({chatRoomId}: Props) {
  const {currentUser} = useAccount();
  const voice = useVoiceChannel(chatRoomId, currentUser?.id);

  const hasRemoteStreams = voice.remoteStreams.length > 0;

  return (
    <Box
      sx={{
        flex: 1,
        width: "100%",
        minHeight: 0,
        height: "100%",
        bgcolor: "#0f1014",
        borderRadius: 1,
        border: "1px dashed",
        borderColor: "rgba(255,255,255,0.08)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        gap: 1.5,
        px: 4,
        textAlign: "center",
      }}
    >
      {hasRemoteStreams ? (
        <Typography variant="body1" color="text.secondary">
          Screen sharing streams will appear here soon.
        </Typography>
      ) : (
        <>
          <Typography
            variant="h5"
            sx={{color: "text.secondary", fontWeight: 600}}
          >
            Screen Share Ready
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Once someone shares their screen, the stream will be shown in this
            panel.
          </Typography>
        </>
      )}
    </Box>
  );
}