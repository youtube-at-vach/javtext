import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Copy, Check, Activity, Clock, FileText, Share2, Sparkles, AlertCircle } from "lucide-react";
import { ImpressionResult } from "../types";
import { AnimatedScore } from "./AnimatedScore";

interface EmotionalProfileCardProps {
  result: ImpressionResult;
}

export function EmotionalProfileCard({
  result,
}: EmotionalProfileCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyProfile = async () => {
    try {
      await navigator.clipboard.writeText(result.emotionalProfileString);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  const handleShareToTwitter = () => {
    const text = `【Jev 文章印象メーター】
私の文章の印象判定:
📌 Overall: 「${result.overallImpression.title}」(${result.overallImpression.vibeBadge})
📊 ${result.emotionalProfileString}
🤖 Model: ${result.modelUsed || "TypeSafe Jev"}

#Jev文章印象メーター #TypeSafe`;

    const url = window.location.href;
    const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
    window.open(tweetUrl, "_blank", "noopener,noreferrer");
  };

  const cm = result.coreMeters;
  const sentimentVal = cm.sentiment.value;
  const isPositive = sentimentVal >= 55;
  const isNegative = sentimentVal <= 45;

  // Dynamic card border & gradient based on emotional valence
  const cardGradient = isPositive
    ? "from-blue-50/50 via-white to-indigo-50/40 border-blue-200/80 shadow-blue-50/50"
    : isNegative
    ? "from-rose-50/50 via-white to-red-50/40 border-rose-200/80 shadow-rose-50/50"
    : "from-white via-zinc-50/50 to-indigo-50/30 border-zinc-200";

  return (
    <motion.div
      key={`summary-${result.overallImpression.title}-${result.emotionalProfileString}`}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={`bg-gradient-to-br ${cardGradient} rounded-2xl border p-4 sm:p-6 shadow-xs transition-colors duration-500`}
    >
      {/* Top Banner: Overall Impression Title & Vibe Badge */}
      <div className="flex flex-wrap items-start justify-between gap-3 mb-4 pb-4 border-b border-zinc-200/70">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 border border-indigo-200">
              Overall Impression
            </span>

            {/* Valence Badge: Blue if positive, Red if negative, Slate if neutral */}
            {isPositive && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200 flex items-center gap-1 shadow-2xs">
                <Sparkles className="w-3 h-3 text-blue-600" />
                <span>ポジティブ優位 ({sentimentVal}/100)</span>
              </span>
            )}
            {isNegative && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-200 flex items-center gap-1 shadow-2xs">
                <AlertCircle className="w-3 h-3 text-rose-600" />
                <span>ネガティブ・批判優位 ({sentimentVal}/100)</span>
              </span>
            )}

            <motion.span
              key={result.overallImpression.vibeBadge}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-zinc-900 text-white shadow-2xs"
            >
              {result.overallImpression.vibeBadge}
            </motion.span>

            {/* Jev System One Model Badge */}
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-900 border border-indigo-200 flex items-center gap-1 shadow-2xs">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              <span>TypeSafe Jev ({result.modelUsed || "jev-1.13.0"})</span>
            </span>
          </div>

          <motion.h3
            key={result.overallImpression.title}
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.35 }}
            className="text-lg sm:text-xl font-black text-zinc-900 tracking-tight"
          >
            {result.overallImpression.title}
          </motion.h3>

          <motion.p
            key={result.overallImpression.summary}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
            className="text-xs text-zinc-600 mt-1 leading-relaxed max-w-2xl"
          >
            {result.overallImpression.summary}
          </motion.p>
        </div>

        {/* Stats Pills & Share Button */}
        <div className="flex items-center gap-2 text-[11px] text-zinc-500 font-mono">
          <button
            type="button"
            onClick={handleShareToTwitter}
            className="flex items-center gap-1.5 bg-zinc-900 hover:bg-zinc-800 text-white font-sans font-semibold px-3 py-1 rounded-lg transition-colors shadow-2xs"
            title="X(Twitter)でこの文章の印象をシェア"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Xでシェア</span>
          </button>
          <span className="flex items-center gap-1 bg-white px-2.5 py-1 rounded-lg border border-zinc-200 shadow-2xs">
            <FileText className="w-3.5 h-3.5 text-zinc-400" />
            <span>{result.stats.charCount} 文字</span>
          </span>
          <span className="flex items-center gap-1 bg-white px-2.5 py-1 rounded-lg border border-zinc-200 shadow-2xs hidden sm:flex">
            <Clock className="w-3.5 h-3.5 text-zinc-400" />
            <span>読了約{result.stats.readingTimeSeconds}秒</span>
          </span>
        </div>
      </div>

      {/* The Requested Emotional Profile Section */}
      <div className="bg-white rounded-xl border border-zinc-200 p-3.5 sm:p-4 shadow-2xs">
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-indigo-600" />
            <span className="text-xs font-bold text-zinc-800 uppercase tracking-wider">
              Emotional Profile
            </span>
          </div>

          <button
            type="button"
            onClick={handleCopyProfile}
            className={`flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-md transition-all ${
              copied
                ? "bg-emerald-600 text-white"
                : "bg-zinc-100 hover:bg-zinc-200 text-zinc-700 border border-zinc-200"
            }`}
            title="プロファイル文字列をクリップボードにコピー"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-white" />
                <span>コピー完了</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-zinc-500" />
                <span>プロファイルコピー</span>
              </>
            )}
          </button>
        </div>

        {/* Formatted Code Block of Emotional Profile */}
        <div className="bg-zinc-900 text-zinc-100 rounded-lg p-3 font-mono text-xs sm:text-sm tracking-wide flex items-center justify-between overflow-x-auto select-all shadow-inner">
          <code className="text-emerald-400 font-bold whitespace-nowrap">
            {result.emotionalProfileString}
          </code>
        </div>

        {/* Interactive breakdown chips with animated counting and color shifts */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mt-3 text-center">
          {/* Positive / Sentiment Chip */}
          <div
            className={`rounded-lg p-2 border transition-colors duration-500 ${
              cm.sentiment.value >= 55
                ? "bg-blue-50/90 border-blue-200 text-blue-900"
                : cm.sentiment.value <= 45
                ? "bg-rose-50/90 border-rose-200 text-rose-900"
                : "bg-zinc-50 border-zinc-200/80"
            }`}
          >
            <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
              Positive
            </div>
            <div className="text-base font-black tabular-nums mt-0.5">
              <AnimatedScore
                value={cm.sentiment.value}
                sentimentMode={true}
                showTrendIcon={true}
              />
            </div>
            <div className="text-[9px] font-medium text-zinc-600 truncate mt-0.5">
              {cm.sentiment.interpretation}
            </div>
          </div>

          {/* Intensity Chip */}
          <div
            className={`rounded-lg p-2 border transition-colors duration-500 ${
              cm.intensity.value >= 60
                ? "bg-amber-50/90 border-amber-200 text-amber-900"
                : "bg-zinc-50 border-zinc-200/80"
            }`}
          >
            <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
              Intensity
            </div>
            <div className="text-base font-black tabular-nums mt-0.5">
              <AnimatedScore value={cm.intensity.value} />
            </div>
            <div className="text-[9px] font-medium text-zinc-600 truncate mt-0.5">
              {cm.intensity.interpretation}
            </div>
          </div>

          {/* Confidence (断定度) Chip */}
          <div
            className={`rounded-lg p-2 border transition-colors duration-500 ${
              cm.confidence.value >= 60
                ? "bg-indigo-50/90 border-indigo-200 text-indigo-900"
                : "bg-zinc-50 border-zinc-200/80"
            }`}
          >
            <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
              Assertiveness
            </div>
            <div className="text-base font-black tabular-nums mt-0.5">
              <AnimatedScore value={cm.confidence.value} />
            </div>
            <div className="text-[9px] font-medium text-zinc-600 truncate mt-0.5">
              {cm.confidence.interpretation}
            </div>
          </div>

          {/* Formality Chip */}
          <div
            className={`rounded-lg p-2 border transition-colors duration-500 ${
              cm.formality.value >= 60
                ? "bg-slate-100 border-slate-300 text-slate-900"
                : "bg-zinc-50 border-zinc-200/80"
            }`}
          >
            <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
              Formality
            </div>
            <div className="text-base font-black tabular-nums mt-0.5">
              <AnimatedScore value={cm.formality.value} />
            </div>
            <div className="text-[9px] font-medium text-zinc-600 truncate mt-0.5">
              {cm.formality.interpretation}
            </div>
          </div>

          {/* Hostility Chip */}
          <div
            className={`rounded-lg p-2 border col-span-2 sm:col-span-1 transition-colors duration-500 ${
              cm.hostility.value <= 20
                ? "bg-emerald-50/90 border-emerald-200 text-emerald-900"
                : cm.hostility.value >= 40
                ? "bg-rose-50/90 border-rose-300 text-rose-900 ring-1 ring-rose-200"
                : "bg-zinc-50 border-zinc-200/80"
            }`}
          >
            <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
              Hostility
            </div>
            <div className="text-base font-black tabular-nums mt-0.5">
              <AnimatedScore value={cm.hostility.value} />
            </div>
            <div className="text-[9px] font-medium text-zinc-600 truncate mt-0.5">
              {cm.hostility.interpretation}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

