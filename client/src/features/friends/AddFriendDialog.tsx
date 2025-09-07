import { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  List,
  ListItem,
  ListItemAvatar,
  Avatar,
  ListItemText,
  Box,
  Typography,
} from "@mui/material";
import { useFriends } from "../../lib/hooks/useFriends";
import type { FriendSearch } from "../../lib/types";
import { Link } from "react-router";

type AddFriendDialogProps = {
  open: boolean;
  onClose: () => void;
  isLoading: boolean;
};

export function AddFriendDialog({ open, onClose }: AddFriendDialogProps) {
  const { searchUsers, sendFriendRequest } = useFriends();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<FriendSearch[]>([]);
  const [message, setMessage] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  const runSearch = async () => {
    const q = query.trim();
    if (!q) {
      setResults([]);
      return;
    }
    setIsSearching(true);
    try {
      const res = await searchUsers.mutateAsync(q);
      setResults(res);
    } finally {
      setIsSearching(false);
    }
  };

  const handleAdd = async (userId: string) => {
    await sendFriendRequest.mutateAsync({
      receiverId: userId,
      message: message.trim() || undefined,
    });
    // Optimistically mark as pending
    setResults((prev) =>
      prev.map((r) => (r.id === userId ? { ...r, hasPendingRequest: true } : r))
    );
  };

  const handleClose = () => {
    setQuery("");
    setMessage("");
    setResults([]);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Find Friends</DialogTitle>
      <DialogContent>
        <TextField
          fullWidth
          label="Search by display name, email, or tag (e.g. Jakub#2137)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") runSearch();
          }}
          placeholder="Type name, email, 2137 or Jakub#2137"
          sx={{ mb: 2, mt: 1 }}
        />
        <Box display="flex" gap={1} mb={2}>
          <Button
            variant="contained"
            onClick={runSearch}
            disabled={isSearching}
          >
            Search
          </Button>
        </Box>

        {results.length > 0 ? (
          <List>
            {results.map((r) => (
              <ListItem
                key={r.id}
                secondaryAction={
                  <Box display="flex" gap={1}>
                    <Button
                      size="small"
                      variant="outlined"
                      component={Link}
                      to={`/profiles/${r.id}`}
                    >
                      View
                    </Button>
                    <Button
                      size="small"
                      variant="contained"
                      disabled={
                        r.isAlreadyFriend ||
                        r.hasPendingRequest ||
                        sendFriendRequest.isPending
                      }
                      onClick={() => handleAdd(r.id)}
                    >
                      {r.isAlreadyFriend
                        ? "Friends"
                        : r.hasPendingRequest
                        ? "Pending"
                        : "Add"}
                    </Button>
                  </Box>
                }
              >
                <ListItemAvatar>
                  <Avatar src={r.imageUrl} />
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <Box display="flex" alignItems="center" gap={1}>
                      <Typography fontWeight={600}>{r.displayName}</Typography>
                      <Typography color="text.secondary">#{r.tag}</Typography>
                    </Box>
                  }
                />
              </ListItem>
            ))}
          </List>
        ) : (
          <Typography color="text.secondary">
            {isSearching ? "Searching..." : "No results yet. Try a search."}
          </Typography>
        )}

        <Box mt={2}>
          <TextField
            fullWidth
            label="Message (optional)"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Say hello..."
            multiline
            rows={3}
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}
