import { AccessTime } from "@mui/icons-material";
import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  Typography,
} from "@mui/material";
import { Link } from "react-router";
import { formatDate } from "../../../lib/util/util";
import type { ChatRoom } from "../../../lib/types";
import AvatarPopover from "../../../app/shared/components/AvatarPopover";
import StatusIndicator from "../../../app/shared/components/StatusIndicator";

type Props = {
  chatRoom: ChatRoom;
};

export default function ChatRoomCard({ chatRoom }: Props) {
  const label = chatRoom.isAdmin ? "You are admin" : "You are member";
  const color = chatRoom.isAdmin ? "secondary" : "warning";

  return (
    <Card elevation={3} sx={{ borderRadius: 3 }}>
      <Box display="flex" alignItems="center" justifyContent="space-between">
        <CardHeader
          avatar={
            <Avatar
              src={chatRoom.adminImageUrl}
              sx={{ height: 80, width: 80 }}
              alt="Image of host"
            />
          }
          title={chatRoom.title}
          slotProps={{
            title: {
              fontWeight: "bold",
              fontSize: 20,
            },
          }}
          subheader={
            <>
              <Box display="flex" flexGrow={0} alignItems="center">
                <AccessTime sx={{ mr: 1 }} />
                <Typography variant="body2" noWrap>
                  {formatDate(chatRoom.date)}
                </Typography>
              </Box>
            </>
          }
        />
        <Box display="flex" flexDirection="column" gap={2} marginRight={2}>
          {chatRoom.isAdmin && (
            <Chip
              variant="outlined"
              label={label}
              color={color}
              sx={{ borderRadius: 2 }}
            />
          )}
        </Box>
      </Box>

      <CardContent sx={{ p: 0 }}>
        <Box
          display="flex"
          gap={2}
          sx={{ backgroundColor: "grey.200", py: 3, pl: 3 }}
        >
          {chatRoom.members.map((member) => (
            <Box key={member.id} sx={{ position: "relative" }}>
              <AvatarPopover profile={member} />
              {/* Status indicator overlay */}
              <Box
                sx={{
                  position: "absolute",
                  bottom: -2,
                  right: -2,
                  backgroundColor: "white",
                  borderRadius: "50%",
                  padding: "2px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <StatusIndicator
                  status={member.status || "Offline"}
                  size="small"
                />
              </Box>
            </Box>
          ))}
        </Box>
      </CardContent>

      <CardContent sx={{ pb: 2 }}>
        <Button
          component={Link}
          to={`/chat-rooms/${chatRoom.id}`}
          size="medium"
          variant="contained"
          sx={{
            display: "flex",
            justifySelf: "self-end",
            borderRadius: 3,
            mt: 2,
          }}
        >
          View
        </Button>
      </CardContent>
    </Card>
  );
}
