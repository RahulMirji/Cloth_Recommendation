/**
 * Simplified Gemini Live HTML for WebView
 * Uses REST API instead of SDK to avoid import issues
 */

export const getGeminiLiveHTMLSimple = (apiKey: string) => `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>Gemini Live Stylist</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        html, body {
            margin: 0;
            padding: 0;
            width: 100%;
            height: 100%;
        }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #1a1a1a;
            color: #fff;
            overflow: hidden;
        }
        #app { 
            width: 100%; 
            height: 100%; 
            min-height: 100vh;
            display: flex; 
            flex-direction: column; 
            position: relative; 
        }
        #video-container { 
            flex: 1; 
            position: relative; 
            background: #000;
            min-height: 400px;
        }
        #camera-view { width: 100%; height: 100%; object-fit: cover; transform: scaleX(-1); }
        #overlay {
            position: absolute; top: 0; left: 0; right: 0; bottom: 0;
            background: rgba(0, 0, 0, 0.8);
            display: flex; flex-direction: column; align-items: center; justify-content: center;
            padding: 20px;
        }
        #overlay.hidden { display: none; }
        .title { font-size: 28px; font-weight: bold; margin-bottom: 8px; text-align: center; }
        .subtitle { font-size: 14px; color: #ccc; margin-bottom: 24px; text-align: center; max-width: 300px; line-height: 1.5; }
        .start-button {
            display: flex; align-items: center; gap: 12px;
            background: #6366f1; padding: 14px 28px; border-radius: 30px;
            border: none; color: white; font-size: 16px; font-weight: 600;
            cursor: pointer; transition: transform 0.2s;
        }
        .start-button:active { transform: scale(0.95); }
        #error-container {
            position: absolute; top: 15px; left: 15px; right: 15px;
            background: rgba(239, 68, 68, 0.95); padding: 12px; border-radius: 10px; z-index: 20;
        }
        #error-container.hidden { display: none; }
        .error-text { font-size: 13px; text-align: center; line-height: 1.4; }
        .connecting { display: flex; flex-direction: column; align-items: center; gap: 12px; }
        .spinner {
            width: 35px; height: 35px;
            border: 3px solid rgba(255, 255, 255, 0.3);
            border-top-color: #fff; border-radius: 50%;
            animation: spin 1s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        .info-text {
            font-size: 12px;
            color: #aaa;
            text-align: center;
            margin-top: 16px;
            max-width: 280px;
            line-height: 1.4;
        }
    </style>
</head>
<body>
    <div id="app">
        <div id="video-container">
            <video id="camera-view" autoplay playsinline muted></video>
            <div id="overlay">
                <div style="background: red; padding: 10px; margin-bottom: 20px; border-radius: 8px;">
                    <p style="color: white; font-weight: bold;">🔴 TEST: If you see this, HTML is rendering!</p>
                </div>
                <h1 class="title">🎨 AI Stylist Live</h1>
                <p class="subtitle">
                    This feature requires the Gemini Live API which works best on web browsers.
                </p>
                <button class="start-button" onclick="checkCompatibility()">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"/>
                        <path d="M19 13a1 1 0 0 0-1 1v1a6 6 0 0 1-12 0v-1a1 1 0 1 0-2 0v1a8 8 0 0 0 7 7.93V24h2v-2.07A8 8 0 0 0 20 15v-1a1 1 0 0 0-1-1z"/>
                    </svg>
                    Check Compatibility
                </button>
                <p class="info-text">
                    For the best experience, please use this feature in a web browser like Chrome or Safari.
                </p>
            </div>
        </div>
        <div id="error-container" class="hidden">
            <p class="error-text" id="error-text"></p>
        </div>
    </div>
    <script>
        // Immediate logging to verify script is running
        console.log('🚀 Script started!');
        console.log('📱 Window loaded');
        
        const API_KEY = '${apiKey}';
        console.log('🔑 API Key loaded:', API_KEY ? 'YES' : 'NO');

        // Send ready message to React Native
        if (window.ReactNativeWebView) {
            window.ReactNativeWebView.postMessage(JSON.stringify({ 
                type: 'ready',
                message: 'WebView JavaScript is running'
            }));
            console.log('📨 Sent ready message to React Native');
        } else {
            console.log('⚠️ ReactNativeWebView not available');
        }

        function showError(msg) {
            console.error('Error:', msg);
            document.getElementById('error-text').textContent = msg;
            document.getElementById('error-container').classList.remove('hidden');
            setTimeout(() => document.getElementById('error-container').classList.add('hidden'), 8000);
            
            // Send error to React Native
            if (window.ReactNativeWebView) {
                window.ReactNativeWebView.postMessage(JSON.stringify({ 
                    type: 'error', 
                    message: msg
                }));
            }
        }

        async function checkCompatibility() {
            console.log('Checking compatibility...');
            document.getElementById('overlay').innerHTML = '<div class="connecting"><div class="spinner"></div><p>Checking compatibility...</p></div>';

            try {
                // Check for required APIs
                const checks = {
                    'MediaDevices API': !!navigator.mediaDevices,
                    'getUserMedia': !!navigator.mediaDevices?.getUserMedia,
                    'AudioContext': !!(window.AudioContext || window.webkitAudioContext),
                    'Dynamic Import': typeof import === 'function',
                };

                console.log('Compatibility checks:', checks);

                const missing = Object.entries(checks)
                    .filter(([_, supported]) => !supported)
                    .map(([name]) => name);

                if (missing.length > 0) {
                    throw new Error(\`Missing required features: \${missing.join(', ')}. Please use a modern web browser.\`);
                }

                // Try to get camera/mic access
                console.log('Requesting camera and microphone access...');
                const stream = await navigator.mediaDevices.getUserMedia({ 
                    audio: true, 
                    video: { facingMode: 'user' } 
                });
                
                console.log('Media access granted!');
                document.getElementById('camera-view').srcObject = stream;

                // Show success message
                document.getElementById('overlay').innerHTML = \`
                    <div style="text-align: center;">
                        <div style="font-size: 48px; margin-bottom: 16px;">✅</div>
                        <h2 style="font-size: 24px; margin-bottom: 12px;">Camera & Mic Ready!</h2>
                        <p style="font-size: 14px; color: #ccc; margin-bottom: 24px; max-width: 300px;">
                            However, the full Gemini Live API requires additional browser features that work best on desktop web browsers.
                        </p>
                        <p style="font-size: 14px; color: #fbbf24; margin-bottom: 24px; max-width: 300px;">
                            For the complete real-time AI conversation experience, please open this app in Chrome, Safari, or Firefox on your computer.
                        </p>
                        <button class="start-button" onclick="openInBrowser()" style="background: #10b981;">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                            </svg>
                            Use Standard Mode Instead
                        </button>
                    </div>
                \`;

                // Stop the stream after showing success
                setTimeout(() => {
                    stream.getTracks().forEach(track => track.stop());
                }, 3000);

            } catch (error) {
                console.error('Compatibility check failed:', error);
                let errorMsg = error.message || 'Compatibility check failed';
                
                if (error.name === 'NotAllowedError') {
                    errorMsg = 'Camera and microphone access denied. Please grant permissions in your device settings.';
                } else if (error.name === 'NotFoundError') {
                    errorMsg = 'No camera or microphone found on this device.';
                } else if (error.name === 'NotSupportedError') {
                    errorMsg = 'Your browser does not support the required features. Please use a modern web browser.';
                }

                showError(errorMsg);
                
                // Show fallback UI
                document.getElementById('overlay').innerHTML = \`
                    <div style="text-align: center;">
                        <div style="font-size: 48px; margin-bottom: 16px;">⚠️</div>
                        <h2 style="font-size: 20px; margin-bottom: 12px; color: #fbbf24;">Limited Support</h2>
                        <p style="font-size: 14px; color: #ccc; margin-bottom: 24px; max-width: 300px;">
                            \${errorMsg}
                        </p>
                        <button class="start-button" onclick="openInBrowser()">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M19 19H5V5h7V3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z"/>
                            </svg>
                            Go Back
                        </button>
                    </div>
                \`;
            }
        }

        function openInBrowser() {
            // Close WebView and return to standard mode
            if (window.ReactNativeWebView) {
                window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'close' }));
            }
        }

        // Log environment info
        console.log('User Agent:', navigator.userAgent);
        console.log('Platform:', navigator.platform);
        console.log('API Key present:', !!API_KEY);
    </script>
</body>
</html>
`;
