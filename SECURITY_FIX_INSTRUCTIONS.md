# 🚨 CRITICAL: Fix Exposed API Keys in Git History

## Problem
Your `.env` file was committed to Git with real API keys. Google detected this and is blocking ALL new Gemini API keys for this repository.

**Exposed commits:**
- `a948fca` - Nov 9, 2025
- `7b2a743` - Nov 9, 2025  
- `855f63f` - Nov 1, 2025

**Exposed API key:** `AIzaSyCNrcgsuDNzNMrASn9yc7-K-cDKUziM0qw`

---

## 🔥 Solution: Remove .env from Git History

### Step 1: Install BFG Repo-Cleaner (Fastest Method)

```bash
# Install BFG (if you have Homebrew)
brew install bfg

# OR download manually from: https://rtyley.github.io/bfg-repo-cleaner/
```

### Step 2: Backup Your Current Work

```bash
# Create a backup branch
git branch backup-before-cleanup

# Push backup to GitHub (as safety)
git push origin backup-before-cleanup
```

### Step 3: Clean Git History

```bash
# Remove .env file from ALL commits
bfg --delete-files .env

# OR if BFG doesn't work, use git-filter-repo:
# Install: pip3 install git-filter-repo
# Run: git filter-repo --path .env --invert-paths --force
```

### Step 4: Clean up and force push

```bash
# Expire and prune old references
git reflog expire --expire=now --all
git gc --prune=now --aggressive

# Force push to GitHub (⚠️ WARNING: This rewrites history!)
git push origin --force --all
git push origin --force --tags
```

### Step 5: Verify .env is Gone

```bash
# Check if .env still exists in history
git log --all --full-history -- .env

# Should return NOTHING if successful
```

### Step 6: Rotate ALL API Keys

After cleaning Git history, create NEW keys:

1. **Gemini API** - https://aistudio.google.com/app/apikey
   - Delete old key: `AIzaSyCNrcgsuDNzNMrASn9yc7-K-cDKUziM0qw`
   - Create fresh key with NEW Google account

2. **Supabase** - Regenerate in Supabase Dashboard

3. **Groq/Wisphere** - Regenerate in Console

4. **Razorpay** - Regenerate in Dashboard

5. **Pollinations** - Get new token

### Step 7: Update .env with NEW keys

```bash
# Edit .env with your new keys
nano .env

# Verify .env is in .gitignore
cat .gitignore | grep .env
```

### Step 8: Set Up GitHub Secrets for CI/CD

Go to: https://github.com/RahulMirji/Cloth_Recommendation/settings/secrets/actions

Add secrets:
- `GEMINI_API_KEY`
- `SUPABASE_ANON_KEY`
- `WISPHERE_API_KEY`
- `POLLINATIONS_API_TOKEN`
- `RAZORPAY_KEY_SECRET`

---

## ⚡ Quick Alternative: Archive & Create New Repo

If the above is too complex:

1. **Archive current repo** (make it read-only)
2. **Create brand new repository**
3. **Copy code WITHOUT .env file**
4. **Create fresh .env with NEW API keys**
5. **Never commit .env again**

---

## 🔒 Prevention Checklist

After fixing:

- [ ] Verify `.env` is in `.gitignore` ✅ (already done)
- [ ] Create `.env.example` without real keys
- [ ] Use GitHub Secrets for production
- [ ] Add pre-commit hook to prevent .env commits
- [ ] Enable GitHub secret scanning alerts

---

## ⏰ Timeline

1. **Now:** Backup current work (5 min)
2. **Today:** Clean Git history (15 min)
3. **Today:** Rotate all API keys (15 min)
4. **Today:** Test with new keys (5 min)

Total: ~40 minutes to fix completely

---

## 🆘 Need Help?

If you get stuck, I can guide you through each step!
