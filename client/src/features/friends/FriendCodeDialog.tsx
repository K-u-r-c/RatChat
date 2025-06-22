import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  Button,
} from "@mui/material";
import { ContentCopy } from "@mui/icons-material";

type FriendCodeDialogProps = {
  open: boolean;
  onClose: () => void;
  friendCode: string | undefined;
  onCopyCode: () => void;
  onRegenerateCode: () => void;
  isRegenerating: boolean;
};

export function FriendCodeDialog({
  open,
  onClose,
  friendCode,
  onCopyCode,
  onRegenerateCode,
  isRegenerating,
}: FriendCodeDialogProps) {
  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Your Friend Code</DialogTitle>
      <DialogContent>
        <Box sx={{ textAlign: "center", py: 2 }}>
          <Typography variant="h4" fontFamily="monospace" sx={{ mb: 2 }}>
            {friendCode}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Share this code with friends so they can add you
          </Typography>
          <Button
            startIcon={<ContentCopy />}
            onClick={onCopyCode}
            variant="outlined"
            sx={{ mr: 1 }}
          >
            Copy Code
          </Button>
          <Button
            onClick={onRegenerateCode}
            variant="text"
            color="warning"
            disabled={isRegenerating}
          >
            Generate New Code
          </Button>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}
