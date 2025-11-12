/**
 * Gemini Live JavaScript for injection into WebView
 * This script will be injected after the HTML loads
 */

export const getGeminiLiveScript = (apiKey: string) => `
(function() {
    console.log('🚀 Gemini Live script started!');
    
    const API_KEY = '${apiKey}';
    console.log('🔑 API Key present:', !!API_KEY);

    // Send ready message
    if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify({ 
            type: 'ready',
            message: 'Gemini Live is ready'
        }));
        console.log('📨 Sent ready message');
    }

    function showError(msg) {
        console.error('❌ Error:', msg);
        const errorContainer = document.getElementById('error-container');
        const errorText = document.getElementById('error-text');
        if (errorContainer && errorText) {
            errorText.textContent = msg;
            errorContainer.classList.remove('hidden');
            setTimeout(() => errorContainer.classList.add('hidden'), 8000);
        }
        
        if (window.ReactNativeWebView) {
            window.ReactNativeWebView.postMessage(JSON.stringify({ 
                type: 'error', 
                message: msg
            }));
        }
    }

    async function checkCompatibility() {
        console.log('🔍 Checking compatibility...');
        const overlay = document.getElementById('overlay');
        if (overlay) {
            overlay.innerHTML = '<div class="connecting"><div class="spinner"></div><p>Checking compatibility...</p></div>';
        }

        try {
            // Check for required APIs
            const checks = {
                'MediaDevices API': !!navigator.mediaDevices,
                'getUserMedia': !!navigator.mediaDevices?.getUserMedia,
                'AudioContext': !!(window.AudioContext || window.webkitAudioContext),
            };

            console.log('✅ Compatibility checks:', checks);

            const missing = Object.entries(checks)
                .filter(([_, supported]) => !supported)
                .map(([name]) => name);

            if (missing.length > 0) {
                throw new Error(\`Missing required features: \${missing.join(', ')}. Please use a modern web browser.\`);
            }

            // Try to get camera/mic access
            console.log('📷 Requesting camera and microphone access...');
            const stream = await navigator.mediaDevices.getUserMedia({ 
                audio: true, 
                video: { facingMode: 'user' } 
            });
            
            console.log('✅ Media access granted!');
            const video = document.getElementById('camera-view');
            if (video) {
                video.srcObject = stream;
            }

            // Show success message
            if (overlay) {
                overlay.innerHTML = \`
                    <div style="text-align: center;">
                        <div style="font-size: 48px; margin-bottom: 16px;">✅</div>
                        <h2 style="font-size: 24px; margin-bottom: 12px; color: #fff;">Camera & Mic Ready!</h2>
                        <p style="font-size: 14px; color: #ccc; margin-bottom: 24px; max-width: 300px;">
                            However, the full Gemini Live API requires additional browser features that work best on desktop web browsers.
                        </p>
                        <p style="font-size: 14px; color: #fbbf24; margin-bottom: 24px; max-width: 300px;">
                            For the complete real-time AI conversation experience, please open this app in Chrome, Safari, or Firefox on your computer.
                        </p>
                        <button class="start-button" onclick="window.goBack()" style="background: #10b981;">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                            </svg>
                            Use Standard Mode Instead
                        </button>
                    </div>
                \`;
            }

            // Stop the stream after showing success
            setTimeout(() => {
                stream.getTracks().forEach(track => track.stop());
            }, 3000);

        } catch (error) {
            console.error('❌ Compatibility check failed:', error);
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
            if (overlay) {
                overlay.innerHTML = \`
                    <div style="text-align: center;">
                        <div style="font-size: 48px; margin-bottom: 16px;">⚠️</div>
                        <h2 style="font-size: 20px; margin-bottom: 12px; color: #fbbf24;">Limited Support</h2>
                        <p style="font-size: 14px; color: #ccc; margin-bottom: 24px; max-width: 300px;">
                            \${errorMsg}
                        </p>
                        <button class="start-button" onclick="window.goBack()">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M19 19H5V5h7V3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z"/>
                            </svg>
                            Go Back
                        </button>
                    </div>
                \`;
            }
        }
    }

    // Make functions available globally
    window.checkCompatibility = checkCompatibility;
    window.goBack = function() {
        console.log('🚪 Going back...');
        if (window.ReactNativeWebView) {
            window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'close' }));
        }
    };

    // Log environment info
    console.log('📱 User Agent:', navigator.userAgent);
    console.log('🌐 Platform:', navigator.platform);
    
    console.log('✅ Gemini Live script initialization complete');
})();
true; // Required for injectedJavaScript
`;
