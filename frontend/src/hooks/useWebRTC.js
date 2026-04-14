import { useRef, useState, useCallback, useEffect } from 'react';
import io from "socket.io-client";
import { BASE_URL } from '../services/api';

const peerConfigConnections = {
    iceServers: [
        { urls: "stun:stun.l.google.com:19302" }
    ],
};

/**
 * Manages WebRTC peer connections and Socket.io signaling.
 * Accepts a createBlackSilence function from useMediaStream for fallback streams.
 */
export default function useWebRTC(createBlackSilence, onForceMute, onForceStopVideo, onMeetingEnded) {
    const socketRef = useRef(null);
    const socketIdRef = useRef(null);
    const [socketIdState, setSocketIdState] = useState(null);
    const connectionsRef = useRef({});
    const videoRef = useRef([]);

    const [videos, setVideos] = useState([]);
    const [messages, setMessages] = useState([]);
    const [newMessages, setNewMessages] = useState(0);
    const [participants, setParticipants] = useState([]);

    // ── Speaker Detection & Media Status ──────────────
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [mediaStatus, setMediaStatus] = useState({});
    const analyserRef = useRef(null);
    const audioCtxRef = useRef(null);
    const sourceRef = useRef(null);
    const speakingFramesRef = useRef(0);
    const silentFramesRef = useRef(0);
    const prevStreamIdRef = useRef(null);

    useEffect(() => {
        return () => {
            if (socketRef.current) {
                socketRef.current.disconnect();
                socketRef.current = null;
            }
            for (const id in connectionsRef.current) {
                try { connectionsRef.current[id].close(); } catch (_) {}
            }
            connectionsRef.current = {};
            // Cleanup audio analyser
            if (sourceRef.current) { try { sourceRef.current.disconnect(); } catch (_) {} }
            if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
                try { audioCtxRef.current.close(); } catch (_) {}
            }
        };
    }, []);

    // ── Audio Analyser Setup ──────────────────────────
    const setupAnalyser = useCallback(() => {
        const stream = window.localStream;
        if (!stream) return;
        const audioTrack = stream.getAudioTracks()[0];
        if (!audioTrack) return;
        if (prevStreamIdRef.current === stream.id) return;
        prevStreamIdRef.current = stream.id;

        if (sourceRef.current) { try { sourceRef.current.disconnect(); } catch (_) {} }
        if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') {
            audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
        }
        try {
            sourceRef.current = audioCtxRef.current.createMediaStreamSource(stream);
            analyserRef.current = audioCtxRef.current.createAnalyser();
            analyserRef.current.fftSize = 256;
            analyserRef.current.smoothingTimeConstant = 0.5;
            sourceRef.current.connect(analyserRef.current);
        } catch (e) { console.warn('[setupAnalyser]', e); }
    }, []);

    // ── Speaker Detection Polling ─────────────────────
    useEffect(() => {
        const THRESHOLD = 15, SPEAK_FRAMES = 2, SILENT_FRAMES = 8;
        const id = setInterval(() => {
            if (!analyserRef.current) { setupAnalyser(); }
            if (!analyserRef.current) return;

            const buf = new Uint8Array(analyserRef.current.frequencyBinCount);
            analyserRef.current.getByteFrequencyData(buf);
            let sum = 0;
            for (let i = 0; i < buf.length; i++) sum += buf[i];
            const avg = sum / buf.length;

            if (avg > THRESHOLD) {
                speakingFramesRef.current++;
                silentFramesRef.current = 0;
                if (speakingFramesRef.current >= SPEAK_FRAMES) {
                    setIsSpeaking(prev => {
                        if (!prev && socketRef.current) {
                            const roomId = window.location.pathname.split('/').pop();
                            socketRef.current.emit('speaking-status', { roomId, isSpeaking: true });
                        }
                        return true;
                    });
                }
            } else {
                silentFramesRef.current++;
                speakingFramesRef.current = 0;
                if (silentFramesRef.current >= SILENT_FRAMES) {
                    setIsSpeaking(prev => {
                        if (prev && socketRef.current) {
                            const roomId = window.location.pathname.split('/').pop();
                            socketRef.current.emit('speaking-status', { roomId, isSpeaking: false });
                        }
                        return false;
                    });
                }
            }
        }, 150);
        return () => clearInterval(id);
    }, [setupAnalyser]);

    // Re-attach analyser when local stream changes
    useEffect(() => {
        const id = setInterval(() => {
            const stream = window.localStream;
            if (stream && stream.id !== prevStreamIdRef.current) setupAnalyser();
        }, 1000);
        return () => clearInterval(id);
    }, [setupAnalyser]);

    // Sync local isSpeaking into mediaStatus map
    useEffect(() => {
        if (socketIdRef.current) {
            setMediaStatus(prev => ({
                ...prev,
                [socketIdRef.current]: { ...(prev[socketIdRef.current] || {}), isSpeaking }
            }));
        }
    }, [isSpeaking]);

    // ── Emit Media Status ─────────────────────────────
    const emitMediaStatus = useCallback((micOn, videoOn) => {
        if (socketRef.current) {
            const roomId = window.location.pathname.split('/').pop();
            socketRef.current.emit('media-status', { roomId, micOn, videoOn });
        }
        if (socketIdRef.current) {
            setMediaStatus(prev => ({
                ...prev,
                [socketIdRef.current]: {
                    ...(prev[socketIdRef.current] || {}),
                    micOn, videoOn,
                }
            }));
        }
    }, []);

    // ── Helpers ───────────────────────────────────────
    const addOrReplaceStream = useCallback((connection, stream) => {
        const senders = connection.getSenders();
        stream.getTracks().forEach(track => {
            const existingSender = senders.find(s => s.track?.kind === track.kind);
            if (existingSender) {
                existingSender.replaceTrack(track);
            } else {
                connection.addTrack(track, stream);
            }
        });
    }, []);

    const renegotiateAll = useCallback((stream) => {
        for (const id in connectionsRef.current) {
            if (id === socketIdRef.current) continue;
            stream.getTracks().forEach(track => connectionsRef.current[id].addTrack(track, stream));
            connectionsRef.current[id]
                .createOffer()
                .then((description) => {
                    return connectionsRef.current[id]
                        .setLocalDescription(description)
                        .then(() => {
                            socketRef.current?.emit(
                                'signal', id,
                                JSON.stringify({ sdp: connectionsRef.current[id].localDescription })
                            );
                        });
                })
                .catch(e => console.warn('[renegotiateAll]', e));
        }
    }, []);

    // ── Signal handler ────────────────────────────────
    const gotMessageFromServer = useCallback((fromId, message) => {
        const signal = JSON.parse(message);
        const connections = connectionsRef.current;

        if (fromId === socketIdRef.current) return;

        if (signal.sdp) {
            connections[fromId]
                .setRemoteDescription(new RTCSessionDescription(signal.sdp))
                .then(() => {
                    if (signal.sdp.type !== 'offer') return;
                    return connections[fromId]
                        .createAnswer()
                        .then((description) => connections[fromId].setLocalDescription(description))
                        .then(() => {
                            socketRef.current?.emit(
                                'signal', fromId,
                                JSON.stringify({ sdp: connections[fromId].localDescription })
                            );
                        });
                })
                .catch(e => console.warn('[gotMessageFromServer sdp]', e));
        }

        if (signal.ice) {
            connections[fromId]
                .addIceCandidate(new RTCIceCandidate(signal.ice))
                .catch(e => console.warn('[gotMessageFromServer ice]', e));
        }
    }, []);

    // ── Chat ──────────────────────────────────────────
    const addMessage = useCallback((msg) => {
        const enhancedMsg = { ...msg, isMe: msg.senderId === socketIdRef.current };
        setMessages(prev => [...prev, enhancedMsg]);
        if (msg.senderId !== socketIdRef.current) {
            setNewMessages(prev => prev + 1);
        }
    }, []);

    const sendMessage = useCallback((messageText, username) => {
        const roomId = window.location.pathname.split('/').pop();
        const msg = { sender: username, data: messageText, senderId: socketIdRef.current };
        socketRef.current?.emit('send-message', { roomId, message: msg });
        addMessage(msg);
    }, [addMessage]);

    const resetNewMessages = useCallback(() => setNewMessages(0), []);

    // ── Host Controls ─────────────────────────────────
    const kickUser = useCallback((targetId) => {
        const roomId = window.location.pathname.split('/').pop();
        socketRef.current?.emit('kick-user', roomId, targetId);
    }, []);

    const muteAll = useCallback(() => {
        const roomId = window.location.pathname.split('/').pop();
        socketRef.current?.emit('mute-all', roomId);
    }, []);

    const stopVideoAll = useCallback(() => {
        const roomId = window.location.pathname.split('/').pop();
        socketRef.current?.emit('stop-video-all', roomId);
    }, []);

    const endMeetingAll = useCallback(() => {
        const roomId = window.location.pathname.split('/').pop();
        socketRef.current?.emit('end-meeting-all', roomId);
    }, []);

    // ── Connect to socket server ───────────────────────
    const connectToSocket = useCallback((username) => {
        if (socketRef.current?.connected) return;

        const connections = connectionsRef.current;
        socketRef.current = io(BASE_URL);
        socketRef.current.on('signal', gotMessageFromServer);

        socketRef.current.on('connect', () => {
            const roomId = window.location.pathname.split('/').pop();
            socketRef.current.emit('join-room', roomId, username);
            socketIdRef.current = socketRef.current.id;
            setSocketIdState(socketRef.current.id);

            socketRef.current.on('receive-message', addMessage);

            socketRef.current.on('kicked', () => {
                alert("You have been removed from the meeting by the host.");
                window.location.href = "/";
            });

            socketRef.current.on('force-mute', () => {
                if (onForceMute) onForceMute();
            });

            socketRef.current.on('force-stop-video', () => {
                if (onForceStopVideo) onForceStopVideo();
            });

            socketRef.current.on('meeting-ended', () => {
                if (onMeetingEnded) onMeetingEnded();
            });

            socketRef.current.on('user-left', (id) => {
                setVideos(prev => prev.filter(v => v.socketId !== id));
                setParticipants(prev => prev.filter(p => p.socketId !== id));
                setMediaStatus(prev => { const n = { ...prev }; delete n[id]; return n; });
            });

            // ── Remote media & speaking status ──
            socketRef.current.on('media-status', ({ socketId: remoteId, micOn, videoOn }) => {
                setMediaStatus(prev => ({
                    ...prev,
                    [remoteId]: { ...(prev[remoteId] || {}), micOn, videoOn }
                }));
            });

            socketRef.current.on('speaking-status', ({ socketId: remoteId, isSpeaking: remoteSpeaking }) => {
                setMediaStatus(prev => ({
                    ...prev,
                    [remoteId]: { ...(prev[remoteId] || {}), isSpeaking: remoteSpeaking }
                }));
            });

            socketRef.current.on('update-users', (clients) => {
                setParticipants(clients);
            });

            socketRef.current.on('user-joined', (id, clients) => {
                setParticipants(clients);

                clients.forEach((client) => {
                    const socketListId = client.socketId;
                    if (socketListId === socketIdRef.current || connections[socketListId]) return;

                    connections[socketListId] = new RTCPeerConnection(peerConfigConnections);

                    connections[socketListId].onicecandidate = (event) => {
                        if (event.candidate) {
                            socketRef.current?.emit(
                                'signal', socketListId,
                                JSON.stringify({ ice: event.candidate })
                            );
                        }
                    };

                    connections[socketListId].ontrack = (event) => {
                        const remoteStream = event.streams[0];
                        if (!remoteStream) return;

                        setVideos(prev => {
                            const videoExists = prev.find(v => v.socketId === socketListId);
                            if (videoExists) {
                                return prev.map(v =>
                                    v.socketId === socketListId ? { ...v, stream: remoteStream } : v
                                );
                            } else {
                                return [...prev, {
                                    socketId: socketListId,
                                    stream: remoteStream,
                                    autoplay: true,
                                    playsinline: true,
                                }];
                            }
                        });
                    };

                    const localStream = window.localStream;
                    if (localStream) {
                        localStream.getTracks().forEach(track => connections[socketListId].addTrack(track, localStream));
                    } else {
                        window.localStream = createBlackSilence();
                        window.localStream.getTracks().forEach(track => connections[socketListId].addTrack(track, window.localStream));
                    }
                });

                if (id === socketIdRef.current) {
                    clients.forEach(client => {
                        const targetId = client.socketId;
                        if (targetId === socketIdRef.current) return;
                        
                        try {
                            window.localStream.getTracks().forEach(track => connections[targetId].addTrack(track, window.localStream));
                        } catch (_) { /* ignore */ }

                        connections[targetId]
                            .createOffer()
                            .then((description) => connections[targetId].setLocalDescription(description))
                            .then(() => {
                                socketRef.current?.emit(
                                    'signal', targetId,
                                    JSON.stringify({ sdp: connections[targetId].localDescription })
                                );
                            })
                            .catch(e => console.warn('[createOffer]', e));
                    });
                }
            });
        });

        socketRef.current.on('connect_error', (err) => {
            console.warn('[socket connect_error]', err.message);
        });
    }, [gotMessageFromServer, addMessage, createBlackSilence]);

    const getSocket = () => socketRef.current;

    return {
        videos,
        messages,
        newMessages,
        participants,
        socketId: socketIdState,
        isSpeaking,
        mediaStatus,
        emitMediaStatus,
        sendMessage,
        resetNewMessages,
        connectToSocket,
        renegotiateAll,
        kickUser,
        muteAll,
        stopVideoAll,
        endMeetingAll,
        getSocket
    };
}
