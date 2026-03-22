import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { TextField, Button } from '@mui/material';
import styles from '../styles/videoComponent.module.css';

import useMediaStream from '../hooks/useMediaStream';
import useWebRTC from '../hooks/useWebRTC';
import VideoGrid from '../components/VideoGrid';
import ChatPanel from '../components/ChatPanel';
import MeetingControls from '../components/MeetingControls';
import MicIcon from '@mui/icons-material/Mic';
import MicOffIcon from '@mui/icons-material/MicOff';
import MoreVertIcon from '@mui/icons-material/MoreVert';

export default function VideoMeetComponent() {
    const navigate = useNavigate();

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
        participants, socketId,
        sendMessage, resetNewMessages,
        connectToSocket, renegotiateAll,
        kickUser
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
        connectToSocket(username);
    }, [startMedia, connectToSocket, username]);

    const handleEndCall = useCallback(() => {
        stopAllTracks();
        navigate("/");
    }, [stopAllTracks, navigate]);

    const handleSendMessage = useCallback((messageText) => {
        sendMessage(messageText, username);
    }, [sendMessage, username]);



    // ── MEETING ROOM ──
    const [activeTab, setActiveTab] = useState(null); // 'chat' | 'people' | null

    const handleToggleChat = useCallback(() => {
        setActiveTab(prev => {
            if (prev !== 'chat') resetNewMessages();
            return prev === 'chat' ? null : 'chat';
        });
    }, [resetNewMessages]);

    const handleTogglePeople = useCallback(() => {
        setActiveTab(prev => (prev === 'people' ? null : 'people'));
    }, []);

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

    return (
        <div className={styles.meetLayout}>
            <div className={`${styles.mainVideoArea} ${activeTab ? styles.withSidebar : ''}`}>
                <div className={styles.videoGridWrapper}>
                    <VideoGrid 
                        videos={videos} 
                        localVideoRef={localVideoRef} 
                        localAudio={audio} 
                        localVideo={video} 
                        localUsername={username} 
                        participants={participants}
                        socketId={socketId}
                    />
                </div>
                
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
                    onTogglePeople={handleTogglePeople}
                    onEndCall={handleEndCall}
                    activeTab={activeTab}
                />
            </div>

            {activeTab === 'chat' && (
                <div className={styles.sidebarPanel}>
                    <ChatPanel
                        messages={messages}
                        onSendMessage={handleSendMessage}
                        onClose={() => setActiveTab(null)}
                    />
                </div>
            )}

            {activeTab === 'people' && (
                <div className={styles.sidebarPanel}>
                    {/* Simplified Participants Panel inline since we can't create complex new files unless necessary */}
                    <div className={styles.chatRoom}>
                        <div className={styles.chatContainer}>
                            <div className={styles.sidebarHeader}>
                                <h1>People</h1>
                                <button className={styles.closeBtn} onClick={() => setActiveTab(null)}>✕</button>
                            </div>
                            <div className={styles.participantsList}>
                                {participants.map(p => (
                                    <div key={p.socketId} className={styles.participantItem}>
                                        <div className={styles.participantAvatar}>
                                            {p.username.charAt(0).toUpperCase()}
                                        </div>
                                        <div className={styles.participantInfo}>
                                            <span className={styles.participantName}>
                                                {p.username} {p.socketId === socketId ? "(You)" : ""}
                                            </span>
                                            {p.role === "host" && (
                                                <span className={styles.hostBadge}>Host</span>
                                            )}
                                        </div>
                                        <div className={styles.participantAction}>
                                            {/* Show Kick button only if I am host and this is not me */}
                                            {participants.find(u => u.socketId === socketId)?.role === "host" && p.socketId !== socketId && (
                                                <Button 
                                                    size="small" 
                                                    color="error" 
                                                    onClick={() => kickUser(p.socketId)}
                                                    sx={{ mr: 1, textTransform: 'none', fontSize: '0.75rem' }}
                                                >
                                                    Kick
                                                </Button>
                                            )}
                                            {/* Mic icon logic (simplified for now as we don't have all remote mic states) */}
                                            {p.socketId === socketId ? (
                                                audio ? <MicIcon sx={{ fontSize: '1.2rem', color: '#fff' }} /> : <MicOffIcon sx={{ fontSize: '1.2rem', color: '#ea4335' }} />
                                            ) : (
                                                <MicIcon sx={{ fontSize: '1.2rem', color: '#fff' }} />
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
