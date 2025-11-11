# 📋 Project Documentation Plan

## Overview
This document outlines the comprehensive documentation strategy for the **Style GPT** project. The project will be documented across four main markdown files, each focusing on a specific layer of the application architecture.

---

## 🎯 Project Summary

**Project Name**: Style GPT  
**Type**: Cross-platform Mobile Application (iOS, Android, Web)  
**Framework**: React Native + Expo Router  
**Backend**: Express.js + Supabase  
**Database**: PostgreSQL (Supabase)  
**Primary Features**:
- AI-powered outfit scoring and recommendations
- AI Stylist with voice interaction (Alexa-like mode)
- AI Image Generation
- Payment integration (Razorpay)
- User profile management
- Admin dashboard for analytics
- Chat history and product recommendations

---

## 📁 Documentation Structure

### 1. **frontend.md** - Frontend Architecture & UI
**Focus**: React Native, Expo Router, UI/UX, Components, Screens, Navigation

**Sections**:
- **Technology Stack**
  - React Native 0.81.4
  - Expo SDK 54
  - Expo Router (file-based routing)
  - TypeScript
  - NativeWind (Tailwind CSS)
  - React Query for state management
  
- **Project Structure**
  - `/app` - Expo Router screens and layouts
  - `/screens` - Reusable screen components
  - `/components` - UI components (buttons, inputs, cards, etc.)
  - `/constants` - Colors, fonts, theme configuration
  - `/contexts` - Global state (AppContext, AlertContext)
  - `/hooks` - Custom React hooks
  
- **Navigation Architecture**
  - Root layout (`app/_layout.tsx`)
  - Tab navigation (`app/(tabs)`)
  - Authentication flow (`app/auth`)
  - Admin routes (`app/(admin)`)
  - Modal screens (profile, outfit-scorer)
  - Full-screen modals (ai-stylist, ai-image-generator)
  
- **Feature Modules**
  - **OutfitScorer Module** (`/OutfitScorer`)
    - Components, hooks, services, utils, types
    - Multi-model AI integration
    - Product recommendations
    - Credit system
    - Image upload and analysis
    
  - **AIStylist Module** (`/AIStylist`)
    - Voice interaction (Alexa-like mode)
    - Context management
    - Vision API integration
    - Voice Activity Detection (VAD)
    - Streaming response handler
    - Chat history
    
  - **ImageGen Module** (`/ImageGen`)
    - AI image generation
    - Explore section
    - Image gallery
    
  - **Dashboard Module** (`/Dashboard`)
    - Admin authentication
    - User management
    - Payment administration
    - Demographics analytics
    - Stats and insights
    
- **State Management**
  - AppContext (authentication, user profile, settings)
  - AlertContext (global alerts/notifications)
  - React Query for server state
  - AsyncStorage for persistence
  
- **UI Components Library**
  - PrimaryButton
  - InputField
  - GlassContainer (glassmorphism effect)
  - CustomAlert
  - CreditsCard
  - Footer
  - RazorpayPayment
  
- **Screens Breakdown**
  - Onboarding (tutorial, user info)
  - Authentication (sign-in, sign-up, forgot password, reset)
  - Home screen
  - Settings screen
  - Profile screen
  - History screen (outfit history, stylist history)
  - Admin dashboard screens
  
- **Styling & Theming**
  - Dark mode support
  - Theme configuration
  - Color constants
  - Typography system
  - Responsive design
  
- **Mobile-Specific Features**
  - Camera integration (expo-camera)
  - Image picker (expo-image-picker)
  - Voice recording (expo-av)
  - Speech recognition (expo-speech-recognition)
  - Text-to-speech (expo-speech)
  - Haptic feedback (expo-haptics)
  - Local storage (AsyncStorage)

---

### 2. **backend.md** - Backend Services & APIs
**Focus**: Express.js server, Payment processing, Server logic

**Sections**:
- **Technology Stack**
  - Node.js
  - Express.js 4.21.1
  - Razorpay SDK 2.9.6
  - Supabase JS Client 2.45.4
  - CORS middleware
  - dotenv for configuration
  
- **Server Architecture**
  - Entry point: `backend/server.js`
  - Minimal Express backend (payment-focused)
  - RESTful API design
  - Middleware stack
  - Error handling
  - Graceful shutdown
  
- **Razorpay Integration** (`backend/Razorpay/`)
  - **Routes** (`routes/paymentRoutes.js`)
    - POST `/api/razorpay/create-order` - Create payment order
    - POST `/api/razorpay/verify-payment` - Verify payment signature
    - GET `/api/razorpay/payment-status/:orderId` - Check payment status
    
  - **Controllers** (`controllers/paymentController.js`)
    - Order creation logic
    - Payment verification
    - Status checking
    - Supabase integration for payment records
    
  - **Utils** (`utils/`)
    - `razorpayInstance.js` - Razorpay client initialization
    - `razorpayHelpers.js` - Helper functions
    
- **Environment Configuration**
  - Required environment variables
  - Security best practices
  - API key management
  
- **Server Endpoints**
  - Health check endpoints
  - Payment endpoints
  - Error responses
  - Status codes
  
- **Testing**
  - Jest test suite
  - Supertest for API testing
  - Test coverage for controllers, routes, utils
  - Mock Razorpay SDK
  
- **Deployment**
  - Production configuration
  - Port binding (0.0.0.0)
  - Process management
  - Logging strategy

---

### 3. **database.md** - Database Schema & Structure
**Focus**: Supabase/PostgreSQL database, tables, relationships, migrations

**Sections**:
- **Database Platform**
  - Supabase (PostgreSQL 13.0.5)
  - Database URL: `https://wmhiwieooqfwkrdcvqvb.supabase.co`
  - Auto-generated TypeScript types
  
- **Database Schema Overview**
  - All tables in `public` schema
  - Relationships and foreign keys
  - Indexes and constraints
  - Row Level Security (RLS) policies
  
- **Tables Documentation**
  
  **1. user_profiles**
  - Purpose: Store user profile information
  - Columns:
    - `id` (UUID, primary key)
    - `user_id` (UUID, references auth.users)
    - `name` (text)
    - `email` (text)
    - `phone` (text, nullable)
    - `age` (integer, nullable)
    - `gender` (text, nullable)
    - `bio` (text, nullable)
    - `profile_image` (text, nullable)
    - `created_at` (timestamp)
    - `updated_at` (timestamp)
  - Relationships: Links to auth.users
  - RLS: Users can read/update their own profile
  
  **2. analysis_history**
  - Purpose: Store outfit analysis and AI stylist chat sessions
  - Columns:
    - `id` (UUID, primary key)
    - `user_id` (UUID)
    - `type` (text: 'outfit' or 'stylist')
    - `image_url` (text, nullable)
    - `result` (text)
    - `score` (numeric, nullable)
    - `conversation_data` (JSON, nullable)
    - `feedback` (JSON, nullable)
    - `created_at` (timestamp)
    - `updated_at` (timestamp)
  - Relationships: Links to user_profiles
  - RLS: Users can read/write their own history
  
  **3. product_recommendations**
  - Purpose: Store product recommendations from outfit analysis
  - Columns:
    - `id` (UUID, primary key)
    - `analysis_id` (UUID, foreign key)
    - `user_id` (UUID)
    - `product_name` (text)
    - `product_url` (text)
    - `product_image_url` (text)
    - `price` (text, nullable)
    - `marketplace` (text)
    - `item_type` (text)
    - `rating` (numeric, nullable)
    - `priority` (integer, nullable)
    - `missing_reason` (text, nullable)
    - `created_at` (timestamp)
  - Relationships: Links to analysis_history
  - RLS: Users can read recommendations for their analyses
  
  **4. admin_users**
  - Purpose: Track authorized admin users
  - Columns:
    - `id` (UUID, primary key)
    - `email` (text, unique)
    - `created_at` (timestamp)
  - Relationships: None
  - RLS: Only admins can access
  
  **5. activity_logs**
  - Purpose: Log user and admin activities
  - Columns:
    - `id` (UUID, primary key)
    - `user_id` (UUID, nullable)
    - `action` (text)
    - `metadata` (JSON, nullable)
    - `created_at` (timestamp)
  - Relationships: None
  - RLS: Only admins can access
  
  **6. app_settings**
  - Purpose: Store user app preferences
  - Columns:
    - `id` (UUID, primary key)
    - `user_id` (UUID)
    - `use_cloud_ai` (boolean)
    - `save_history` (boolean)
    - `is_dark_mode` (boolean)
    - `use_voice_interaction` (boolean)
    - `created_at` (timestamp)
    - `updated_at` (timestamp)
  - Relationships: Links to user_profiles
  - RLS: Users can read/update their own settings
  
- **Migrations** (`/supabase/migrations/`)
  - `20251011_create_admin_users.sql`
  - `PASSWORD_RESET_SCHEMA.sql`
  - `add_credit_system.sql`
  - `allow_admin_delete_payments.sql`
  - `delete_payment_submission.sql`
  - `reset_user_to_free.sql`
  - `restore_payment_submissions_basic.sql`
  - `update_payment_submissions_with_profile.sql`
  
- **Supabase Storage Buckets**
  - `profile-images` - User profile pictures
  - `outfit-images` - Uploaded outfit images for analysis
  - `stylist-images` - Images from AI stylist sessions
  - Public/private access policies
  - Image upload configuration
  
- **Database Functions**
  - Custom SQL functions
  - Triggers and automation
  
- **Row Level Security (RLS)**
  - Policy definitions per table
  - User isolation
  - Admin access patterns
  
- **Database Types** (`types/database.types.ts`)
  - Auto-generated TypeScript types
  - JSON type definitions
  - Type-safe database queries

---

### 4. **api.md** - API Endpoints & Integrations
**Focus**: All API endpoints, external integrations, authentication

**Sections**:
- **API Architecture Overview**
  - RESTful principles
  - Authentication methods
  - Request/response formats
  - Error handling standards
  
- **Internal APIs (Backend Server)**
  
  **Payment APIs** (`/api/razorpay`)
  - **POST** `/api/razorpay/create-order`
    - Purpose: Create Razorpay payment order
    - Request body: `{ amount: number, currency: string, userId: string }`
    - Response: `{ success: boolean, orderId: string, amount: number, currency: string }`
    - Authentication: Required (Supabase session)
    - Error codes: 400, 500
    
  - **POST** `/api/razorpay/verify-payment`
    - Purpose: Verify payment signature after payment
    - Request body: `{ orderId: string, paymentId: string, signature: string, userId: string }`
    - Response: `{ success: boolean, verified: boolean }`
    - Authentication: Required
    - Error codes: 400, 500
    
  - **GET** `/api/razorpay/payment-status/:orderId`
    - Purpose: Check payment status
    - Response: `{ success: boolean, status: string }`
    - Authentication: Required
    - Error codes: 404, 500
  
- **Supabase Edge Functions** (`/supabase/functions/`)
  
  **1. admin-get-users**
  - Runtime: Deno
  - Purpose: Fetch all users for admin dashboard
  - Authentication: Admin only
  - Returns: User list with profiles
  
  **2. admin-delete-user**
  - Runtime: Deno
  - Purpose: Delete user and all associated data
  - Authentication: Admin only
  - Cascade deletes: profiles, history, recommendations
  
  **3. send-password-reset**
  - Runtime: Deno
  - Purpose: Send password reset email
  - Request: `{ email: string }`
  - Response: `{ success: boolean }`
  
  **4. verify-password-reset**
  - Runtime: Deno
  - Purpose: Verify password reset token
  - Request: `{ token: string }`
  - Response: `{ valid: boolean }`
  
  **5. send-otp**
  - Runtime: Deno
  - Purpose: Send OTP for phone verification
  - Request: `{ phone: string }`
  - Response: `{ success: boolean, otpId: string }`
  
- **Supabase Auth APIs**
  - Sign up: `supabase.auth.signUp()`
  - Sign in: `supabase.auth.signInWithPassword()`
  - Sign out: `supabase.auth.signOut()`
  - Password reset: `supabase.auth.resetPasswordForEmail()`
  - Update password: `supabase.auth.updateUser()`
  - Session management
  - Token refresh
  
- **Supabase Database APIs**
  - Table queries (select, insert, update, delete)
  - Real-time subscriptions
  - RPC function calls
  - Storage operations
  
- **External AI APIs**
  
  **1. OpenAI API**
  - **Whisper API** (Speech-to-Text)
    - Endpoint: `/v1/audio/transcriptions`
    - Model: `whisper-1`
    - Audio format: M4A, AAC
    - Response: Transcribed text
    - Usage: Voice input in AI Stylist
    
  - **GPT-4 Vision API** (Optional)
    - Endpoint: `/v1/chat/completions`
    - Model: `gpt-4-vision-preview`
    - Purpose: Fallback for image analysis
    - Input: Image + text prompt
    - Response: Analysis text
    
  **2. Pollinations AI API**
  - **Vision API** (Primary)
    - Endpoint: `https://text.pollinations.ai/`
    - Model: Free AI vision model
    - Purpose: Outfit analysis, AI stylist vision
    - Input: Image URL + prompt
    - Response: Analysis text
    - Advantages: Free, fast, no API key
    
  - **Text-to-Speech API**
    - Endpoint: Pollinations TTS
    - Purpose: Web-based voice output
    - Input: Text
    - Response: Audio URL
    
  - **Image Generation API**
    - Endpoint: Pollinations image API
    - Purpose: AI-generated fashion images
    - Input: Text prompt
    - Response: Generated image URL
    
  **3. Amazon Product API (Conceptual)**
  - Product search integration
  - Affiliate links
  - Product recommendations
  
- **API Authentication & Security**
  - Supabase JWT tokens
  - API key management
  - Request signing (Razorpay)
  - Rate limiting
  - Error handling
  
- **API Response Standards**
  - Success response format
  - Error response format
  - HTTP status codes
  - Pagination
  - Filtering and sorting
  
- **API Client Implementation**
  - Fetch/Axios wrappers
  - Retry logic
  - Timeout handling
  - Error boundaries
  
- **Webhooks**
  - Razorpay webhook handling
  - Supabase realtime hooks
  - Event processing

---

## 🔄 Data Flow Architecture

### Request Flow Example: Outfit Analysis
1. **Frontend**: User captures/uploads outfit image
2. **Frontend**: Image uploaded to Supabase Storage
3. **Frontend**: Call Pollinations Vision API with image URL
4. **AI API**: Analyze image, return outfit score and feedback
5. **Frontend**: Call product recommendation API
6. **Frontend**: Store analysis in Supabase `analysis_history`
7. **Frontend**: Store recommendations in `product_recommendations`
8. **Frontend**: Display results to user

### Authentication Flow
1. **Frontend**: User enters credentials
2. **Frontend**: Call `supabase.auth.signInWithPassword()`
3. **Supabase**: Validate credentials, return JWT token
4. **Frontend**: Store session in AsyncStorage
5. **Frontend**: Fetch user profile from `user_profiles`
6. **AppContext**: Update global state
7. **Navigation**: Redirect to home screen

### Payment Flow
1. **Frontend**: User selects payment plan
2. **Frontend**: POST to `/api/razorpay/create-order`
3. **Backend**: Create Razorpay order
4. **Backend**: Return order details
5. **Frontend**: Open Razorpay payment gateway
6. **User**: Complete payment
7. **Razorpay**: Return payment ID and signature
8. **Frontend**: POST to `/api/razorpay/verify-payment`
9. **Backend**: Verify signature, update database
10. **Frontend**: Show success, update credits

---

## 📊 Key Statistics

### Project Scale
- **Total Files**: ~386 TypeScript/JavaScript files
- **Major Modules**: 4 (OutfitScorer, AIStylist, ImageGen, Dashboard)
- **Screens**: ~15 main screens
- **Components**: ~30+ reusable components
- **API Endpoints**: ~10+ internal + external integrations
- **Database Tables**: 6 main tables
- **Supabase Functions**: 5 edge functions
- **Tests**: Jest test suite with 80%+ coverage

### Technology Layers
- **Frontend**: React Native, Expo, TypeScript
- **Backend**: Express.js, Node.js
- **Database**: Supabase (PostgreSQL)
- **Storage**: Supabase Storage (S3-compatible)
- **Authentication**: Supabase Auth
- **Payment**: Razorpay
- **AI**: OpenAI, Pollinations AI
- **Deployment**: EAS Build, Expo hosting

---

## 🎨 Documentation Style Guide

### Formatting Standards
- Use emoji icons for visual organization
- Code blocks with syntax highlighting
- Tables for structured data
- Diagrams for complex flows (ASCII art)
- Clear section hierarchy (H1 → H2 → H3)

### Content Principles
- **Comprehensive**: Cover every aspect in detail
- **Technical**: Include code samples and configurations
- **Practical**: Provide real-world examples
- **Organized**: Logical flow and clear structure
- **Updated**: Reflect current implementation

---

## 📝 Documentation Completion Checklist

### Phase 1: Plan ✅
- [x] Analyze project structure
- [x] Identify all components, modules, APIs
- [x] Create comprehensive plan
- [x] Define documentation structure

### Phase 2: Create Documentation
- [ ] Create `frontend.md` (estimated: 2000+ lines)
- [ ] Create `backend.md` (estimated: 1000+ lines)
- [ ] Create `database.md` (estimated: 1500+ lines)
- [ ] Create `api.md` (estimated: 1800+ lines)

### Phase 3: Review & Finalize
- [ ] Cross-reference all documents
- [ ] Verify code samples
- [ ] Add diagrams where needed
- [ ] Final proofreading

---

## 🚀 Next Steps

1. **Review this plan** - Confirm the structure meets requirements
2. **Begin documentation** - Start with `frontend.md`
3. **Proceed sequentially** - Complete each file before moving to next
4. **Maintain consistency** - Follow style guide throughout

---

**Prepared by**: AI Documentation Assistant  
**Date**: November 5, 2025  
**Project**: Style GPT  
**Repository**: Cloth_Recommendation (dev-test branch)
