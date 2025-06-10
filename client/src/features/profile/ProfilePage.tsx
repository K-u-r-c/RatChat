import { useParams } from "react-router";
import { useProfiles } from "../../lib/hooks/useProfiles";
import { useAccount } from "../../lib/hooks/useAccount";
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
} from "@mui/icons-material";
import { useState } from "react";
import ProfileEditForm from "./ProfileEditForm";
import ImageUploadWidget from "./ImageUploadWidget";

export default function ProfilePage() {
  const { id } = useParams();
  const { profile, isLoadingProfile } = useProfiles(id);
  const { currentUser } = useAccount();
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

            {profile.followersCount !== undefined && (
              <Box display="flex" gap={4} mb={2}>
                <Box textAlign="left">
                  <Typography
                    variant="h5"
                    sx={{
                      fontWeight: "bold",
                      textShadow: "1px 1px 2px rgba(0,0,0,0.7)",
                    }}
                  >
                    {profile.followersCount}
                  </Typography>
                  <Typography
                    variant="body1"
                    sx={{
                      textShadow: "1px 1px 2px rgba(0,0,0,0.7)",
                    }}
                  >
                    Followers
                  </Typography>
                </Box>
                <Box textAlign="left">
                  <Typography
                    variant="h5"
                    sx={{
                      fontWeight: "bold",
                      textShadow: "1px 1px 2px rgba(0,0,0,0.7)",
                    }}
                  >
                    {profile.followingCount}
                  </Typography>
                  <Typography
                    variant="body1"
                    sx={{
                      textShadow: "1px 1px 2px rgba(0,0,0,0.7)",
                    }}
                  >
                    Following
                  </Typography>
                </Box>
              </Box>
            )}

            {!isCurrentUser && (
              <Button
                variant={profile.following ? "outlined" : "contained"}
                color={profile.following ? "secondary" : "primary"}
                size="large"
                sx={{
                  borderColor: profile.following ? "white" : undefined,
                  color: profile.following ? "white" : undefined,
                  "&:hover": {
                    borderColor: "white",
                    backgroundColor: profile.following
                      ? "rgba(255,255,255,0.1)"
                      : undefined,
                  },
                }}
              >
                {profile.following ? "Unfollow" : "Follow"}
              </Button>
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
