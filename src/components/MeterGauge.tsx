import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Heart,
  Flame,
  Compass,
  BookOpen,
  ShieldAlert,
  Cpu,
  Target,
  Megaphone,
  Smile,
  User,
  Sparkles,
  Info,
  HelpCircle,
  TrendingUp,
  TrendingDown,
  Minus,
} from "lucide-react";
import { MeterItem } from "../types";
import { AnimatedScore } from "./AnimatedScore";

interface MeterGaugeProps {
  meter: MeterItem;
  isCompact?: boolean;
  animationKey?: string | number;
  delta?: number;
  comparisonValue?: number;
}

const ICON_MAP: Record<string, React.ElementType> = {
  Heart,
  Flame,
  Compass,
  BookOpen,
  ShieldAlert,
  Cpu,
  Target,
  Megaphone,
  Smile,
  User,
  Sparkles,
};

export function MeterGauge({
  meter,
  isCompact = false,
  animationKey,
  delta,
  comparisonValue,
}: MeterGaugeProps) {
  const [showDefinition, setShowDefinition] = useState(false);
  const IconComponent = ICON_MAP[meter.iconName] || Sparkles;

  // Visual color scheme mapping with dynamic positive (blue) / negative (red) support
  const getColorClasses = (color: string, val: number, id: string) => {
    // Specifically for sentiment (感情方向): Blue for positive, Red for negative
    if (id === "sentiment") {
      if (val >= 55) {
        return {
          bar: "from-blue-500 via-sky-400 to-indigo-600",
          badge: "bg-blue-50 text-blue-700 border-blue-200",
          icon: "text-blue-600 bg-blue-50 border-blue-100",
          glow: "shadow-blue-100/80 ring-1 ring-blue-100",
          tierBadge: "bg-blue-100 text-blue-800 border-blue-300",
          cardBg: "from-blue-50/20 via-white to-white",
        };
      } else if (val <= 45) {
        return {
          bar: "from-rose-500 via-red-500 to-rose-600",
          badge: "bg-rose-50 text-rose-700 border-rose-200",
          icon: "text-rose-600 bg-rose-50 border-rose-100",
          glow: "shadow-rose-100/80 ring-1 ring-rose-100",
          tierBadge: "bg-rose-100 text-rose-800 border-rose-300",
          cardBg: "from-rose-50/20 via-white to-white",
        };
      } else {
        return {
          bar: "from-zinc-400 to-zinc-600",
          badge: "bg-zinc-100 text-zinc-700 border-zinc-200",
          icon: "text-zinc-600 bg-zinc-50 border-zinc-200",
          glow: "shadow-zinc-100",
          tierBadge: "bg-zinc-200 text-zinc-800 border-zinc-300",
          cardBg: "from-zinc-50/20 via-white to-white",
        };
      }
    }

    switch (color) {
      case "blue":
        return {
          bar: "from-blue-500 to-indigo-600",
          badge: "bg-blue-50 text-blue-700 border-blue-200",
          icon: "text-blue-600 bg-blue-50 border-blue-100",
          glow: "shadow-blue-100",
          tierBadge: "bg-blue-100 text-blue-800 border-blue-300",
          cardBg: "from-blue-50/10 via-white to-white",
        };
      case "emerald":
        return {
          bar: "from-emerald-400 to-emerald-600",
          badge: "bg-emerald-50 text-emerald-700 border-emerald-200",
          icon: "text-emerald-600 bg-emerald-50 border-emerald-100",
          glow: "shadow-emerald-100",
          tierBadge: "bg-emerald-100 text-emerald-800 border-emerald-300",
          cardBg: "from-emerald-50/10 via-white to-white",
        };
      case "rose":
        return {
          bar: "from-rose-400 to-rose-600",
          badge: "bg-rose-50 text-rose-700 border-rose-200",
          icon: "text-rose-600 bg-rose-50 border-rose-100",
          glow: "shadow-rose-100",
          tierBadge: "bg-rose-100 text-rose-800 border-rose-300",
          cardBg: "from-rose-50/10 via-white to-white",
        };
      case "amber":
        return {
          bar: "from-amber-400 to-amber-600",
          badge: "bg-amber-50 text-amber-700 border-amber-200",
          icon: "text-amber-600 bg-amber-50 border-amber-100",
          glow: "shadow-amber-100",
          tierBadge: "bg-amber-100 text-amber-800 border-amber-300",
          cardBg: "from-amber-50/10 via-white to-white",
        };
      case "purple":
        return {
          bar: "from-purple-400 to-purple-600",
          badge: "bg-purple-50 text-purple-700 border-purple-200",
          icon: "text-purple-600 bg-purple-50 border-purple-100",
          glow: "shadow-purple-100",
          tierBadge: "bg-purple-100 text-purple-800 border-purple-300",
          cardBg: "from-purple-50/10 via-white to-white",
        };
      case "cyan":
        return {
          bar: "from-cyan-400 to-cyan-600",
          badge: "bg-cyan-50 text-cyan-700 border-cyan-200",
          icon: "text-cyan-600 bg-cyan-50 border-cyan-100",
          glow: "shadow-cyan-100",
          tierBadge: "bg-cyan-100 text-cyan-800 border-cyan-300",
          cardBg: "from-cyan-50/10 via-white to-white",
        };
      case "slate":
        return {
          bar: "from-zinc-400 to-zinc-600",
          badge: "bg-zinc-100 text-zinc-700 border-zinc-200",
          icon: "text-zinc-600 bg-zinc-50 border-zinc-200",
          glow: "shadow-zinc-100",
          tierBadge: "bg-zinc-200 text-zinc-800 border-zinc-300",
          cardBg: "from-zinc-50/10 via-white to-white",
        };
      case "indigo":
      default:
        return {
          bar: "from-indigo-400 to-indigo-600",
          badge: "bg-indigo-50 text-indigo-700 border-indigo-200",
          icon: "text-indigo-600 bg-indigo-50 border-indigo-100",
          glow: "shadow-indigo-100",
          tierBadge: "bg-indigo-100 text-indigo-800 border-indigo-300",
          cardBg: "from-indigo-50/10 via-white to-white",
        };
    }
  };

  const scheme = getColorClasses(meter.color, meter.value, meter.id);
  const tier = meter.level5 || (meter.value > 80 ? "高" : meter.value > 60 ? "やや高" : meter.value > 40 ? "中立" : meter.value > 20 ? "やや低" : "低");
  const modelConfidence = meter.confidence ?? 88;

  return (
    <div
      className={`bg-gradient-to-br ${scheme.cardBg} rounded-xl border border-zinc-200/90 p-3.5 sm:p-4 transition-all duration-500 hover:border-zinc-300 hover:shadow-xs ${scheme.glow}`}
    >
      {/* Top Header: Icon + Name + 5-stage Tier + Interpretation + Delta */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-start gap-2 sm:gap-2.5 min-w-0 flex-1">
          <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg border flex items-center justify-center shrink-0 mt-0.5 ${scheme.icon}`}>
            <IconComponent className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1 sm:gap-1.5">
              <h4 className="text-xs sm:text-sm font-bold text-zinc-900 tracking-tight flex items-center gap-1 shrink-0">
                <span>{meter.name}</span>
                {meter.definition && (
                  <button
                    type="button"
                    onClick={() => setShowDefinition((v) => !v)}
                    className="text-zinc-400 hover:text-indigo-600 transition-colors p-0.5 rounded hover:bg-zinc-100"
                    title="測定項目の定義を見る"
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                  </button>
                )}
              </h4>

              {/* 5-Stage Human Qualitative Tier */}
              <span className={`text-[10px] font-bold px-1.5 sm:px-2 py-0.5 rounded-md border shadow-2xs whitespace-nowrap shrink-0 ${scheme.tierBadge}`}>
                {tier}
              </span>

              {/* Secondary interpretation */}
              <span className={`text-[10px] font-semibold px-1.5 sm:px-2 py-0.5 rounded-full border truncate max-w-[110px] sm:max-w-none whitespace-nowrap shrink-0 ${scheme.badge}`}>
                {meter.interpretation}
              </span>
            </div>

            {/* Jev System Model Confidence Badge */}
            <div className="flex flex-wrap items-center gap-1.5 mt-1">
              <span className="inline-flex items-center gap-1 text-[10px] font-mono text-zinc-600 bg-zinc-100/90 px-1.5 sm:px-2 py-0.5 rounded-md border border-zinc-200 whitespace-nowrap shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></span>
                <span>Jev判定信頼度 {modelConfidence}%</span>
              </span>
              {!isCompact && (
                <p className="hidden lg:block text-[11px] text-zinc-500 truncate max-w-xs">
                  {meter.description}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Right side: Score & Optional Delta */}
        <div className="text-right shrink-0 flex flex-col items-end pl-1">
          <div className="flex items-baseline gap-0.5">
            <span className="text-base sm:text-xl md:text-2xl font-black text-zinc-900 tabular-nums tracking-tight">
              <AnimatedScore
                value={meter.value}
                animKey={animationKey}
                sentimentMode={meter.id === "sentiment"}
              />
            </span>
            <span className="text-[10px] sm:text-xs font-semibold text-zinc-400">/100</span>
          </div>

          {/* Delta badge for A/B comparison or edit tracking */}
          {typeof delta === "number" && delta !== 0 && (
            <div
              className={`inline-flex items-center gap-0.5 text-[10px] sm:text-[11px] font-bold font-mono px-1.5 py-0.5 rounded-md border mt-0.5 whitespace-nowrap ${
                delta > 0
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : "bg-rose-50 text-rose-700 border-rose-200"
              }`}
            >
              {delta > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              <span>{delta > 0 ? `+${delta}` : delta}</span>
            </div>
          )}
          {typeof delta === "number" && delta === 0 && (
            <div className="inline-flex items-center gap-0.5 text-[9px] sm:text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-zinc-100 text-zinc-500 border border-zinc-200 mt-0.5 whitespace-nowrap">
              <Minus className="w-2.5 h-2.5" />
              <span>変化なし (±0)</span>
            </div>
          )}
        </div>
      </div>

      {/* Expandable Meter Definition Box */}
      <AnimatePresence>
        {showDefinition && meter.definition && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-2.5 p-2.5 bg-zinc-50 rounded-lg border border-zinc-200 text-xs text-zinc-700 leading-relaxed overflow-hidden"
          >
            <div className="flex items-start gap-1.5">
              <Info className="w-3.5 h-3.5 text-indigo-600 mt-0.5 shrink-0" />
              <div>
                <span className="font-bold text-zinc-900">【測定の定義】</span>
                <p className="mt-0.5 text-zinc-600">{meter.definition}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Graphical Bar Track */}
      <div className="relative pt-1 pb-1.5">
        {/* Track background */}
        <div className="h-2.5 sm:h-3 w-full bg-zinc-100 rounded-full overflow-hidden relative border border-zinc-200/60">
          {/* Tick lines at 25%, 50%, 75% */}
          <div className="absolute left-[20%] top-0 bottom-0 w-px bg-zinc-200 z-10" />
          <div className="absolute left-[40%] top-0 bottom-0 w-px bg-zinc-200 z-10" />
          <div className="absolute left-[50%] top-0 bottom-0 w-px bg-zinc-400/80 z-10" />
          <div className="absolute left-[60%] top-0 bottom-0 w-px bg-zinc-200 z-10" />
          <div className="absolute left-[80%] top-0 bottom-0 w-px bg-zinc-200 z-10" />

          {/* Active fill bar with framer-motion smooth animation from 0 */}
          <motion.div
            key={`bar-${meter.id}-${animationKey ?? meter.value}`}
            className={`h-full rounded-full bg-gradient-to-r shadow-xs ${scheme.bar}`}
            initial={{ width: "0%" }}
            animate={{ width: `${Math.max(3, meter.value)}%` }}
            transition={{
              duration: 0.85,
              ease: [0.16, 1, 0.3, 1],
            }}
          />
        </div>

        {/* Thumb needle indicator animated with framer-motion */}
        <motion.div
          key={`needle-${meter.id}-${animationKey ?? meter.value}`}
          className="absolute top-0 transform -translate-x-1/2 pointer-events-none z-20"
          initial={{ left: "0%" }}
          animate={{ left: `${meter.value}%` }}
          transition={{
            duration: 0.85,
            ease: [0.16, 1, 0.3, 1],
          }}
        >
          <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full bg-white border-2 border-zinc-800 shadow-md flex items-center justify-center -mt-0.5">
            <div className="w-1.5 h-1.5 rounded-full bg-zinc-900" />
          </div>
        </motion.div>

        {/* Ghost comparison marker if comparisonValue is given */}
        {typeof comparisonValue === "number" && (
          <div
            className="absolute top-0 transform -translate-x-1/2 pointer-events-none z-10"
            style={{ left: `${comparisonValue}%` }}
            title={`比較対象の値: ${comparisonValue}`}
          >
            <div className="w-3.5 h-3.5 rounded-full bg-amber-400/80 border border-amber-600 shadow-xs flex items-center justify-center -mt-0.5">
              <span className="text-[8px] font-bold text-amber-950">A</span>
            </div>
          </div>
        )}
      </div>

      {/* Axis Scale Labels & 5-stage markers */}
      <div className="flex items-center justify-between text-[10px] font-medium text-zinc-400 px-0.5">
        <span className="text-left truncate max-w-[42%] text-zinc-500 font-sans">
          {meter.minLabel}
        </span>
        {meter.midLabel && (
          <span className="hidden sm:inline-block text-center text-zinc-400 text-[9px]">
            {meter.midLabel} (50)
          </span>
        )}
        <span className="text-right truncate max-w-[42%] text-zinc-500 font-sans">
          {meter.maxLabel}
        </span>
      </div>
    </div>
  );
}
