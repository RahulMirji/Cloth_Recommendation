# Outfit Scorer - Security Audit Report

**Date:** November 12, 2025  
**Feature:** Outfit Scorer  
**Audit Focus:** Hardcoded API endpoints, sensitive data, environment variables  

---

## 🔍 Executive Summary

This audit identifies **hardcoded API endpoints and sensitive data** that should be moved to environment variables or GitHub Secrets for better security and configuration management.

---

## ⚠️ Critical Findings

### 1. **Gemini API Endpoint - HARDCODED**
**File:** `OutfitScorer/utils/geminiAPI.ts`  
**Line:** 72  
**Current Code:**
```typescript
const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
```

**Issue:** 
- API endpoint URL is hardcoded
- API key is passed in query string (visible in logs)

**Recommendation:**
```typescript
// Move to .env
EXPO_PUBLIC_GEMINI_API_ENDPOINT=https://generativelanguage.googleapis.com/v1beta/models
EXPO_PUBLIC_GEMINI_API_KEY=your_key_here

// In code
const baseEndpoint = process.env.EXPO_PUBLIC_GEMINI_API_ENDPOINT;
const url = `${baseEndpoint}/${modelName}:generateContent?key=${apiKey}`;
```

**Priority:** 🔴 HIGH

---

### 2. **Pollinations AI Endpoint - HARDCODED**
**File:** `OutfitScorer/utils/pollinationsAI.ts`  
**Line:** 32, 61  
**Current Code:**
```typescript
const initialUrl = 'https://text.pollinations.ai/openai';
const retryUrl = `https://text.pollinations.ai/openai?token=${encodeURIComponent(token)}`;
```

**Issue:**
- API endpoint is hardcoded
- Bearer token is hardcoded in code: `-GCuD_ey-sBxfDW7`

**Recommendation:**
```typescript
// Move to .env
EXPO_PUBLIC_POLLINATIONS_API_ENDPOINT=https://text.pollinations.ai/openai
EXPO_PUBLIC_POLLINATIONS_API_TOKEN=your_token_here

// In code
const endpoint = process.env.EXPO_PUBLIC_POLLINATIONS_API_ENDPOINT;
const token = process.env.EXPO_PUBLIC_POLLINATIONS_API_TOKEN;
```

**Priority:** 🔴 CRITICAL - **Token is exposed in source code!**

---

### 3. **Supabase URL - HARDCODED FALLBACK**
**File:** `OutfitScorer/utils/supabaseStorage.ts`  
**Line:** 154  
**Current Code:**
```typescript
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://wmhiwieooqfwkrdcvqvb.supabase.co';
```

**Issue:**
- Hardcoded fallback URL exposes your Supabase project ID
- Should fail if env variable is missing (fail-fast principle)

**Recommendation:**
```typescript
// Remove fallback, throw error if missing
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
if (!supabaseUrl) {
  throw new Error('EXPO_PUBLIC_SUPABASE_URL is not configured');
}
```

**Priority:** 🟡 MEDIUM

---

### 4. **Marketplace URLs - HARDCODED**
**File:** `OutfitScorer/utils/productRecommendations.ts`  
**Lines:** 60-62  
**Current Code:**
```typescript
flipkart: `https://www.flipkart.com/search?q=${encodedQuery}`,
amazon: `https://www.amazon.in/s?k=${encodedQuery}`,
meesho: `https://www.meesho.com/search?q=${encodedQuery}`,
```

**Issue:**
- Marketplace URLs are hardcoded
- Cannot easily switch between regions (e.g., amazon.com vs amazon.in)

**Recommendation:**
```typescript
// Move to .env
EXPO_PUBLIC_FLIPKART_SEARCH_URL=https://www.flipkart.com/search?q=
EXPO_PUBLIC_AMAZON_SEARCH_URL=https://www.amazon.in/s?k=
EXPO_PUBLIC_MEESHO_SEARCH_URL=https://www.meesho.com/search?q=

// In code
const baseUrls = {
  flipkart: process.env.EXPO_PUBLIC_FLIPKART_SEARCH_URL,
  amazon: process.env.EXPO_PUBLIC_AMAZON_SEARCH_URL,
  meesho: process.env.EXPO_PUBLIC_MEESHO_SEARCH_URL,
};
```

**Priority:** 🟢 LOW (URLs are public anyway, but good for flexibility)

---

### 5. **Placeholder Image URLs - HARDCODED**
**File:** `OutfitScorer/utils/supabaseStorage.ts`  
**Lines:** 296-302  
**Current Code:**
```typescript
return 'https://via.placeholder.com/400x400.png?text=No+Profile+Image';
return 'https://via.placeholder.com/800x600.png?text=No+Outfit+Image';
return 'https://via.placeholder.com/800x600.png?text=No+Analysis+Image';
```

**Issue:**
- Relies on external service (via.placeholder.com)
- Should use your own hosted placeholders

**Recommendation:**
```typescript
// Move to .env or config file
EXPO_PUBLIC_PLACEHOLDER_PROFILE_URL=https://your-cdn.com/placeholder-profile.png
EXPO_PUBLIC_PLACEHOLDER_OUTFIT_URL=https://your-cdn.com/placeholder-outfit.png
EXPO_PUBLIC_PLACEHOLDER_ANALYSIS_URL=https://your-cdn.com/placeholder-analysis.png
```

**Priority:** 🟢 LOW (nice to have, not critical)

---

### 6. **Unsplash Image URLs - HARDCODED**
**File:** `OutfitScorer/utils/productRecommendations.ts`  
**Lines:** 105-400+ (multiple occurrences)  
**Current Code:**
```typescript
image: 'https://images.unsplash.com/photo-1589756823695-278bc8356084?w=400&h=400&fit=crop'
```

**Issue:**
- Hundreds of hardcoded Unsplash URLs
- No way to update without code changes
- Unsplash has API rate limits

**Recommendation:**
- Consider using a CDN or your own image hosting
- Or move to a config file/database
- Or use Unsplash API with proper API key

**Priority:** 🟡 MEDIUM (functionality works, but maintainability issue)

---

## 📋 Current .env Analysis

### ✅ Already in .env (Good!)
```properties
EXPO_PUBLIC_SUPABASE_URL=https://wmhiwieooqfwkrdcvqvb.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=...
EXPO_PUBLIC_GEMINI_API_KEY=...
EXPO_PUBLIC_WISPHERE_API_KEY=...
```

### ❌ Missing from .env (Should Add!)
```properties
# Gemini API
EXPO_PUBLIC_GEMINI_API_ENDPOINT=https://generativelanguage.googleapis.com/v1beta/models

# Pollinations AI (CRITICAL - token is exposed!)
EXPO_PUBLIC_POLLINATIONS_API_ENDPOINT=https://text.pollinations.ai/openai
EXPO_PUBLIC_POLLINATIONS_API_TOKEN=your_token_here

# Marketplace URLs (optional but good practice)
EXPO_PUBLIC_FLIPKART_SEARCH_URL=https://www.flipkart.com/search?q=
EXPO_PUBLIC_AMAZON_SEARCH_URL=https://www.amazon.in/s?k=
EXPO_PUBLIC_MEESHO_SEARCH_URL=https://www.meesho.com/search?q=

# Placeholder images (optional)
EXPO_PUBLIC_PLACEHOLDER_PROFILE_URL=https://your-cdn.com/placeholder-profile.png
EXPO_PUBLIC_PLACEHOLDER_OUTFIT_URL=https://your-cdn.com/placeholder-outfit.png
EXPO_PUBLIC_PLACEHOLDER_ANALYSIS_URL=https://your-cdn.com/placeholder-analysis.png
```

---

## 🔐 GitHub Secrets Recommendation

For **production builds** (EAS Build, GitHub Actions), move sensitive keys to GitHub Secrets:

### Secrets to Add to GitHub:
1. **`GEMINI_API_KEY`** - Google Gemini API key
2. **`POLLINATIONS_API_TOKEN`** - Pollinations AI token (CRITICAL!)
3. **`SUPABASE_URL`** - Supabase project URL
4. **`SUPABASE_ANON_KEY`** - Supabase anonymous key
5. **`WISPHERE_API_KEY`** - Wisphere/Groq API key

### How to Use in GitHub Actions:
```yaml
# .github/workflows/build.yml
env:
  EXPO_PUBLIC_GEMINI_API_KEY: ${{ secrets.GEMINI_API_KEY }}
  EXPO_PUBLIC_POLLINATIONS_API_TOKEN: ${{ secrets.POLLINATIONS_API_TOKEN }}
  EXPO_PUBLIC_SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
  EXPO_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}
```

### For EAS Build:
```bash
# Set secrets in eas.json
eas secret:create --name GEMINI_API_KEY --value "your-key" --type string
eas secret:create --name POLLINATIONS_API_TOKEN --value "your-token" --type string
```

---

## 📊 Priority Matrix

| Issue | File | Priority | Security Risk | Effort |
|-------|------|----------|---------------|--------|
| Pollinations token exposed | `pollinationsAI.ts` | 🔴 CRITICAL | Very High | Low |
| Gemini API endpoint | `geminiAPI.ts` | 🔴 HIGH | Medium | Low |
| Supabase URL fallback | `supabaseStorage.ts` | 🟡 MEDIUM | Low | Low |
| Marketplace URLs | `productRecommendations.ts` | 🟢 LOW | None | Medium |
| Unsplash URLs | `productRecommendations.ts` | 🟡 MEDIUM | None | High |
| Placeholder URLs | `supabaseStorage.ts` | 🟢 LOW | None | Low |

---

## ✅ Recommended Action Plan

### Phase 1: Immediate (Do Today!)
1. ✅ Add `EXPO_PUBLIC_POLLINATIONS_API_TOKEN` to `.env`
2. ✅ Update `pollinationsAI.ts` to read token from env
3. ✅ Add `EXPO_PUBLIC_POLLINATIONS_API_ENDPOINT` to `.env`
4. ✅ Add GitHub Secret for `POLLINATIONS_API_TOKEN`

### Phase 2: Short-term (This Week)
1. ✅ Add `EXPO_PUBLIC_GEMINI_API_ENDPOINT` to `.env`
2. ✅ Remove hardcoded Supabase URL fallback
3. ✅ Add all API keys to GitHub Secrets
4. ✅ Update CI/CD to inject secrets

### Phase 3: Long-term (Nice to Have)
1. ✅ Move marketplace URLs to env/config
2. ✅ Host your own placeholder images
3. ✅ Consider moving Unsplash URLs to database/config file

---

## 🔒 Security Best Practices

### DO:
✅ Use environment variables for all API keys  
✅ Use GitHub Secrets for CI/CD pipelines  
✅ Use EAS Secrets for production builds  
✅ Fail fast if required env vars are missing  
✅ Use `.gitignore` to exclude `.env` files  
✅ Rotate API keys periodically  

### DON'T:
❌ Hardcode API keys/tokens in source code  
❌ Commit `.env` files to Git  
❌ Use fallback values for sensitive data  
❌ Expose API keys in client-side code (if avoidable)  
❌ Share API keys in screenshots/logs  

---

## 📝 Sample Updated .env File

```properties
# Supabase Configuration
EXPO_PUBLIC_SUPABASE_URL=https://wmhiwieooqfwkrdcvqvb.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here

# AI API Keys
EXPO_PUBLIC_GEMINI_API_KEY=your_gemini_key_here
EXPO_PUBLIC_WISPHERE_API_KEY=your_wisphere_key_here

# AI API Endpoints
EXPO_PUBLIC_GEMINI_API_ENDPOINT=https://generativelanguage.googleapis.com/v1beta/models
EXPO_PUBLIC_POLLINATIONS_API_ENDPOINT=https://text.pollinations.ai/openai
EXPO_PUBLIC_POLLINATIONS_API_TOKEN=your_pollinations_token_here

# Marketplace URLs (optional)
EXPO_PUBLIC_FLIPKART_SEARCH_URL=https://www.flipkart.com/search?q=
EXPO_PUBLIC_AMAZON_SEARCH_URL=https://www.amazon.in/s?k=
EXPO_PUBLIC_MEESHO_SEARCH_URL=https://www.meesho.com/search?q=

# Placeholder Images (optional)
EXPO_PUBLIC_PLACEHOLDER_PROFILE_URL=https://your-cdn.com/placeholder-profile.png
EXPO_PUBLIC_PLACEHOLDER_OUTFIT_URL=https://your-cdn.com/placeholder-outfit.png

# Payment Backend API
EXPO_PUBLIC_API_URL=your_backend_api_url_here

# Rork API Configuration
EXPO_PUBLIC_RORK_API_BASE_URL=https://dev-85o9mg6zkxdpc0bkp2pt8.rorktest.dev
EXPO_PUBLIC_TOOLKIT_URL=https://toolkit.rork.com
```

---

## 🎯 Conclusion

**Outfit Scorer** has **1 CRITICAL security issue** (exposed Pollinations token) and **several hardcoded endpoints** that should be moved to environment variables for better security and maintainability.

**Next Steps:**
1. Immediately fix the Pollinations token exposure
2. Move all API endpoints to .env
3. Set up GitHub Secrets for production
4. Document the new environment variables in README

---

**Audited by:** GitHub Copilot  
**Review Status:** ✅ Complete  
**Next Feature to Audit:** AI Stylist, Virtual Try-On, Image Generator
