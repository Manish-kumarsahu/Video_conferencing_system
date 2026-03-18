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

    // --- Custom hooks ---
    const {
        localVideoRef,
        video,
        audio,
        screen,
        screenAvailable,
        startMedia,
        getUserMedia,
        getDisplayMedia,
        stopAllTracks,
        toggleVideo,
        toggleAudio,
        toggleScreen,
        createBlackSilence,
    } = useMediaStream();

    const {
        videos,
        messages,
        newMessages,
        sendMessage,
        resetNewMessages,
        connectToSocket,
        disconnectSocket,
        renegotiateAll,
    } = useWebRTC(createBlackSilence);

    // --- Re-negotiate when video/audio toggles change ---
    useEffect(() => {
        if (video !== undefined && audio !== undefined) {
            getUserMedia((stream) => renegotiateAll(stream));
        }
    }, [video, audio]);

    // --- Re-negotiate when screen share toggles ---
    useEffect(() => {
        if (screen !== undefined) {
            getDisplayMedia((stream) => renegotiateAll(stream));
        }
    }, [screen]);

    // --- Lobby → Meeting transition ---
    const connect = useCallback(() => {
        setAskForUsername(false);
        startMedia();
        connectToSocket();
    }, [startMedia, connectToSocket]);

    // --- End call ---
    const handleEndCall = useCallback(() => {
        stopAllTracks();
        disconnectSocket();
        navigate("/");
    }, [stopAllTracks, disconnectSocket, navigate]);

    // --- Chat handlers ---
    const handleSendMessage = useCallback((messageText) => {
        sendMessage(messageText, username);
    }, [sendMessage, username]);

    const handleToggleChat = useCallback(() => {
        setShowChat(prev => {
            if (!prev) resetNewMessages();
            return !prev;
        });
    }, [resetNewMessages]);

    // ===================== RENDER =====================

    if (askForUsername) {
        return (
            <div>
                <h2>Enter into Lobby</h2>
                <TextField
                    id="lobby-username"
                    label="Username"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    variant="outlined"
                />
                <Button variant="contained" onClick={connect}>Connect</Button>

                <div>
                    <video ref={localVideoRef} autoPlay muted></video>
                </div>
            </div>
        );
    }

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
