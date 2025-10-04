# CI/CD Pipeline Documentation

## 🚀 Overview

This project uses **GitHub Actions** for continuous integration and deployment. The pipeline automatically tests, builds, and deploys the application on every push and pull request.

---

## 📋 Workflows

### 1. **CI/CD Pipeline** (`ci-cd.yml`)

**Triggers:**
- Push to `master`, `outfit-score`, or `develop` branches
- Pull requests to `master` or `outfit-score` branches

**Jobs:**

#### 🧪 Test Job
- Runs on: Ubuntu Latest
- Node versions: 18.x, 20.x (matrix)
- Steps:
  1. Checkout code
  2. Setup Node.js
  3. Install dependencies
  4. Run linter
  5. Run tests with coverage
  6. Upload coverage to Codecov

#### 🔍 Type Check Job
- Runs TypeScript compiler (`tsc --noEmit`)
- Ensures no type errors

#### 🌐 Build Web Job
- Builds web version with Expo
- Uploads build artifacts
- Retention: 7 days

#### 📱 Build Android Job
- Only on master branch pushes
- Uses Expo Application Services (EAS)
- Builds preview APK

#### 🔒 Security Scan Job
- Runs npm audit
- Runs Snyk security scan (if token provided)

#### 🚀 Deploy Preview Job
- Only for pull requests
- Deploys to Vercel preview environment

#### 🎉 Deploy Production Job
- Only on master branch pushes
- Deploys to Vercel production
- Creates GitHub release

---

### 2. **PR Checks** (`pr-checks.yml`)

**Triggers:**
- Pull requests opened, synchronized, or reopened

**Jobs:**

#### 📊 PR Information
- Displays PR statistics (files changed, lines added/deleted)
- Comments on PR with info

#### 🎨 Code Quality Check
- Runs ESLint
- Checks for console.log statements

#### 📈 Test Coverage Report
- Runs tests with coverage
- Generates coverage badge
- Comments coverage percentage on PR

#### 📦 Bundle Size Check
- Builds web app
- Checks bundle size
- Comments size on PR

---

### 3. **Security Scan** (`security-scan.yml`)

**Triggers:**
- Scheduled: Daily at 2 AM UTC
- Manual: workflow_dispatch

**Jobs:**

#### 🔐 Dependency Audit
- Runs npm audit
- Generates audit report
- Uploads report artifact

#### 📦 Outdated Dependencies
- Checks for outdated packages
- Creates GitHub issue if found
- Automatic dependency tracking

---

## 🔧 Setup Instructions

### Prerequisites

1. **GitHub Repository Secrets**
   
   Add these secrets in: `Settings > Secrets and variables > Actions`

   ```
   EXPO_TOKEN              # Expo account token (optional)
   VERCEL_TOKEN            # Vercel deployment token (optional)
   VERCEL_ORG_ID          # Vercel organization ID (optional)
   VERCEL_PROJECT_ID      # Vercel project ID (optional)
   SNYK_TOKEN             # Snyk security token (optional)
   ```

### Getting Tokens

#### Expo Token
```bash
npx expo login
npx expo whoami
# Get token from expo.dev account settings
```

#### Vercel Token
1. Go to https://vercel.com/account/tokens
2. Create new token
3. Copy token to GitHub secrets

#### Snyk Token
1. Sign up at https://snyk.io
2. Go to Account Settings > General > API Token
3. Copy token to GitHub secrets

---

## 📊 Workflow Status

### View Workflow Runs
- Go to: `Actions` tab in GitHub repository
- Click on workflow name to see runs
- Click on specific run to see details

### Status Badges

Add to your `README.md`:

```markdown
## Build Status

![CI/CD Pipeline](https://github.com/RahulMirji/Cloth_Recommendation/actions/workflows/ci-cd.yml/badge.svg)
![PR Checks](https://github.com/RahulMirji/Cloth_Recommendation/actions/workflows/pr-checks.yml/badge.svg)
![Security Scan](https://github.com/RahulMirji/Cloth_Recommendation/actions/workflows/security-scan.yml/badge.svg)
```

---

## 🔄 Pipeline Flow

### On Pull Request:
```
1. PR Opened
   ↓
2. PR Checks Run
   ├─ PR Info Comment
   ├─ Code Quality Check
   ├─ Test Coverage Report
   └─ Bundle Size Check
   ↓
3. CI/CD Pipeline Runs
   ├─ Test (Node 18.x, 20.x)
   ├─ Type Check
   ├─ Build Web
   ├─ Security Scan
   └─ Deploy Preview (Vercel)
   ↓
4. Review & Merge
```

### On Master Push:
```
1. Code Pushed to Master
   ↓
2. CI/CD Pipeline Runs
   ├─ Test (Node 18.x, 20.x)
   ├─ Type Check
   ├─ Build Web
   ├─ Build Android (EAS)
   └─ Security Scan
   ↓
3. Deploy Production
   ├─ Deploy to Vercel
   └─ Create GitHub Release
   ↓
4. Success ✅
```

---

## 🛠️ Customization

### Add New Job

Edit `.github/workflows/ci-cd.yml`:

```yaml
new-job:
  name: My New Job
  runs-on: ubuntu-latest
  needs: [test]  # Run after test job
  
  steps:
    - name: Checkout
      uses: actions/checkout@v4
    
    - name: Do something
      run: echo "Hello World"
```

### Modify Triggers

```yaml
on:
  push:
    branches: [master, develop]
  pull_request:
    branches: [master]
  schedule:
    - cron: '0 0 * * *'  # Daily at midnight
  workflow_dispatch:      # Manual trigger
```

### Change Node Versions

```yaml
strategy:
  matrix:
    node-version: [18.x, 20.x, 22.x]  # Add more versions
```

---

## 🐛 Troubleshooting

### Tests Failing in CI but Passing Locally

**Possible causes:**
- Environment differences
- Missing environment variables
- Cache issues

**Solutions:**
```bash
# Clear npm cache
npm cache clean --force

# Install exact versions
npm ci --legacy-peer-deps

# Run tests in CI mode locally
npm run test:ci
```

### Build Failures

**Check:**
1. Node version compatibility
2. Dependency installation logs
3. Build command output
4. Environment variables

### Deployment Failures

**Check:**
1. Tokens are set correctly
2. Vercel/Expo projects exist
3. Permissions are correct
4. Deployment logs

---

## 📈 Monitoring

### GitHub Actions Insights
- Go to: `Insights > Actions`
- View workflow run statistics
- Monitor success/failure rates
- Check average run times

### Set Up Notifications
1. Go to: `Settings > Notifications`
2. Enable: "Actions workflow runs"
3. Choose: Email or Slack

---

## 🎯 Best Practices

### DO ✅
- Keep workflows fast (<10 minutes)
- Use caching for dependencies
- Run tests in parallel
- Fail fast on errors
- Use matrix builds for multiple versions
- Add status checks to branches

### DON'T ❌
- Store secrets in code
- Run unnecessary jobs
- Deploy on every PR
- Ignore failing tests
- Skip security scans

---

## 📚 Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Expo CI/CD Guide](https://docs.expo.dev/build/building-on-ci/)
- [Vercel GitHub Integration](https://vercel.com/docs/git/vercel-for-github)
- [Jest CI Best Practices](https://jestjs.io/docs/cli#--ci)

---

## 🔮 Future Enhancements

### Planned
- [ ] Add E2E tests with Detox
- [ ] Add visual regression tests
- [ ] Set up staging environment
- [ ] Add performance monitoring
- [ ] Implement blue-green deployments

### Optional
- [ ] Add Docker builds
- [ ] Set up Kubernetes deployment
- [ ] Add load testing
- [ ] Implement canary releases
- [ ] Add rollback automation

---

## 📞 Support

For issues with CI/CD:
1. Check workflow logs
2. Review this documentation
3. Search GitHub Actions community
4. Open an issue in the repository

---

**Last Updated:** 2025-01-04

*This pipeline is continuously improved. Check back for updates!*
