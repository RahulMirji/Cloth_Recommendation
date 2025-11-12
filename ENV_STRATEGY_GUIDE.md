# Environment Variables Strategy Guide

**Date:** November 12, 2025  
**Project:** Cloth Recommendation App  
**Current Setup:** 2 separate .env files (frontend + backend)

---

## 📁 Current Structure

```
/Cloth_Recommendation/
├── .env                    # FRONTEND (React Native/Expo)
└── backend/
    └── .env                # BACKEND (Node.js/Express)
```

---

## 🎯 Recommended Strategy: **HYBRID APPROACH**

### Keep Both .env Files + Use GitHub Secrets

**Why this approach?**
- ✅ Frontend and backend have **different needs**
- ✅ Frontend needs `EXPO_PUBLIC_*` prefix (exposed to client)
- ✅ Backend needs server-side secrets (never exposed)
- ✅ GitHub Secrets for CI/CD and production builds
- ✅ Local `.env` for development
- ✅ Clear separation of concerns

---

## 📋 What Goes Where?

### 1️⃣ Frontend `.env` (Root Directory)
**File:** `/Cloth_Recommendation/.env`  
**Purpose:** Client-side environment variables for Expo/React Native  
**Security:** These ARE exposed in the app bundle (use only public/client-safe keys)

```properties
# ============================================
# FRONTEND .ENV - CLIENT-SIDE VARIABLES
# ============================================

# Supabase (Client-side keys - SAFE to expose)
EXPO_PUBLIC_SUPABASE_URL=https://wmhiwieooqfwkrdcvqvb.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here

# AI API Keys (Client-side - consider proxy through backend instead)
EXPO_PUBLIC_GEMINI_API_KEY=your_gemini_key_here
EXPO_PUBLIC_WISPHERE_API_KEY=your_wisphere_key_here

# AI API Endpoints
EXPO_PUBLIC_GEMINI_API_ENDPOINT=https://generativelanguage.googleapis.com/v1beta/models
EXPO_PUBLIC_POLLINATIONS_API_ENDPOINT=https://text.pollinations.ai/openai
EXPO_PUBLIC_POLLINATIONS_API_TOKEN=your_token_here

# Backend API URL (changes per environment)
EXPO_PUBLIC_API_URL=http://localhost:3000

# Rork API (Client-side)
EXPO_PUBLIC_RORK_API_BASE_URL=https://dev-85o9mg6zkxdpc0bkp2pt8.rorktest.dev
EXPO_PUBLIC_TOOLKIT_URL=https://toolkit.rork.com

# Marketplace URLs (Public URLs)
EXPO_PUBLIC_FLIPKART_SEARCH_URL=https://www.flipkart.com/search?q=
EXPO_PUBLIC_AMAZON_SEARCH_URL=https://www.amazon.in/s?k=
EXPO_PUBLIC_MEESHO_SEARCH_URL=https://www.meesho.com/search?q=
```

**Status:** ✅ Keep this file  
**Git:** ✅ Already in `.gitignore`  

---

### 2️⃣ Backend `.env` (Backend Directory)
**File:** `/Cloth_Recommendation/backend/.env`  
**Purpose:** Server-side secrets for Node.js backend  
**Security:** These are NEVER exposed (server-only)

```properties
# ============================================
# BACKEND .ENV - SERVER-SIDE SECRETS
# ============================================

# Supabase (Server-side keys)
SUPABASE_URL=https://wmhiwieooqfwkrdcvqvb.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here  # 🔴 NEVER expose!

# Server Configuration
PORT=3000
NODE_ENV=development

# Razorpay (Payment Gateway - Server-side only!)
RAZORPAY_KEY_ID=rzp_test_xxx
RAZORPAY_KEY_SECRET=your_secret_here  # 🔴 NEVER expose!

# Optional: AI API Keys (if you proxy through backend)
GEMINI_API_KEY=your_key_here
POLLINATIONS_API_TOKEN=your_token_here
```

**Status:** ✅ Keep this file  
**Git:** ✅ Already in `.gitignore`  

---

### 3️⃣ GitHub Secrets (For CI/CD & Production)
**Where:** GitHub Repository → Settings → Secrets and variables → Actions  
**Purpose:** Inject secrets during automated builds without committing them  

#### Frontend Secrets (for EAS Build / Expo):
```
EXPO_PUBLIC_SUPABASE_URL
EXPO_PUBLIC_SUPABASE_ANON_KEY
EXPO_PUBLIC_GEMINI_API_KEY
EXPO_PUBLIC_WISPHERE_API_KEY
EXPO_PUBLIC_POLLINATIONS_API_TOKEN
EXPO_PUBLIC_API_URL (production backend URL)
```

#### Backend Secrets (for deployment):
```
SUPABASE_URL
SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
RAZORPAY_KEY_ID
RAZORPAY_KEY_SECRET
PORT
NODE_ENV
```

---

## 🔒 Security Classification

### 🟢 **PUBLIC** - Safe to expose in frontend
- Supabase URL
- Supabase Anon Key (has RLS protection)
- API endpoints (URLs)
- Marketplace URLs
- Backend API URL

### 🟡 **CLIENT-SIDE API KEYS** - Exposed but rate-limited
- Gemini API Key (has quota limits)
- Wisphere API Key (has rate limits)
- Pollinations Token (free tier)

⚠️ **RECOMMENDATION:** Move these to backend proxy instead!

### 🔴 **SECRET** - NEVER expose in frontend
- Supabase Service Role Key (bypasses RLS!)
- Razorpay Secret Key
- Any database passwords
- JWT secrets
- OAuth client secrets

---

## ⚠️ Critical Security Issues Found

### 🔴 CRITICAL: Exposed in Git History
Your `.env` files contain **real API keys** that I can see. This means:

1. **If these files were ever committed to Git**, the keys are in Git history forever
2. **Anyone with repo access** can see these keys
3. **You need to rotate ALL these keys immediately:**
   - ✅ Supabase Anon Key (regenerate in Supabase dashboard)
   - ✅ Gemini API Key (regenerate in Google AI Studio)
   - ✅ Wisphere API Key (regenerate in Groq Console)
   - ✅ Razorpay Keys (regenerate in Razorpay dashboard)
   - ✅ Pollinations Token (if it was in code)

---

## ✅ Action Plan for Outfit Scorer

### Phase 1: Immediate Security Fixes (Do NOW!)

#### Step 1: Check if secrets were committed to Git
```bash
# Check if .env was ever committed
git log --all --full-history -- .env
git log --all --full-history -- backend/.env

# Check for hardcoded secrets in code
git log -p | grep -i "AIzaSy"  # Gemini key pattern
git log -p | grep -i "gsk_"     # Groq key pattern
```

#### Step 2: Rotate ALL API keys if found in Git history
1. **Supabase:** Dashboard → Settings → API → Regenerate keys
2. **Gemini:** https://aistudio.google.com/app/apikey → Delete old, create new
3. **Wisphere/Groq:** https://console.groq.com/keys → Regenerate
4. **Razorpay:** Dashboard → Generate new keys

#### Step 3: Fix Pollinations Token Exposure
**File:** `OutfitScorer/utils/pollinationsAI.ts`

Update the hardcoded token to read from env:
```typescript
// OLD (line 47)
headers: {
  'Authorization': 'Bearer -GCuD_ey-sBxfDW7',
},

// NEW
headers: {
  'Authorization': `Bearer ${process.env.EXPO_PUBLIC_POLLINATIONS_API_TOKEN || ''}`,
},
```

Add to frontend `.env`:
```properties
EXPO_PUBLIC_POLLINATIONS_API_TOKEN=-GCuD_ey-sBxfDW7
```

#### Step 4: Fix Pollinations Endpoint
**File:** `OutfitScorer/utils/pollinationsAI.ts`

```typescript
// OLD (lines 32, 61)
const initialUrl = 'https://text.pollinations.ai/openai';
const retryUrl = `https://text.pollinations.ai/openai?token=${encodeURIComponent(token)}`;

// NEW
const endpoint = process.env.EXPO_PUBLIC_POLLINATIONS_API_ENDPOINT || 'https://text.pollinations.ai/openai';
const initialUrl = endpoint;
const retryUrl = `${endpoint}?token=${encodeURIComponent(token)}`;
```

Add to frontend `.env`:
```properties
EXPO_PUBLIC_POLLINATIONS_API_ENDPOINT=https://text.pollinations.ai/openai
```

#### Step 5: Fix Gemini Endpoint
**File:** `OutfitScorer/utils/geminiAPI.ts`

```typescript
// OLD (line 72)
const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

// NEW
const baseEndpoint = process.env.EXPO_PUBLIC_GEMINI_API_ENDPOINT || 
                     'https://generativelanguage.googleapis.com/v1beta/models';
const url = `${baseEndpoint}/${modelName}:generateContent?key=${apiKey}`;
```

Add to frontend `.env`:
```properties
EXPO_PUBLIC_GEMINI_API_ENDPOINT=https://generativelanguage.googleapis.com/v1beta/models
```

#### Step 6: Remove Hardcoded Supabase Fallback
**File:** `OutfitScorer/utils/supabaseStorage.ts`

```typescript
// OLD (line 154)
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://wmhiwieooqfwkrdcvqvb.supabase.co';

// NEW (fail-fast approach)
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
if (!supabaseUrl) {
  throw new Error('EXPO_PUBLIC_SUPABASE_URL environment variable is required');
}
```

---

### Phase 2: Set Up GitHub Secrets (This Week)

#### For Frontend (EAS Build):
```bash
# Install EAS CLI if not already installed
npm install -g eas-cli

# Login to Expo
eas login

# Set secrets for production builds
eas secret:create --scope project --name EXPO_PUBLIC_GEMINI_API_KEY --value "your_new_key"
eas secret:create --scope project --name EXPO_PUBLIC_WISPHERE_API_KEY --value "your_new_key"
eas secret:create --scope project --name EXPO_PUBLIC_POLLINATIONS_API_TOKEN --value "your_new_token"
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_URL --value "your_url"
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value "your_new_key"
```

#### For Backend (GitHub Actions):
1. Go to: https://github.com/RahulMirji/Cloth_Recommendation/settings/secrets/actions
2. Click "New repository secret"
3. Add each secret:
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `RAZORPAY_KEY_SECRET`
   - etc.

#### Update GitHub Actions Workflow (if you have one):
```yaml
# .github/workflows/deploy.yml
env:
  EXPO_PUBLIC_GEMINI_API_KEY: ${{ secrets.GEMINI_API_KEY }}
  EXPO_PUBLIC_WISPHERE_API_KEY: ${{ secrets.WISPHERE_API_KEY }}
  EXPO_PUBLIC_SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
  EXPO_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}
```

---

### Phase 3: Best Practices (Ongoing)

#### Create .env.example files (without real values):

**Frontend `.env.example`:**
```properties
# Supabase Configuration
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url_here
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here

# AI API Keys
EXPO_PUBLIC_GEMINI_API_KEY=your_gemini_key_here
EXPO_PUBLIC_WISPHERE_API_KEY=your_wisphere_key_here
EXPO_PUBLIC_POLLINATIONS_API_TOKEN=your_token_here

# Endpoints
EXPO_PUBLIC_GEMINI_API_ENDPOINT=https://generativelanguage.googleapis.com/v1beta/models
EXPO_PUBLIC_POLLINATIONS_API_ENDPOINT=https://text.pollinations.ai/openai

# Backend URL
EXPO_PUBLIC_API_URL=http://localhost:3000
```

**Backend `.env.example`:**
```properties
# Supabase
SUPABASE_URL=your_supabase_url_here
SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Server
PORT=3000
NODE_ENV=development

# Razorpay
RAZORPAY_KEY_ID=your_razorpay_key_id_here
RAZORPAY_KEY_SECRET=your_razorpay_secret_here
```

#### Update README.md:
```markdown
## Environment Setup

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Copy `backend/.env.example` to `backend/.env`:
   ```bash
   cp backend/.env.example backend/.env
   ```

3. Fill in your API keys (see documentation for where to get them)
```

---

## 🎯 Final Recommendation

### ✅ **DO THIS:**
1. **Keep both .env files** (frontend and backend are different)
2. **Add missing variables** to frontend `.env` (Pollinations, Gemini endpoint)
3. **Fix hardcoded secrets** in code (immediate priority!)
4. **Create .env.example** files for both
5. **Set up GitHub Secrets** for production
6. **Rotate all API keys** if they were in Git history

### ❌ **DON'T DO THIS:**
- ❌ Don't merge both .env files into one
- ❌ Don't delete the backend .env
- ❌ Don't commit .env files to Git
- ❌ Don't share API keys in screenshots/docs

---

## 📊 Summary Table

| Variable | Frontend .env | Backend .env | GitHub Secrets | Security Level |
|----------|---------------|--------------|----------------|----------------|
| `EXPO_PUBLIC_SUPABASE_URL` | ✅ | ❌ | ✅ | 🟢 Public |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | ✅ | ❌ | ✅ | 🟢 Public |
| `SUPABASE_SERVICE_ROLE_KEY` | ❌ | ✅ | ✅ | 🔴 Secret |
| `EXPO_PUBLIC_GEMINI_API_KEY` | ✅ | ❌ | ✅ | 🟡 Client-side |
| `EXPO_PUBLIC_POLLINATIONS_API_TOKEN` | ✅ | ❌ | ✅ | 🟡 Client-side |
| `RAZORPAY_KEY_SECRET` | ❌ | ✅ | ✅ | 🔴 Secret |
| `RAZORPAY_KEY_ID` | ❌ | ✅ | ✅ | 🟡 Public ID |

---

## 🚀 Next Steps

1. ✅ Fix the 3 hardcoded issues in Outfit Scorer (Pollinations token, endpoints)
2. ✅ Check Git history for exposed secrets
3. ✅ Rotate API keys if needed
4. ✅ Create .env.example files
5. ✅ Set up GitHub Secrets
6. ✅ Update documentation

**After this, audit the next feature!** 🎯

---

**Questions?**
- Need help rotating keys? → I can guide you
- Need help setting up GitHub Secrets? → I can create the workflow
- Need help with .env.example files? → I can generate them now
