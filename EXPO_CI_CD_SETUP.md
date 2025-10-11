# 🔐 Expo CI/CD Setup Guide

## Prerequisites for Building APK in GitHub Actions

To build APKs automatically using GitHub Actions and EAS (Expo Application Services), you need to set up authentication tokens and configure your project properly.

---

## 📋 Required Tokens & Secrets

### 1. **EXPO_TOKEN** (Required) 🎫

This token allows GitHub Actions to authenticate with your Expo account and trigger EAS builds.

#### How to Generate EXPO_TOKEN:

**Option A: Using Expo CLI (Recommended)**

```bash
# Install EAS CLI globally (if not already installed)
npm install -g eas-cli

# Login to your Expo account
eas login

# Generate an access token
eas build:configure
```

**Option B: From Expo Dashboard**

1. Go to [https://expo.dev](https://expo.dev)
2. Login to your account
3. Click on your profile (top right)
4. Go to **"Access Tokens"** or **"Personal Access Tokens"**
5. Click **"Create Token"**
6. Give it a name like `github-actions-ci`
7. Copy the token (you won't see it again!)

#### Token Permissions Needed:
- ✅ Read and write access to your projects
- ✅ Ability to trigger builds
- ✅ Access to download build artifacts

---

### 2. **Add Token to GitHub Secrets** 🔒

1. Go to your GitHub repository: `https://github.com/RahulMirji/Cloth_Recommendation`
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **"New repository secret"**
4. Name: `EXPO_TOKEN`
5. Value: Paste your Expo token
6. Click **"Add secret"**

---

## 🏗️ Additional Requirements

### 3. **EAS Project Configuration**

Your project needs to be configured with EAS:

```bash
# Configure EAS for your project (if not done already)
eas build:configure

# This will:
# - Link your project to Expo
# - Create/update eas.json
# - Set up build profiles
```

### 4. **Expo Account & Project**

Make sure:
- ✅ You have an Expo account
- ✅ Your project is linked to Expo
- ✅ You've run at least one successful local build

To check/link your project:

```bash
# Check current project status
eas project:info

# If not linked, link it
eas init
```

---

## 🔍 Verify Your Setup

### Check if EXPO_TOKEN is set correctly:

Run this in your terminal to test authentication:

```bash
# Set your token temporarily
export EXPO_TOKEN=your_token_here

# Test if it works
eas whoami
```

You should see your Expo username if the token is valid.

---

## 📦 EAS Build Profiles (Already Configured)

Your `eas.json` has these profiles:

```json
{
  "build": {
    "production": {
      "autoIncrement": true,
      "android": {
        "buildType": "apk"  // ✅ Configured for APK
      }
    },
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    }
  }
}
```

The CI/CD uses the **production** profile by default.

---

## 🚨 Common Issues & Solutions

### Issue 1: "Authentication failed"
**Solution:** Your EXPO_TOKEN is invalid or expired
- Generate a new token from Expo dashboard
- Update the GitHub secret

### Issue 2: "Project not found"
**Solution:** Project not linked to Expo
```bash
eas init
```

### Issue 3: "No EAS project configured"
**Solution:** Run EAS configuration
```bash
eas build:configure
```

### Issue 4: "Build quota exceeded"
**Solution:** 
- Free tier has limited builds per month
- Upgrade to a paid plan or wait for quota reset
- Check your usage: [https://expo.dev/accounts/[username]/settings/billing](https://expo.dev/accounts/[username]/settings/billing)

---

## 💰 EAS Build Pricing (as of 2025)

### Free Tier:
- ✅ 30 builds per month (combined iOS + Android)
- ✅ Build artifacts stored for 30 days
- ⚠️ May have slower build times

### Production Tier:
- ✅ Unlimited builds
- ✅ Priority build queue
- ✅ 90-day artifact retention
- 💵 ~$29/month

Check current pricing: [https://expo.dev/pricing](https://expo.dev/pricing)

---

## 🧪 Test Your Setup

### Test locally first:

```bash
# Test building APK locally with production profile
eas build --platform android --profile production

# If successful, the CI/CD should work too!
```

---

## ✅ Final Checklist

Before pushing to master, verify:

- [ ] ✅ EXPO_TOKEN is added to GitHub Secrets
- [ ] ✅ Expo account is active and linked
- [ ] ✅ Project is configured with EAS (`eas.json` exists)
- [ ] ✅ At least one successful local build completed
- [ ] ✅ Build quota is available (check Expo dashboard)
- [ ] ✅ `eas-cli` is installed globally
- [ ] ✅ GitHub Actions workflow has access to secrets

---

## 🔗 Useful Links

- **Expo Dashboard:** [https://expo.dev](https://expo.dev)
- **EAS Build Documentation:** [https://docs.expo.dev/build/introduction/](https://docs.expo.dev/build/introduction/)
- **GitHub Actions Expo Guide:** [https://docs.expo.dev/build/building-on-ci/](https://docs.expo.dev/build/building-on-ci/)
- **Access Tokens:** [https://expo.dev/settings/access-tokens](https://expo.dev/settings/access-tokens)

---

## 📞 Need Help?

If you encounter issues:

1. Check Expo build status: `eas build:list`
2. View build logs: `eas build:view [BUILD_ID]`
3. Check GitHub Actions logs in your repository
4. Expo support: [https://expo.dev/support](https://expo.dev/support)

---

**Last Updated:** October 11, 2025
**Repository:** Cloth_Recommendation
**Owner:** RahulMirji
