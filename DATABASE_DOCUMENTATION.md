# 🗄️ AI DressUp - Complete Database Documentation

> **Last Updated:** October 11, 2025  
> **Database:** Supabase PostgreSQL (Project: `wmhiwieooqfwkrdcvqvb`)  
> **Region:** `ap-south-1`

---

## 📚 Table of Contents

1. [Introduction](#introduction)
2. [Database Architecture Overview](#database-architecture-overview)
3. [Authentication System](#authentication-system)
4. [Core Tables](#core-tables)
5. [Relationships & Foreign Keys](#relationships--foreign-keys)
6. [Row Level Security (RLS)](#row-level-security-rls)
7. [Edge Functions](#edge-functions)
8. [Storage Buckets](#storage-buckets)
9. [Security Best Practices](#security-best-practices)
10. [Common Operations](#common-operations)
11. [Troubleshooting Guide](#troubleshooting-guide)

---

## 🎯 Introduction

This document provides a complete technical overview of your AI DressUp application database. It covers every aspect from table structures to security policies, helping you understand and manage your database effectively.

### What is Supabase?

**Supabase** is an open-source Firebase alternative that provides:

- **PostgreSQL Database**: Industry-standard relational database
- **Authentication**: Built-in user management with JWT tokens
- **Storage**: File storage with CDN
- **Edge Functions**: Serverless functions (like AWS Lambda)
- **Real-time**: WebSocket subscriptions for live updates
- **Row Level Security**: Database-level security policies

---

## 🏗️ Database Architecture Overview

### High-Level Structure

```
┌─────────────────────────────────────────────────────────────┐
│                    AUTHENTICATION LAYER                      │
│                      (auth.users)                            │
│              ┌──────────────────────────────┐               │
│              │  Supabase Auth Built-in      │               │
│              │  - Email/Password            │               │
│              │  - JWT Tokens                │               │
│              │  - Session Management        │               │
│              └──────────────────────────────┘               │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ user_id (Foreign Key)
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                      APPLICATION LAYER                       │
│                      (public schema)                         │
│                                                              │
│  ┌──────────────┐         ┌──────────────┐                │
│  │user_profiles │◄────┐   │ app_settings │                │
│  │              │     │   │              │                │
│  │ - name       │     │   │ - dark_mode  │                │
│  │ - email      │     │   │ - cloud_ai   │                │
│  │ - phone      │     │   │ - voice      │                │
│  │ - age        │     │   └──────────────┘                │
│  │ - gender     │     │                                    │
│  │ - bio        │     │                                    │
│  │ - image      │     │                                    │
│  └──────────────┘     │                                    │
│         │             │                                    │
│         │ user_id     │ user_id                           │
│         ▼             │                                    │
│  ┌──────────────┐     │   ┌──────────────┐               │
│  │activity_logs │     └───│analysis_     │               │
│  │              │         │  history     │               │
│  │ - action     │         │              │               │
│  │ - metadata   │         │ - type       │               │
│  │ - timestamp  │         │ - image_url  │               │
│  └──────────────┘         │ - result     │               │
│                           │ - score      │               │
│                           │ - feedback   │               │
│                           └──────────────┘               │
│                                  │                        │
│                                  │ analysis_id            │
│                                  ▼                        │
│                           ┌──────────────┐               │
│                           │product_      │               │
│                           │recommendations│              │
│                           │              │               │
│                           │ - item_type  │               │
│                           │ - name       │               │
│                           │ - image      │               │
│                           │ - url        │               │
│                           │ - marketplace│               │
│                           │ - price      │               │
│                           │ - rating     │               │
│                           └──────────────┘               │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                   AUTHENTICATION FEATURES                    │
│                                                              │
│  ┌────────────────┐  ┌─────────────────┐  ┌─────────────┐ │
│  │otp_            │  │password_reset_  │  │admin_users  │ │
│  │ verifications  │  │  tokens         │  │             │ │
│  │                │  │                 │  │ - email     │ │
│  │ - email        │  │ - email         │  │ - role      │ │
│  │ - otp_hash     │  │ - token_hash    │  └─────────────┘ │
│  │ - expires_at   │  │ - expires_at    │                  │
│  │ - verified     │  │ - used          │                  │
│  └────────────────┘  └─────────────────┘                  │
│                                                              │
│  ┌────────────────┐  ┌─────────────────┐                  │
│  │otp_rate_       │  │password_reset_  │                  │
│  │  limits        │  │  rate_limits    │                  │
│  │                │  │                 │                  │
│  │ - email        │  │ - email         │                  │
│  │ - count        │  │ - count         │                  │
│  │ - window_start │  │ - window_start  │                  │
│  └────────────────┘  └─────────────────┘                  │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔐 Authentication System

### Built-in Supabase Auth

Your app uses **Supabase Authentication** which manages users in the `auth.users` table (this is separate from your public schema and managed by Supabase).

#### How Authentication Works:

1. **User Signs Up**:

   ```
   User Email → OTP Sent → OTP Verified → auth.users created → user_profiles created
   ```

2. **User Logs In**:

   ```
   Email + Password → JWT Token Generated → Token Stored in Client → Auto-refresh
   ```

3. **Session Management**:
   - **JWT Token**: JSON Web Token containing user ID and permissions
   - **Expiry**: Tokens expire after 1 hour but auto-refresh
   - **Storage**: Stored in `AsyncStorage` on mobile
   - **Validation**: Every API call validates the token

#### auth.users Table (Managed by Supabase)

```sql
-- You don't create this table, Supabase manages it
auth.users
  ├── id (uuid) - Unique user identifier
  ├── email (text) - User's email
  ├── encrypted_password (text) - Hashed password
  ├── email_confirmed_at (timestamp) - Email verification time
  ├── created_at (timestamp)
  └── last_sign_in_at (timestamp)
```

**Key Concept**: `auth.uid()` in RLS policies refers to the currently authenticated user's ID from this table.

---

## 📊 Core Tables

### 1. user_profiles

**Purpose**: Stores extended user information beyond basic auth.

```sql
CREATE TABLE user_profiles (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id), -- Foreign Key to auth.users
  name text,
  email text UNIQUE,
  phone text,
  age integer,
  gender text,
  bio text,
  profile_image text, -- URL to Supabase Storage
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

**Fields Explained**:

- `id`: Unique identifier for the profile (different from user_id)
- `user_id`: **Foreign Key** linking to `auth.users.id` (the authenticated user)
- `email`: Duplicate of auth email for quick access
- `profile_image`: URL like `https://wmhiwieooqfwkrdcvqvb.supabase.co/storage/v1/object/public/user-images/...`

**RLS Policies**:

- ✅ Users can SELECT their own profile (`auth.uid() = user_id`)
- ✅ Users can INSERT their own profile
- ✅ Users can UPDATE their own profile

**Current Data**: 4 users

---

### 2. app_settings

**Purpose**: Stores per-user app preferences.

```sql
CREATE TABLE app_settings (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid UNIQUE REFERENCES auth.users(id), -- One setting per user
  is_dark_mode boolean DEFAULT false,
  use_cloud_ai boolean DEFAULT true,
  save_history boolean DEFAULT true,
  use_voice_interaction boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

**Key Concept**: `user_id UNIQUE` ensures each user has only one settings row.

**RLS Policies**:

- ✅ Users can SELECT/INSERT/UPDATE their own settings

**Current Data**: 4 rows (one per user)

---

### 3. analysis_history

**Purpose**: Stores AI analysis results (outfit scoring, stylist conversations).

```sql
CREATE TABLE analysis_history (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id),
  type text CHECK (type IN ('outfit_score', 'ai_stylist')),
  image_url text, -- URL of analyzed outfit image
  result text, -- AI's text response
  score integer, -- Outfit score (0-100)
  feedback jsonb, -- Structured feedback data
  conversation_data jsonb, -- Complete conversation history
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

**JSONB Fields**:

- `feedback`: Stores structured data like:
  ```json
  {
    "strengths": ["Good color combination", "Fits well"],
    "improvements": ["Try different shoes"],
    "suggestions": ["Add accessories"]
  }
  ```
- `conversation_data`: Stores complete chat history:
  ```json
  {
    "messages": [
      {"role": "user", "content": "Analyze this outfit"},
      {"role": "assistant", "content": "Your outfit scores 85..."}
    ],
    "images": ["url1", "url2"],
    "products": [...]
  }
  ```

**RLS Policies**:

- ✅ Users can SELECT/INSERT/UPDATE/DELETE their own history

**Current Data**: 8 analyses

---

### 4. product_recommendations

**Purpose**: Stores product recommendations from outfit analysis.

```sql
CREATE TABLE product_recommendations (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  analysis_id uuid REFERENCES analysis_history(id), -- Foreign Key
  user_id uuid REFERENCES auth.users(id),
  item_type text, -- 'shirt', 'pants', 'shoes', etc.
  product_name text,
  product_image_url text,
  product_url text, -- Link to marketplace
  marketplace text CHECK (marketplace IN ('flipkart', 'amazon', 'meesho')),
  price text,
  rating numeric,
  missing_reason text, -- Why this item is recommended
  priority integer DEFAULT 1,
  created_at timestamptz DEFAULT now()
);
```

**Foreign Keys**:

- `analysis_id` → Links to specific analysis
- `user_id` → Links to user who got the recommendation

**RLS Policies**:

- ✅ Users can SELECT/INSERT/DELETE their own recommendations

**Current Data**: 76 product recommendations

---

### 5. activity_logs

**Purpose**: Tracks user actions for analytics and debugging.

```sql
CREATE TABLE activity_logs (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id),
  action text, -- 'login', 'logout', 'outfit_analyzed', 'profile_updated'
  metadata jsonb, -- Additional context
  created_at timestamptz DEFAULT now()
);
```

**Example Metadata**:

```json
{
  "screen": "home",
  "feature": "outfit_scorer",
  "duration_ms": 1500,
  "device": "android"
}
```

**RLS Policies**:

- ✅ Users can SELECT/INSERT their own logs

**Current Data**: 12 activity logs

---

### 6. otp_verifications

**Purpose**: Temporary storage for OTP codes during signup.

```sql
CREATE TABLE otp_verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE,
  otp_hash text, -- Hashed OTP (not plain text!)
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz, -- Usually 10 minutes from creation
  verified boolean DEFAULT false,
  attempts integer DEFAULT 0 -- Track failed verification attempts
);
```

**Security Features**:

- OTP is **hashed** before storage (never stored in plain text)
- Expires after 10 minutes
- Limited to 5 verification attempts
- Deleted after successful verification

**RLS**: No public access (Edge Functions use service role)

---

### 7. otp_rate_limits

**Purpose**: Prevent OTP spam/abuse.

```sql
CREATE TABLE otp_rate_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE,
  request_count integer DEFAULT 1,
  window_start timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

**How It Works**:

- Tracks how many OTP requests per email
- Window: 15 minutes
- Limit: 3 requests per window
- Resets after window expires

---

### 8. password_reset_tokens

**Purpose**: Secure password reset flow.

```sql
CREATE TABLE password_reset_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text,
  token_hash text UNIQUE, -- Hashed reset token
  expires_at timestamptz, -- 1 hour expiry
  used boolean DEFAULT false,
  used_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  ip_address text, -- For security audit
  user_agent text -- Browser/device info
);
```

**Security Flow**:

1. User requests reset → Token generated → Hashed → Stored
2. Email sent with plain token (one-time use)
3. User clicks link → Token verified → Password reset
4. Token marked as `used = true` (prevents reuse)

---

### 9. password_reset_rate_limits

**Purpose**: Prevent password reset abuse.

```sql
CREATE TABLE password_reset_rate_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE,
  request_count integer DEFAULT 0,
  window_start timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

**Limits**: 3 requests per 15-minute window

---

### 10. admin_users

**Purpose**: Stores admin dashboard access list.

```sql
CREATE TABLE admin_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE,
  created_at timestamptz DEFAULT now()
);
```

**Current Admins**: 1 user (`devprahulmirji@gmail.com`)

**RLS Policies**:

- ✅ Anyone can SELECT (to check if they're admin)
- ✅ Only service role can INSERT/UPDATE/DELETE

---

## 🔗 Relationships & Foreign Keys

### What is a Foreign Key?

A **Foreign Key** is a field that links one table to another. It ensures **referential integrity** - you can't have orphaned data.

### Visual Relationship Map

```
auth.users (id)
    │
    ├─→ user_profiles.user_id (1:1)
    ├─→ app_settings.user_id (1:1)
    ├─→ analysis_history.user_id (1:many)
    ├─→ product_recommendations.user_id (1:many)
    └─→ activity_logs.user_id (1:many)

analysis_history (id)
    └─→ product_recommendations.analysis_id (1:many)
```

### Relationship Types

#### 1️⃣ One-to-One (1:1)

**Example**: `auth.users` ↔ `user_profiles`

- Each user has exactly ONE profile
- Each profile belongs to exactly ONE user

```sql
-- Enforced by UNIQUE constraint
user_profiles.user_id REFERENCES auth.users(id)
```

#### 2️⃣ One-to-Many (1:many)

**Example**: `auth.users` ↔ `analysis_history`

- Each user can have MANY analyses
- Each analysis belongs to ONE user

```sql
analysis_history.user_id REFERENCES auth.users(id)
```

#### 3️⃣ Many-to-Many (many:many)

**Example**: Not currently used in your schema

- Would require a "junction table"
- Example: Users ↔ Tags (users can have many tags, tags can have many users)

### Cascade Behavior

**What happens when a user is deleted?**

```sql
-- When auth.users.id is deleted:
1. user_profiles WHERE user_id = deleted_id → DELETED (CASCADE)
2. app_settings WHERE user_id = deleted_id → DELETED (CASCADE)
3. analysis_history WHERE user_id = deleted_id → DELETED (CASCADE)
4. product_recommendations WHERE user_id = deleted_id → DELETED (CASCADE)
5. activity_logs WHERE user_id = deleted_id → DELETED (CASCADE)
```

This is handled automatically by your Foreign Key constraints with `ON DELETE CASCADE`.

---

## 🔒 Row Level Security (RLS)

### What is RLS?

**Row Level Security** is PostgreSQL's way of adding **security rules at the database level**. Instead of checking permissions in your app code, the database itself enforces who can see what.

### How RLS Works

```
User → JWT Token → Supabase API → PostgreSQL
                                      │
                                      ├─ Checks RLS Policy
                                      ├─ Evaluates auth.uid()
                                      └─ Returns allowed rows only
```

### RLS Concepts

#### auth.uid()

- Built-in function that returns the currently authenticated user's ID
- Extracted from the JWT token
- Returns `NULL` if not authenticated

#### Policy Structure

```sql
CREATE POLICY "policy_name"
ON table_name
FOR operation -- SELECT, INSERT, UPDATE, DELETE, ALL
USING (condition) -- When can you see rows?
WITH CHECK (condition); -- When can you modify rows?
```

### Your RLS Policies

#### user_profiles

```sql
-- SELECT Policy
CREATE POLICY "Users can view their own profile"
ON user_profiles FOR SELECT
USING (auth.uid() = user_id);
-- Translation: You can only SELECT rows where your user_id matches

-- INSERT Policy
CREATE POLICY "Users can insert their own profile"
ON user_profiles FOR INSERT
WITH CHECK (auth.uid() = user_id);
-- Translation: You can only INSERT if user_id is your own ID

-- UPDATE Policy
CREATE POLICY "Users can update their own profile"
ON user_profiles FOR UPDATE
USING (auth.uid() = user_id);
-- Translation: You can only UPDATE rows where your user_id matches
```

#### analysis_history

```sql
-- SELECT
CREATE POLICY "Users can view their own history"
ON analysis_history FOR SELECT
USING (auth.uid() = user_id);

-- INSERT
CREATE POLICY "Users can insert their own history"
ON analysis_history FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- UPDATE
CREATE POLICY "Users can update their own history"
ON analysis_history FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- DELETE
CREATE POLICY "Users can delete their own history"
ON analysis_history FOR DELETE
USING (auth.uid() = user_id);
```

#### admin_users

```sql
-- Anyone can check if they're admin
CREATE POLICY "Allow authenticated users to check admin status"
ON admin_users FOR SELECT
USING (true); -- true = everyone

-- Only service role can modify
CREATE POLICY "Only service role can manage admin users"
ON admin_users FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (true);
```

#### Service Role Tables

These tables are **only accessible via Edge Functions** (using service_role key):

- `otp_verifications`
- `otp_rate_limits`
- `password_reset_tokens`
- `password_reset_rate_limits`

```sql
CREATE POLICY "Service role only access"
ON table_name FOR ALL
USING (auth.role() = 'service_role');
```

### RLS Status

| Table                      | RLS Enabled | Public Access                  |
| -------------------------- | ----------- | ------------------------------ |
| user_profiles              | ✅ Yes      | Own data only                  |
| app_settings               | ✅ Yes      | Own data only                  |
| analysis_history           | ✅ Yes      | Own data only                  |
| activity_logs              | ✅ Yes      | Own data only                  |
| product_recommendations    | ✅ Yes      | Own data only                  |
| otp_verifications          | ✅ Yes      | Service role only              |
| otp_rate_limits            | ✅ Yes      | Service role only              |
| password_reset_tokens      | ✅ Yes      | Service role only              |
| password_reset_rate_limits | ✅ Yes      | Service role only              |
| admin_users                | ✅ Yes      | Read: All, Write: Service role |

---

## ⚡ Edge Functions

### What are Edge Functions?

**Edge Functions** are serverless functions that run on Supabase's infrastructure. Think of them as mini-backend APIs.

**Benefits**:

- Run on Deno (secure TypeScript runtime)
- Auto-scaling (handles any load)
- Built-in authentication
- Can use service_role key (bypasses RLS)

### Your Edge Functions

#### 1. send-otp

**Purpose**: Send OTP email for signup verification

**Endpoint**: `https://wmhiwieooqfwkrdcvqvb.supabase.co/functions/v1/send-otp`

**Flow**:

```
POST /send-otp
Body: { email: "user@example.com" }
    ↓
1. Check rate limits (3 per 15 min)
2. Generate random 6-digit OTP
3. Hash OTP using bcrypt
4. Store in otp_verifications
5. Send email via Resend API
6. Return success
```

**Security**:

- Rate limiting per email
- OTP expires in 10 minutes
- Maximum 5 verification attempts
- Hashed storage (never plain text)

---

#### 2. verify-otp-signup

**Purpose**: Verify OTP and create user account

**Endpoint**: `https://wmhiwieooqfwkrdcvqvb.supabase.co/functions/v1/verify-otp-signup`

**Flow**:

```
POST /verify-otp-signup
Body: {
  email: "user@example.com",
  otp: "123456",
  password: "securepass",
  name: "John Doe"
}
    ↓
1. Fetch stored OTP hash
2. Compare with provided OTP
3. Check expiry & attempts
4. Create auth.users (Supabase Auth)
5. Create user_profiles
6. Create app_settings
7. Delete OTP record
8. Return JWT token
```

---

#### 3. send-password-reset

**Purpose**: Send password reset email

**Endpoint**: `https://wmhiwieooqfwkrdcvqvb.supabase.co/functions/v1/send-password-reset`

**Flow**:

```
POST /send-password-reset
Body: { email: "user@example.com" }
    ↓
1. Check rate limits
2. Verify email exists in auth.users
3. Generate secure token (UUID)
4. Hash token
5. Store in password_reset_tokens
6. Send email with reset link
7. Link: yourapp.com/reset?token=abc123
```

---

#### 4. verify-password-reset

**Purpose**: Verify reset token and update password

**Endpoint**: `https://wmhiwieooqfwkrdcvqvb.supabase.co/functions/v1/verify-password-reset`

**Flow**:

```
POST /verify-password-reset
Body: {
  token: "abc123",
  newPassword: "newsecurepass"
}
    ↓
1. Hash provided token
2. Find matching token in DB
3. Check expiry (1 hour)
4. Check if already used
5. Update user password in auth.users
6. Mark token as used
7. Delete token
8. Return success
```

---

#### 5. admin-delete-user

**Purpose**: Delete user (admin only)

**Endpoint**: `https://wmhiwieooqfwkrdcvqvb.supabase.co/functions/v1/admin-delete-user`

**Flow**:

```
POST /admin-delete-user
Headers: { x-admin-email: "admin@example.com" }
Body: { userId: "uuid" }
    ↓
1. Verify admin email in admin_users
2. Delete from auth.users (cascades to all tables)
3. Return success
```

**Why Edge Function?**

- Needs service_role to delete from auth.users
- Client can't access auth schema directly

---

#### 6. admin-get-users

**Purpose**: Fetch all users (bypassing RLS for admin)

**Endpoint**: `https://wmhiwieooqfwkrdcvqvb.supabase.co/functions/v1/admin-get-users`

**Flow**:

```
POST /admin-get-users
Headers: { x-admin-email: "admin@example.com" }
Body: {
  searchQuery: "john",
  gender: "male",
  sortField: "created_at",
  sortOrder: "desc"
}
    ↓
1. Verify admin email in admin_users
2. Query user_profiles with service_role (bypasses RLS)
3. Apply filters (search, gender)
4. Apply sorting
5. Return all users
```

**Why Edge Function?**

- RLS blocks admins from seeing all users
- Service role bypasses RLS
- Validates admin before allowing access

---

### Edge Function Architecture

```
Client App
    ↓ POST request
Supabase Edge Runtime (Deno)
    ↓
┌─────────────────────────┐
│ Edge Function           │
│                         │
│ 1. Validate Request     │
│ 2. Check Permissions    │
│ 3. Use service_role key │ ← Bypasses RLS
│ 4. Database Operations  │
│ 5. Send Emails          │
│ 6. Return Response      │
└─────────────────────────┘
    ↓
PostgreSQL Database
    ↓
Response to Client
```

---

## 📦 Storage Buckets

### What is Supabase Storage?

File storage service similar to AWS S3. Stores images, videos, documents with CDN delivery.

### Your Buckets

#### user-images

**Purpose**: Store user profile images

**Structure**:

```
user-images/
└── profiles/
    └── {user_id}/
        └── {user_id}_{timestamp}_{random}.jpg
```

**Example URL**:

```
https://wmhiwieooqfwkrdcvqvb.supabase.co/storage/v1/object/public/user-images/profiles/bc039738-89d5-4d73-bb70-67312ea7cf65/bc039738-89d5-4d73-bb70-67312ea7cf65_1760108698729_mipq7ud.jpg
```

**RLS Policies** (Storage has its own RLS):

```sql
-- Anyone can read
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'user-images');

-- Users can upload to their own folder
CREATE POLICY "Users can upload own images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'user-images' AND
  (storage.foldername(name))[1] = 'profiles' AND
  (storage.foldername(name))[2] = auth.uid()::text
);
```

---

## 🛡️ Security Best Practices

### 1. Never Expose Service Role Key

❌ **NEVER DO THIS**:

```javascript
const supabase = createClient(url, SERVICE_ROLE_KEY); // In client code!
```

✅ **DO THIS**:

```javascript
const supabase = createClient(url, ANON_KEY); // Client uses anon key
// Use Edge Functions with service role when needed
```

**Why?**

- Service role bypasses ALL security
- Anyone with service role key can access/delete ANYTHING
- Keep it in Edge Functions only (server-side)

---

### 2. Always Use RLS

Every table should have RLS enabled:

```sql
-- Enable RLS
ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users see own data"
ON table_name FOR SELECT
USING (auth.uid() = user_id);
```

**Without RLS**: Anyone can read/write ANY row  
**With RLS**: Users can only access their own data

---

### 3. Hash Sensitive Data

Never store plain text passwords or tokens:

```javascript
// ❌ BAD
await supabase.from("otp_verifications").insert({
  email: "user@example.com",
  otp: "123456", // Plain text!
});

// ✅ GOOD
import bcrypt from "bcrypt";
const hashedOTP = await bcrypt.hash("123456", 10);
await supabase.from("otp_verifications").insert({
  email: "user@example.com",
  otp_hash: hashedOTP, // Hashed!
});
```

---

### 4. Use Rate Limiting

Prevent abuse with rate limit tables:

```javascript
// Check rate limit before allowing action
const { data: rateLimit } = await supabase
  .from("otp_rate_limits")
  .select("*")
  .eq("email", email)
  .single();

if (rateLimit && rateLimit.request_count >= 3) {
  throw new Error("Too many requests. Try again later.");
}
```

---

### 5. Validate Input

Always validate user input before database operations:

```javascript
// ❌ BAD
const { email, password } = req.body;
// No validation!

// ✅ GOOD
const { email, password } = req.body;
if (!email || !email.includes("@")) {
  throw new Error("Invalid email");
}
if (!password || password.length < 8) {
  throw new Error("Password must be at least 8 characters");
}
```

---

### 6. Use Transactions

For operations that need to be atomic (all-or-nothing):

```sql
BEGIN;
  INSERT INTO analysis_history (...) VALUES (...);
  INSERT INTO product_recommendations (...) VALUES (...);
COMMIT; -- Both succeed or both fail
```

---

### 7. Clean Up Expired Data

Use periodic cleanup for temporary data:

```sql
-- Delete expired OTPs (run daily)
DELETE FROM otp_verifications
WHERE expires_at < NOW();

-- Delete used password reset tokens (run daily)
DELETE FROM password_reset_tokens
WHERE used = true AND used_at < NOW() - INTERVAL '7 days';
```

---

## 🛠️ Common Operations

### Query Examples

#### Get User Profile

```javascript
const { data, error } = await supabase
  .from("user_profiles")
  .select("*")
  .eq("user_id", userId)
  .single();
```

#### Create Analysis with Products

```javascript
// Start transaction
const { data: analysis, error: analysisError } = await supabase
  .from('analysis_history')
  .insert({
    user_id: userId,
    type: 'outfit_score',
    image_url: imageUrl,
    result: 'Your outfit scores 85/100',
    score: 85,
    feedback: { strengths: [...], improvements: [...] }
  })
  .select()
  .single();

if (analysisError) throw analysisError;

// Insert related products
const { error: productsError } = await supabase
  .from('product_recommendations')
  .insert(
    products.map(p => ({
      analysis_id: analysis.id,
      user_id: userId,
      item_type: p.type,
      product_name: p.name,
      product_url: p.url,
      marketplace: p.marketplace,
      price: p.price
    }))
  );
```

#### Search Users (Admin)

```javascript
// Via Edge Function
const { data, error } = await supabase.functions.invoke("admin-get-users", {
  body: {
    searchQuery: "john",
    gender: "male",
    sortField: "created_at",
    sortOrder: "desc",
  },
  headers: {
    "x-admin-email": adminEmail,
  },
});
```

#### Update User Settings

```javascript
const { error } = await supabase
  .from("app_settings")
  .update({ is_dark_mode: true, use_cloud_ai: false })
  .eq("user_id", userId);
```

#### Delete Analysis History

```javascript
const { error } = await supabase
  .from("analysis_history")
  .delete()
  .eq("id", analysisId)
  .eq("user_id", userId); // Security: only delete own data
```

---

## 🐛 Troubleshooting Guide

### Common Errors

#### 1. "permission denied for table X"

**Cause**: RLS is blocking your query

**Solutions**:

```javascript
// Check if user is authenticated
const { data: { session } } = await supabase.auth.getSession();
console.log('Session:', session); // Should not be null

// Check RLS policies
// Run in SQL editor:
SELECT * FROM pg_policies WHERE tablename = 'your_table';

// For admin operations, use Edge Functions with service_role
```

#### 2. "new row violates row-level security policy"

**Cause**: Trying to insert data for another user

**Solution**:

```javascript
// ❌ BAD
await supabase.from("user_profiles").insert({
  user_id: "some-other-user-id", // Not your ID!
  name: "John",
});

// ✅ GOOD
const {
  data: { user },
} = await supabase.auth.getUser();
await supabase.from("user_profiles").insert({
  user_id: user.id, // Your own ID
  name: "John",
});
```

#### 3. "Foreign key constraint violation"

**Cause**: Referenced row doesn't exist

**Solution**:

```javascript
// Make sure parent record exists first
const { data: user } = await supabase
  .from('user_profiles')
  .select('id')
  .eq('user_id', userId)
  .single();

if (!user) {
  throw new Error('User profile must be created first');
}

// Now can create related record
await supabase.from('analysis_history').insert({
  user_id: userId,
  ...
});
```

#### 4. "JWT expired"

**Cause**: Session token expired

**Solution**:

```javascript
// Supabase auto-refreshes, but you can manually refresh:
const { data, error } = await supabase.auth.refreshSession();
if (error) {
  // Re-authenticate user
  router.push("/auth/sign-in");
}
```

#### 5. "duplicate key value violates unique constraint"

**Cause**: Trying to insert duplicate value in UNIQUE column

**Solution**:

```javascript
// Use upsert instead of insert
const { error } = await supabase.from("app_settings").upsert(
  {
    user_id: userId,
    is_dark_mode: true,
  },
  {
    onConflict: "user_id", // Update if exists
  }
);
```

---

## 📈 Performance Tips

### 1. Use Indexes

Indexes speed up queries on commonly searched columns:

```sql
-- Already created by default on:
- Primary keys (id)
- Foreign keys (user_id, analysis_id)
- Unique columns (email)

-- Create custom indexes if needed:
CREATE INDEX idx_analysis_created_at
ON analysis_history(created_at DESC);

CREATE INDEX idx_products_marketplace
ON product_recommendations(marketplace);
```

### 2. Limit Results

Always limit queries when you don't need all rows:

```javascript
// ❌ Slow (returns all rows)
const { data } = await supabase.from("analysis_history").select("*");

// ✅ Fast (returns only 10)
const { data } = await supabase
  .from("analysis_history")
  .select("*")
  .order("created_at", { ascending: false })
  .limit(10);
```

### 3. Select Only Needed Columns

```javascript
// ❌ Wasteful
const { data } = await supabase.from("analysis_history").select("*"); // Returns all columns including large JSONB

// ✅ Efficient
const { data } = await supabase
  .from("analysis_history")
  .select("id, type, score, created_at"); // Only what you need
```

### 4. Use JSONB Operators

Query inside JSONB fields efficiently:

```javascript
// Find analyses with specific feedback
const { data } = await supabase
  .from("analysis_history")
  .select("*")
  .contains("feedback", { category: "color" });
```

---

## 📝 Database Maintenance Checklist

### Daily

- [ ] Monitor error logs in Supabase Dashboard
- [ ] Check storage usage
- [ ] Review Edge Function invocations

### Weekly

- [ ] Clean up expired OTP records
- [ ] Clean up used password reset tokens
- [ ] Review rate limit records

### Monthly

- [ ] Backup database (Supabase auto-backups, but verify)
- [ ] Review and optimize slow queries
- [ ] Check for orphaned records
- [ ] Review user growth and storage needs

### Quarterly

- [ ] Audit RLS policies
- [ ] Review Edge Function code for security updates
- [ ] Check for unused indexes
- [ ] Plan for scaling if needed

---

## 🎓 Key Terms Glossary

| Term              | Definition                                         | Example                                |
| ----------------- | -------------------------------------------------- | -------------------------------------- |
| **RLS**           | Row Level Security - Database-level access control | `auth.uid() = user_id`                 |
| **Foreign Key**   | Column linking to another table's primary key      | `user_id → auth.users.id`              |
| **Primary Key**   | Unique identifier for each row                     | `id uuid PRIMARY KEY`                  |
| **JSONB**         | JSON data type that can be queried efficiently     | `feedback jsonb`                       |
| **UUID**          | Universally Unique Identifier (36-char string)     | `550e8400-e29b-41d4-a716-446655440000` |
| **JWT**           | JSON Web Token - Encrypted authentication token    | `eyJhbGciOiJIUzI1NiIs...`              |
| **Service Role**  | Admin key that bypasses all RLS                    | Use in Edge Functions only!            |
| **Anon Key**      | Public key with RLS enforced                       | Use in client apps                     |
| **Edge Function** | Serverless function on Supabase infrastructure     | `/functions/v1/send-otp`               |
| **Cascade**       | Automatic deletion of related records              | Delete user → delete profiles          |
| **Policy**        | RLS rule defining access permissions               | `USING (auth.uid() = user_id)`         |
| **Transaction**   | Group of operations that succeed/fail together     | `BEGIN; ... COMMIT;`                   |
| **Index**         | Database structure speeding up queries             | `CREATE INDEX idx_email`               |
| **Migration**     | SQL script to change database schema               | `ALTER TABLE ADD COLUMN`               |

---

## 🚀 Next Steps

### For Development

1. **Test RLS Policies**: Create test users and verify they can't access others' data
2. **Monitor Performance**: Use Supabase Dashboard to track slow queries
3. **Set Up Alerts**: Configure email alerts for errors in Edge Functions
4. **Document Changes**: Update this file when adding new tables/functions

### For Production

1. **Enable Point-in-Time Recovery**: Supabase Dashboard → Database → Backups
2. **Set Up Custom Domain**: For Edge Functions (optional)
3. **Configure Email Templates**: Customize OTP and password reset emails
4. **Enable Database Logs**: Track all queries for debugging
5. **Set Up Monitoring**: Sentry or similar for error tracking

---

## 📞 Support Resources

- **Supabase Docs**: https://supabase.com/docs
- **PostgreSQL Docs**: https://www.postgresql.org/docs/
- **Your Database Dashboard**: https://supabase.com/dashboard/project/wmhiwieooqfwkrdcvqvb
- **RLS Guide**: https://supabase.com/docs/guides/auth/row-level-security
- **Edge Functions Guide**: https://supabase.com/docs/guides/functions

---

## 🎉 Conclusion

You now have a complete understanding of your database architecture! This document covers:

✅ All 10 tables with detailed explanations  
✅ Foreign key relationships and data flow  
✅ Row Level Security policies  
✅ 6 Edge Functions with security flows  
✅ Storage buckets and file management  
✅ Security best practices  
✅ Common operations and troubleshooting  
✅ Performance optimization tips

**Remember**: Your database is the heart of your application. Understanding it deeply will help you build better features, debug faster, and scale confidently!

---

**Created by:** GitHub Copilot  
**For:** AI DressUp Application  
**Date:** October 11, 2025  
**Version:** 1.0
