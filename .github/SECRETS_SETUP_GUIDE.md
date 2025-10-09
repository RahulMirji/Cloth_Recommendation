# GitHub Secrets Setup Guide

This guide explains how to configure the required secrets for the GitHub Actions workflows in this repository.

## 📋 Required Secrets

The following secrets need to be configured in your GitHub repository:

| Secret Name     | Required            | Used For                   | Workflow  |
| --------------- | ------------------- | -------------------------- | --------- |
| `EXPO_TOKEN`    | ⚠️ Yes (for builds) | EAS Build authentication   | ci-cd.yml |
| `SNYK_TOKEN`    | 🔷 Optional         | Enhanced security scanning | ci-cd.yml |
| `CODECOV_TOKEN` | 🔷 Optional         | Code coverage reporting    | ci-cd.yml |
| `GITHUB_TOKEN`  | ✅ Auto-provided    | GitHub API access          | All       |

---

## 🔧 How to Add Secrets

### Step 1: Navigate to Repository Settings

1. Go to: https://github.com/RahulMirji/Cloth_Recommendation
2. Click on **Settings** tab
3. In the left sidebar, click **Secrets and variables** → **Actions**
4. Click **New repository secret**

---

## 1️⃣ EXPO_TOKEN (Required for APK Builds)

### Purpose

Allows GitHub Actions to authenticate with Expo Application Services (EAS) to build Android APKs automatically.

### How to Get the Token

#### Option A: Using Expo CLI (Recommended)

```bash
# Login to your Expo account
npx expo login

# Generate a token
npx eas token:create
```

#### Option B: Using Expo Website

1. Go to: https://expo.dev/accounts/[your-username]/settings/access-tokens
2. Click **Create Token**
3. Name it: `GitHub Actions CI/CD`
4. Click **Create**
5. Copy the token (you'll only see it once!)

### Add to GitHub

1. Go to repository **Settings** → **Secrets and variables** → **Actions**
2. Click **New repository secret**
3. Name: `EXPO_TOKEN`
4. Value: Paste the token from above
5. Click **Add secret**

### Verify

After adding, push to master branch and check:

- https://github.com/RahulMirji/Cloth_Recommendation/actions
- The "Build Android (Preview)" job should now work

---

## 2️⃣ SNYK_TOKEN (Optional - Enhanced Security)

### Purpose

Enables Snyk security scanning to detect vulnerabilities in dependencies.

### How to Get the Token

1. Sign up at: https://snyk.io/
2. Go to: https://app.snyk.io/account
3. Copy your **Auth Token**

### Add to GitHub

1. Go to repository **Settings** → **Secrets and variables** → **Actions**
2. Click **New repository secret**
3. Name: `SNYK_TOKEN`
4. Value: Paste the Snyk token
5. Click **Add secret**

### Benefits

- Advanced vulnerability detection
- Detailed security reports
- Fix recommendations
- Integration with GitHub Security tab

### Skip if Not Needed

If you prefer to use only `npm audit`, you can skip this. The workflow will continue with `npm audit` only.

---

## 3️⃣ CODECOV_TOKEN (Optional - Coverage Reports)

### Purpose

Uploads test coverage reports to Codecov for detailed coverage tracking and badges.

### How to Get the Token

1. Sign up at: https://codecov.io/
2. Add your repository: https://codecov.io/gh/RahulMirji/Cloth_Recommendation
3. Copy the **Upload Token**

### Add to GitHub

1. Go to repository **Settings** → **Secrets and variables** → **Actions**
2. Click **New repository secret**
3. Name: `CODECOV_TOKEN`
4. Value: Paste the Codecov token
5. Click **Add secret**

### Benefits

- Visual coverage reports
- Coverage badges for README
- Historical coverage trends
- Pull request coverage comments

### Skip if Not Needed

Coverage still works locally with `npm run test:coverage`. This is only for online reports.

---

## ✅ Verification Checklist

After adding secrets, verify your setup:

### Check Secrets Are Added

1. Go to: https://github.com/RahulMirji/Cloth_Recommendation/settings/secrets/actions
2. You should see:
   - ✅ `EXPO_TOKEN`
   - ✅ `SNYK_TOKEN` (if added)
   - ✅ `CODECOV_TOKEN` (if added)

### Test the Workflows

1. Make a small change and commit to master:

   ```bash
   git add .
   git commit -m "test: Verify CI/CD workflows"
   git push origin master
   ```

2. Check workflow runs:

   - https://github.com/RahulMirji/Cloth_Recommendation/actions

3. Expected results:
   - ✅ **Test** job: Should pass
   - ✅ **Type Check** job: Should pass
   - ✅ **Security Scan** job: Should pass
   - ✅ **Build Android** job: Should queue/complete (if EXPO_TOKEN added)
   - ✅ **Deploy Production** job: Should create release

---

## 🔒 Security Best Practices

### DO ✅

- Keep tokens secret and secure
- Use repository secrets (not hardcoded)
- Rotate tokens periodically
- Use minimal permissions tokens when possible
- Remove tokens you no longer use

### DON'T ❌

- Never commit tokens to code
- Don't share tokens publicly
- Don't use personal tokens in workflows
- Don't store tokens in issue comments
- Don't use the same token everywhere

---

## 🆘 Troubleshooting

### EXPO_TOKEN Not Working

```bash
# Test locally first
npx eas whoami

# Regenerate token if needed
npx eas token:create

# Check EAS project is linked
npx eas build:configure
```

### Workflow Still Failing

1. Check workflow logs:
   - https://github.com/RahulMirji/Cloth_Recommendation/actions
2. Click on failed job
3. Expand the failing step
4. Read error message
5. Common issues:
   - Token expired: Regenerate token
   - Wrong token: Verify token value
   - No EAS project: Run `eas build:configure`

### Need Help?

- Expo docs: https://docs.expo.dev/eas/
- GitHub Actions: https://docs.github.com/en/actions
- Snyk docs: https://docs.snyk.io/
- Codecov docs: https://docs.codecov.com/

---

## 📊 Minimal Setup (Recommended to Start)

If you want to start simple, add only:

1. **EXPO_TOKEN** - For APK builds ⚠️ **Required**
2. Skip SNYK_TOKEN - Use `npm audit` instead
3. Skip CODECOV_TOKEN - View coverage locally

You can add the optional tokens later as your project grows!

---

## 🎯 Quick Setup Commands

### For Expo Token

```bash
# Login and create token in one go
npx expo login && npx eas token:create
```

### Test Locally Before CI

```bash
# Test your app builds locally
npx eas build --platform android --profile preview --local

# Test your tests pass
npm test

# Test linting passes
npm run lint

# Test TypeScript compiles
npx tsc --noEmit
```

---

## 📝 Summary

**Minimum Required:**

- ✅ `EXPO_TOKEN` (for Android builds)

**Optional (Recommended):**

- 🔷 `SNYK_TOKEN` (enhanced security)
- 🔷 `CODECOV_TOKEN` (coverage reports)

**Auto-Provided:**

- ✅ `GITHUB_TOKEN` (no action needed)

Once you add `EXPO_TOKEN`, your CI/CD pipeline will be fully functional! 🚀
