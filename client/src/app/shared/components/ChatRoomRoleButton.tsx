import { Box, Tooltip, Typography } from "@mui/material";
import { useState } from "react";
import type { ChatRoomRole } from "../../../lib/schemas/chatRoomRoleSchema";
import ChatRoomRoleUpdateForm from "../../../features/chatRooms/forms/ChatRoomRoleUpdateForm";

type Props = {
  chatRoomId?: string;
  currentUserId?: string;
  role: ChatRoomRole;
};

export function ChatRoomRoleButton({ chatRoomId, currentUserId, role }: Props) {
  const [open, setOpen] = useState(false);

  const handleClose = () => {
    setOpen(false);
  };

  return (
    <>
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
          component="button"
          onClick={() => setOpen(true)}
          sx={{
            px: 2,
            py: 0.5,
            borderRadius: 2,
            bgcolor: role.color || "grey.300",
            color: "#fff",
            border: "none",
            outline: "none",
            cursor: "pointer",
            opacity: 1,
            transition: "background 0.2s",
            fontWeight: 500,
            fontSize: 14,
            minWidth: 60,
            textAlign: "center",
            userSelect: "none",
            "&:hover": { filter: "brightness(0.9)" },
          }}
        >
          {role.name}
        </Box>
      </Tooltip>
      <ChatRoomRoleUpdateForm
        open={open}
        onClose={handleClose}
        role={role}
        chatRoomId={chatRoomId}
        currentUserId={currentUserId}
        disableDelete={role.isDefault}
      />
    </>
  );
}
