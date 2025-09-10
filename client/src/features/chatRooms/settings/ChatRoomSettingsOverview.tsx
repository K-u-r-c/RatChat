import { Box, Stack, Typography } from "@mui/material";
import { useChatRooms } from "../../../lib/hooks/useChatRooms";
import ChatRoomImageUpload from "../ChatRoomImageUpload";

type Props = { chatRoomId: string };

export default function ChatRoomSettingsOverview({ chatRoomId }: Props) {
  const { chatRoom } = useChatRooms(chatRoomId);

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h6">Server overview</Typography>
        <Typography variant="body2" color="text.secondary">
          Change the icon of this server.
        </Typography>
      </Box>

      <Box>
        <Typography variant="subtitle1" sx={{ mb: 1 }}>
          Server icon
        </Typography>
        {/* Show current image if exists */}
        {chatRoom?.imageUrl && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="caption" color="text.secondary">
              Current image:
            </Typography>
            <Box sx={{ mt: 1 }}>
              <img
                src={chatRoom.imageUrl}
                alt="Chat Room Icon"
                style={{
                  width: 96,
                  height: 96,
                  borderRadius: 12,
                  border: "1px solid #eee",
                  objectFit: "cover",
                }}
              />
            </Box>
          </Box>
        )}
        <ChatRoomImageUpload chatRoomId={chatRoomId} />
      </Box>
    </Stack>
  );
}
