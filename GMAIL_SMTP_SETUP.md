# Gmail SMTP OTP Implementation - Testing Guide

## ✅ Implementation Complete

The `send-otp` Edge Function has been successfully updated to use **Gmail SMTP** instead of Resend API.

## 🎯 What Changed

### Before (Resend API):
- ❌ Required domain verification
- ❌ Free tier limited to your email only
- ❌ Could not send to any user's email

### After (Gmail SMTP):
- ✅ No domain verification needed
- ✅ Send to ANY email address
- ✅ 500 emails/day completely free
- ✅ Better deliverability with Google infrastructure
- ✅ Same 6-digit OTP format
- ✅ No mobile app changes required

## 📋 Environment Variables Configured

Make sure these are set in your Supabase Dashboard → Settings → Edge Functions → Secrets:

```
GMAIL_USER = your-email@gmail.com
GMAIL_APP_PASSWORD = your-16-char-app-password
GMAIL_FROM_NAME = AI Dresser
```

## 🧪 Testing Instructions

### Test 1: Send OTP to ANY Email (Not Just Yours)

1. Open your mobile app or use this curl command:

```bash
curl -X POST https://wmhiwieooqfwkrdcvqvb.supabase.co/functions/v1/send-otp \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndtaGl3aWVvb3Fmd2tyZGN2cXZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk1Nzg3MTksImV4cCI6MjA3NTE1NDcxOX0.R-jk3IOAGVtRXvM2nLpB3gfMXcsrPO6WDLxY5TId6UA" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "friend@example.com",
    "name": "Test User",
    "password": "test123"
  }'
```

2. **Expected Result:**
   - ✅ API returns: `{ "success": true, "emailSent": true, "message": "OTP sent..." }`
   - ✅ Email arrives at the test email address
   - ✅ OTP code is visible in Supabase Edge Function logs

### Test 2: Check Edge Function Logs

1. Go to: https://supabase.com/dashboard/project/wmhiwieooqfwkrdcvqvb/functions/send-otp/logs
2. You should see:
   ```
   📧 Connecting to Gmail SMTP for: friend@example.com
   ✅ Connected to Gmail SMTP
   ✅ Email sent successfully via Gmail SMTP
   ==================================================
   OTP FOR: friend@example.com
   EXPIRES AT: 2025-10-10T09:15:00.000Z
   OTP CODE: 123456
   ==================================================
   ```

### Test 3: Sign Up from Mobile App

1. Open your AI Dresser app
2. Click **Sign Up**
3. Fill in details with **any email address** (not just yours!)
4. Click **Send OTP**
5. Check the email inbox - OTP should arrive within seconds
6. Enter the OTP and complete sign-up

## 🔍 Troubleshooting

### If email doesn't arrive:

1. **Check Gmail credentials:**
   ```bash
   # In Supabase Dashboard, verify:
   GMAIL_USER = correct email?
   GMAIL_APP_PASSWORD = 16 chars, no spaces?
   ```

2. **Check Edge Function logs:**
   - Go to Supabase Dashboard → Functions → send-otp → Logs
   - Look for error messages starting with ❌

3. **Common issues:**
   - **"Authentication failed"** → App Password is wrong or has spaces
   - **"2FA not enabled"** → Enable 2-Factor Auth on Gmail
   - **"Connection refused"** → Check if Gmail SMTP is blocked by firewall

4. **Verify Gmail App Password:**
   - Go to https://myaccount.google.com/apppasswords
   - Remove old "AI Dresser OTP" password
   - Generate a new one
   - Update in Supabase secrets (remove all spaces!)

## 📊 Rate Limits

- **Gmail SMTP:** 500 emails/day
- **Our App Limit:** 3 OTPs per 30 minutes per email (prevents abuse)

## ✅ Success Criteria

- [x] Edge Function deployed (version 8)
- [x] Gmail credentials configured in Supabase
- [x] Code committed to `user-email-fix` branch
- [ ] Test with non-developer email address
- [ ] Verify OTP arrives in inbox
- [ ] Complete sign-up flow end-to-end

## 🚀 Next Steps

1. **Test with your friend's email** to confirm it works
2. Once verified, **merge to master**:
   ```bash
   git checkout master
   git merge user-email-fix
   git push origin master
   ```

3. **Optional**: Add monitoring
   - Set up alerts for failed email sends
   - Track daily email count (stay under 500/day)

## 📝 Deployment Notes

- **Function Name:** `send-otp`
- **Version:** 8 (deployed on Oct 10, 2025)
- **Runtime:** Deno 1.x
- **Dependencies:** 
  - `deno.land/std@0.168.0/http/server`
  - `esm.sh/@supabase/supabase-js@2.39.3`
  - `deno.land/x/smtp@v0.7.0`

## 🎉 Benefits Achieved

1. **Cost:** $0/month (was limited with Resend free tier)
2. **Scalability:** 500 emails/day (enough for most apps)
3. **Deliverability:** Google's infrastructure (99%+ delivery rate)
4. **Simplicity:** No domain verification or DNS setup needed
5. **Reliability:** Gmail SMTP is battle-tested and stable

---

**Questions?** Check the main README at `supabase/functions/README.md`
