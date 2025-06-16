import { useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Tabs,
  Tab,
  Typography,
  Button,
  TextField,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Paper,
} from "@mui/material";
import {
  PersonAdd,
  PersonRemove,
  Check,
  Close,
  Message,
  ContentCopy,
} from "@mui/icons-material";
import { useNavigate } from "react-router";
import { useFriends } from "../../lib/hooks/useFriends";
import { useAccount } from "../../lib/hooks/useAccount";
import { useDirectChats } from "../../lib/hooks/useDirectChats";
import { toast } from "react-toastify";

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
  const [searchCode, setSearchCode] = useState("");
  const [friendRequestMessage, setFriendRequestMessage] = useState("");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showFriendCodeDialog, setShowFriendCodeDialog] = useState(false);

  const { currentUser, regenerateFriendCode } = useAccount();
  const { directChats } = useDirectChats();
  const {
    friends,
    isLoadingFriends,
    friendRequests,
    isLoadingRequests,
    searchUserByFriendCode,
    sendFriendRequest,
    respondToFriendRequest,
    cancelFriendRequest,
    removeFriend,
  } = useFriends();

  const handleSearchAndAdd = async () => {
    if (!searchCode.trim()) return;

    try {
      const result = await searchUserByFriendCode.mutateAsync(
        searchCode.toUpperCase()
      );

      if (result.isAlreadyFriend) {
        toast.info("You are already friends with this user");
        return;
      }

      if (result.hasPendingRequest) {
        toast.info("There is already a pending friend request with this user");
        return;
      }

      await sendFriendRequest.mutateAsync({
        friendCode: searchCode.toUpperCase(),
        message: friendRequestMessage.trim() || undefined,
      });

      setSearchCode("");
      setFriendRequestMessage("");
      setShowAddDialog(false);
      toast.success("Friend request sent!");
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error("Error searching for friend:", error);
      }
    }
  };

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

  const copyFriendCode = () => {
    if (currentUser?.friendCode) {
      navigator.clipboard.writeText(currentUser.friendCode);
      toast.success("Friend code copied to clipboard!");
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

  return (
    <Box sx={{ maxWidth: 800, mx: "auto", p: 2 }}>
      <Paper sx={{ mb: 3, p: 3 }}>
        <Typography variant="h4" gutterBottom>
          Friends
        </Typography>

        <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
          <Button
            variant="contained"
            startIcon={<PersonAdd />}
            onClick={() => setShowAddDialog(true)}
          >
            Add Friend
          </Button>
          <Button
            variant="outlined"
            onClick={() => setShowFriendCodeDialog(true)}
          >
            My Friend Code
          </Button>
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
            {isLoadingFriends ? (
              <Typography>Loading friends...</Typography>
            ) : !friends?.length ? (
              <Typography color="text.secondary">
                No friends yet. Add some friends to get started!
              </Typography>
            ) : (
              <List>
                {friends.map((friend) => (
                  <ListItem
                    key={friend.id}
                    divider
                    secondaryAction={
                      <Box sx={{ display: "flex", gap: 1 }}>
                        <IconButton
                          onClick={() => handleStartChat(friend.id)}
                          color="primary"
                        >
                          <Message />
                        </IconButton>
                        <IconButton
                          onClick={() => handleRemoveFriend(friend.id)}
                          color="error"
                          disabled={removeFriend.isPending}
                        >
                          <PersonRemove />
                        </IconButton>
                      </Box>
                    }
                  >
                    <ListItemAvatar>
                      <Avatar src={friend.imageUrl} alt={friend.displayName}>
                        {friend.displayName[0]}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={friend.displayName}
                      secondary={
                        <>
                          {friend.bio && (
                            <Typography
                              variant="body2"
                              color="text.secondary"
                              component="span"
                              display="block"
                            >
                              {friend.bio}
                            </Typography>
                          )}
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            component="span"
                          >
                            Friends since{" "}
                            {new Date(friend.friendsSince).toLocaleDateString()}
                          </Typography>
                        </>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            )}
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            {isLoadingRequests ? (
              <Typography>Loading friend requests...</Typography>
            ) : (
              <Box>
                {/* Received Requests */}
                {friendRequests?.received?.length ? (
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="h6" gutterBottom>
                      Received Requests
                    </Typography>
                    <List>
                      {friendRequests.received.map((request) => (
                        <ListItem
                          key={request.id}
                          divider
                          secondaryAction={
                            <Box sx={{ display: "flex", gap: 1 }}>
                              <IconButton
                                onClick={() => handleAcceptRequest(request.id)}
                                color="success"
                                disabled={respondToFriendRequest.isPending}
                              >
                                <Check />
                              </IconButton>
                              <IconButton
                                onClick={() => handleDeclineRequest(request.id)}
                                color="error"
                                disabled={respondToFriendRequest.isPending}
                              >
                                <Close />
                              </IconButton>
                            </Box>
                          }
                        >
                          <ListItemAvatar>
                            <Avatar src={request.senderImageUrl}>
                              {request.senderDisplayName[0]}
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={request.senderDisplayName}
                            secondary={
                              <>
                                {request.message && (
                                  <Typography
                                    variant="body2"
                                    component="span"
                                    display="block"
                                  >
                                    "{request.message}"
                                  </Typography>
                                )}
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                  component="span"
                                >
                                  {new Date(
                                    request.createdAt
                                  ).toLocaleDateString()}
                                </Typography>
                              </>
                            }
                          />
                        </ListItem>
                      ))}
                    </List>
                  </Box>
                ) : null}

                {/* Sent Requests */}
                {friendRequests?.sent?.length ? (
                  <Box>
                    <Typography variant="h6" gutterBottom>
                      Sent Requests
                    </Typography>
                    <List>
                      {friendRequests.sent.map((request) => (
                        <ListItem
                          key={request.id}
                          divider
                          secondaryAction={
                            <Button
                              size="small"
                              color="error"
                              onClick={() => handleCancelRequest(request.id)}
                              disabled={cancelFriendRequest.isPending}
                            >
                              Cancel
                            </Button>
                          }
                        >
                          <ListItemAvatar>
                            <Avatar src={request.receiverImageUrl}>
                              {request.receiverDisplayName[0]}
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={request.receiverDisplayName}
                            secondary={
                              <>
                                <Chip
                                  label="Pending"
                                  size="small"
                                  color="warning"
                                />
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                  component="span"
                                  sx={{ ml: 1 }}
                                >
                                  Sent{" "}
                                  {new Date(
                                    request.createdAt
                                  ).toLocaleDateString()}
                                </Typography>
                              </>
                            }
                          />
                        </ListItem>
                      ))}
                    </List>
                  </Box>
                ) : null}

                {!friendRequests?.received?.length &&
                  !friendRequests?.sent?.length && (
                    <Typography color="text.secondary">
                      No friend requests
                    </Typography>
                  )}
              </Box>
            )}
          </TabPanel>
        </CardContent>
      </Card>

      {/* Add Friend Dialog */}
      <Dialog
        open={showAddDialog}
        onClose={() => setShowAddDialog(false)}
        maxWidth="sm"
        fullWidth
      >
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
            value={friendRequestMessage}
            onChange={(e) => setFriendRequestMessage(e.target.value)}
            placeholder="Say hello..."
            multiline
            rows={3}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowAddDialog(false)}>Cancel</Button>
          <Button
            onClick={handleSearchAndAdd}
            variant="contained"
            disabled={!searchCode.trim() || sendFriendRequest.isPending}
          >
            Send Request
          </Button>
        </DialogActions>
      </Dialog>

      {/* Friend Code Dialog */}
      <Dialog
        open={showFriendCodeDialog}
        onClose={() => setShowFriendCodeDialog(false)}
      >
        <DialogTitle>Your Friend Code</DialogTitle>
        <DialogContent>
          <Box sx={{ textAlign: "center", py: 2 }}>
            <Typography variant="h4" fontFamily="monospace" sx={{ mb: 2 }}>
              {currentUser?.friendCode}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Share this code with friends so they can add you
            </Typography>
            <Button
              startIcon={<ContentCopy />}
              onClick={copyFriendCode}
              variant="outlined"
              sx={{ mr: 1 }}
            >
              Copy Code
            </Button>
            <Button
              onClick={() => regenerateFriendCode.mutate()}
              variant="text"
              color="warning"
              disabled={regenerateFriendCode.isPending}
            >
              Generate New Code
            </Button>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowFriendCodeDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
