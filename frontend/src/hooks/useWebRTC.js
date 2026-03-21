import { useRef, useState, useCallback, useEffect } from 'react';
import io from "socket.io-client";
import server from '../environment';

const peerConfigConnections = {
    iceServers: [
        { urls: "stun:stun.l.google.com:19302" }
    ],
};

/**
 * Manages WebRTC peer connections and Socket.io signaling.
 * Accepts a createBlackSilence function from useMediaStream for fallback streams.
 */
export default function useWebRTC(createBlackSilence) {
    const socketRef = useRef(null);
    const socketIdRef = useRef(null);
    const connectionsRef = useRef({});
    const videoRef = useRef([]);

    const [videos, setVideos] = useState([]);
    const [messages, setMessages] = useState([]);
    const [newMessages, setNewMessages] = useState(0);

    // ── Cleanup socket on unmount ──────────────────────
    useEffect(() => {
        return () => {
            if (socketRef.current) {
                socketRef.current.disconnect();
                socketRef.current = null;
            }
            // Close all peer connections
            for (const id in connectionsRef.current) {
                try {
                    connectionsRef.current[id].close();
                } catch (_) { /* ignore */ }
            }
            connectionsRef.current = {};
        };
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
        const roomId = window.location.pathname;
        const msg = { sender: username, data: messageText, senderId: socketIdRef.current };
        socketRef.current?.emit('send-message', { roomId, message: msg });
        addMessage(msg);
    }, [addMessage]);

    const resetNewMessages = useCallback(() => setNewMessages(0), []);

    // ── Connect to socket server ───────────────────────
    const connectToSocket = useCallback(() => {
        // Prevent duplicate connections
        if (socketRef.current?.connected) return;

        const connections = connectionsRef.current;

        // Let Socket.IO auto-detect protocol (http/https)
        socketRef.current = io(server);

        socketRef.current.on('signal', gotMessageFromServer);

        socketRef.current.on('connect', () => {
            const roomId = window.location.pathname;
            socketRef.current.emit('join-room', roomId);
            socketIdRef.current = socketRef.current.id;

            socketRef.current.on('receive-message', addMessage);

            socketRef.current.on('user-left', (id) => {
                setVideos(prev => prev.filter(v => v.socketId !== id));
            });

            socketRef.current.on('user-joined', (id, clients) => {
                clients.forEach((socketListId) => {
                    connections[socketListId] = new RTCPeerConnection(peerConfigConnections);

                    // ICE candidate handler
                    connections[socketListId].onicecandidate = (event) => {
                        if (event.candidate) {
                            socketRef.current?.emit(
                                'signal', socketListId,
                                JSON.stringify({ ice: event.candidate })
                            );
                        }
                    };

                    // Remote track handler
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

                    // Add local stream to new peer
                    const localStream = window.localStream;
                    if (localStream) {
                        localStream.getTracks().forEach(track => connections[socketListId].addTrack(track, localStream));
                    } else {
                        window.localStream = createBlackSilence();
                        window.localStream.getTracks().forEach(track => connections[socketListId].addTrack(track, window.localStream));
                    }
                });

                // If we are the new joiner, create offers to all existing peers
                if (id === socketIdRef.current) {
                    for (const id2 in connections) {
                        if (id2 === socketIdRef.current) continue;
                        try {
                            window.localStream.getTracks().forEach(track => connections[id2].addTrack(track, window.localStream));
                        } catch (_) { /* ignore */ }

                        connections[id2]
                            .createOffer()
                            .then((description) => connections[id2].setLocalDescription(description))
                            .then(() => {
                                socketRef.current?.emit(
                                    'signal', id2,
                                    JSON.stringify({ sdp: connections[id2].localDescription })
                                );
                            })
                            .catch(e => console.warn('[createOffer]', e));
                    }
                }
            });
        });

        socketRef.current.on('connect_error', (err) => {
            console.warn('[socket connect_error]', err.message);
        });
    }, [gotMessageFromServer, addMessage, addOrReplaceStream, createBlackSilence]);

    return {
        videos,
        messages,
        newMessages,
        sendMessage,
        resetNewMessages,
        connectToSocket,
        renegotiateAll,
    };
}
