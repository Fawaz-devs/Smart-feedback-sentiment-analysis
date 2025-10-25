# Database Setup Guide

## Understanding the Issue

The error you're experiencing:
```
GET https://rdltjwexsscizleqsncv.supabase.co/rest/v1/user_roles?select=role&user_id=eq.8e42d501-c0ca-42c1-9892-7275c52f943b 404 (Not Found)
```

This indicates that the `user_roles` table doesn't exist in your Supabase database, even though you've successfully authenticated. The application expects certain database tables to be set up through migrations.

## Solution Options

### Option 1: Run Database Migrations (Recommended)

1. **Install Supabase CLI** (if not already installed):
   ```bash
   npm install -g supabase
   ```

2. **Link your project**:
   ```bash
   supabase link --project-ref uozoihhxkpzubzfzuckw
   ```
   (Use your actual project reference from `supabase/config.toml`)

3. **Run the migrations**:
   ```bash
   supabase db push
   ```

### Option 2: Manual Table Creation

If you prefer to create the tables manually, run these SQL commands in your Supabase SQL editor:

```sql
-- Create user profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Create user roles table
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'user',
  UNIQUE(user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Create feedback table
CREATE TABLE public.feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  sentiment TEXT CHECK (sentiment IN ('positive', 'negative', 'neutral')),
  sentiment_score NUMERIC(3, 2),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

-- Feedback policies
CREATE POLICY "Anyone can submit feedback"
  ON public.feedback FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can view own feedback"
  ON public.feedback FOR SELECT
  USING (auth.uid() = user_id OR auth.uid() IS NULL);

CREATE POLICY "Admins can view all feedback"
  ON public.feedback FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete feedback"
  ON public.feedback FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

-- Trigger to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', '')
  );
  
  -- Assign default user role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (new.id, 'user');
  
  RETURN new;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
```

### Option 3: Use the Database Setup Page

Navigate to `/database-setup` in your application to check the current database status.

## After Setting Up the Database

1. **Create an admin user**:
   - Go to `/admin-signup` to create a new admin account
   - Check your email for confirmation
   - Log in at `/admin-login`

2. **Assign admin role** (if not automatically assigned):
   - Manually insert a record in the `user_roles` table:
   ```sql
   INSERT INTO user_roles (user_id, role) 
   VALUES ('YOUR_USER_ID', 'admin');
   ```

## Verification

After setting up the database:
1. Try logging in again at `/admin-login`
2. Check the browser console for any remaining errors
3. Verify that the 404 error for `user_roles` is resolved

## Troubleshooting

If you continue to experience issues:
1. Check that all environment variables are correctly set in your `.env` file
2. Verify that your Supabase project URL and anon key are correct
3. Ensure that you've run all migrations successfully
4. Check the Supabase dashboard to confirm tables exist