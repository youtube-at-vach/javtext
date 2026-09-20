import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Sparkles, ArrowRight, Layers, CheckCircle2, TrendingUp, AlertTriangle } from "lucide-react";
import { ImpressionResult } from "../types";

interface BenchmarkCase {
  stage: number;
  stageName: string;
  category: string;
  text: string;
  result: ImpressionResult;
}

interface SubtextBenchmarkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectText: (text: string) => void;
}

export function SubtextBenchmarkModal({
  isOpen,
  onClose,
  onSelectText,
}: SubtextBenchmarkModalProps) {
  const [loading, setLoading] = useState(false);
  const [cases, setCases] = useState<BenchmarkCase[]>([]);
  const [activeStage, setActiveStage] = useState<number>(3); // default to Kyoto stage

  useEffect(() => {
    if (!isOpen) return;
    async function fetchBenchmark() {
      setLoading(true);
      try {
        const res = await fetch("/api/benchmark-euphemism", { method: "POST" });
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setCases(json.data);
        }
      } catch (err) {
        console.error("Failed to load benchmark:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchBenchmark();
  }, [isOpen]);

  if (!isOpen) return null;

  const currentCase = cases.find((c) => c.stage === activeStage) || cases[2];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-zinc-950/60 backdrop-blur-xs overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.25 }}
          className="bg-white rounded-3xl shadow-2xl border border-zinc-200 w-full max-w-4xl overflow-hidden my-auto"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-zinc-900 via-zinc-800 to-amber-950 text-white p-4 sm:p-6 flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-[10px] font-bold tracking-wider uppercase px-2.5 py-0.5 rounded-full bg-amber-400 text-zinc-950 flex items-center gap-1 font-mono">
                  <Layers className="w-3 h-3" />
                  <span>Jev 4-Stage Subtext Benchmark</span>
                </span>
                <span className="text-xs text-amber-200">京都弁・婉曲アイロニー検証</span>
              </div>
              <h2 className="text-lg sm:text-xl font-black tracking-tight">
                本音と建前：4段階の婉曲性スペクトラム比較
              </h2>
              <p className="text-xs text-zinc-300 mt-1 max-w-2xl leading-relaxed">
                「真摯な感謝」から「京都式・婉曲クレーム」、そして「直接抗議」まで。単一の皮肉質問では見抜けない言外のニュアンスを、4つの直観判定から合成するJevの推論力を比較します。
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-zinc-400 hover:text-white rounded-xl hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Stage Selector Tabs */}
          <div className="bg-zinc-100 p-2 sm:p-3 border-b border-zinc-200 grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { stage: 1, name: "1. 真摯な感謝", desc: "言行一致の好意" },
              { stage: 2, name: "2. 丁寧な要望", desc: "敬意ある配慮" },
              { stage: 3, name: "3. 京都式クレーム", desc: "表面感謝・内心忌避" },
              { stage: 4, name: "4. 直接クレーム", desc: "装飾なしの怒り" },
            ].map((st) => (
              <button
                key={st.stage}
                type="button"
                onClick={() => setActiveStage(st.stage)}
                className={`text-left p-2.5 rounded-xl border transition-all ${
                  activeStage === st.stage
                    ? st.stage === 3
                      ? "bg-amber-500 text-white border-amber-600 shadow-xs"
                      : "bg-zinc-900 text-white border-zinc-900 shadow-xs"
                    : "bg-white hover:bg-zinc-50 text-zinc-700 border-zinc-200"
                }`}
              >
                <div className="text-xs font-black truncate">{st.name}</div>
                <div
                  className={`text-[10px] mt-0.5 truncate ${
                    activeStage === st.stage ? "text-zinc-200" : "text-zinc-500"
                  }`}
                >
                  {st.desc}
                </div>
              </button>
            ))}
          </div>

          {/* Active Stage Content */}
          <div className="p-4 sm:p-6 space-y-4 max-h-[70vh] overflow-y-auto">
            {loading ? (
              <div className="py-12 text-center text-zinc-400 font-mono text-sm">
                4段階ベンチマークを測定中...
              </div>
            ) : currentCase ? (
              <div className="space-y-4">
                {/* Sentence Quote Box */}
                <div className="bg-zinc-50 rounded-2xl p-4 border border-zinc-200 relative">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">
                      検証対象の例文 (Stage {currentCase.stage})
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        onSelectText(currentCase.text);
                        onClose();
                      }}
                      className="flex items-center gap-1 text-xs font-bold text-amber-700 bg-amber-100 hover:bg-amber-200 px-3 py-1 rounded-lg transition-colors"
                    >
                      <span>この文章をメイン分析にセット</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <p className="text-sm sm:text-base font-semibold text-zinc-800 leading-relaxed font-sans">
                    「{currentCase.text}」
                  </p>
                </div>

                {/* Subtext Decomposition Breakdown */}
                {currentCase.result.subtextAnalysis && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                      <div className="bg-white rounded-xl p-3 border border-zinc-200 text-center">
                        <div className="text-[10px] text-zinc-500 font-medium">表面上の丁寧さ</div>
                        <div className="text-lg font-black text-emerald-600 mt-0.5">
                          {currentCase.result.subtextAnalysis.surfaceCourtesy}
                          <span className="text-xs text-zinc-400 font-normal">/100</span>
                        </div>
                      </div>
                      <div className="bg-white rounded-xl p-3 border border-zinc-200 text-center">
                        <div className="text-[10px] text-zinc-500 font-medium">言外の潜在不満</div>
                        <div className="text-lg font-black text-rose-600 mt-0.5">
                          {currentCase.result.subtextAnalysis.underlyingGrievance}
                          <span className="text-xs text-zinc-400 font-normal">/100</span>
                        </div>
                      </div>
                      <div className="bg-white rounded-xl p-3 border border-zinc-200 text-center">
                        <div className="text-[10px] text-zinc-500 font-medium">関係回避・忌避意図</div>
                        <div className="text-lg font-black text-amber-600 mt-0.5">
                          {currentCase.result.subtextAnalysis.avoidanceIntent}
                          <span className="text-xs text-zinc-400 font-normal">/100</span>
                        </div>
                      </div>
                      <div className="bg-white rounded-xl p-3 border border-zinc-200 text-center">
                        <div className="text-[10px] text-zinc-500 font-medium">婉曲性・当てつけ</div>
                        <div className="text-lg font-black text-indigo-600 mt-0.5">
                          {currentCase.result.subtextAnalysis.indirectCriticism}
                          <span className="text-xs text-zinc-400 font-normal">/100</span>
                        </div>
                      </div>
                    </div>

                    {/* Comparison Banner */}
                    <div className="bg-zinc-900 text-white rounded-2xl p-4 border border-zinc-800">
                      <div className="text-xs font-bold text-amber-400 mb-2 flex items-center gap-1.5">
                        <TrendingUp className="w-4 h-4" />
                        <span>推論結果の対比</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="bg-zinc-800/70 p-3 rounded-xl">
                          <div className="text-[10px] text-zinc-400">単一質問皮肉度（従来）</div>
                          <div className="text-xl font-black text-zinc-300 mt-0.5">
                            {currentCase.result.subtextAnalysis.rawSarcasmScore}点
                          </div>
                          <div className="text-[10px] text-zinc-400 mt-1">
                            {currentCase.stage === 3
                              ? "⚠️ 感謝語彙に惑わされ低評価"
                              : "標準判定"}
                          </div>
                        </div>

                        <div className="bg-zinc-800/70 p-3 rounded-xl">
                          <div className="text-[10px] text-zinc-400">本音・建前の乖離度 (Gap)</div>
                          <div className="text-xl font-black text-amber-400 mt-0.5">
                            {currentCase.result.subtextAnalysis.tatemaeHonneGap}点
                          </div>
                          <div className="text-[10px] text-zinc-400 mt-1">
                            {currentCase.result.subtextAnalysis.tatemaeHonneGap >= 60
                              ? "⚡️ 表面と内心の乖離を検出"
                              : "言行一致"}
                          </div>
                        </div>

                        <div className="bg-amber-950/40 border border-amber-500/50 p-3 rounded-xl">
                          <div className="text-[10px] text-amber-300 font-bold">
                            4要素合成皮肉度 (Composite)
                          </div>
                          <div className="text-xl font-black text-amber-300 mt-0.5">
                            {currentCase.result.subtextAnalysis.compositeSarcasmScore}点
                          </div>
                          <div className="text-[10px] text-amber-200 mt-1 font-semibold">
                            {currentCase.result.subtextAnalysis.verdictBadge}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : null}
          </div>

          {/* Footer */}
          <div className="bg-zinc-50 px-4 sm:px-6 py-3 border-t border-zinc-200 flex items-center justify-between">
            <span className="text-[11px] text-zinc-500 font-mono">
              TypeSafe Jev System One · Multi-attribute Compositional Sarcasm Benchmark
            </span>
            <button
              type="button"
              onClick={onClose}
              className="text-xs font-semibold px-4 py-1.5 rounded-xl bg-zinc-900 text-white hover:bg-zinc-800 transition-colors"
            >
              閉じる
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
