import { useState } from "react";
import { Navbar } from "../components/Navbar";
import { GlassCard } from "../components/Glasscard"; // Fixed casing
import { Button } from "../components/ui/Button";
import { Textarea } from "../components/ui/Textarea";
import { useToast } from "../hooks/use-toast";
import { supabase } from "../integrations/supabase/client";
import { Loader2, Sparkles, BarChart3, Shield, Zap } from "lucide-react";
import { SentimentBadge } from "../components/SentimentBadge";

// Simple sentiment analysis function as a fallback
const analyzeSentimentFallback = (text: string) => {
  const positiveWords = [
    'good', 'great', 'excellent', 'amazing', 'wonderful', 'fantastic', 'love', 'like', 'happy', 'pleased', 'satisfied', 'awesome',
    'brilliant', 'outstanding', 'superb', 'perfect', 'incredible', 'marvelous', 'terrific', 'fabulous', 'splendid', 'magnificent',
    'delighted', 'thrilled', 'ecstatic', 'joyful', 'cheerful', 'content', 'grateful', 'appreciate', 'recommend', 'best'
  ];

  const negativeWords = [
    'bad', 'terrible', 'awful', 'horrible', 'hate', 'dislike', 'angry', 'frustrated', 'disappointed', 'sad', 'annoyed', 'upset',
    'worst', 'useless', 'worthless', 'pathetic', 'disgusting', 'ridiculous', 'stupid', 'idiotic', 'furious', 'enraged', 'livid',
    'displeased', 'dissatisfied', 'unhappy', 'miserable', 'depressed', 'gloomy', 'grim', 'bleak', 'hopeless', 'desperate',
    'failed', 'failure', 'broken', 'defective', 'faulty', 'problem', 'issue', 'complaint', 'dislike', 'hate', 'loathe'
  ];

  const textLower = text.toLowerCase();
  let positiveScore = 0;
  let negativeScore = 0;

  // Count positive words
  positiveWords.forEach(word => {
    const regex = new RegExp(`\\b${word}\\b`, 'g');
    const matches = textLower.match(regex);
    if (matches) {
      positiveScore += matches.length;
    }
  });

  // Count negative words
  negativeWords.forEach(word => {
    const regex = new RegExp(`\\b${word}\\b`, 'g');
    const matches = textLower.match(regex);
    if (matches) {
      negativeScore += matches.length;
    }
  });

  // Handle strong negative phrases
  const strongNegativePhrases = [
    'not good', 'not great', 'not happy', 'not satisfied', 'not pleased',
    'very bad', 'really terrible', 'extremely awful', 'absolutely horrible',
    'completely disappointed', 'totally frustrated', 'extremely upset'
  ];

  strongNegativePhrases.forEach(phrase => {
    if (textLower.includes(phrase)) {
      negativeScore += 2; // Give extra weight to strong negative phrases
    }
  });

  // Calculate sentiment
  const totalScore = positiveScore + negativeScore;

  if (totalScore === 0) {
    // If no sentiment words found, check for exclamation marks as a fallback
    const exclamationCount = (text.match(/!/g) || []).length;
    if (exclamationCount > 2) {
      // Multiple exclamation marks might indicate strong emotion
      return { sentiment: 'neutral', score: 0.5 };
    }
    return { sentiment: 'neutral', score: 0.5 };
  }

  const sentimentScore = positiveScore / totalScore;

  if (sentimentScore > 0.6) {
    return { sentiment: 'positive', score: Math.min(0.9, sentimentScore + 0.1) };
  } else if (sentimentScore < 0.4) {
    return { sentiment: 'negative', score: Math.max(0.1, sentimentScore - 0.1) };
  } else {
    return { sentiment: 'neutral', score: sentimentScore };
  }
};

const Index = () => {
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    sentiment: "positive" | "negative" | "neutral";
    score: number;
  } | null>(null);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!feedback.trim()) {
      toast({
        title: "Error",
        description: "Please enter your feedback",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      // Try to call edge function for sentiment analysis
      let sentimentData;
      try {
        const { data, error: sentimentError } = await supabase.functions.invoke("analyze-sentiment", {
          body: { text: feedback },
        });

        if (sentimentError) {
          console.warn("Sentiment analysis error, using fallback:", sentimentError);
          // Use fallback sentiment analysis
          sentimentData = analyzeSentimentFallback(feedback);
        } else if (data.error) {
          console.warn("Sentiment analysis returned error, using fallback:", data.error);
          // Use fallback sentiment analysis
          sentimentData = analyzeSentimentFallback(feedback);
        } else {
          sentimentData = data;
        }
      } catch (error) {
        console.warn("Failed to call sentiment analysis function, using fallback:", error);
        // Use fallback sentiment analysis
        sentimentData = analyzeSentimentFallback(feedback);
      }

      // Save feedback to database with sentiment analysis results
      // For guest feedback, user_id will be null
      const { error: insertError } = await supabase
        .from("feedback")
        .insert({
          content: feedback,
          user_id: null, // Guest feedback has no user ID
          sentiment: sentimentData.sentiment,
          sentiment_score: sentimentData.score,
        });

      if (insertError) throw insertError;

      setResult({
        sentiment: sentimentData.sentiment,
        score: sentimentData.score,
      });

      toast({
        title: "Feedback Submitted!",
        description: "Your feedback has been analyzed and saved.",
      });

      setFeedback("");
    } catch (error: any) {
      console.error("Error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to submit feedback",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const features = [
    { icon: Sparkles, title: "AI-Powered Analysis", description: "Advanced sentiment detection using state-of-the-art AI models" },
    { icon: BarChart3, title: "Visual Analytics", description: "Beautiful charts and insights from your feedback data" },
    { icon: Shield, title: "Secure & Private", description: "Your data is protected with enterprise-grade security" },
    { icon: Zap, title: "Real-Time Processing", description: "Instant sentiment analysis as you submit feedback" },
  ];

  return (
    <div className="min-h-screen bg-gradient-hero relative">
      <Navbar />

      {/* Animated background blobs */}
      <div className="absolute inset-0 overflow-hidden -z-10">
        <div className="absolute top-20 left-20 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-secondary/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-accent/10 rounded-full blur-3xl" />
      </div>

      <main className="container mx-auto px-4 pt-24 pb-12 relative z-10">
        {/* Hero Section */}
        <div className="text-center mb-16 max-w-4xl mx-auto">
          <div className="inline-block mb-4 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 backdrop-blur-sm">
            <span className="text-sm font-medium text-primary">Powered by AI</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
            <span className="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">Smart Feedback</span>
            <br />
            <span className="text-foreground">Analysis System</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Share your thoughts and let our AI analyze the sentiment in real-time. Get instant insights with beautiful visualizations.
          </p>
        </div>

        {/* Feedback Form */}
        <div className="max-w-3xl mx-auto mb-16">
          <GlassCard className="shadow-glow">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="text-lg font-semibold mb-3 block">Share Your Feedback</label>
                <Textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="Tell us what you think... Your feedback helps us improve!"
                  className="min-h-32 bg-input/50 backdrop-blur-sm resize-none text-base"
                  disabled={loading}
                />
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-primary via-secondary to-accent hover:opacity-90 transition-opacity text-lg py-6"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Analyzing...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-5 w-5" /> Analyze Sentiment
                  </>
                )}
              </Button>
            </form>

            {result && (
              <div className="mt-6 p-6 rounded-xl bg-gradient-glass border border-glass-border animate-fade-in">
                <h3 className="text-lg font-semibold mb-3">Analysis Result</h3>
                <SentimentBadge sentiment={result.sentiment} score={result.score} />
              </div>
            )}
          </GlassCard>
        </div>

        {/* Features Grid */}
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">
            Why Choose <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">FeedbackAI</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <GlassCard
                  key={index}
                  className="text-center p-6 border border-glass-border transition-all duration-300 hover:shadow-[0_0_20px_rgba(86,98,160,0.7)] hover:border-transparent"
                >
                  <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-gradient-to-r from-primary via-secondary to-accent flex items-center justify-center shadow-glow">
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </GlassCard>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;