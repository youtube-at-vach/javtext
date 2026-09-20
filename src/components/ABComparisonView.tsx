import React, { useState } from "react";
import { motion } from "motion/react";
import {
  ArrowRightLeft,
  Sparkles,
  TrendingUp,
  TrendingDown,
  Minus,
  RefreshCw,
  Play,
  Copy,
  Check,
  Zap,
  Info,
  Layers,
  Award,
} from "lucide-react";
import { ImpressionResult, MeterItem } from "../types";
import { AB_COMPARISON_PRESETS } from "../data/presets";
import { ImpressionRadar } from "./ImpressionRadar";
import { MeaningOscilloscope } from "./MeaningOscilloscope";
import { AnimatedScore } from "./AnimatedScore";

interface ABComparisonViewProps {
  onMeasure: (textA: string, textB: string) => Promise<{ resultA: ImpressionResult; resultB: ImpressionResult } | null>;
  isMeasuring: boolean;
}

export function ABComparisonView({ onMeasure, isMeasuring }: ABComparisonViewProps) {
  const defaultPreset = AB_COMPARISON_PRESETS[0];

  const [textA, setTextA] = useState(defaultPreset.textA);
  const [textB, setTextB] = useState(defaultPreset.textB);
  const [labelA, setLabelA] = useState("文章A (変更前)");
  const [labelB, setLabelB] = useState("文章B (変更後)");
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(defaultPreset.id);

  const [resultA, setResultA] = useState<ImpressionResult | null>(null);
  const [resultB, setResultB] = useState<ImpressionResult | null>(null);
  const [copied, setCopied] = useState(false);

  // Auto-measure initial preset on first render if no results yet
  React.useEffect(() => {
    handleRunComparison(defaultPreset.textA, defaultPreset.textB);
  }, []);

  const handleRunComparison = async (overrideA?: string, overrideB?: string) => {
    const aToTest = overrideA ?? textA;
    const bToTest = overrideB ?? textB;

    if (!aToTest.trim() || !bToTest.trim() || isMeasuring) return;

    const res = await onMeasure(aToTest, bToTest);
    if (res) {
      setResultA(res.resultA);
      setResultB(res.resultB);
    }
  };

  const handleSelectPreset = (preset: (typeof AB_COMPARISON_PRESETS)[0]) => {
    setSelectedPresetId(preset.id);
    setTextA(preset.textA);
    setTextB(preset.textB);
    setLabelA(preset.labelA);
    setLabelB(preset.labelB);
    handleRunComparison(preset.textA, preset.textB);
  };

  const handleSwap = () => {
    const tempText = textA;
    setTextA(textB);
    setTextB(tempText);

    const tempLabel = labelA;
    setLabelA(labelB);
    setLabelB(tempLabel);

    if (resultA && resultB) {
      const tempRes = resultA;
      setResultA(resultB);
      setResultB(tempRes);
    }
  };

  // Compile list of comparison diffs across all 11 meters
  const comparisonList = React.useMemo(() => {
    if (!resultA || !resultB) return [];

    const getMeterList = (res: ImpressionResult): Record<string, MeterItem> => ({
      sentiment: res.coreMeters.sentiment,
      intensity: res.coreMeters.intensity,
      confidence: res.coreMeters.confidence,
      formality: res.coreMeters.formality,
      hostility: res.coreMeters.hostility,
      aiLikelihood: res.nuanceMeters.aiLikelihood,
      persuasion: res.nuanceMeters.persuasion,
      commercial: res.nuanceMeters.commercial,
      sarcasm: res.nuanceMeters.sarcasm,
      selfCenteredness: res.nuanceMeters.selfCenteredness,
      intellectualPretense: res.nuanceMeters.intellectualPretense,
    });

    const mA = getMeterList(resultA);
    const mB = getMeterList(resultB);

    return Object.keys(mA).map((key) => {
      const itemA = mA[key];
      const itemB = mB[key];
      const delta = itemB.value - itemA.value;
      const absDelta = Math.abs(delta);

      return {
        key,
        name: itemA.name,
        definition: itemA.definition,
        itemA,
        itemB,
        delta,
        absDelta,
      };
    }).sort((a, b) => b.absDelta - a.absDelta); // Sort by biggest change
  }, [resultA, resultB]);

  // Largest delta highlight
  const biggestDeltaItem = comparisonList[0];

  // Copy comparison report to clipboard
  const handleCopyReport = () => {
    if (!resultA || !resultB) return;
    const lines = [
      `【TypeSafe Jev A/B 比較測定レポート】`,
      `[${labelA}]: 「${textA.slice(0, 60)}...」`,
      `[${labelB}]: 「${textB.slice(0, 60)}...」`,
      `----------------------------------------`,
      `【主要変動値 (Delta)】`,
      ...comparisonList.map((m) => {
        const sign = m.delta > 0 ? `+${m.delta}` : `${m.delta}`;
        return `・${m.name}: ${m.itemA.value} → ${m.itemB.value} (${sign}) [${m.itemB.level5}]`;
      }),
    ];
    navigator.clipboard.writeText(lines.join("\n"));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Preset comparison banner */}
      <div className="bg-white rounded-2xl border border-zinc-200/90 p-4 shadow-2xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600">
              <Sparkles className="w-4 h-4" />
            </span>
            <div>
              <h3 className="text-sm font-bold text-zinc-900">
                A/B比較プリセット実験室
              </h3>
              <p className="text-xs text-zinc-500">
                言葉遣いや言い回しを少し変えただけで、メーターがどう跳ね上がるかを直接検証できます。
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleSwap}
            disabled={isMeasuring}
            className="px-3 py-1.5 rounded-lg border border-zinc-200 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 flex items-center gap-1.5 transition-colors"
          >
            <ArrowRightLeft className="w-3.5 h-3.5 text-zinc-500" />
            <span>AとBを入れ替える</span>
          </button>
        </div>

        {/* Preset Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none text-xs">
          {AB_COMPARISON_PRESETS.map((preset) => {
            const isSelected = selectedPresetId === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => handleSelectPreset(preset)}
                disabled={isMeasuring}
                className={`px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all flex items-center gap-2 whitespace-nowrap shrink-0 ${
                  isSelected
                    ? "bg-indigo-50 text-indigo-700 border-indigo-300 shadow-2xs font-bold"
                    : "bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-50"
                }`}
              >
                <span>{preset.title}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Dual Text Inputs Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Text A Box */}
        <div className="bg-white rounded-2xl border border-indigo-200/80 p-4 shadow-2xs space-y-2 relative">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-indigo-600 text-white font-mono text-xs font-bold flex items-center justify-center">
                A
              </span>
              <input
                type="text"
                value={labelA}
                onChange={(e) => setLabelA(e.target.value)}
                className="text-xs font-bold text-zinc-800 bg-transparent border-b border-dashed border-zinc-300 focus:outline-hidden focus:border-indigo-500"
              />
            </div>
            <span className="text-[11px] font-mono text-zinc-400">
              {textA.length} / 2,400 文字
            </span>
          </div>

          <textarea
            value={textA}
            onChange={(e) => {
              setTextA(e.target.value);
              setSelectedPresetId(null);
            }}
            rows={4}
            placeholder="比較元の文章Aを入力..."
            className="w-full text-xs sm:text-sm p-3 rounded-xl border border-zinc-200 bg-zinc-50/50 focus:bg-white focus:outline-hidden focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 resize-none font-sans leading-relaxed"
          />
        </div>

        {/* Text B Box */}
        <div className="bg-white rounded-2xl border border-amber-200/80 p-4 shadow-2xs space-y-2 relative">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-amber-500 text-white font-mono text-xs font-bold flex items-center justify-center">
                B
              </span>
              <input
                type="text"
                value={labelB}
                onChange={(e) => setLabelB(e.target.value)}
                className="text-xs font-bold text-zinc-800 bg-transparent border-b border-dashed border-zinc-300 focus:outline-hidden focus:border-amber-500"
              />
            </div>
            <span className="text-[11px] font-mono text-zinc-400">
              {textB.length} / 2,400 文字
            </span>
          </div>

          <textarea
            value={textB}
            onChange={(e) => {
              setTextB(e.target.value);
              setSelectedPresetId(null);
            }}
            rows={4}
            placeholder="比較先の文章Bを入力..."
            className="w-full text-xs sm:text-sm p-3 rounded-xl border border-zinc-200 bg-zinc-50/50 focus:bg-white focus:outline-hidden focus:border-amber-400 focus:ring-2 focus:ring-amber-100 resize-none font-sans leading-relaxed"
          />
        </div>
      </div>

      {/* Compare Action Button Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-zinc-50 border border-zinc-200 p-3 rounded-2xl">
        <p className="text-xs text-zinc-500">
          ※文章Aと文章Bの両方をTypeSafe Jevで同時測定し、差分（Delta）とレーダーの重なりを算出します。
        </p>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {resultA && resultB && (
            <button
              type="button"
              onClick={handleCopyReport}
              className="flex-1 sm:flex-none px-3.5 py-2 rounded-xl border border-zinc-200 bg-white text-zinc-700 text-xs font-semibold hover:bg-zinc-50 flex items-center justify-center gap-1.5 transition-all shadow-2xs"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-zinc-400" />}
              <span>{copied ? "コピー完了!" : "比較レポートをコピー"}</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => handleRunComparison()}
            disabled={isMeasuring || !textA.trim() || !textB.trim()}
            className="flex-1 sm:flex-none px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 text-white text-xs font-bold hover:from-indigo-500 hover:to-indigo-600 disabled:opacity-50 flex items-center justify-center gap-2 shadow-xs transition-all active:scale-98"
          >
            {isMeasuring ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>TypeSafe Jev 同時測定中...</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>A/B 測定を実行</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Results Section */}
      {resultA && resultB && (
        <div className="space-y-6">
          {/* Highlight Card: Biggest Delta */}
          {biggestDeltaItem && biggestDeltaItem.absDelta > 0 && (
            <div className="bg-gradient-to-r from-indigo-50 via-white to-amber-50 rounded-2xl border border-indigo-200/90 p-4 sm:p-5 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-700">
                    最大の変化指標 (Top Delta)
                  </span>
                  <h4 className="text-base sm:text-lg font-black text-zinc-900 tracking-tight flex items-center gap-2">
                    <span>{biggestDeltaItem.name}</span>
                    <span className="text-sm font-mono font-bold text-zinc-500">
                      {biggestDeltaItem.itemA.value} → {biggestDeltaItem.itemB.value}
                    </span>
                  </h4>
                  <p className="text-xs text-zinc-600 mt-0.5">
                    {labelA}から{labelB}への変更で、<strong>{biggestDeltaItem.name}</strong>が
                    <strong> {Math.abs(biggestDeltaItem.delta)} ポイント</strong>
                    {biggestDeltaItem.delta > 0 ? "急上昇" : "急降下"}しました。
                  </p>
                </div>
              </div>

              <div className="shrink-0 flex items-center gap-2">
                <div
                  className={`text-xl sm:text-2xl font-black font-mono px-4 py-2 rounded-xl border flex items-center gap-1.5 shadow-2xs ${
                    biggestDeltaItem.delta > 0
                      ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                      : "bg-rose-50 text-rose-700 border-rose-300"
                  }`}
                >
                  {biggestDeltaItem.delta > 0 ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                  <span>{biggestDeltaItem.delta > 0 ? `+${biggestDeltaItem.delta}` : biggestDeltaItem.delta}</span>
                </div>
              </div>
            </div>
          )}

          {/* Side-by-Side Dual Radar Overlay */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-1">
              <ImpressionRadar
                meters={resultA.coreMeters}
                comparisonMeters={resultB.coreMeters}
                labelA={labelA}
                labelB={labelB}
              />
            </div>

            {/* Top 6 Changes Breakdown */}
            <div className="lg:col-span-2 bg-white rounded-2xl border border-zinc-200 p-4 sm:p-5 shadow-2xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-2 border-b border-zinc-100">
                  <h4 className="text-xs font-bold text-zinc-900 tracking-tight">
                    全11軸の差分ソート（変化が大きい順）
                  </h4>
                  <span className="text-[10px] font-mono text-zinc-400">
                    11 Dimensions Evaluated
                  </span>
                </div>

                <div className="divide-y divide-zinc-100 mt-2">
                  {comparisonList.slice(0, 6).map((m) => {
                    const isPositive = m.delta > 0;
                    const isZero = m.delta === 0;
                    return (
                      <div
                        key={m.key}
                        className="py-2.5 flex items-center justify-between gap-2 text-xs"
                      >
                        <div className="min-w-0">
                          <span className="font-bold text-zinc-800 truncate block">
                            {m.name}
                          </span>
                          <span className="text-[10px] text-zinc-400 truncate block">
                            {m.definition || "文章表現の印象値"}
                          </span>
                        </div>

                        <div className="flex items-center gap-3 shrink-0 font-mono">
                          {/* Value A */}
                          <div className="text-right">
                            <span className="text-[10px] text-zinc-400 block">{labelA}</span>
                            <span className="font-bold text-indigo-700">{m.itemA.value}</span>
                          </div>

                          <span className="text-zinc-300">→</span>

                          {/* Value B */}
                          <div className="text-right">
                            <span className="text-[10px] text-zinc-400 block">{labelB}</span>
                            <span className="font-bold text-amber-700">
                              <AnimatedScore value={m.itemB.value} />
                            </span>
                          </div>

                          {/* Delta Badge: Blue for positive increase, Red for decrease */}
                          <div
                            className={`min-w-[68px] text-center font-bold px-2 py-1 rounded-md text-xs border flex items-center justify-center gap-1 ${
                              isZero
                                ? "bg-zinc-100 text-zinc-500 border-zinc-200"
                                : isPositive
                                ? "bg-blue-50 text-blue-700 border-blue-200 shadow-2xs"
                                : "bg-rose-50 text-rose-700 border-rose-200 shadow-2xs"
                            }`}
                          >
                            {isZero ? (
                              <span>±0</span>
                            ) : isPositive ? (
                              <>
                                <TrendingUp className="w-3 h-3 text-blue-600" />
                                <span>+{m.delta}</span>
                              </>
                            ) : (
                              <>
                                <TrendingDown className="w-3 h-3 text-rose-600" />
                                <span>{m.delta}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Oscilloscope for A and B */}
          {resultA.sentenceFlow && resultB.sentenceFlow && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <MeaningOscilloscope
                sentenceFlow={resultA.sentenceFlow}
                title={`${labelA} の文章波形オシロスコープ`}
                isCompact={true}
              />
              <MeaningOscilloscope
                sentenceFlow={resultB.sentenceFlow}
                title={`${labelB} の文章波形オシロスコープ`}
                isCompact={true}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
