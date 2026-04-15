import { useState, useRef, useCallback, useEffect } from 'react';

export default function useCaptions(socket, username) {
    const [captionsOn, setCaptionsOn] = useState(false);
    const [captions, setCaptions] = useState([]);
    const [transcript, setTranscript] = useState([]); // final-only captions for summarization
    const audioContextRef = useRef(null);
    const processorRef = useRef(null);
    const sourceRef = useRef(null);

    // Keep track of the current speaker's latest interim caption
    // to avoid duplicating the same sentence over and over.

    useEffect(() => {
        if (!socket) return;

        const handleTranscript = (data) => {
            // data: { speakerName, text, isFinal, socketId }
            const dataWithTime = { ...data, timestamp: Date.now() };

            setCaptions(prev => {
                const newCaptions = [...prev];
                const lastIdx = newCaptions.length - 1;

                if (data.isFinal) {
                    setTranscript(p => [...p, data]);
                    // If last line was an interim from the same person, replace it with final
                    if (newCaptions[lastIdx] && !newCaptions[lastIdx].isFinal && newCaptions[lastIdx].socketId === data.socketId) {
                        newCaptions[lastIdx] = dataWithTime;
                    } else {
                        newCaptions.push(dataWithTime);
                    }
                } else {
                    // Update current interim line for this speaker or add new one
                    if (newCaptions[lastIdx] && !newCaptions[lastIdx].isFinal && newCaptions[lastIdx].socketId === data.socketId) {
                        newCaptions[lastIdx].text = data.text;
                        newCaptions[lastIdx].timestamp = Date.now(); // Refresh timestamp for ongoing speech
                    } else {
                        newCaptions.push(dataWithTime);
                    }
                }

                return newCaptions.slice(-15);
            });
        };

        socket.on('transcript', handleTranscript);
        return () => socket.off('transcript', handleTranscript);
    }, [socket]);

    // Timer to clear old captions (disappear after 5 seconds of silence)
    useEffect(() => {
        const interval = setInterval(() => {
            setCaptions(prev => {
                if (prev.length === 0) return prev;
                const now = Date.now();
                const filtered = prev.filter(c => now - c.timestamp < 5000);
                if (filtered.length === prev.length) return prev;
                return filtered;
            });
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    const startCaptions = useCallback(async () => {
        console.log("[useCaptions] startCaptions called. localStream:", window.localStream);
        if (!window.localStream || window.localStream.getAudioTracks().length === 0) {
            console.warn("No local audio stream available for captions");
            return;
        }

        if (captionsOn) return;

        try {
            console.log("[useCaptions] Initializing AudioContext and ScriptProcessor...");
            // Need a clean AudioContext at 16000Hz for Deepgram
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            audioContextRef.current = new AudioContext({ sampleRate: 16000 });

            const stream = window.localStream;
            sourceRef.current = audioContextRef.current.createMediaStreamSource(stream);

            // Create a ScriptProcessorNode (deprecated but highly compatible) 
            // 4096 buffer size is ~250ms at 16kHz
            processorRef.current = audioContextRef.current.createScriptProcessor(4096, 1, 1);

            processorRef.current.onaudioprocess = (e) => {
                const inputData = e.inputBuffer.getChannelData(0);

                // Convert Float32Array (-1.0 to 1.0) to Int16Array (-32768 to 32767)
                const int16Data = new Int16Array(inputData.length);
                for (let i = 0; i < inputData.length; i++) {
                    let s = Math.max(-1, Math.min(1, inputData[i]));
                    int16Data[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
                }

                if (socket && socket.connected) {
                    console.log(`[useCaptions] Sending audio chunk, size: ${int16Data.buffer.byteLength} bytes`);
                    socket.emit('audio-stream', int16Data.buffer);
                }
            };

            sourceRef.current.connect(processorRef.current);
            processorRef.current.connect(audioContextRef.current.destination);

            const roomId = window.location.pathname.split('/').pop();
            console.log("[useCaptions] Emitting start-captions for room:", roomId);
            socket.emit('start-captions', roomId, username);
            setCaptionsOn(true);
        } catch (err) {
            console.error("Error starting captions", err);
        }
    }, [socket, username, captionsOn]);

    const stopCaptions = useCallback(() => {
        if (!captionsOn) return;

        if (processorRef.current) {
            processorRef.current.disconnect();
            processorRef.current.onaudioprocess = null;
        }
        if (sourceRef.current) {
            sourceRef.current.disconnect();
        }
        if (audioContextRef.current) {
            audioContextRef.current.close().catch(console.error);
        }

        socket.emit('stop-captions');
        setCaptionsOn(false);
    }, [socket, captionsOn]);

    const toggleCaptions = useCallback(() => {
        if (captionsOn) {
            stopCaptions();
        } else {
            startCaptions();
        }
    }, [captionsOn, startCaptions, stopCaptions]);

    return {
        captionsOn,
        toggleCaptions,
        captions,
        transcript,
    };
}
