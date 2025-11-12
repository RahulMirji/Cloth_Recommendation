# 🔒 Environment File Protection Guide

Your `.env` file contains sensitive API keys and is now protected from being overwritten during Git operations.

## 🛡️ Protection Mechanisms

### 1. **Git Ignore** (Primary Protection)
- `.env` is listed in `.gitignore` - it will never be committed to Git
- Your API keys stay local and secure

### 2. **Git Attributes** (Merge Protection)
- `.gitattributes` is configured with `merge=ours` strategy
- During merges, your local `.env` file is always preserved
- Remote changes to `.env` (if any) are automatically ignored

### 3. **Backup System**
- Automatic backup to `.env.backup`
- Easy restore if anything goes wrong

## 📝 Available Commands

### Backup your .env
```bash
npm run env:backup
# or
./scripts/protect-env.sh backup
```

### Restore your .env from backup
```bash
npm run env:restore
# or
./scripts/protect-env.sh restore
```

## 🔄 During Git Operations

### When switching branches:
```bash
# Your .env stays intact automatically
git checkout other-branch
```

### When merging/pulling:
```bash
# Your .env is protected by merge=ours strategy
git pull origin master
git merge feature-branch
```

### Best Practice (optional extra safety):
```bash
# Before any risky git operation:
npm run env:backup

# Then do your git operation:
git pull origin master

# If needed, restore:
npm run env:restore
```

## ⚙️ Current Configuration

### Your API Keys (in `.env`):
```bash
EXPO_PUBLIC_GEMINI_API_KEY=AIzaSy... (your actual key)
EXPO_PUBLIC_WISPHERE_API_KEY=gsk_... (your actual key)
```

### Files Protected:
- `.env` - Your main environment file (PROTECTED ✅)
- `.env.backup` - Automatic backup (PROTECTED ✅)
- `.env.local` - Local overrides (PROTECTED ✅)

## 🚨 What NOT to Do

❌ **DO NOT** commit `.env` to Git manually  
❌ **DO NOT** remove `.env` from `.gitignore`  
❌ **DO NOT** share your API keys publicly

## ✅ What's Safe to Do

✓ Switch branches freely  
✓ Merge PRs without worry  
✓ Pull from remote  
✓ Your `.env` stays like a solid rock! 🪨

## 🆘 Emergency Recovery

If your `.env` gets lost somehow:

```bash
# Restore from backup
npm run env:restore

# Or copy from example and re-add your keys
cp .env.example .env
# Then edit .env with your actual API keys
```

## 📚 Reference

- `.env` - Contains your actual API keys (NEVER commit)
- `.env.example` - Template with placeholder values (safe to commit)
- `.env.backup` - Automatic backup of your `.env`
- `.gitattributes` - Merge strategy configuration
- `scripts/protect-env.sh` - Backup/restore utility

---

**Your environment is now Fort Knox! 🏰**
