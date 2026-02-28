import React from 'react';
import styles from '../styles/videoComponent.module.css';

/**
 * Renders the grid of remote participant video streams.
 */
export default function VideoGrid({ videos }) {
    return (
        <div className={styles.conferenceView}>
            {videos.map((video) => (
                <div key={video.socketId}>
                    <video
                        data-socket={video.socketId}
                        ref={ref => {
                            if (ref && video.stream) {
                                ref.srcObject = video.stream;
                            }
                        }}
                        autoPlay
                    />
                </div>
            ))}
        </div>
    );
}
