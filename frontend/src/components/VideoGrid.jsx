import React, { memo } from 'react';
import styles from '../styles/videoComponent.module.css';

/**
 * Renders the grid of remote participant video streams.
 */
const VideoGrid = memo(function VideoGrid({ videos }) {
    // Determine grid class based on number of participants plus 1 (for local, but local is separate here)
    // Actually the user wanted "1 user -> full screen, 2 users -> split screen, 3-4 users -> grid layout"
    // Since local is separate, we apply this to the number of remote videos or total videos if local is included in Grid.
    // wait, local video is rendered separately in VideoMeet.jsx as `.meetUserVideo`.
    // Let's just adjust based on videos.length
    let gridClass = styles.grid1;
    if (videos.length === 1) gridClass = styles.grid1;
    else if (videos.length === 2) gridClass = styles.grid2;
    else if (videos.length >= 3) gridClass = styles.grid3;

    return (
        <div className={`${styles.conferenceView} ${gridClass}`}>
            {videos.map((video) => (
                <div key={video.socketId} className={styles.videoWrapper}>
                    <video
                        data-socket={video.socketId}
                        ref={ref => {
                            if (ref && video.stream) {
                                ref.srcObject = video.stream;
                            }
                        }}
                        autoPlay
                        playsInline
                    />
                </div>
            ))}
        </div>
    );
});

export default VideoGrid;
