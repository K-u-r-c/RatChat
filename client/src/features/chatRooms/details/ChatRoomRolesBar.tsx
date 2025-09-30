import {Box, Button, Typography} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import {ChatRoomRoleButton} from "../../../app/shared/components/ChatRoomRoleButton";
import {useState} from "react";
import ChatRoomRoleForm from "../forms/ChatRoomRoleForm";
import type {CreateChatRoomRole} from "../../../lib/schemas/chatRoomRoleSchema";
import {useChatRoomRoles} from "../../../lib/hooks/useChatRoomRoles";
import {CHATROOM_PERMISSIONS} from "../../../lib/types/chatroomPermissions.ts";

type Props = {
  chatRoomId?: string;
  currentUserId?: string;
};

const ChatRoomRolesBar = function ChatRoomRolesBar({
                                                     chatRoomId,
                                                     currentUserId,
                                                   }: Props) {
  const {createRole, roles, userPermissions, isLoadingUserPermissions} = useChatRoomRoles(chatRoomId, currentUserId);
  // Dialog state for creating
  const [open, setOpen] = useState(false);

  const handleAddRoleClick = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const handleAddRoleSubmit = async (data: CreateChatRoomRole) => {
    if (data.name.trim() && createRole) {
      await createRole(data);
    }
    handleClose();
  };

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 2,
        mb: 2,
        p: 2,
        bgcolor: "background.paper",
        borderRadius: 2,
        boxShadow: 1,
      }}
    >
      {/* Roles section */}
      <Box sx={{display: "flex", alignItems: "center", gap: 2}}>
        <Typography variant="subtitle1" sx={{fontWeight: "bold", mr: 1}}>
          Roles:
        </Typography>
        {roles &&
          roles.map((role) => (
            <ChatRoomRoleButton
              key={role.id}
              role={role}
              chatRoomId={chatRoomId}
              currentUserId={currentUserId}
              isDisabled={isLoadingUserPermissions || !userPermissions[CHATROOM_PERMISSIONS.ManageChatRoomRoles]}
            />
          ))}
      </Box>
      {/* Button section */}
      <Button
        variant="contained"
        color="primary"
        startIcon={<AddIcon/>}
        onClick={handleAddRoleClick}
        disabled={isLoadingUserPermissions || !userPermissions[CHATROOM_PERMISSIONS.ManageChatRoomRoles]}
      >
        Create Role
      </Button>
      {/* Dialog for adding a role replaced by ChatRoomRoleForm */}
      <ChatRoomRoleForm
        open={open}
        onClose={handleClose}
        onSubmit={handleAddRoleSubmit}
      />
    </Box>
  );
};

export default ChatRoomRolesBar;
