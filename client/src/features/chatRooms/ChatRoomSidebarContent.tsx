import {
  Avatar,
  Box,
  Divider,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Slider,
  Tooltip,
  Typography,
} from "@mui/material";
import {useEffect, useMemo, useState} from "react";
import {CallEnd, Chat, ExitToApp, ExpandLess, ExpandMore, People, Settings, VolumeUp,} from "@mui/icons-material";
import {useParams} from "react-router";
import {useChatRooms} from "../../lib/hooks/useChatRooms";
import {useVoiceChannel} from "../../lib/hooks/useVoiceChannel";
import type {VoiceParticipant} from "../../lib/realtime/voiceHub";
import ChatRoomSettings from "./settings/ChatRoomSettings";
import InvitePeopleModal from "./invites/InvitePeopleModal";
import {useAccount} from "../../lib/hooks/useAccount";
import {useStore} from "../../lib/hooks/useStore";
import {useChatRoomRolesRealtime} from "../../lib/hooks/useChatRoomRolesRealtime";
import {CHATROOM_PERMISSIONS} from "../../lib/types/chatroomPermissions";

function uniqueVoiceParticipants(participants: VoiceParticipant[]): VoiceParticipant[] {
  const unique = new Map<string, VoiceParticipant>();
  for (const participant of participants) {
    if (!unique.has(participant.userId)) {
      unique.set(participant.userId, participant);
    }
  }
  return Array.from(unique.values());
}

export default function ChatRoomSidebarContent() {
  const {slug} = useParams();
  const {currentUser} = useAccount();
  const {chatRoom, isLoadingChatRoom, leaveChatRoom, deleteChatRooms} =
    useChatRooms(slug);
  const {rolesStore} = useChatRoomRolesRealtime(
    chatRoom?.id,
    currentUser?.id
  );
  const {uiStore} = useStore();
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [volumeMenu, setVolumeMenu] = useState<
    { anchor: { left: number; top: number }; participant: VoiceParticipant } | null
  >(null);
  const [selectedTextChannel, setSelectedTextChannel] = useState<string>("general");

  const menuOpen = Boolean(menuAnchorEl);
  const voiceChannels = useMemo(
    () =>
      (chatRoom?.channels ?? [])
        .filter((channel) => channel.type === "Voice")
        .sort((a, b) => a.position - b.position),
    [chatRoom?.channels]
  );

  const voice = useVoiceChannel(chatRoom?.id, currentUser?.id);
  const activeRoomView = chatRoom ? uiStore.getChatRoomView(chatRoom.id) : "chat";
  const isChatView = activeRoomView === "chat";
  const mutedParticipantIdsSet = useMemo(
    () => new Set(voice.mutedParticipantIds),
    [voice.mutedParticipantIds]
  );
  const activeSpeakersSet = useMemo(
    () => new Set(voice.activeSpeakers),
    [voice.activeSpeakers]
  );

  useEffect(() => {
    if (!chatRoom?.id) return;
    const currentView = uiStore.getChatRoomView(chatRoom.id);
    if (!voice.currentChannelId || voice.currentChatRoomId !== chatRoom.id) {
      if (currentView !== "chat") {
        uiStore.setChatRoomView(chatRoom.id, "chat");
      }
    }
  }, [chatRoom?.id, uiStore, voice.currentChannelId, voice.currentChatRoomId]);

  const handleServerNameClick = (event: React.MouseEvent<HTMLElement>) => {
    setMenuAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
  };

  const handleLeave = async () => {
    const message = chatRoom?.isOwner
      ? "Are you sure you want to leave this chat room?\n\nAs the owner, leaving will transfer ownership to the oldest user or delete the room if you are the last member."
      : "Are you sure you want to leave this chat room?";

    if (window.confirm(message)) {
      if (!chatRoom?.id) return;
      await leaveChatRoom.mutateAsync(chatRoom.id);
    }
  };

  if (!chatRoom || isLoadingChatRoom) {
    return (
      <Box
        sx={{
          width: "100%",
          height: "100%",
          p: 2,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Typography variant="h6">Loading...</Typography>
      </Box>
    );
  }

  const handleVoiceChannelClick = (channelId: string) => {
    if (!chatRoom?.id) return;
    if (voice.isJoining && voice.currentChannelId !== channelId) return;
    if (voice.currentChannelId === channelId) {
      uiStore.setChatRoomView(chatRoom.id, "screen-share");
      return;
    }
    uiStore.setChatRoomView(chatRoom.id, "screen-share");
    void voice.join(channelId);
  };
  return (
    <Box sx={{width: "100%", p: 2}}>
      {/* Server name and menu */}
      <Box sx={{mb: 2, display: "flex", alignItems: "center", gap: 1}}>
        <Typography
          variant="h6"
          sx={{
            cursor: "pointer",
            fontWeight: "bold",
            bgcolor: "#1e1f24",
            color: "white",
            px: 2,
            py: 1,
            width: "100%",
            borderRadius: 2,
            "&:hover": {bgcolor: "#2e2f33ff"},
            display: "flex",
            alignItems: "center",
            gap: 1,
          }}
          onClick={handleServerNameClick}
        >
          {chatRoom?.title}
          {menuOpen ? (
            <ExpandLess sx={{ml: 1, fontSize: 22}}/>
          ) : (
            <ExpandMore sx={{ml: 1, fontSize: 22}}/>
          )}
        </Typography>
        <Menu
          anchorEl={menuAnchorEl}
          open={menuOpen}
          onClose={handleMenuClose}
          slotProps={{
            paper: {
              sx: {
                bgcolor: "rgba(19,19,22)",
                borderRadius: 2,
                p: 1,
              },
            },
          }}
        >
          {(chatRoom.isOwner ||
            rolesStore.userPermissions[
              CHATROOM_PERMISSIONS.CreateInviteLinks
              ]) && (
            <MenuItem
              onClick={() => {
                setInviteOpen(true);
                handleMenuClose();
              }}
            >
              <ListItemIcon>
                <People fontSize="small"/>
              </ListItemIcon>
              Invite people
            </MenuItem>
          )}
          <MenuItem onClick={handleMenuClose} sx={{display: "none"}}>
            <ListItemIcon>
              <People fontSize="small"/>
            </ListItemIcon>
            Invite people
          </MenuItem>
          <MenuItem
            onClick={() => {
              setSettingsOpen(true);
              handleMenuClose();
            }}
          >
            <ListItemIcon>
              <Settings fontSize="small"/>
            </ListItemIcon>
            Server settings
          </MenuItem>
          {chatRoom.isOwner ? (
            <MenuItem
              onClick={async () => {
                if (
                  window.confirm(
                    "Are you sure you want to delete this chat room?"
                  )
                ) {
                  if (!chatRoom?.id) return;
                  await deleteChatRooms.mutateAsync(chatRoom.id);
                }
                handleMenuClose();
              }}
              sx={{color: "error.main"}}
            >
              <ListItemIcon>
                <ExitToApp fontSize="small" sx={{color: "error.main"}}/>
              </ListItemIcon>
              Delete server
            </MenuItem>
          ) : (
            <MenuItem
              onClick={() => {
                handleLeave();
                handleMenuClose();
              }}
              sx={{color: "error.main"}}
            >
              <ListItemIcon>
                <ExitToApp fontSize="small" sx={{color: "error.main"}}/>
              </ListItemIcon>
              Leave server
            </MenuItem>
          )}
        </Menu>
      </Box>

      {/* Text channels */}
      <Typography variant="subtitle2" color="text.secondary" sx={{mb: 1}}>
        Text Channels
      </Typography>
      <List>
        <ListItemButton
          selected={isChatView && selectedTextChannel === "general"}
          onClick={() => {
            setSelectedTextChannel("general");
            if (chatRoom?.id) {
              uiStore.setChatRoomView(chatRoom.id, "chat");
            }
          }}
        >
          <ListItemIcon>
            <Chat/>
          </ListItemIcon>
          <ListItemText primary="# general"/>
        </ListItemButton>
        <ListItemButton
          selected={isChatView && selectedTextChannel === "memes"}
          onClick={() => {
            setSelectedTextChannel("memes");
            if (chatRoom?.id) {
              uiStore.setChatRoomView(chatRoom.id, "chat");
            }
          }}
        >
          <ListItemIcon>
            <Chat/>
          </ListItemIcon>
          <ListItemText primary="# memes"/>
        </ListItemButton>
        <ListItemButton
          selected={isChatView && selectedTextChannel === "tech-talk"}
          onClick={() => {
            setSelectedTextChannel("tech-talk");
            if (chatRoom?.id) {
              uiStore.setChatRoomView(chatRoom.id, "chat");
            }
          }}
        >
          <ListItemIcon>
            <Chat/>
          </ListItemIcon>
          <ListItemText primary="# tech-talk"/>
        </ListItemButton>
      </List>

      <Divider sx={{my: 2}}/>
      {/* Voice channels */}
      <Typography variant="subtitle2" color="text.secondary" sx={{mb: 1}}>
        Voice Channels
      </Typography>
      <List sx={{listStyle: "none", pl: 0}}>
        {voiceChannels.length === 0 ? (
          <Box component="li" sx={{px: 2, py: 1, color: "text.secondary"}}>
            <Typography variant="body2" color="text.secondary">
              No voice channels yet.
            </Typography>
          </Box>
        ) : (
          voiceChannels.map((channel) => {
            const isActive = voice.currentChannelId === channel.id;
            const channelPresence = voice.presenceByChannel[channel.id] ?? [];
            const uniqueChannelParticipants = uniqueVoiceParticipants(channelPresence);
            const participantCount = uniqueChannelParticipants.length;
            const secondaryText = isActive
              ? voice.isJoining
                ? "Connecting..."
                : participantCount > 0
                  ? participantCount + " connected"
                  : undefined
              : participantCount > 0
                ? participantCount + " connected"
                : undefined;

            return (
              <Box component="li" key={channel.id} sx={{mb: 0.75}}>
                <Box
                  sx={{
                    borderRadius: 1.5,
                    bgcolor: isActive ? "#2f3136" : "#1f2024",
                    border: isActive ? "1px solid #5865f2" : "1px solid transparent",
                    overflow: "hidden",
                    transition: "background-color 0.2s ease, border-color 0.2s ease",
                  }}
                >
                  <ListItemButton
                    onClick={() => handleVoiceChannelClick(channel.id)}
                    selected={isActive}
                    disabled={voice.isJoining && !isActive}
                    sx={{
                      alignItems: "center",
                      justifyContent: "space-between",
                      borderRadius: 1.5,
                      px: 2,
                      py: 1,
                      backgroundColor: "transparent",
                      "&.Mui-selected": {
                        backgroundColor: "transparent",
                      },
                      "&:hover": {
                        backgroundColor: isActive ? "#2f3136" : "#27292f",
                      },
                    }}
                  >
                    <Box sx={{display: "flex", alignItems: "center", gap: 1}}>
                      <ListItemIcon sx={{minWidth: 32}}>
                        <VolumeUp fontSize="small"/>
                      </ListItemIcon>
                      <ListItemText
                        primary={channel.name}
                        secondary={secondaryText}
                        primaryTypographyProps={{fontSize: 14, fontWeight: 500}}
                        secondaryTypographyProps={{fontSize: 12, color: "text.secondary"}}
                      />
                    </Box>
                    {isActive && (
                      <IconButton
                        size="small"
                        edge="end"
                        onClick={(event) => {
                          event.stopPropagation();
                          if (chatRoom?.id) {
                            uiStore.setChatRoomView(chatRoom.id, "chat");
                          }
                          void voice.leave();
                        }}
                        sx={{color: "error.main"}}
                        aria-label="Leave channel"
                      >
                        <CallEnd fontSize="small"/>
                      </IconButton>
                    )}

                  </ListItemButton>
                  {participantCount > 0 && (
                    <Box
                      sx={{
                        px: 2,
                        py: 1,
                        display: "flex",
                        flexWrap: "wrap",
                        gap: 0.75,
                      }}
                    >
                      {uniqueChannelParticipants.map((participant) => {
                        const isSelf = participant.userId === currentUser?.id;
                        const isSelfActive = isSelf && isActive;
                        const isMuted = mutedParticipantIdsSet.has(participant.userId);
                        const isSpeaking = activeSpeakersSet.has(participant.userId);
                        const initials = participant.displayName?.charAt(0) ?? "?";
                        const handleParticipantContextMenu = (event: React.MouseEvent) => {
                          event.preventDefault();
                          setVolumeMenu({
                            anchor: {left: event.clientX, top: event.clientY},
                            participant,
                          });
                        };
                        return (
                          <Tooltip title={participant.displayName} arrow key={participant.userId}>
                            <Avatar
                              src={participant.imageUrl ?? undefined}
                              onContextMenu={handleParticipantContextMenu}
                              sx={{
                                width: 30,
                                height: 30,
                                fontSize: 14,
                                bgcolor: isSelfActive ? "primary.main" : "#2f3136",
                                border: isSelfActive
                                  ? `2px solid ${isSpeaking ? "#43b581" : "#5865f2"}`
                                  : `1px solid ${isSpeaking ? "#43b581" : "#3b3d43"}`
                                ,
                                boxShadow: isSpeaking ? "0 0 0 2px rgba(67,181,129,0.35)" : "none",
                                opacity: isMuted ? 0.6 : 1,
                                transition: "box-shadow 0.2s ease, border-color 0.2s ease, opacity 0.2s ease",
                              }}
                            >
                              {participant.imageUrl ? null : initials.toUpperCase()}
                            </Avatar>
                          </Tooltip>
                        );
                      })}
                    </Box>
                  )}
                </Box>
              </Box>
            );
          })
        )}
      </List>
      {voice.error && (
        <Typography variant="caption" color="error" sx={{display: "block", mt: 1}}>
          {voice.error}
        </Typography>
      )}
      <Menu
        open={Boolean(volumeMenu)}
        onClose={() => setVolumeMenu(null)}
        anchorReference="anchorPosition"
        anchorPosition={volumeMenu ? {left: volumeMenu.anchor.left, top: volumeMenu.anchor.top} : undefined}
        MenuListProps={{disablePadding: true}}
      >
        {volumeMenu && (
          <>
            <Box sx={{px: 2, pt: 1.5, width: 220}}>
              <Typography variant="body2" sx={{fontWeight: 600, mb: 1}}>
                {volumeMenu.participant.displayName}
              </Typography>
              <Slider
                value={Math.round((voice.participantVolumes[volumeMenu.participant.userId] ?? 1) * 100)}
                onChange={(_, value) => {
                  const vol = Array.isArray(value) ? value[0] : value;
                  voice.setParticipantVolume(volumeMenu.participant.userId, vol / 100);
                  if (mutedParticipantIdsSet.has(volumeMenu.participant.userId) && vol > 0) {
                    voice.toggleParticipantMute(volumeMenu.participant.userId, false);
                  }
                }}
                onChangeCommitted={(_, value) => {
                  const vol = Array.isArray(value) ? value[0] : value;
                  voice.setParticipantVolume(volumeMenu.participant.userId, vol / 100);
                  if (mutedParticipantIdsSet.has(volumeMenu.participant.userId) && vol > 0) {
                    voice.toggleParticipantMute(volumeMenu.participant.userId, false);
                  }
                }}
                valueLabelDisplay="auto"
                min={0}
                max={100}
                sx={{mt: 1}}
              />
            </Box>
            <MenuItem
              onClick={() => {
                voice.toggleParticipantMute(volumeMenu.participant.userId);
                setVolumeMenu(null);
              }}
            >
              {mutedParticipantIdsSet.has(volumeMenu.participant.userId) ? "Unmute User" : "Mute User"}
            </MenuItem>
          </>
        )}
      </Menu>
      {/* Chat room setting menu popup */}
      <ChatRoomSettings
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        chatRoomId={chatRoom.id}
      />
      <InvitePeopleModal
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        chatRoomId={chatRoom.id}
      />
    </Box>
  );
}