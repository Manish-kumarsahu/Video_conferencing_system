import React, { memo } from 'react';
import styles from '../styles/videoComponent.module.css';

/**
 * Single remote video tile – memoized to avoid re-rendering peers that have
 * not changed when only one stream in the grid is updated.
 */
const VideoItem = memo(({ socketId, stream }) => (
    <div>
        <video
            data-socket={socketId}
            ref={ref => {
                if (ref && stream) {
                    ref.srcObject = stream;
                }
            }}
            autoPlay
        />
    </div>
));
VideoItem.displayName = 'VideoItem';

/**
 * Renders the grid of remote participant video streams.
 */
export default function VideoGrid({ videos }) {
    return (
        <div className={styles.conferenceView}>
            {videos.map((video) => (
                <VideoItem key={video.socketId} socketId={video.socketId} stream={video.stream} />
            ))}
        </div>
    );
}
