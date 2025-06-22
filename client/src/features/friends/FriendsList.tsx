import { useState } from "react";
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
} from "@mui/material";
import { PersonAdd } from "@mui/icons-material";
import { useNavigate } from "react-router";
import { useFriends } from "../../lib/hooks/useFriends";
import { useAccount } from "../../lib/hooks/useAccount";
import { useDirectChats } from "../../lib/hooks/useDirectChats";
import { toast } from "react-toastify";
import { FriendsTab } from "./FriendsTab";
import { FriendRequestsTab } from "./FriendRequestsTab";
import { AddFriendDialog } from "./AddFriendDialog";
import { FriendCodeDialog } from "./FriendCodeDialog";

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

  const handleAddFriend = async (friendCode: string, message?: string) => {
    try {
      const result = await searchUserByFriendCode.mutateAsync(friendCode);

      if (result.isAlreadyFriend) {
        toast.info("You are already friends with this user");
        return;
      }

      if (result.hasPendingRequest) {
        toast.info("There is already a pending friend request with this user");
        return;
      }

      await sendFriendRequest.mutateAsync({
        friendCode,
        message,
      });

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

  const copyFriendCode = () => {
    if (currentUser?.friendCode) {
      navigator.clipboard.writeText(currentUser.friendCode);
      toast.success("Friend code copied to clipboard!");
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

      <AddFriendDialog
        open={showAddDialog}
        onClose={() => setShowAddDialog(false)}
        onSubmit={handleAddFriend}
        isLoading={sendFriendRequest.isPending}
      />

      <FriendCodeDialog
        open={showFriendCodeDialog}
        onClose={() => setShowFriendCodeDialog(false)}
        friendCode={currentUser?.friendCode}
        onCopyCode={copyFriendCode}
        onRegenerateCode={() => regenerateFriendCode.mutate()}
        isRegenerating={regenerateFriendCode.isPending}
      />
    </Box>
  );
}
