import { useRef, useState, useCallback } from 'react';
import io from "socket.io-client";
import server from '../environment';

const peerConfigConnections = {
    iceServers: [
        { urls: "stun:stun.l.google.com:19302" }
    ]
};

/**
 * Manages WebRTC peer connections and Socket.io signaling.
 * Accepts a createBlackSilence function from useMediaStream for fallback streams.
 */
export default function useWebRTC(createBlackSilence) {
    const socketRef = useRef();
    const socketIdRef = useRef();
    const connectionsRef = useRef({});
    const videoRef = useRef([]);

    const [videos, setVideos] = useState([]);
    const [messages, setMessages] = useState([]);
    const [newMessages, setNewMessages] = useState(0);

    // --- Helpers ---
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
        for (let id in connectionsRef.current) {
            if (id === socketIdRef.current) continue;
            addOrReplaceStream(connectionsRef.current[id], stream);
            connectionsRef.current[id].createOffer().then((description) => {
                connectionsRef.current[id].setLocalDescription(description)
                    .then(() => {
                        socketRef.current.emit('signal', id,
                            JSON.stringify({ 'sdp': connectionsRef.current[id].localDescription }));
                    })
                    .catch(e => console.log(e));
            });
        }
    }, [addOrReplaceStream]);

    // --- Signal handler ---
    const gotMessageFromServer = useCallback((fromId, message) => {
        var signal = JSON.parse(message);
        const connections = connectionsRef.current;

        if (fromId !== socketIdRef.current) {
            if (signal.sdp) {
                connections[fromId].setRemoteDescription(new RTCSessionDescription(signal.sdp)).then(() => {
                    if (signal.sdp.type === 'offer') {
                        connections[fromId].createAnswer().then((description) => {
                            connections[fromId].setLocalDescription(description).then(() => {
                                socketRef.current.emit('signal', fromId,
                                    JSON.stringify({ 'sdp': connections[fromId].localDescription }));
                            }).catch(e => console.log(e));
                        }).catch(e => console.log(e));
                    }
                }).catch(e => console.log(e));
            }

            if (signal.ice) {
                connections[fromId].addIceCandidate(new RTCIceCandidate(signal.ice)).catch(e => console.log(e));
            }
        }
    }, []);

    // --- Chat ---
    const addMessage = useCallback((data, sender, socketIdSender) => {
        setMessages((prev) => [...prev, { sender, data }]);
        if (socketIdSender !== socketIdRef.current) {
            setNewMessages((prev) => prev + 1);
        }
    }, []);

    const sendMessage = useCallback((messageText, username) => {
        socketRef.current.emit('chat-message', messageText, username);
    }, []);

    const resetNewMessages = useCallback(() => setNewMessages(0), []);

    // --- Connect to socket server ---
    const connectToSocket = useCallback(() => {
        const connections = connectionsRef.current;
        socketRef.current = io.connect(server, { secure: false });

        socketRef.current.on('signal', gotMessageFromServer);

        socketRef.current.on('connect', () => {
            socketRef.current.emit('join-call', window.location.pathname);
            socketIdRef.current = socketRef.current.id;

            socketRef.current.on('chat-message', addMessage);

            socketRef.current.on('user-left', (id) => {
                setVideos((videos) => videos.filter((video) => video.socketId !== id));
            });

            socketRef.current.on('user-joined', (id, clients) => {
                clients.forEach((socketListId) => {
                    connections[socketListId] = new RTCPeerConnection(peerConfigConnections);

                    // ICE candidate handler
                    connections[socketListId].onicecandidate = function (event) {
                        if (event.candidate != null) {
                            socketRef.current.emit('signal', socketListId,
                                JSON.stringify({ 'ice': event.candidate }));
                        }
                    };

                    // Track handler (replaces deprecated onaddstream)
                    connections[socketListId].ontrack = (event) => {
                        const remoteStream = event.streams[0];
                        if (!remoteStream) return;

                        let videoExists = videoRef.current.find(v => v.socketId === socketListId);

                        if (videoExists) {
                            setVideos(videos => {
                                const updatedVideos = videos.map(v =>
                                    v.socketId === socketListId ? { ...v, stream: remoteStream } : v
                                );
                                videoRef.current = updatedVideos;
                                return updatedVideos;
                            });
                        } else {
                            let newVideo = {
                                socketId: socketListId,
                                stream: remoteStream,
                                autoplay: true,
                                playsinline: true
                            };
                            setVideos(videos => {
                                const updatedVideos = [...videos, newVideo];
                                videoRef.current = updatedVideos;
                                return updatedVideos;
                            });
                        }
                    };

                    // Add local stream to new peer
                    if (window.localStream !== undefined && window.localStream !== null) {
                        addOrReplaceStream(connections[socketListId], window.localStream);
                    } else {
                        window.localStream = createBlackSilence();
                        addOrReplaceStream(connections[socketListId], window.localStream);
                    }
                });

                // If we are the new joiner, create offers to all existing peers
                if (id === socketIdRef.current) {
                    for (let id2 in connections) {
                        if (id2 === socketIdRef.current) continue;
                        try {
                            addOrReplaceStream(connections[id2], window.localStream);
                        } catch (e) { /* ignore */ }

                        connections[id2].createOffer().then((description) => {
                            connections[id2].setLocalDescription(description)
                                .then(() => {
                                    socketRef.current.emit('signal', id2,
                                        JSON.stringify({ 'sdp': connections[id2].localDescription }));
                                })
                                .catch(e => console.log(e));
                        });
                    }
                }
            });
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
        socketIdRef,
    };
}
