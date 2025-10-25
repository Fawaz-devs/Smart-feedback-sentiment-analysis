import { useState } from "react";
import { Button } from "../components/ui/Button";
import { Textarea } from "../components/ui/Textarea";
import { useToast } from "../hooks/use-toast";
import { supabase } from "../integrations/supabase/client";

import { Loader2, Send } from "lucide-react";
import { z, ZodError } from "zod";

const feedbackSchema = z.object({
  content: z.string()
    .trim()
    .min(10, "Feedback must be at least 10 characters")
    .max(1000, "Feedback must be less than 1000 characters"),
});

// Enhanced sentiment analysis function as a fallback
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

interface FeedbackFormProps {
  onSuccess?: () => void;
}

export const FeedbackForm = ({ onSuccess }: FeedbackFormProps) => {
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const validated = feedbackSchema.parse({ content });
      setIsSubmitting(true);

      // Try to call edge function for sentiment analysis
      let sentimentData;
      try {
        const { data, error: sentimentError } = await supabase.functions.invoke(
          "analyze-sentiment",
          {
            body: { text: validated.content },
          }
        );

        if (sentimentError) {
          console.warn("Sentiment analysis error, using fallback:", sentimentError);
          // Use fallback sentiment analysis
          sentimentData = analyzeSentimentFallback(validated.content);
        } else if (data.error) {
          console.warn("Sentiment analysis returned error, using fallback:", data.error);
          // Use fallback sentiment analysis
          sentimentData = analyzeSentimentFallback(validated.content);
        } else {
          sentimentData = data;
        }
      } catch (error) {
        console.warn("Failed to call sentiment analysis function, using fallback:", error);
        // Use fallback sentiment analysis
        sentimentData = analyzeSentimentFallback(validated.content);
      }

      // Get current user (may be null for guests)
      const { data: { user } } = await supabase.auth.getUser();

      // Insert feedback with sentiment analysis results
      const { error: insertError } = await supabase
        .from("feedback")
        .insert({
          content: validated.content,
          user_id: user?.id || null,
          sentiment: sentimentData.sentiment,
          sentiment_score: sentimentData.score,
        });

      if (insertError) {
        console.error("Insert error:", insertError);
        throw new Error(`Failed to save feedback: ${insertError.message}`);
      }

      toast({
        title: "Feedback submitted!",
        description: `Sentiment: ${sentimentData.sentiment}`,
      });

      setContent("");
      onSuccess?.();
    } catch (error) {
      if (error instanceof ZodError) {
        // Safely access the first error message
        const firstError = error.issues[0];
        const errorMessage = firstError?.message || "Validation failed";

        toast({
          title: "Validation Error",
          description: errorMessage,
          variant: "destructive",
        });
      } else {
        const errorMessage = error instanceof Error ? error.message : "Failed to submit feedback. Please try again.";
        console.error("Feedback submission error:", error);

        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Share your feedback here..."
        className="glass-input min-h-[120px] resize-none text-foreground placeholder:text-muted-foreground"
        maxLength={1000}
      />
      <div className="flex justify-between items-center">
        <span className="text-sm text-muted-foreground">
          {content.length}/1000 characters
        </span>
        <Button
          type="submit"
          disabled={isSubmitting}
          className="bg-primary hover:bg-primary/90"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <Send className="mr-2 h-4 w-4" />
              Submit Feedback
            </>
          )}
        </Button>
      </div>
    </form>
  );
};