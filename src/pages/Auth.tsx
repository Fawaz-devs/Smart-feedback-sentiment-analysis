import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, MessageSquare } from "lucide-react";
import { z } from "zod";

const authSchema = z.object({
  email: z.string().email("Invalid email address").max(255),
  password: z.string().min(6, "Password must be at least 6 characters").max(100),
});

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Check existing session on mount
  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) {
          console.error("Error fetching session:", sessionError);
          return;
        }
        if (sessionData?.session) {
          console.log("Existing session found, navigating to dashboard");
          navigate("/dashboard");
        }
      } catch (err) {
        console.error("Unexpected error during session check:", err);
      }
    };
    checkSession();
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const validated = authSchema.parse({ email, password });
      setIsLoading(true);

      if (isLogin) {
        // Sign in user
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: validated.email,
          password: validated.password,
        });

        if (signInError) {
          if (signInError.message.includes("Invalid login credentials")) {
            throw new Error("Invalid email or password");
          }
          throw signInError;
        }

        // Fetch session after login
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;
        if (!sessionData?.session) throw new Error("Failed to establish session");

        console.log("Login successful, navigating to dashboard...");
        toast({
          title: "Welcome back!",
          description: "Successfully logged in",
        });
        navigate("/dashboard");
      } else {
        // Sign up user
        const { error: signUpError } = await supabase.auth.signUp({
          email: validated.email,
          password: validated.password,
          options: {
            emailRedirectTo: `${window.location.origin}/dashboard`,
          },
        });

        if (signUpError) {
          if (signUpError.message.includes("already registered")) {
            throw new Error("Email already registered. Please login instead.");
          }
          throw signUpError;
        }

        toast({
          title: "Account created!",
          description: "You can now login",
        });
        setIsLogin(true);
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: "Validation Error",
          description: error.errors[0].message,
          variant: "destructive",
        });
      } else if (error instanceof Error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="glass-card w-full max-w-md p-8 rounded-2xl animate-fade-in">
        <div className="flex items-center justify-center mb-8">
          <MessageSquare className="h-12 w-12 text-primary mr-2" />
          <h1 className="text-3xl font-bold gradient-text">FeedbackAI</h1>
        </div>

        <h2 className="text-2xl font-semibold text-center mb-6">
          {isLogin ? "Welcome Back" : "Create Account"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="glass-input"
              placeholder="you@example.com"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="glass-input"
              placeholder="••••••••"
              required
            />
          </div>

          <Button type="submit" className="w-full bg-primary hover:bg-primary/90" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>{isLogin ? "Sign In" : "Sign Up"}</>
            )}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-sm text-primary hover:underline"
          >
            {isLogin
              ? "Don't have an account? Sign up"
              : "Already have an account? Sign in"}
          </button>
        </div>

        <div className="mt-4 text-center">
          <button
            onClick={() => navigate("/")}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Back to Home
          </button>
        </div>
      </div>
    </div>
  );
};

export default Auth;
