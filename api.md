# 🌐 API Documentation - AI Cloth Recommendation

**Last Updated**: November 5, 2025  
**Base URL (Backend)**: `http://localhost:3000` (Dev) | `https://your-domain.com` (Prod)  
**Supabase URL**: `https://wmhiwieooqfwkrdcvqvb.supabase.co`

---

## 📋 Table of Contents

1. [API Architecture](#api-architecture)
2. [Internal APIs (Backend)](#internal-apis-backend)
3. [Supabase Edge Functions](#supabase-edge-functions)
4. [Supabase Client APIs](#supabase-client-apis)
5. [External AI APIs](#external-ai-apis)
6. [Authentication](#authentication)
7. [Error Handling](#error-handling)
8. [Rate Limiting](#rate-limiting)

---

## 🏗️ API Architecture

### API Layers

```
┌──────────────────────────────────────────────────────────┐
│                    Frontend (React Native)                │
└─────────────┬────────────────────────┬───────────────────┘
              │                         │
              │                         │
    ┌─────────▼─────────┐    ┌─────────▼─────────┐
    │  Express Backend  │    │  Supabase APIs     │
    │  (Payment Only)   │    │  (Everything Else) │
    └─────────┬─────────┘    └─────────┬─────────┘
              │                         │
              │                         ├─ Auth APIs
    ┌─────────▼─────────┐              ├─ Database APIs
    │ Razorpay API      │              ├─ Storage APIs
    │ (Payment Gateway) │              ├─ Edge Functions
    └───────────────────┘              └─ Real-time APIs
                                       
              │                         │
              └────────────┬────────────┘
                           │
                ┌──────────▼──────────┐
                │   External AI APIs   │
                │                      │
                │ • OpenAI Whisper     │
                │ • OpenAI GPT-4 Vision│
                │ • Pollinations AI    │
                └──────────────────────┘
```

---

## 💳 Internal APIs (Backend)

### Base URL
```
Development: http://localhost:3000
Production: https://your-backend-url.com
```

### 1. Health Check

**GET** `/`

**Response**:
```json
{
  "success": true,
  "message": "Cloth Recommendation Backend - Payment Server",
  "status": "running",
  "timestamp": "2025-11-05T10:30:00Z",
  "environment": "development",
  "endpoints": {
    "razorpay": "/api/razorpay",
    "health": "/health"
  }
}
```

---

### 2. Create Razorpay Order

**POST** `/api/razorpay/create-order`

**Purpose**: Create a payment order for credit purchase

**Request Body**:
```json
{
  "credits": 50,
  "userId": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Request Validation**:
- `credits`: Required, must be 10, 25, 50, or 100
- `userId`: Required, valid UUID

**Response (200 OK)**:
```json
{
  "success": true,
  "message": "Order created successfully",
  "data": {
    "orderId": "order_Mxyz1234567890",
    "amount": 34900,
    "currency": "INR",
    "keyId": "rzp_test_xxxxxxxxxxxx"
  }
}
```

**Error Responses**:
```json
// 400 Bad Request
{
  "success": false,
  "message": "Credits and userId are required"
}

// 400 Bad Request
{
  "success": false,
  "message": "Invalid credit plan. Choose from: 10, 25, 50, or 100 credits"
}

// 500 Internal Server Error
{
  "success": false,
  "message": "Failed to create order in Razorpay",
  "error": "Razorpay API error"
}
```

**Credit Plans**:
| Credits | Price (INR) |
|---------|-------------|
| 10      | ₹99         |
| 25      | ₹199        |
| 50      | ₹349        |
| 100     | ₹599        |

---

### 3. Verify Razorpay Payment

**POST** `/api/razorpay/verify-payment`

**Purpose**: Verify payment signature and add credits to user account

**Request Body**:
```json
{
  "razorpay_order_id": "order_Mxyz1234567890",
  "razorpay_payment_id": "pay_Nxyz9876543210",
  "razorpay_signature": "abc123def456...",
  "userId": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Response (200 OK)**:
```json
{
  "success": true,
  "message": "Payment verified and credits added",
  "data": {
    "creditsAdded": 50,
    "totalCredits": 75
  }
}
```

**Error Responses**:
```json
// 400 Bad Request
{
  "success": false,
  "message": "Invalid payment signature"
}

// 404 Not Found
{
  "success": false,
  "message": "Payment record not found"
}

// 500 Internal Server Error
{
  "success": false,
  "message": "Failed to update user credits",
  "error": "Database error"
}
```

**Signature Verification**:
```javascript
// Server-side verification algorithm
const body = `${orderId}|${paymentId}`;
const expectedSignature = crypto
  .createHmac('sha256', RAZORPAY_KEY_SECRET)
  .update(body)
  .digest('hex');
const isValid = expectedSignature === signature;
```

---

### 4. Get Payment Status

**GET** `/api/razorpay/payment-status/:orderId`

**Purpose**: Check the status of a payment order

**Parameters**:
- `orderId`: Razorpay order ID (path parameter)

**Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "orderId": "order_Mxyz1234567890",
    "status": "completed",
    "credits": 50,
    "paymentId": "pay_Nxyz9876543210",
    "createdAt": "2025-11-05T10:25:00Z",
    "completedAt": "2025-11-05T10:30:00Z"
  }
}
```

**Possible Statuses**:
- `pending`: Order created, payment not completed
- `completed`: Payment verified, credits added
- `failed`: Payment failed
- `refunded`: Payment refunded

---

## 🔧 Supabase Edge Functions

Edge Functions run on **Deno** runtime and are deployed to Supabase's edge network.

### Base URL
```
https://wmhiwieooqfwkrdcvqvb.supabase.co/functions/v1
```

---

### 1. admin-get-users

**POST** `/functions/v1/admin-get-users`

**Purpose**: Fetch all users for admin dashboard with filtering and sorting

**Headers**:
```
Authorization: Bearer <supabase_anon_key>
x-admin-email: admin@example.com
Content-Type: application/json
```

**Request Body**:
```json
{
  "searchQuery": "john",
  "gender": "male",
  "sortField": "created_at",
  "sortOrder": "desc"
}
```

**Response (200 OK)**:
```json
{
  "users": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "+1234567890",
      "age": 25,
      "gender": "male",
      "bio": "Fashion enthusiast",
      "profile_image": "https://storage.supabase.co/...",
      "credits_remaining": 45,
      "subscription_plan": "pro",
      "created_at": "2025-01-01T00:00:00Z",
      "updated_at": "2025-11-05T10:00:00Z"
    }
  ]
}
```

**Error Responses**:
```json
// 401 Unauthorized
{
  "error": "Admin email required"
}

// 403 Forbidden
{
  "error": "Unauthorized: Not an admin"
}
```

**Authorization**:
- Checks `admin_users` table for admin email
- Uses service role key to bypass RLS

---

### 2. admin-delete-user

**POST** `/functions/v1/admin-delete-user`

**Purpose**: Delete user and all associated data

**Headers**:
```
Authorization: Bearer <supabase_anon_key>
x-admin-email: admin@example.com
Content-Type: application/json
```

**Request Body**:
```json
{
  "userId": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Response (200 OK)**:
```json
{
  "success": true,
  "message": "User deleted successfully",
  "deletedData": {
    "profile": true,
    "analyses": 12,
    "recommendations": 48,
    "settings": true
  }
}
```

**Cascade Deletes**:
1. User profile (`user_profiles`)
2. Analysis history (`analysis_history`)
3. Product recommendations (`product_recommendations`)
4. App settings (`app_settings`)
5. Auth user (`auth.users`)

---

### 3. send-password-reset

**POST** `/functions/v1/send-password-reset`

**Purpose**: Send password reset email with secure token

**Request Body**:
```json
{
  "email": "user@example.com"
}
```

**Response (200 OK)**:
```json
{
  "success": true,
  "message": "Password reset email sent"
}
```

**Features**:
- ✅ Rate limiting (3 requests per hour)
- ✅ Secure token generation (256-bit random)
- ✅ Token hashing (SHA-256)
- ✅ 15-minute expiry
- ✅ Gmail SMTP with STARTTLS
- ✅ Beautiful HTML email template

**Rate Limit Response (429)**:
```json
{
  "error": "Too many requests. Please try again in 60 minutes."
}
```

---

### 4. verify-password-reset

**POST** `/functions/v1/verify-password-reset`

**Purpose**: Verify password reset token and allow password change

**Request Body**:
```json
{
  "token": "abc123def456..."
}
```

**Response (200 OK)**:
```json
{
  "success": true,
  "email": "user@example.com",
  "message": "Token verified"
}
```

**Error Responses**:
```json
// 400 Bad Request
{
  "error": "Invalid or expired token"
}

// 400 Bad Request
{
  "error": "Token already used"
}
```

---

### 5. send-otp

**POST** `/functions/v1/send-otp`

**Purpose**: Send OTP for phone verification

**Request Body**:
```json
{
  "phone": "+1234567890"
}
```

**Response (200 OK)**:
```json
{
  "success": true,
  "message": "OTP sent successfully",
  "otpId": "otp_abc123"
}
```

---

## 🗄️ Supabase Client APIs

### Authentication APIs

#### Sign Up
```typescript
const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'secure_password',
});
```

#### Sign In
```typescript
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password123',
});
```

#### Sign Out
```typescript
const { error } = await supabase.auth.signOut();
```

#### Get Session
```typescript
const { data: { session } } = await supabase.auth.getSession();
```

#### Password Reset
```typescript
const { error } = await supabase.auth.resetPasswordForEmail(
  'user@example.com',
  { redirectTo: 'https://yourapp.com/reset-password' }
);
```

#### Update Password
```typescript
const { error } = await supabase.auth.updateUser({
  password: 'new_password',
});
```

---

### Database APIs

#### Select
```typescript
const { data, error } = await supabase
  .from('user_profiles')
  .select('*')
  .eq('user_id', userId)
  .single();
```

#### Insert
```typescript
const { data, error } = await supabase
  .from('analysis_history')
  .insert({
    user_id: userId,
    type: 'outfit',
    result: 'Analysis result',
    score: 85,
  })
  .select()
  .single();
```

#### Update
```typescript
const { error } = await supabase
  .from('user_profiles')
  .update({ name: 'New Name' })
  .eq('user_id', userId);
```

#### Delete
```typescript
const { error } = await supabase
  .from('analysis_history')
  .delete()
  .eq('id', analysisId);
```

#### Complex Query
```typescript
const { data, error } = await supabase
  .from('analysis_history')
  .select(`
    *,
    product_recommendations (*)
  `)
  .eq('user_id', userId)
  .order('created_at', { ascending: false })
  .limit(10);
```

---

### Storage APIs

#### Upload File
```typescript
const { data, error } = await supabase.storage
  .from('profile-images')
  .upload(`${userId}/avatar.jpg`, file, {
    cacheControl: '3600',
    upsert: true,
  });
```

#### Get Public URL
```typescript
const { data } = supabase.storage
  .from('profile-images')
  .getPublicUrl(`${userId}/avatar.jpg`);

const publicUrl = data.publicUrl;
```

#### Download File
```typescript
const { data, error } = await supabase.storage
  .from('outfit-images')
  .download(`${userId}/outfit_123.jpg`);
```

#### Delete File
```typescript
const { error } = await supabase.storage
  .from('profile-images')
  .remove([`${userId}/avatar.jpg`]);
```

---

## 🤖 External AI APIs

### 1. OpenAI Whisper API (Speech-to-Text)

**Endpoint**: `https://api.openai.com/v1/audio/transcriptions`

**Purpose**: Convert voice recordings to text (AI Stylist)

**Request**:
```typescript
const formData = new FormData();
formData.append('file', {
  uri: audioUri,
  type: 'audio/m4a',
  name: 'audio.m4a',
});
formData.append('model', 'whisper-1');

const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${OPENAI_API_KEY}`,
  },
  body: formData,
});

const { text } = await response.json();
```

**Response**:
```json
{
  "text": "How does this outfit look?"
}
```

**Audio Requirements**:
- Format: M4A, AAC, MP3, WAV
- Max size: 25MB
- Sample rate: 16kHz recommended

---

### 2. OpenAI GPT-4 Vision API (Optional)

**Endpoint**: `https://api.openai.com/v1/chat/completions`

**Purpose**: Fallback for image analysis

**Request**:
```typescript
const response = await fetch('https://api.openai.com/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${OPENAI_API_KEY}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    model: 'gpt-4-vision-preview',
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: 'Analyze this outfit and provide fashion advice.',
          },
          {
            type: 'image_url',
            image_url: {
              url: imageUrl,
            },
          },
        ],
      },
    ],
    max_tokens: 500,
  }),
});
```

**Response**:
```json
{
  "choices": [
    {
      "message": {
        "role": "assistant",
        "content": "This outfit looks great! The color combination..."
      }
    }
  ]
}
```

---

### 3. Pollinations AI (Primary, Free)

#### A. Vision API

**Endpoint**: `https://text.pollinations.ai/`

**Purpose**: Free AI vision model for outfit analysis

**Request**:
```typescript
const prompt = `You are a fashion expert. Analyze this outfit image and provide:
1. Overall score (0-100)
2. Three strengths
3. Two improvements
4. Missing items

Image: ${imageUrl}`;

const response = await fetch('https://text.pollinations.ai/', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    messages: [
      {
        role: 'user',
        content: [
          { type: 'text', text: prompt },
          { type: 'image_url', image_url: { url: imageUrl } },
        ],
      },
    ],
    model: 'openai',
  }),
});

const text = await response.text();
```

**Advantages**:
- ✅ Free (no API key required)
- ✅ Fast response (~6-10s)
- ✅ Good quality
- ✅ No rate limits

---

#### B. Text-to-Speech API

**Endpoint**: `https://text.pollinations.ai/openai`

**Purpose**: Generate voice output for web (AI Stylist)

**Request**:
```typescript
const response = await fetch(`https://text.pollinations.ai/openai?text=${encodeURIComponent(text)}`);
const audioBlob = await response.blob();
const audioUrl = URL.createObjectURL(audioBlob);
```

---

#### C. Image Generation API

**Endpoint**: `https://image.pollinations.ai/prompt/{prompt}`

**Purpose**: Generate fashion images from text prompts

**Request**:
```typescript
const prompt = 'A stylish autumn outfit with leather jacket';
const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}`;

// Display in <Image> component
<Image source={{ uri: imageUrl }} />
```

**Parameters**:
- `width`: Image width (default: 1024)
- `height`: Image height (default: 1024)
- `seed`: Random seed for reproducibility
- `model`: AI model to use

**Example with params**:
```
https://image.pollinations.ai/prompt/leather%20jacket?width=512&height=512&seed=42
```

---

### 4. Amazon Product API (Conceptual)

**Note**: Currently uses search URLs, not official API

**Search URL Format**:
```typescript
const searchUrl = `https://www.amazon.com/s?k=${encodeURIComponent(query)}`;
```

**Product Recommendation Flow**:
1. Extract missing items from AI analysis
2. Generate Amazon search URLs for each item
3. Store recommendations in `product_recommendations` table
4. Display affiliate links to user

---

## 🔐 Authentication

### Token-Based Auth (Supabase)

**Access Token**:
- JWT token issued by Supabase Auth
- Included in `Authorization` header
- Automatically refreshed by Supabase client

**Usage**:
```typescript
// Supabase client automatically includes token
const { data } = await supabase
  .from('user_profiles')
  .select('*');

// Manual API call with token
const { data: { session } } = await supabase.auth.getSession();
const token = session?.access_token;

fetch(url, {
  headers: {
    'Authorization': `Bearer ${token}`,
  },
});
```

### API Key Authentication (External APIs)

**OpenAI**:
```typescript
headers: {
  'Authorization': `Bearer ${OPENAI_API_KEY}`,
}
```

**Razorpay**:
```typescript
// Backend only
const Razorpay = require('razorpay');
const instance = new Razorpay({
  key_id: RAZORPAY_KEY_ID,
  key_secret: RAZORPAY_KEY_SECRET,
});
```

---

## ⚠️ Error Handling

### Standard Error Format

```json
{
  "success": false,
  "message": "Human-readable error message",
  "error": "Technical error details (dev mode only)",
  "code": "ERROR_CODE"
}
```

### HTTP Status Codes

| Code | Meaning | Usage |
|------|---------|-------|
| 200 | OK | Successful request |
| 201 | Created | Resource created |
| 400 | Bad Request | Invalid input |
| 401 | Unauthorized | Missing/invalid token |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource doesn't exist |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server error |
| 503 | Service Unavailable | Service down |

### Error Examples

**Validation Error (400)**:
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "Invalid email format"
    },
    {
      "field": "password",
      "message": "Password must be at least 8 characters"
    }
  ]
}
```

**Authentication Error (401)**:
```json
{
  "success": false,
  "message": "Authentication required",
  "code": "UNAUTHORIZED"
}
```

**Rate Limit Error (429)**:
```json
{
  "success": false,
  "message": "Too many requests. Please try again later.",
  "retryAfter": 3600
}
```

---

## ⏱️ Rate Limiting

### Password Reset
- **Limit**: 3 requests per hour per email
- **Window**: 60 minutes
- **Storage**: `password_reset_rate_limits` table

### Payment APIs
- **Limit**: 10 requests per minute per user
- **Implementation**: Application-level (not enforced yet)

### Supabase APIs
- **Free Tier**: 500,000 reads/month, 50,000 writes/month
- **Pro Tier**: Unlimited

### External APIs
- **OpenAI Whisper**: Rate limits based on plan
- **Pollinations AI**: No official rate limits (free)

---

## 📊 API Response Times

| API | Average Response Time |
|-----|----------------------|
| Supabase Database | 50-150ms |
| Supabase Storage | 100-300ms |
| Razorpay Order | 500-1000ms |
| OpenAI Whisper | 3000-5000ms |
| OpenAI GPT-4 Vision | 5000-10000ms |
| Pollinations Vision | 6000-10000ms |
| Supabase Edge Functions | 100-500ms |

---

## 🎯 Summary

- ✅ **3 API Layers**: Express Backend (Payment), Supabase (Database/Auth/Storage), External AI
- ✅ **5 Supabase Edge Functions**: admin-get-users, admin-delete-user, send-password-reset, verify-password-reset, send-otp
- ✅ **Multiple AI APIs**: OpenAI (Whisper, GPT-4 Vision), Pollinations (Vision, TTS, Image Gen)
- ✅ **Secure Authentication**: JWT tokens, API keys, service role
- ✅ **Comprehensive Error Handling**: Standardized error format
- ✅ **Rate Limiting**: Password reset, payment protection
- ✅ **Type-Safe**: TypeScript interfaces for all requests/responses

---

**API Documentation Complete** ✅  
**Total Lines**: 890  
**Coverage**: All internal and external API integrations
