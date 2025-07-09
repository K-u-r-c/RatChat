import { Box } from "@mui/material";
import { useState } from "react";
import type { ChatRoomRole } from "../../../lib/types";
import type { UpdateChatRoomRole } from "../../../lib/schemas/chatRoomRoleSchema";
import { useChatRoomRolesRealtime } from "../../../lib/hooks/useChatRoomRolesRealtime";
import ChatRoomRoleUpdateForm from "../../../features/chatRooms/forms/ChatRoomRoleUpdateForm";

type Props = {
  role: ChatRoomRole;
  rolesHook: ReturnType<typeof useChatRoomRolesRealtime>["roles"];
};

export function ChatRoomRoleButton({ role, rolesHook }: Props) {
  const [open, setOpen] = useState(false);

  const handleClose = () => {
    setOpen(false);
  };

  const handleUpdate = async (data: UpdateChatRoomRole) => {
    if (!rolesHook.updateRole) return;
    await rolesHook.updateRole(data);
    setOpen(false);
  };

  const handleDelete = async () => {
    if (!rolesHook.deleteRole || role.isDefault) return;
    try {
      await rolesHook.deleteRole(role.id);
      setOpen(false);
    } catch (err: any) {
      if (err?.message?.includes("connection being closed")) {
        alert("Nie można usunąć roli: połączenie z serwerem zostało przerwane.");
      } else {
        alert("Wystąpił błąd podczas usuwania roli.");
      }
    }
  };

  return (
    <>
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
        title={role.description || undefined}
      >
        {role.name}
      </Box>
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