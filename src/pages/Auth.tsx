import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { GlassCard } from "../components/Glasscard";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Button } from "../components/ui/Button";
import { supabase } from "../integrations/supabase/client";
import { useToast } from "../hooks/use-toast";
import { Loader2, LogIn, UserPlus } from "lucide-react";

const Auth = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [showAdminError, setShowAdminError] = useState(false); // New state to track admin error
  const navigate = useNavigate();
  const { toast } = useToast();

  // Check if user is already logged in
  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          // Check if user is admin
          const { data: roleData, error: roleError } = await supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", session.user.id)
            .eq("role", "admin")
            .maybeSingle();

          if (roleError) {
            console.error("Role check error:", roleError);
            // If there's an error checking role, treat as regular user
            navigate("/dashboard");
            return;
          }

          if (roleData?.role === "admin") {
            // Admins cannot access user login page - show error and sign out
            toast({
              title: "Access Denied",
              description: "Admins cannot access the user login page. Please use the Admin Login page.",
              variant: "destructive",
            });
            setShowAdminError(true); // Show the red warning
            // Sign out admin and stay on this page to show the error
            await supabase.auth.signOut();
          } else {
            // Regular user or user with no role
            navigate("/dashboard");
          }
        }
      } catch (error) {
        console.error("Session check error:", error);
        // If there's any error, redirect to dashboard as regular user
        navigate("/dashboard");
      }
    };
    checkSession();
  }, [navigate]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setShowAdminError(false); // Reset admin error state

    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;

        toast({
          title: "Signup Successful!",
          description: "Please check your email to confirm your registration.",
        });
        setIsSignUp(false);
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;

        // Check if user is admin
        const { data: roleData, error: roleError } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", data.user.id)
          .eq("role", "admin")
          .maybeSingle();

        if (roleError) {
          console.error("Role check error:", roleError);
          // If there's an error checking role, treat as regular user
          toast({ title: "Welcome!", description: "You are now logged in." });
          navigate("/dashboard");
          return;
        }

        if (roleData?.role === "admin") {
          // Admins cannot access user login page - show error and sign out
          toast({
            title: "Access Denied",
            description: "Admins cannot access the user login page. Please use the Admin Login page.",
            variant: "destructive",
          });
          setShowAdminError(true); // Show the red warning
          await supabase.auth.signOut(); // Sign out the admin user
          // Stay on this page to show the error message
        } else {
          toast({ title: "Welcome!", description: "You are now logged in." });
          navigate("/dashboard");
        }
      }
    } catch (error: any) {
      console.error("Auth error:", error);
      toast({
        title: "Error",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4 relative">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-20 w-72 h-72 bg-primary/20 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-secondary/20 rounded-full blur-3xl" />
      </div>
      <GlassCard className="w-full max-w-md relative z-10 p-6">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-2">
            {isSignUp ? "Create Account" : "Welcome Back"}
          </h1>
          <p className="text-muted-foreground">
            {isSignUp ? "Create an account to track your feedback" : "Sign in to your account"}
          </p>
          {/* Show red warning only when an admin tries to access this page */}
          {showAdminError && (
            <div className="mt-3 p-3 bg-destructive/10 rounded-lg">
              <p className="text-sm text-destructive font-medium">
                ⚠️ Access Denied: Admins cannot access the user login page. Please use the Admin Login page.
              </p>
            </div>
          )}
        </div>
        <form onSubmit={handleAuth} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="user@example.com"
              className="bg-input/50 backdrop-blur-sm"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              className="bg-input/50 backdrop-blur-sm"
            />
          </div>
          <Button
            type="submit"
            className="w-full bg-gradient-primary hover:opacity-90"
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : isSignUp ? (
              <UserPlus className="mr-2 h-4 w-4" />
            ) : (
              <LogIn className="mr-2 h-4 w-4" />
            )}
            {isSignUp ? "Sign Up" : "Sign In"}
          </Button>
        </form>
        <div className="mt-4 text-center text-sm">
          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-primary hover:underline"
          >
            {isSignUp
              ? "Already have an account? Sign In"
              : "Don't have an account? Sign Up"}
          </button>
        </div>
      </GlassCard>
    </div>
  );
};

export default Auth;