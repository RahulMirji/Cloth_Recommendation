import React, { useState, useRef, useCallback, useEffect } from 'react';
// FIX: Removed `LiveSession` from import as it is not an exported member of `@google/genai`.
import { GoogleGenAI, Modality, Blob, LiveServerMessage } from '@google/genai';

// --- Constants ---
const SYSTEM_INSTRUCTION = 'you are a professional outfit scorer help the user in dressing sense asking some initial questions like where he is going why he dressed not much questions just for context to help him to dress more best way as much as possible , respond naturally like as his buddy , and very friendly vibe use emotions wherever possible';
const FRAME_RATE = 2; // Send 2 frames per second
const JPEG_QUALITY = 0.7;
const INPUT_SAMPLE_RATE = 16000;
const OUTPUT_SAMPLE_RATE = 24000;

// --- Audio/Image Utility Functions ---
function encode(bytes: Uint8Array): string {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function decode(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

function createAudioBlob(data: Float32Array): Blob {
  const l = data.length;
  const int16 = new Int16Array(l);
  for (let i = 0; i < l; i++) {
    int16[i] = data[i] * 32768;
  }
  return {
    data: encode(new Uint8Array(int16.buffer)),
    mimeType: `audio/pcm;rate=${INPUT_SAMPLE_RATE}`,
  };
}

function blobToBase64(blob: globalThis.Blob): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            if (typeof reader.result === 'string') {
                resolve(reader.result.split(',')[1]);
            } else {
                reject(new Error("Failed to read blob as base64 string."));
            }
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}

// --- Icon Components ---
const MicIcon = ({ className }: { className?: string }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3zM19 13a1 1 0 0 0-1 1v1a6 6 0 0 1-12 0v-1a1 1 0 1 0-2 0v1a8 8 0 0 0 7 7.93V24h2v-2.07A8 8 0 0 0 20 15v-1a1 1 0 0 0-1-1z" />
    </svg>
);
const MicOffIcon = ({ className }: { className?: string }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2a3 3 0 0 0-3 3v8a3 3 0 0 0 4.54 2.82L9.17 11.45A1 1 0 0 0 9 5v8a1 1 0 0 1-2 0V5a3 3 0 0 0 .18-1.02l-2.9-2.9A8 8 0 0 0 4 15v1a1 1 0 1 0 2 0v-1a6 6 0 0 1 11.83-1.17l-1.47-1.47A3 3 0 0 0 12 16a3 3 0 0 0-.58-1.76l-4.37-4.37A3 3 0 0 0 12 2zm7 11a1 1 0 0 0-1 1v1a6 6 0 0 1-9.37 4.93l1.47-1.47A4 4 0 0 0 16 15v-1a1 1 0 0 0-1-1zm-2.12-8.88L14.4 2.45A3 3 0 0 0 15 5v3.17l2 2V5a1 1 0 0 0-2 0zm-11 11L2.12 2.37.71 3.78l20 20 1.41-1.41z" />
    </svg>
);
const PhoneHangUpIcon = ({ className }: { className?: string }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 9c-1.63 0-3.14.4-4.5 1.12L6.11 8.73a10 10 0 0 1 11.78 0l-1.39 1.39C15.14 9.4 13.63 9 12 9zm7.7 5.07l-2.82 2.82c-4.4 2.2-9.62.47-11.82-3.93-2.2-4.4-.47-9.62 3.93-11.82l2.82-2.82L14.12 3l-2.83 2.83-1.41-1.41L8.47 5.83l1.41 1.41L7.05 10.07l1.41 1.41 2.83-2.83 1.41 1.41-2.83 2.83 1.41 1.41 2.83-2.83 1.41 1.41-2.83 2.83L17 21l1.41-1.41-2.83-2.83 1.41-1.41 2.83 2.83z" />
    </svg>
);

// --- Main App Component ---
export default function App() {
    const [isCalling, setIsCalling] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [userTranscription, setUserTranscription] = useState('');
    const [modelTranscription, setModelTranscription] = useState('');
    const [error, setError] = useState<string | null>(null);

    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const mediaStreamRef = useRef<MediaStream | null>(null);
    // FIX: Replaced `LiveSession` with `any` as it is not an exported type.
    const sessionPromiseRef = useRef<Promise<any> | null>(null);
    const inputAudioContextRef = useRef<AudioContext | null>(null);
    const outputAudioContextRef = useRef<AudioContext | null>(null);
    const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
    const mediaStreamSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
    const frameIntervalRef = useRef<number | null>(null);
    
    // For seamless audio playback
    const audioPlayback = useRef<{
        nextStartTime: number;
        sources: Set<AudioBufferSourceNode>;
    }>({ nextStartTime: 0, sources: new Set() });

    const stopAllMedia = useCallback(() => {
        if (frameIntervalRef.current) {
            clearInterval(frameIntervalRef.current);
            frameIntervalRef.current = null;
        }
        if (mediaStreamRef.current) {
            mediaStreamRef.current.getTracks().forEach(track => track.stop());
            mediaStreamRef.current = null;
        }
        if (scriptProcessorRef.current) {
            scriptProcessorRef.current.disconnect();
            scriptProcessorRef.current = null;
        }
        if (mediaStreamSourceRef.current) {
            mediaStreamSourceRef.current.disconnect();
            mediaStreamSourceRef.current = null;
        }
        if (inputAudioContextRef.current && inputAudioContextRef.current.state !== 'closed') {
            inputAudioContextRef.current.close();
        }
        if (outputAudioContextRef.current && outputAudioContextRef.current.state !== 'closed') {
            outputAudioContextRef.current.close();
        }
        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }
    }, []);

    const resetState = useCallback(() => {
        setIsCalling(false);
        setIsConnecting(false);
        setError(null);
        setUserTranscription('');
        setModelTranscription('');
        sessionPromiseRef.current = null;
        audioPlayback.current = { nextStartTime: 0, sources: new Set() };
        inputAudioContextRef.current = null;
        outputAudioContextRef.current = null;
    }, []);

    const handleStopCall = useCallback(async () => {
        setIsConnecting(true); // Show user we are working on shutdown
        if (sessionPromiseRef.current) {
             try {
                const session = await sessionPromiseRef.current;
                session.close();
            } catch (e) {
                console.warn("Error closing session, it may have already been closed:", e);
            }
        }
        stopAllMedia();
        resetState();
    }, [stopAllMedia, resetState]);


    useEffect(() => {
      // Cleanup on unmount
      return () => {
        if (isCalling) {
          handleStopCall();
        }
      };
    }, [isCalling, handleStopCall]);

    const handleStartCall = useCallback(async () => {
        setIsConnecting(true);
        setError(null);
        setUserTranscription('');
        setModelTranscription('');

        if (!process.env.API_KEY) {
            setError("API key not found. Please ensure the API_KEY environment variable is set.");
            setIsConnecting(false);
            return;
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
            mediaStreamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }

            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
            inputAudioContextRef.current = new ((window as any).AudioContext || (window as any).webkitAudioContext)({ sampleRate: INPUT_SAMPLE_RATE });
            outputAudioContextRef.current = new ((window as any).AudioContext || (window as any).webkitAudioContext)({ sampleRate: OUTPUT_SAMPLE_RATE });
            
            const outputNode = outputAudioContextRef.current.createGain();
            outputNode.connect(outputAudioContextRef.current.destination);

            let currentInputTranscription = '';
            let currentOutputTranscription = '';

            sessionPromiseRef.current = ai.live.connect({
                model: 'gemini-2.5-flash-native-audio-preview-09-2025',
                config: {
                    systemInstruction: SYSTEM_INSTRUCTION,
                    responseModalities: [Modality.AUDIO],
                    speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } } },
                    inputAudioTranscription: {},
                    outputAudioTranscription: {},
                },
                callbacks: {
                    onopen: () => {
                        setIsConnecting(false);
                        setIsCalling(true);

                        if (!inputAudioContextRef.current || !mediaStreamRef.current) return;
                        // Start streaming audio
                        const source = inputAudioContextRef.current.createMediaStreamSource(mediaStreamRef.current);
                        mediaStreamSourceRef.current = source;
                        const scriptProcessor = inputAudioContextRef.current.createScriptProcessor(4096, 1, 1);
                        scriptProcessorRef.current = scriptProcessor;

                        scriptProcessor.onaudioprocess = (audioProcessingEvent) => {
                            if (isMuted) return;
                            const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
                            const pcmBlob = createAudioBlob(inputData);
                            sessionPromiseRef.current?.then((session) => {
                                session.sendRealtimeInput({ media: pcmBlob });
                            });
                        };
                        source.connect(scriptProcessor);
                        scriptProcessor.connect(inputAudioContextRef.current.destination);

                        // Start streaming video frames
                        frameIntervalRef.current = window.setInterval(() => {
                            const video = videoRef.current;
                            const canvas = canvasRef.current;
                            if (video && canvas && video.readyState >= 2) {
                                const ctx = canvas.getContext('2d');
                                if (ctx) {
                                    canvas.width = video.videoWidth;
                                    canvas.height = video.videoHeight;
                                    ctx.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
                                    canvas.toBlob(
                                        async (blob) => {
                                            if (blob) {
                                                const base64Data = await blobToBase64(blob);
                                                sessionPromiseRef.current?.then((session) => {
                                                    session.sendRealtimeInput({ media: { data: base64Data, mimeType: 'image/jpeg' } });
                                                });
                                            }
                                        },
                                        'image/jpeg',
                                        JPEG_QUALITY
                                    );
                                }
                            }
                        }, 1000 / FRAME_RATE);
                    },
                    onmessage: async (message: LiveServerMessage) => {
                        // Handle transcription
                        if (message.serverContent?.inputTranscription) {
                            currentInputTranscription += message.serverContent.inputTranscription.text;
                            setUserTranscription(currentInputTranscription);
                        }
                        if (message.serverContent?.outputTranscription) {
                            currentOutputTranscription += message.serverContent.outputTranscription.text;
                            setModelTranscription(currentOutputTranscription);
                        }
                        if (message.serverContent?.turnComplete) {
                            currentInputTranscription = '';
                            currentOutputTranscription = '';
                        }
                        
                        // Handle audio playback
                        const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
                        if (base64Audio && outputAudioContextRef.current) {
                            const audioContext = outputAudioContextRef.current;
                            audioPlayback.current.nextStartTime = Math.max(audioPlayback.current.nextStartTime, audioContext.currentTime);

                            const audioBuffer = await decodeAudioData(decode(base64Audio), audioContext, OUTPUT_SAMPLE_RATE, 1);
                            const source = audioContext.createBufferSource();
                            source.buffer = audioBuffer;
                            source.connect(outputNode);
                            
                            source.addEventListener('ended', () => {
                                audioPlayback.current.sources.delete(source);
                            });

                            source.start(audioPlayback.current.nextStartTime);
                            audioPlayback.current.nextStartTime += audioBuffer.duration;
                            audioPlayback.current.sources.add(source);
                        }

                        if (message.serverContent?.interrupted) {
                          for (const source of audioPlayback.current.sources.values()) {
                              source.stop();
                              audioPlayback.current.sources.delete(source);
                          }
                          audioPlayback.current.nextStartTime = 0;
                        }
                    },
                    onerror: (e: ErrorEvent) => {
                        console.error('API Error:', e.error || e);
                        const message = (e.error?.message || e.message || 'An unknown error occurred.');
                        setError(`API Error: ${message}. Please check your connection and try again.`);
                        handleStopCall();
                    },
                    onclose: () => {
                        console.log('Session closed.');
                        handleStopCall();
                    },
                },
            });

        } catch (err) {
            console.error('Failed to start call:', err);
            let message = 'An unexpected error occurred.';
            if (err instanceof Error) {
              if (err.name === 'NotAllowedError') {
                message = 'Camera and microphone access denied. Please enable permissions in your browser settings.';
              } else {
                message = err.message;
              }
            }
            setError(message);
            setIsConnecting(false);
            stopAllMedia();
            resetState();
        }
    }, [handleStopCall, isMuted, stopAllMedia, resetState]);

    const handleToggleMute = () => {
        setIsMuted(prev => !prev);
    };

    return (
        <main className="w-full h-screen bg-gray-900 flex flex-col items-center justify-center font-sans">
            <div className="relative w-full max-w-4xl aspect-video bg-black rounded-lg shadow-2xl overflow-hidden">
                <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover transform scale-x-[-1]"></video>
                <canvas ref={canvasRef} className="hidden"></canvas>
                
                {!isCalling && !isConnecting && (
                    <div className="absolute inset-0 bg-black bg-opacity-60 flex flex-col items-center justify-center p-4">
                        <h1 className="text-3xl md:text-5xl font-bold mb-2 text-center">Gemini Outfit Scorer</h1>
                        <p className="text-lg text-gray-300 mb-8 text-center">Get live feedback on your style.</p>
                        <button 
                          onClick={handleStartCall}
                          className="px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-full transition-transform duration-200 ease-in-out transform hover:scale-105 shadow-lg flex items-center gap-3 text-xl"
                        >
                          <MicIcon className="w-6 h-6"/>
                          Start Styling Call
                        </button>
                    </div>
                )}
                
                {isConnecting && (
                    <div className="absolute inset-0 bg-black bg-opacity-70 flex items-center justify-center">
                        <p className="text-2xl animate-pulse">Connecting...</p>
                    </div>
                )}

                {isCalling && (
                    <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
                        <div className="text-lg leading-relaxed max-w-3xl mx-auto p-4 bg-black/30 backdrop-blur-sm rounded-lg">
                           <p className="font-semibold text-cyan-300">You: <span className="text-white font-normal">{userTranscription}</span></p>
                           <p className="font-semibold text-indigo-300">Gemini: <span className="text-white font-normal">{modelTranscription}</span></p>
                        </div>
                    </div>
                )}
            </div>

            {isCalling && (
                <div className="mt-6 flex items-center space-x-6">
                    <button
                        onClick={handleToggleMute}
                        className={`w-16 h-16 rounded-full flex items-center justify-center transition-colors ${isMuted ? 'bg-yellow-500 hover:bg-yellow-600' : 'bg-gray-600 hover:bg-gray-700'}`}
                        aria-label={isMuted ? 'Unmute' : 'Mute'}
                    >
                        {isMuted ? <MicOffIcon className="w-8 h-8"/> : <MicIcon className="w-8 h-8"/>}
                    </button>
                    <button
                        onClick={handleStopCall}
                        className="w-20 h-20 bg-red-600 hover:bg-red-700 rounded-full flex items-center justify-center transition-transform duration-200 ease-in-out transform hover:scale-110"
                        aria-label="End call"
                    >
                        <PhoneHangUpIcon className="w-10 h-10"/>
                    </button>
                </div>
            )}
            
            {error && (
                <div className="mt-4 p-4 bg-red-500/20 text-red-300 border border-red-500 rounded-lg max-w-xl text-center">
                    <p className="font-bold">Error</p>
                    <p>{error}</p>
                </div>
            )}
        </main>
    );
}
