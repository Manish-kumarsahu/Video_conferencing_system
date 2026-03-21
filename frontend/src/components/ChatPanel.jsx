import { useState, useRef, useEffect, memo } from 'react';
import { TextField, IconButton } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import styles from '../styles/videoComponent.module.css';

/**
 * Chat panel for in-meeting text communication.
 */
const ChatPanel = memo(function ChatPanel({ messages, onSendMessage }) {
    const [message, setMessage] = useState("");
    const chatEndRef = useRef(null);

    // Auto-scroll to newest message
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSend = () => {
        if (message.trim()) {
            onSendMessage(message.trim());
            setMessage("");
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className={styles.chatRoom}>
            <div className={styles.chatContainer}>
                <h1>Chat</h1>

                <div className={styles.chattingDisplay}>
                    {messages.length === 0 ? (
                        <div style={{ color: "#9ca3af", fontSize: "0.85rem", textAlign: "center", marginTop: "2rem" }}>
                            No messages yet. Say hello! 👋
                        </div>
                    ) : (
                        messages.map((item, index) => {
                            const isMe = item.isMe || item.senderId === window.socketId || item.sender === "You"; // basic check if we don't have isMe
                            return (
                                <div key={index} className={item.isMe ? styles.chatMsgSender : styles.chatMsgReceiver}>
                                    <p style={{ fontWeight: 700 }}>{item.sender}</p>
                                    <p>{item.data}</p>
                                </div>
                            )
                        })
                    )}
                    <div ref={chatEndRef} />
                </div>

                <div className={styles.chattingArea}>
                    <div style={{ flex: 1 }}>
                        <TextField
                            fullWidth
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            onKeyDown={handleKeyDown}
                            id="chat-input"
                            label="Message…"
                            variant="outlined"
                            size="small"
                            multiline
                            maxRows={3}
                            sx={{
                                '& .MuiInputBase-root': {
                                    color: '#fff',
                                },
                                '& .MuiOutlinedInput-notchedOutline': {
                                    borderColor: 'rgba(255, 255, 255, 0.2)',
                                },
                                '&:hover .MuiOutlinedInput-notchedOutline': {
                                    borderColor: 'rgba(124, 92, 252, 0.5)',
                                },
                                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                    borderColor: '#7c5cfc',
                                },
                                '& .MuiInputLabel-root': {
                                    color: 'rgba(255, 255, 255, 0.5)',
                                },
                                '& .MuiInputLabel-root.Mui-focused': {
                                    color: '#7c5cfc',
                                }
                            }}
                        />
                    </div>
                    <IconButton
                        onClick={handleSend}
                        disabled={!message.trim()}
                        sx={{
                            ml: 1,
                            color: message.trim() ? "primary.main" : "text.secondary",
                            background: message.trim() ? "rgba(124,92,252,0.15)" : "transparent",
                            border: "1px solid",
                            borderColor: message.trim() ? "rgba(124,92,252,0.3)" : "rgba(255,255,255,0.08)",
                            borderRadius: "10px",
                            width: 42,
                            height: 42,
                            transition: "all 0.2s ease",
                            flexShrink: 0,
                        }}
                    >
                        <SendIcon sx={{ fontSize: "1.1rem" }} />
                    </IconButton>
                </div>
            </div>
        </div>
    );
});

export default ChatPanel;
