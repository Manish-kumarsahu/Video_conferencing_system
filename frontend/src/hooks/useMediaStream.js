import { useState, useRef, useEffect, useCallback } from 'react';

/**
 * Manages local media streams: camera, microphone, and screen share.
 * Handles permissions, toggling, and cleanup.
 */
export default function useMediaStream() {
    const localVideoRef = useRef();

    const [videoAvailable, setVideoAvailable] = useState(true);
    const [audioAvailable, setAudioAvailable] = useState(true);
    const [screenAvailable, setScreenAvailable] = useState(false);

    const [video, setVideo] = useState(false);
    const [audio, setAudio] = useState();
    const [screen, setScreen] = useState();

    // --- Utility: generate dummy tracks for when media is unavailable ---
    const silence = useCallback(() => {
        let ctx = new AudioContext();
        let oscillator = ctx.createOscillator();
        let dst = oscillator.connect(ctx.createMediaStreamDestination());
        oscillator.start();
        ctx.resume();
        return Object.assign(dst.stream.getAudioTracks()[0], { enabled: false });
    }, []);

    const black = useCallback(({ width = 640, height = 480 } = {}) => {
        let canvas = Object.assign(document.createElement("canvas"), { width, height });
        canvas.getContext('2d').fillRect(0, 0, width, height);
        let stream = canvas.captureStream();
        return Object.assign(stream.getVideoTracks()[0], { enabled: false });
    }, []);

    const createBlackSilence = useCallback(
        (...args) => new MediaStream([black(...args), silence()]),
        [black, silence]
    );

    // --- Initial permission check (runs once on mount) ---
    const getPermissions = useCallback(async () => {
        try {
            const userMediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            setVideoAvailable(true);
            setAudioAvailable(true);
            window.localStream = userMediaStream;
            if (localVideoRef.current) {
                localVideoRef.current.srcObject = userMediaStream;
            }
        } catch (error) {
            if (error.name === 'NotAllowedError' || error.name === 'NotFoundError') {
                try {
                    const audioOnly = await navigator.mediaDevices.getUserMedia({ audio: true });
                    setVideoAvailable(false);
                    setAudioAvailable(true);
                    window.localStream = audioOnly;
                    if (localVideoRef.current) {
                        localVideoRef.current.srcObject = audioOnly;
                    }
                } catch {
                    setVideoAvailable(false);
                    setAudioAvailable(false);
                }
            } else {
                console.log(error);
            }
        }

        if (navigator.mediaDevices.getDisplayMedia) {
            setScreenAvailable(true);
        } else {
            setScreenAvailable(false);
        }
    }, []);

    useEffect(() => {
        getPermissions();
    }, [getPermissions]);

    // --- getUserMedia: called when video/audio toggles change ---
    // Returns a callback so WebRTC hook can renegotiate after stream change
    const getUserMedia = useCallback((onStreamReady) => {
        if ((video && videoAvailable) || (audio && audioAvailable)) {
            navigator.mediaDevices.getUserMedia({ video: video, audio: audio })
                .then((stream) => {
                    try {
                        window.localStream.getTracks().forEach(track => track.stop());
                    } catch (e) { /* previous stream already stopped */ }

                    window.localStream = stream;
                    localVideoRef.current.srcObject = stream;

                    if (onStreamReady) onStreamReady(stream);

                    stream.getTracks().forEach(track => track.onended = () => {
                        setVideo(false);
                        setAudio(false);

                        try {
                            let tracks = localVideoRef.current.srcObject.getTracks();
                            tracks.forEach(track => track.stop());
                        } catch (e) { /* ignore */ }

                        window.localStream = createBlackSilence();
                        localVideoRef.current.srcObject = window.localStream;

                        if (onStreamReady) onStreamReady(window.localStream);
                    });
                })
                .catch((e) => console.log(e));
        } else {
            try {
                let tracks = localVideoRef.current.srcObject.getTracks();
                tracks.forEach(track => track.stop());
            } catch (e) { /* ignore */ }
        }
    }, [video, audio, videoAvailable, audioAvailable, createBlackSilence]);

    // --- Screen share ---
    const getDisplayMedia = useCallback((onStreamReady) => {
        if (screen && navigator.mediaDevices.getDisplayMedia) {
            navigator.mediaDevices.getDisplayMedia({ video: true, audio: true })
                .then((stream) => {
                    try {
                        window.localStream.getTracks().forEach(track => track.stop());
                    } catch (e) { /* ignore */ }

                    window.localStream = stream;
                    localVideoRef.current.srcObject = stream;

                    if (onStreamReady) onStreamReady(stream);

                    stream.getTracks().forEach(track => track.onended = () => {
                        setScreen(false);

                        try {
                            let tracks = localVideoRef.current.srcObject.getTracks();
                            tracks.forEach(track => track.stop());
                        } catch (e) { /* ignore */ }

                        window.localStream = createBlackSilence();
                        localVideoRef.current.srcObject = window.localStream;

                        // Fall back to camera
                        getUserMedia(onStreamReady);
                    });
                })
                .catch((e) => console.log(e));
        }
    }, [screen, getUserMedia, createBlackSilence]);

    // --- Start media (called when user clicks Connect in lobby) ---
    const startMedia = useCallback(() => {
        setVideo(videoAvailable);
        setAudio(audioAvailable);
    }, [videoAvailable, audioAvailable]);

    // --- Cleanup on unmount ---
    const stopAllTracks = useCallback(() => {
        try {
            let tracks = localVideoRef.current.srcObject.getTracks();
            tracks.forEach(track => track.stop());
        } catch (e) { /* ignore */ }
    }, []);

    // --- Toggle handlers ---
    const toggleVideo = useCallback(() => setVideo(prev => !prev), []);
    const toggleAudio = useCallback(() => setAudio(prev => !prev), []);
    const toggleScreen = useCallback(() => setScreen(prev => !prev), []);

    return {
        localVideoRef,
        video,
        audio,
        screen,
        videoAvailable,
        audioAvailable,
        screenAvailable,
        startMedia,
        getUserMedia,
        getDisplayMedia,
        stopAllTracks,
        toggleVideo,
        toggleAudio,
        toggleScreen,
        createBlackSilence,
    };
}
