import React from 'react';
import { IconButton, Badge } from '@mui/material';
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
export default function MeetingControls({
    video,
    audio,
    screen,
    screenAvailable,
    newMessages,
    onToggleVideo,
    onToggleAudio,
    onToggleScreen,
    onToggleChat,
    onEndCall,
}) {
    return (
        <div className={styles.buttonContainers}>
            <IconButton onClick={onToggleVideo} style={{ color: "white" }}>
                {video === true ? <VideocamIcon /> : <VideocamOffIcon />}
            </IconButton>

            <IconButton onClick={onEndCall} style={{ color: "red" }}>
                <CallEndIcon />
            </IconButton>

            <IconButton onClick={onToggleAudio} style={{ color: "white" }}>
                {audio === true ? <MicIcon /> : <MicOffIcon />}
            </IconButton>

            {screenAvailable === true && (
                <IconButton onClick={onToggleScreen} style={{ color: "white" }}>
                    {screen === true ? <ScreenShareIcon /> : <StopScreenShareIcon />}
                </IconButton>
            )}

            <Badge badgeContent={newMessages} max={999} color='secondary'>
                <IconButton onClick={onToggleChat} style={{ color: "white" }}>
                    <ChatIcon />
                </IconButton>
            </Badge>
        </div>
    );
}
