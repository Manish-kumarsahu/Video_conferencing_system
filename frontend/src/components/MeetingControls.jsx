import React, { memo, useState } from 'react';
import { IconButton, Badge, Tooltip, Menu, MenuItem, ListItemIcon, ListItemText } from '@mui/material';
import VideocamIcon from '@mui/icons-material/Videocam';
import VideocamOffIcon from '@mui/icons-material/VideocamOff';
import CallEndIcon from '@mui/icons-material/CallEnd';
import LogoutIcon from '@mui/icons-material/Logout';
import MicIcon from '@mui/icons-material/Mic';
import MicOffIcon from '@mui/icons-material/MicOff';
import ScreenShareIcon from '@mui/icons-material/ScreenShare';
import StopScreenShareIcon from '@mui/icons-material/StopScreenShare';
import ClosedCaptionIcon from '@mui/icons-material/ClosedCaption';
import ClosedCaptionOffIcon from '@mui/icons-material/ClosedCaptionOff';
import ChatIcon from '@mui/icons-material/Chat';
import styles from '../styles/videoComponent.module.css';

/**
 * Bottom toolbar with video, audio, screen share, chat, participants, and end call controls.
 */
const MeetingControls = memo(function MeetingControls({
    video, audio, screen, screenAvailable, captionsOn,
    newMessages, activeTab, isHost, participantsCount,
    onToggleVideo, onToggleAudio, onToggleScreen, onToggleCaptions,
    onToggleChat, onTogglePeople, onLeaveCall, onEndMeetingAll
}) {
    const [anchorEl, setAnchorEl] = useState(null);
    const open = Boolean(anchorEl);

    const handleEndClick = (event) => {
        if (isHost) {
            setAnchorEl(event.currentTarget);
        } else {
            onLeaveCall();
        }
    };

    const handleClose = () => setAnchorEl(null);

    const handleLeave = () => {
        handleClose();
        onLeaveCall();
    };

    const handleEndAll = () => {
        handleClose();
        if (onEndMeetingAll) onEndMeetingAll();
    };

    return (
        <div className={styles.buttonContainers}>
            {/* ── Camera ── */}
            <Tooltip title={video ? "Turn off camera" : "Turn on camera"}>
                <IconButton
                    onClick={onToggleVideo}
                    sx={{
                        color: video ? "#fff" : "#ea4335",
                        background: video ? "rgba(255,255,255,0.08)" : "rgba(234,67,53,0.12)",
                        border: "1px solid",
                        borderColor: video ? "rgba(255,255,255,0.12)" : "rgba(234,67,53,0.3)",
                        borderRadius: "50%",
                        width: 50, height: 50,
                        transition: "all 0.2s ease",
                        "&:hover": {
                            background: "rgba(124,92,252,0.2)",
                            borderColor: "rgba(124,92,252,0.4)",
                        },
                    }}
                >
                    {video ? <VideocamIcon /> : <VideocamOffIcon />}
                </IconButton>
            </Tooltip>

            {/* ── Mic ── */}
            <Tooltip title={audio ? "Mute" : "Unmute"}>
                <IconButton
                    onClick={onToggleAudio}
                    sx={{
                        color: audio ? "#fff" : "#ea4335",
                        background: audio ? "rgba(255,255,255,0.08)" : "rgba(234,67,53,0.12)",
                        border: "1px solid",
                        borderColor: audio ? "rgba(255,255,255,0.12)" : "rgba(234,67,53,0.3)",
                        borderRadius: "50%",
                        width: 50, height: 50,
                        transition: "all 0.2s ease",
                        "&:hover": {
                            background: "rgba(124,92,252,0.2)",
                            borderColor: "rgba(124,92,252,0.4)",
                        },
                    }}
                >
                    {audio ? <MicIcon /> : <MicOffIcon />}
                </IconButton>
            </Tooltip>

            {/* ── Captions ── */}
            <Tooltip title={captionsOn ? "Turn off captions" : "Turn on captions"}>
                <IconButton
                    onClick={onToggleCaptions}
                    sx={{
                        color: captionsOn ? "#00d4ff" : "#fff",
                        background: captionsOn ? "rgba(0,212,255,0.12)" : "rgba(255,255,255,0.08)",
                        border: "1px solid",
                        borderColor: captionsOn ? "rgba(0,212,255,0.3)" : "rgba(255,255,255,0.12)",
                        borderRadius: "50%",
                        width: 50, height: 50,
                        transition: "all 0.2s ease",
                        "&:hover": {
                            background: "rgba(0,212,255,0.2)",
                        },
                    }}
                >
                    {captionsOn ? <ClosedCaptionIcon /> : <ClosedCaptionOffIcon />}
                </IconButton>
            </Tooltip>

            {/* ── Screen Share ── */}
            {screenAvailable && (
                <Tooltip title={screen ? "Stop sharing" : "Share screen"}>
                    <IconButton
                        onClick={onToggleScreen}
                        sx={{
                            color: screen ? "#00d4ff" : "#fff",
                            background: screen ? "rgba(0,212,255,0.12)" : "rgba(255,255,255,0.08)",
                            border: "1px solid",
                            borderColor: screen ? "rgba(0,212,255,0.3)" : "rgba(255,255,255,0.12)",
                            borderRadius: "50%",
                            width: 50, height: 50,
                            transition: "all 0.2s ease",
                            "&:hover": {
                                background: "rgba(0,212,255,0.2)",
                            },
                        }}
                    >
                        {screen ? <ScreenShareIcon /> : <StopScreenShareIcon />}
                    </IconButton>
                </Tooltip>
            )}

            {/* ── People (Participants) ── */}
            <Tooltip title="People">
                <Badge
                    badgeContent={participantsCount}
                    max={99}
                    color="secondary"
                    sx={{ "& .MuiBadge-badge": { fontSize: "0.7rem", minWidth: 18, height: 18 } }}
                >
                    <IconButton
                        onClick={onTogglePeople}
                        sx={{
                            color: activeTab === 'people' ? "#7c5cfc" : "#fff",
                            background: activeTab === 'people' ? "rgba(124,92,252,0.2)" : "rgba(255,255,255,0.08)",
                            border: "1px solid",
                            borderColor: activeTab === 'people' ? "rgba(124,92,252,0.4)" : "rgba(255,255,255,0.12)",
                            borderRadius: "50%",
                            width: 50, height: 50,
                            transition: "all 0.2s ease",
                            "&:hover": {
                                background: "rgba(124,92,252,0.2)",
                                borderColor: "rgba(124,92,252,0.4)",
                            },
                        }}
                    >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
                        </svg>
                    </IconButton>
                </Badge>
            </Tooltip>

            {/* ── Chat ── */}
            <Tooltip title="In-call messages">
                <Badge
                    badgeContent={newMessages}
                    max={99}
                    color="secondary"
                    sx={{ "& .MuiBadge-badge": { fontSize: "0.7rem", minWidth: 18, height: 18 } }}
                >
                    <IconButton
                        onClick={onToggleChat}
                        sx={{
                            color: activeTab === 'chat' ? "#7c5cfc" : "#fff",
                            background: activeTab === 'chat' ? "rgba(124,92,252,0.2)" : "rgba(255,255,255,0.08)",
                            border: "1px solid",
                            borderColor: activeTab === 'chat' ? "rgba(124,92,252,0.4)" : "rgba(255,255,255,0.12)",
                            borderRadius: "50%",
                            width: 50, height: 50,
                            transition: "all 0.2s ease",
                            "&:hover": {
                                background: "rgba(124,92,252,0.2)",
                                borderColor: "rgba(124,92,252,0.4)",
                            },
                        }}
                    >
                        <ChatIcon />
                    </IconButton>
                </Badge>
            </Tooltip>

            {/* ── End Call ── */}
            <Tooltip title={isHost ? "End options" : "Leave call"}>
                <IconButton
                    onClick={handleEndClick}
                    sx={{
                        color: "#fff",
                        background: "#ea4335",
                        border: "1px solid transparent",
                        borderRadius: "50%",
                        width: 54, height: 54,
                        ml: 2,
                        boxShadow: "0 4px 16px rgba(234,67,53,0.45)",
                        transition: "all 0.2s ease",
                        "&:hover": {
                            background: "#d33a2c",
                            boxShadow: "0 6px 24px rgba(234,67,53,0.6)",
                            transform: "scale(1.08)",
                        },
                    }}
                >
                    <CallEndIcon />
                </IconButton>
            </Tooltip>

            {/* Host End Call Menu */}
            <Menu
                anchorEl={anchorEl}
                open={open}
                onClose={handleClose}
                anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
                transformOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <MenuItem onClick={handleLeave}>
                    <ListItemIcon>
                        <LogoutIcon fontSize="small" color="action" />
                    </ListItemIcon>
                    <ListItemText>Leave Call</ListItemText>
                </MenuItem>
                <MenuItem onClick={handleEndAll}>
                    <ListItemIcon>
                        <CallEndIcon fontSize="small" color="error" />
                    </ListItemIcon>
                    <ListItemText primaryTypographyProps={{ color: 'error' }}>End Meeting for All</ListItemText>
                </MenuItem>
            </Menu>
        </div>
    );
});

export default MeetingControls;
