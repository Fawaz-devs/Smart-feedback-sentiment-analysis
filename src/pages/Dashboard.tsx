import { useEffect, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { GlassCard } from "@/components/GlassCard";
import { SentimentBadge } from "@/components/SentimentBadge";
import { supabase } from "@/integrations/supabase/client";
import type { Session } from "@supabase/supabase-js";
import { useNavigate } from "react-router-dom";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { TrendingUp, MessageSquare, Smile, Frown, Meh } from "lucide-react";

interface Feedback {
  id: string;
  content: string;
  sentiment: "positive" | "negative" | "neutral";
  sentiment_score: number;
  created_at: string;
}

export default function Dashboard() {
  const [session, setSession] = useState<Session | null>(null);
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const navigate = useNavigate();

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
    if (session) {
      loadFeedbacks();
    }
  }, [session]);

  const loadFeedbacks = async () => {
    const { data, error } = await supabase
      .from("feedback")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error loading feedbacks:", error);
    } else {
      setFeedbacks((data || []) as Feedback[]);
    }
  };

  const sentimentCounts = {
    positive: feedbacks.filter((f) => f.sentiment === "positive").length,
    negative: feedbacks.filter((f) => f.sentiment === "negative").length,
    neutral: feedbacks.filter((f) => f.sentiment === "neutral").length,
  };

  const pieData = [
    { name: "Positive", value: sentimentCounts.positive, color: "hsl(var(--success))" },
    { name: "Negative", value: sentimentCounts.negative, color: "hsl(var(--destructive))" },
    { name: "Neutral", value: sentimentCounts.neutral, color: "hsl(var(--warning))" },
  ];

  const stats = [
    {
      icon: MessageSquare,
      label: "Total Feedback",
      value: feedbacks.length,
      color: "text-primary",
    },
    {
      icon: Smile,
      label: "Positive",
      value: sentimentCounts.positive,
      color: "text-success",
    },
    {
      icon: Frown,
      label: "Negative",
      value: sentimentCounts.negative,
      color: "text-destructive",
    },
    {
      icon: Meh,
      label: "Neutral",
      value: sentimentCounts.neutral,
      color: "text-warning",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-hero">
      <Navbar />

      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-40 left-20 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-secondary/10 rounded-full blur-3xl" />
      </div>

      <main className="container mx-auto px-4 pt-24 pb-12 relative z-10">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Analytics Dashboard
          </h1>
          <p className="text-muted-foreground">
            View insights and trends from collected feedback
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <GlassCard key={index} hover>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">{stat.label}</p>
                    <p className="text-3xl font-bold">{stat.value}</p>
                  </div>
                  <div className={`p-3 rounded-xl bg-gradient-primary ${stat.color}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                </div>
              </GlassCard>
            );
          })}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <GlassCard>
            <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Sentiment Distribution
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) =>
                    `${name}: ${(percent * 100).toFixed(0)}%`
                  }
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </GlassCard>

          <GlassCard>
            <h3 className="text-xl font-semibold mb-4">Sentiment Overview</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={[sentimentCounts]}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" stroke="hsl(var(--foreground))" />
                <YAxis stroke="hsl(var(--foreground))" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
                <Legend />
                <Bar dataKey="positive" fill="hsl(var(--success))" radius={[8, 8, 0, 0]} />
                <Bar dataKey="negative" fill="hsl(var(--destructive))" radius={[8, 8, 0, 0]} />
                <Bar dataKey="neutral" fill="hsl(var(--warning))" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </GlassCard>
        </div>

        {/* Recent Feedback */}
        <GlassCard>
          <h3 className="text-xl font-semibold mb-4">Recent Feedback</h3>
          <div className="space-y-4">
            {feedbacks.slice(0, 10).map((feedback) => (
              <div
                key={feedback.id}
                className="p-4 rounded-xl bg-card/30 border border-glass-border/30 hover:bg-card/40 transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <SentimentBadge
                    sentiment={feedback.sentiment}
                    score={feedback.sentiment_score}
                  />
                  <span className="text-xs text-muted-foreground">
                    {new Date(feedback.created_at).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-foreground">{feedback.content}</p>
              </div>
            ))}
          </div>
        </GlassCard>
      </main>
    </div>
  );
}
