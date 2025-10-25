import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { LogOut, BarChart3, Trash2, Users, MessageSquare } from "lucide-react";
import { SentimentBadge } from "@/components/SentimentBadge";
import { format } from "date-fns";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

interface Feedback {
  id: string;
  content: string;
  sentiment: "positive" | "negative" | "neutral";
  sentiment_score: number;
  created_at: string;
  user_id: string | null;
}

const AdminDashboard = () => {
  const [user, setUser] = useState<any>(null);
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      // Check if user is admin
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);

      const adminRole = roles?.find((r) => r.role === "admin");
      if (!adminRole) {
        toast({
          title: "Access Denied",
          description: "You don't have admin permissions",
          variant: "destructive",
        });
        navigate("/user-dashboard");
        return;
      }

      setUser(user);

      // Fetch all feedback
      const { data: feedbackData } = await supabase
        .from("feedback")
        .select("*")
        .order("created_at", { ascending: false });

      setFeedbacks(feedbackData || []);
      setLoading(false);
    };

    fetchData();
  }, [navigate, toast]);

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("feedback").delete().eq("id", id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete feedback",
        variant: "destructive",
      });
      return;
    }

    setFeedbacks(feedbacks.filter((f) => f.id !== id));
    toast({
      title: "Deleted",
      description: "Feedback removed successfully",
    });
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Chart data
  const sentimentData = [
    { name: "Positive", value: feedbacks.filter((f) => f.sentiment === "positive").length, color: "hsl(var(--positive))" },
    { name: "Neutral", value: feedbacks.filter((f) => f.sentiment === "neutral").length, color: "hsl(var(--neutral))" },
    { name: "Negative", value: feedbacks.filter((f) => f.sentiment === "negative").length, color: "hsl(var(--negative))" },
  ];

  const uniqueUsers = new Set(feedbacks.filter((f) => f.user_id).map((f) => f.user_id)).size;
  const guestFeedbacks = feedbacks.filter((f) => !f.user_id).length;

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="glass-card p-6 rounded-2xl mb-8 flex justify-between items-center">
          <div className="flex items-center">
            <BarChart3 className="h-8 w-8 text-primary mr-3" />
            <div>
              <h1 className="text-2xl font-bold gradient-text">Admin Dashboard</h1>
              <p className="text-sm text-muted-foreground">Complete analytics and management</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => navigate("/user-dashboard")}
              variant="outline"
              className="glass-card"
            >
              User View
            </Button>
            <Button onClick={handleLogout} variant="outline" className="glass-card">
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="glass-card p-6 rounded-2xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Feedback</p>
                <p className="text-3xl font-bold text-primary">{feedbacks.length}</p>
              </div>
              <MessageSquare className="h-8 w-8 text-primary/50" />
            </div>
          </div>
          <div className="glass-card p-6 rounded-2xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Registered Users</p>
                <p className="text-3xl font-bold text-secondary">{uniqueUsers}</p>
              </div>
              <Users className="h-8 w-8 text-secondary/50" />
            </div>
          </div>
          <div className="glass-card p-6 rounded-2xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Guest Feedback</p>
                <p className="text-3xl font-bold text-accent">{guestFeedbacks}</p>
              </div>
              <MessageSquare className="h-8 w-8 text-accent/50" />
            </div>
          </div>
          <div className="glass-card p-6 rounded-2xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Positive Rate</p>
                <p className="text-3xl font-bold text-positive">
                  {feedbacks.length > 0
                    ? Math.round(
                        (feedbacks.filter((f) => f.sentiment === "positive").length /
                          feedbacks.length) *
                          100
                      )
                    : 0}
                  %
                </p>
              </div>
              <BarChart3 className="h-8 w-8 text-positive/50" />
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid md:grid-cols-2 gap-8 mb-8">
          <div className="glass-card p-6 rounded-2xl">
            <h2 className="text-xl font-semibold mb-4">Sentiment Distribution</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={sentimentData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {sentimentData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="glass-card p-6 rounded-2xl">
            <h2 className="text-xl font-semibold mb-4">Sentiment Counts</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={sentimentData}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* All Feedback */}
        <div className="glass-card p-6 rounded-2xl">
          <h2 className="text-xl font-semibold mb-4">All Feedback</h2>
          {feedbacks.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No feedback yet</p>
          ) : (
            <div className="space-y-4">
              {feedbacks.map((feedback) => (
                <div
                  key={feedback.id}
                  className="glass-card p-4 rounded-xl border border-border/50 flex justify-between items-start"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <SentimentBadge
                        sentiment={feedback.sentiment}
                        score={feedback.sentiment_score}
                      />
                      <span className="text-xs text-muted-foreground">
                        {feedback.user_id ? "User" : "Guest"} •{" "}
                        {format(new Date(feedback.created_at), "MMM dd, yyyy HH:mm")}
                      </span>
                    </div>
                    <p className="text-sm">{feedback.content}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(feedback.id)}
                    className="ml-4 text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
