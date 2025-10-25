import { useEffect, useState } from "react";
import { Navbar } from "../components/Navbar";
import { GlassCard } from "../components/Glasscard";
import { SentimentBadge } from "../components/SentimentBadge";
import { supabase } from "../integrations/supabase/client";
import type { Session } from '@supabase/supabase-js';
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/Button";
import { Trash2, Shield, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { useToast } from "../hooks/use-toast";
// Import recharts components
import { BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

interface Feedback {
  id: string;
  content: string;
  sentiment: "positive" | "negative" | "neutral";
  sentiment_score: number;
  created_at: string;
  user_id: string | null;
}

// Define colors for sentiment types
const SENTIMENT_COLORS = {
  positive: '#10B981', // green
  negative: '#EF4444', // red
  neutral: '#9CA3AF'   // gray
};

export default function Admin() {
  const [session, setSession] = useState<Session | null>(null);
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Calculate sentiment counts
  const sentimentCounts = {
    positive: feedbacks.filter(f => f.sentiment === 'positive').length,
    negative: feedbacks.filter(f => f.sentiment === 'negative').length,
    neutral: feedbacks.filter(f => f.sentiment === 'neutral').length
  };

  // Prepare data for charts
  const chartData = [
    { name: 'Positive', value: sentimentCounts.positive, color: SENTIMENT_COLORS.positive },
    { name: 'Negative', value: sentimentCounts.negative, color: SENTIMENT_COLORS.negative },
    { name: 'Neutral', value: sentimentCounts.neutral, color: SENTIMENT_COLORS.neutral }
  ];

  // Prepare data for bar chart
  const barChartData = [
    { name: 'Ratings', positive: sentimentCounts.positive, negative: sentimentCounts.negative, neutral: sentimentCounts.neutral }
  ];

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

      try {
        const { data, error } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", session.user.id)
          .eq("role", "admin")
          .maybeSingle();

        if (error) {
          console.error("Error checking admin role:", error);
          // Handle the case where the user_roles table doesn't exist
          if (error.message.includes("404") || error.message.includes("not found")) {
            toast({
              title: "Database Error",
              description: "User roles table not found. Please ensure database migrations have been applied.",
              variant: "destructive",
            });
          } else {
            toast({
              title: "Error",
              description: "Failed to check user permissions.",
              variant: "destructive",
            });
          }
          navigate("/auth");
          return;
        }

        if (!data) {
          toast({
            title: "Access Denied",
            description: "You don't have admin privileges.",
            variant: "destructive",
          });
          navigate("/auth");
          return;
        }

        setIsAdmin(true);
        loadFeedbacks();
      } catch (err) {
        console.error("Unexpected error checking admin role:", err);
        toast({
          title: "Error",
          description: "An unexpected error occurred while checking permissions.",
          variant: "destructive",
        });
        navigate("/auth");
      }
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
              Admin Dashboard
            </h1>
          </div>
          <p className="text-muted-foreground">
            Feedback analysis and management
          </p>
        </div>

        {/* Rating Summary Cards (Top Section) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <GlassCard className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-green-500/20">
                <TrendingUp className="w-6 h-6 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Positive Ratings</p>
                <p className="text-2xl font-bold text-green-500">{sentimentCounts.positive}</p>
              </div>
            </div>
          </GlassCard>

          <GlassCard className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-red-500/20">
                <TrendingDown className="w-6 h-6 text-red-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Negative Ratings</p>
                <p className="text-2xl font-bold text-red-500">{sentimentCounts.negative}</p>
              </div>
            </div>
          </GlassCard>

          <GlassCard className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-gray-500/20">
                <Minus className="w-6 h-6 text-gray-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Neutral Ratings</p>
                <p className="text-2xl font-bold text-gray-500">{sentimentCounts.neutral}</p>
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Visual Graph (Middle Section) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <GlassCard className="p-6">
            <h2 className="text-xl font-semibold mb-4">Sentiment Distribution (Bar Chart)</h2>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="positive" fill={SENTIMENT_COLORS.positive} name="Positive" />
                  <Bar dataKey="negative" fill={SENTIMENT_COLORS.negative} name="Negative" />
                  <Bar dataKey="neutral" fill={SENTIMENT_COLORS.neutral} name="Neutral" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </GlassCard>

          <GlassCard className="p-6">
            <h2 className="text-xl font-semibold mb-4">Sentiment Distribution (Pie Chart)</h2>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    labelLine={true}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent as number * 100).toFixed(0)}%`}
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </GlassCard>
        </div>

        {/* Recent Feedback Section (Bottom Section) */}
        <GlassCard className="mb-8">
          <div className="flex items-center justify-between mb-6 p-6 pb-0">
            <h2 className="text-2xl font-semibold">Recent Feedback</h2>
            <div className="text-sm text-muted-foreground">
              Total: {feedbacks.length} submissions
            </div>
          </div>

          {feedbacks.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground">
              No feedback submissions yet.
            </div>
          ) : (
            <div className="space-y-4 p-6 pt-0">
              {feedbacks.slice(0, 5).map((feedback) => (
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
          )}
        </GlassCard>
      </main>
    </div>
  );
}