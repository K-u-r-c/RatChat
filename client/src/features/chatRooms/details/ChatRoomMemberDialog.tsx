import {
  Avatar,
  Box,
  Chip,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  Stack,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";
import { Link } from "react-router";
import type { ChatRoomRole, Profile } from "../../../lib/types";
import { formatUserTag } from "../../../lib/util/util";

type Props = {
  open: boolean;
  onClose: () => void;
  member?: Profile;
  loadRoles: (userId: string) => Promise<ChatRoomRole[]>;
};

export default function ChatRoomMemberDialog({
  open,
  onClose,
  member,
  loadRoles,
}: Props) {
  const [roles, setRoles] = useState<ChatRoomRole[]>([]);
  const [loading, setLoading] = useState(false);

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

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Member details</DialogTitle>
      <DialogContent sx={{ p: 0 }}>
        {member && (
          <>
            {/* Banner */}
            <Box
              sx={{
                height: 140,
                background: member.bannerUrl
                  ? `url(${member.bannerUrl})`
                  : "linear-gradient(135deg, #40356e 0%, #7867BD 69%, rgb(174, 157, 241) 89%)",
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            />

            {/* Avatar and name overlay */}
            <Box sx={{ px: 2, pb: 2, position: "relative" }}>
              <Link
                to={`/profiles/${member.slug}`}
                style={{ textDecoration: "none" }}
              >
                <Avatar
                  src={member.imageUrl || "/images/user.png"}
                  alt={member.displayName}
                  sx={{
                    width: 90,
                    height: 90,
                    border: "4px solid",
                    borderColor: "background.paper",
                    position: "relative",
                    top: -45,
                  }}
                />
              </Link>
              <Box sx={{ mt: -3 }}>
                <Typography
                  variant="h6"
                  fontWeight={700}
                  component={Link}
                  to={`/profiles/${member.slug}`}
                  sx={{
                    color: "text.primary",
                    textDecoration: "none",
                    "&:hover": { textDecoration: "underline" },
                  }}
                >
                  {member.displayName}
                </Typography>
                {formattedTag && (
                  <Typography variant="body2" color="text.secondary">
                    #{formattedTag}
                  </Typography>
                )}
                <Typography variant="body2" color="text.secondary">
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
            <Box sx={{ p: 2 }}>
              <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1 }}>
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
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
