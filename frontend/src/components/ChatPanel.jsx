import React, { useState } from 'react';
import { TextField, Button } from '@mui/material';
import styles from '../styles/videoComponent.module.css';

/**
 * Chat panel for in-meeting text communication.
 */
export default function ChatPanel({ messages, onSendMessage }) {
    const [message, setMessage] = useState("");

    const handleSend = () => {
        if (message.trim()) {
            onSendMessage(message);
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
                    {messages.length !== 0 ? messages.map((item, index) => (
                        <div style={{ marginBottom: "20px" }} key={index}>
                            <p style={{ fontWeight: "bold" }}>{item.sender}</p>
                            <p>{item.data}</p>
                        </div>
                    )) : <p>No Messages Yet</p>}
                </div>

                <div className={styles.chattingArea}>
                    <TextField
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        onKeyDown={handleKeyDown}
                        id="chat-input"
                        label="Enter Your chat"
                        variant="outlined"
                    />
                    <Button variant='contained' onClick={handleSend}>Send</Button>
                </div>
            </div>
        </div>
    );
}
