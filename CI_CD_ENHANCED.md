# 🚀 Enhanced CI/CD Pipeline Documentation

## Overview

The enhanced CI/CD pipeline automatically builds, tests, and deploys your AI Dresser app whenever you push to the `master` branch. It creates production-ready APK files and attaches them to GitHub releases.

---

## ⚠️ IMPORTANT: Setup Required First!

**Before this CI/CD will work, you MUST configure the EXPO_TOKEN:**

📖 **See [EXPO_CI_CD_SETUP.md](./EXPO_CI_CD_SETUP.md) for complete setup instructions**

### Quick Setup:
1. Generate Expo access token: `eas login` → [expo.dev/settings/access-tokens](https://expo.dev/settings/access-tokens)
2. Add to GitHub Secrets: Settings → Secrets → Actions → New secret
   - Name: `EXPO_TOKEN`
   - Value: Your Expo token
3. Verify your project is linked: `eas project:info`

**Without EXPO_TOKEN, the build will fail!** ❌

---

## 📋 Pipeline Jobs

### 1. **Test Job** 🧪
**Duration:** ~3-5 minutes

- ✅ Runs complete test suite with coverage
- ✅ Executes ESLint linter
- ✅ Uploads coverage reports to Codecov
- ✅ Must pass for pipeline to continue

### 2. **Type Check Job** 📝
**Duration:** ~2-3 minutes

- ✅ Validates TypeScript types across entire codebase
- ✅ Runs `tsc --noEmit` to catch type errors
- ✅ Must pass for pipeline to continue

### 3. **Security Scan Job** 🔒
**Duration:** ~1-2 minutes

- ✅ Runs `npm audit` for dependency vulnerabilities
- ⚠️ Continues even if issues found (won't block deployment)
- ✅ Provides security warnings

### 4. **Build Android Job** 📱
**Duration:** ~15-25 minutes (EAS build time)

**What it does:**
- ✅ Builds production-ready APK using EAS Build
- ✅ Waits for build to complete (no more `--no-wait`)
- ✅ Downloads the generated APK artifact
- ✅ Uploads APK to GitHub Actions artifacts (30-day retention)
- ✅ Extracts build metadata (ID, URL, size)
- ✅ Creates detailed build summary

**Build Configuration:**
- **Profile:** `production` (from `eas.json`)
- **Platform:** Android
- **Output:** APK file
- **Auto-increment:** Version number automatically incremented

### 5. **Deploy Production Job** 🚀
**Duration:** ~1-2 minutes

**What it does:**
- ✅ Downloads the built APK from artifacts
- ✅ Generates comprehensive release notes
- ✅ Creates GitHub Release with tag `vXXX`
- ✅ Attaches APK file to the release
- ✅ Includes commit history since last release
- ✅ Auto-generates additional release notes

**Release Contents:**
- 📱 APK file: `ai-dresser-{build-number}.apk`
- 📝 Detailed release notes
- 🔗 Links to Expo build, commit history
- 📋 Installation instructions

### 6. **Pipeline Summary Job** 📊
**Duration:** ~30 seconds

- ✅ Generates comprehensive pipeline status report
- ✅ Shows pass/fail status for all jobs
- ✅ Provides build information and links
- ✅ Always runs (even if previous jobs fail)

---

## 🔄 Workflow Triggers

### Automatic Triggers:
```yaml
on:
  push:
    branches: [master]  # Runs on every push to master
  pull_request:
    branches: [master]  # Runs on PRs targeting master
```

### Manual Trigger:
You can also trigger builds manually from GitHub Actions UI.

---

## 📦 Build Outputs

### 1. **GitHub Actions Artifacts**
- **Name:** `android-apk`
- **Retention:** 30 days
- **Location:** Actions tab → Workflow run → Artifacts section

### 2. **GitHub Releases**
- **Location:** Repository → Releases tab
- **Tag Format:** `v{run_number}` (e.g., `v123`)
- **Contains:** 
  - APK file
  - Release notes
  - Commit history
  - Installation instructions

### 3. **Expo Dashboard**
- **Location:** expo.dev/accounts/your-account
- **Contains:** 
  - Build logs
  - Build artifacts
  - Download links (expires after 30 days)

---

## 🔑 Required Secrets

Make sure these secrets are configured in your GitHub repository:

### **EXPO_TOKEN** (Required)
1. Go to expo.dev → Account Settings → Access Tokens
2. Create a new token with build permissions
3. Add to GitHub: Settings → Secrets and variables → Actions → New repository secret
4. Name: `EXPO_TOKEN`

### **CODECOV_TOKEN** (Optional)
- For code coverage reports
- Get from codecov.io

### **GITHUB_TOKEN** (Automatic)
- Automatically provided by GitHub Actions
- Used for creating releases

---

## 📊 Pipeline Flow

```
Push to Master
    ↓
┌───────────────────────────────────┐
│  Tests & Type Check (Parallel)   │
│  ✓ Jest Tests                     │
│  ✓ ESLint                         │
│  ✓ TypeScript Check               │
└───────────────────────────────────┘
    ↓
┌───────────────────────────────────┐
│  Security Scan (Parallel)         │
│  ⚠ npm audit                      │
└───────────────────────────────────┘
    ↓
┌───────────────────────────────────┐
│  Build Android APK                │
│  • Start EAS build                │
│  • Wait for completion (15-25min) │
│  • Download APK                   │
│  • Upload to artifacts            │
└───────────────────────────────────┘
    ↓
┌───────────────────────────────────┐
│  Deploy Production                │
│  • Generate release notes         │
│  • Create GitHub release          │
│  • Attach APK file                │
└───────────────────────────────────┘
    ↓
┌───────────────────────────────────┐
│  Pipeline Summary                 │
│  • Status report                  │
│  • Build information              │
└───────────────────────────────────┘
```

---

## 🎯 Build Profiles (eas.json)

### **Production Profile** (Used by CI/CD)
```json
{
  "production": {
    "autoIncrement": true,
    "android": {
      "buildType": "apk"
    }
  }
}
```

### Other Available Profiles:
- **development:** For development builds with dev client
- **preview:** For internal testing
- **production-aab:** For Google Play Store (AAB format)

---

## 📈 Monitoring & Debugging

### View Pipeline Status:
1. Go to repository → **Actions** tab
2. Click on latest workflow run
3. View individual job logs

### Download APK:
**Option 1: From GitHub Release**
1. Go to **Releases** tab
2. Click latest release
3. Download APK under "Assets"

**Option 2: From Actions Artifacts**
1. Go to **Actions** tab
2. Click workflow run
3. Scroll to "Artifacts" section
4. Download `android-apk`

### Debug Build Issues:
1. Check EAS build logs: `npx eas build:view {build-id}`
2. Check GitHub Actions logs for each job
3. Verify secrets are configured correctly
4. Check `eas.json` configuration

---

## 🔧 Troubleshooting

### Build Takes Too Long
- EAS builds typically take 15-25 minutes
- This is normal for production builds
- Check Expo status: status.expo.dev

### APK Download Fails
- Check if EAS build completed successfully
- Verify build ID is correct
- Check Expo dashboard for build status

### Release Creation Fails
- Verify `GITHUB_TOKEN` has proper permissions
- Check if tag already exists
- Review deploy job logs

### Tests Fail
- Run tests locally: `npm test`
- Check test coverage requirements
- Review test job logs

---

## 📱 Installing the APK

### For Developers:
1. Download APK from GitHub Release
2. Enable "Install from Unknown Sources" on Android device
3. Transfer APK to device
4. Install and run

### For Users:
Provide them with direct link to latest release:
```
https://github.com/RahulMirji/Cloth_Recommendation/releases/latest
```

---

## 🚀 Next Steps

### Potential Enhancements:
- [ ] Add iOS build support
- [ ] Add automatic Play Store deployment
- [ ] Add beta testing distribution
- [ ] Add performance monitoring integration
- [ ] Add crash reporting setup
- [ ] Add automatic changelog generation
- [ ] Add Slack/Discord notifications

### Alternative Build Methods:
1. **Local Build:** `npx eas build --platform android --profile production`
2. **Preview Build:** `npx eas build --platform android --profile preview`
3. **Development Build:** `npx eas build --platform android --profile development`

---

## 📞 Support

### Resources:
- **Expo EAS Build Docs:** https://docs.expo.dev/build/introduction/
- **GitHub Actions Docs:** https://docs.github.com/en/actions
- **EAS Build Status:** https://status.expo.dev/

### Common Commands:
```bash
# View build status
npx eas build:list

# View specific build
npx eas build:view {build-id}

# Cancel build
npx eas build:cancel {build-id}

# Configure EAS
npx eas build:configure
```

---

## 📝 Version History

### v2.0 - Enhanced CI/CD (Current)
- ✅ Actual APK building and downloading
- ✅ Automatic release creation with APK attachment
- ✅ Comprehensive build summaries
- ✅ Pipeline status monitoring

### v1.0 - Basic CI/CD (Previous)
- ✅ Tests and type checking
- ✅ Build queuing (no download)
- ✅ Basic release creation
- ❌ No APK attachment

---

**Last Updated:** October 11, 2025
**Maintained by:** Development Team
