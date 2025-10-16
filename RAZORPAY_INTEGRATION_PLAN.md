# 🚀 Razorpay Integration Plan for AI Dresser App

## **Date**: October 16, 2025

## **Goal**: Replace manual QR code payments with automated Razorpay integration

## **Timeline**: 3-5 days

## **Risk Level**: Low (keeping manual payment as backup)

---

## **📋 PHASE 1: SETUP & PREPARATION (Day 1)**

### **1.1 Razorpay Account Setup**

**Time**: 2-3 hours
**Responsible**: You (Rahul)

**Steps**:

1. Visit [razorpay.com](https://razorpay.com) and sign up
2. Complete KYC with:
   - PAN Card
   - Bank Account details
   - Aadhaar Card
   - Business details (sole proprietorship)
3. Wait for activation (2-3 business days)
4. Get API Keys from Dashboard:
   - Test Key ID & Secret (for development)
   - Live Key ID & Secret (for production)

**Expected Output**: Razorpay account with API keys

---

### **1.2 Supabase Edge Function Setup**

**Time**: 1 hour
**Responsible**: You (with AI assistance)

**Files to Create**:

- `supabase/functions/razorpay-webhook/index.ts`

**Code Structure**:

```typescript
// supabase/functions/razorpay-webhook/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  // Handle Razorpay webhook
  // Verify payment signature
  // Grant PRO credits to user
  // Return success response
});
```

**Environment Variables Needed**:

- `RAZORPAY_WEBHOOK_SECRET` (from Razorpay dashboard)

---

### **1.3 App Dependencies**

**Time**: 30 minutes
**Responsible**: You

**Commands**:

```bash
cd d:\ai-dresser
npm install react-native-razorpay
npm install --save-dev @types/react-native-razorpay
```

**Files Modified**:

- `package.json` (add dependency)

---

## **📋 PHASE 2: BACKEND DEVELOPMENT (Day 2)**

### **2.1 Create Supabase Edge Function**

**Time**: 2 hours
**Responsible**: You (with AI assistance)

**File**: `supabase/functions/razorpay-webhook/index.ts`

**Features**:

- ✅ Webhook signature verification
- ✅ Payment status validation
- ✅ Credit allocation (100 credits)
- ✅ Subscription expiry (30 days)
- ✅ Error handling & logging
- ✅ Duplicate payment prevention

**Database Updates**:

- `feature_credits` table: Update user credits
- `payment_submissions` table: Log Razorpay payments

---

### **2.2 Update Credit Service**

**Time**: 1 hour
**Responsible**: You

**File**: `OutfitScorer/services/creditService.ts`

**Changes**:

- Add `grantProSubscription()` function
- Add `verifyRazorpayPayment()` function
- Update credit allocation logic

---

### **2.3 Create Payment Service**

**Time**: 1 hour
**Responsible**: You

**New File**: `OutfitScorer/services/paymentService.ts`

**Features**:

- Razorpay payment initialization
- Payment verification
- Error handling
- Test mode support

---

## **📋 PHASE 3: FRONTEND DEVELOPMENT (Day 3)**

### **3.1 Update Payment Upload Screen**

**Time**: 3 hours
**Responsible**: You (with AI assistance)

**File**: `OutfitScorer/components/PaymentUploadScreen.tsx`

**New Features**:

- ✅ "Quick Pay with Razorpay" button (primary option)
- ✅ "Manual UPI Payment" button (backup option)
- ✅ Razorpay payment sheet integration
- ✅ Success/failure handling
- ✅ Loading states
- ✅ Error messages

**UI Changes**:

- Two payment options clearly separated
- Razorpay button: Purple gradient (brand color)
- Manual button: Secondary style
- Clear pricing: ₹29/month
- Benefits list: 100 credits, instant activation

---

### **3.2 Update Profile Screen**

**Time**: 30 minutes
**Responsible**: You

**File**: `screens/ProfileScreen.tsx`

**Changes**:

- Update upgrade button text: "Upgrade to PRO (Instant)"
- Add note about instant activation
- Keep existing PRO badge logic

---

### **3.3 Add Payment Types**

**Time**: 30 minutes
**Responsible**: You

**New File**: `OutfitScorer/types/payment.types.ts`

**Types**:

- `PaymentMethod` enum: 'razorpay' | 'manual'
- `RazorpayPaymentData` interface
- `PaymentResult` interface

---

## **📋 PHASE 4: TESTING & VALIDATION (Day 4)**

### **4.1 Test Environment Setup**

**Time**: 1 hour
**Responsible**: You

**Steps**:

1. Configure Razorpay test keys in app
2. Set up test Supabase environment
3. Create test user accounts
4. Prepare test payment scenarios

**Test Data**:

- Test cards: 4111 1111 1111 1111 (success)
- Test UPI: success@razorpay
- Test amounts: ₹29, ₹1 (for testing)

---

### **4.2 Unit Testing**

**Time**: 2 hours
**Responsible**: You

**Files to Test**:

- `OutfitScorer/services/paymentService.test.ts`
- `OutfitScorer/services/creditService.test.ts`
- `supabase/functions/razorpay-webhook/index.test.ts`

**Test Cases**:

- ✅ Payment initialization
- ✅ Webhook signature verification
- ✅ Credit allocation
- ✅ Error handling
- ✅ Duplicate payment prevention

---

### **4.3 Integration Testing**

**Time**: 2 hours
**Responsible**: You

**Test Scenarios**:

1. **Happy Path**: Payment → Webhook → Credits granted
2. **Payment Failure**: User cancels → No credits
3. **Webhook Failure**: Retry mechanism
4. **Duplicate Payment**: Prevention logic
5. **Network Issues**: Offline handling

**Manual Testing Steps**:

1. Build .apk with test keys
2. Install on test device
3. Make test payment
4. Verify credits in database
5. Check profile screen updates

---

### **4.4 Admin Dashboard Updates**

**Time**: 1 hour
**Responsible**: You

**File**: `Dashboard/services/paymentAdminService.ts`

**Changes**:

- Add Razorpay payment tracking
- Update payment stats to include automated payments
- Add payment method filtering

---

## **📋 PHASE 5: PRODUCTION DEPLOYMENT (Day 5)**

### **5.1 Environment Configuration**

**Time**: 30 minutes
**Responsible**: You

**Steps**:

1. Update app with live Razorpay keys
2. Configure production Supabase environment
3. Set up production webhook URL
4. Update Razorpay dashboard with live webhook URL

**Environment Variables**:

```
RAZORPAY_KEY_ID=live_key_from_dashboard
RAZORPAY_KEY_SECRET=live_secret_from_dashboard
RAZORPAY_WEBHOOK_SECRET=webhook_secret_from_dashboard
```

---

### **5.2 Supabase Deployment**

**Time**: 30 minutes
**Responsible**: You

**Commands**:

```bash
cd d:\ai-dresser\supabase
supabase functions deploy razorpay-webhook
supabase secrets set RAZORPAY_WEBHOOK_SECRET=your_webhook_secret
```

---

### **5.3 App Build & Release**

**Time**: 1 hour
**Responsible**: You

**Steps**:

1. Update app version in `app.json`
2. Build production .apk
3. Test on physical device
4. Upload to Google Play Console
5. Create release notes

**Release Notes**:

```
🚀 New Feature: Instant PRO Upgrade!
- Pay with Razorpay for instant activation
- Manual UPI payment still available
- 100 credits for ₹29/month
```

---

### **5.4 Monitoring Setup**

**Time**: 30 minutes
**Responsible**: You

**Monitoring Points**:

- Razorpay dashboard: Payment success rates
- Supabase logs: Webhook processing
- App analytics: Conversion rates
- Error tracking: Failed payments

---

## **📋 PHASE 6: POST-LAUNCH MONITORING (Week 1-2)**

### **6.1 User Feedback Collection**

**Time**: Ongoing
**Responsible**: You

**Methods**:

- In-app feedback forms
- User support tickets
- Payment success monitoring
- Conversion rate tracking

---

### **6.2 Performance Optimization**

**Time**: As needed
**Responsible**: You

**Metrics to Monitor**:

- Payment success rate (>95%)
- Webhook response time (<5 seconds)
- Credit allocation accuracy (100%)
- User drop-off points

---

### **6.3 Issue Resolution**

**Time**: As needed
**Responsible**: You

**Common Issues**:

- Webhook signature verification failures
- Network timeouts
- Payment gateway downtime
- User payment cancellations

---

## **📋 ROLLBACK PLAN**

### **If Razorpay Integration Fails**:

**Immediate Rollback** (30 minutes):

1. Comment out Razorpay code in PaymentUploadScreen.tsx
2. Keep only manual UPI payment option
3. Rebuild and release .apk
4. Users continue with existing QR code method

**Data Safety**:

- Razorpay payments logged separately
- Manual payments continue unaffected
- No data loss during rollback

---

## **📋 SUCCESS METRICS**

### **Technical Metrics**:

- ✅ Payment success rate: >95%
- ✅ Webhook processing time: <5 seconds
- ✅ Credit allocation accuracy: 100%
- ✅ App crash rate: <1%

### **Business Metrics**:

- ✅ Conversion rate improvement: +20%
- ✅ Time to PRO activation: 5 seconds (vs 2 hours)
- ✅ Customer satisfaction: >90%
- ✅ Revenue increase: Track Razorpay fees vs manual effort

---

## **📋 RISK ASSESSMENT**

### **Low Risk Factors** ✅:

- Keeping manual payment as backup
- Test environment available
- Supabase handles scaling
- Razorpay provides test mode

### **Mitigation Strategies**:

- Gradual rollout (test with 10% of users first)
- Feature flags for easy enable/disable
- Comprehensive logging
- Admin override capabilities

---

## **📋 BUDGET BREAKDOWN**

### **One-Time Costs**:

- Razorpay KYC: ₹0 (free)
- Development time: 5 days
- Testing devices: Already available

### **Recurring Costs**:

- Razorpay fees: 2% per transaction
- Supabase: Already paid
- No additional hosting costs

### **ROI Calculation**:

- Current: Manual review (2 hours/payment) = ₹200/hour equivalent
- New: Automated (5 seconds/payment) = ₹0.01 equivalent
- **Savings**: ₹199.99 per payment! 💰

---

## **📋 DEPENDENCIES & PREREQUISITES**

### **Must Have Before Starting**:

- ✅ Razorpay account with API keys
- ✅ Supabase project access
- ✅ Test device for Android app
- ✅ Basic understanding of React Native

### **Nice to Have**:

- Unit testing framework setup
- CI/CD pipeline
- Error monitoring service

---

## **📋 COMMUNICATION PLAN**

### **Internal Communication**:

- Daily progress updates
- Blocker resolution within 4 hours
- Code review for critical changes

### **User Communication**:

- App update notification
- In-app feature announcement
- Support documentation updates

---

## **📋 TIMELINE SUMMARY**

| Phase      | Duration | Key Deliverables                              |
| ---------- | -------- | --------------------------------------------- |
| Setup      | Day 1    | Razorpay account, Edge function skeleton      |
| Backend    | Day 2    | Webhook handler, payment service              |
| Frontend   | Day 3    | Updated payment screen, UI improvements       |
| Testing    | Day 4    | Unit tests, integration tests, manual testing |
| Deployment | Day 5    | Production build, monitoring setup            |
| Monitoring | Week 1-2 | Performance tracking, issue resolution        |

**Total Timeline**: 5 days to production
**Go-Live Date**: October 21, 2025

---

## **📋 NEXT STEPS**

1. **Today**: Start Razorpay account creation
2. **Tomorrow**: Begin Supabase Edge function development
3. **Questions?**: Ask me about any step in the plan

**Ready to start?** Let's begin with Phase 1! 🚀

---

_This plan ensures zero downtime, maintains backward compatibility, and provides instant ROI through automation._</content>
<parameter name="filePath">d:\ai-dresser\RAZORPAY_INTEGRATION_PLAN.md
