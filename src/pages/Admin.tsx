import { useEffect, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { GlassCard } from "@/components/Glasscard";
import { SentimentBadge } from "@/components/SentimentBadge";
import { supabase } from "@/integrations/supabase/client";
import type { Session } from "@supabase/supabase-js";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Trash2, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Feedback {
  id: string;
  content: string;
  sentiment: "positive" | "negative" | "neutral";
  sentiment_score: number;
  created_at: string;
  user_id: string | null;
}

export default function Admin() {
  const [session, setSession] = useState<Session | null>(null);
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (!session) {
        navigate("/auth");
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (!session) {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    const checkAdminAndLoad = async () => {
      if (!session?.user) return;

      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id)
        .eq("role", "admin")
        .maybeSingle();

      if (!data) {
        toast({
          title: "Access Denied",
          description: "You don't have admin privileges.",
          variant: "destructive",
        });
        navigate("/");
        return;
      }

      setIsAdmin(true);
      loadFeedbacks();
    };

    checkAdminAndLoad();
  }, [session, navigate, toast]);

  const loadFeedbacks = async () => {
    const { data, error } = await supabase
      .from("feedback")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error loading feedbacks:", error);
      toast({
        title: "Error",
        description: "Failed to load feedback data.",
        variant: "destructive",
      });
    } else {
      setFeedbacks((data || []) as Feedback[]);
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("feedback").delete().eq("id", id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete feedback.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Feedback deleted successfully.",
      });
      loadFeedbacks();
    }
  };

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-hero">
      <Navbar />

      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-40 left-20 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-secondary/10 rounded-full blur-3xl" />
      </div>

      <main className="container mx-auto px-4 pt-24 pb-12 relative z-10">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Shield className="w-8 h-8 text-primary" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Admin Panel
            </h1>
          </div>
          <p className="text-muted-foreground">
            Manage and moderate all feedback submissions
          </p>
        </div>

        <GlassCard>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold">All Feedback</h2>
            <div className="text-sm text-muted-foreground">
              Total: {feedbacks.length} submissions
            </div>
          </div>

          <div className="space-y-4">
            {feedbacks.map((feedback) => (
              <div
                key={feedback.id}
                className="p-4 rounded-xl bg-card/30 border border-glass-border/30 hover:bg-card/40 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <SentimentBadge
                      sentiment={feedback.sentiment}
                      score={feedback.sentiment_score}
                    />
                    <span className="text-xs text-muted-foreground">
                      {new Date(feedback.created_at).toLocaleString()}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(feedback.id)}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-foreground mb-2">{feedback.content}</p>
                <div className="text-xs text-muted-foreground">
                  User ID: {feedback.user_id || "Anonymous"}
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      </main>
    </div>
  );
}
