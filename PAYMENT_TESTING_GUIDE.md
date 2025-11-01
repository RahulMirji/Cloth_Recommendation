# Razorpay Payment Testing Guide

## 🚀 Backend Server Status
✅ Running on: `http://localhost:3000`
✅ Razorpay Test Mode Active

## 📱 Configure API URL Based on Your Device

You need to update `EXPO_PUBLIC_API_URL` in `.env` based on which device you're testing on:

### iOS Simulator
```env
EXPO_PUBLIC_API_URL=http://localhost:3000
```

### Android Emulator
```env
EXPO_PUBLIC_API_URL=http://10.0.2.2:3000
```

### Physical Device (iPhone/Android on same WiFi)
```env
EXPO_PUBLIC_API_URL=http://172.29.74.163:3000
```

**⚠️ Important**: After changing `.env`, restart your Expo server for changes to take effect!

## 🔧 Current Configuration
Currently set to: **Physical Device Mode** (`http://172.29.74.163:3000`)

## 🧪 Testing Steps

### 1. Fix Network Errors (Supabase)
The network errors you're seeing are related to Supabase authentication, not Razorpay. They're usually harmless but can be fixed by:

- Ensuring you're connected to the internet
- Checking if Supabase project is active at: https://wmhiwieooqfwkrdcvqvb.supabase.co
- If errors persist, they won't affect Razorpay testing (just ignore them for now)

### 2. Test Razorpay Payment Flow

1. **Navigate to Payment Screen**
   - Login to your app (or skip if testing allows)
   - Go to the screen where you buy credits

2. **Verify Dual Payment Buttons**
   - You should see two buttons:
     - **"Pay with Razorpay"** - Purple gradient with ⚡ icon and "INSTANT" badge
     - **"Pay via UPI (Manual)"** - Secondary style with QR icon and "2 HRS" badge

3. **Test Razorpay (Instant Payment)**
   - Tap "Pay with Razorpay" button
   - Razorpay checkout should open
   - Use these **test credentials**:
     ```
     Card Number: 4111 1111 1111 1111
     Expiry: Any future date (e.g., 12/25)
     CVV: Any 3 digits (e.g., 123)
     ```
   - Complete the payment
   - You should see a success alert
   - Credits should be added **instantly**

4. **Test Manual Payment**
   - Tap "Pay via UPI (Manual)" button
   - Verify QR code displays
   - Enter a test UTR number (12 digits)
   - Upload a screenshot
   - Tap "Submit Payment Proof"
   - Check admin dashboard for approval

### 3. Verify Backend Logs

Check the terminal running `node server.js` for logs:
```
✅ Order created: order_xxxxx
✅ Payment verified successfully
✅ Added 100 credits to user
```

### 4. Check Database

In Supabase Dashboard, verify:
- `payment_submissions` table has new row with `payment_method = 'razorpay'`
- `razorpay_order_id`, `razorpay_payment_id`, `razorpay_signature` columns are populated
- User's credits increased in `feature_credits` table

## 🐛 Troubleshooting

### "Network request failed" on Payment
**Solution**: Check your `EXPO_PUBLIC_API_URL` matches your device type (see above)

### Backend not reachable from phone
**Solution**: 
1. Make sure phone and computer are on the **same WiFi network**
2. Use your computer's local IP: `http://172.29.74.163:3000`
3. Check firewall isn't blocking port 3000

### Razorpay checkout doesn't open
**Solution**: 
1. Verify `react-native-razorpay` is installed: `npm list react-native-razorpay`
2. For physical devices, may need to rebuild the app
3. Check Expo logs for errors

### "Invalid API Key" error
**Solution**: Verify `.env` has correct `EXPO_PUBLIC_RAZORPAY_KEY_ID=rzp_test_RaLy8yS1EISeIi`

## 📝 Test Checklist

- [ ] Backend server running on port 3000
- [ ] Expo server running
- [ ] `.env` has correct API URL for your device
- [ ] Dual payment buttons visible on screen
- [ ] Razorpay button opens checkout
- [ ] Test payment completes successfully
- [ ] Credits added instantly
- [ ] Manual payment flow still works
- [ ] Database records created correctly
- [ ] Admin dashboard shows payment

## 🎯 Expected Results

### Successful Razorpay Payment:
1. Payment processes in < 5 seconds
2. Success alert shows: "🎉 Payment Successful! 100 credits have been added to your account instantly!"
3. Credits reflect immediately in UI
4. Database updated with all Razorpay details

### Successful Manual Payment:
1. QR code, UTR input, screenshot upload work
2. Submit button triggers RPC call
3. Admin receives notification for review
4. Credits added after admin approval (within 2 hours)

---

**Need Help?** Check backend terminal logs and Expo logs for detailed error messages.
