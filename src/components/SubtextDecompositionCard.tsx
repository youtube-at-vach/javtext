import { useState, useTransition } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Sparkles,
  AlertTriangle,
  HelpCircle,
  TrendingUp,
  Layers,
  Info,
  ShieldAlert,
  Heart,
  ChevronDown,
  ChevronUp,
  Sliders,
  Calculator,
  ArrowRight,
  RefreshCw,
  CheckCircle2,
} from "lucide-react";
import { SubtextDecomposition } from "../types";
import { AnimatedScore } from "./AnimatedScore";

interface SubtextDecompositionCardProps {
  subtext: SubtextDecomposition;
  onOpenBenchmark?: () => void;
}

export function SubtextDecompositionCard({
  subtext,
  onOpenBenchmark,
}: SubtextDecompositionCardProps) {
  const [showExplanation, setShowExplanation] = useState(false);
  const [activeTab, setActiveTab] = useState<"process" | "contributions" | "simulator">("process");

  // Interactive Sandbox State initialized from current subtext
  const [simSurface, setSimSurface] = useState(subtext.surfaceCourtesy);
  const [simGrievance, setSimGrievance] = useState(subtext.underlyingGrievance);
  const [simAvoidance, setSimAvoidance] = useState(subtext.avoidanceIntent);
  const [simIndirect, setSimIndirect] = useState(subtext.indirectCriticism);
  const [simRawSarcasm, setSimRawSarcasm] = useState(subtext.rawSarcasmScore);
  const [isPending, startTransition] = useTransition();

  // Client-side instant recalculation for sandbox
  const computeSimulated = (
    s: number,
    g: number,
    a: number,
    i: number,
    raw: number
  ) => {
    const baseLoad = Math.round(g * 0.40 + a * 0.35 + i * 0.25);
    let gap = 0;
    if (s >= 40 && baseLoad >= 30) {
      gap = Math.min(100, Math.round(s * 0.48 + baseLoad * 0.52));
    } else {
      gap = Math.min(100, Math.round(Math.abs(s - baseLoad) * 0.40));
    }
    const mult = Number((1.0 + (i / 100) * 0.25).toFixed(2));
    const bonus = gap >= 40 && s >= 40 && baseLoad >= 35 ? Math.round((gap - 30) * 0.85) : 0;
    const composite = Math.min(100, Math.max(raw, Math.round(baseLoad * mult + bonus)));
    return { baseLoad, gap, mult, bonus, composite };
  };

  const simResult = computeSimulated(simSurface, simGrievance, simAvoidance, simIndirect, simRawSarcasm);

  const isKyoto = subtext.verdict === "kyoto_passive_aggressive";
  const hasBoost = subtext.compositeSarcasmScore > subtext.rawSarcasmScore + 10;
  const process = subtext.synthesisProcess;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={`rounded-2xl border p-4 sm:p-5 transition-all shadow-xs ${
        isKyoto
          ? "bg-gradient-to-br from-amber-50/70 via-white to-emerald-50/40 border-amber-300 ring-1 ring-amber-200/60"
          : "bg-white border-zinc-200"
      }`}
    >
      {/* Header with Badges & Navigation */}
      <div className="flex flex-wrap items-start justify-between gap-3 mb-3.5 pb-3 border-b border-zinc-100">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <span className="inline-flex items-center gap-1 text-[11px] font-black px-2.5 py-0.5 rounded-full bg-zinc-900 text-white tracking-wide shadow-2xs">
              <span className="text-amber-400">★</span>
              <span>重要度 2</span>
              <span className="text-zinc-400 font-normal">|</span>
              <span className="font-bold">本音と建前の真意看破</span>
            </span>

            <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1 shadow-2xs">
              <Layers className="w-3 h-3 text-amber-700" />
              <span>4要素合成推論</span>
            </span>

            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shadow-2xs ${
                isKyoto
                  ? "bg-amber-100 text-amber-900 border-amber-300 flex items-center gap-1"
                  : "bg-zinc-100 text-zinc-800 border-zinc-200"
              }`}
            >
              {subtext.verdictBadge}
            </span>

            {hasBoost && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-200 flex items-center gap-1 shadow-2xs animate-pulse">
                <TrendingUp className="w-3 h-3 text-rose-600" />
                <span>真意看破 (+{subtext.compositeSarcasmScore - subtext.rawSarcasmScore}pt補正)</span>
              </span>
            )}
          </div>

          <h3 className="text-base sm:text-lg font-black text-zinc-900 tracking-tight flex items-center gap-2">
            <span>{subtext.verdictTitle}</span>
          </h3>

          <p className="text-xs text-zinc-600 mt-1 leading-relaxed max-w-2xl">
            {subtext.verdictDescription}
          </p>
        </div>

        {onOpenBenchmark && (
          <button
            type="button"
            onClick={onOpenBenchmark}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white transition-colors shadow-xs shrink-0"
            title="真摯な感謝から京都式皮肉、直接クレームまでの4段階比較を検証"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>4段階婉曲ベンチマーク</span>
          </button>
        )}
      </div>

      {/* 4 Atomic Subtext Signals Grid */}
      <div className="mb-4">
        <div className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-2 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span>入力4要素（表面感情・不満度・回避意図・婉曲性）</span>
            <span className="text-[10px] text-zinc-400 font-normal">※Jev System One独立直観推論</span>
          </div>
          <span className="text-[10px] text-zinc-500 font-mono">各0〜100点</span>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
          {/* 1. Surface Courtesy */}
          <div className="bg-zinc-50/90 rounded-xl p-3 border border-zinc-200/80 shadow-2xs">
            <div className="flex items-center justify-between text-[11px] font-medium text-zinc-600 mb-1">
              <span className="flex items-center gap-1">
                <Heart className="w-3.5 h-3.5 text-emerald-500" />
                <span className="font-bold text-zinc-800">表面の感情・礼儀度</span>
              </span>
              <span className="text-[9px] text-zinc-400 font-mono">S (建前)</span>
            </div>
            <div className="flex items-baseline justify-between">
              <div className="text-lg font-black text-zinc-900 tabular-nums">
                <AnimatedScore value={subtext.surfaceCourtesy} />
                <span className="text-xs text-zinc-400 font-normal ml-0.5">/100</span>
              </div>
              <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                {subtext.surfaceCourtesy >= 70 ? "慇懃・丁寧" : subtext.surfaceCourtesy >= 40 ? "標準敬語" : "粗野・直接"}
              </span>
            </div>
            <div className="w-full bg-zinc-200 rounded-full h-1.5 mt-2 overflow-hidden">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all duration-700"
                style={{ width: `${subtext.surfaceCourtesy}%` }}
              />
            </div>
            <div className="text-[9px] text-zinc-500 mt-1 truncate">
              字面の挨拶・感謝の丁寧さ
            </div>
          </div>

          {/* 2. Underlying Grievance */}
          <div className="bg-zinc-50/90 rounded-xl p-3 border border-zinc-200/80 shadow-2xs">
            <div className="flex items-center justify-between text-[11px] font-medium text-zinc-600 mb-1">
              <span className="flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
                <span className="font-bold text-zinc-800">潜在不満度</span>
              </span>
              <span className="text-[9px] text-zinc-400 font-mono">G (40%重み)</span>
            </div>
            <div className="flex items-baseline justify-between">
              <div className="text-lg font-black text-zinc-900 tabular-nums">
                <AnimatedScore value={subtext.underlyingGrievance} />
                <span className="text-xs text-zinc-400 font-normal ml-0.5">/100</span>
              </div>
              <span
                className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                  subtext.underlyingGrievance >= 65
                    ? "text-rose-700 bg-rose-50 font-bold"
                    : "text-zinc-600 bg-zinc-100"
                }`}
              >
                {subtext.underlyingGrievance >= 70 ? "強い憤慨" : subtext.underlyingGrievance >= 40 ? "不満・失望" : "不満なし"}
              </span>
            </div>
            <div className="w-full bg-zinc-200 rounded-full h-1.5 mt-2 overflow-hidden">
              <div
                className="bg-rose-500 h-full rounded-full transition-all duration-700"
                style={{ width: `${subtext.underlyingGrievance}%` }}
              />
            </div>
            <div className="text-[9px] text-zinc-500 mt-1 truncate">
              言外に潜む苦情・失望・課題感
            </div>
          </div>

          {/* 3. Avoidance Intent */}
          <div className="bg-zinc-50/90 rounded-xl p-3 border border-zinc-200/80 shadow-2xs">
            <div className="flex items-center justify-between text-[11px] font-medium text-zinc-600 mb-1">
              <span className="flex items-center gap-1">
                <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />
                <span className="font-bold text-zinc-800">回避意図・忌避度</span>
              </span>
              <span className="text-[9px] text-zinc-400 font-mono">A (35%重み)</span>
            </div>
            <div className="flex items-baseline justify-between">
              <div className="text-lg font-black text-zinc-900 tabular-nums">
                <AnimatedScore value={subtext.avoidanceIntent} />
                <span className="text-xs text-zinc-400 font-normal ml-0.5">/100</span>
              </div>
              <span
                className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                  subtext.avoidanceIntent >= 65
                    ? "text-amber-800 bg-amber-50 font-bold"
                    : "text-zinc-600 bg-zinc-100"
                }`}
              >
                {subtext.avoidanceIntent >= 70 ? "利用停止決意" : subtext.avoidanceIntent >= 40 ? "代替模索" : "継続利用"}
              </span>
            </div>
            <div className="w-full bg-zinc-200 rounded-full h-1.5 mt-2 overflow-hidden">
              <div
                className="bg-amber-500 h-full rounded-full transition-all duration-700"
                style={{ width: `${subtext.avoidanceIntent}%` }}
              />
            </div>
            <div className="text-[9px] text-zinc-500 mt-1 truncate">
              「他を検討」「次回回避」の意図
            </div>
          </div>

          {/* 4. Indirect Criticism */}
          <div className="bg-zinc-50/90 rounded-xl p-3 border border-zinc-200/80 shadow-2xs">
            <div className="flex items-center justify-between text-[11px] font-medium text-zinc-600 mb-1">
              <span className="flex items-center gap-1">
                <Info className="w-3.5 h-3.5 text-indigo-500" />
                <span className="font-bold text-zinc-800">婉曲性・当てつけ度</span>
              </span>
              <span className="text-[9px] text-zinc-400 font-mono">I (25%重み)</span>
            </div>
            <div className="flex items-baseline justify-between">
              <div className="text-lg font-black text-zinc-900 tabular-nums">
                <AnimatedScore value={subtext.indirectCriticism} />
                <span className="text-xs text-zinc-400 font-normal ml-0.5">/100</span>
              </div>
              <span
                className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                  subtext.indirectCriticism >= 65
                    ? "text-indigo-800 bg-indigo-50 font-bold"
                    : "text-zinc-600 bg-zinc-100"
                }`}
              >
                {subtext.indirectCriticism >= 70 ? "高度な当てつけ" : subtext.indirectCriticism >= 40 ? "遠回し" : "直球・率直"}
              </span>
            </div>
            <div className="w-full bg-zinc-200 rounded-full h-1.5 mt-2 overflow-hidden">
              <div
                className="bg-indigo-500 h-full rounded-full transition-all duration-700"
                style={{ width: `${subtext.indirectCriticism}%` }}
              />
            </div>
            <div className="text-[9px] text-zinc-500 mt-1 truncate">
              察せさせる京都的修辞・皮肉乗数
            </div>
          </div>
        </div>
      </div>

      {/* Synthesis Comparator Bar */}
      <div className="bg-zinc-900 text-white rounded-xl p-3.5 sm:p-4 mb-4 border border-zinc-800 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <span className="text-xs font-bold text-zinc-200 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>合成結果：単一質問スコア vs 4要素合成真意スコア</span>
          </span>
          <span className="text-[11px] font-mono text-zinc-400">
            本音と建前の乖離度: <strong className="text-amber-400 font-bold">{subtext.tatemaeHonneGap}点</strong>
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
          {/* Raw Sarcasm */}
          <div className="bg-zinc-800/80 rounded-lg p-2.5 border border-zinc-700/60">
            <div className="text-[10px] text-zinc-400 font-medium">単一の皮肉質問（従来の生スコア）</div>
            <div className="text-xl font-black text-zinc-100 mt-0.5 tabular-nums">
              <AnimatedScore value={subtext.rawSarcasmScore} textColor="text-zinc-100" />
              <span className="text-xs text-zinc-400 font-normal ml-0.5">/100</span>
            </div>
            <div className="text-[10px] text-zinc-400 mt-1">
              {subtext.rawSarcasmScore <= 35 ? "⚠️ 表面の感謝に幻惑され低評価" : "皮肉をある程度検知"}
            </div>
          </div>

          {/* Gap Meter */}
          <div className="bg-zinc-800/80 rounded-lg p-2.5 border border-zinc-700/60">
            <div className="text-[10px] text-zinc-400 font-medium">建前と本音の乖離度（Gap）</div>
            <div className="text-xl font-black text-amber-300 mt-0.5 tabular-nums">
              <AnimatedScore value={subtext.tatemaeHonneGap} textColor="text-amber-300" />
              <span className="text-xs text-zinc-400 font-normal ml-0.5">/100</span>
            </div>
            <div className="text-[10px] text-amber-200/90 mt-1">
              {subtext.tatemaeHonneGap >= 60 ? "⚡️ 表面と水面下の深刻な乖離" : "言行一致・標準的"}
            </div>
          </div>

          {/* Composite Sarcasm */}
          <div className="bg-amber-950/40 rounded-lg p-2.5 border border-amber-600/50 ring-1 ring-amber-500/30">
            <div className="text-[10px] text-amber-300 font-bold flex items-center justify-center gap-1">
              <TrendingUp className="w-3 h-3 text-amber-400" />
              <span>4要素合成皮肉度（真のスコア）</span>
            </div>
            <div className="text-xl font-black text-amber-300 mt-0.5 tabular-nums">
              <AnimatedScore value={subtext.compositeSarcasmScore} textColor="text-amber-300" />
              <span className="text-xs text-amber-300/80 font-normal ml-0.5">/100</span>
            </div>
            <div className="text-[10px] text-amber-200 font-semibold mt-1">
              {isKyoto ? "🎯 京都式婉曲クレームと同定" : "4要素合成による真意評価"}
            </div>
          </div>
        </div>
      </div>

      {/* Synthesis Process Tabs: [プロセス工程], [要素別寄与度], [インタラクティブ実験] */}
      <div className="bg-zinc-50 rounded-xl p-3 border border-zinc-200 mb-3">
        <div className="flex items-center justify-between gap-2 border-b border-zinc-200/70 pb-2 mb-3">
          <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-900">
            <Calculator className="w-3.5 h-3.5 text-indigo-600" />
            <span>皮肉度合成プロセスの可視化</span>
          </div>

          <div className="flex items-center gap-1 bg-zinc-200/80 p-0.5 rounded-lg text-[11px] font-medium">
            <button
              type="button"
              onClick={() => setActiveTab("process")}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                activeTab === "process"
                  ? "bg-white text-zinc-900 font-bold shadow-2xs"
                  : "text-zinc-600 hover:text-zinc-900"
              }`}
            >
              5段階合成パイプライン
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("contributions")}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                activeTab === "contributions"
                  ? "bg-white text-zinc-900 font-bold shadow-2xs"
                  : "text-zinc-600 hover:text-zinc-900"
              }`}
            >
              要素別寄与度
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("simulator")}
              className={`px-2.5 py-1 rounded-md transition-colors flex items-center gap-1 ${
                activeTab === "simulator"
                  ? "bg-white text-indigo-700 font-bold shadow-2xs"
                  : "text-zinc-600 hover:text-zinc-900"
              }`}
            >
              <Sliders className="w-3 h-3 text-indigo-600" />
              <span>リアルタイム実験箱</span>
            </button>
          </div>
        </div>

        {/* Tab 1: 5段階合成パイプライン */}
        {activeTab === "process" && process && (
          <div className="space-y-2.5">
            <div className="text-[11px] text-zinc-600 bg-white p-2.5 rounded-lg border border-zinc-200 font-mono overflow-x-auto leading-relaxed">
              <span className="text-zinc-400 font-bold mr-1">Formula:</span>
              <span className="text-indigo-900 font-semibold">{process.formulaDisplay}</span>
            </div>

            <div className="space-y-2">
              {process.steps.map((step) => (
                <div
                  key={step.stepNumber}
                  className="bg-white rounded-lg p-2.5 border border-zinc-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                >
                  <div className="flex items-start gap-2 min-w-0">
                    <span className="w-5 h-5 rounded-full bg-zinc-900 text-white font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                      {step.stepNumber}
                    </span>
                    <div>
                      <div className="font-bold text-zinc-900 flex items-center gap-1.5">
                        <span>{step.title}</span>
                        {step.calculatedValue !== undefined && (
                          <span className="font-mono text-indigo-600 bg-indigo-50 px-1.5 py-0.2 rounded text-[10px]">
                            {step.calculatedValue} {step.unit}
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-zinc-600 mt-0.5 leading-relaxed">
                        {step.description}
                      </div>
                      {step.formula && (
                        <div className="text-[10px] font-mono text-zinc-500 bg-zinc-50 px-1.5 py-0.5 rounded mt-1 inline-block border border-zinc-200">
                          {step.formula}
                        </div>
                      )}
                    </div>
                  </div>

                  {step.notes && (
                    <div className="text-[10px] text-zinc-400 sm:text-right shrink-0">
                      {step.notes}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="text-[11px] text-zinc-600 bg-amber-50/70 p-2.5 rounded-lg border border-amber-200/80 leading-relaxed">
              <strong className="text-amber-950 font-bold mr-1">💡 合成サマリー:</strong>
              <span>{process.explanationSummary}</span>
            </div>
          </div>
        )}

        {/* Tab 2: 要素別寄与度 (Element Contributions) */}
        {activeTab === "contributions" && process && (
          <div className="space-y-3">
            <div className="text-xs text-zinc-600 leading-relaxed">
              最終皮肉度（{subtext.compositeSarcasmScore}点）を構成する各要素の重み付けと貢献度内訳です。
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {process.contributions.map((c) => (
                <div
                  key={c.key}
                  className="bg-white rounded-lg p-3 border border-zinc-200 shadow-2xs text-xs"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-bold text-zinc-800">{c.label}</span>
                    <span className="font-mono text-zinc-500 text-[10px]">
                      スコア: <strong className="text-zinc-900">{c.score}点</strong>
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-zinc-500 mb-1">
                    <span>実効貢献度</span>
                    <span className="font-mono font-bold text-indigo-700">
                      +{c.effectiveContribution} pt
                    </span>
                  </div>

                  <div className="w-full bg-zinc-100 rounded-full h-2 overflow-hidden mb-1.5">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        c.color === "emerald"
                          ? "bg-emerald-500"
                          : c.color === "rose"
                          ? "bg-rose-500"
                          : c.color === "amber"
                          ? "bg-amber-500"
                          : "bg-indigo-500"
                      }`}
                      style={{ width: `${Math.min(100, (c.effectiveContribution / 60) * 100)}%` }}
                    />
                  </div>

                  <div className="text-[10px] text-zinc-500 leading-tight">
                    {c.role}
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-white rounded-lg p-3 border border-zinc-200 text-xs">
              <div className="font-bold text-zinc-800 mb-1">なぜ表面好意（建前）が皮肉度を上げるのか？</div>
              <p className="text-zinc-600 text-[11px] leading-relaxed">
                一般的な感情分析では「丁寧＝ポジティブ」と解釈されますが、皮肉の認知心理学では<strong>「強い不満や絶縁意図があるにもかかわらず、満面の笑顔とお礼で覆い隠す」</strong>ことこそがアイロニーの最大エネルギーとなります。そのため、表面の丁寧さが高いほど、ギャップボーナス（Gap Bonus）として皮肉度への加算が働きます。
              </p>
            </div>
          </div>
        )}

        {/* Tab 3: リアルタイム実験箱 (Interactive Simulator) */}
        {activeTab === "simulator" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-zinc-600">
              <span>スライダーを動かして、4要素の力学がどのように皮肉度へ合成されるかリアルタイムに体験できます：</span>
              <button
                type="button"
                onClick={() => {
                  setSimSurface(subtext.surfaceCourtesy);
                  setSimGrievance(subtext.underlyingGrievance);
                  setSimAvoidance(subtext.avoidanceIntent);
                  setSimIndirect(subtext.indirectCriticism);
                  setSimRawSarcasm(subtext.rawSarcasmScore);
                }}
                className="text-[11px] font-semibold text-zinc-500 hover:text-zinc-800 flex items-center gap-1 transition-colors"
                title="計測値にリセット"
              >
                <RefreshCw className="w-3 h-3" />
                <span>元の値にリセット</span>
              </button>
            </div>

            {/* Sliders Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-white p-3 rounded-lg border border-zinc-200">
              {/* Surface Courtesy Slider */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-bold text-emerald-800 flex items-center gap-1">
                    <Heart className="w-3 h-3 text-emerald-500" />
                    <span>表面の礼儀・感情 (S)</span>
                  </span>
                  <span className="font-mono font-bold text-zinc-900">{simSurface}点</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={simSurface}
                  onChange={(e) => setSimSurface(Number(e.target.value))}
                  className="w-full accent-emerald-600 cursor-pointer"
                />
                <div className="text-[10px] text-zinc-400">下げると直接クレーム化 / 上げると京都的落差が発生</div>
              </div>

              {/* Underlying Grievance Slider */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-bold text-rose-800 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3 text-rose-500" />
                    <span>言外の潜在不満 (G, 40%)</span>
                  </span>
                  <span className="font-mono font-bold text-zinc-900">{simGrievance}点</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={simGrievance}
                  onChange={(e) => setSimGrievance(Number(e.target.value))}
                  className="w-full accent-rose-600 cursor-pointer"
                />
                <div className="text-[10px] text-zinc-400">内心の不満・クレームのエネルギー</div>
              </div>

              {/* Avoidance Intent Slider */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-bold text-amber-800 flex items-center gap-1">
                    <ShieldAlert className="w-3 h-3 text-amber-500" />
                    <span>関係回避・忌避意図 (A, 35%)</span>
                  </span>
                  <span className="font-mono font-bold text-zinc-900">{simAvoidance}点</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={simAvoidance}
                  onChange={(e) => setSimAvoidance(Number(e.target.value))}
                  className="w-full accent-amber-600 cursor-pointer"
                />
                <div className="text-[10px] text-zinc-400">「他を探す」「二度と頼まない」の度合い</div>
              </div>

              {/* Indirect Criticism Slider */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-bold text-indigo-800 flex items-center gap-1">
                    <Info className="w-3 h-3 text-indigo-500" />
                    <span>婉曲性・当てつけ度 (I, 25%)</span>
                  </span>
                  <span className="font-mono font-bold text-zinc-900">{simIndirect}点</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={simIndirect}
                  onChange={(e) => setSimIndirect(Number(e.target.value))}
                  className="w-full accent-indigo-600 cursor-pointer"
                />
                <div className="text-[10px] text-zinc-400">遠回しな修辞・当てこすり（乗数に寄与）</div>
              </div>
            </div>

            {/* Instant Simulation Outcome Bar */}
            <div className="bg-zinc-900 text-white p-3 rounded-lg flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-3">
                <div>
                  <div className="text-[10px] text-zinc-400">潜在不満負荷 (L)</div>
                  <div className="text-base font-bold font-mono text-zinc-200">{simResult.baseLoad}pt</div>
                </div>
                <span className="text-zinc-600 font-bold">+</span>
                <div>
                  <div className="text-[10px] text-zinc-400">建前乖離度 (Gap)</div>
                  <div className="text-base font-bold font-mono text-amber-400">{simResult.gap}pt</div>
                </div>
                <span className="text-zinc-600 font-bold">×</span>
                <div>
                  <div className="text-[10px] text-zinc-400">婉曲乗数</div>
                  <div className="text-base font-bold font-mono text-indigo-300">×{simResult.mult}</div>
                </div>
              </div>

              <div className="flex items-center gap-2 bg-amber-950/60 border border-amber-600/60 px-3 py-1.5 rounded-lg">
                <span className="text-[11px] text-amber-300 font-bold">シミュレーション合成皮肉度:</span>
                <span className="text-xl font-black text-amber-400 font-mono">{simResult.composite}点</span>
              </div>
            </div>

            <div className="text-[11px] text-zinc-500 bg-white p-2 rounded border border-zinc-200">
              {simResult.composite >= 65 && simResult.gap >= 55 ? (
                <span className="text-amber-700 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>【京都式アイロニー成立】表面が非常に丁寧でありながら、水面下の不満と回避意図が高いため、強烈な皮肉として合成されました。</span>
                </span>
              ) : simSurface <= 30 && simGrievance >= 60 ? (
                <span className="text-rose-700 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>【直接クレーム判定】表面が丁寧ではないため、建前との乖離が生じず、皮肉ではなくストレートな抗議文として認識されます。</span>
                </span>
              ) : simGrievance <= 25 ? (
                <span className="text-emerald-700 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>【好意・感謝判定】不満が存在しないため、言葉通りの好意・感謝として判定されます。</span>
                </span>
              ) : (
                <span>中立・配慮型の伝達表現として合成されています。</span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Accordion / Explanation Toggle */}
      <button
        type="button"
        onClick={() => setShowExplanation(!showExplanation)}
        className="w-full flex items-center justify-between text-xs font-semibold text-zinc-600 hover:text-zinc-900 py-1.5 transition-colors"
      >
        <span className="flex items-center gap-1.5">
          <HelpCircle className="w-3.5 h-3.5 text-zinc-400" />
          <span>なぜ単一質問ではなく「4要素から皮肉度を合成する」のか？</span>
        </span>
        {showExplanation ? (
          <ChevronUp className="w-4 h-4 text-zinc-400" />
        ) : (
          <ChevronDown className="w-4 h-4 text-zinc-400" />
        )}
      </button>

      {showExplanation && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          transition={{ duration: 0.3 }}
          className="mt-2 text-xs text-zinc-600 bg-zinc-50 rounded-xl p-3.5 border border-zinc-200/80 leading-relaxed space-y-2"
        >
          <p>
            <strong>なぜ京都弁の皮肉を単一質問で当てるのが難しいのか？</strong>
            <br />
            「先日はありがとうございました。おかげさまで…」という文章は、語彙的に極めて高頻度な感謝表現で構成されています。単一の質問（「皮肉ですか？」）で判定させると、LLMや言語モデルは字面の礼儀正しさに引っ張られ、感情方向をポジティブ（74点）、皮肉度を低（20点程度）と判定してしまいます。
          </p>
          <p>
            <strong>TypeSafe Jev System One の4要素合成アプローチ：</strong>
            <br />
            Jevのような高速・低レイテンシモデルでは、複雑な「皮肉」という高次概念を一度に解かせるのではなく、
            <strong>
              ①「表面感情・礼儀度」②「潜在不満度」③「関係回避・忌避意図」④「婉曲性・当てつけ度」
            </strong>
            という直交する単純な4つの直観判定に分解し、それらの落差（建前と本音の乖離度）から皮肉度を合成します。これにより、京都弁特有の「表面は満面の笑みでお礼を言いながら、二度と頼まないと宣言する」という高度なアイロニーを完璧に捉えることができます。
          </p>
        </motion.div>
      )}
    </motion.div>
  );
}
