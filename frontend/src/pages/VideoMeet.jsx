import React, { useEffect, useState, useRef, useCallback, useContext } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import { TextField, Button, Tooltip } from '@mui/material';
import styles from '../styles/videoComponent.module.css';

import useMediaStream from '../hooks/useMediaStream';
import useWebRTC from '../hooks/useWebRTC';
import useCaptions from '../hooks/useCaptions';
import VideoGrid from '../components/VideoGrid';
import ChatPanel from '../components/ChatPanel';
import MeetingControls from '../components/MeetingControls';
import CaptionsOverlay from '../components/CaptionsOverlay';
import MicIcon from '@mui/icons-material/Mic';
import MicOffIcon from '@mui/icons-material/MicOff';
import VideocamIcon from '@mui/icons-material/Videocam';
import VideocamOffIcon from '@mui/icons-material/VideocamOff';
import VideocamOffOutlinedIcon from '@mui/icons-material/VideocamOffOutlined';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import MoreVertIcon from '@mui/icons-material/MoreVert';

export default function VideoMeetComponent() {
    const navigate = useNavigate();

    const [askForUsername, setAskForUsername] = useState(true);
    const [username, setUsername] = useState("");

    const [meetingTimer, setMeetingTimer] = useState(0);

    useEffect(() => {
        let interval = null;
        if (!askForUsername) {
            interval = setInterval(() => setMeetingTimer(p => p + 1), 1000);
        }
        return () => interval && clearInterval(interval);
    }, [askForUsername]);

    const formatTime = (secs) => {
        const h = Math.floor(secs / 3600);
        const m = Math.floor((secs % 3600) / 60);
        const s = secs % 60;
        return h > 0 
            ? `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
            : `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    // ── Lobby device toggle states ──
    const [cameraOn, setCameraOn] = useState(true);
    const [micOn, setMicOn] = useState(true);
    const [lobbyStream, setLobbyStream] = useState(null);
    const [permissionError, setPermissionError] = useState('');
    const lobbyVideoRef = useRef(null);

    const {
        localVideoRef,
        video, audio, screen, screenAvailable,
        startMedia, getUserMedia, getDisplayMedia,
        stopAllTracks, toggleVideo, toggleAudio,
        toggleScreen, createBlackSilence,
        forceDisableVideo, forceDisableAudio
    } = useMediaStream();

    const handleMeetingEnded = useCallback(() => {
        alert("The host has ended the meeting for everyone.");
        stopAllTracks();
        navigate("/home");
    }, [stopAllTracks, navigate]);

    const {
        videos, messages, newMessages,
        participants, socketId,
        sendMessage, resetNewMessages,
        connectToSocket, renegotiateAll,
        kickUser, muteAll, stopVideoAll, endMeetingAll, getSocket
    } = useWebRTC(createBlackSilence, forceDisableAudio, forceDisableVideo, handleMeetingEnded);

    const { captionsOn, toggleCaptions, captions, transcript } = useCaptions(getSocket(), username);
    const { endMeeting, addToUserHistory } = useContext(AuthContext);
    const { url: meetingCode } = useParams();

    // ── Lobby: start preview stream on mount ──
    useEffect(() => {
        if (!askForUsername) return;
        let cancelled = false;

        const startPreview = async () => {
            // Stop any existing lobby stream
            if (lobbyStream) {
                lobbyStream.getTracks().forEach(t => t.stop());
            }
            setPermissionError('');

            if (!cameraOn && !micOn) {
                if (lobbyVideoRef.current) lobbyVideoRef.current.srcObject = null;
                setLobbyStream(null);
                return;
            }

            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: cameraOn ? { facingMode: 'user' } : false,
                    audio: micOn,
                });
                if (cancelled) { stream.getTracks().forEach(t => t.stop()); return; }

                stream.getAudioTracks().forEach(t => { t.enabled = micOn; });
                setLobbyStream(stream);

                if (cameraOn && lobbyVideoRef.current) {
                    lobbyVideoRef.current.srcObject = stream;
                } else if (lobbyVideoRef.current) {
                    lobbyVideoRef.current.srcObject = null;
                }
            } catch (err) {
                if (cancelled) return;
                console.error('Lobby media error:', err);
                if (err.name === 'NotAllowedError') {
                    setPermissionError('Camera/microphone access was denied. Please allow in browser settings.');
                } else if (err.name === 'NotFoundError') {
                    setPermissionError('No camera or microphone found. Please connect a device.');
                } else {
                    setPermissionError('Could not access media devices. Check browser permissions.');
                }
                setLobbyStream(null);
            }
        };

        startPreview();
        return () => { cancelled = true; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [cameraOn, micOn, askForUsername]);

    // Cleanup lobby stream on unmount
    useEffect(() => {
        return () => {
            if (lobbyStream) {
                lobbyStream.getTracks().forEach(t => t.stop());
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ── In-meeting: react to video/audio state changes ──
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
        // Stop lobby stream before joining meeting
        if (lobbyStream) {
            lobbyStream.getTracks().forEach(t => t.stop());
            setLobbyStream(null);
        }
        setAskForUsername(false);
        startMedia(cameraOn, micOn);
        connectToSocket(username);
    }, [startMedia, connectToSocket, username, lobbyStream, cameraOn, micOn]);

    const handleLeaveCall = useCallback(() => {
        stopAllTracks();
        navigate("/home");
    }, [stopAllTracks, navigate]);

    const handleEndMeeting = useCallback(async () => {
        // Stop media immediately so UI feels responsive
        stopAllTracks();

        // Backend fetches transcript from DB, calls Gemini, saves to meetings collection
        try {
            await endMeeting(meetingCode);
            // Link the meeting to the current user's history
            await addToUserHistory(meetingCode);
        } catch (err) {
            console.error("[handleEndMeeting]", err);
        }

        navigate("/history");
    }, [endMeeting, addToUserHistory, meetingCode, stopAllTracks, navigate]);

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
                    Preview your camera and microphone before joining.
                </p>

                {/* Camera Preview */}
                <div className={styles.lobbyPreview}>
                    {!cameraOn && (
                        <div className={styles.cameraOffPlaceholder}>
                            <VideocamOffOutlinedIcon sx={{ fontSize: '3rem', color: '#475569', mb: 1 }} />
                            <span className={styles.cameraOffText}>Camera is off</span>
                        </div>
                    )}
                    <video
                        ref={lobbyVideoRef}
                        autoPlay
                        muted
                        style={{ display: cameraOn ? 'block' : 'none' }}
                    />
                </div>

                {/* Permission error banner */}
                {permissionError && (
                    <div className={styles.permissionError} style={{ marginBottom: '16px' }}>
                        <WarningAmberIcon sx={{ fontSize: '1.1rem', flexShrink: 0 }} />
                        <span>{permissionError}</span>
                    </div>
                )}



                {/* Name input + Toggles + Join button */}
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

                    <Tooltip title={cameraOn ? "Turn off camera" : "Turn on camera"} placement="top">
                        <button
                            id="lobby-camera-toggle"
                            className={`${styles.lobbyToggleBtn} ${!cameraOn ? styles.lobbyToggleBtnOff : ''}`}
                            onClick={() => setCameraOn(prev => !prev)}
                            aria-label={cameraOn ? "Turn off camera" : "Turn on camera"}
                        >
                            {cameraOn
                                ? <VideocamIcon sx={{ fontSize: '1.5rem' }} />
                                : <VideocamOffIcon sx={{ fontSize: '1.5rem' }} />
                            }
                        </button>
                    </Tooltip>

                    <Tooltip title={micOn ? "Mute microphone" : "Unmute microphone"} placement="top">
                        <button
                            id="lobby-mic-toggle"
                            className={`${styles.lobbyToggleBtn} ${!micOn ? styles.lobbyToggleBtnOff : ''}`}
                            onClick={() => setMicOn(prev => !prev)}
                            aria-label={micOn ? "Mute microphone" : "Unmute microphone"}
                        >
                            {micOn
                                ? <MicIcon sx={{ fontSize: '1.5rem' }} />
                                : <MicOffIcon sx={{ fontSize: '1.5rem' }} />
                            }
                        </button>
                    </Tooltip>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.meetLayout}>
            <div className={`${styles.mainVideoArea} ${activeTab ? styles.withSidebar : ''} relative`}>
                
                {/* ── Bottom Left Overlay: Meeting ID ── */}
                <div className="absolute bottom-4 left-4 z-50 flex gap-2 text-white">
                    <Tooltip title="Click to copy Meeting Code" placement="top">
                        <div 
                            className="bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg flex items-center gap-2 text-sm font-semibold border border-white/10 shadow-lg cursor-pointer hover:bg-black/80 hover:border-white/20 transition-all" 
                            onClick={() => {navigator.clipboard.writeText(meetingCode); alert("Meeting Code copied!");}}
                        >
                            <span className="text-gray-400 font-medium">ID:</span>
                            <span className="tracking-widest">{meetingCode}</span>
                        </div>
                    </Tooltip>
                </div>

                {/* ── Bottom Right Overlay: Timer ── */}
                <div className="absolute bottom-4 right-4 z-50 flex gap-2 text-white">
                    <Tooltip title="Meeting Duration" placement="top">
                        <div className="bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg flex items-center gap-2.5 text-sm font-semibold border border-white/10 shadow-lg">
                            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse shadow-[0_0_6px_rgba(239,68,68,0.8)]"></span>
                            <span className="tracking-wider w-[42px] text-center">{formatTime(meetingTimer)}</span>
                        </div>
                    </Tooltip>
                </div>

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

                <CaptionsOverlay captions={captions} />

                <MeetingControls
                    video={video}
                    audio={audio}
                    screen={screen}
                    screenAvailable={screenAvailable}
                    captionsOn={captionsOn}
                    newMessages={newMessages}
                    participantsCount={participants.length}
                    onToggleVideo={toggleVideo}
                    onToggleAudio={toggleAudio}
                    onToggleScreen={toggleScreen}
                    onToggleCaptions={toggleCaptions}
                    onToggleChat={handleToggleChat}
                    onTogglePeople={handleTogglePeople}
                    onLeaveCall={handleLeaveCall}
                    onEndMeetingAll={() => { endMeetingAll(); handleEndMeeting(); }}
                    isHost={participants.find(u => u.socketId === socketId)?.role === "host"}
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
