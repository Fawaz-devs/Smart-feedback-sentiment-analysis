# Authentication Debugging Guide

## Understanding the 400 Error

The error `POST https://rdltjwexsscizleqsncv.supabase.co/auth/v1/token?grant_type=password 400 (Bad Request)` indicates that the authentication request to Supabase is failing due to invalid data or malformed request.

## Common Causes and Solutions

### 1. Invalid Credentials
**Symptoms**: "Invalid login credentials" error message
**Solution**: 
- Double-check the email and password
- Ensure you're using the correct credentials for an existing user
- Try creating a new user through the debug interface

### 2. User Doesn't Exist
**Symptoms**: "Invalid login credentials" error message
**Solution**:
- Create a new user account
- Use the DebugAuth page at `/debug-auth` to create a test user

### 3. Email Not Confirmed
**Symptoms**: "Email not confirmed" error message
**Solution**:
- Check your email for a confirmation link from Supabase
- Click the confirmation link to verify your email address

### 4. Empty or Invalid Input
**Symptoms**: Generic 400 error without specific message
**Solution**:
- Ensure both email and password fields are filled
- Verify email format is valid (user@domain.com)
- Ensure password is at least 6 characters

## Debugging Steps

### Step 1: Check Browser Console
Open the browser's developer tools (F12) and check the Console tab for detailed error messages.

### Step 2: Use Debug Interface
Navigate to `http://localhost:5173/debug-auth` and use the tools provided:
1. Create a test user
2. Verify the user exists
3. Assign admin role
4. Test sign in

### Step 3: Manual Database Check
If you have access to your Supabase dashboard:
1. Go to Authentication > Users
2. Verify your user exists
3. Check if email is confirmed
4. Go to Table Editor > user_roles
5. Ensure your user has an 'admin' role

## Code-Level Debugging

The enhanced error handling in [AdminLogin.tsx](file:///d:/PROJECTS/feedbackanalysis/my-feedbackanalysis/src/pages/AdminLogin.tsx) now provides:
- Input validation for email and password
- More descriptive error messages
- Console logging for debugging

## Environment Variables

Ensure your [.env](file:///d:/PROJECTS/feedbackanalysis/my-feedbackanalysis/.env) file contains:
```
VITE_SUPABASE_URL=https://rdltjwexsscizleqsncv.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_ANON_KEY_HERE
```

## Testing Authentication

You can test the Supabase connection by checking the browser console after loading the app. Look for messages like:
- "🧪 Testing Supabase authentication connection..."
- "✅ Supabase connection successful!"

## Creating a New Admin User

1. Navigate to `/debug-auth`
2. Enter email and password in "Create Test User" section
3. Click "Create User"
4. Copy the User ID from the success message
5. Paste it in the "User ID" field in "Manage Roles" section
6. Click "Make Admin"
7. Use the credentials in the Admin Login form

## Troubleshooting Tips

1. **Clear browser storage**: Sometimes cached session data can cause issues
2. **Check network tab**: Look at the actual request/response in the Network tab
3. **Verify Supabase project**: Ensure you're using the correct project URL and keys
4. **Check for typos**: Ensure environment variables are correctly spelled