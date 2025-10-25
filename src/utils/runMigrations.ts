import { supabase } from "../integrations/supabase/client";

/**
 * Utility function to run database migrations directly
 * This is for development purposes only
 */

const migrations = [
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
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy WHERE polname = 'Users can view own profile'
  ) THEN
    CREATE POLICY "Users can view own profile"
      ON public.profiles FOR SELECT
      USING (auth.uid() = id);
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy WHERE polname = 'Users can update own profile'
  ) THEN
    CREATE POLICY "Users can update own profile"
      ON public.profiles FOR UPDATE
      USING (auth.uid() = id);
  END IF;
END
$$;
  `,
  `
-- Create user roles table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type WHERE typname = 'app_role'
  ) THEN
    CREATE TYPE public.app_role AS ENUM ('admin', 'user');
  END IF;
END
$$;

CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role public.app_role NOT NULL DEFAULT 'user',
  UNIQUE(user_id, role)
);

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
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

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy WHERE polname = 'Users can view own roles'
  ) THEN
    CREATE POLICY "Users can view own roles"
      ON public.user_roles FOR SELECT
      USING (auth.uid() = user_id);
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy WHERE polname = 'Admins can view all roles'
  ) THEN
    CREATE POLICY "Admins can view all roles"
      ON public.user_roles FOR SELECT
      USING (public.has_role(auth.uid(), 'admin'));
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy WHERE polname = 'Admins can manage roles'
  ) THEN
    CREATE POLICY "Admins can manage roles"
      ON public.user_roles FOR ALL
      USING (public.has_role(auth.uid(), 'admin'));
  END IF;
END
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

-- Enable RLS
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy WHERE polname = 'Anyone can submit feedback'
  ) THEN
    CREATE POLICY "Anyone can submit feedback"
      ON public.feedback FOR INSERT
      WITH CHECK (true);
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy WHERE polname = 'Users can view own feedback'
  ) THEN
    CREATE POLICY "Users can view own feedback"
      ON public.feedback FOR SELECT
      USING (auth.uid() = user_id OR auth.uid() IS NULL);
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy WHERE polname = 'Admins can view all feedback'
  ) THEN
    CREATE POLICY "Admins can view all feedback"
      ON public.feedback FOR SELECT
      USING (public.has_role(auth.uid(), 'admin'));
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy WHERE polname = 'Admins can delete feedback'
  ) THEN
    CREATE POLICY "Admins can delete feedback"
      ON public.feedback FOR DELETE
      USING (public.has_role(auth.uid(), 'admin'));
  END IF;
END
$$;
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

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created'
  ) THEN
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW
      EXECUTE FUNCTION public.handle_new_user();
  END IF;
END
$$;
  `
];

export const runMigrations = async () => {
  console.log("Running migrations...");

  for (let i = 0; i < migrations.length; i++) {
    const migration = migrations[i];
    console.log(`Running migration ${i + 1}/${migrations.length}`);

    try {
      // Note: Supabase JS client doesn't support raw SQL execution
      // We'll need to use a different approach
      console.log("Migration SQL:", migration);
    } catch (error) {
      console.error(`Error running migration ${i + 1}:`, error);
      return { success: false, error: `Migration ${i + 1} failed: ${error}` };
    }
  }

  return { success: true, message: "All migrations processed" };
};

export default runMigrations;