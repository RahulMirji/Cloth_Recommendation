/**
 * Gemini Live HTML for WebView
 * This is the EXACT same HTML that works on web platform
 */

export const getGeminiLiveHTML = (apiKey: string) => {
  // Read the working HTML from public/gemini-live.html and inject API key
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>Gemini Live Stylist</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            background: #000; color: #fff; overflow: hidden; height: 100vh; width: 100vw;
        }
        #app { width: 100%; height: 100%; display: flex; flex-direction: column; position: relative; }
        #video-container { flex: 1; position: relative; background: #000; }
        #camera-view { 
            width: 100%; height: 100%; object-fit: cover; transform: scaleX(-1);
            /* Prevent video freezing */
            -webkit-transform: scaleX(-1);
            backface-visibility: hidden;
            -webkit-backface-visibility: hidden;
        }
        #overlay {
            position: absolute; top: 0; left: 0; right: 0; bottom: 0;
            background: rgba(0, 0, 0, 0.7); display: flex; flex-direction: column;
            align-items: center; justify-content: center; padding: 20px;
        }
        #overlay.hidden { display: none; }
        .title { font-size: 32px; font-weight: bold; margin-bottom: 8px; text-align: center; }
        .subtitle { font-size: 16px; color: #ccc; margin-bottom: 32px; text-align: center; }
        .start-button {
            display: flex; align-items: center; gap: 12px; background: #6366f1;
            padding: 16px 32px; border-radius: 30px; border: none; color: white;
            font-size: 18px; font-weight: 600; cursor: pointer; transition: transform 0.2s;
        }
        .start-button:active { transform: scale(0.95); }
        #transcription-container {
            position: absolute; bottom: 0; left: 0; right: 0; padding: 16px;
            background: linear-gradient(to top, rgba(0,0,0,0.8), transparent);
            max-height: 40%; overflow-y: auto;
        }
        .transcription-box {
            background: rgba(0, 0, 0, 0.6); padding: 12px; border-radius: 12px;
            margin-bottom: 8px; backdrop-filter: blur(10px);
        }
        .transcription-box.model { background: rgba(99, 102, 241, 0.3); }
        .transcription-label { font-size: 14px; font-weight: 600; margin-bottom: 4px; }
        .transcription-label.user { color: #60a5fa; }
        .transcription-label.model { color: #a78bfa; }
        .transcription-text { font-size: 16px; line-height: 22px; }

        #controls {
            position: absolute; bottom: 20px; left: 50%; transform: translateX(-50%);
            display: flex; align-items: center; gap: 24px; z-index: 10;
        }
        #controls.hidden { display: none; }
        .control-button {
            width: 64px; height: 64px; border-radius: 32px;
            background: rgba(107, 114, 128, 0.8); border: none;
            display: flex; align-items: center; justify-content: center;
            cursor: pointer; transition: transform 0.2s;
        }
        .control-button:active { transform: scale(0.9); }
        .control-button.muted { background: rgba(251, 191, 36, 0.8); }
        .end-call-button {
            width: 80px; height: 80px; border-radius: 40px; background: #ef4444;
            border: none; display: flex; align-items: center; justify-content: center;
            cursor: pointer; transition: transform 0.2s;
        }
        .end-call-button:active { transform: scale(0.9); }
        #error-container {
            position: absolute; top: 20px; left: 20px; right: 20px;
            background: rgba(239, 68, 68, 0.9); padding: 16px; border-radius: 12px; z-index: 20;
        }
        #error-container.hidden { display: none; }
        .error-text { font-size: 14px; text-align: center; }
        .connecting { display: flex; flex-direction: column; align-items: center; gap: 16px; }
        .spinner {
            width: 40px; height: 40px; border: 4px solid rgba(255, 255, 255, 0.3);
            border-top-color: #fff; border-radius: 50%; animation: spin 1s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        canvas { display: none; }
    </style>
</head>
<body>
    <div id="app">
        <div id="video-container">
            <video id="camera-view" autoplay playsinline muted></video>
            <canvas id="canvas"></canvas>
            <div id="overlay">
                <h1 class="title">Gemini Live Stylist</h1>
                <p class="subtitle">Real-time outfit scoring & styling advice</p>
                <button class="start-button" onclick="startSession()">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3zM19 13a1 1 0 0 0-1 1v1a6 6 0 0 1-12 0v-1a1 1 0 1 0-2 0v1a8 8 0 0 0 7 7.93V24h2v-2.07A8 8 0 0 0 20 15v-1a1 1 0 0 0-1-1z"/>
                    </svg>
                    Start Live Session
                </button>
            </div>
            <div id="transcription-container" class="hidden"></div>
        </div>
        <div id="controls" class="hidden">
            <button class="control-button" id="mute-button" onclick="toggleMute()">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="white">
                    <path d="M12 2a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3zM19 13a1 1 0 0 0-1 1v1a6 6 0 0 1-12 0v-1a1 1 0 1 0-2 0v1a8 8 0 0 0 7 7.93V24h2v-2.07A8 8 0 0 0 20 15v-1a1 1 0 0 0-1-1z"/>
                </svg>
            </button>
            <button class="end-call-button" onclick="endSession()">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="white">
                    <path d="M12 9c-1.63 0-3.14.4-4.5 1.12L6.11 8.73a10 10 0 0 1 11.78 0l-1.39 1.39C15.14 9.4 13.63 9 12 9zm7.7 5.07l-2.82 2.82c-4.4 2.2-9.62.47-11.82-3.93-2.2-4.4-.47-9.62 3.93-11.82l2.82-2.82L14.12 3l-2.83 2.83-1.41-1.41L8.47 5.83l1.41 1.41L7.05 10.07l1.41 1.41 2.83-2.83 1.41 1.41-2.83 2.83 1.41 1.41 2.83-2.83 1.41 1.41-2.83 2.83L17 21l1.41-1.41-2.83-2.83 1.41-1.41 2.83 2.83z"/>
                </svg>
            </button>
        </div>
        <div id="error-container" class="hidden">
            <p class="error-text" id="error-text"></p>
        </div>
    </div>
    <script type="module">
        const API_KEY = '${apiKey}';

        let session, mediaStream, inputAudioContext, outputAudioContext;
        let scriptProcessor, mediaStreamSource, frameInterval;
        let isMuted = false;
        let audioPlayback = { nextStartTime: 0, sources: new Set() };

        const CONFIG = {
            // Native audio model for real-time voice conversation
            MODEL: 'gemini-2.5-flash-native-audio-preview-09-2025',
            SYSTEM_INSTRUCTION: \`You are a professional AI stylist and outfit scorer. Help users improve their fashion sense by:
- Analyzing their outfit in real-time through video
- Asking contextual questions about where they're going and the occasion
- Providing friendly, natural feedback like a fashion-savvy buddy
- Using emotions and enthusiasm in your responses
- Giving practical styling tips and suggestions
- Scoring outfits on a scale of 1-10 with detailed reasoning

Be conversational, supportive, and encouraging. Keep responses concise but helpful.
Start by greeting the user and asking them to show you their outfit.\`,
            FRAME_RATE: 1, // 1 fps for video frames
            JPEG_QUALITY: 0.6,
            INPUT_SAMPLE_RATE: 16000,
            OUTPUT_SAMPLE_RATE: 24000,
            VOICE_NAME: 'Zephyr',
        };

        function showError(message) {
            const errorContainer = document.getElementById('error-container');
            const errorText = document.getElementById('error-text');
            errorText.textContent = message;
            errorContainer.classList.remove('hidden');
            setTimeout(() => errorContainer.classList.add('hidden'), 5000);
        }

        function updateTranscription(type, text) {
            const container = document.getElementById('transcription-container');
            container.classList.remove('hidden');
            const existingBox = container.querySelector(\`.transcription-box.\${type}:last-child\`);
            if (existingBox) {
                existingBox.querySelector('.transcription-text').textContent = text;
            } else {
                const box = document.createElement('div');
                box.className = \`transcription-box \${type}\`;
                box.innerHTML = \`<div class="transcription-label \${type}">\${type === 'user' ? 'You' : 'Gemini'}:</div><div class="transcription-text">\${text}</div>\`;
                container.appendChild(box);
                container.scrollTop = container.scrollHeight;
            }
        }

        function encode(bytes) {
            let binary = '';
            for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
            return btoa(binary);
        }

        function decode(base64) {
            const binaryString = atob(base64);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
            return bytes;
        }

        function createAudioBlob(data) {
            const int16 = new Int16Array(data.length);
            for (let i = 0; i < data.length; i++) int16[i] = data[i] * 32768;
            return { data: encode(new Uint8Array(int16.buffer)), mimeType: \`audio/pcm;rate=\${CONFIG.INPUT_SAMPLE_RATE}\` };
        }

        async function decodeAudioData(data, ctx, sampleRate, numChannels) {
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

        async function blobToBase64(blob) {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result.split(',')[1]);
                reader.onerror = reject;
                reader.readAsDataURL(blob);
            });
        }


        window.startSession = async function() {
            try {
                console.log('Starting session...');
                document.getElementById('overlay').innerHTML = '<div class="connecting"><div class="spinner"></div><p>Connecting to Gemini...</p></div>';
                
                // Check if we're in a WebView that might not support getUserMedia
                if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                    throw new Error('Camera/microphone not available. WebView may not support media capture. Please use a web browser for full Gemini Live experience.');
                }
                
                // Request camera/mic with timeout
                console.log('Requesting camera and microphone...');
                let mediaStream_local;
                try {
                    const mediaPromise = navigator.mediaDevices.getUserMedia({ audio: true, video: { facingMode: 'user' } });
                    const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Camera/mic request timed out after 15 seconds')), 15000));
                    mediaStream_local = await Promise.race([mediaPromise, timeoutPromise]);
                } catch (mediaError) {
                    const errorMsg = mediaError.name === 'NotAllowedError' 
                        ? 'Camera/microphone permission denied. Please allow access and try again.'
                        : mediaError.name === 'NotFoundError'
                        ? 'No camera or microphone found on this device.'
                        : mediaError.name === 'NotSupportedError'
                        ? 'Camera/microphone not supported in this WebView. Please use a web browser.'
                        : \`Media error: \${mediaError.name || 'Unknown'} - \${mediaError.message || 'No details'}\`;
                    throw new Error(errorMsg);
                }
                mediaStream = mediaStream_local;
                console.log('Camera and microphone acquired');
                
                const videoElement = document.getElementById('camera-view');
                videoElement.srcObject = mediaStream;
                
                // Ensure video keeps playing and doesn't freeze
                videoElement.onloadedmetadata = () => {
                    videoElement.play().catch(e => console.warn('Video play error:', e));
                };
                
                // Workaround for video freezing - periodically check and restart if needed
                setInterval(() => {
                    if (videoElement.paused || videoElement.ended) {
                        console.log('Video paused/ended, restarting...');
                        videoElement.play().catch(e => console.warn('Video restart error:', e));
                    }
                }, 1000);
                inputAudioContext = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: CONFIG.INPUT_SAMPLE_RATE });
                outputAudioContext = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: CONFIG.OUTPUT_SAMPLE_RATE });
                const outputNode = outputAudioContext.createGain();
                outputNode.connect(outputAudioContext.destination);
                let currentInputTranscription = '', currentOutputTranscription = '';
                
                // Load SDK with timeout
                console.log('Loading Gemini SDK...');
                document.getElementById('overlay').innerHTML = '<div class="connecting"><div class="spinner"></div><p>Loading AI model...</p></div>';
                const sdkPromise = import('https://esm.run/@google/genai');
                const sdkTimeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('SDK loading timed out. Please check your internet connection.')), 30000));
                const { GoogleGenAI, Modality } = await Promise.race([sdkPromise, sdkTimeoutPromise]);
                console.log('Gemini SDK loaded');
                
                // Connect to Gemini Live
                console.log('Connecting to Gemini Live...');
                document.getElementById('overlay').innerHTML = '<div class="connecting"><div class="spinner"></div><p>Establishing live connection...</p></div>';
                const ai = new GoogleGenAI({ apiKey: API_KEY });
                
                const connectTimeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Connection to Gemini timed out. The model may be unavailable.')), 30000));
                const connectPromise = ai.live.connect({
                    model: CONFIG.MODEL,
                    config: {
                        systemInstruction: CONFIG.SYSTEM_INSTRUCTION,
                        responseModalities: [Modality.AUDIO],
                        speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: CONFIG.VOICE_NAME } } },
                        inputAudioTranscription: {},
                        outputAudioTranscription: {},
                    },
                    callbacks: {
                        onopen: () => {
                            console.log('Session opened');
                            document.getElementById('overlay').classList.add('hidden');
                            document.getElementById('controls').classList.remove('hidden');
                            startAudioStreaming();
                            startVideoStreaming();
                        },
                        onmessage: async (message) => {
                            console.log('Message received:', message);
                            if (message.serverContent?.inputTranscription) {
                                currentInputTranscription += message.serverContent.inputTranscription.text;
                                updateTranscription('user', currentInputTranscription);
                            }
                            if (message.serverContent?.outputTranscription) {
                                currentOutputTranscription += message.serverContent.outputTranscription.text;
                                updateTranscription('model', currentOutputTranscription);
                            }
                            if (message.serverContent?.turnComplete) {
                                currentInputTranscription = '';
                                currentOutputTranscription = '';
                            }
                            const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
                            if (base64Audio) await playAudioResponse(base64Audio, outputNode);
                            if (message.serverContent?.interrupted) stopAllAudioSources();
                        },
                        onerror: (e) => { 
                            console.error('Gemini API error:', e);
                            showError(\`API Error: \${e.error?.message || e.message || 'Unknown error'}\`); 
                            endSession(); 
                        },
                        onclose: () => endSession(),
                    },
                });
                
                session = await Promise.race([connectPromise, connectTimeoutPromise]);
                console.log('Gemini Live session established!');
            } catch (error) {
                // Better error serialization for debugging
                const errorDetails = {
                    message: error.message || 'No message',
                    name: error.name || 'Unknown',
                    stack: error.stack || 'No stack',
                    toString: String(error)
                };
                console.error('Session error:', JSON.stringify(errorDetails));
                
                const displayMessage = error.message || error.name || 'Failed to start session. Please try using a web browser for full Gemini Live experience.';
                showError(displayMessage);
                document.getElementById('overlay').innerHTML = \`
                    <h1 class="title">Connection Failed</h1>
                    <p class="subtitle">\${displayMessage}</p>
                    <button class="start-button" onclick="startSession()">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M17.65 6.35A7.958 7.958 0 0012 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08A5.99 5.99 0 0112 18c-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/>
                        </svg>
                        Retry
                    </button>
                \`;
            }
        };

        function startAudioStreaming() {
            const source = inputAudioContext.createMediaStreamSource(mediaStream);
            mediaStreamSource = source;
            scriptProcessor = inputAudioContext.createScriptProcessor(4096, 1, 1);
            scriptProcessor.onaudioprocess = (event) => {
                if (isMuted) return;
                const inputData = event.inputBuffer.getChannelData(0);
                const pcmBlob = createAudioBlob(inputData);
                session?.sendRealtimeInput({ media: pcmBlob });
            };
            source.connect(scriptProcessor);
            scriptProcessor.connect(inputAudioContext.destination);
        }

        function startVideoStreaming() {
            const video = document.getElementById('camera-view');
            const canvas = document.getElementById('canvas');
            
            // Use a separate offscreen canvas to avoid affecting the video display
            const offscreenCanvas = document.createElement('canvas');
            const offscreenCtx = offscreenCanvas.getContext('2d');
            
            frameInterval = setInterval(() => {
                if (video.readyState >= 2 && !video.paused) {
                    // Set canvas size only once or when video dimensions change
                    if (offscreenCanvas.width !== video.videoWidth || offscreenCanvas.height !== video.videoHeight) {
                        offscreenCanvas.width = video.videoWidth;
                        offscreenCanvas.height = video.videoHeight;
                    }
                    
                    // Draw to offscreen canvas (doesn't affect video display)
                    offscreenCtx.drawImage(video, 0, 0);
                    
                    // Convert to blob asynchronously
                    offscreenCanvas.toBlob(async (blob) => {
                        if (blob && session) {
                            try {
                                const base64Data = await blobToBase64(blob);
                                session.sendRealtimeInput({ media: { data: base64Data, mimeType: 'image/jpeg' } });
                            } catch (e) {
                                console.warn('Frame send error:', e);
                            }
                        }
                    }, 'image/jpeg', CONFIG.JPEG_QUALITY);
                }
            }, 1000 / CONFIG.FRAME_RATE);
        }

        async function playAudioResponse(base64Audio, outputNode) {
            console.log('Playing audio...');
            audioPlayback.nextStartTime = Math.max(audioPlayback.nextStartTime, outputAudioContext.currentTime);
            const audioBuffer = await decodeAudioData(decode(base64Audio), outputAudioContext, CONFIG.OUTPUT_SAMPLE_RATE, 1);
            const source = outputAudioContext.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(outputNode);
            source.addEventListener('ended', () => audioPlayback.sources.delete(source));
            source.start(audioPlayback.nextStartTime);
            audioPlayback.nextStartTime += audioBuffer.duration;
            audioPlayback.sources.add(source);
        }

        function stopAllAudioSources() {
            for (const source of audioPlayback.sources.values()) {
                source.stop();
                audioPlayback.sources.delete(source);
            }
            audioPlayback.nextStartTime = 0;
        }

        window.toggleMute = function() {
            isMuted = !isMuted;
            document.getElementById('mute-button').classList.toggle('muted', isMuted);
        };

        window.endSession = function() {
            if (session) session.close();
            if (frameInterval) clearInterval(frameInterval);
            if (scriptProcessor) scriptProcessor.disconnect();
            if (mediaStreamSource) mediaStreamSource.disconnect();
            if (inputAudioContext) inputAudioContext.close();
            if (outputAudioContext) outputAudioContext.close();
            if (mediaStream) mediaStream.getTracks().forEach(track => track.stop());
            stopAllAudioSources();
            document.getElementById('overlay').classList.remove('hidden');
            document.getElementById('controls').classList.add('hidden');
            document.getElementById('transcription-container').classList.add('hidden');
            document.getElementById('transcription-container').innerHTML = '';
            if (window.ReactNativeWebView) {
                window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'close' }));
            }
        };
    </script>
</body>
</html>`;
};
