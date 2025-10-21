import { cn } from "@/lib/utils";
import { Smile, Frown, Meh } from "lucide-react";

interface SentimentBadgeProps {
  sentiment: "positive" | "negative" | "neutral";
  score?: number;
  className?: string;
}

export const SentimentBadge = ({ sentiment, score, className }: SentimentBadgeProps) => {
  const sentimentConfig = {
    positive: {
      icon: Smile,
      label: "Positive",
      color: "text-success",
      bgColor: "bg-success/10",
      borderColor: "border-success/30",
    },
    negative: {
      icon: Frown,
      label: "Negative",
      color: "text-destructive",
      bgColor: "bg-destructive/10",
      borderColor: "border-destructive/30",
    },
    neutral: {
      icon: Meh,
      label: "Neutral",
      color: "text-warning",
      bgColor: "bg-warning/10",
      borderColor: "border-warning/30",
    },
  };

  const config = sentimentConfig[sentiment];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 px-3 py-1.5 rounded-full",
        "backdrop-blur-sm border",
        config.bgColor,
        config.borderColor,
        className
      )}
    >
      <Icon className={cn("w-4 h-4", config.color)} />
      <span className={cn("text-sm font-medium", config.color)}>
        {config.label}
      </span>
      {score !== undefined && (
        <span className={cn("text-xs opacity-70", config.color)}>
          {(score * 100).toFixed(0)}%
        </span>
      )}
    </div>
  );
};
