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
    Tooltip,
    Typography,
} from "@mui/material";
import {useEffect, useMemo, useRef, useState} from "react";
import {CallEnd, Chat, ExitToApp, ExpandLess, ExpandMore, People, Settings, VolumeUp,} from "@mui/icons-material";
import {useParams} from "react-router";
import {useChatRooms} from "../../lib/hooks/useChatRooms";
import {useVoiceChannel} from "../../lib/hooks/useVoiceChannel";
import ChatRoomSettings from "./settings/ChatRoomSettings";
import InvitePeopleModal from "./invites/InvitePeopleModal";
import {useAccount} from "../../lib/hooks/useAccount";
import {useChatRoomRolesRealtime} from "../../lib/hooks/useChatRoomRolesRealtime";
import {CHATROOM_PERMISSIONS} from "../../lib/types/chatroomPermissions";

export default function ChatRoomSidebarContent() {
    const {slug} = useParams();
    const {currentUser} = useAccount();
    const {chatRoom, isLoadingChatRoom, leaveChatRoom, deleteChatRooms} =
        useChatRooms(slug);
    const {rolesStore} = useChatRoomRolesRealtime(
        chatRoom?.id,
        currentUser?.id
    );
    const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [inviteOpen, setInviteOpen] = useState(false);

    const menuOpen = Boolean(menuAnchorEl);
    const voiceChannels = useMemo(
        () =>
            (chatRoom?.channels ?? [])
                .filter((channel) => channel.type === "Voice")
                .sort((a, b) => a.position - b.position),
        [chatRoom?.channels]
    );

    const voice = useVoiceChannel(chatRoom?.id);

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
        if (voice.isJoining && voice.currentChannelId !== channelId) return;
        if (voice.currentChannelId === channelId) {
            void voice.leave();
        } else {
            void voice.join(channelId);
        }
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
                <ListItemButton>
                    <ListItemIcon>
                        <Chat/>
                    </ListItemIcon>
                    <ListItemText primary="# general"/>
                </ListItemButton>
                <ListItemButton>
                    <ListItemIcon>
                        <Chat/>
                    </ListItemIcon>
                    <ListItemText primary="# memes"/>
                </ListItemButton>
                <ListItemButton>
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
                        const participants = isActive ? voice.participants : [];
                        const participantCount = isActive ? voice.allParticipants.length : 0;

                        return (
                            <Box component="li" key={channel.id} sx={{mb: 0.5}}>
                                <ListItemButton
                                    onClick={() => handleVoiceChannelClick(channel.id)}
                                    selected={isActive}
                                    disabled={voice.isJoining && !isActive}
                                    sx={{
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "space-between",
                                        borderRadius: 1.5,
                                    }}
                                >
                                    <Box sx={{display: "flex", alignItems: "center", gap: 1}}>
                                        <ListItemIcon sx={{minWidth: 32}}>
                                            <VolumeUp fontSize="small"/>
                                        </ListItemIcon>
                                        <ListItemText
                                            primary={channel.name}
                                            secondary={
                                                isActive
                                                    ? voice.isJoining
                                                        ? "Connecting..."
                                                        : `${participantCount} connected`
                                                    : undefined
                                            }
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
                                                void voice.leave();
                                            }}
                                            sx={{color: "error.main"}}
                                            aria-label="Leave channel"
                                        >
                                            <CallEnd fontSize="small"/>
                                        </IconButton>
                                    )}
                                </ListItemButton>
                                {isActive && participants.length > 0 && (
                                    <Box
                                        sx={{
                                            pl: 6,
                                            pr: 2,
                                            pb: 1,
                                            display: "flex",
                                            flexWrap: "wrap",
                                            gap: 0.75,
                                        }}
                                    >
                                        {participants.map((participant) => {
                                            const isSelf = participant.userId === currentUser?.id;
                                            const initials = participant.displayName?.charAt(0) ?? "?";
                                            return (
                                                <Tooltip title={participant.displayName} arrow key={participant.userId}>
                                                    <Avatar
                                                        src={participant.imageUrl ?? undefined}
                                                        sx={{
                                                            width: 30,
                                                            height: 30,
                                                            fontSize: 14,
                                                            bgcolor: isSelf ? "primary.main" : "#2f3136",
                                                            border: isSelf ? "2px solid #5865f2" : "1px solid #3b3d43",
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
                        );
                    })
                )}
            </List>
            {voice.error && (
                <Typography variant="caption" color="error" sx={{display: "block", mt: 1}}>
                    {voice.error}
                </Typography>
            )}
            {voice.remoteStreams.map(({connectionId, stream}) => (
                <RemoteAudio key={connectionId} stream={stream}/>
            ))}
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


function RemoteAudio({stream}: { stream: MediaStream }) {
    const audioRef = useRef<HTMLAudioElement>(null);

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;
        audio.srcObject = stream;
        const playPromise = audio.play();
        if (playPromise) {
            playPromise.catch(() => {
            });
        }
    }, [stream]);

    return <audio ref={audioRef} autoPlay playsInline style={{display: "none"}}/>;
}