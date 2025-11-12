/**
 * Manual Test Script for Virtual Try-On
 * 
 * This script can be run manually to test the virtual try-on feature
 * with real images and API calls.
 * 
 * Usage:
 * 1. Update the image paths below
 * 2. Run: npx ts-node VirtualTryOn/__tests__/manual-test.ts
 */

import { generateTryOnImage } from '../services/geminiApiService';
import { GEMINI_API_CONFIG } from '../constants';

// Test configuration
const TEST_CONFIG = {
  // Update these paths to your test images
  userImagePath: '/Users/imtiyazakiwat/Downloads/Documents/imtiyaz/cloth-recemendation/ca496bb6-9a28-5f96-81b5-146fa8303a28.jpg',
  outfitImagePath: '/Users/imtiyazakiwat/Downloads/Documents/imtiyaz/cloth-recemendation/81x2mbPJiBL._AC_UL640_FMwebp_QL65_.webp',
};

async function runManualTest() {
  console.log('🧪 Starting Manual Virtual Try-On Test\n');
  console.log('Configuration:');
  console.log('- API Endpoint:', GEMINI_API_CONFIG.ENDPOINT);
  console.log('- API Key:', GEMINI_API_CONFIG.API_KEY ? '✅ Set' : '❌ Missing');
  console.log('- Timeout:', GEMINI_API_CONFIG.TIMEOUT, 'ms');
  console.log('- User Image:', TEST_CONFIG.userImagePath);
  console.log('- Outfit Image:', TEST_CONFIG.outfitImagePath);
  console.log('\n' + '='.repeat(60) + '\n');

  try {
    console.log('📸 Test 1: Basic Virtual Try-On');
    console.log('Starting generation...');
    const startTime = Date.now();

    const result = await generateTryOnImage(
      `file://${TEST_CONFIG.userImagePath}`,
      `file://${TEST_CONFIG.outfitImagePath}`
    );

    const duration = Date.now() - startTime;

    console.log('\n✅ Test 1 Results:');
    console.log('- Success:', result.success);
    console.log('- Duration:', duration, 'ms');
    console.log('- Image URL:', result.imageUrl || 'N/A');
    console.log('- Error:', result.error || 'None');

    if (result.success && result.imageUrl) {
      console.log('\n✨ Virtual try-on generated successfully!');
      console.log('📁 Saved to:', result.imageUrl);
    } else {
      console.log('\n❌ Virtual try-on failed');
      console.log('Error details:', result.error);
    }

    console.log('\n' + '='.repeat(60) + '\n');

    // Test 2: Error handling with invalid path
    console.log('📸 Test 2: Error Handling (Invalid Path)');
    const errorResult = await generateTryOnImage(
      'file:///invalid/path/user.jpg',
      'file:///invalid/path/outfit.jpg'
    );

    console.log('\n✅ Test 2 Results:');
    console.log('- Success:', errorResult.success);
    console.log('- Error handled:', errorResult.error ? '✅' : '❌');
    console.log('- Error message:', errorResult.error || 'None');

    console.log('\n' + '='.repeat(60) + '\n');

    // Summary
    console.log('📊 Test Summary:');
    console.log('- Test 1 (Basic):', result.success ? '✅ PASSED' : '❌ FAILED');
    console.log('- Test 2 (Error Handling):', !errorResult.success && errorResult.error ? '✅ PASSED' : '❌ FAILED');
    console.log('\n🎉 Manual testing complete!\n');

  } catch (error: any) {
    console.error('\n❌ Test failed with exception:');
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

// Run the test
if (require.main === module) {
  runManualTest()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

export { runManualTest };
