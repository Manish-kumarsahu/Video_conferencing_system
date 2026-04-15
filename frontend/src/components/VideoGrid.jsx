import React, { memo } from 'react';
import styles from '../styles/videoComponent.module.css';
import MicIcon from '@mui/icons-material/Mic';
import MicOffIcon from '@mui/icons-material/MicOff';
import VideocamOffIcon from '@mui/icons-material/VideocamOff';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import { Tooltip } from '@mui/material';

/**
 * Renders the grid of local and remote participant video streams
 * with active speaker glow, real mic/video status icons, and avatar placeholders.
 */
const VideoGrid = memo(function VideoGrid({
    videos, localVideoRef, localAudio, localVideo, localUsername,
    participants, socketId, mediaStatus
}) {
    const totalVideos = videos.length + 1;
    let gridClass = styles.grid1;
    if (totalVideos === 2) gridClass = styles.grid2;
    else if (totalVideos === 3 || totalVideos === 4) gridClass = styles.grid4;
    else if (totalVideos >= 5) gridClass = styles.gridMore;

    const getParticipant = (sid) => participants.find(p => p.socketId === sid);
    const getStatus = (sid) => mediaStatus?.[sid] || {};

    const localStatus = getStatus(socketId);
    const localSpeaking = localStatus.isSpeaking || false;

    return (
        <div className={`${styles.conferenceView} ${gridClass}`}>
            {/* ── Local Video Tile ── */}
            <div className={`${styles.videoWrapper}`}>
                {!localVideo && (
                    <div className={styles.avatarPlaceholder}>
                        <AccountCircleIcon sx={{ fontSize: 80, color: 'rgba(255,255,255,0.7)' }} />
                        <span style={{ color: '#94a3b8', fontSize: '0.85rem', marginTop: 8 }}>
                            Camera Off
                        </span>
                    </div>
                )}
                <video
                    ref={localVideoRef}
                    autoPlay
                    muted
                    playsInline
                    className={!localVideo ? styles.hiddenVideo : ''}
                />
                <div className={styles.videoOverlay}>
                    <div className={styles.overlayBottomLeft}>
                        <span className={styles.userName}>
                            {localUsername || "You"}
                            {localSpeaking && (
                                <span style={{
                                    display: 'inline-block', width: 6, height: 6,
                                    borderRadius: '50%', background: '#34d399',
                                    marginLeft: 6, boxShadow: '0 0 6px rgba(52,211,153,0.8)',
                                    verticalAlign: 'middle',
                                }} />
                            )}
                        </span>
                    </div>
                    <div className={styles.overlayTopRight}>
                        <Tooltip title={localAudio ? "Mic On" : "Mic Off"} placement="left">
                            <div className={`${styles.statusIcon} ${localSpeaking ? styles.micSpeaking : ''}`}>
                                {!localAudio
                                    ? <MicOffIcon sx={{ color: '#ea4335', fontSize: '1rem' }} />
                                    : <MicIcon sx={{ color: localSpeaking ? '#34d399' : '#fff', fontSize: '1rem' }} />
                                }
                            </div>
                        </Tooltip>
                    </div>
                </div>
            </div>

            {/* ── Remote Video Tiles ── */}
            {videos.map((vid) => {
                const p = getParticipant(vid.socketId);
                const status = getStatus(vid.socketId);
                const remoteSpeaking = status.isSpeaking || false;
                const remoteMicOn = status.micOn !== undefined ? status.micOn : true;
                const remoteVideoOn = status.videoOn !== undefined ? status.videoOn : true;

                return (
                    <div
                        key={vid.socketId}
                        className={`${styles.videoWrapper}`}
                    >
                        {/* Video-off overlay */}
                        {!remoteVideoOn && (
                            <div className={styles.videoOffOverlay}>
                                <AccountCircleIcon sx={{ fontSize: 80, color: 'rgba(255,255,255,0.7)' }} />
                                <span style={{ color: '#94a3b8', fontSize: '0.85rem', marginTop: 8 }}>
                                    Camera Off
                                </span>
                            </div>
                        )}

                        <video
                            data-socket={vid.socketId}
                            ref={ref => {
                                if (ref && vid.stream) {
                                    ref.srcObject = vid.stream;
                                }
                            }}
                            autoPlay
                            playsInline
                        />

                        <div className={styles.videoOverlay}>
                            <div className={styles.overlayBottomLeft}>
                                <span className={styles.userName}>
                                    {p ? p.username : `User ${vid.socketId.substring(0, 4)}`}

                                    {remoteSpeaking && (
                                        <span style={{
                                            display: 'inline-block', width: 6, height: 6,
                                            borderRadius: '50%', background: '#34d399',
                                            marginLeft: 6, boxShadow: '0 0 6px rgba(52,211,153,0.8)',
                                            verticalAlign: 'middle',
                                        }} />
                                    )}
                                </span>
                            </div>
                            <div className={styles.overlayTopRight}>
                                <Tooltip title={remoteMicOn ? "Mic On" : "Mic Off"} placement="left">
                                    <div className={`${styles.statusIcon} ${remoteSpeaking ? styles.micSpeaking : ''}`}>
                                        {!remoteMicOn
                                            ? <MicOffIcon sx={{ color: '#ea4335', fontSize: '1rem' }} />
                                            : <MicIcon sx={{ color: remoteSpeaking ? '#34d399' : '#fff', fontSize: '1rem' }} />
                                        }
                                    </div>
                                </Tooltip>
                                {!remoteVideoOn && (
                                    <Tooltip title="Camera Off" placement="left">
                                        <div className={styles.statusIcon}>
                                            <VideocamOffIcon sx={{ color: '#ea4335', fontSize: '1rem' }} />
                                        </div>
                                    </Tooltip>
                                )}
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
});

export default VideoGrid;
