import React, { memo } from 'react';
import styles from '../styles/videoComponent.module.css';
import MicIcon from '@mui/icons-material/Mic';
import MicOffIcon from '@mui/icons-material/MicOff';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';

/**
 * Renders the grid of local and remote participant video streams.
 */
const VideoGrid = memo(function VideoGrid({ videos, localVideoRef, localAudio, localVideo, localUsername, participants, socketId }) {
    // Total videos + 1 for local
    const totalVideos = videos.length + 1;
    let gridClass = styles.grid1;
    if (totalVideos === 2) gridClass = styles.grid2;
    else if (totalVideos === 3 || totalVideos === 4) gridClass = styles.grid4;
    else if (totalVideos >= 5) gridClass = styles.gridMore;

    const getParticipant = (sid) => participants.find(p => p.socketId === sid);

    return (
        <div className={`${styles.conferenceView} ${gridClass}`}>
            {/* Local Video Tile */}
            <div className={styles.videoWrapper}>
                {!localVideo && (
                    <div className={styles.avatarPlaceholder}>
                        <AccountCircleIcon sx={{ fontSize: 80, color: 'rgba(255,255,255,0.7)' }} />
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
                        <span className={styles.userName}>{localUsername || "You"}</span>
                    </div>
                    <div className={styles.overlayTopRight}>
                        <div className={styles.statusIcon}>
                            {!localAudio ? <MicOffIcon sx={{ color: '#ea4335', fontSize: '1rem' }} /> : <MicIcon sx={{ color: '#fff', fontSize: '1rem' }} />}
                        </div>
                    </div>
                </div>
            </div>

            {/* Remote Videos Tiles */}
            {videos.map((vid, index) => {
                const p = getParticipant(vid.socketId);
                return (
                    <div key={vid.socketId} className={styles.videoWrapper}>
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
                                <span className={styles.userName}>{p ? p.username : `User ${vid.socketId.substring(0, 4)}`}</span>
                            </div>
                            <div className={styles.overlayTopRight}>
                                <div className={styles.statusIcon}>
                                    <MicIcon sx={{ color: '#fff', fontSize: '1rem' }} /> {/* Simplified */}
                                </div>
                                <MoreVertIcon sx={{ color: '#fff', fontSize: '1.2rem', cursor: 'pointer', opacity: 0.8 }} />
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
});

export default VideoGrid;
