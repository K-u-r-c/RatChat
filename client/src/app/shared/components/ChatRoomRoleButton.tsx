import { Box, Tooltip, Typography } from "@mui/material";
import { useState } from "react";
import type { ChatRoomRole } from "../../../lib/types";
import type { UpdateChatRoomRole } from "../../../lib/schemas/chatRoomRoleSchema";
import { useChatRoomRolesRealtime } from "../../../lib/hooks/useChatRoomRolesRealtime";
import ChatRoomRoleUpdateForm from "../../../features/chatRooms/forms/ChatRoomRoleUpdateForm";
import { toast } from "react-toastify";

type Props = {
  role: ChatRoomRole;
  updateRole: ReturnType<typeof useChatRoomRolesRealtime>["updateRole"];
  deleteRole: ReturnType<typeof useChatRoomRolesRealtime>["deleteRole"];
};

export function ChatRoomRoleButton({ role, updateRole, deleteRole }: Props) {
  const [open, setOpen] = useState(false);

  const handleClose = () => {
    setOpen(false);
  };

  const handleUpdate = async (data: UpdateChatRoomRole) => {
    if (!updateRole) return;
    await updateRole(data);
    setOpen(false);
  };

  const handleDelete = async () => {
    if (!deleteRole || role.isDefault) return;
    try {
      await deleteRole(role.id);
      setOpen(false);
    } catch (err: any) {
      if (err?.message?.includes("connection being closed")) {
        toast.error("Cannot delete role: connection to the server has been lost.");
      } else {
        toast.error("An error occurred while deleting the role.");
      }
    }
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
        } arrow >
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
        onSubmit={handleUpdate}
        onDelete={!role.isDefault ? handleDelete : undefined}
        disableDelete={role.isDefault}
      />
    </>
  );
}