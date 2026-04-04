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
            console.log("[useCaptions] Received transcript data:", data);
            // data: { speakerName, text, isFinal, socketId }
            setCaptions(prev => {
                const newCaptions = [...prev];
                // Find if we have an ongoing interim caption for this speaker
                const lastIdx = newCaptions.length - 1;

                if (data.isFinal) {
                    // Accumulate final captions for meeting-end summarization
                    setTranscript(prev => [...prev, data]);
                    // It's final, add it as a new permanent caption line
                    // or replace the interim one if it matches speaker
                    if (newCaptions[lastIdx] && !newCaptions[lastIdx].isFinal && newCaptions[lastIdx].socketId === data.socketId) {
                        newCaptions[lastIdx] = data;
                    } else {
                        newCaptions.push(data);
                    }
                } else {
                    // It's interim, update the last line if it's from the same speaker and also interim
                    if (newCaptions[lastIdx] && !newCaptions[lastIdx].isFinal && newCaptions[lastIdx].socketId === data.socketId) {
                        newCaptions[lastIdx].text = data.text;
                    } else if (newCaptions[lastIdx] && !newCaptions[lastIdx].isFinal) {
                        // Someone else is speaking interim, we leave the previous interim (it might get finalized later or just replaced),
                        // actually just append new interim
                        newCaptions.push(data);
                    } else {
                        // No interim line currently, append a new one
                        newCaptions.push(data);
                    }
                }

                // Keep only the last 15 captions for performance
                return newCaptions.slice(-15);
            });
        };

        socket.on('transcript', handleTranscript);

        return () => {
            socket.off('transcript', handleTranscript);
        };
    }, [socket]);

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
