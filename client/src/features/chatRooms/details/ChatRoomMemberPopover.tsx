import Popover from "@mui/material/Popover";
import {
  Avatar,
  Box,
  Chip,
  Divider,
  Stack,
  Typography,
  IconButton,
} from "@mui/material";
import { useEffect, useState } from "react";
import { Link } from "react-router";
import type { ChatRoomRole, Profile } from "../../../lib/types";
import { formatUserTag } from "../../../lib/util/util";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import ChatRoomMemberActions from "./ChatRoomMemberActions";

type Props = {
  open: boolean;
  anchorEl: HTMLElement | null;
  onClose: () => void;
  member?: Profile;
  loadRoles: (userId: string) => Promise<ChatRoomRole[]>;
  chatRoomId: string;
  ownerId: string;
};

export default function ChatRoomMemberPopover({
  open,
  anchorEl,
  onClose,
  member,
  loadRoles,
  chatRoomId,
  ownerId,
}: Props) {
  const [roles, setRoles] = useState<ChatRoomRole[]>([]);
  const [loading, setLoading] = useState(false);

  const [actionsAnchor, setActionsAnchor] = useState<HTMLElement | null>(null);
  const openActions = (e: React.MouseEvent<HTMLElement>) =>
    setActionsAnchor(e.currentTarget);
  const closeActions = () => setActionsAnchor(null);

  useEffect(() => {
    let ignore = false;
    const run = async () => {
      if (!member) return;
      setLoading(true);
      try {
        const r = await loadRoles(member.id);
        if (!ignore) setRoles(r);
      } finally {
        if (!ignore) setLoading(false);
      }
    };
    if (open && member) run();
    return () => {
      ignore = true;
    };
  }, [open, member, loadRoles]);

  const formattedTag = member ? formatUserTag(member.tag) : undefined;

  useEffect(() => {
    if (open && anchorEl && !document.body.contains(anchorEl)) {
      closeActions();
      onClose();
    }
  }, [open, anchorEl, member, onClose, closeActions]);

  const isAnchorValid =
    !!anchorEl &&
    typeof document !== "undefined" &&
    document.body.contains(anchorEl);
  const effectiveOpen = open && isAnchorValid && !!member;

  return (
    <>
      <Popover
        open={effectiveOpen}
        anchorEl={anchorEl}
        onClose={() => {
          closeActions();
          onClose();
        }}
        anchorOrigin={{ vertical: "center", horizontal: "left" }}
        transformOrigin={{ vertical: "center", horizontal: "right" }}
        slotProps={{
          paper: {
            sx: {
              borderRadius: 2,
              overflow: "hidden",
              width: 340,
              bgcolor: "background.paper",
              position: "relative",
            },
          },
        }}
      >
        {member && (
          <Box sx={{ width: 340 }}>
            {/* Banner */}
            <Box
              sx={{
                height: 96,
                background: member.bannerUrl
                  ? `url(${member.bannerUrl})`
                  : "linear-gradient(135deg, #40356e 0%, #7867BD 69%, rgb(174, 157, 241) 89%)",
                backgroundSize: "cover",
                backgroundPosition: "center",
                position: "relative",
              }}
            >
              <span>
                <IconButton
                  size="small"
                  onClick={openActions}
                  sx={{
                    position: "absolute",
                    top: 6,
                    right: 6,
                    bgcolor: "rgba(0,0,0,0.35)",
                    color: "white",
                    "&:hover": { bgcolor: "rgba(0,0,0,0.55)" },
                  }}
                >
                  <MoreHorizIcon fontSize="small" />
                </IconButton>
              </span>
            </Box>
            {/* Avatar + name */}
            <Box sx={{ px: 2, pb: 2, position: "relative" }}>
              <Link
                to={`/profiles/${member.slug}`}
                style={{ textDecoration: "none" }}
              >
                <Avatar
                  src={member.imageUrl || "/images/user.png"}
                  alt={member.displayName}
                  sx={{
                    width: 64,
                    height: 64,
                    border: "3px solid",
                    borderColor: "background.paper",
                    position: "relative",
                    top: -32,
                  }}
                />
              </Link>
              <Box sx={{ mt: -2 }}>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    flexDirection: "row",
                  }}
                >
                  <Typography
                    variant="subtitle1"
                    fontWeight={700}
                    component={Link}
                    to={`/profiles/${member.slug}`}
                    sx={{
                      color: "text.primary",
                      textDecoration: "none",
                      "&:hover": { textDecoration: "underline" },
                      lineHeight: 1.2,
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    {member.displayName}
                  </Typography>
                  {formattedTag && (
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{
                        lineHeight: 1.2,
                        display: "flex",
                        alignItems: "center",
                      }}
                    >
                      #{formattedTag}
                    </Typography>
                  )}
                </Box>
                <Typography variant="caption" color="text.secondary">
                  {member.status || (member.isOnline ? "Online" : "Offline")}
                </Typography>
                {member.bio && (
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mt: 1.5 }}
                  >
                    {member.bio}
                  </Typography>
                )}
              </Box>
            </Box>

            <Divider />
            {/* Roles */}
            <Box sx={{ p: 1.5 }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Roles
              </Typography>
              {loading ? (
                <Typography variant="body2" color="text.secondary">
                  Loading roles...
                </Typography>
              ) : roles.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  No roles assigned.
                </Typography>
              ) : (
                <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                  {roles.map((r) => (
                    <Chip
                      key={r.id}
                      size="small"
                      label={r.name}
                      sx={{
                        borderColor: r.color,
                        color: r.color,
                        borderWidth: 1,
                        borderStyle: "solid",
                      }}
                      variant="outlined"
                    />
                  ))}
                </Stack>
              )}
            </Box>
          </Box>
        )}
      </Popover>

      {/* Actions popover */}
      <ChatRoomMemberActions
        open={Boolean(actionsAnchor)}
        anchorEl={actionsAnchor}
        onClose={closeActions}
        chatRoomId={chatRoomId}
        member={
          member
            ? {
                id: member.id,
                isOwner: member.id === ownerId,
              }
            : null
        }
      />
    </>
  );
}
