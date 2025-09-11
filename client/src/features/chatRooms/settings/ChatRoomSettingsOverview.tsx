import { Box, Stack, Typography } from "@mui/material";
import ChatRoomImageUpload from "../ChatRoomImageUpload";

type Props = { chatRoomId: string };

export default function ChatRoomSettingsOverview({ chatRoomId }: Props) {
  return (
    <Stack sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <Box>
        <Typography variant="h6" gutterBottom>
          Chat room image
        </Typography>
        <Box
          sx={{
            display: "flex",
            flexDirection: "row",
            alignItems: "flex-start",
            gap: 4,
            width: "100%",
          }}
        >
          <ChatRoomImageUpload chatRoomId={chatRoomId} />
        </Box>
      </Box>
    </Stack>
  );
}
