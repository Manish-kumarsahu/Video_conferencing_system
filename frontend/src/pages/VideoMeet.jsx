import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { TextField, Button } from '@mui/material';
import styles from '../styles/videoComponent.module.css';

import useMediaStream from '../hooks/useMediaStream';
import useWebRTC from '../hooks/useWebRTC';
import VideoGrid from '../components/VideoGrid';
import ChatPanel from '../components/ChatPanel';
import MeetingControls from '../components/MeetingControls';

export default function VideoMeetComponent() {
    const navigate = useNavigate();

    const [showChat, setShowChat] = useState(true);
    const [askForUsername, setAskForUsername] = useState(true);
    const [username, setUsername] = useState("");

    const {
        localVideoRef,
        video, audio, screen, screenAvailable,
        startMedia, getUserMedia, getDisplayMedia,
        stopAllTracks, toggleVideo, toggleAudio,
        toggleScreen, createBlackSilence,
    } = useMediaStream();

    const {
        videos, messages, newMessages,
        sendMessage, resetNewMessages,
        connectToSocket, renegotiateAll,
    } = useWebRTC(createBlackSilence);

    useEffect(() => {
        if (video !== undefined && audio !== undefined) {
            getUserMedia((stream) => renegotiateAll(stream));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [video, audio]);

    useEffect(() => {
        if (screen !== undefined) {
            getDisplayMedia((stream) => renegotiateAll(stream));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [screen]);

    const connect = useCallback(() => {
        setAskForUsername(false);
        startMedia();
        connectToSocket();
    }, [startMedia, connectToSocket]);

    const handleEndCall = useCallback(() => {
        stopAllTracks();
        navigate("/");
    }, [stopAllTracks, navigate]);

    const handleSendMessage = useCallback((messageText) => {
        sendMessage(messageText, username);
    }, [sendMessage, username]);

    const handleToggleChat = useCallback(() => {
        setShowChat(prev => {
            if (!prev) resetNewMessages();
            return !prev;
        });
    }, [resetNewMessages]);

    // ── LOBBY ──
    if (askForUsername) {
        return (
            <div className={styles.lobbyScreen}>
                <h2>Enter the Lobby</h2>
                <p style={{ color: "#9ca3af", fontSize: "0.95rem" }}>
                    Your camera preview — choose a name before joining.
                </p>

                <div className={styles.lobbyPreview}>
                    <video ref={localVideoRef} autoPlay muted />
                </div>

                <div className={styles.lobbyForm}>
                    <TextField
                        id="lobby-username"
                        label="Your display name"
                        value={username}
                        onChange={e => setUsername(e.target.value)}
                        onKeyDown={e => e.key === "Enter" && username.trim() && connect()}
                        variant="outlined"
                        size="medium"
                        sx={{ minWidth: 220 }}
                    />
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={connect}
                        disabled={!username.trim()}
                        sx={{ height: 56, px: 3 }}
                    >
                        Join Meeting
                    </Button>
                </div>
            </div>
        );
    }

    // ── MEETING ROOM ──
    return (
        <div className={styles.meetVideoContainer}>

            {showChat && (
                <ChatPanel
                    messages={messages}
                    onSendMessage={handleSendMessage}
                />
            )}

            <MeetingControls
                video={video}
                audio={audio}
                screen={screen}
                screenAvailable={screenAvailable}
                newMessages={newMessages}
                onToggleVideo={toggleVideo}
                onToggleAudio={toggleAudio}
                onToggleScreen={toggleScreen}
                onToggleChat={handleToggleChat}
                onEndCall={handleEndCall}
            />

            <video
                className={styles.meetUserVideo}
                ref={localVideoRef}
                autoPlay
                muted
            />

            <VideoGrid videos={videos} />
        </div>
    );
}
