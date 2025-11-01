/**
 * Jest Setup File for Backend Tests
 * 
 * Sets up test environment variables and mocks
 */

// Set up test environment variables FIRST before any imports
process.env.NODE_ENV = 'test';
process.env.RAZORPAY_KEY_ID = 'rzp_test_key_id_12345';
process.env.RAZORPAY_KEY_SECRET = 'test_secret_key_12345';
process.env.SUPABASE_URL = 'https://test-project.supabase.co';
process.env.SUPABASE_ANON_KEY = 'test_anon_key_12345';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test_service_role_key_12345';
process.env.PORT = '3000';

// Global test timeout
jest.setTimeout(10000);

// Mock console.log to reduce test output noise (optional)
// global.console = {
//   ...console,
//   log: jest.fn(),
//   error: jest.fn(),
// };
