import { Avatar, Box, Tooltip, Typography, Button } from "@mui/material";
import type { Profile } from "../../../lib/types";
import { useState } from "react";
import ChatRoomManageRolesForm from "../forms/ChatRoomManageRolesForm";
import type { useChatRoomRolesRealtime } from "../../../lib/hooks/useChatRoomRolesRealtime";
import { observer } from "mobx-react-lite";

type Props = {
  members: Profile[];
  roles: ReturnType<typeof useChatRoomRolesRealtime>["roles"];
  memberRoles: ReturnType<typeof useChatRoomRolesRealtime>["memberRoles"];
  assignRole: ReturnType<typeof useChatRoomRolesRealtime>["assignRole"];
  unassignRole: ReturnType<typeof useChatRoomRolesRealtime>["unassignRole"];
};

const ChatRoomMembersBar = observer(({ members, memberRoles, roles, assignRole, unassignRole }: Props) => {
  const [open, setOpen] = useState(false);

  return (
    <>
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
        <Box sx={{ display: 'flex', gap: 2 }}>
          {members.map((member) => {
            const roles = memberRoles.get(member.id) || [];
            return (
              <Box key={member.id} sx={{ textAlign: 'center', minWidth: 120 }}>
                <Tooltip title={member.displayName}>
                  <Avatar src={member.imageUrl} alt={member.displayName} sx={{ mb: 1, mx: 'auto' }} />
                </Tooltip>
                <Typography variant="caption" noWrap>{member.displayName}</Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, alignItems: 'center', mt: 0.5 }}>
                  {roles.map((role) => (
                    <Tooltip
                      key={role.id}
                      title={
                        <Box>
                          {role.description && (
                            <Typography variant="body2">{role.description}</Typography>
                          )}
                        </Box>
                      }
                      arrow
                    >
                      <Box
                        sx={{
                          bgcolor: role.color,
                          color: "#fff",
                          px: 1,
                          py: 0.5,
                          borderRadius: 1,
                          minWidth: 60,
                          maxWidth: 120,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          fontSize: "0.8rem",
                          boxShadow: 1,
                          cursor: "pointer",
                        }}
                      >
                        {role.name}
                      </Box>
                    </Tooltip>
                  ))}
                </Box>
              </Box>
            );
          })}
        </Box>
        <Box sx={{ ml: "auto" }}>
          <Button variant="contained" onClick={() => setOpen(true)}>
            Manage Roles
          </Button>
        </Box>
      </Box>
      <ChatRoomManageRolesForm
        open={open}
        onClose={() => setOpen(false)}
        members={members}
        roles={roles}
        memberRoles={memberRoles}
        assignRole={assignRole}
        unassignRole={unassignRole}
      />
    </>
  );
});

export default ChatRoomMembersBar;