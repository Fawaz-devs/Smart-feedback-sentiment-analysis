import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

import { Loader2, Send } from "lucide-react";
import { z } from "zod";

const feedbackSchema = z.object({
  content: z.string()
    .trim()
    .min(10, "Feedback must be at least 10 characters")
    .max(1000, "Feedback must be less than 1000 characters"),
});

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

      // Call edge function for sentiment analysis
      const { data: sentimentData, error: sentimentError } = await supabase.functions.invoke(
        "analyze-sentiment",
        {
          body: { text: validated.content },
        }
      );

      if (sentimentError) throw sentimentError;

      // Get current user (may be null for guests)
      const { data: { user } } = await supabase.auth.getUser();

      // Insert feedback
      const { error: insertError } = await supabase
        .from("feedback")
        .insert({
          content: validated.content,
          user_id: user?.id || null,
          sentiment: sentimentData.sentiment,
          sentiment_score: sentimentData.score,
        });

      if (insertError) throw insertError;

      toast({
        title: "Feedback submitted!",
        description: `Sentiment: ${sentimentData.sentiment}`,
      });

      setContent("");
      onSuccess?.();
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: "Validation Error",
          description: error.errors[0].message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to submit feedback. Please try again.",
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
