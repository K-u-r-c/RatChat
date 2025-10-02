import {
  Avatar,
  Badge,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemSecondaryAction,
  ListItemText,
  Menu,
  MenuItem,
  Slider,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import {useEffect, useMemo, useState} from "react";
import {observer} from "mobx-react-lite";
import {
  Add,
  CallEnd,
  Chat,
  Delete,
  Edit,
  ExitToApp,
  ExpandLess,
  ExpandMore,
  MicOff,
  MoreVert,
  People,
  Settings,
  VolumeUp,
} from "@mui/icons-material";
import {useParams} from "react-router";
import {useChatRooms} from "../../lib/hooks/useChatRooms";
import {useVoiceChannel} from "../../lib/hooks/useVoiceChannel";
import type {VoiceParticipant} from "../../lib/realtime/voiceHub";
import ChatRoomSettings from "./settings/ChatRoomSettings";
import InvitePeopleModal from "./invites/InvitePeopleModal";
import {useAccount} from "../../lib/hooks/useAccount";
import {useStore} from "../../lib/hooks/useStore";
import {CHATROOM_PERMISSIONS} from "../../lib/types/chatroomPermissions";
import {useChatRoomRoles} from "../../lib/hooks/useChatRoomRoles";
import {toast} from "react-toastify";
import type {ChatChannel} from "../../lib/types";
import ConfirmDialog from "../../app/shared/components/ConfirmDialog";

function uniqueVoiceParticipants(
  participants: VoiceParticipant[]
): VoiceParticipant[] {
  const unique = new Map<string, VoiceParticipant>();
  for (const participant of participants) {
    const existing = unique.get(participant.userId);
    if (!existing) {
      unique.set(participant.userId, participant);
    } else if (!existing.isMuted && participant.isMuted) {
      unique.set(participant.userId, {
        ...existing,
        isMuted: participant.isMuted,
      });
    }
  }
  return Array.from(unique.values());
}

const ChatRoomSidebarContent = observer(function ChatRoomSidebarContent() {
  const {slug} = useParams();
  const {currentUser} = useAccount();
  const {
    chatRoom,
    isLoadingChatRoom,
    leaveChatRoom,
    deleteChatRooms,
    createChannel: createChannelMutation,
    updateChannel: updateChannelMutation,
    deleteChannel: deleteChannelMutation,
  } = useChatRooms(slug);
  const {userPermissions} = useChatRoomRoles(chatRoom?.id, currentUser?.id);
  const {uiStore, messagesNotificationsStore} = useStore();
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [volumeMenu, setVolumeMenu] = useState<{
    anchor: { left: number; top: number };
    participant: VoiceParticipant;
  } | null>(null);
  const [channelDialog, setChannelDialog] = useState<
    | {
    mode: "create" | "edit";
    type: ChatChannel["type"];
    channel?: ChatChannel;
  }
    | null
  >(null);
  const [channelName, setChannelName] = useState("");
  const [channelMenu, setChannelMenu] = useState<
    | {
    anchor: HTMLElement;
    channel: ChatChannel;
  }
    | null
  >(null);
  const [leaveDialogOpen, setLeaveDialogOpen] = useState(false);
  const [deleteServerDialogOpen, setDeleteServerDialogOpen] = useState(false);
  const [deleteChannelTarget, setDeleteChannelTarget] = useState<ChatChannel | null>(null);

  const menuOpen = Boolean(menuAnchorEl);
  const textChannels = useMemo(
    () =>
      (chatRoom?.channels ?? [])
        .filter((channel) => channel.type === "Text")
        .sort((a, b) => a.position - b.position),
    [chatRoom?.channels]
  );

  const voiceChannels = useMemo(
    () =>
      (chatRoom?.channels ?? [])
        .filter((channel) => channel.type === "Voice")
        .sort((a, b) => a.position - b.position),
    [chatRoom?.channels]
  );

  const voice = useVoiceChannel(chatRoom?.id, currentUser?.id);
  const selectedTextChannelId =
    chatRoom?.id != null
      ? uiStore.getSelectedTextChannel(chatRoom.id) ?? textChannels[0]?.id
      : undefined;
  const activeRoomView = chatRoom
    ? uiStore.getChatRoomView(chatRoom.id)
    : "chat";
  const isChatView = activeRoomView === "chat";
  const canManageChannels =
    !!chatRoom &&
    (chatRoom.isOwner ||
      userPermissions[CHATROOM_PERMISSIONS.ManageChannels]);
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

  useEffect(() => {
    if (!chatRoom?.id) return;
    if (textChannels.length === 0) {
      uiStore.clearSelectedTextChannel(chatRoom.id);
      return;
    }
    const current = uiStore.getSelectedTextChannel(chatRoom.id);
    if (!current || !textChannels.some((channel) => channel.id === current)) {
      uiStore.setSelectedTextChannel(chatRoom.id, textChannels[0].id);
    }
  }, [chatRoom?.id, textChannels, uiStore]);

  const handleServerNameClick = (event: React.MouseEvent<HTMLElement>) => {
    setMenuAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
  };

  const handleLeave = async () => {
    setLeaveDialogOpen(true);
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

  const handleDeleteChannel = async (channel: ChatChannel) => {
    if (!chatRoom) return;
    if (channel.type === "Text" && textChannels.length <= 1) {
      toast.error("At least one text channel is required.");
      return;
    }
    try {
      await deleteChannelMutation.mutateAsync({
        chatRoomId: chatRoom.id,
        channelId: channel.id,
      });
      if (channel.type === "Text") {
        const remaining = textChannels.filter((c) => c.id !== channel.id);
        if (remaining.length > 0) {
          uiStore.setSelectedTextChannel(chatRoom.id, remaining[0].id);
        } else {
          uiStore.clearSelectedTextChannel(chatRoom.id);
        }
        uiStore.setChatRoomView(chatRoom.id, "chat");
      }
      toast.success("Channel deleted");
    } catch {
      // handled by mutation onError
    } finally {
      setDeleteChannelTarget(null);
    }
  };

  const isChannelSaving =
    createChannelMutation.isPending || updateChannelMutation.isPending;

  const handleChannelDialogSubmit = async () => {
    if (!chatRoom || !channelDialog) return;
    const trimmedName = channelName.trim();
    if (!trimmedName) {
      toast.error("Channel name cannot be empty");
      return;
    }

    if (channelDialog.mode === "create") {
      try {
        const channel = await createChannelMutation.mutateAsync({
          chatRoomId: chatRoom.id,
          name: trimmedName,
          type: channelDialog.type,
        });

        if (channelDialog.type === "Text") {
          uiStore.setSelectedTextChannel(chatRoom.id, channel.id);
          uiStore.setChatRoomView(chatRoom.id, "chat");
        }

        toast.success("Channel created");
        setChannelDialog(null);
        setChannelName("");
      } catch {
        // errors handled by mutation
      }
    } else if (channelDialog.mode === "edit" && channelDialog.channel) {
      try {
        const channel = await updateChannelMutation.mutateAsync({
          chatRoomId: chatRoom.id,
          channelId: channelDialog.channel.id,
          name: trimmedName,
        });

        if (
          channelDialog.type === "Text" &&
          selectedTextChannelId === channel.id
        ) {
          uiStore.setSelectedTextChannel(chatRoom.id, channel.id);
        }

        toast.success("Channel updated");
        setChannelDialog(null);
        setChannelName("");
      } catch {
        // handled by mutation
      }
    }
  };

  const handleChannelDialogClose = () => {
    if (isChannelSaving) return;
    setChannelDialog(null);
    setChannelName("");
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
            userPermissions[CHATROOM_PERMISSIONS.CreateInviteLinks]) && (
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
              onClick={() => {
                setDeleteServerDialogOpen(true);
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
      <Box sx={{display: "flex", alignItems: "center", mb: 1}}>
        <Typography variant="subtitle2" color="text.secondary" sx={{flex: 1}}>
          Text Channels
        </Typography>
        {canManageChannels && (
          <Tooltip title="Create text channel">
            <IconButton
              size="small"
              onClick={() => {
                setChannelName("");
                setChannelDialog({mode: "create", type: "Text"});
              }}
            >
              <Add fontSize="small"/>
            </IconButton>
          </Tooltip>
        )}
      </Box>
      <List>
        {textChannels.length === 0 ? (
          <ListItem>
            <ListItemText
              primary="No text channels yet."
              primaryTypographyProps={{
                color: "text.secondary",
                variant: "body2",
              }}
            />
          </ListItem>
        ) : (
          textChannels.map((channel) => {
            const unreadCount = chatRoom
              ? messagesNotificationsStore.getChannelUnread(
                chatRoom.id,
                channel.id
              )
              : 0;

            const isSelected =
              isChatView && selectedTextChannelId === channel.id;

            return (
              <ListItem disablePadding key={channel.id}>
                <ListItemButton
                  selected={isSelected}
                  onClick={() => {
                    if (!chatRoom?.id) return;
                    uiStore.setSelectedTextChannel(chatRoom.id, channel.id);
                    messagesNotificationsStore.setActiveChannel(
                      chatRoom.id,
                      channel.id
                    );
                    uiStore.setChatRoomView(chatRoom.id, "chat");
                  }}
                >
                  <ListItemIcon>
                    <Badge
                      color="primary"
                      badgeContent={unreadCount}
                      invisible={!unreadCount}
                      overlap="circular"
                    >
                      <Chat/>
                    </Badge>
                  </ListItemIcon>
                  <ListItemText
                    primary={`# ${channel.name}`}
                    primaryTypographyProps={{
                      fontSize: 14,
                      fontWeight: unreadCount > 0 && !isSelected ? 600 : 500,
                    }}
                  />
                </ListItemButton>
                {canManageChannels && (
                  <ListItemSecondaryAction>
                    <IconButton
                      edge="end"
                      size="small"
                      onClick={(event) => {
                        event.stopPropagation();
                        setChannelMenu({anchor: event.currentTarget, channel});
                      }}
                    >
                      <MoreVert fontSize="small"/>
                    </IconButton>
                  </ListItemSecondaryAction>
                )}
              </ListItem>
            );
          })
        )}
      </List>

      <Menu
        anchorEl={channelMenu?.anchor ?? null}
        open={Boolean(channelMenu)}
        onClose={() => setChannelMenu(null)}
        slotProps={{
          paper: {
            sx: {
              bgcolor: "rgba(19,19,22)",
              borderRadius: 2,
              minWidth: 180,
            },
          },
        }}
      >
        <MenuItem
          onClick={() => {
            if (!channelMenu) return;
            setChannelDialog({
              mode: "edit",
              type: channelMenu.channel.type,
              channel: channelMenu.channel,
            });
            setChannelName(channelMenu.channel.name);
            setChannelMenu(null);
          }}
        >
          <ListItemIcon>
            <Edit fontSize="small"/>
          </ListItemIcon>
          Rename
        </MenuItem>
        <MenuItem
          onClick={() => {
            if (!channelMenu) return;
            const target = channelMenu.channel;
            setChannelMenu(null);
            if (target.type === "Text" && textChannels.length <= 1) {
              toast.error("At least one text channel is required.");
              return;
            }
            setDeleteChannelTarget(target);
          }}
          sx={{color: "error.main"}}
        >
          <ListItemIcon>
            <Delete fontSize="small" sx={{color: "error.main"}}/>
          </ListItemIcon>
          Delete
        </MenuItem>
      </Menu>

      <Dialog
        open={Boolean(channelDialog)}
        onClose={handleChannelDialogClose}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>
          {channelDialog?.mode === "create"
            ? `Create ${channelDialog?.type === "Text" ? "text" : "voice"} channel`
            : `Rename ${channelDialog?.type === "Text" ? "text" : "voice"} channel`}
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Channel name"
            fullWidth
            value={channelName}
            onChange={(event) => setChannelName(event.target.value)}
            disabled={isChannelSaving}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleChannelDialogClose} disabled={isChannelSaving}>
            Cancel
          </Button>
          <Button
            onClick={handleChannelDialogSubmit}
            variant="contained"
            disabled={isChannelSaving || channelName.trim().length === 0}
          >
            {channelDialog?.mode === "create" ? "Create" : "Save"}
          </Button>
        </DialogActions>
      </Dialog>

      <Divider sx={{my: 2}}/>
      {/* Voice channels */}
      <Box sx={{display: "flex", alignItems: "center", mb: 1}}>
        <Typography variant="subtitle2" color="text.secondary" sx={{flex: 1}}>
          Voice Channels
        </Typography>
        {canManageChannels && (
          <Tooltip title="Create voice channel">
            <IconButton
              size="small"
              onClick={() => {
                setChannelName("");
                setChannelDialog({mode: "create", type: "Voice"});
              }}
            >
              <Add fontSize="small"/>
            </IconButton>
          </Tooltip>
        )}
      </Box>
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
            const uniqueChannelParticipants =
              uniqueVoiceParticipants(channelPresence);
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
                    border: isActive
                      ? "1px solid #5865f2"
                      : "1px solid transparent",
                    overflow: "hidden",
                    transition:
                      "background-color 0.2s ease, border-color 0.2s ease",
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
                        primaryTypographyProps={{
                          fontSize: 14,
                          fontWeight: 500,
                        }}
                        secondaryTypographyProps={{
                          fontSize: 12,
                          color: "text.secondary",
                        }}
                      />
                    </Box>
                    <Box sx={{display: "flex", alignItems: "center", gap: 0.5}}>
                      {canManageChannels && (
                        <IconButton
                          size="small"
                          edge="end"
                          onClick={(event) => {
                            event.stopPropagation();
                            setChannelMenu({
                              anchor: event.currentTarget,
                              channel,
                            });
                          }}
                          aria-label="Channel options"
                        >
                          <MoreVert fontSize="small"/>
                        </IconButton>
                      )}
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
                    </Box>
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
                        const mutedByYou = mutedParticipantIdsSet.has(
                          participant.userId
                        );
                        const selfMuted = isSelf
                          ? voice.isSelfMuted
                          : Boolean(participant.isMuted);
                        const isMuted = mutedByYou || selfMuted;
                        const isSpeaking = activeSpeakersSet.has(
                          participant.userId
                        );
                        const initials =
                          participant.displayName?.charAt(0) ?? "?";
                        const handleParticipantContextMenu = (
                          event: React.MouseEvent
                        ) => {
                          event.preventDefault();
                          setVolumeMenu({
                            anchor: {left: event.clientX, top: event.clientY},
                            participant,
                          });
                        };
                        return (
                          <Tooltip
                            title={participant.displayName}
                            arrow
                            key={participant.userId}
                          >
                            <Box
                              sx={{
                                position: "relative",
                                display: "inline-flex",
                              }}
                            >
                              <Avatar
                                src={participant.imageUrl ?? undefined}
                                onContextMenu={handleParticipantContextMenu}
                                sx={{
                                  width: 30,
                                  height: 30,
                                  fontSize: 14,
                                  bgcolor: isSelfActive
                                    ? "primary.main"
                                    : "#2f3136",
                                  border: isSelfActive
                                    ? `2px solid ${
                                      isSpeaking ? "#43b581" : "#5865f2"
                                    }`
                                    : `1px solid ${
                                      isSpeaking ? "#43b581" : "#3b3d43"
                                    }`,
                                  boxShadow: isSpeaking
                                    ? "0 0 0 2px rgba(67,181,129,0.35)"
                                    : "none",
                                  opacity: isMuted ? 0.6 : 1,
                                  transition:
                                    "box-shadow 0.2s ease, border-color 0.2s ease, opacity 0.2s ease",
                                }}
                              >
                                {participant.imageUrl
                                  ? null
                                  : initials.toUpperCase()}
                              </Avatar>
                              {selfMuted && (
                                <Box
                                  sx={{
                                    position: "absolute",
                                    bottom: -2,
                                    right: -2,
                                    bgcolor: "rgba(32,34,37,0.95)",
                                    borderRadius: "50%",
                                    border: "1px solid rgba(0,0,0,0.55)",
                                    width: 18,
                                    height: 18,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    boxShadow: "0 2px 4px rgba(0,0,0,0.6)",
                                    pointerEvents: "none",
                                  }}
                                >
                                  <MicOff
                                    sx={{fontSize: 12, color: "#ff7a7a"}}
                                  />
                                </Box>
                              )}
                            </Box>
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
        <Typography
          variant="caption"
          color="error"
          sx={{display: "block", mt: 1}}
        >
          {voice.error}
        </Typography>
      )}
      <Menu
        open={Boolean(volumeMenu)}
        onClose={() => setVolumeMenu(null)}
        anchorReference="anchorPosition"
        anchorPosition={
          volumeMenu
            ? {left: volumeMenu.anchor.left, top: volumeMenu.anchor.top}
            : undefined
        }
        MenuListProps={{disablePadding: true}}
      >
        {volumeMenu && (
          <>
            <Box sx={{px: 2, pt: 1.5, width: 220}}>
              <Typography variant="body2" sx={{fontWeight: 600, mb: 1}}>
                {volumeMenu.participant.displayName}
              </Typography>
              <Slider
                value={Math.round(
                  (voice.participantVolumes[volumeMenu.participant.userId] ??
                    1) * 100
                )}
                onChange={(_, value) => {
                  const vol = Array.isArray(value) ? value[0] : value;
                  voice.setParticipantVolume(
                    volumeMenu.participant.userId,
                    vol / 100
                  );
                  if (
                    mutedParticipantIdsSet.has(volumeMenu.participant.userId) &&
                    vol > 0
                  ) {
                    voice.toggleParticipantMute(
                      volumeMenu.participant.userId,
                      false
                    );
                  }
                }}
                onChangeCommitted={(_, value) => {
                  const vol = Array.isArray(value) ? value[0] : value;
                  voice.setParticipantVolume(
                    volumeMenu.participant.userId,
                    vol / 100
                  );
                  if (
                    mutedParticipantIdsSet.has(volumeMenu.participant.userId) &&
                    vol > 0
                  ) {
                    voice.toggleParticipantMute(
                      volumeMenu.participant.userId,
                      false
                    );
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
              {mutedParticipantIdsSet.has(volumeMenu.participant.userId)
                ? "Unmute User"
                : "Mute User"}
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
      <ConfirmDialog
        open={leaveDialogOpen}
        onClose={() => !leaveChatRoom.isPending && setLeaveDialogOpen(false)}
        onConfirm={async () => {
          if (leaveChatRoom.isPending || !chatRoom?.id) return;
          await leaveChatRoom.mutateAsync(chatRoom.id);
          setLeaveDialogOpen(false);
        }}
        title="Confirm leave"
        message={"Are you sure you want to leave this chat room?"}
        confirmText="Leave"
        confirmColor="error"
        isProcessing={leaveChatRoom.isPending}
        ariaLabel="confirm-leave-server"
      />
      <ConfirmDialog
        open={deleteServerDialogOpen}
        onClose={() => !deleteChatRooms.isPending && setDeleteServerDialogOpen(false)}
        onConfirm={async () => {
          if (deleteChatRooms.isPending || !chatRoom?.id) return;
          await deleteChatRooms.mutateAsync(chatRoom.id);
          setDeleteServerDialogOpen(false);
        }}
        title="Delete server"
        message="Are you sure you want to delete this chat room?"
        confirmText="Delete"
        confirmColor="error"
        isProcessing={deleteChatRooms.isPending}
        ariaLabel="confirm-delete-server"
      />
      <ConfirmDialog
        open={!!deleteChannelTarget}
        onClose={() => !deleteChannelMutation.isPending && setDeleteChannelTarget(null)}
        onConfirm={() => {
          if (deleteChannelTarget) void handleDeleteChannel(deleteChannelTarget);
        }}
        title="Delete channel"
        message={deleteChannelTarget ? `Delete #${deleteChannelTarget.name}? This cannot be undone.` : ''}
        confirmText="Delete"
        confirmColor="error"
        isProcessing={deleteChannelMutation.isPending}
        ariaLabel="confirm-delete-channel"
      />
    </Box>
  );
});

export default ChatRoomSidebarContent;
