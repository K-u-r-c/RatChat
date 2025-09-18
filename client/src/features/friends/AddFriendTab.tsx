import { useEffect, useRef, useState } from "react";
import {
  Box,
  TextField,
  List,
  ListItem,
  ListItemAvatar,
  Avatar,
  ListItemText,
  Button,
  Typography,
  ButtonGroup,
} from "@mui/material";
import { PersonAdd, Settings } from "@mui/icons-material";
import { useFriendSearch, useFriends } from "../../lib/hooks/useFriends";
import type { FriendSearch } from "../../lib/types";
import { useNavigate } from "react-router";

type AddFriendTabProps = {
  autoFocus?: boolean;
};

export default function AddFriendTab({ autoFocus }: AddFriendTabProps) {
  const navigate = useNavigate();
  const { sendFriendRequest } = useFriends();

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<FriendSearch[]>([]);
  const [showMessage, setShowMessage] = useState<Record<string, boolean>>({});
  const [messages, setMessages] = useState<Record<string, string>>({});

  const [debouncedQuery, setDebouncedQuery] = useState("");
  const debounceRef = useRef<number | null>(null);
  useEffect(() => {
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(
      () => setDebouncedQuery(query),
      300
    );
    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, [query]);

  const { data: searched = [], isFetching } = useFriendSearch(
    debouncedQuery.trim()
  );

  useEffect(() => {
    const q = debouncedQuery.trim();
    if (!q) {
      setResults([]);
      return;
    }
    if (!Array.isArray(searched)) return;
    setResults((prev) => {
      if (
        prev.length === searched.length &&
        prev.every(
          (p, i) => p.id === (searched[i] && (searched[i] as FriendSearch).id)
        )
      )
        return prev;
      return searched as FriendSearch[];
    });
  }, [debouncedQuery, searched]);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <Box>
        <Typography variant="h6" sx={{ mb: 1 }}>
          Add Friend
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          You can add friends with their usernames.
        </Typography>
        <TextField
          fullWidth
          autoFocus={autoFocus}
          placeholder="Search by name, email, or tag"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </Box>

      <List>
        {isFetching && (
          <Typography color="text.secondary">Searching...</Typography>
        )}
        {!isFetching && debouncedQuery && results.length === 0 && (
          <Typography color="text.secondary">No matches found</Typography>
        )}
        {results.map((r) => (
          <Box key={r.id}>
            <ListItem
              onClick={() => navigate(`/profiles/${r.id}`)}
              sx={{ cursor: "pointer" }}
              secondaryAction={
                <ButtonGroup variant="contained" size="small">
                  <Button
                    onClick={async (e) => {
                      e.stopPropagation();
                      const msg = (messages[r.id] || "").trim() || undefined;
                      try {
                        await sendFriendRequest.mutateAsync({
                          receiverId: r.id,
                          message: msg,
                        });
                      } catch {
                        /* ignore */
                      }
                    }}
                    disabled={
                      r.isAlreadyFriend ||
                      r.hasPendingRequest ||
                      sendFriendRequest.isPending
                    }
                    startIcon={<PersonAdd />}
                  >
                    {r.isAlreadyFriend
                      ? "Friends"
                      : r.hasPendingRequest
                      ? "Pending"
                      : "Add"}
                  </Button>
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowMessage((prev) => ({
                        ...prev,
                        [r.id]: !prev[r.id],
                      }));
                    }}
                    startIcon={<Settings />}
                    sx={{ minWidth: 0, px: 1 }}
                  />
                </ButtonGroup>
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
            {showMessage[r.id] && (
              <Box px={9} pb={2}>
                <TextField
                  fullWidth
                  size="small"
                  label="Optional message"
                  value={messages[r.id] || ""}
                  onChange={(e) =>
                    setMessages((prev) => ({ ...prev, [r.id]: e.target.value }))
                  }
                  placeholder="Say hello..."
                />
              </Box>
            )}
          </Box>
        ))}
      </List>
    </Box>
  );
}
