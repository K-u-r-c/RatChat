import { useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Tabs,
  Tab,
  Typography,
  Chip,
  List,
} from "@mui/material";
import { useNavigate } from "react-router";
import { useFriends } from "../../lib/hooks/useFriends";
import { useDirectChats } from "../../lib/hooks/useDirectChats";
import { toast } from "react-toastify";
import { FriendsTab } from "./FriendsTab";
import { ReceivedRequestItem, SentRequestItem } from "./FriendRequestItem";
import AddFriendTab from "./AddFriendTab";

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

export default function Friends() {
  const navigate = useNavigate();
  const [tabValue, setTabValue] = useState(0);
  const { directChats } = useDirectChats();
  const {
    friends,
    isLoadingFriends,
    friendRequests,
    respondToFriendRequest,
    cancelFriendRequest,
    removeFriend,
  } = useFriends();

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

  const onlineCount = friends?.filter((f) => f.isOnline).length || 0;
  const allCount = friends?.length || 0;
  const pendingCount = friendRequests?.sent?.length || 0;
  const requestsCount = friendRequests?.received?.length || 0;

  const tabs: { key: string; label: React.ReactNode }[] = [
    { key: "online", label: `Online (${onlineCount})` },
    { key: "all", label: `All (${allCount})` },
    { key: "add", label: "Add Friend" },
  ];
  if (pendingCount > 0)
    tabs.push({
      key: "pending",
      label: (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          Pending <Chip size="small" label={pendingCount} color="warning" />
        </Box>
      ),
    });
  if (requestsCount > 0)
    tabs.push({
      key: "requests",
      label: (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          Requests <Chip size="small" label={requestsCount} color="primary" />
        </Box>
      ),
    });

  const indexToKey = tabs.map((t) => t.key);

  return (
    <Box
      sx={{
        height: "100%",
        width: "100%",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Box sx={{ px: 2, py: 1.5 }}>
        <Typography variant="h5" sx={{ mb: 1 }}>
          Friends
        </Typography>
        <Tabs
          value={tabValue}
          onChange={(_, newValue) => setTabValue(newValue)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            minHeight: 0,
            "& .MuiTab-root": {
              minHeight: 0,
              textTransform: "none",
              fontWeight: 600,
            },
          }}
        >
          {tabs.map((t, i) => (
            <Tab
              key={t.key}
              label={t.label}
              id={`friends-nav-${i}`}
              sx={
                t.key === "add"
                  ? {
                      bgcolor: "primary.main",
                      borderRadius: 1,
                      px: 1.5,
                      "&.Mui-selected": {
                        bgcolor: "rgba(88,101,242,0.20)",
                        border: "none",
                      },
                    }
                  : undefined
              }
            />
          ))}
        </Tabs>
      </Box>

      <Box sx={{ flex: 1, overflow: "auto" }}>
        <Card elevation={0} sx={{ height: "100%", bgcolor: "transparent" }}>
          <CardContent sx={{ p: 0 }}>
            {indexToKey.map((key, i) => (
              <TabPanel key={key} value={tabValue} index={i}>
                {key === "online" && (
                  <FriendsTab
                    friends={friends?.filter((f) => f.isOnline)}
                    isLoading={isLoadingFriends}
                    onStartChat={handleStartChat}
                    onRemoveFriend={handleRemoveFriend}
                    isRemoving={removeFriend.isPending}
                  />
                )}
                {key === "all" && (
                  <FriendsTab
                    friends={friends}
                    isLoading={isLoadingFriends}
                    onStartChat={handleStartChat}
                    onRemoveFriend={handleRemoveFriend}
                    isRemoving={removeFriend.isPending}
                  />
                )}
                {key === "add" && <AddFriendTab autoFocus />}
                {key === "pending" && (
                  <List>
                    {friendRequests?.sent?.map((request) => (
                      <SentRequestItem
                        key={request.id}
                        request={request}
                        onCancel={handleCancelRequest}
                        isCanceling={cancelFriendRequest.isPending}
                      />
                    ))}
                    {!pendingCount && (
                      <Typography color="text.secondary">
                        No pending requests
                      </Typography>
                    )}
                  </List>
                )}
                {key === "requests" && (
                  <List>
                    {friendRequests?.received?.map((request) => (
                      <ReceivedRequestItem
                        key={request.id}
                        request={request}
                        onAccept={handleAcceptRequest}
                        onDecline={handleDeclineRequest}
                        isResponding={respondToFriendRequest.isPending}
                      />
                    ))}
                    {!requestsCount && (
                      <Typography color="text.secondary">
                        No requests
                      </Typography>
                    )}
                  </List>
                )}
              </TabPanel>
            ))}
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}
