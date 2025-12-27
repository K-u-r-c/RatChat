import { useEffect, useMemo, useState, type SyntheticEvent } from "react";
import { useLocation, useNavigate, useParams } from "react-router";
import {
  Box,
  Dialog,
  DialogContent,
  DialogTitle,
  Paper,
  Tab,
  Tabs,
  Typography,
} from "@mui/material";
import { toast } from "react-toastify";
import { useProfiles } from "../../lib/hooks/useProfiles";
import { useAccount } from "../../lib/hooks/useAccount";
import { useFriends } from "../../lib/hooks/useFriends";
import ImageUploadWidget from "./ImageUploadWidget";
import ChangePasswordCard from "./ChangePasswordCard";
import { formatUserTag } from "../../lib/util/util";
import type { Friend, Profile } from "../../lib/types";
import { ProfileHeader } from "./ProfileHeader";
import { PersonalSection } from "./PersonalSection";
import { SecuritySection } from "./SecuritySection";
import { VisitorSection } from "./VisitorSection";

type SectionValue = "personal" | "security";

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

  return (
    <Box display="flex" flexDirection="column" gap={1}>
      <ProfileHeader
        profile={profile}
        formattedTag={formattedTag}
        totalFriends={totalFriends}
        isCurrentUser={Boolean(isCurrentUser)}
        onBannerEdit={() => handleOpenImageDialog("banner")}
        onAvatarEdit={() => handleOpenImageDialog("profile")}
        onSendMessage={handleSendMessage}
        onAddFriend={handleAddFriend}
        isSendingFriendRequest={sendFriendRequest.isPending}
      />

      {isCurrentUser ? (
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
            <Tab value="security" label="Security" />
          </Tabs>

          <Box
            sx={{ p: { xs: 3, md: 4 }, backgroundColor: "background.paper" }}
          >
            {activeSection === "personal" && (
              <PersonalSection
                profile={profile}
                isCurrentUser={Boolean(isCurrentUser)}
                nameValue={nameValue}
                bioValue={bioValue}
                isEditingName={isEditingName}
                isEditingBio={isEditingBio}
                pendingField={pendingField}
                isMutatingProfile={updateProfile.isPending}
                friendPreviews={friendPreviews}
                totalFriends={totalFriends}
                isLoadingFriends={isLoadingFriends}
                onNameChange={setNameValue}
                onBioChange={setBioValue}
                onStartEditName={() => setIsEditingName(true)}
                onCancelEditName={handleCancelName}
                onSaveName={handleSaveName}
                onStartEditBio={() => setIsEditingBio(true)}
                onCancelEditBio={handleCancelBio}
                onSaveBio={handleSaveBio}
                onNavigateToFriend={(friendSlug) =>
                  navigate(`/profiles/${friendSlug}`)
                }
              />
            )}

            {activeSection === "security" && (
              <SecuritySection
                hasPassword={Boolean(currentUser?.hasPassword)}
                highlightPassword={passwordHighlight}
                onChangePassword={() => setPasswordDialogOpen(true)}
              />
            )}
          </Box>
        </Box>
      ) : (
        <Paper sx={panelSx}>
          <VisitorSection bio={profile.bio} totalFriends={totalFriends} />
        </Paper>
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
