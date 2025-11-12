/**
 * Test script to verify Gemini API key
 * Run: node test-gemini-key.js
 */

require('dotenv').config();

const API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
const ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-lite-latest:generateContent';

console.log('\n🔍 Testing Gemini API Key...\n');
console.log('API Key (first 20 chars):', API_KEY ? API_KEY.substring(0, 20) + '...' : '❌ NOT FOUND');
console.log('Endpoint:', ENDPOINT);
console.log('\n');

if (!API_KEY) {
  console.error('❌ EXPO_PUBLIC_GEMINI_API_KEY not found in .env file');
  process.exit(1);
}

const testPrompt = {
  contents: [{
    parts: [{ text: "Say 'Hello, API is working!' in exactly those words." }]
  }]
};

const url = `${ENDPOINT}?key=${API_KEY}`;

console.log('📤 Sending test request...\n');

fetch(url, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(testPrompt),
})
  .then(async response => {
    console.log('📊 Response Status:', response.status, response.statusText);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('\n❌ API Error Response:');
      console.error(JSON.parse(errorText));
      
      const error = JSON.parse(errorText).error;
      
      console.log('\n🔍 Error Analysis:');
      if (error.code === 403) {
        console.log('   Issue: API key is blocked/leaked');
        console.log('   Solution: Create a NEW key from a DIFFERENT Google account');
      } else if (error.code === 400 && error.message.includes('expired')) {
        console.log('   Issue: API key expired or invalid');
        console.log('   Solution: Create a brand new API key');
      } else if (error.code === 403 && error.message.includes('billing')) {
        console.log('   Issue: Billing not enabled');
        console.log('   Solution: Enable billing in Google Cloud Console');
      } else {
        console.log('   Issue:', error.message);
      }
      
      process.exit(1);
    }
    
    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    console.log('\n✅ API Response:');
    console.log('   ', text);
    console.log('\n✅ SUCCESS! Your Gemini API key is working correctly.\n');
  })
  .catch(error => {
    console.error('\n❌ Network Error:', error.message);
    console.log('\n💡 Check your internet connection and try again.\n');
    process.exit(1);
  });
