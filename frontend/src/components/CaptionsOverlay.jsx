import React from 'react';

export default function CaptionsOverlay({ captions }) {
    if (!captions || captions.length === 0) return null;

    return (
        <div style={{
            position: 'absolute',
            bottom: '100px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '80%',
            maxWidth: '800px',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            zIndex: 100,
            pointerEvents: 'none'
        }}>
            {captions.slice(-3).map((cap, idx) => (
                <div key={idx} style={{
                    display: 'inline-block',
                    background: 'rgba(0, 0, 0, 0.7)',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    color: 'white',
                    fontFamily: 'Inter, sans-serif',
                    fontSize: '1rem',
                    lineHeight: '1.4',
                    textShadow: '0 1px 2px rgba(0,0,0,0.8)',
                    animation: 'fadeIn 0.3s ease-in',
                    alignSelf: 'center'
                }}>
                    <span style={{ 
                        color: '#bbb', 
                        fontWeight: '600', 
                        marginRight: '8px',
                        fontSize: '0.9em' 
                    }}>
                        {cap.speakerName}:
                    </span>
                    <span style={{
                        opacity: cap.isFinal ? 1 : 0.8,
                        fontStyle: cap.isFinal ? 'normal' : 'italic'
                    }}>
                        {cap.text}
                    </span>
                </div>
            ))}
        </div>
    );
}