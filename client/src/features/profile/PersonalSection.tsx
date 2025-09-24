import { Edit } from "@mui/icons-material";
import {
  Avatar,
  AvatarGroup,
  Box,
  Button,
  Divider,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import type { Friend, Profile } from "../../lib/types";

type PersonalSectionProps = {
  profile: Profile;
  isCurrentUser: boolean;
  nameValue: string;
  bioValue: string;
  isEditingName: boolean;
  isEditingBio: boolean;
  pendingField: "name" | "bio" | null;
  isMutatingProfile: boolean;
  friendPreviews: Friend[];
  totalFriends: number;
  isLoadingFriends: boolean;
  onNameChange: (value: string) => void;
  onBioChange: (value: string) => void;
  onStartEditName: () => void;
  onCancelEditName: () => void;
  onSaveName: () => void;
  onStartEditBio: () => void;
  onCancelEditBio: () => void;
  onSaveBio: () => void;
  onNavigateToFriend: (slug: string) => void;
};

export function PersonalSection({
  profile,
  isCurrentUser,
  nameValue,
  bioValue,
  isEditingName,
  isEditingBio,
  pendingField,
  isMutatingProfile,
  friendPreviews,
  totalFriends,
  isLoadingFriends,
  onNameChange,
  onBioChange,
  onStartEditName,
  onCancelEditName,
  onSaveName,
  onStartEditBio,
  onCancelEditBio,
  onSaveBio,
  onNavigateToFriend,
}: PersonalSectionProps) {
  const handleFriendClick = (slug?: string | null) => {
    if (!slug) return;
    onNavigateToFriend(slug);
  };

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="subtitle2" color="text.secondary">
          Display name
        </Typography>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={1.5}
          alignItems={{ xs: "flex-start", sm: "center" }}
          mt={1}
        >
          <Typography variant="h5" sx={{ fontWeight: 600 }}>
            {profile.displayName}
          </Typography>
          {isCurrentUser && !isEditingName && (
            <Button
              size="small"
              variant="outlined"
              startIcon={<Edit />}
              onClick={onStartEditName}
            >
              Change name
            </Button>
          )}
        </Stack>
        {isCurrentUser && isEditingName && (
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={1}
            mt={1.5}
            alignItems={{ xs: "stretch", sm: "center" }}
          >
            <TextField
              size="small"
              label="Display name"
              sx={{ flex: 1, minWidth: { sm: 220 } }}
              value={nameValue}
              onChange={(event) => onNameChange(event.target.value)}
            />
            <Button
              size="small"
              variant="contained"
              onClick={onSaveName}
              disabled={pendingField === "name" && isMutatingProfile}
            >
              Save
            </Button>
            <Button size="small" onClick={onCancelEditName}>
              Cancel
            </Button>
          </Stack>
        )}
      </Box>

      <Divider flexItem sx={{ borderColor: "rgba(255,255,255,0.08)" }} />

      <Box>
        <Typography variant="subtitle2" color="text.secondary">
          Bio
        </Typography>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={1.5}
          alignItems={{ xs: "flex-start", sm: "center" }}
          mt={1}
        >
          <Typography variant="body1" sx={{ whiteSpace: "pre-wrap" }}>
            {profile.bio?.trim() ? profile.bio : "No bio added yet."}
          </Typography>
          {isCurrentUser && !isEditingBio && (
            <Button
              size="small"
              variant="outlined"
              startIcon={<Edit />}
              onClick={onStartEditBio}
            >
              Edit bio
            </Button>
          )}
        </Stack>
        {isCurrentUser && isEditingBio && (
          <Stack spacing={1} mt={1.5}>
            <TextField
              label="Bio"
              multiline
              minRows={3}
              value={bioValue}
              onChange={(event) => onBioChange(event.target.value)}
            />
            <Stack direction="row" spacing={1} justifyContent="flex-end">
              <Button
                size="small"
                variant="contained"
                onClick={onSaveBio}
                disabled={pendingField === "bio" && isMutatingProfile}
              >
                Save
              </Button>
              <Button size="small" onClick={onCancelEditBio}>
                Cancel
              </Button>
            </Stack>
          </Stack>
        )}
      </Box>

      <Divider flexItem sx={{ borderColor: "rgba(255,255,255,0.08)" }} />

      <Box>
        <Typography variant="subtitle2" color="text.secondary">
          Friends ({totalFriends})
        </Typography>
        {friendPreviews.length ? (
          <AvatarGroup
            max={10}
            total={Math.max(totalFriends, friendPreviews.length)}
            sx={{ width: "100%", justifyContent: "left", mt: 1.5 }}
          >
            {friendPreviews.map((friend) => (
              <Tooltip title={friend.displayName} key={friend.id}>
                <Avatar
                  src={friend.imageUrl}
                  alt={friend.displayName}
                  sx={{ cursor: "pointer" }}
                  onClick={() => handleFriendClick(friend.slug)}
                >
                  {friend.displayName?.charAt(0).toUpperCase() ?? "?"}
                </Avatar>
              </Tooltip>
            ))}
          </AvatarGroup>
        ) : isLoadingFriends ? (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5 }}>
            Loading friends...
          </Typography>
        ) : (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5 }}>
            No friends to show yet.
          </Typography>
        )}
      </Box>
    </Stack>
  );
}
