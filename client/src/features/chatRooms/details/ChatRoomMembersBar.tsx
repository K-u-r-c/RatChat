import { Avatar, Box, Tooltip, Typography, Button } from "@mui/material";
import { Link } from "react-router";
import type { Profile } from "../../../lib/types";
import { useState } from "react";
import ChatRoomManageRolesForm from "../forms/ChatRoomManageRolesForm";
import { useChatRoomRoles } from "../../../lib/hooks/useChatRoomRoles";
import { observer } from "mobx-react-lite";

type Props = {
  chatRoomId?: string;
  currentUserId?: string;
  members: Profile[];
};

const ChatRoomMembersBar = observer(
  ({ members, chatRoomId, currentUserId }: Props) => {
    const { usersRolesMap, isLoading } = useChatRoomRoles(
      chatRoomId,
      currentUserId
    );
    const [open, setOpen] = useState(false);

    return (
      <>
        <Box
          sx={{
            width: "100%",
            p: 2,
            borderTop: "1px solid #eee",
            bgcolor: "background.paper",
            overflowX: "auto",
            zIndex: 1200,
            display: "flex",
            alignItems: "center",
            gap: 2,
          }}
        >
          <Box sx={{ display: "flex", gap: 2 }}>
            {members.map((member) => {
              const memberRoleList = usersRolesMap.get(member.id) || [];
              return (
                <Box
                  key={member.id}
                  sx={{ textAlign: "center", minWidth: 120 }}
                >
                  <Tooltip title={member.displayName}>
                    <Link
                      to={`/profiles/${member.slug}`}
                      style={{ textDecoration: "none" }}
                    >
                      <Avatar
                        src={member.imageUrl}
                        alt={member.displayName}
                        sx={{ mb: 1, mx: "auto" }}
                      />
                    </Link>
                  </Tooltip>
                  <Typography
                    variant="caption"
                    noWrap
                    component={Link}
                    to={`/profiles/${member.slug}`}
                    sx={{
                      color: "text.primary",
                      textDecoration: "none",
                      display: "inline-block",
                      "&:hover": { textDecoration: "underline" },
                    }}
                  >
                    {member.displayName}
                  </Typography>
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 0.5,
                      alignItems: "center",
                      mt: 0.5,
                    }}
                  >
                    {memberRoleList.map((role) => (
                      <Tooltip
                        key={role.id}
                        title={
                          <Box>
                            {role.description && (
                              <Typography variant="body2">
                                {role.description}
                              </Typography>
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
            <Button
              variant="contained"
              onClick={() => setOpen(true)}
              disabled={isLoading}
            >
              Manage Roles
            </Button>
          </Box>
        </Box>
        <ChatRoomManageRolesForm
          open={open}
          onClose={() => setOpen(false)}
          members={members}
          chatRoomId={chatRoomId}
          currentUserId={currentUserId}
          loading={isLoading}
        />
      </>
    );
  }
);

export default ChatRoomMembersBar;

