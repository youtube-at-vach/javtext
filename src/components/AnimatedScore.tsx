import { useState, useEffect, useRef } from "react";
import { motion } from "motion/react";
import { TrendingUp, TrendingDown } from "lucide-react";

interface AnimatedScoreProps {
  value: number;
  animKey?: string | number;
  className?: string;
  sentimentMode?: boolean; // If true: >50 is positive blue, <50 is negative red
  showTrendIcon?: boolean;
  textColor?: string;
}

export function AnimatedScore({
  value,
  animKey,
  className = "",
  sentimentMode = false,
  showTrendIcon = false,
  textColor,
}: AnimatedScoreProps) {
  const [displayValue, setDisplayValue] = useState(value);
  const [direction, setDirection] = useState<"up" | "down" | "neutral">("neutral");
  const prevValueRef = useRef(value);

  useEffect(() => {
    const startVal = prevValueRef.current;
    const endVal = value;
    prevValueRef.current = value;

    if (startVal === endVal) {
      setDisplayValue(endVal);
      return;
    }

    const dir = endVal > startVal ? "up" : "down";
    setDirection(dir);

    let startTimestamp: number | null = null;
    const duration = 800; // ms
    let rafId: number;

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      // Cubic ease-out
      const ease = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(Math.round(startVal + (endVal - startVal) * ease));

      if (progress < 1) {
        rafId = requestAnimationFrame(step);
      } else {
        const timeoutId = setTimeout(() => {
          setDirection("neutral");
        }, 1200);
        return () => clearTimeout(timeoutId);
      }
    };

    rafId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafId);
  }, [value, animKey]);

  // Color selection:
  // 1. If sentimentMode is on: value-based blue vs red
  // 2. Otherwise: direction-based (up = blue, down = red)
  const getColorClass = () => {
    if (textColor && direction === "neutral") {
      return textColor;
    }

    if (sentimentMode) {
      if (value >= 55) return "text-blue-600";
      if (value <= 45) return "text-rose-600";
      return textColor || "text-zinc-800";
    }

    if (direction === "up") return "text-blue-600";
    if (direction === "down") return "text-rose-600";
    return textColor || "text-zinc-900";
  };

  return (
    <motion.span
      key={`${value}-${animKey}`}
      animate={{
        scale: direction !== "neutral" ? [1, 1.15, 1] : 1,
      }}
      transition={{ duration: 0.35 }}
      className={`inline-flex items-center gap-1 tabular-nums font-black transition-colors duration-500 ${getColorClass()} ${className}`}
    >
      {showTrendIcon && direction === "up" && (
        <TrendingUp className="w-3.5 h-3.5 text-blue-500 shrink-0 animate-bounce" />
      )}
      {showTrendIcon && direction === "down" && (
        <TrendingDown className="w-3.5 h-3.5 text-rose-500 shrink-0 animate-bounce" />
      )}
      <span>{displayValue}</span>
    </motion.span>
  );
}
