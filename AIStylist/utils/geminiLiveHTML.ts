/**
 * Gemini Live HTML for WebView
 * Embedded HTML page for mobile platforms
 */

export const getGeminiLiveHTML = (apiKey: string) => `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>Gemini Live Stylist</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #000;
            color: #fff;
            overflow: hidden;
            height: 100vh;
            width: 100vw;
        }
        #app { width: 100%; height: 100%; display: flex; flex-direction: column; position: relative; }
        #video-container { flex: 1; position: relative; background: #000; }
        #camera-view { width: 100%; height: 100%; object-fit: cover; transform: scaleX(-1); }
        #overlay {
            position: absolute; top: 0; left: 0; right: 0; bottom: 0;
            background: rgba(0, 0, 0, 0.7);
            display: flex; flex-direction: column; align-items: center; justify-content: center;
            padding: 20px;
        }
        #overlay.hidden { display: none; }
        .title { font-size: 28px; font-weight: bold; margin-bottom: 8px; text-align: center; }
        .subtitle { font-size: 14px; color: #ccc; margin-bottom: 24px; text-align: center; }
        .start-button {
            display: flex; align-items: center; gap: 12px;
            background: #6366f1; padding: 14px 28px; border-radius: 30px;
            border: none; color: white; font-size: 16px; font-weight: 600;
            cursor: pointer; transition: transform 0.2s;
        }
        .start-button:active { transform: scale(0.95); }
        #transcription-container {
            position: absolute; bottom: 80px; left: 0; right: 0;
            padding: 12px; max-height: 35%; overflow-y: auto;
        }
        .transcription-box {
            background: rgba(0, 0, 0, 0.7);
            padding: 10px; border-radius: 10px; margin-bottom: 6px;
            backdrop-filter: blur(10px);
        }
        .transcription-box.model { background: rgba(99, 102, 241, 0.4); }
        .transcription-label { font-size: 12px; font-weight: 600; margin-bottom: 3px; }
        .transcription-label.user { color: #60a5fa; }
        .transcription-label.model { color: #a78bfa; }
        .transcription-text { font-size: 14px; line-height: 20px; }
        #controls {
            position: absolute; bottom: 15px; left: 50%; transform: translateX(-50%);
            display: flex; align-items: center; gap: 20px; z-index: 10;
        }
        #controls.hidden { display: none; }
        .control-button {
            width: 56px; height: 56px; border-radius: 28px;
            background: rgba(107, 114, 128, 0.8); border: none;
            display: flex; align-items: center; justify-content: center;
            cursor: pointer; transition: transform 0.2s;
        }
        .control-button:active { transform: scale(0.9); }
        .control-button.muted { background: rgba(251, 191, 36, 0.8); }
        .end-call-button {
            width: 70px; height: 70px; border-radius: 35px;
            background: #ef4444; border: none;
            display: flex; align-items: center; justify-content: center;
            cursor: pointer; transition: transform 0.2s;
        }
        .end-call-button:active { transform: scale(0.9); }
        #error-container {
            position: absolute; top: 15px; left: 15px; right: 15px;
            background: rgba(239, 68, 68, 0.9); padding: 12px; border-radius: 10px; z-index: 20;
        }
        #error-container.hidden { display: none; }
        .error-text { font-size: 13px; text-align: center; }
        .connecting { display: flex; flex-direction: column; align-items: center; gap: 12px; }
        .spinner {
            width: 35px; height: 35px;
            border: 3px solid rgba(255, 255, 255, 0.3);
            border-top-color: #fff; border-radius: 50%;
            animation: spin 1s linear infinite;
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
                <h1 class="title">🎨 AI Stylist Live</h1>
                <p class="subtitle">Real-time outfit analysis & styling advice</p>
                <button class="start-button" onclick="startSession()">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"/>
                        <path d="M19 13a1 1 0 0 0-1 1v1a6 6 0 0 1-12 0v-1a1 1 0 1 0-2 0v1a8 8 0 0 0 7 7.93V24h2v-2.07A8 8 0 0 0 20 15v-1a1 1 0 0 0-1-1z"/>
                    </svg>
                    Start Session
                </button>
            </div>
            <div id="transcription-container" class="hidden"></div>
        </div>
        <div id="controls" class="hidden">
            <button class="control-button" id="mute-button" onclick="toggleMute()">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                    <path d="M12 2a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"/>
                    <path d="M19 13a1 1 0 0 0-1 1v1a6 6 0 0 1-12 0v-1a1 1 0 1 0-2 0v1a8 8 0 0 0 7 7.93V24h2v-2.07A8 8 0 0 0 20 15v-1a1 1 0 0 0-1-1z"/>
                </svg>
            </button>
            <button class="end-call-button" onclick="endSession()">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="white">
                    <path d="M12 9c-1.6 0-3.1.4-4.5 1.1L6.1 8.7a10 10 0 0 1 11.8 0l-1.4 1.4C15.1 9.4 13.6 9 12 9z"/>
                    <path d="M19.7 14.1l-2.8 2.8c-4.4 2.2-9.6.5-11.8-3.9s-.5-9.6 3.9-11.8l2.8-2.8L14.1 3l-2.8 2.8-1.4-1.4L8.5 5.8l1.4 1.4L7.1 10l1.4 1.4 2.8-2.8 1.4 1.4-2.8 2.8 1.4 1.4 2.8-2.8 1.4 1.4-2.8 2.8L17 21l1.4-1.4-2.8-2.8 1.4-1.4 2.8 2.8z"/>
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
            MODEL: 'gemini-2.5-flash-native-audio-preview-09-2025',
            SYSTEM_INSTRUCTION: \`You are a professional AI stylist. Analyze outfits in real-time, ask about occasions, give friendly fashion advice, and score outfits 1-10. Be conversational and encouraging.\`,
            FRAME_RATE: 2, JPEG_QUALITY: 0.7,
            INPUT_SAMPLE_RATE: 16000, OUTPUT_SAMPLE_RATE: 24000,
            VOICE_NAME: 'Zephyr',
        };

        function showError(msg) {
            document.getElementById('error-text').textContent = msg;
            document.getElementById('error-container').classList.remove('hidden');
            setTimeout(() => document.getElementById('error-container').classList.add('hidden'), 5000);
        }

        function updateTranscription(type, text) {
            const container = document.getElementById('transcription-container');
            container.classList.remove('hidden');
            let box = container.querySelector(\`.transcription-box.\${type}:last-child\`);
            if (box) {
                box.querySelector('.transcription-text').textContent = text;
            } else {
                box = document.createElement('div');
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
                document.getElementById('overlay').innerHTML = '<div class="connecting"><div class="spinner"></div><p>Connecting...</p></div>';
                
                // Request permissions first
                console.log('Requesting media permissions...');
                mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: { facingMode: 'user' } });
                console.log('Media stream obtained');
                document.getElementById('camera-view').srcObject = mediaStream;

                console.log('Creating audio contexts...');
                inputAudioContext = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: CONFIG.INPUT_SAMPLE_RATE });
                outputAudioContext = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: CONFIG.OUTPUT_SAMPLE_RATE });
                const outputNode = outputAudioContext.createGain();
                outputNode.connect(outputAudioContext.destination);

                let currentInputTranscription = '', currentOutputTranscription = '';

                console.log('Loading Gemini SDK...');
                // Try multiple CDN sources
                let GoogleGenAI, Modality;
                try {
                    const module = await import('https://esm.run/@google/genai@1.29.0');
                    GoogleGenAI = module.GoogleGenAI;
                    Modality = module.Modality;
                } catch (e) {
                    console.error('Failed to load from esm.run, trying unpkg...', e);
                    const module = await import('https://unpkg.com/@google/genai@1.29.0/dist/index.mjs');
                    GoogleGenAI = module.GoogleGenAI;
                    Modality = module.Modality;
                }
                
                console.log('Gemini SDK loaded, creating AI instance...');
                const ai = new GoogleGenAI({ apiKey: API_KEY });

                session = await ai.live.connect({
                    model: CONFIG.MODEL,
                    config: {
                        systemInstruction: CONFIG.SYSTEM_INSTRUCTION,
                        responseModalities: [Modality.AUDIO],
                        speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: CONFIG.VOICE_NAME } } },
                        inputAudioTranscription: {}, outputAudioTranscription: {},
                    },
                    callbacks: {
                        onopen: () => {
                            document.getElementById('overlay').classList.add('hidden');
                            document.getElementById('controls').classList.remove('hidden');
                            startAudioStreaming();
                            startVideoStreaming();
                        },
                        onmessage: async (msg) => {
                            if (msg.serverContent?.inputTranscription) {
                                currentInputTranscription += msg.serverContent.inputTranscription.text;
                                updateTranscription('user', currentInputTranscription);
                            }
                            if (msg.serverContent?.outputTranscription) {
                                currentOutputTranscription += msg.serverContent.outputTranscription.text;
                                updateTranscription('model', currentOutputTranscription);
                            }
                            if (msg.serverContent?.turnComplete) {
                                currentInputTranscription = '';
                                currentOutputTranscription = '';
                            }
                            const base64Audio = msg.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
                            if (base64Audio) await playAudioResponse(base64Audio, outputNode);
                            if (msg.serverContent?.interrupted) stopAllAudioSources();
                        },
                        onerror: (e) => { showError(\`Error: \${e.error?.message || e.message}\`); endSession(); },
                        onclose: () => endSession(),
                    },
                });
            } catch (error) {
                console.error('Session start error:', error);
                const errorMsg = error.message || 'Failed to start session';
                showError(errorMsg);
                document.getElementById('overlay').classList.remove('hidden');
                
                // Send error to React Native
                if (window.ReactNativeWebView) {
                    window.ReactNativeWebView.postMessage(JSON.stringify({ 
                        type: 'error', 
                        message: errorMsg,
                        stack: error.stack 
                    }));
                }
            }
        };

        function startAudioStreaming() {
            const source = inputAudioContext.createMediaStreamSource(mediaStream);
            mediaStreamSource = source;
            scriptProcessor = inputAudioContext.createScriptProcessor(4096, 1, 1);
            scriptProcessor.onaudioprocess = (event) => {
                if (isMuted) return;
                const inputData = event.inputBuffer.getChannelData(0);
                session?.sendRealtimeInput({ media: createAudioBlob(inputData) });
            };
            source.connect(scriptProcessor);
            scriptProcessor.connect(inputAudioContext.destination);
        }

        function startVideoStreaming() {
            const video = document.getElementById('camera-view');
            const canvas = document.getElementById('canvas');
            frameInterval = setInterval(() => {
                if (video.readyState >= 2) {
                    const ctx = canvas.getContext('2d');
                    canvas.width = video.videoWidth;
                    canvas.height = video.videoHeight;
                    ctx.drawImage(video, 0, 0);
                    canvas.toBlob(async (blob) => {
                        if (blob) {
                            const base64Data = await blobToBase64(blob);
                            session?.sendRealtimeInput({ media: { data: base64Data, mimeType: 'image/jpeg' } });
                        }
                    }, 'image/jpeg', CONFIG.JPEG_QUALITY);
                }
            }, 1000 / CONFIG.FRAME_RATE);
        }

        async function playAudioResponse(base64Audio, outputNode) {
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
</html>
`;
