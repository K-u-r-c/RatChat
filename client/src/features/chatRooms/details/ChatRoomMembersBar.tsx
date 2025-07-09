import { Box, Avatar, Typography, Chip } from "@mui/material";
import { useChatRooms } from "../../../lib/hooks/useChatRooms";
import { useChatRoomRolesRealtime } from "../../../lib/hooks/useChatRoomRolesRealtime";
import { useParams } from "react-router";
import { useEffect, useState } from "react";

export default function ChatRoomMembersBar() {
  const { id } = useParams();
  const { chatRoom } = useChatRooms(id);
  const { roles } = useChatRoomRolesRealtime(id);
  const [userRolesMap, setUserRolesMap] = useState<Record<string, any[]>>({});

  useEffect(() => {
    if (!chatRoom || !roles.getUserRoles) return;
    const fetchRoles = async () => {
      const map: Record<string, any[]> = {};
      await Promise.all(
        chatRoom.members.map(async (member) => {
          map[member.id] = await roles.getUserRoles(member.id);
        })
      );
      setUserRolesMap(map);
    };
    fetchRoles();
  }, [chatRoom, ]);

  if (!chatRoom) return null;

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
      <Typography variant="h6" sx={{ mb: 0, mr: 2 }}>
        Members
      </Typography>
      <Box sx={{ display: 'flex', gap: 2, flex: 1 }}>
        {chatRoom.members.map((member) => (
          <Box key={member.id} sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 180 }}>
            <Avatar src={member.imageUrl} alt={member.displayName} />
            <Box>
              <Typography fontWeight="bold">{member.displayName}</Typography>
              <Typography variant="caption" color="text.secondary">
                {member.status || "Offline"}
              </Typography>
              <Box sx={{ mt: 0.5, display: "flex", gap: 1, flexWrap: "wrap" }}>
                {userRolesMap[member.id]?.map((role) => (
                  <Chip
                    key={role.id}
                    label={role.name}
                    size="small"
                    sx={{ bgcolor: role.color, color: "#fff" }}
                  />
                ))}
              </Box>
            </Box>
          </Box>
        ))}
      </Box>
    </Box>
  );
}