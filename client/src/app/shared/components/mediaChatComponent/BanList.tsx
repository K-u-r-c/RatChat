import {
  Button,
  List,
  ListItem,
  ListItemText,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import { useMutation } from "@tanstack/react-query";
import type { ChatRoomBan } from "../../../../lib/types";
import agent from "../../../../lib/api/agent";

type Props = {
  chatRoomId: string;
  bans: ChatRoomBan[];
  canUnban: boolean;
};

export default function BanList({ chatRoomId, bans, canUnban }: Props) {
  const unban = useMutation({
    mutationFn: async (userId: string) => {
      await agent.post(`/chatRooms/${chatRoomId}/unban/${userId}`);
    },
  });

  return (
    <Paper sx={{ mt: 3, p: 2 }}>
      <Typography variant="h6" sx={{ mb: 2 }}>
        Banned users
      </Typography>

      {!bans || bans.length === 0 ? (
        <Typography color="text.secondary">No banned users.</Typography>
      ) : (
        <List dense>
          {bans.map((b) => (
            <ListItem
              key={b.userId}
              secondaryAction={
                <Stack direction="row" gap={1}>
                  <Button
                    size="small"
                    variant="outlined"
                    color="success"
                    disabled={!canUnban || unban.isPending}
                    onClick={() => unban.mutate(b.userId)}
                  >
                    Unban
                  </Button>
                </Stack>
              }
            >
              <ListItemText
                primary={b.user?.displayName}
                secondary={new Date(b.dateBanned).toLocaleString()}
              />
            </ListItem>
          ))}
        </List>
      )}
    </Paper>
  );
}
