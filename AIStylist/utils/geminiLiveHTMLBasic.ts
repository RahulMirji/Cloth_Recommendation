/**
 * Basic Gemini Live HTML for WebView
 * Minimal HTML - JavaScript will be injected
 */

export const getGeminiLiveHTMLBasic = () => `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>Gemini Live Stylist</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        html, body { margin: 0; padding: 0; width: 100%; height: 100%; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #1a1a1a;
            color: #fff;
            overflow: hidden;
        }
        #app { width: 100%; height: 100%; min-height: 100vh; display: flex; flex-direction: column; position: relative; }
        #video-container { flex: 1; position: relative; background: #000; min-height: 400px; }
        #camera-view { width: 100%; height: 100%; object-fit: cover; transform: scaleX(-1); }
        #overlay {
            position: absolute; top: 0; left: 0; right: 0; bottom: 0;
            background: rgba(0, 0, 0, 0.8);
            display: flex; flex-direction: column; align-items: center; justify-content: center;
            padding: 20px;
        }
        #overlay.hidden { display: none; }
        .title { font-size: 28px; font-weight: bold; margin-bottom: 8px; text-align: center; color: #fff; }
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
        .error-text { font-size: 13px; text-align: center; line-height: 1.4; color: #fff; }
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
                <div class="connecting">
                    <div class="spinner"></div>
                    <p style="margin-top: 12px;">Checking compatibility...</p>
                </div>
            </div>
        </div>
        <div id="error-container" class="hidden">
            <p class="error-text" id="error-text"></p>
        </div>
    </div>
</body>
</html>
`;
