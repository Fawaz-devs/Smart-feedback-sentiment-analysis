import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { MessageSquare, BarChart3, Shield, LogOut, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

import { useToast } from "@/hooks/use-toast";
import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";

export const Navbar = () => {
  const location = useLocation();
  const { toast } = useToast();
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  // Fetch current session and subscribe
  useEffect(() => {
    const getSession = async () => {
      const { data } = await supabase.auth.getSession();
      setSession(data.session);
    };

    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Check if user is admin
  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!session?.user) {
        setIsAdmin(false);
        return;
      }

      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id)
        .eq("role", "admin")
        .maybeSingle();

      if (error) console.error("Error checking admin role:", error.message);

      setIsAdmin(!!data);
    };

    checkAdminStatus();
  }, [session]);

  const handleSignOut = async () => {
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
    }
  };

  // Nav links based on role
  const navLinks = [
    { href: "/", label: "Home", icon: MessageSquare },
    ...(session && !isAdmin ? [{ href: "/dashboard", label: "Dashboard", icon: BarChart3 }] : []),
    ...(session && isAdmin ? [{ href: "/admin-dashboard", label: "Admin Panel", icon: Shield }] : []),
  ];

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
                <Link to="/auth">
                  <Button variant="default">Sign In</Button>
                </Link>
                <Link to="/admin-login">
                  <Button variant="default">Admin</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};
