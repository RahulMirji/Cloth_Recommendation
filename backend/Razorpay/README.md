# Razorpay Payment Integration Module

## 📁 Folder Structure

```
backend/Razorpay/
├── index.js                    # Main entry point
├── README.md                   # This file
├── controllers/
│   └── paymentController.js    # Business logic for payments
├── routes/
│   └── paymentRoutes.js        # API route definitions
└── utils/
    ├── razorpayInstance.js     # Razorpay SDK initialization
    └── razorpayHelpers.js      # Helper functions
```

## 🚀 Features

- **Automated Payment Processing**: No manual verification needed
- **Instant Credit Addition**: Credits added immediately after payment
- **Secure Signature Verification**: Validates all payment callbacks
- **Dual Payment System**: Works alongside existing manual payment method
- **Complete Audit Trail**: All transactions logged in database

## 📋 API Endpoints

### 1. Create Order
**POST** `/api/razorpay/create-order`

Creates a new Razorpay order for credit purchase.

**Request Body:**
```json
{
  "credits": 10,
  "userId": "user-uuid"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Order created successfully",
  "data": {
    "orderId": "order_xxxxx",
    "amount": 99,
    "amountInPaise": 9900,
    "currency": "INR",
    "credits": 10
  }
}
```

### 2. Verify Payment
**POST** `/api/razorpay/verify-payment`

Verifies payment signature and adds credits to user account.

**Request Body:**
```json
{
  "razorpay_order_id": "order_xxxxx",
  "razorpay_payment_id": "pay_xxxxx",
  "razorpay_signature": "signature_xxxxx",
  "userId": "user-uuid"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Payment successful! 10 credits added to your account.",
  "data": {
    "orderId": "order_xxxxx",
    "paymentId": "pay_xxxxx",
    "credits": 10,
    "amount": 99
  }
}
```

### 3. Get Payment Status
**GET** `/api/razorpay/payment-status/:orderId`

Checks the status of a payment by order ID.

**Response:**
```json
{
  "success": true,
  "data": {
    "orderId": "order_xxxxx",
    "paymentId": "pay_xxxxx",
    "status": "approved",
    "amount": 99,
    "credits": 10
  }
}
```

## 💳 Credit Plans

| Credits | Price (INR) |
|---------|-------------|
| 10      | ₹99         |
| 25      | ₹199        |
| 50      | ₹349        |
| 100     | ₹599        |

## 🔐 Security Features

1. **Signature Verification**: All payment callbacks verified using HMAC SHA256
2. **Environment Variables**: Secrets never exposed in code
3. **Database Validation**: User and order validation before processing
4. **Idempotency**: Prevents duplicate credit addition
5. **Audit Logging**: Complete transaction history maintained

## 🗄️ Database Schema

### Required Columns in `payment_submissions` table:

```sql
ALTER TABLE payment_submissions ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'manual';
ALTER TABLE payment_submissions ADD COLUMN IF NOT EXISTS razorpay_order_id TEXT;
ALTER TABLE payment_submissions ADD COLUMN IF NOT EXISTS razorpay_payment_id TEXT;
ALTER TABLE payment_submissions ADD COLUMN IF NOT EXISTS razorpay_signature TEXT;
```

## 🔧 Setup Instructions

### 1. Environment Variables

Add to `backend/.env`:
```env
RAZORPAY_KEY_ID=rzp_test_xxxxx
RAZORPAY_KEY_SECRET=your_secret_key
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 2. Install Dependencies

```bash
cd backend
npm install razorpay @supabase/supabase-js
```

### 3. Import Routes in Main Server

In your `backend/server.js` or `backend/app.js`:

```javascript
const razorpay = require('./Razorpay');

// Use Razorpay routes
app.use('/api/razorpay', razorpay.routes);
```

### 4. Update Database

Run the migration to add required columns to `payment_submissions` table.

## 📱 Frontend Integration

See the main project README for frontend integration instructions.

## 🧪 Testing

### Test with Razorpay Test Cards

**Test Card Details:**
- Card Number: `4111 1111 1111 1111`
- CVV: Any 3 digits
- Expiry: Any future date
- Name: Any name

### Health Check

```bash
curl http://localhost:3000/api/razorpay/health
```

## 🐛 Troubleshooting

### Common Issues:

1. **"RAZORPAY_KEY_ID not defined"**
   - Ensure `.env` file exists in backend folder
   - Restart the server after adding env variables

2. **"Payment signature verification failed"**
   - Check if you're using correct key secret
   - Ensure order_id and payment_id are correct

3. **"Failed to add credits"**
   - Verify `add_user_credits` RPC function exists in Supabase
   - Check user_id is valid UUID

## 📞 Support

For issues or questions, contact the development team.

---

**Created:** November 1, 2025  
**Version:** 1.0.0  
**Status:** Production Ready ✅
