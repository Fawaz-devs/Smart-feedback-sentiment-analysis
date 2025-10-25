# Authentication Debugging Guide

This guide will help you resolve the 400 error you're experiencing with Supabase authentication.

## Understanding the Error

The error `Failed to load resource: the server responded with a status of 400 ()` from `rdltjwexsscizleqsncv.supabase.co/auth/v1/token?grant_type=password` indicates that the authentication request to Supabase is failing. This typically happens for one of these reasons:

1. **Invalid credentials** - The email/password combination doesn't exist
2. **User doesn't exist** - No user account with that email
3. **Email not confirmed** - If email confirmation is required, user can't sign in until they confirm
4. **User exists but isn't admin** - User can sign in but doesn't have admin privileges

## Steps to Fix the Issue

### 1. Access the Debug Tool

Navigate to `/debug-auth` in your application to access the authentication debugging tools.

### 2. Create a Test User

If you don't have any users yet:
1. Enter an email and password in the "Create Test User" section
2. Click "Create User"
3. Check your email for a confirmation link (if email confirmation is enabled)

### 3. Verify User Exists

1. Enter the email in the "Check User" section
2. Click "Check User Exists"
3. If the user exists, the User ID will be automatically filled in the "Manage Roles" section

### 4. Assign Admin Role

1. Make sure the User ID is filled in the "Manage Roles" section
2. Click "Make Admin" to assign admin privileges to the user

### 5. Test Sign In

1. Enter the email and password in the "Sign In" section
2. Click "Sign In"
3. If successful, you should be redirected to the admin dashboard

## Manual Database Fix (Alternative)

If you prefer to fix this directly in the database:

1. Make sure the user exists in the `auth.users` table
2. Check if the user has an entry in the `profiles` table
3. Add an entry to the `user_roles` table for the user with role = 'admin'

Example SQL:
```sql
-- Check if user exists
SELECT id, email FROM auth.users WHERE email = 'your_email@example.com';

-- Check if user has profile
SELECT * FROM profiles WHERE id = 'USER_ID_FROM_ABOVE';

-- Check if user has role
SELECT * FROM user_roles WHERE user_id = 'USER_ID_FROM_ABOVE';

-- Assign admin role (if not exists)
INSERT INTO user_roles (user_id, role) VALUES ('USER_ID_FROM_ABOVE', 'admin');
```

## Common Issues and Solutions

### Issue: "Invalid login credentials"
**Solution**: Double-check the email and password. Make sure the user account exists.

### Issue: "Email not confirmed"
**Solution**: Check your email for a confirmation link from Supabase. Click the link to confirm your email.

### Issue: "Access Denied" after sign in
**Solution**: The user exists but doesn't have admin privileges. Use the debug tool or SQL to assign the admin role.

## Removing the Debug Tool

For production, remember to remove:
1. The [DebugAuth.tsx](file:///d:/PROJECTS/feedbackanalysis/my-feedbackanalysis/src/pages/DebugAuth.tsx) component
2. The route in [App.tsx](file:///d:/PROJECTS/feedbackanalysis/my-feedbackanalysis/src/App.tsx)
3. The [debugAuth.ts](file:///d:/PROJECTS/feedbackanalysis/my-feedbackanalysis/src/utils/debugAuth.ts) utility file
4. This README file