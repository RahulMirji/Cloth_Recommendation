// Test if environment variables are accessible
console.log('\n🔍 Environment Variable Test\n');
console.log('EXPO_PUBLIC_WISPHERE_API_KEY:', process.env.EXPO_PUBLIC_WISPHERE_API_KEY ? `${process.env.EXPO_PUBLIC_WISPHERE_API_KEY.substring(0,10)}...` : 'NOT FOUND');
console.log('EXPO_PUBLIC_GEMINI_API_KEY:', process.env.EXPO_PUBLIC_GEMINI_API_KEY ? `${process.env.EXPO_PUBLIC_GEMINI_API_KEY.substring(0,10)}...` : 'NOT FOUND');
console.log('\n✅ If you see keys above, environment is working!\n');
