# Why Do You Need These Secrets? 🤔

A detailed explanation of what each secret does and whether you actually need them.

---

## TL;DR - Do I Really Need These?

| Secret            | Need It?                                     | Why?                                 | What Happens Without It?                                  |
| ----------------- | -------------------------------------------- | ------------------------------------ | --------------------------------------------------------- |
| **EXPO_TOKEN**    | ⚠️ **Only if you want automated APK builds** | Authenticates with EAS to build APKs | Build job fails, but testing still works                  |
| **SNYK_TOKEN**    | ❌ **No, probably not**                      | Paid service for advanced security   | We already have `npm audit` for free                      |
| **CODECOV_TOKEN** | ❌ **No, not needed**                        | Online coverage dashboard            | You can see coverage locally with `npm run test:coverage` |

---

## 1️⃣ EXPO_TOKEN

### What Does It Do?

Your workflow has this job:

```yaml
build-android:
  name: Build Android (Preview)
  runs-on: ubuntu-latest
  needs: [test, type-check]
  if: github.event_name == 'push' && github.ref == 'refs/heads/master'

  steps:
    - name: Setup Expo
      uses: expo/expo-github-action@v8
      with:
        expo-version: latest
        token: ${{ secrets.EXPO_TOKEN }} # ← THIS IS WHERE IT'S USED

    - name: Build Android APK
      run: npx eas build --platform android --profile preview
```

**In Plain English:**

- Every time you push to master
- GitHub tries to automatically build your Android APK
- It needs to authenticate with Expo Application Services (EAS)
- Without the token, it can't authenticate = build fails

### Do You NEED It?

**NO, if:**

- ✅ You build APKs locally on your machine (`npx eas build --local`)
- ✅ You're fine with manual builds when needed
- ✅ You don't need automated CI/CD APK builds

**YES, if:**

- 🎯 You want automatic APK builds on every merge to master
- 🎯 You want GitHub to build APKs in the cloud
- 🎯 You want hands-free deployment

### What Happens Without It?

**Without EXPO_TOKEN:**

```
❌ Build Android (Preview) job FAILS
✅ Test job still WORKS
✅ Type Check job still WORKS
✅ Security Scan job still WORKS
✅ All your code validation still happens
```

**You just won't get automated APK builds.**

### Cost

- **Free tier:** 30 builds/month
- **After that:** ~$29/month for unlimited builds
- **Local builds:** Always free (builds on your machine)

---

## 2️⃣ SNYK_TOKEN

### What Does It Do?

Your workflow has this:

```yaml
security-scan:
  name: Security Scan
  steps:
    - name: Run npm audit
      run: npm audit --audit-level=moderate # ← FREE, works without token

    - name: Run Snyk security scan
      uses: snyk/actions/node@master
      env:
        SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }} # ← PAID service
```

**In Plain English:**

- Snyk is a **paid security service** (free tier limited)
- It scans your dependencies for vulnerabilities
- It's **more advanced** than `npm audit`
- But `npm audit` is **free and already works**

### Do You NEED It?

**NO, because:**

- ✅ `npm audit` already scans for vulnerabilities (FREE)
- ✅ `npm audit` is built into npm (no signup needed)
- ✅ GitHub Dependabot also scans dependencies (FREE)
- ✅ Your workflow already runs `npm audit`

**YES, only if:**

- 🎯 You need advanced vulnerability detection
- 🎯 You want detailed fix recommendations
- 🎯 You want license compliance scanning
- 🎯 You're working on enterprise/production apps

### What Happens Without It?

**Without SNYK_TOKEN:**

```
✅ npm audit still runs (FREE)
✅ Security scanning still happens
✅ Vulnerabilities still detected
❌ No fancy Snyk dashboard
❌ No advanced Snyk features
```

**Your security scanning still works fine with `npm audit`!**

### Cost

- **Free tier:** Limited to 200 tests/month
- **Team plan:** $98/month
- **npm audit:** Always FREE

### My Recommendation

**Skip SNYK_TOKEN.** You already have:

1. `npm audit` (free, built-in)
2. GitHub Dependabot (free, auto PRs for updates)
3. Daily security scan workflow

---

## 3️⃣ CODECOV_TOKEN

### What Does It Do?

Your workflow has this:

```yaml
test:
  steps:
    - name: Run tests
      run: npm test -- --coverage --watchAll=false # ← Still runs locally

    - name: Upload coverage to Codecov
      uses: codecov/codecov-action@v4
      with:
        token: ${{ secrets.CODECOV_TOKEN }} # ← For online dashboard
```

**In Plain English:**

- Codecov is an **online dashboard** for test coverage
- It shows pretty graphs and trends
- It adds coverage badges to your README
- But your tests still run without it!

### Do You NEED It?

**NO, because:**

- ✅ Tests still run without it
- ✅ Coverage still calculated without it
- ✅ You can see coverage locally: `npm run test:coverage`
- ✅ Coverage report generated in `./coverage/` folder

**YES, only if:**

- 🎯 You want online coverage dashboard
- 🎯 You want coverage badges in README
- 🎯 You want to track coverage trends over time
- 🎯 You're working with a team

### What Happens Without It?

**Without CODECOV_TOKEN:**

```
✅ Tests still run (35 tests)
✅ Coverage still calculated
✅ Coverage report in ./coverage/ folder
❌ No online dashboard
❌ No coverage badges
❌ No PR coverage comments
```

**You can still see coverage locally!**

### How to See Coverage Locally

```bash
# Run tests with coverage
npm run test:coverage

# Open the HTML report
start coverage/lcov-report/index.html  # Windows
# or
open coverage/lcov-report/index.html   # Mac
```

### Cost

- **Free tier:** Unlimited for public repos
- **Private repos:** Limited to 1 repo on free tier
- **Local coverage:** Always FREE

### My Recommendation

**Skip CODECOV_TOKEN.** You can:

1. View coverage locally with `npm run test:coverage`
2. Add it later if you want the dashboard
3. Use it if your repo is public (unlimited free)

---

## 🎯 What I Recommend

### Minimal Setup (Start Here)

**Don't add any secrets yet!**

Your workflows will still:

- ✅ Run 35 automated tests
- ✅ Check TypeScript types
- ✅ Run ESLint
- ✅ Scan for vulnerabilities with `npm audit`
- ✅ Generate test coverage locally
- ✅ Check bundle size
- ✅ Post PR statistics

**What won't work:**

- ❌ Automated cloud APK builds (you can build locally)
- ❌ Snyk advanced scans (you have `npm audit`)
- ❌ Codecov dashboard (you can view locally)

### When to Add Secrets

**Add EXPO_TOKEN when:**

- You're ready for production deployment
- You want hands-free APK builds
- You have 30+ builds/month budget

**Add SNYK_TOKEN when:**

- You need enterprise-level security
- `npm audit` isn't enough
- You have security compliance requirements

**Add CODECOV_TOKEN when:**

- Your repo is public (it's free)
- You want coverage badges
- You're working with a team

---

## 💰 Cost Summary

| Service        | Free Tier              | Paid Plans           | Alternatives          |
| -------------- | ---------------------- | -------------------- | --------------------- |
| **EAS Builds** | 30 builds/month        | $29/mo for unlimited | Build locally (free)  |
| **Snyk**       | 200 tests/month        | $98/mo team          | `npm audit` (free)    |
| **Codecov**    | Unlimited public repos | $10/mo private       | Local coverage (free) |

---

## 🤔 So What Should I Do?

### Option 1: Zero Secrets (Recommended for Now) ✅

**Add NO secrets. Your workflows will:**

- ✅ Test everything automatically
- ✅ Catch bugs before production
- ✅ Validate code quality
- ✅ Scan for security issues
- ❌ NOT build APKs automatically (build manually when needed)

**This is FREE and covers 90% of what you need!**

### Option 2: Add EXPO_TOKEN Only

**If you want automated APK builds:**

```bash
npx expo login
npx eas token:create
# Add to GitHub secrets
```

**Cost:** Free for 30 builds/month

### Option 3: Add All Secrets

**If you're going production with a team:**

- Add EXPO_TOKEN for deployments
- Add SNYK_TOKEN for advanced security
- Add CODECOV_TOKEN for team coverage tracking

**Cost:** ~$30-150/month depending on usage

---

## ✅ My Honest Recommendation

**For your project RIGHT NOW:**

1. **Don't add any secrets yet** ✅
2. Your workflows will still validate everything ✅
3. Build APKs locally when you need them ✅
4. Use `npm audit` for security ✅
5. View coverage locally ✅

**Later, when going to production:**

1. Add `EXPO_TOKEN` for automated builds
2. Skip `SNYK_TOKEN` (unless enterprise needs)
3. Skip `CODECOV_TOKEN` (unless you want the dashboard)

---

## 🎯 Bottom Line

**The secrets are NOT required for your workflows to be useful!**

Without any secrets, you still get:

- ✅ Automated testing on every push
- ✅ Code quality enforcement
- ✅ Security scanning
- ✅ TypeScript validation
- ✅ PR insights and statistics

**You only need secrets if you want:**

- 🎯 Cloud-based APK builds (EXPO_TOKEN)
- 🎯 Enterprise security scanning (SNYK_TOKEN)
- 🎯 Online coverage dashboard (CODECOV_TOKEN)

**Start with zero secrets. Add them only when you actually need the features!** 🚀
