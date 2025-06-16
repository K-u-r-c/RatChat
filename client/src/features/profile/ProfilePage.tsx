import { useParams } from "react-router";
import { useProfiles } from "../../lib/hooks/useProfiles";
import { useAccount } from "../../lib/hooks/useAccount";
import { useDirectChats } from "../../lib/hooks/useDirectChats";
import { useFriends } from "../../lib/hooks/useFriends";
import {
  Avatar,
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  Paper,
  Divider,
  IconButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
} from "@mui/material";
import {
  Edit,
  Landscape,
  MoreVert,
  Person,
  PhotoCamera,
  Message,
  PersonAdd,
} from "@mui/icons-material";
import { useState } from "react";
import { useNavigate } from "react-router";
import ProfileEditForm from "./ProfileEditForm";
import ImageUploadWidget from "./ImageUploadWidget";
import { toast } from "react-toastify";

export default function ProfilePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { profile, isLoadingProfile } = useProfiles(id);
  const { currentUser } = useAccount();
  const { createDirectChat } = useDirectChats();
  const { sendFriendRequest } = useFriends();
  const [editMode, setEditMode] = useState(false);
  const [photoMode, setPhotoMode] = useState<"profile" | "banner" | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const isCurrentUser = currentUser?.id === id;

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handlePhotoModeChange = (mode: "profile" | "banner") => {
    setPhotoMode(mode);
    handleClose();
  };

  const handleSendMessage = async () => {
    if (!profile) return;

    try {
      const chatId = await createDirectChat.mutateAsync(profile.id);
      navigate(`/direct-chats/${chatId}`);
    } catch (error) {
      console.error("Failed to create direct chat:", error);
    }
  };

  const handleAddFriend = async () => {
    if (!profile) {
      toast.error("Profile not found");
      return;
    }

    const friendCode = prompt(
      `Please enter ${profile.displayName}'s friend code:`
    );
    if (!friendCode) return;

    try {
      await sendFriendRequest.mutateAsync({
        friendCode: friendCode.toUpperCase(),
        message: `Hi ${profile.displayName}! I'd like to add you as a friend.`,
      });
      toast.success("Friend request sent!");
    } catch (error) {
      console.error("Failed to send friend request:", error);
    }
  };

  if (isLoadingProfile) return <Typography>Loading...</Typography>;
  if (!profile) return <Typography>Profile not found</Typography>;

  return (
    <Box>
      {/* Banner Section */}
      <Paper
        sx={{
          position: "relative",
          height: 300,
          mb: 3,
          borderRadius: 3,
          overflow: "hidden",
          backgroundImage: profile.bannerUrl
            ? `linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.3)), url(${profile.bannerUrl})`
            : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          backgroundSize: "cover",
          backgroundPosition: "center",
          display: "flex",
          alignItems: "flex-end",
        }}
      >
        {/* Change Banner Button */}
        {isCurrentUser && (
          <IconButton
            sx={{
              position: "absolute",
              top: 16,
              right: 16,
              backgroundColor: "rgba(0,0,0,0.6)",
              color: "white",
              "&:hover": {
                backgroundColor: "rgba(0,0,0,0.8)",
              },
            }}
            onClick={handleClick}
          >
            <MoreVert />
          </IconButton>
        )}

        {/* Profile Info Overlay */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 3,
            p: 3,
            width: "100%",
          }}
        >
          {/* Profile Avatar */}
          <Box sx={{ position: "relative" }}>
            <Avatar
              src={profile.imageUrl}
              sx={{
                width: 150,
                height: 150,
                fontSize: "3rem",
                border: "4px solid white",
                boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
              }}
            >
              <Person sx={{ fontSize: "3rem" }} />
            </Avatar>
          </Box>

          {/* Profile Info */}
          <Box sx={{ color: "white", flex: 1 }}>
            <Typography
              variant="h3"
              gutterBottom
              sx={{
                fontWeight: "bold",
                textShadow: "2px 2px 4px rgba(0,0,0,0.7)",
              }}
            >
              {profile.displayName}
            </Typography>

            {profile.friendsCount !== undefined && (
              <Box display="flex" gap={4} mb={2}>
                <Box textAlign="left">
                  <Typography
                    variant="h5"
                    sx={{
                      fontWeight: "bold",
                      textShadow: "1px 1px 2px rgba(0,0,0,0.7)",
                    }}
                  >
                    {profile.friendsCount}
                  </Typography>
                  <Typography
                    variant="body1"
                    sx={{
                      textShadow: "1px 1px 2px rgba(0,0,0,0.7)",
                    }}
                  >
                    Friends
                  </Typography>
                </Box>
              </Box>
            )}

            {!isCurrentUser && (
              <Box sx={{ display: "flex", gap: 2 }}>
                {profile.isFriend ? (
                  <Button
                    variant="contained"
                    startIcon={<Message />}
                    onClick={handleSendMessage}
                    disabled={createDirectChat.isPending}
                    sx={{
                      backgroundColor: "primary.main",
                      "&:hover": {
                        backgroundColor: "primary.dark",
                      },
                    }}
                  >
                    Send Message
                  </Button>
                ) : (
                  <Button
                    variant="contained"
                    startIcon={<PersonAdd />}
                    onClick={handleAddFriend}
                    disabled={sendFriendRequest.isPending}
                    sx={{
                      backgroundColor: "secondary.main",
                      "&:hover": {
                        backgroundColor: "secondary.dark",
                      },
                    }}
                  >
                    Add Friend
                  </Button>
                )}
              </Box>
            )}
          </Box>
        </Box>

        {/* Photo Upload Menu */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleClose}
          PaperProps={{
            sx: { mt: 1 },
          }}
        >
          <MenuItem onClick={() => handlePhotoModeChange("profile")}>
            <ListItemIcon>
              <PhotoCamera />
            </ListItemIcon>
            <ListItemText>Change Profile Photo</ListItemText>
          </MenuItem>
          <MenuItem onClick={() => handlePhotoModeChange("banner")}>
            <ListItemIcon>
              <Landscape />
            </ListItemIcon>
            <ListItemText>Change Banner</ListItemText>
          </MenuItem>
        </Menu>
      </Paper>

      {/* Image Upload Widget */}
      {photoMode && (
        <Paper sx={{ p: 3, mb: 3, borderRadius: 3 }}>
          <Typography variant="h6" gutterBottom>
            Upload {photoMode === "profile" ? "Profile Photo" : "Banner"}
          </Typography>
          <ImageUploadWidget
            key={photoMode}
            imageType={photoMode}
            onUploadComplete={() => setPhotoMode(null)}
          />
        </Paper>
      )}

      {/* Profile Content */}
      <Grid container spacing={3}>
        <Grid size={12}>
          <Card>
            <CardContent>
              <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                mb={2}
              >
                <Typography variant="h5">
                  About {profile.displayName}
                </Typography>
                {isCurrentUser && (
                  <Button
                    startIcon={<Edit />}
                    onClick={() => setEditMode(!editMode)}
                    variant="outlined"
                  >
                    {editMode ? "Cancel" : "Edit Profile"}
                  </Button>
                )}
              </Box>

              <Divider sx={{ mb: 2 }} />

              {editMode ? (
                <ProfileEditForm
                  profile={profile}
                  onCancel={() => setEditMode(false)}
                  onSuccess={() => setEditMode(false)}
                />
              ) : (
                <Box>
                  <Typography variant="body1" paragraph>
                    {profile.bio || "No bio available"}
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
