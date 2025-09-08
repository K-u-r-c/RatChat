import { useEffect, useRef, useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Tabs,
  Tab,
  Typography,
  Button,
  Chip,
  Paper,
  TextField,
  List,
  ListItem,
  ListItemAvatar,
  Avatar,
  ListItemText,
  Collapse,
  ButtonGroup,
} from "@mui/material";
import { PersonAdd, Settings } from "@mui/icons-material";
import { useNavigate } from "react-router";
import { useFriends, useFriendSearch } from "../../lib/hooks/useFriends";
import { useQueryClient } from "@tanstack/react-query";
import { useDirectChats } from "../../lib/hooks/useDirectChats";
import { toast } from "react-toastify";
import { FriendsTab } from "./FriendsTab";
import { FriendRequestsTab } from "./FriendRequestsTab";
import type { FriendSearch } from "../../lib/types";

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`friends-tabpanel-${index}`}
      aria-labelledby={`friends-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

export default function FriendsList() {
  const navigate = useNavigate();
  const [tabValue, setTabValue] = useState(0);
  const { directChats } = useDirectChats();
  const {
    friends,
    isLoadingFriends,
    friendRequests,
    isLoadingRequests,
    sendFriendRequest,
    respondToFriendRequest,
    cancelFriendRequest,
    removeFriend,
  } = useFriends();
  const queryClient = useQueryClient();

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<FriendSearch[]>([]);
  const [showMessage, setShowMessage] = useState<Record<string, boolean>>({});
  const [messages, setMessages] = useState<Record<string, string>>({});
  const debounceRef = useRef<number | null>(null);
  const [debouncedQuery, setDebouncedQuery] = useState("");
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

  const { data: searched = [], isFetching } = useFriendSearch(debouncedQuery);

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
        prev.every((p, i) => p.id === (searched[i] && searched[i].id))
      ) {
        return prev;
      }
      return searched as FriendSearch[];
    });
  }, [debouncedQuery, searched]);

  const handleStartChat = async (friendId: string) => {
    const existingChat = directChats?.find(
      (chat) => chat.otherUserId === friendId
    );

    if (existingChat) {
      navigate(`/direct-chats/${existingChat.id}`);
    } else {
      toast.error("Chat not found. Please try refreshing the page.");
      navigate("/direct-chats");
    }
  };

  const handleRemoveFriend = async (friendId: string) => {
    if (window.confirm("Are you sure you want to remove this friend?")) {
      try {
        await removeFriend.mutateAsync(friendId);
      } catch (error) {
        if (import.meta.env.DEV) {
          console.error("Error removing friend:", error);
        }
      }
    }
  };

  const handleAcceptRequest = async (requestId: string) => {
    try {
      await respondToFriendRequest.mutateAsync({
        requestId,
        accept: true,
      });
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error("Error accepting friend request:", error);
      }
    }
  };

  const handleDeclineRequest = async (requestId: string) => {
    try {
      await respondToFriendRequest.mutateAsync({
        requestId,
        accept: false,
      });
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error("Error declining friend request:", error);
      }
    }
  };

  const handleCancelRequest = async (requestId: string) => {
    try {
      await cancelFriendRequest.mutateAsync(requestId);
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error("Error cancelling friend request:", error);
      }
    }
  };

  return (
    <Box sx={{ maxWidth: 800, mx: "auto", p: 2 }}>
      <Paper
        className="rc-panel"
        sx={{ mb: 2, p: 3, bgcolor: "rgba(19,19,22,0.85)" }}
      >
        <Typography variant="h4" gutterBottom>
          Friends
        </Typography>

        <Box sx={{ position: "relative" }}>
          <TextField
            fullWidth
            label="Search users"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Enter name, email, or tag"
            sx={{
              bgcolor: "#1f2125",
              borderRadius: 1,
              "& .MuiOutlinedInput-notchedOutline": {
                borderColor: "transparent",
              },
              "&:hover .MuiOutlinedInput-notchedOutline": {
                borderColor: "transparent",
              },
              "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                borderColor: "transparent",
              },
              input: { color: "white" },
            }}
          />
          {query.trim() && (
            <Paper
              elevation={6}
              sx={{
                position: "absolute",
                left: 0,
                right: 0,
                top: "calc(100% + 8px)",
                zIndex: 10,
                maxHeight: 320,
                overflowY: "auto",
                bgcolor: "rgba(19,19,22,0.95)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 2,
              }}
            >
              <Box sx={{ px: 2, pt: 1 }}>
                {isFetching && (
                  <Typography color="text.secondary">Searching...</Typography>
                )}
                {!isFetching && results.length === 0 && (
                  <Typography color="text.secondary">
                    No matches found
                  </Typography>
                )}
              </Box>
              <List>
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
                              const msg =
                                (messages[r.id] || "").trim() || undefined;
                              try {
                                await sendFriendRequest.mutateAsync({
                                  receiverId: r.id,
                                  message: msg,
                                });
                                queryClient.setQueryData(
                                  ["friend-search", debouncedQuery.trim()],
                                  (old: FriendSearch[] | undefined) =>
                                    old?.map((x) =>
                                      x.id === r.id
                                        ? { ...x, hasPendingRequest: true }
                                        : x
                                    )
                                );
                              } catch {
                                /* empty */
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
                            <Typography fontWeight={600}>
                              {r.displayName}
                            </Typography>
                            <Typography color="text.secondary">
                              #{r.tag}
                            </Typography>
                          </Box>
                        }
                      />
                    </ListItem>
                    <Collapse
                      in={!!showMessage[r.id]}
                      timeout="auto"
                      unmountOnExit
                    >
                      <Box px={9} pb={2}>
                        <TextField
                          fullWidth
                          size="small"
                          label="Optional message"
                          value={messages[r.id] || ""}
                          onChange={(e) =>
                            setMessages((prev) => ({
                              ...prev,
                              [r.id]: e.target.value,
                            }))
                          }
                          placeholder="Say hello..."
                        />
                      </Box>
                    </Collapse>
                  </Box>
                ))}
              </List>
            </Paper>
          )}
        </Box>
      </Paper>

      <Card>
        <CardContent sx={{ p: 0 }}>
          <Tabs
            value={tabValue}
            onChange={(_, newValue) => setTabValue(newValue)}
            sx={{ borderBottom: 1, borderColor: "divider" }}
          >
            <Tab label={`Friends (${friends?.length || 0})`} />
            <Tab
              label={
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  Friend Requests
                  {(friendRequests?.received?.length || 0) > 0 && (
                    <Chip
                      size="small"
                      label={friendRequests?.received.length}
                      color="primary"
                    />
                  )}
                </Box>
              }
            />
          </Tabs>

          <TabPanel value={tabValue} index={0}>
            <FriendsTab
              friends={friends}
              isLoading={isLoadingFriends}
              onStartChat={handleStartChat}
              onRemoveFriend={handleRemoveFriend}
              isRemoving={removeFriend.isPending}
            />
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            <FriendRequestsTab
              friendRequests={friendRequests}
              isLoading={isLoadingRequests}
              onAcceptRequest={handleAcceptRequest}
              onDeclineRequest={handleDeclineRequest}
              onCancelRequest={handleCancelRequest}
              isResponding={respondToFriendRequest.isPending}
              isCanceling={cancelFriendRequest.isPending}
            />
          </TabPanel>
        </CardContent>
      </Card>
    </Box>
  );
}
