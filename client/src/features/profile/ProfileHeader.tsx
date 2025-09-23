import { useState, type MouseEvent } from "react";
import { Avatar, Box, Button, Stack, Typography } from "@mui/material";
import { Edit, Message, PersonAdd } from "@mui/icons-material";
import type { Profile } from "../../lib/types";

type ProfileHeaderProps = {
  profile: Profile;
  formattedTag?: string | null;
  totalFriends: number;
  isCurrentUser: boolean;
  onBannerEdit: () => void;
  onAvatarEdit: () => void;
  onSendMessage: () => void;
  onAddFriend: () => void;
  isSendingFriendRequest: boolean;
};

export function ProfileHeader({
  profile,
  formattedTag,
  totalFriends,
  isCurrentUser,
  onBannerEdit,
  onAvatarEdit,
  onSendMessage,
  onAddFriend,
  isSendingFriendRequest,
}: ProfileHeaderProps) {
  const [isBannerHover, setIsBannerHover] = useState(false);
  const [isAvatarHover, setIsAvatarHover] = useState(false);

  const handleAvatarClick = (event: MouseEvent<HTMLDivElement>) => {
    if (!isCurrentUser) return;
    event.stopPropagation();
    onAvatarEdit();
  };

  const handleBannerClick = () => {
    if (!isCurrentUser) return;
    onBannerEdit();
  };

  return (
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
      onClick={handleBannerClick}
      onMouseEnter={() => setIsBannerHover(true)}
      onMouseLeave={() => setIsBannerHover(false)}
    >
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
        onClick={handleBannerClick}
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
              onClick={handleAvatarClick}
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
              onClick={(event) => event.stopPropagation()}
            >
              {profile.isFriend ? (
                <Button
                  variant="contained"
                  startIcon={<Message />}
                  onClick={onSendMessage}
                >
                  Send message
                </Button>
              ) : (
                <Button
                  variant="contained"
                  startIcon={<PersonAdd />}
                  onClick={onAddFriend}
                  disabled={isSendingFriendRequest}
                >
                  {isSendingFriendRequest ? "Sending..." : "Add friend"}
                </Button>
              )}
            </Stack>
          )}
        </Box>
      </Box>
    </Box>
  );
}
