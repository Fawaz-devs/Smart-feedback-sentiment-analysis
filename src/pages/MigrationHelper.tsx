import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { GlassCard } from "../components/Glasscard";
import { Button } from "../components/ui/Button";
import { useToast } from "../hooks/use-toast";
import { Loader2 } from "lucide-react";

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

-- Enable RLS
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

-- User roles policies
CREATE POLICY "Users can view own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
  ON public.user_roles FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage roles"
  ON public.user_roles FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));
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

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
  `
];

export default function MigrationHelper() {
  const [loading, setLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  const copyToClipboard = async (text: string, index: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      toast({
        title: "Copied to clipboard",
        description: "Migration SQL copied successfully"
      });

      // Reset copied status after 2 seconds
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (err) {
      toast({
        title: "Copy failed",
        description: "Failed to copy to clipboard",
        variant: "destructive"
      });
    }
  };

  const copyAllMigrations = async () => {
    try {
      const allMigrations = migrations.join("\n\n");
      await navigator.clipboard.writeText(allMigrations);
      toast({
        title: "Copied to clipboard",
        description: "All migrations copied successfully"
      });
    } catch (err) {
      toast({
        title: "Copy failed",
        description: "Failed to copy to clipboard",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4 relative">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-20 w-72 h-72 bg-primary/20 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-secondary/20 rounded-full blur-3xl" />
      </div>
      <GlassCard className="w-full max-w-4xl relative z-10 p-6">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-2">
            Database Migration Helper
          </h1>
          <p className="text-muted-foreground">
            Copy and run these migrations in your Supabase SQL editor
          </p>
        </div>

        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 mb-6">
          <p className="text-yellow-500 font-medium">Important</p>
          <p className="text-sm mt-1">
            Copy each migration and run it separately in your Supabase SQL editor.
            Make sure to run them in order from top to bottom.
          </p>
        </div>

        <div className="space-y-6">
          {migrations.map((migration, index) => (
            <div key={index} className="glass-card p-6 rounded-xl">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Migration {index + 1}</h2>
                <Button
                  onClick={() => copyToClipboard(migration, index)}
                  variant="secondary"
                  size="sm"
                >
                  {copiedIndex === index ? "Copied!" : "Copy SQL"}
                </Button>
              </div>
              <pre className="text-sm bg-black/10 p-4 rounded-lg overflow-x-auto max-h-60 overflow-y-auto">
                {migration.trim()}
              </pre>
            </div>
          ))}

          <div className="glass-card p-6 rounded-xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">All Migrations</h2>
              <Button
                onClick={copyAllMigrations}
                variant="default"
              >
                Copy All
              </Button>
            </div>
            <pre className="text-sm bg-black/10 p-4 rounded-lg overflow-x-auto max-h-96 overflow-y-auto">
              {migrations.join("\n\n").trim()}
            </pre>
          </div>
        </div>

        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">How to Run Migrations</h2>
          <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
            <li>Go to your Supabase project dashboard</li>
            <li>Navigate to the SQL Editor</li>
            <li>Copy each migration (or all at once) from above</li>
            <li>Paste and run each migration in order</li>
            <li>After running all migrations, try logging in again</li>
          </ol>
        </div>

        <div className="mt-8 flex justify-between">
          <Button
            variant="ghost"
            onClick={() => navigate("/database-setup")}
          >
            Back to Database Setup
          </Button>
          <Button
            onClick={() => navigate("/admin-login")}
          >
            Try Admin Login
          </Button>
        </div>
      </GlassCard>
    </div>
  );
}