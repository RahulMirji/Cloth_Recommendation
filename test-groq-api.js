// Quick test script to verify Groq API key and test STT
require('dotenv').config({ path: '.env' });

const API_KEY = process.env.EXPO_PUBLIC_WISPHERE_API_KEY;

console.log('🔑 Testing Groq API Configuration...\n');
console.log('API Key exists:', !!API_KEY);
console.log('API Key preview:', API_KEY ? `${API_KEY.substring(0, 10)}...${API_KEY.slice(-4)}` : 'NOT FOUND');
console.log('API Key length:', API_KEY ? API_KEY.length : 0);
console.log('\n✅ If you see "gsk_..." above, the API key is loaded correctly!');
console.log('📝 Next: Restart your Expo app to reload environment variables\n');

// Test API connection
if (API_KEY) {
  console.log('🧪 Testing API connection...\n');
  
  fetch('https://api.groq.com/openai/v1/models', {
    headers: {
      'Authorization': `Bearer ${API_KEY}`
    }
  })
  .then(res => res.json())
  .then(data => {
    if (data.data) {
      console.log('✅ API Connection Successful!');
      console.log('📊 Available models:', data.data.length);
      
      const whisperModels = data.data.filter(m => m.id.includes('whisper'));
      console.log('\n🎤 Whisper Models Available:');
      whisperModels.forEach(model => {
        console.log(`  - ${model.id}`);
      });
      
      console.log('\n✅ Everything is configured correctly!');
      console.log('🚀 You can now test STT in your app\n');
    } else {
      console.error('❌ Unexpected API response:', data);
    }
  })
  .catch(err => {
    console.error('❌ API Connection Failed:', err.message);
    console.log('\n💡 Possible issues:');
    console.log('  1. Invalid API key');
    console.log('  2. Network connection issue');
    console.log('  3. API endpoint changed\n');
  });
} else {
  console.error('\n❌ No API key found in .env file!');
  console.log('💡 Make sure EXPO_PUBLIC_WISPHERE_API_KEY is set in your .env file\n');
}
