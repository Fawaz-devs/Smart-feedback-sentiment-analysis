import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../integrations/supabase/client";
import { Button } from "../components/ui/Button";
import { useToast } from "../hooks/use-toast";
import { LogOut, MessageSquare, Calendar } from "lucide-react";
import { FeedbackForm } from "../components/FeedbackForm";
import { SentimentBadge } from "../components/SentimentBadge";
import { format } from "date-fns";

interface Feedback {
  id: string;
  content: string;
  sentiment: "positive" | "negative" | "neutral";
  sentiment_score: number;
  created_at: string;
}

const UserDashboard = () => {
  const [user, setUser] = useState<any>(null);
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;

        if (!session?.user) {
          navigate("/auth");
          return;
        }

        const currentUser = session.user;
        setUser(currentUser);

        // Check user role to ensure they're not an admin
        try {
          const { data: roleData, error: roleError } = await supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", currentUser.id)
            .eq("role", "admin")
            .maybeSingle();

          if (roleError) {
            console.warn("Role fetch error (not critical for users):", roleError);
            // If there's an error checking role, treat as regular user
          }

          // If user is admin, redirect to admin dashboard
          if (roleData?.role === "admin") {
            navigate("/admin-dashboard");
            return;
          }
          // If no role data or not admin, continue as regular user
        } catch (roleError) {
          console.warn("Could not check user role, continuing as regular user:", roleError);
        }

        // Fetch user's feedback (handle potential RLS issues)
        // Limit to last 5 feedbacks
        try {
          const { data: feedbackData, error: feedbackError } = await supabase
            .from("feedback")
            .select("*")
            .eq("user_id", currentUser.id)
            .order("created_at", { ascending: false })
            .limit(5);

          if (feedbackError) {
            console.warn("Feedback fetch error:", feedbackError);
            // This is not critical, so we continue with empty feedbacks
          }

          setFeedbacks(feedbackData || []);
        } catch (feedbackError) {
          console.warn("Could not fetch user feedback:", feedbackError);
          setFeedbacks([]);
        }
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message || "Failed to fetch user data",
          variant: "destructive",
        });
        navigate("/auth");
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") navigate("/auth");
      if (event === "PASSWORD_RECOVERY") toast({ title: "Password recovery", description: "Please reset your password" });
    });

    return () => subscription.unsubscribe();
  }, [navigate, toast]);

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      toast({
        title: "Logged out",
        description: "You have been successfully logged out",
      });
      navigate("/auth");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to logout",
        variant: "destructive",
      });
    }
  };

  const handleRefresh = async () => {
    if (!user) return;
    try {
      // Limit to last 5 feedbacks
      const { data: feedbackData, error } = await supabase
        .from("feedback")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(5);

      if (error) {
        console.error("Refresh error:", error);
        toast({
          title: "Error",
          description: "Could not refresh feedback data",
          variant: "destructive",
        });
      } else {
        setFeedbacks(feedbackData || []);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to refresh feedback",
        variant: "destructive",
      });
    }
  };

  // Calculate sentiment counts for statistics (based on all feedbacks, not just displayed ones)
  const sentimentCounts = {
    total: feedbacks.length,
    positive: feedbacks.filter(f => f.sentiment === 'positive').length,
    neutral: feedbacks.filter(f => f.sentiment === 'neutral').length,
    negative: feedbacks.filter(f => f.sentiment === 'negative').length
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="glass-card p-6 rounded-2xl mb-8 flex justify-between items-center">
          <div className="flex items-center">
            <MessageSquare className="h-8 w-8 text-primary mr-3" />
            <div>
              <h1 className="text-2xl font-bold gradient-text">User Dashboard</h1>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleLogout} variant="outline" className="glass-card">
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Submit New Feedback */}
          <div className="glass-card p-6 rounded-2xl">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <MessageSquare className="mr-2 h-5 w-5 text-primary" />
              Submit New Feedback
            </h2>
            <FeedbackForm onSuccess={handleRefresh} />
          </div>

          {/* Statistics */}
          <div className="glass-card p-6 rounded-2xl">
            <h2 className="text-xl font-semibold mb-4">Your Statistics</h2>
            <div className="space-y-4">
              {[
                { label: "Total", value: sentimentCounts.total, color: "text-primary" },
                { label: "Positive", value: sentimentCounts.positive, color: "text-green-500" },
                { label: "Neutral", value: sentimentCounts.neutral, color: "text-gray-500" },
                { label: "Negative", value: sentimentCounts.negative, color: "text-red-500" }
              ].map((item) => (
                <div key={item.label} className="flex justify-between items-center">
                  <span className="text-muted-foreground">{item.label} Feedback</span>
                  <span className={`text-2xl font-bold ${item.color}`}>
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Feedback History - Show only last 5 feedbacks */}
        <div className="glass-card p-6 rounded-2xl mt-8">
          <h2 className="text-xl font-semibold mb-4">Your Recent Feedback</h2>
          {feedbacks.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No feedback submitted yet. Share your thoughts above!
            </p>
          ) : (
            <div className="space-y-4">
              {feedbacks.map((feedback) => (
                <div
                  key={feedback.id}
                  className="glass-card p-4 rounded-xl border border-border/50"
                >
                  <div className="flex justify-between items-start mb-2">
                    <SentimentBadge
                      sentiment={feedback.sentiment}
                      score={feedback.sentiment_score}
                    />
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Calendar className="mr-1 h-4 w-4" />
                      {format(new Date(feedback.created_at), "MMM dd, yyyy")}
                    </div>
                  </div>
                  <p className="text-sm mt-2">{feedback.content}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;