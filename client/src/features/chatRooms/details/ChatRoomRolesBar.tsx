import { useChatRoomRolesRealtime } from "../../../lib/hooks/useChatRoomRolesRealtime";
import {
    Box,
    Button,
    Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import { ChatRoomRoleButton } from "../../../app/shared/components/ChatRoomRoleButton";
import { useState } from "react";
import ChatRoomRoleForm from "../forms/ChatRoomRoleForm";
import type { CreateChatRoomRole } from "../../../lib/schemas/chatRoomRoleSchema";

type Props = {
    roles: ReturnType<typeof useChatRoomRolesRealtime>["roles"];
    createRole: ReturnType<typeof useChatRoomRolesRealtime>["createRole"];
    updateRole: ReturnType<typeof useChatRoomRolesRealtime>["updateRole"];
    deleteRole: ReturnType<typeof useChatRoomRolesRealtime>["deleteRole"];
}

const ChatRoomRolesBar = function ChatRoomRolesBar(
    { roles, createRole, updateRole, deleteRole }: Props) {
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
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <Typography
                    variant="subtitle1"
                    sx={{ fontWeight: "bold", mr: 1 }}
                >
                    Roles:
                </Typography>
                {roles &&
                    roles.map((role) => (
                        <ChatRoomRoleButton
                            key={role.id}
                            role={role}
                            updateRole={updateRole}
                            deleteRole={deleteRole}
                        />
                    ))}
            </Box>
            {/* Button section */}
            <Button
                variant="contained"
                color="primary"
                startIcon={<AddIcon />}
                onClick={handleAddRoleClick}
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