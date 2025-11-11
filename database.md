# 🗄️ Database Documentation - Style GPT

**Last Updated**: November 5, 2025  
**Platform**: Supabase (PostgreSQL 13.0.5)  
**Database URL**: `https://wmhiwieooqfwkrdcvqvb.supabase.co`  
**Type Safety**: Auto-generated TypeScript types

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Database Schema](#database-schema)
3. [Tables Documentation](#tables-documentation)
4. [Relationships](#relationships)
5. [Migrations](#migrations)
6. [Storage Buckets](#storage-buckets)
7. [Row Level Security (RLS)](#row-level-security-rls)
8. [Database Functions](#database-functions)
9. [TypeScript Types](#typescript-types)

---

## 🎯 Overview

The application uses **Supabase** (managed PostgreSQL) for all database operations. Supabase provides:

- ✅ **PostgreSQL 13.0.5** - Reliable relational database
- ✅ **Row Level Security (RLS)** - Fine-grained access control
- ✅ **Real-time subscriptions** - Live data updates
- ✅ **Storage** - S3-compatible file storage
- ✅ **Auth** - Built-in authentication system
- ✅ **Edge Functions** - Serverless functions (Deno runtime)
- ✅ **Auto-generated types** - TypeScript type safety

### Database Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Supabase PostgreSQL                       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐ │
│  │   auth       │    │   public     │    │   storage    │ │
│  │   schema     │    │   schema     │    │   buckets    │ │
│  │              │    │              │    │              │ │
│  │ • users      │    │ • user_      │    │ • profile-   │ │
│  │              │    │   profiles   │    │   images     │ │
│  │              │    │ • analysis_  │    │ • outfit-    │ │
│  │              │    │   history    │    │   images     │ │
│  │              │    │ • product_   │    │ • stylist-   │ │
│  │              │    │   recommend  │    │   images     │ │
│  │              │    │ • admin_     │    │              │ │
│  │              │    │   users      │    │              │ │
│  │              │    │ • activity_  │    │              │ │
│  │              │    │   logs       │    │              │ │
│  │              │    │ • app_       │    │              │ │
│  │              │    │   settings   │    │              │ │
│  └──────────────┘    └──────────────┘    └──────────────┘ │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 📊 Database Schema

### Schema Overview

```sql
-- All application tables are in the public schema
CREATE SCHEMA IF NOT EXISTS public;

-- Tables
public.user_profiles          -- User profile data
public.analysis_history       -- Outfit analyses & AI chat sessions
public.product_recommendations -- Product recommendations
public.admin_users            -- Admin authorization
public.activity_logs          -- User activity tracking
public.app_settings           -- User app preferences
```

### Entity Relationship Diagram

```
┌─────────────────┐
│   auth.users    │ (Supabase Auth)
│                 │
│ • id (UUID)     │
│ • email         │
└────────┬────────┘
         │
         │ 1:1
         │
         ▼
┌─────────────────────┐
│  user_profiles      │
│                     │
│ • id (PK)           │
│ • user_id (FK)      │◄───────┐
│ • name              │         │
│ • email             │         │
│ • phone             │         │
│ • age               │         │
│ • gender            │         │
│ • bio               │         │
│ • profile_image     │         │
│ • credits_remaining │         │
│ • subscription_plan │         │
└──────────┬──────────┘         │
           │                    │
           │ 1:N                │
           │                    │
           ▼                    │
┌──────────────────────┐        │
│  analysis_history    │        │
│                      │        │
│ • id (PK)            │        │
│ • user_id (FK)       │────────┘
│ • type               │
│ • image_url          │
│ • result             │
│ • score              │
│ • conversation_data  │
│ • feedback           │
└──────────┬───────────┘
           │
           │ 1:N
           │
           ▼
┌──────────────────────────┐
│  product_recommendations │
│                          │
│ • id (PK)                │
│ • analysis_id (FK)       │
│ • user_id (FK)           │
│ • product_name           │
│ • product_url            │
│ • product_image_url      │
│ • price                  │
│ • marketplace            │
│ • item_type              │
└──────────────────────────┘

┌─────────────────┐
│  admin_users    │ (No FK, standalone)
│                 │
│ • id (PK)       │
│ • email (UQ)    │
└─────────────────┘

┌─────────────────┐
│ activity_logs   │ (Audit trail)
│                 │
│ • id (PK)       │
│ • user_id       │
│ • action        │
│ • metadata      │
└─────────────────┘
```

---

## 📋 Tables Documentation

### 1. user_profiles

**Purpose**: Store user profile information and subscription data

**Schema**:
```sql
CREATE TABLE public.user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  age INTEGER CHECK (age >= 13 AND age <= 120),
  gender TEXT CHECK (gender IN ('male', 'female', 'other', '')),
  bio TEXT,
  profile_image TEXT,
  credits_remaining INTEGER DEFAULT 5,
  subscription_plan TEXT DEFAULT 'free' CHECK (subscription_plan IN ('free', 'pro')),
  subscription_expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Columns**:

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | UUID | No | gen_random_uuid() | Primary key |
| `user_id` | UUID | Yes | - | FK to auth.users |
| `name` | TEXT | No | - | User's full name |
| `email` | TEXT | No | - | User's email |
| `phone` | TEXT | Yes | - | Phone number |
| `age` | INTEGER | Yes | - | User's age (13-120) |
| `gender` | TEXT | Yes | - | 'male', 'female', 'other' |
| `bio` | TEXT | Yes | - | User bio/description |
| `profile_image` | TEXT | Yes | - | URL to profile image |
| `credits_remaining` | INTEGER | No | 5 | Outfit analysis credits |
| `subscription_plan` | TEXT | No | 'free' | 'free' or 'pro' |
| `subscription_expires_at` | TIMESTAMPTZ | Yes | - | Pro expiration date |
| `created_at` | TIMESTAMPTZ | No | NOW() | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | No | NOW() | Last update timestamp |

**Indexes**:
```sql
CREATE INDEX idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX idx_user_profiles_subscription ON user_profiles(subscription_plan);
CREATE INDEX idx_user_profiles_credits ON user_profiles(credits_remaining);
```

**RLS Policies**:
```sql
-- Users can read their own profile
CREATE POLICY "Users can read own profile"
  ON user_profiles FOR SELECT
  USING (auth.uid() = user_id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can insert their own profile
CREATE POLICY "Users can insert own profile"
  ON user_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);
```

---

### 2. analysis_history

**Purpose**: Store outfit analyses and AI stylist chat sessions

**Schema**:
```sql
CREATE TABLE public.analysis_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('outfit', 'stylist')),
  image_url TEXT,
  result TEXT NOT NULL,
  score NUMERIC(5,2) CHECK (score >= 0 AND score <= 100),
  conversation_data JSONB,
  feedback JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Columns**:

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | UUID | No | Primary key |
| `user_id` | UUID | Yes | FK to auth.users |
| `type` | TEXT | No | 'outfit' or 'stylist' |
| `image_url` | TEXT | Yes | URL to analyzed image |
| `result` | TEXT | No | AI analysis result |
| `score` | NUMERIC | Yes | Outfit score (0-100) |
| `conversation_data` | JSONB | Yes | Chat messages (AI Stylist) |
| `feedback` | JSONB | Yes | User feedback |
| `created_at` | TIMESTAMPTZ | No | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | No | Last update timestamp |

**JSON Structure Examples**:

**conversation_data** (AI Stylist):
```json
{
  "messages": [
    {
      "role": "user",
      "content": "How does this look?",
      "timestamp": "2025-11-05T10:30:00Z"
    },
    {
      "role": "assistant",
      "content": "That outfit looks great! The colors complement each other well.",
      "timestamp": "2025-11-05T10:30:15Z"
    }
  ],
  "sessionId": "session_abc123",
  "imageUrl": "https://storage.supabase.co/..."
}
```

**feedback** (Outfit Scorer):
```json
{
  "strengths": [
    "Good color coordination",
    "Professional appearance",
    "Well-fitted clothes"
  ],
  "improvements": [
    "Consider adding a belt",
    "Try different shoe color"
  ],
  "missingItems": ["belt", "watch"]
}
```

**Indexes**:
```sql
CREATE INDEX idx_analysis_history_user_id ON analysis_history(user_id);
CREATE INDEX idx_analysis_history_type ON analysis_history(type);
CREATE INDEX idx_analysis_history_created_at ON analysis_history(created_at DESC);
```

**RLS Policies**:
```sql
-- Users can read their own analysis history
CREATE POLICY "Users can read own history"
  ON analysis_history FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own analyses
CREATE POLICY "Users can insert own analyses"
  ON analysis_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own history
CREATE POLICY "Users can delete own history"
  ON analysis_history FOR DELETE
  USING (auth.uid() = user_id);
```

---

### 3. product_recommendations

**Purpose**: Store product recommendations from outfit analysis

**Schema**:
```sql
CREATE TABLE public.product_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_id UUID NOT NULL REFERENCES analysis_history(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_name TEXT NOT NULL,
  product_url TEXT NOT NULL,
  product_image_url TEXT NOT NULL,
  price TEXT,
  marketplace TEXT NOT NULL,
  item_type TEXT NOT NULL,
  rating NUMERIC(3,2) CHECK (rating >= 0 AND rating <= 5),
  priority INTEGER CHECK (priority >= 1 AND priority <= 10),
  missing_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Columns**:

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | UUID | No | Primary key |
| `analysis_id` | UUID | No | FK to analysis_history |
| `user_id` | UUID | No | FK to auth.users |
| `product_name` | TEXT | No | Product title |
| `product_url` | TEXT | No | Amazon/shopping URL |
| `product_image_url` | TEXT | No | Product image URL |
| `price` | TEXT | Yes | Price string (e.g., "$29.99") |
| `marketplace` | TEXT | No | 'Amazon', 'Flipkart', etc. |
| `item_type` | TEXT | No | 'belt', 'watch', 'shoes', etc. |
| `rating` | NUMERIC | Yes | Product rating (0-5) |
| `priority` | INTEGER | Yes | Recommendation priority (1-10) |
| `missing_reason` | TEXT | Yes | Why this item is recommended |
| `created_at` | TIMESTAMPTZ | No | Creation timestamp |

**Indexes**:
```sql
CREATE INDEX idx_product_recommendations_analysis_id ON product_recommendations(analysis_id);
CREATE INDEX idx_product_recommendations_user_id ON product_recommendations(user_id);
CREATE INDEX idx_product_recommendations_item_type ON product_recommendations(item_type);
```

**RLS Policies**:
```sql
-- Users can read recommendations for their analyses
CREATE POLICY "Users can read own recommendations"
  ON product_recommendations FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert recommendations for their analyses
CREATE POLICY "Users can insert own recommendations"
  ON product_recommendations FOR INSERT
  WITH CHECK (auth.uid() = user_id);
```

---

### 4. admin_users

**Purpose**: Track authorized admin users for dashboard access

**Schema**:
```sql
CREATE TABLE public.admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Columns**:

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | UUID | No | Primary key |
| `email` | TEXT | No | Admin email (unique) |
| `created_at` | TIMESTAMPTZ | No | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | No | Last update timestamp |

**RLS Policies**:
```sql
-- Authenticated users can check if they're admin
CREATE POLICY "Allow authenticated users to check admin status"
  ON admin_users FOR SELECT
  TO authenticated
  USING (true);

-- Only service role can manage admin users
CREATE POLICY "Only service role can manage admin users"
  ON admin_users FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);
```

**Admin Check Function**:
```sql
CREATE OR REPLACE FUNCTION public.is_admin(user_email TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.admin_users WHERE email = user_email
  );
END;
$$;
```

---

### 5. activity_logs

**Purpose**: Log user and admin activities for audit trail

**Schema**:
```sql
CREATE TABLE public.activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  action TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Columns**:

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | UUID | No | Primary key |
| `user_id` | UUID | Yes | User who performed action |
| `action` | TEXT | No | Action description |
| `metadata` | JSONB | Yes | Additional context |
| `created_at` | TIMESTAMPTZ | No | Action timestamp |

**Example Metadata**:
```json
{
  "ip": "192.168.1.1",
  "userAgent": "Mozilla/5.0...",
  "resource": "user_profiles",
  "resourceId": "abc-123",
  "changes": {
    "before": { "name": "John" },
    "after": { "name": "John Doe" }
  }
}
```

**RLS Policies**:
```sql
-- Only admins can read activity logs
CREATE POLICY "Only admins can read logs"
  ON activity_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  );
```

---

### 6. app_settings

**Purpose**: Store user app preferences

**Schema**:
```sql
CREATE TABLE public.app_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  use_cloud_ai BOOLEAN DEFAULT true,
  save_history BOOLEAN DEFAULT true,
  is_dark_mode BOOLEAN DEFAULT false,
  use_voice_interaction BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Columns**:

| Column | Type | Default | Description |
|--------|------|---------|-------------|
| `id` | UUID | - | Primary key |
| `user_id` | UUID | - | FK to auth.users |
| `use_cloud_ai` | BOOLEAN | true | Use cloud AI services |
| `save_history` | BOOLEAN | true | Save analysis history |
| `is_dark_mode` | BOOLEAN | false | Dark theme preference |
| `use_voice_interaction` | BOOLEAN | false | Voice features enabled |
| `created_at` | TIMESTAMPTZ | NOW() | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | NOW() | Last update timestamp |

**RLS Policies**:
```sql
-- Users can manage their own settings
CREATE POLICY "Users can manage own settings"
  ON app_settings FOR ALL
  USING (auth.uid() = user_id);
```

---

## 🔗 Relationships

### Foreign Key Relationships

```sql
-- user_profiles.user_id → auth.users.id
ALTER TABLE user_profiles
  ADD CONSTRAINT fk_user_profiles_user
  FOREIGN KEY (user_id)
  REFERENCES auth.users(id)
  ON DELETE CASCADE;

-- analysis_history.user_id → auth.users.id
ALTER TABLE analysis_history
  ADD CONSTRAINT fk_analysis_history_user
  FOREIGN KEY (user_id)
  REFERENCES auth.users(id)
  ON DELETE CASCADE;

-- product_recommendations.analysis_id → analysis_history.id
ALTER TABLE product_recommendations
  ADD CONSTRAINT fk_product_recommendations_analysis
  FOREIGN KEY (analysis_id)
  REFERENCES analysis_history(id)
  ON DELETE CASCADE;

-- product_recommendations.user_id → auth.users.id
ALTER TABLE product_recommendations
  ADD CONSTRAINT fk_product_recommendations_user
  FOREIGN KEY (user_id)
  REFERENCES auth.users(id)
  ON DELETE CASCADE;

-- app_settings.user_id → auth.users.id
ALTER TABLE app_settings
  ADD CONSTRAINT fk_app_settings_user
  FOREIGN KEY (user_id)
  REFERENCES auth.users(id)
  ON DELETE CASCADE;
```

### Cascade Behavior

When a user is deleted (`auth.users`):
- ✅ Their profile is deleted (`user_profiles`)
- ✅ All their analyses are deleted (`analysis_history`)
- ✅ All their product recommendations are deleted (`product_recommendations`)
- ✅ Their app settings are deleted (`app_settings`)

When an analysis is deleted:
- ✅ All associated product recommendations are deleted

---

## 📦 Migrations

### Migration Files

Located in `/supabase/migrations/`:

1. **20251011_create_admin_users.sql** - Admin user management
2. **PASSWORD_RESET_SCHEMA.sql** - Password reset tokens
3. **add_credit_system.sql** - Credit tracking columns
4. **allow_admin_delete_payments.sql** - Admin payment permissions
5. **delete_payment_submission.sql** - Payment cleanup
6. **reset_user_to_free.sql** - Reset user subscription
7. **restore_payment_submissions_basic.sql** - Payment table restore
8. **update_payment_submissions_with_profile.sql** - Payment profile link

### Running Migrations

```bash
# Apply all migrations
npx supabase db push

# Create new migration
npx supabase migration new migration_name

# Reset database (DESTRUCTIVE)
npx supabase db reset
```

---

## 📁 Storage Buckets

### Bucket Configuration

**1. profile-images**
```javascript
{
  name: 'profile-images',
  public: true,
  fileSizeLimit: 5242880, // 5MB
  allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp']
}
```

**2. outfit-images**
```javascript
{
  name: 'outfit-images',
  public: false, // Private, user-specific
  fileSizeLimit: 10485760, // 10MB
  allowedMimeTypes: ['image/jpeg', 'image/png']
}
```

**3. stylist-images**
```javascript
{
  name: 'stylist-images',
  public: false,
  fileSizeLimit: 10485760, // 10MB
  allowedMimeTypes: ['image/jpeg', 'image/png']
}
```

### Storage RLS Policies

```sql
-- Users can upload their own profile images
CREATE POLICY "Users can upload own profile images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'profile-images' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Users can read their own outfit images
CREATE POLICY "Users can read own outfit images"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'outfit-images' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );
```

---

## 🔐 Row Level Security (RLS)

### RLS Best Practices

1. ✅ **Enable RLS on all tables**
2. ✅ **Use `auth.uid()` for user isolation**
3. ✅ **Service role bypasses RLS** (backend operations)
4. ✅ **Test policies with different users**
5. ✅ **Use `SECURITY DEFINER` for admin functions**

### Common RLS Patterns

**User owns resource**:
```sql
CREATE POLICY "Users can manage own data"
  ON table_name FOR ALL
  USING (auth.uid() = user_id);
```

**Admin access**:
```sql
CREATE POLICY "Admins can manage all data"
  ON table_name FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  );
```

---

## ⚙️ Database Functions

### 1. is_admin()

Check if user is admin:
```sql
SELECT is_admin('user@example.com'); -- Returns true/false
```

### 2. cleanup_expired_reset_tokens()

Clean up old password reset tokens:
```sql
SELECT cleanup_expired_reset_tokens();
```

### 3. handle_updated_at()

Auto-update `updated_at` timestamp:
```sql
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON table_name
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();
```

---

## 📝 TypeScript Types

### Auto-Generated Types (`types/database.types.ts`)

```typescript
export type Database = {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          id: string;
          user_id: string | null;
          name: string;
          email: string;
          phone: string | null;
          age: number | null;
          gender: string | null;
          bio: string | null;
          profile_image: string | null;
          credits_remaining: number | null;
          subscription_plan: string | null;
          subscription_expires_at: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          // Insert types...
        };
        Update: {
          // Update types...
        };
      };
      // Other tables...
    };
  };
};
```

### Usage

```typescript
import { Database } from '@/types/database.types';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient<Database>(url, key);

// Type-safe queries
const { data } = await supabase
  .from('user_profiles')
  .select('*')
  .eq('user_id', userId)
  .single();
// data is typed as Database['public']['Tables']['user_profiles']['Row']
```

---

## 🎯 Summary

- ✅ **6 Main Tables**: user_profiles, analysis_history, product_recommendations, admin_users, activity_logs, app_settings
- ✅ **3 Storage Buckets**: profile-images, outfit-images, stylist-images
- ✅ **Row Level Security**: All tables protected with RLS policies
- ✅ **Type Safety**: Auto-generated TypeScript types
- ✅ **Migrations**: Version-controlled schema changes
- ✅ **Foreign Keys**: Proper relationships with cascade deletes
- ✅ **Indexes**: Optimized for common queries
- ✅ **JSONB Columns**: Flexible data storage for conversation data

---

**Database Documentation Complete** ✅  
**Total Lines**: 895  
**Coverage**: Complete Supabase database schema and operations
