import Popover from "@mui/material/Popover";
import {Avatar, Box, Chip, Divider, IconButton, Stack, Typography,} from "@mui/material";
import {useEffect, useMemo, useState} from "react";
import {Link} from "react-router";
import type {Profile} from "../../../lib/types";
import type {ChatRoomRole} from "../../../lib/schemas/chatRoomRoleSchema";
import {formatUserTag} from "../../../lib/util/util";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import ChatRoomMemberActions from "./ChatRoomMemberActions";
import {useChatRoomRoles} from "../../../lib/hooks/useChatRoomRoles";

type Props = {
  open: boolean;
  anchorEl: HTMLElement | null;
  onClose: () => void;
  member?: Profile;
  chatRoomId: string;
  ownerId: string;
};

export default function ChatRoomMemberPopover(
  {
    open,
    anchorEl,
    onClose,
    member,
    chatRoomId,
    ownerId,
  }: Props) {
  const {usersRolesMap, isLoading} = useChatRoomRoles(chatRoomId);
  const [actionsAnchor, setActionsAnchor] = useState<HTMLElement | null>(null);
  const memberRoles = useMemo<ChatRoomRole[]>(() => {
    if (!member) return [];
    return usersRolesMap.get(member.id) ?? [];
  }, [member, usersRolesMap]);

  const openActions = (e: React.MouseEvent<HTMLElement>) =>
    setActionsAnchor(e.currentTarget);
  const closeActions = () => setActionsAnchor(null);

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
        anchorOrigin={{vertical: "center", horizontal: "left"}}
        transformOrigin={{vertical: "center", horizontal: "right"}}
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
          <Box sx={{width: 340}}>
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
                    "&:hover": {bgcolor: "rgba(0,0,0,0.55)"},
                  }}
                >
                  <MoreHorizIcon fontSize="small"/>
                </IconButton>
              </span>
            </Box>
            {/* Avatar + name */}
            <Box sx={{px: 2, pb: 2, position: "relative"}}>
              <Link
                to={`/profiles/${member.slug}`}
                style={{textDecoration: "none"}}
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
              <Box sx={{mt: -2}}>
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
                      "&:hover": {textDecoration: "underline"},
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
                    sx={{mt: 1.5}}
                  >
                    {member.bio}
                  </Typography>
                )}
              </Box>
            </Box>

            <Divider/>
            {/* Roles */}
            <Box sx={{p: 1.5}}>
              <Typography variant="subtitle2" sx={{mb: 1}}>
                Roles
              </Typography>
              {isLoading ? (
                <Typography variant="body2" color="text.secondary">
                  Loading roles...
                </Typography>
              ) : memberRoles.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  No roles assigned.
                </Typography>
              ) : (
                <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                  {memberRoles.map((r) => (
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
        member={member}
        isOwner={member?.id === ownerId}
      />
    </>
  );
}
