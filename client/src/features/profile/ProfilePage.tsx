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
} from "@mui/material";
import { Edit, Person } from "@mui/icons-material";
import { useState } from "react";
import ProfileEditForm from "./ProfileEditForm";
import PhotoUploadWidget from "./PhotoUploadWidget";

export default function ProfilePage() {
  const { id } = useParams();
  const { profile, isLoadingProfile } = useProfiles(id);
  const { currentUser } = useAccount();
  const [editMode, setEditMode] = useState(false);
  const [photoMode, setPhotoMode] = useState(false);

  const isCurrentUser = currentUser?.id === id;

  if (isLoadingProfile) return <Typography>Loading...</Typography>;
  if (!profile) return <Typography>Profile not found</Typography>;

  return (
    <Grid container spacing={3}>
      <Grid size={4}>
        <Paper sx={{ p: 3, textAlign: "center" }}>
          <Avatar
            src={profile.imageUrl}
            sx={{
              width: 200,
              height: 200,
              mx: "auto",
              mb: 2,
              fontSize: "4rem",
            }}
          >
            <Person sx={{ fontSize: "4rem" }} />
          </Avatar>

          {isCurrentUser && (
            <Box>
              <Button
                variant="outlined"
                onClick={() => setPhotoMode(!photoMode)}
                sx={{ mb: 2 }}
                fullWidth
              >
                {photoMode ? "Cancel" : "Change Photo"}
              </Button>

              {photoMode && (
                <PhotoUploadWidget
                  onUploadComplete={() => setPhotoMode(false)}
                />
              )}
            </Box>
          )}

          <Typography variant="h4" gutterBottom>
            {profile.displayName}
          </Typography>

          {profile.followersCount !== undefined && (
            <Box display="flex" justifyContent="center" gap={4} mb={2}>
              <Box textAlign="center">
                <Typography variant="h6">{profile.followersCount}</Typography>
                <Typography variant="body2" color="text.secondary">
                  Followers
                </Typography>
              </Box>
              <Box textAlign="center">
                <Typography variant="h6">{profile.followingCount}</Typography>
                <Typography variant="body2" color="text.secondary">
                  Following
                </Typography>
              </Box>
            </Box>
          )}

          {!isCurrentUser && (
            <Button
              variant={profile.following ? "outlined" : "contained"}
              color={profile.following ? "secondary" : "primary"}
              fullWidth
            >
              {profile.following ? "Unfollow" : "Follow"}
            </Button>
          )}
        </Paper>
      </Grid>

      <Grid size={8}>
        <Card>
          <CardContent>
            <Box
              display="flex"
              justifyContent="space-between"
              alignItems="center"
              mb={2}
            >
              <Typography variant="h5">About {profile.displayName}</Typography>
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
  );
}
