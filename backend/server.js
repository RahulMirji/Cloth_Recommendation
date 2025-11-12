/**
 * ============================================================================
 * Minimal Express Backend for Razorpay Payment Integration
 * ============================================================================
 * 
 * Purpose: Handle Razorpay payment processing only
 * - All other functionality remains in Supabase (auth, database, storage)
 * - This server ONLY manages payment creation, verification, and webhooks
 * 
 * File: backend/server.js
 * Created: November 1, 2025
 * Author: Rahul Mirji
 * 
 * ============================================================================
 */

// Load environment variables
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

// Debug: Check environment variables
console.log('🔍 DEBUG: Environment variables loaded');
console.log('🔍 SUPABASE_URL length:', process.env.SUPABASE_URL?.length || 0);
console.log('🔍 SUPABASE_SERVICE_ROLE_KEY length:', process.env.SUPABASE_SERVICE_ROLE_KEY?.length || 0);
console.log('🔍 SUPABASE_SERVICE_ROLE_KEY first 50 chars:', process.env.SUPABASE_SERVICE_ROLE_KEY?.substring(0, 50) || 'MISSING');

const express = require('express');
const cors = require('cors');

// Import Razorpay routes
const razorpayRoutes = require('./Razorpay');

// Initialize Express app
const app = express();

// Configuration
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// ============================================================================
// Middleware
// ============================================================================

// Enable CORS for React Native app
app.use(cors({
  origin: '*', // In production, specify your frontend URL
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Parse JSON request bodies
app.use(express.json());

// Parse URL-encoded request bodies
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path}`);
  next();
});

// ============================================================================
// Routes
// ============================================================================

// Health check endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Style GPT Backend - Payment Server',
    status: 'running',
    timestamp: new Date().toISOString(),
    environment: NODE_ENV,
    endpoints: {
      razorpay: '/api/razorpay',
      health: '/health',
    },
  });
});

// Health check endpoint (alternative)
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// Mount Razorpay routes
app.use('/api/razorpay', razorpayRoutes.routes);

// ============================================================================
// Error Handling
// ============================================================================

// 404 handler - Route not found
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.path,
    availableRoutes: [
      'GET /',
      'GET /health',
      'POST /api/razorpay/create-order',
      'POST /api/razorpay/verify-payment',
      'GET /api/razorpay/payment-status/:orderId',
    ],
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('❌ Error:', err);
  
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    ...(NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// ============================================================================
// Server Initialization
// ============================================================================

// Validate required environment variables
const requiredEnvVars = [
  'RAZORPAY_KEY_ID',
  'RAZORPAY_KEY_SECRET',
  'SUPABASE_URL',
  'SUPABASE_ANON_KEY',
];

const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
  console.error('❌ Missing required environment variables:');
  missingEnvVars.forEach(varName => console.error(`   - ${varName}`));
  console.error('\nPlease check your .env file and try again.');
  process.exit(1);
}

// Start server - Bind to 0.0.0.0 to accept connections from any network interface
app.listen(PORT, '0.0.0.0', () => {
  console.log('');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('🚀 Payment Server Started Successfully!');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`📍 Server running on: http://localhost:${PORT}`);
  console.log(`📍 Network access: http://172.29.74.163:${PORT}`);
  console.log(`🌍 Environment: ${NODE_ENV}`);
  console.log(`⚡ Razorpay Routes: http://localhost:${PORT}/api/razorpay`);
  console.log('');
  console.log('📋 Available Endpoints:');
  console.log(`   GET  http://localhost:${PORT}/`);
  console.log(`   GET  http://localhost:${PORT}/health`);
  console.log(`   POST http://localhost:${PORT}/api/razorpay/create-order`);
  console.log(`   POST http://localhost:${PORT}/api/razorpay/verify-payment`);
  console.log(`   GET  http://localhost:${PORT}/api/razorpay/payment-status/:orderId`);
  console.log('');
  console.log('✅ Razorpay Integration: Active');
  console.log(`🔑 Using Key ID: ${process.env.RAZORPAY_KEY_ID}`);
  console.log('💾 Database: Supabase');
  console.log('');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('💡 Ready to accept payment requests!');
  console.log('   Press Ctrl+C to stop the server');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('');
  console.log('👋 SIGTERM received. Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('');
  console.log('👋 SIGINT received. Shutting down gracefully...');
  process.exit(0);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('');
  console.error('❌ Uncaught Exception:', err);
  console.error('Stack:', err.stack);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('');
  console.error('❌ Unhandled Promise Rejection at:', promise);
  console.error('Reason:', reason);
  process.exit(1);
});

module.exports = app;
