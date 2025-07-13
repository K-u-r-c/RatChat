import { Box } from "@mui/material";

export default function ChatRoomMembersBar() {

  return (
    <Box
      sx={{
        width: '100%',
        p: 2,
        borderTop: "1px solid #eee",
        bgcolor: "background.paper",
        overflowX: "auto",
        zIndex: 1200,
        display: 'flex',
        alignItems: 'center',
        gap: 2,
      }}
    >
    </Box>
  );
}