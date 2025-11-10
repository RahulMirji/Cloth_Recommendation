// Test different Gemini Live API model names
const WebSocket = require('ws');
require('dotenv').config();

const API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;

if (!API_KEY) {
  console.error('❌ EXPO_PUBLIC_GEMINI_API_KEY not found in environment');
  process.exit(1);
}

const modelsToTest = [
  'models/gemini-2.0-flash-exp',
  'models/gemini-exp-1206',
  'models/gemini-1.5-flash',
  'models/gemini-1.5-flash-latest',
  'models/gemini-1.5-pro',
  'models/gemini-pro',
];

async function testModel(modelName) {
  return new Promise((resolve) => {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`Testing model: ${modelName}`);
    console.log('='.repeat(60));

    const wsUrl = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent?key=${API_KEY}`;
    
    const ws = new WebSocket(wsUrl);
    let timeout;

    ws.on('open', () => {
      console.log('✅ WebSocket connected');
      
      const setupMessage = {
        setup: {
          model: modelName,
          generationConfig: {
            responseModalities: ['AUDIO'],
          },
        },
      };
      
      console.log('📤 Sending setup message...');
      ws.send(JSON.stringify(setupMessage));

      // Timeout after 5 seconds
      timeout = setTimeout(() => {
        console.log('⏱️  Timeout - no response received');
        ws.close();
        resolve({ model: modelName, success: false, reason: 'timeout' });
      }, 5000);
    });

    ws.on('message', (data) => {
      clearTimeout(timeout);
      const message = JSON.parse(data.toString());
      console.log('📨 Received:', JSON.stringify(message, null, 2));
      
      if (message.setupComplete) {
        console.log(`✅ SUCCESS: ${modelName} is VALID!`);
        ws.close();
        resolve({ model: modelName, success: true });
      } else if (message.error) {
        console.log(`❌ ERROR: ${message.error.message}`);
        ws.close();
        resolve({ model: modelName, success: false, reason: message.error.message });
      }
    });

    ws.on('error', (error) => {
      clearTimeout(timeout);
      console.error('❌ WebSocket error:', error.message);
      resolve({ model: modelName, success: false, reason: error.message });
    });

    ws.on('close', (code, reason) => {
      clearTimeout(timeout);
      if (code !== 1000) {
        console.log(`❌ Connection closed - Code: ${code}, Reason: ${reason.toString()}`);
        resolve({ model: modelName, success: false, reason: reason.toString() });
      }
    });
  });
}

async function runTests() {
  console.log('🧪 Testing Gemini Live API Model Names');
  console.log('API Key loaded:', API_KEY ? '✅' : '❌');
  console.log('');

  const results = [];
  
  for (const modelName of modelsToTest) {
    const result = await testModel(modelName);
    results.push(result);
    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1s between tests
  }

  console.log('\n' + '='.repeat(60));
  console.log('📊 TEST RESULTS SUMMARY');
  console.log('='.repeat(60));
  
  results.forEach(result => {
    const status = result.success ? '✅ VALID' : '❌ INVALID';
    console.log(`${status}: ${result.model}`);
    if (!result.success && result.reason) {
      console.log(`   Reason: ${result.reason}`);
    }
  });

  const validModels = results.filter(r => r.success);
  if (validModels.length > 0) {
    console.log('\n✅ Valid models found:');
    validModels.forEach(r => console.log(`   - ${r.model}`));
  } else {
    console.log('\n❌ No valid models found');
  }
}

runTests().catch(console.error);
