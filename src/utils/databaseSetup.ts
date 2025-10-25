import { supabase } from "../integrations/supabase/client";

/**
 * Utility functions to help set up and verify the database schema
 */

// Check if required tables exist
export const checkDatabaseSchema = async () => {
  try {
    // Check if user_roles table exists by querying its structure
    const { data, error } = await supabase
      .from('user_roles')
      .select('id')
      .limit(1);

    if (error) {
      console.error('Error checking user_roles table:', error);
      return { exists: false, error: error.message };
    }

    return { exists: true, data };
  } catch (err) {
    console.error('Unexpected error checking database schema:', err);
    return { exists: false, error: 'Unexpected error occurred' };
  }
};

// Create user role entry
export const createUserRole = async (userId: string, role: 'admin' | 'user' = 'user') => {
  try {
    const { data, error } = await supabase
      .from('user_roles')
      .insert([
        {
          user_id: userId,
          role: role
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('Error creating user role:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (err) {
    console.error('Unexpected error creating user role:', err);
    return { success: false, error: 'Unexpected error occurred' };
  }
};

// Check if user has admin role
export const checkUserRole = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .eq('role', 'admin')
      .maybeSingle();

    if (error) {
      console.error('Error checking user role:', error);
      return { isAdmin: false, error: error.message };
    }

    return { isAdmin: !!data, data };
  } catch (err) {
    console.error('Unexpected error checking user role:', err);
    return { isAdmin: false, error: 'Unexpected error occurred' };
  }
};

// Initialize database schema (for development only)
export const initializeDatabase = async () => {
  try {
    console.log('Initializing database schema...');

    // Check if user_roles table exists
    const schemaCheck = await checkDatabaseSchema();
    if (!schemaCheck.exists) {
      console.log('User roles table does not exist. Please run database migrations.');
      return { success: false, message: 'User roles table does not exist. Please run database migrations.' };
    }

    console.log('Database schema check passed.');
    return { success: true, message: 'Database schema is properly configured.' };
  } catch (err) {
    console.error('Error initializing database:', err);
    return { success: false, error: 'Failed to initialize database.' };
  }
};

// Get the SQL migrations as strings
export const getMigrations = () => {
  return [
    `
-- Create user profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
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
    `,
    `
-- Create user roles table
CREATE TYPE IF NOT EXISTS public.app_role AS ENUM ('admin', 'user');

CREATE TABLE IF NOT EXISTS public.user_roles (
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
    `,
    `
-- Create feedback table
CREATE TABLE IF NOT EXISTS public.feedback (
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
    `,
    `
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

CREATE TRIGGER IF NOT EXISTS on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
    `
  ];
};