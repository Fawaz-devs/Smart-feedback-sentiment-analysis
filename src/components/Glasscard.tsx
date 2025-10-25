import { cn } from "../lib/utils";
import { ReactNode } from "react";

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
}

export const GlassCard = ({ children, className, hover = false }: GlassCardProps) => {
  return (
    <div
      className={cn(
        "relative rounded-2xl p-6",
        "bg-card/40 backdrop-blur-glass",
        "border border-glass-border/50",
        "shadow-glass",
        hover && "transition-all duration-300 hover:shadow-glow hover:scale-[1.02]",
        className
      )}
    >
      {children}
    </div>
  );
};
