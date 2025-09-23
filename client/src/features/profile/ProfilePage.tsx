import { useEffect, useMemo, useState, type SyntheticEvent } from "react";
import { useLocation, useNavigate, useParams } from "react-router";
import { useProfiles } from "../../lib/hooks/useProfiles";
import { useAccount } from "../../lib/hooks/useAccount";
import { useFriends } from "../../lib/hooks/useFriends";
import {
  Avatar,
  AvatarGroup,
  Box,
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  Paper,
  Stack,
  Tab,
  Tabs,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { Edit, Message, PersonAdd } from "@mui/icons-material";
import ImageUploadWidget from "./ImageUploadWidget";
import ChangePasswordCard from "./ChangePasswordCard";
import { toast } from "react-toastify";
import { formatUserTag } from "../../lib/util/util";
import type { Friend, Profile } from "../../lib/types";

type SectionValue = "personal" | "settings" | "notifications" | "security";

type ProfileWithFriends = Profile & {
  friends?: Friend[];
  friendsPreview?: Friend[];
  recentFriends?: Friend[];
};

const panelSx = {
  p: { xs: 3, md: 4 },
  borderRadius: 3,
  backgroundColor: "background.paper",
  border: "1px solid rgba(255,255,255,0.08)",
  backdropFilter: "blur(12px)",
};

export default function ProfilePage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { profile, isLoadingProfile, updateProfile } = useProfiles(slug);
  const { currentUser } = useAccount();
  const { friends, isLoadingFriends, sendFriendRequest } = useFriends();
  const [activeSection, setActiveSection] = useState<SectionValue>("personal");
  const [imageDialogMode, setImageDialogMode] = useState<
    "profile" | "banner" | null
  >(null);
  const [isPasswordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [nameValue, setNameValue] = useState("");
  const [bioValue, setBioValue] = useState("");
  const [pendingField, setPendingField] = useState<null | "name" | "bio">(null);
  const [passwordHighlight, setPasswordHighlight] = useState(false);
  const [isBannerHover, setIsBannerHover] = useState(false);
  const [isAvatarHover, setIsAvatarHover] = useState(false);

  const isCurrentUser = profile?.id === currentUser?.id;
  const formattedTag = formatUserTag(profile?.tag);

  useEffect(() => {
    if (!profile) return;
    setNameValue(profile.displayName);
    setBioValue(profile.bio ?? "");
  }, [profile]);

  useEffect(() => {
    if (
      location.hash === "#password" &&
      isCurrentUser &&
      currentUser?.hasPassword
    ) {
      setActiveSection("security");
      setPasswordHighlight(true);
      const timeout = window.setTimeout(
        () => setPasswordHighlight(false),
        2200
      );
      return () => window.clearTimeout(timeout);
    }
  }, [location.hash, isCurrentUser, currentUser?.hasPassword]);

  const derivedFriends = useMemo<Friend[]>(() => {
    if (!profile) return [];
    const typed = profile as ProfileWithFriends;
    if (typed.friends?.length) return typed.friends;
    if (typed.friendsPreview?.length) return typed.friendsPreview;
    if (typed.recentFriends?.length) return typed.recentFriends;
    if (isCurrentUser && friends?.length) return friends;
    return [];
  }, [profile, friends, isCurrentUser]);

  const friendPreviews = derivedFriends.slice(0, 10);
  const totalFriends = profile?.friendsCount ?? derivedFriends.length;

  const handleSectionChange = (_: SyntheticEvent, value: SectionValue) => {
    setActiveSection(value);
  };

  const handleOpenImageDialog = (mode: "profile" | "banner") => {
    if (!isCurrentUser) return;
    setImageDialogMode(mode);
  };

  const handleImageDialogClose = () => setImageDialogMode(null);

  const handleImageUploadComplete = () => {
    setImageDialogMode(null);
  };

  const handleSendMessage = () => {
    if (!profile) return;
    navigate("/");
  };

  const handleAddFriend = async () => {
    if (!profile) {
      toast.error("Profile not found");
      return;
    }

    try {
      await sendFriendRequest.mutateAsync({
        receiverId: profile.id,
        message: `Hi ${profile.displayName}! I'd like to add you as a friend.`,
      });
      toast.success("Friend request sent!");
    } catch (error) {
      if (import.meta.env.DEV)
        console.error("Failed to send friend request:", error);
    }
  };

  const handleSaveName = async () => {
    if (!profile) return;
    const trimmedName = nameValue.trim();
    if (!trimmedName) {
      toast.error("Display name cannot be empty");
      return;
    }

    try {
      setPendingField("name");
      const trimmedBio = bioValue.trim();
      await updateProfile.mutateAsync({
        displayName: trimmedName,
        bio: trimmedBio.length ? trimmedBio : "",
      });
      setIsEditingName(false);
    } catch (error) {
      if (import.meta.env.DEV)
        console.error("Failed to update profile name:", error);
    } finally {
      setPendingField(null);
    }
  };

  const handleSaveBio = async () => {
    if (!profile) return;
    const trimmedName = nameValue.trim();
    if (!trimmedName) {
      toast.error("Display name cannot be empty");
      return;
    }

    try {
      setPendingField("bio");
      const trimmedBio = bioValue.trim();
      await updateProfile.mutateAsync({
        displayName: trimmedName,
        bio: trimmedBio.length ? trimmedBio : "",
      });
      setIsEditingBio(false);
    } catch (error) {
      if (import.meta.env.DEV)
        console.error("Failed to update profile bio:", error);
    } finally {
      setPendingField(null);
    }
  };

  const handleCancelName = () => {
    if (!profile) return;
    setIsEditingName(false);
    setNameValue(profile.displayName);
  };

  const handleCancelBio = () => {
    if (!profile) return;
    setIsEditingBio(false);
    setBioValue(profile.bio ?? "");
  };

  if (isLoadingProfile) return <Typography>Loading...</Typography>;
  if (!profile) return <Typography>Profile not found</Typography>;

  const personalSection = (
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
              onClick={() => setIsEditingName(true)}
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
              onChange={(event) => setNameValue(event.target.value)}
            />
            <Button
              size="small"
              variant="contained"
              onClick={handleSaveName}
              disabled={pendingField === "name" && updateProfile.isPending}
            >
              Save
            </Button>
            <Button size="small" onClick={handleCancelName}>
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
              onClick={() => setIsEditingBio(true)}
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
              onChange={(event) => setBioValue(event.target.value)}
            />
            <Stack direction="row" spacing={1} justifyContent="flex-end">
              <Button
                size="small"
                variant="contained"
                onClick={handleSaveBio}
                disabled={pendingField === "bio" && updateProfile.isPending}
              >
                Save
              </Button>
              <Button size="small" onClick={handleCancelBio}>
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
                  onClick={() => navigate(`/profiles/${friend.slug}`)}
                >
                  {friend.displayName?.charAt(0).toUpperCase() ?? "?"}
                </Avatar>
              </Tooltip>
            ))}
          </AvatarGroup>
        ) : isLoadingFriends ? (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5 }}>
            Loading friends…
          </Typography>
        ) : (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5 }}>
            No friends to show yet.
          </Typography>
        )}
      </Box>
    </Stack>
  );

  const securitySection = (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          Account security
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          Keep your account protected by regularly updating your password.
        </Typography>
      </Box>

      {currentUser?.hasPassword ? (
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={2}
          alignItems={{ xs: "stretch", sm: "center" }}
        >
          <TextField
            label="Current password"
            type="password"
            value="********"
            disabled
            InputProps={{ readOnly: true }}
            sx={{
              width: { xs: "100%", sm: 260 },
              "& .MuiOutlinedInput-root": {
                ...(passwordHighlight
                  ? {
                      boxShadow: "0 0 0 2px rgba(88,101,242,0.35)",
                      "& .MuiOutlinedInput-notchedOutline": {
                        borderColor: "primary.main",
                      },
                    }
                  : {}),
              },
            }}
          />
          <Button
            variant="contained"
            onClick={() => setPasswordDialogOpen(true)}
          >
            Change password
          </Button>
        </Stack>
      ) : (
        <Typography variant="body2" color="text.secondary">
          You are currently signed in without a password. Add one to enable
          email sign in.
        </Typography>
      )}
    </Stack>
  );

  const visitorSection = (
    <Stack spacing={3}>
      <Box>
        <Typography variant="subtitle2" color="text.secondary">
          Bio
        </Typography>
        <Typography variant="body1" sx={{ mt: 1 }}>
          {profile.bio?.trim()
            ? profile.bio
            : "This user has not added a bio yet."}
        </Typography>
      </Box>

      <Divider flexItem sx={{ borderColor: "rgba(255,255,255,0.08)" }} />

      <Box>
        <Typography variant="subtitle2" color="text.secondary">
          Friends ({totalFriends})
        </Typography>
      </Box>
    </Stack>
  );

  return (
    <Box display="flex" flexDirection="column" gap={1}>
      <Box
        sx={{
          position: "relative",
          borderRadius: 3,
          overflow: "hidden",
          aspectRatio: "32 / 9",
          backgroundImage: profile.bannerUrl
            ? `url(${profile.bannerUrl})`
            : "linear-gradient(135deg, #2c2f36, #1f2126)",
          backgroundSize: "cover",
          backgroundPosition: "center",
          ...(isCurrentUser
            ? {
                cursor: "pointer",
              }
            : {}),
        }}
        onClick={
          isCurrentUser ? () => handleOpenImageDialog("banner") : undefined
        }
        onMouseEnter={() => setIsBannerHover(true)}
        onMouseLeave={() => setIsBannerHover(false)}
      >
        {/* Clickable banner background layer */}
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            backgroundImage: profile.bannerUrl
              ? `url(${profile.bannerUrl})`
              : "linear-gradient(135deg, #2c2f36, #1f2126)",
            backgroundSize: "cover",
            backgroundPosition: "center",
            cursor: isCurrentUser ? "pointer" : "default",
            zIndex: 0,
          }}
          onClick={
            isCurrentUser ? () => handleOpenImageDialog("banner") : undefined
          }
        >
          {isCurrentUser && (
            <Box
              className="bannerOverlay"
              sx={{
                position: "absolute",
                inset: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                bgcolor: "rgba(0,0,0,0.5)",
                opacity: isBannerHover && !isAvatarHover ? 1 : 0,
                transition: "opacity 200ms ease",
              }}
            >
              <Stack spacing={1} alignItems="center">
                <Edit sx={{ fontSize: 32 }} />
                <Typography variant="body2">Change banner</Typography>
              </Stack>
            </Box>
          )}
        </Box>

        {/* Foreground content layer */}
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-end",
            gap: 3,
            zIndex: 2,
            background:
              "linear-gradient(180deg, rgba(19,19,22,0) 0%, rgba(19,19,22,0.65) 60%, rgba(19,19,22,0.9) 100%)",
            p: { xs: 3, md: 4 },
          }}
        >
          <Box
            display="flex"
            alignItems="flex-end"
            justifyContent="space-between"
            flexWrap="wrap"
            gap={3}
          >
            <Box
              display="flex"
              alignItems="flex-end"
              gap={{ xs: 2, md: 3 }}
              flexWrap="wrap"
            >
              <Box
                sx={{
                  position: "relative",
                  width: { xs: 96, sm: 128, md: 150 },
                  height: { xs: 96, sm: 128, md: 150 },
                  borderRadius: "50%",
                  overflow: "hidden",
                  border: "4px solid rgba(255,255,255,0.85)",
                  ...(isCurrentUser
                    ? {
                        cursor: "pointer",
                        "&:hover .avatarOverlay": { opacity: 1 },
                      }
                    : {}),
                }}
                onClick={(e) => {
                  if (!isCurrentUser) return;
                  e.stopPropagation();
                  handleOpenImageDialog("profile");
                }}
                onMouseEnter={() => setIsAvatarHover(true)}
                onMouseLeave={() => setIsAvatarHover(false)}
              >
                <Avatar
                  src={profile.imageUrl}
                  alt={profile.displayName}
                  sx={{
                    width: "100%",
                    height: "100%",
                    fontSize: "2.5rem",
                    bgcolor: "divider",
                    color: "text.primary",
                  }}
                >
                  {profile.displayName?.charAt(0).toUpperCase() ?? "U"}
                </Avatar>
                {isCurrentUser && (
                  <Box
                    className="avatarOverlay"
                    sx={{
                      position: "absolute",
                      inset: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      bgcolor: "rgba(0,0,0,0.55)",
                      opacity: 0,
                      transition: "opacity 200ms ease",
                    }}
                  >
                    <Edit sx={{ fontSize: 28 }} />
                  </Box>
                )}
              </Box>

              <Box>
                <Typography variant="h4" sx={{ fontWeight: 700 }}>
                  {profile.displayName}
                </Typography>
                {formattedTag && (
                  <Typography variant="subtitle1" color="text.secondary">
                    #{formattedTag}
                  </Typography>
                )}
                <Typography variant="body2" color="text.secondary">
                  {totalFriends} friend{totalFriends === 1 ? "" : "s"}
                </Typography>
              </Box>
            </Box>

            {!isCurrentUser && (
              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={1.5}
                alignItems="flex-start"
                onClick={(e) => e.stopPropagation()}
              >
                {profile.isFriend ? (
                  <Button
                    variant="contained"
                    startIcon={<Message />}
                    onClick={handleSendMessage}
                  >
                    Send message
                  </Button>
                ) : (
                  <Button
                    variant="contained"
                    startIcon={<PersonAdd />}
                    onClick={handleAddFriend}
                    disabled={sendFriendRequest.isPending}
                  >
                    {sendFriendRequest.isPending ? "Sending..." : "Add friend"}
                  </Button>
                )}
              </Stack>
            )}
          </Box>
        </Box>
      </Box>

      {isCurrentUser ? (
        <>
          {/* Unified panel: tabs + content in a single Paper */}
          <Box sx={{ ...panelSx, p: 0, overflow: "hidden" }}>
            <Tabs
              value={activeSection}
              onChange={handleSectionChange}
              variant="scrollable"
              scrollButtons="auto"
              sx={{
                px: { xs: 2, md: 3 },
                backgroundColor: "background.paper",
                borderBottom: "1px solid rgba(255,255,255,0.08)",
                minHeight: 48,
                "& .MuiTab-root": {
                  color: "rgba(255,255,255,0.87)",
                  textTransform: "none",
                  minHeight: 48,
                },
                "& .Mui-selected": { color: "#fff" },
                "& .MuiTabs-indicator": {
                  height: 3,
                  borderRadius: 3,
                },
              }}
            >
              <Tab value="personal" label="Personal" />
              <Tab value="settings" label="Settings" disabled />
              <Tab value="notifications" label="Notifications" disabled />
              <Tab value="security" label="Security" />
            </Tabs>

            <Box
              sx={{ p: { xs: 3, md: 4 }, backgroundColor: "background.paper" }}
            >
              {activeSection === "personal" && personalSection}
              {activeSection === "security" && securitySection}
            </Box>
          </Box>
        </>
      ) : (
        <Paper sx={panelSx}>{visitorSection}</Paper>
      )}

      <Dialog
        open={Boolean(imageDialogMode)}
        onClose={handleImageDialogClose}
        maxWidth="md"
        fullWidth
      >
        {imageDialogMode && (
          <>
            <DialogTitle sx={{ backgroundColor: "background.paper" }}>
              {imageDialogMode === "profile"
                ? "Change profile picture"
                : "Change banner"}
            </DialogTitle>
            <DialogContent sx={{ pt: 2, backgroundColor: "background.paper" }}>
              <ImageUploadWidget
                key={imageDialogMode}
                imageType={imageDialogMode}
                onUploadComplete={handleImageUploadComplete}
              />
            </DialogContent>
          </>
        )}
      </Dialog>

      <Dialog
        open={isPasswordDialogOpen}
        onClose={() => setPasswordDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Change password</DialogTitle>
        <DialogContent sx={{ p: 0 }}>
          <ChangePasswordCard highlight={passwordHighlight} />
        </DialogContent>
      </Dialog>
    </Box>
  );
}
