import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { GlassCard } from "../components/Glasscard";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Button } from "../components/ui/Button";
import { supabase } from "../integrations/supabase/client";
import { useToast } from "../hooks/use-toast";
import { Loader2 } from "lucide-react";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showUserError, setShowUserError] = useState(false); // New state to track user error
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const checkAdminSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          const { data: roleData, error: roleError } = await supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", session.user.id)
            .eq("role", "admin")
            .maybeSingle();

          if (roleError) {
            console.error("Role check error:", roleError);
          }

          if (roleData?.role === "admin") {
            navigate("/admin-dashboard");
          } else {
            // If not admin, show error but stay on page
            setShowUserError(true);
            // Sign out user and stay on this page to show the error
            await supabase.auth.signOut();
          }
        }
      } catch (error) {
        console.error("Session check error:", error);
      }
    };
    checkAdminSession();
  }, [navigate, toast]);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setShowUserError(false); // Reset user error state

    // Validate input
    if (!email || !password) {
      toast({
        title: "Validation Error",
        description: "Please enter both email and password",
        variant: "destructive"
      });
      setLoading(false);
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast({
        title: "Validation Error",
        description: "Please enter a valid email address",
        variant: "destructive"
      });
      setLoading(false);
      return;
    }

    // Validate password length
    if (password.length < 6) {
      toast({
        title: "Validation Error",
        description: "Password must be at least 6 characters",
        variant: "destructive"
      });
      setLoading(false);
      return;
    }

    try {
      console.log("Attempting to sign in with:", { email, password: "*".repeat(password.length) });
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) {
        console.error("Supabase auth error:", error);
        throw error;
      }

      if (!data.session) {
        throw new Error("No session returned from Supabase");
      }

      console.log("Authentication successful, checking user role...");
      const { data: roleData, error: roleError } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", data.session.user.id)
        .maybeSingle();

      if (roleError) {
        console.error("Role check error:", roleError);
        // Handle the case where the user_roles table doesn't exist or is inaccessible
        if (roleError.message.includes("404") || roleError.message.includes("not found")) {
          toast({
            title: "Database Not Set Up",
            description: "The required database tables are missing. Please set up the database schema.",
            variant: "destructive"
          });

          // Provide a link to the database setup page
          setTimeout(() => {
            if (confirm("Would you like to go to the database setup page to resolve this issue?")) {
              window.location.href = "/database-setup";
            }
          }, 1000);

          return;
        }
        throw roleError;
      }

      console.log("Role data:", roleData);

      if (roleData?.role === "admin") {
        toast({ title: "Welcome Admin!", description: "You are now logged in." });
        navigate("/admin-dashboard");
      } else {
        // Regular users cannot access admin login page - show error and sign out
        toast({
          title: "Access Denied",
          description: "Users cannot access the admin login page. Please use the User Sign In page.",
          variant: "destructive",
        });
        setShowUserError(true); // Show the red warning
        await supabase.auth.signOut(); // Sign out the user
        // Stay on this page to show the error message
      }
    } catch (error: any) {
      console.error("Login error:", error);
      let errorMessage = error.message || "An unknown error occurred";

      // Provide more specific error messages
      if (errorMessage.includes("Invalid login credentials")) {
        errorMessage = "Invalid email or password. Please check your credentials and try again.";
      } else if (errorMessage.includes("Email not confirmed")) {
        errorMessage = "Please confirm your email address before signing in.";
      }

      toast({
        title: "Login Failed",
        description: errorMessage,
        variant: "destructive"
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
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-2">Admin Login</h1>
          <p className="text-muted-foreground">Enter your admin credentials to access the admin panel</p>
          {/* Show red warning only when a user tries to access this page */}
          {showUserError && (
            <div className="mt-3 p-3 bg-destructive/10 rounded-lg">
              <p className="text-sm text-destructive font-medium">
                ⚠️ Access Denied: Users cannot access the admin login page. Please use the User Sign In page.
              </p>
            </div>
          )}
        </div>
        <form onSubmit={handleAdminLogin} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="admin@example.com" className="bg-input/50 backdrop-blur-sm" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="••••••••" className="bg-input/50 backdrop-blur-sm" />
          </div>
          <Button type="submit" className="w-full bg-gradient-primary hover:opacity-90" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Sign In
          </Button>
          <p className="mt-4 text-sm text-center text-muted-foreground">
            Don't have an account? <a href="/admin-signup" className="text-primary hover:underline">Sign up</a>
          </p>
        </form>
      </GlassCard>
    </div>
  );
}