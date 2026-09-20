import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Copy, Check, Activity, Clock, FileText, Share2, Sparkles, AlertCircle } from "lucide-react";
import { ImpressionResult } from "../types";
import { AnimatedScore } from "./AnimatedScore";

interface EmotionalProfileCardProps {
  result: ImpressionResult;
  animationKey?: number;
  onOpenBenchmark?: () => void;
  onCopyReport?: () => void;
  isReportCopied?: boolean;
}

export function EmotionalProfileCard({
  result,
  animationKey = 1,
  onOpenBenchmark,
  onCopyReport,
  isReportCopied = false,
}: EmotionalProfileCardProps) {
  const [copiedProfile, setCopiedProfile] = useState(false);

  const handleCopyProfile = async () => {
    try {
      await navigator.clipboard.writeText(result.emotionalProfileString);
      setCopiedProfile(true);
      setTimeout(() => setCopiedProfile(false), 2000);
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
  const isKyoto = result.subtextAnalysis?.verdict === "kyoto_passive_aggressive";

  // Dynamic card border & gradient based on emotional valence
  const cardGradient = isKyoto
    ? "from-amber-50/90 via-white to-emerald-50/30 border-amber-300 ring-1 ring-amber-200/60 shadow-xs"
    : isPositive
    ? "from-blue-50/60 via-white to-indigo-50/40 border-blue-200/90 shadow-blue-50/50"
    : isNegative
    ? "from-rose-50/60 via-white to-red-50/40 border-rose-200/90 shadow-rose-50/50"
    : "from-zinc-50/80 via-white to-zinc-50/30 border-zinc-200 shadow-xs";

  return (
    <motion.div
      key={`summary-${result.overallImpression.title}-${result.emotionalProfileString}-${animationKey}`}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className={`bg-gradient-to-br ${cardGradient} rounded-2xl border p-4 sm:p-5 shadow-xs transition-colors duration-500`}
    >
      {/* Level 1 Priority Header Row */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 pb-3 border-b border-zinc-200/70 mb-3.5">
        <div className="flex items-center flex-wrap gap-2 min-w-0">
          {/* Priority Badge */}
          <span className="inline-flex items-center gap-1 text-[11px] font-black px-2.5 py-0.5 rounded-full bg-zinc-900 text-white tracking-wide shadow-2xs">
            <span className="text-amber-400">★</span>
            <span>最重要 1</span>
            <span className="text-zinc-400 font-normal">|</span>
            <span className="font-bold">総合診断サマリー</span>
          </span>

          {/* Emotional Valence Badge */}
          {isPositive && (
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200 flex items-center gap-1 shadow-2xs">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span>好意的・ポジティブ判定 ({sentimentVal}/100)</span>
            </span>
          )}
          {isNegative && (
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-200 flex items-center gap-1 shadow-2xs">
              <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
              <span>批判・ネガティブ判定 ({sentimentVal}/100)</span>
            </span>
          )}
          {!isPositive && !isNegative && (
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-zinc-100 text-zinc-700 border border-zinc-200 flex items-center gap-1 shadow-2xs">
              <span>中立・平常判定 ({sentimentVal}/100)</span>
            </span>
          )}

          {/* Kyoto Passive-Aggressive Alert Badge */}
          {isKyoto && (
            <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 shadow-2xs animate-pulse">
              <span>🍵 京都式・婉曲クレーム検知</span>
              <span className="font-mono text-[10px] bg-amber-200/90 px-1 rounded font-bold">
                合成皮肉度 {result.subtextAnalysis?.compositeSarcasmScore}点
              </span>
            </span>
          )}

          <motion.span
            key={result.overallImpression.vibeBadge}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-zinc-800 text-zinc-100 shadow-2xs"
          >
            {result.overallImpression.vibeBadge}
          </motion.span>
        </div>

        {/* Action Buttons: Benchmark & Share & Copy */}
        <div className="flex items-center gap-2">
          {onOpenBenchmark && result.subtextAnalysis && (
            <button
              type="button"
              onClick={onOpenBenchmark}
              className="px-2.5 py-1.5 rounded-xl border border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-semibold flex items-center gap-1 transition-colors shrink-0 shadow-2xs"
              title="京都弁・婉曲表現の4段階ベンチマークを開く"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span className="hidden sm:inline">4段階ベンチマーク</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleShareToTwitter}
            className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white transition-colors shadow-2xs shrink-0"
            title="X(Twitter)でこの文章の印象をシェア"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Xでシェア</span>
          </button>

          {onCopyReport && (
            <button
              type="button"
              onClick={onCopyReport}
              className="px-2.5 py-1.5 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700 text-xs font-semibold flex items-center gap-1 transition-colors shrink-0 shadow-2xs"
            >
              {isReportCopied ? (
                <Check className="w-3.5 h-3.5 text-emerald-600" />
              ) : (
                <Copy className="w-3.5 h-3.5 text-zinc-400" />
              )}
              <span className="hidden sm:inline">{isReportCopied ? "コピー済" : "結果コピー"}</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Overall Impression Statement */}
      <div className="mb-4">
        <div className="flex flex-wrap items-baseline gap-2 mb-1.5">
          <motion.h3
            key={result.overallImpression.title}
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.35 }}
            className="text-lg sm:text-xl font-black text-zinc-950 tracking-tight"
          >
            {result.overallImpression.title}
          </motion.h3>

          <div className="flex items-center gap-2 text-[11px] text-zinc-500 font-mono ml-auto">
            <span className="flex items-center gap-1 bg-white/90 px-2 py-0.5 rounded border border-zinc-200/80 shadow-2xs">
              <FileText className="w-3 h-3 text-zinc-400" />
              <span>{result.stats.charCount} 文字</span>
            </span>
            <span className="flex items-center gap-1 bg-white/90 px-2 py-0.5 rounded border border-zinc-200/80 shadow-2xs hidden sm:flex">
              <Clock className="w-3 h-3 text-zinc-400" />
              <span>読了約{result.stats.readingTimeSeconds}秒</span>
            </span>
          </div>
        </div>

        <motion.p
          key={result.overallImpression.summary}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="text-xs sm:text-sm text-zinc-700 leading-relaxed max-w-3xl"
        >
          {result.overallImpression.summary}
        </motion.p>
      </div>

      {/* 5-Key Vital KPIs Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-3.5">
        {/* 1. 感情方向 (Sentiment) */}
        <div className="bg-white/90 rounded-xl p-2.5 border border-zinc-200 text-center shadow-2xs">
          <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">感情方向</div>
          <div className="text-base sm:text-lg font-black tabular-nums mt-0.5">
            <AnimatedScore
              value={cm.sentiment.value}
              sentimentMode={true}
              showTrendIcon={true}
              animKey={animationKey}
            />
            <span className="text-[10px] text-zinc-400 font-normal">/100</span>
          </div>
          <div className="text-[10px] text-zinc-600 truncate mt-0.5 font-medium">
            {cm.sentiment.level5}
          </div>
        </div>

        {/* 2. 感情強度 (Intensity) */}
        <div className="bg-white/90 rounded-xl p-2.5 border border-zinc-200 text-center shadow-2xs">
          <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">感情強度</div>
          <div className="text-base sm:text-lg font-black text-amber-600 tabular-nums mt-0.5">
            <AnimatedScore value={cm.intensity.value} animKey={animationKey} />
            <span className="text-[10px] text-zinc-400 font-normal">/100</span>
          </div>
          <div className="text-[10px] text-zinc-600 truncate mt-0.5 font-medium">
            {cm.intensity.level5}
          </div>
        </div>

        {/* 3. 断定度 (Confidence) */}
        <div className="bg-white/90 rounded-xl p-2.5 border border-zinc-200 text-center shadow-2xs">
          <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">断定・言い切り</div>
          <div className="text-base sm:text-lg font-black text-indigo-600 tabular-nums mt-0.5">
            <AnimatedScore value={cm.confidence.value} animKey={animationKey} />
            <span className="text-[10px] text-zinc-400 font-normal">/100</span>
          </div>
          <div className="text-[10px] text-zinc-600 truncate mt-0.5 font-medium">
            {cm.confidence.level5}
          </div>
        </div>

        {/* 4. 対人敵意 (Hostility) */}
        <div className="bg-white/90 rounded-xl p-2.5 border border-zinc-200 text-center shadow-2xs">
          <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">対人敵意</div>
          <div
            className={`text-base sm:text-lg font-black tabular-nums mt-0.5 ${
              cm.hostility.value >= 40 ? "text-rose-600" : "text-emerald-600"
            }`}
          >
            <AnimatedScore value={cm.hostility.value} animKey={animationKey} />
            <span className="text-[10px] text-zinc-400 font-normal">/100</span>
          </div>
          <div className="text-[10px] text-zinc-600 truncate mt-0.5 font-medium">
            {cm.hostility.level5}
          </div>
        </div>

        {/* 5. 4要素合成皮肉 or 皮肉度 */}
        <div className="bg-white/90 rounded-xl p-2.5 border border-zinc-200 text-center shadow-2xs col-span-2 sm:col-span-1">
          <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
            {result.subtextAnalysis ? "4要素合成皮肉" : "皮肉度"}
          </div>
          <div
            className={`text-base sm:text-lg font-black tabular-nums mt-0.5 ${
              (result.subtextAnalysis?.compositeSarcasmScore ?? result.nuanceMeters.sarcasm.value) >= 60
                ? "text-purple-600 font-black"
                : "text-zinc-800"
            }`}
          >
            <AnimatedScore
              value={result.subtextAnalysis?.compositeSarcasmScore ?? result.nuanceMeters.sarcasm.value}
              animKey={animationKey}
            />
            <span className="text-[10px] text-zinc-400 font-normal">/100</span>
          </div>
          <div className="text-[10px] text-zinc-600 truncate mt-0.5 font-medium">
            {result.subtextAnalysis?.verdictBadge ?? result.nuanceMeters.sarcasm.level5}
          </div>
        </div>
      </div>

      {/* 1-Line Emotional Profile Signature */}
      <div className="bg-white rounded-xl border border-zinc-200/80 p-3 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="flex items-center gap-2 min-w-0">
          <Activity className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
          <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider shrink-0">
            Profile Signature:
          </span>
          <div className="font-mono text-xs text-zinc-800 truncate font-semibold bg-zinc-50 px-2 py-0.5 rounded border border-zinc-200">
            {result.emotionalProfileString}
          </div>
        </div>

        <button
          type="button"
          onClick={handleCopyProfile}
          className={`flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-lg transition-all shrink-0 self-end sm:self-center ${
            copiedProfile
              ? "bg-emerald-600 text-white"
              : "bg-zinc-100 hover:bg-zinc-200 text-zinc-700 border border-zinc-200"
          }`}
          title="プロファイル文字列をクリップボードにコピー"
        >
          {copiedProfile ? (
            <>
              <Check className="w-3 h-3 text-white" />
              <span>コピー完了</span>
            </>
          ) : (
            <>
              <Copy className="w-3 h-3 text-zinc-500" />
              <span>文字列をコピー</span>
            </>
          )}
        </button>
      </div>
    </motion.div>
  );
}

