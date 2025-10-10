# Supabase Edge Functions

This directory contains Supabase Edge Functions for the AI Dresser application.

## Functions

### send-otp

Sends 6-digit OTP codes via Gmail SMTP for user sign-up verification.

**Features:**
- ✅ Gmail SMTP integration (free, 500 emails/day)
- ✅ Rate limiting (3 requests per 30 minutes per email)
- ✅ OTP hashing for security
- ✅ 5-minute expiry
- ✅ Beautiful HTML email template
- ✅ Duplicate email prevention

**Required Environment Variables:**
```
SUPABASE_URL=<your-supabase-url>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
GMAIL_USER=<your-gmail@gmail.com>
GMAIL_APP_PASSWORD=<16-char-app-password>
GMAIL_FROM_NAME=AI Dresser
```

**Endpoint:**
```
POST https://<project-ref>.supabase.co/functions/v1/send-otp
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "name": "John Doe",
  "password": "secure-password"
}
```

**Response:**
```json
{
  "success": true,
  "message": "OTP sent successfully to your email. Please check your inbox.",
  "emailSent": true
}
```

## Setup Gmail SMTP

### 1. Enable 2-Factor Authentication
1. Go to https://myaccount.google.com/
2. Click **Security** → **2-Step Verification**
3. Follow prompts to enable 2FA

### 2. Generate App Password
1. Go to https://myaccount.google.com/apppasswords
2. Select app: **Mail**
3. Select device: **Other (Custom name)** → `AI Dresser OTP`
4. Click **Generate**
5. Copy the 16-character password (remove spaces)

### 3. Add Secrets to Supabase
1. Go to Supabase Dashboard → Settings → Edge Functions → Secrets
2. Add these secrets:
   - `GMAIL_USER` = your-email@gmail.com
   - `GMAIL_APP_PASSWORD` = abcdefghijklmnop (no spaces)
   - `GMAIL_FROM_NAME` = AI Dresser

## Deployment

Deploy the function to Supabase:

```bash
# Install Supabase CLI (if not already installed)
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref <your-project-ref>

# Deploy the function
supabase functions deploy send-otp
```

Or use the Supabase MCP server to deploy directly from VS Code.

## Testing

Test with multiple email addresses:

```bash
curl -X POST https://<project-ref>.supabase.co/functions/v1/send-otp \
  -H "Authorization: Bearer <anon-key>" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "name": "Test User",
    "password": "password123"
  }'
```

Check Edge Function logs in Supabase Dashboard to verify OTP generation.

## Troubleshooting

### Email not sending
- Verify Gmail credentials are correct in Supabase secrets
- Check that 2FA is enabled on Gmail account
- Verify App Password is 16 characters (no spaces)
- Check Edge Function logs for detailed error messages

### Rate limiting
- Users can request 3 OTPs per 30 minutes per email
- Wait time is shown in error message

### OTP verification fails
- OTPs expire after 5 minutes
- Check `otp_verifications` table for debugging
- Verify the `verify-otp-signup` function is working

## Migration from Resend

This function replaces the previous Resend API implementation:

**Changes:**
- ✅ Removed Resend dependency
- ✅ Added Gmail SMTP via `deno.land/x/smtp`
- ✅ No domain verification required
- ✅ Works with any email address (not just verified ones)
- ✅ Completely free (500 emails/day)

**What stayed the same:**
- Same 6-digit OTP format
- Same request/response format
- Same rate limiting logic
- Same OTP storage and hashing
- Same HTML email template

No changes needed in the mobile app - the API interface is identical!
