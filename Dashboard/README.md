# Admin Dashboard

A secure, hidden admin dashboard for monitoring user signups and managing users in the AI DressUp app.

## 🔐 Access

The admin dashboard is accessible only through a **secret gesture**:

1. **Long press (3 seconds)** on the **Settings tab icon** in the bottom navigation bar
2. The device will vibrate when the long press is detected
3. You'll be redirected to the Admin Login screen
4. Enter your admin credentials

## 📁 Structure

```
Dashboard/
├── index.ts                      # Module entry point
├── README.md                     # This file
├── constants/
│   └── config.ts                # Configuration (credentials, timeouts, etc.)
├── types/
│   └── index.ts                 # TypeScript type definitions
├── services/
│   ├── index.ts
│   └── adminService.ts          # Supabase API calls
├── hooks/
│   ├── index.ts
│   ├── useAdminAuth.ts          # Admin authentication logic
│   ├── useUserManagement.ts     # User CRUD operations
│   └── useAdminStats.ts         # Dashboard statistics
├── components/
│   ├── index.ts
│   ├── StatsCard.tsx            # Statistics display card
│   ├── UserListItem.tsx         # User list item component
│   └── DeleteUserModal.tsx      # User deletion confirmation
└── screens/
    ├── index.ts
    ├── AdminLoginScreen.tsx     # Login screen
    └── AdminDashboardScreen.tsx # Main dashboard
```

## 🚀 Setup Instructions

### 1. Update Admin Credentials

**File:** `Dashboard/constants/config.ts`

```typescript
export const ADMIN_CONFIG = {
  ADMIN_EMAIL: "your-email@example.com", // ⚠️ CHANGE THIS
  ADMIN_PASSWORD: "YourSecurePassword123!", // ⚠️ CHANGE THIS
  // ... other config
};
```

### 2. Run Supabase Migration

Apply the migration to create the `admin_users` table:

```bash
# Using Supabase CLI
supabase db push

# Or apply manually in Supabase Dashboard > SQL Editor
```

**File:** `supabase/migrations/20251011_create_admin_users.sql`

**Important:** Update the INSERT statement with your actual email:

```sql
INSERT INTO public.admin_users (email)
VALUES ('your-email@example.com') -- ⚠️ CHANGE THIS
ON CONFLICT (email) DO NOTHING;
```

### 3. Deploy Edge Function (Optional but Recommended)

For secure user deletion with service role privileges:

```bash
# Deploy the admin-delete-user function
supabase functions deploy admin-delete-user

# Set environment variables in Supabase Dashboard
# SUPABASE_SERVICE_ROLE_KEY (found in Settings > API)
```

**File:** `supabase/functions/admin-delete-user/index.ts`

If you don't deploy the Edge Function, the dashboard will use direct deletion (less secure but works for development).

### 4. Add More Admin Users (Optional)

To add more admin users, insert them into the `admin_users` table:

```sql
INSERT INTO public.admin_users (email)
VALUES ('another-admin@example.com');
```

## 🎯 Features

### Admin Login Screen

- Email and password authentication
- Password visibility toggle
- Session management with timeout
- Secure credential verification

### Dashboard Tabs

#### 1. **Stats Tab**

- Total users count
- New users (today, this week, this month)
- Gender breakdown (Male, Female, Other)
- Average age of users
- Beautiful stat cards with icons

#### 2. **Users Tab**

- Searchable user list (by name, email, phone)
- User profile cards with:
  - Name, email, phone
  - Age, gender
  - Profile image
  - Signup date/time
- Delete user functionality
- Real-time user count

#### 3. **Activity Tab**

- Coming soon: Activity logs monitoring
- Track user actions in real-time

### User Management

- **View Details:** Tap on a user card to see full details
- **Delete User:** Tap the trash icon
  - Confirmation modal to prevent accidents
  - Deletes user from auth and all related data
  - Shows loading state during deletion

### Security Features

1. **Session Timeout**

   - Auto-logout after 10 minutes of inactivity
   - Configurable in `config.ts`

2. **Admin Verification**

   - Checks email against `admin_users` table
   - Row Level Security (RLS) policies
   - No hardcoded passwords in code (except config)

3. **Hidden Access**

   - No visible UI elements for regular users
   - Secret long-press gesture
   - Can be disabled in production builds

4. **Service Role Protection**
   - User deletion uses Edge Function
   - Service role key never exposed to client

## ⚙️ Configuration

### Session Timeout

Change the timeout duration in `config.ts`:

```typescript
SESSION_TIMEOUT_MS: 10 * 60 * 1000, // 10 minutes
```

### Long Press Duration

Adjust how long to press Settings button:

```typescript
LONG_PRESS_DURATION_MS: 3000, // 3 seconds
```

### Theme Colors

Customize dashboard colors in `config.ts`:

```typescript
COLORS: {
  primary: '#4F46E5',
  danger: '#EF4444',
  success: '#10B981',
  // ... more colors
}
```

## 🔒 Security Best Practices

### For Production:

1. **Remove Hardcoded Credentials**

   - Use environment variables
   - Implement proper password hashing
   - Consider OAuth for admin login

2. **Hide in Production Builds**

   ```typescript
   // Add to config.ts
   const __DEV__ = process.env.NODE_ENV === "development";

   if (!__DEV__) {
     // Disable admin access in production
     return null;
   }
   ```

3. **Use Strong Passwords**

   - Minimum 12 characters
   - Include numbers, symbols, uppercase, lowercase

4. **Enable 2FA (Future)**

   - Add two-factor authentication
   - SMS or authenticator app

5. **Audit Logging**
   - Log all admin actions
   - Track who deleted which user

## 📊 Database Schema

### admin_users Table

```sql
id          UUID PRIMARY KEY
email       TEXT UNIQUE NOT NULL
created_at  TIMESTAMPTZ
updated_at  TIMESTAMPTZ
```

### Related Tables (Existing)

- `user_profiles` - User profile data
- `activity_logs` - User activity tracking
- `analysis_history` - AI analysis results
- `app_settings` - User app preferences

## 🐛 Troubleshooting

### "Invalid credentials" error

- Check that your email is in the `admin_users` table
- Verify the password in `config.ts` matches

### Users not loading

- Check network connection
- Verify Supabase URL and keys in `lib/supabase.ts`
- Check RLS policies on `user_profiles` table

### Delete not working

- If Edge Function is deployed, check function logs
- If using direct deletion, check table permissions
- Verify user_id is correct

### Long press not working

- Make sure you're pressing the Settings **tab icon**
- Hold for full 3 seconds
- Check if vibration is enabled on device

## 🔧 Development

### Testing

```typescript
// Test with your own email
const TEST_EMAIL = "your-email@example.com";
const TEST_PASSWORD = "YourPassword123!";
```

### Debug Mode

Enable console logging in services:

```typescript
// In adminService.ts
console.log("Debug:", data);
```

## 📝 TODO / Future Enhancements

- [ ] Activity logs implementation
- [ ] Export user data to CSV
- [ ] User analytics graphs
- [ ] Email notifications for new signups
- [ ] Bulk user operations
- [ ] Admin role levels (super admin, moderator)
- [ ] Two-factor authentication
- [ ] Admin action audit logs
- [ ] User search with filters (age range, signup date range)
- [ ] Dark mode toggle in dashboard

## 📄 License

This dashboard is part of the AI DressUp app and follows the same license.

## 👨‍💻 Maintenance

**Last Updated:** October 11, 2025  
**Version:** 1.0.0  
**Compatible with:** React Native, Expo, Supabase

---

**⚠️ Important Reminder:**

- Change default credentials before deployment
- Keep service role key secure
- Never commit credentials to version control
- Regular security audits recommended
