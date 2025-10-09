# 🚀 Quick Reference: GitHub Secrets Setup

## 🎯 Minimum Required Setup

### 1. Get EXPO_TOKEN

```bash
npx expo login
npx eas token:create
```

Copy the token (you'll only see it once!)

### 2. Add to GitHub

1. Go to: https://github.com/RahulMirji/Cloth_Recommendation/settings/secrets/actions
2. Click **New repository secret**
3. Name: `EXPO_TOKEN`
4. Value: Paste token
5. Click **Add secret**

### 3. Test It

```bash
git add .
git commit -m "ci: Update GitHub workflows"
git push origin outfit-score-v2
```

After merging to master, check: https://github.com/RahulMirji/Cloth_Recommendation/actions

---

## 🔷 Optional Secrets (Add Later)

### SNYK_TOKEN (Enhanced Security)

- Sign up: https://snyk.io/
- Get token: https://app.snyk.io/account
- Add to GitHub secrets

### CODECOV_TOKEN (Coverage Reports)

- Sign up: https://codecov.io/
- Add repo, copy token
- Add to GitHub secrets

---

## ✅ Verification

Check secrets are added:
https://github.com/RahulMirji/Cloth_Recommendation/settings/secrets/actions

You should see:

- ✅ EXPO_TOKEN (required)
- 🔷 SNYK_TOKEN (optional)
- 🔷 CODECOV_TOKEN (optional)

---

## 📚 Full Documentation

See `.github/SECRETS_SETUP_GUIDE.md` for detailed instructions!
