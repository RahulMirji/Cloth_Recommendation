# Development Workflow Guide

## 🌳 Branch Strategy

```
┌─────────────┐      ┌──────────┐      ┌────────────┐
│  dev-test   │─────▶│  master  │─────▶│ production │
│ (daily work)│ PR   │ (stable) │ APK  │  (users)   │
└─────────────┘      └──────────┘      └────────────┘
```

### Branch Purposes

#### 🔧 `dev-test` - Daily Development
- **Purpose:** Your daily workspace for all changes
- **Frequency:** Multiple commits throughout the day
- **Testing:** Automated CI runs on every push
- **Rules:** Fast iteration, can have WIP commits

#### 🎯 `master` - Stable Release
- **Purpose:** Production-ready code only
- **Frequency:** End of day merge from dev-test
- **Testing:** Full CI/CD pipeline with strict checks
- **Rules:** All tests must pass, no breaking changes

#### 🚀 `production` - Live App
- **Purpose:** What users see
- **Frequency:** Manual APK builds when ready
- **Testing:** Already tested in master
- **Rules:** Never commit directly, only deploy from master

#### 🎨 Feature branches (e.g., `admin-dashboard`)
- **Purpose:** Major features or refactoring
- **Merge to:** dev-test first, then master
- **Rules:** Create PR, get tested, then merge

---

## 📋 Daily Workflow

### Morning Setup
```bash
# Start your day
git checkout dev-test
git pull origin dev-test

# Start coding!
```

### Throughout the Day
```bash
# Make changes, then commit frequently
git add .
git commit -m "Add: new feature X"
git push origin dev-test

# CI automatically runs tests ✅
# GitHub Action shows results in ~2-3 minutes
```

### End of Day (Merge to Master)
```bash
# 1. Make sure all tests pass on dev-test
npm test

# 2. Switch to master and update
git checkout master
git pull origin master

# 3. Merge dev-test into master
git merge dev-test

# 4. Push to master (triggers full CI/CD)
git push origin master

# 5. Wait for CI to pass, then you're good! ✅

# 6. Switch back to dev-test for tomorrow
git checkout dev-test
```

---

## 🔄 Pull Request Workflow

### Creating a PR from dev-test to master

1. **On GitHub:**
   - Go to: https://github.com/RahulMirji/Cloth_Recommendation
   - Click "Pull requests" → "New pull request"
   - Base: `master` ← Compare: `dev-test`
   - Click "Create pull request"

2. **PR Title Examples:**
   - "✨ Daily update: Added user profile enhancements"
   - "🐛 Fix: Login authentication issue"
   - "📱 Update: UI improvements and bug fixes"

3. **Wait for CI:**
   - ✅ All tests must pass
   - ✅ Linting must pass
   - ✅ Build verification must pass

4. **Merge:**
   - Click "Merge pull request"
   - Delete dev-test branch? **NO** - Keep it for tomorrow!

---

## 🧪 CI/CD Pipeline Overview

### Dev-Test Pipeline (Fast & Permissive)
```yaml
File: .github/workflows/dev-test-ci.yml
Triggers: Every push to dev-test
├── 🧪 Quick Test Suite (required)
├── 🔍 Linting (warnings allowed)
└── 🏗️ TypeScript Check (optional)

Duration: ~2-3 minutes
Goal: Quick feedback on daily changes
```

### Master Pipeline (Your Existing CI/CD - Strict & Comprehensive)
```yaml
Files: 
  - .github/workflows/ci-cd.yml (main pipeline)
  - .github/workflows/pr-checks.yml (PR validation)
  - .github/workflows/security-scan.yml (security)

Triggers: PR to master or push to master
├── 🧪 Full Test Suite with Coverage (required, must pass)
├── 🔍 Strict Linting (required, must pass)
├── 🏗️ TypeScript Compilation (required, must pass)
├── � PR Statistics & Info (automatic comment)
├── 🔒 Security Scanning (dependencies)
└── 📈 Code Coverage Reports (Codecov)

Duration: ~4-5 minutes
Goal: Ensure production readiness & security
```

---

## 🎯 Quick Reference Commands

### Daily Commands
```bash
# Morning start
git checkout dev-test && git pull

# Regular commits
git add . && git commit -m "message" && git push

# Check test status
npm test

# Check what changed
git status
git diff
```

### End of Day Commands
```bash
# Merge to master (Option 1: Direct merge)
git checkout master
git pull origin master
git merge dev-test
git push origin master

# OR (Option 2: Via Pull Request - Recommended)
# Just create PR on GitHub and merge there
```

### Emergency Rollback
```bash
# If something breaks on master
git checkout master
git revert HEAD
git push origin master

# Then fix on dev-test
git checkout dev-test
# fix the issue
git add . && git commit -m "Fix: issue from previous merge"
git push origin dev-test
```

---

## 🚀 Building APK (Manual Process)

### When to Build
- ✅ Master branch has all tests passing
- ✅ You've tested the app locally
- ✅ Ready for users to test/use

### Build Commands
```bash
# Make sure you're on master
git checkout master
git pull origin master

# Install dependencies
npm install

# Build APK with EAS
eas build --platform android --profile production

# OR build locally (if configured)
npm run build:android
```

---

## 📊 Viewing CI/CD Results

### On GitHub
1. Go to repository: https://github.com/RahulMirji/Cloth_Recommendation
2. Click "Actions" tab
3. See all workflow runs
4. Click any run to see details

### Status Badges (Optional)
Add to README.md:
```markdown
![Dev-Test CI](https://github.com/RahulMirji/Cloth_Recommendation/workflows/Dev-Test%20CI/badge.svg?branch=dev-test)
![Master CI](https://github.com/RahulMirji/Cloth_Recommendation/workflows/Master%20CI/badge.svg?branch=master)
```

---

## 🎨 Commit Message Guidelines

Use prefixes for clarity:

- `✨ Add:` New feature
- `🐛 Fix:` Bug fix
- `📱 Update:` UI/UX improvements
- `🧪 Test:` Add or update tests
- `📝 Docs:` Documentation changes
- `♻️ Refactor:` Code refactoring
- `⚡ Perf:` Performance improvements
- `🔧 Config:` Configuration changes

Examples:
```bash
git commit -m "✨ Add: Dark mode toggle in settings"
git commit -m "🐛 Fix: Login button not responding"
git commit -m "📱 Update: Improved home screen layout"
git commit -m "🧪 Test: Add tests for admin dashboard"
```

---

## 🛡️ Best Practices

### DO ✅
- Commit frequently to dev-test (even small changes)
- Run `npm test` before pushing to master
- Write descriptive commit messages
- Keep master clean and stable
- Create feature branches for big changes
- Merge to master at end of day

### DON'T ❌
- Don't commit directly to master (always via dev-test)
- Don't merge to master with failing tests
- Don't skip CI checks
- Don't force push to master
- Don't leave broken code on dev-test overnight

---

## 🆘 Troubleshooting

### "Tests failing on CI but pass locally"
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
npm test
```

### "CI is stuck or taking too long"
- Check GitHub Actions tab
- Cancel workflow and re-run
- Check if dependencies are cached

### "Merge conflicts between dev-test and master"
```bash
git checkout dev-test
git pull origin master  # Bring master changes to dev-test
# Resolve conflicts
git add .
git commit -m "🔧 Resolve merge conflicts"
git push origin dev-test
```

---

## 📈 Workflow Benefits

✅ **Safety:** Tests catch bugs before they reach master
✅ **Speed:** Quick feedback on dev-test
✅ **Clean history:** Master has only working code
✅ **Easy rollback:** Can revert master without losing work
✅ **Professional:** Industry-standard workflow
✅ **Confidence:** Know your code works before building APK

---

## 🎓 Learning Resources

- [Git Branching Strategy](https://git-scm.com/book/en/v2/Git-Branching-Branching-Workflows)
- [GitHub Actions Docs](https://docs.github.com/en/actions)
- [Conventional Commits](https://www.conventionalcommits.org/)

---

**Happy Coding! 🚀**

Need help? Check the CI logs or review this guide.
