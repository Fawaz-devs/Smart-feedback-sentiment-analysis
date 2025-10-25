import { Link, useLocation } from "react-router-dom";
import { Button } from "../components/ui/Button";
import { MessageSquare, BarChart3, Shield, LogOut, User } from "lucide-react";
import { supabase } from "../integrations/supabase/client";

import { useToast } from "../hooks/use-toast";
import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";

export const Navbar = () => {
  const location = useLocation();
  const { toast } = useToast();
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  // Fetch current session and subscribe
  useEffect(() => {
    const getSession = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) {
          console.error("Error getting session:", error.message);
          setSession(null);
        } else {
          setSession(data.session);
        }
      } catch (err) {
        console.error("Unexpected error getting session:", err);
        setSession(null);
      } finally {
        setLoading(false);
      }
    };

    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setLoading(false);

      // When session changes, recheck admin status
      if (newSession) {
        checkAdminStatus(newSession);
      } else {
        setIsAdmin(false);
      }
    });

    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, []);

  // Check if user is admin
  const checkAdminStatus = async (userSession: Session | null) => {
    if (!userSession?.user) {
      setIsAdmin(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userSession.user.id)
        .eq("role", "admin")
        .maybeSingle();

      if (error) {
        console.error("Error checking admin role:", error.message);
        setIsAdmin(false);
      } else {
        setIsAdmin(!!data);
      }
    } catch (err) {
      console.error("Unexpected error checking admin role:", err);
      setIsAdmin(false);
    }
  };

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Signed out successfully",
          description: "You have been logged out.",
        });
        setIsAdmin(false);
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "An unexpected error occurred during sign out.",
        variant: "destructive",
      });
    }
  };

  // Nav links based on role
  const navLinks = [
    { href: "/", label: "Home", icon: MessageSquare },
    ...(session && !isAdmin ? [{ href: "/dashboard", label: "Dashboard", icon: BarChart3 }] : []),
    ...(session && isAdmin ? [{ href: "/admin-dashboard", label: "Admin Panel", icon: Shield }] : []),
  ];

  // Show loading state
  if (loading) {
    return (
      <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-glass">
        <div className="absolute inset-0 bg-card/40 border-b border-glass-border/50" />
        <div className="container relative mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-primary animate-pulse" />
              <div className="h-6 w-24 bg-muted animate-pulse rounded" />
            </div>
            <div className="flex items-center gap-2">
              <div className="h-8 w-20 bg-muted animate-pulse rounded" />
              <div className="h-8 w-20 bg-muted animate-pulse rounded" />
            </div>
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-glass">
      <div className="absolute inset-0 bg-card/40 border-b border-glass-border/50" />
      <div className="container relative mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Brand */}
          <Link to="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center shadow-glow">
              <MessageSquare className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              FeedbackAI
            </span>
          </Link>

          {/* Navigation Links */}
          <div className="flex items-center gap-1">
            {navLinks.map(({ href, label, icon: Icon }) => {
              const isActive = location.pathname === href;
              return (
                <Link key={href} to={href}>
                  <Button
                    variant="ghost"
                    className={isActive ? "bg-primary/10 text-primary" : ""}
                  >
                    <Icon className="w-4 h-4 mr-2" />
                    {label}
                  </Button>
                </Link>
              );
            })}
          </div>

          {/* Auth buttons */}
          <div className="flex items-center gap-2">
            {session ? (
              <>
                <Button variant="ghost" size="icon">
                  <User className="w-5 h-5" />
                </Button>
                <Button onClick={handleSignOut} variant="ghost">
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </Button>
              </>
            ) : (
              <>
                {/* Clearly labeled as User Sign In */}
                <Link to="/auth">
                  <Button variant="default">User Sign In</Button>
                </Link>
                {/* Admin button is separate and clearly labeled */}
                <Link to="/admin-login">
                  <Button variant="outline">Admin Login</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};