import { useParams } from "react-router";
import { useChatRoomRolesRealtime } from "../../../lib/hooks/useChatRoomRolesRealtime";
import {
    Box,
    Button,
    Typography,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import { ChatRoomRoleButton } from "../../../app/shared/components/ChatRoomRoleButton";
import { useState } from "react";
import { observer } from "mobx-react-lite";

const ChatRoomRolesBar = observer(function ChatRoomRolesBar() {
    const { id } = useParams();
    const { roles } = useChatRoomRolesRealtime(id);

    // Dialog state for creating
    const [open, setOpen] = useState(false);
    const [roleName, setRoleName] = useState("");
    const [roleColor, setRoleColor] = useState("#1976d2");
    const [roleDescription, setRoleDescription] = useState("");

    const handleAddRoleClick = () => setOpen(true);
    const handleClose = () => {
        setOpen(false);
        setRoleName("");
        setRoleColor("");
        setRoleDescription("");
    };

    const handleAddRoleSubmit = async () => {
        if (roleName.trim() && roles.createRole) {
            await roles.createRole({
                name: roleName.trim(),
                color: roleColor,
                description: roleDescription.trim() || undefined,
            });
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
                    roles.roles &&
                    roles.roles.map((role) => (
                        <ChatRoomRoleButton
                            key={role.id}
                            role={role}
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
            {/* Dialog for adding a role */}
            <Dialog open={open} onClose={handleClose}>
                <DialogTitle>Add new role</DialogTitle>
                <DialogContent
                    sx={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 2,
                        minWidth: 320,
                    }}
                >
                    <TextField
                        label="Role name"
                        value={roleName}
                        onChange={(e) => setRoleName(e.target.value)}
                        autoFocus
                        required
                        fullWidth
                        sx={{ mt: 2 }}
                    />
                    <Box sx={{ display: "flex", alignItems: "center", gap: 2, mt: 1 }}>
                        <span>Color:</span>
                        <input
                            type="color"
                            value={roleColor}
                            onChange={e => setRoleColor(e.target.value)}
                            style={{ width: 40, height: 40, border: "none", background: "none", padding: 0 }}
                        />
                        <span style={{ fontFamily: "monospace" }}>{roleColor}</span>
                    </Box>
                    <TextField
                        label="Description (optional)"
                        value={roleDescription}
                        onChange={(e) => setRoleDescription(e.target.value)}
                        fullWidth
                        multiline
                        minRows={2}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleClose}>Cancel</Button>
                    <Button
                        onClick={handleAddRoleSubmit}
                        variant="contained"
                        disabled={!roleName.trim()}
                    >
                        Add
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
});

export default ChatRoomRolesBar;