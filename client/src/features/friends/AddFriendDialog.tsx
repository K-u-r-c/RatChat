import { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
} from "@mui/material";

type AddFriendDialogProps = {
  open: boolean;
  onClose: () => void;
  onSubmit: (friendCode: string, message?: string) => Promise<void>;
  isLoading: boolean;
};

export function AddFriendDialog({
  open,
  onClose,
  onSubmit,
  isLoading,
}: AddFriendDialogProps) {
  const [searchCode, setSearchCode] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async () => {
    if (!searchCode.trim()) return;

    await onSubmit(searchCode.toUpperCase(), message.trim() || undefined);
    setSearchCode("");
    setMessage("");
  };

  const handleClose = () => {
    setSearchCode("");
    setMessage("");
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Add Friend</DialogTitle>
      <DialogContent>
        <TextField
          fullWidth
          label="Friend Code"
          value={searchCode}
          onChange={(e) => setSearchCode(e.target.value.toUpperCase())}
          placeholder="Enter 6-8 character friend code"
          sx={{ mb: 2, mt: 1 }}
        />
        <TextField
          fullWidth
          label="Message (optional)"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Say hello..."
          multiline
          rows={3}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={!searchCode.trim() || isLoading}
        >
          Send Request
        </Button>
      </DialogActions>
    </Dialog>
  );
}
