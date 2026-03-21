import React, { memo } from 'react';
import { IconButton, Badge, Tooltip } from '@mui/material';
import VideocamIcon from '@mui/icons-material/Videocam';
import VideocamOffIcon from '@mui/icons-material/VideocamOff';
import CallEndIcon from '@mui/icons-material/CallEnd';
import MicIcon from '@mui/icons-material/Mic';
import MicOffIcon from '@mui/icons-material/MicOff';
import ScreenShareIcon from '@mui/icons-material/ScreenShare';
import StopScreenShareIcon from '@mui/icons-material/StopScreenShare';
import ChatIcon from '@mui/icons-material/Chat';
import styles from '../styles/videoComponent.module.css';

/**
 * Bottom toolbar with video, audio, screen share, chat, and end call controls.
 */
const MeetingControls = memo(function MeetingControls({
    video, audio, screen, screenAvailable,
    newMessages,
    onToggleVideo, onToggleAudio, onToggleScreen,
    onToggleChat, onEndCall,
}) {
    return (
        <div className={styles.buttonContainers}>
            {/* ── Camera ── */}
            <Tooltip title={video ? "Turn off camera" : "Turn on camera"}>
                <IconButton
                    onClick={onToggleVideo}
                    sx={{
                        color: video ? "#fff" : "#ff6b6b",
                        background: video ? "rgba(255,255,255,0.08)" : "rgba(255,107,107,0.12)",
                        border: "1px solid",
                        borderColor: video ? "rgba(255,255,255,0.12)" : "rgba(255,107,107,0.3)",
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
                        color: audio ? "#fff" : "#ff6b6b",
                        background: audio ? "rgba(255,255,255,0.08)" : "rgba(255,107,107,0.12)",
                        border: "1px solid",
                        borderColor: audio ? "rgba(255,255,255,0.12)" : "rgba(255,107,107,0.3)",
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

            {/* ── Chat ── */}
            <Tooltip title="Toggle chat">
                <Badge
                    badgeContent={newMessages}
                    max={99}
                    color="secondary"
                    sx={{ "& .MuiBadge-badge": { fontSize: "0.7rem", minWidth: 18, height: 18 } }}
                >
                    <IconButton
                        onClick={onToggleChat}
                        sx={{
                            color: "#fff",
                            background: "rgba(255,255,255,0.08)",
                            border: "1px solid rgba(255,255,255,0.12)",
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
            <Tooltip title="Leave meeting">
                <IconButton
                    onClick={onEndCall}
                    sx={{
                        color: "#fff",
                        background: "#e53935",
                        border: "1px solid transparent",
                        borderRadius: "50%",
                        width: 54, height: 54,
                        boxShadow: "0 4px 16px rgba(229,57,53,0.45)",
                        transition: "all 0.2s ease",
                        "&:hover": {
                            background: "#ef5350",
                            boxShadow: "0 6px 24px rgba(229,57,53,0.6)",
                            transform: "scale(1.08)",
                        },
                    }}
                >
                    <CallEndIcon />
                </IconButton>
            </Tooltip>
        </div>
    );
});

export default MeetingControls;
