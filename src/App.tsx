import { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "motion/react";
import { Header } from "./components/Header";
import { ApiKeyModal } from "./components/ApiKeyModal";
import { QuotaModal } from "./components/QuotaModal";
import { PresetsBar } from "./components/PresetsBar";
import { MeterGauge } from "./components/MeterGauge";
import { EmotionalProfileCard } from "./components/EmotionalProfileCard";
import { ImpressionRadar } from "./components/ImpressionRadar";
import { NuanceMetersDeck } from "./components/NuanceMetersDeck";
import { SignalHighlights } from "./components/SignalHighlights";
import { MeaningOscilloscope } from "./components/MeaningOscilloscope";
import { ABComparisonView } from "./components/ABComparisonView";
import { DeveloperDetailsDrawer } from "./components/DeveloperDetailsDrawer";
import { PrivacyNotice } from "./components/PrivacyNotice";
import { PRESET_SAMPLES } from "./data/presets";
import { ImpressionResult, PresetSample, QuotaInfo } from "./types";
import {
  Gauge,
  Sparkles,
  Activity,
  Zap,
  RotateCcw,
  Sliders,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Shield,
  Lock,
  ArrowRightLeft,
  Copy,
  Check,
  Share2,
} from "lucide-react";

// Client session UUID generator
function getOrCreateSessionId(): string {
  let sid = localStorage.getItem("jev_session_id");
  if (!sid || sid.length < 10) {
    sid = "sess_" + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
    localStorage.setItem("jev_session_id", sid);
  }
  return sid;
}

export default function App() {
  const [activeTab, setActiveTab] = useState<"single" | "ab_compare">("single");
  const [inputText, setInputText] = useState<string>(PRESET_SAMPLES[0].text);
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(PRESET_SAMPLES[0].id);

  const [typesafeApiKey, setTypesafeApiKey] = useState<string>(() => {
    return localStorage.getItem("typesafe_api_key") || "";
  });

  const [serverConfig, setServerConfig] = useState({
    typesafeConfigured: false,
  });

  const [quota, setQuota] = useState<QuotaInfo | null>(null);
  const [isQuotaModalOpen, setIsQuotaModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isMeasuring, setIsMeasuring] = useState(false);
  const [result, setResult] = useState<ImpressionResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [measureAnimKey, setMeasureAnimKey] = useState<number>(1);
  const [isCopied, setIsCopied] = useState(false);

  const sessionIdRef = useRef<string>(getOrCreateSessionId());

  // Check server configuration & current quota
  const fetchConfigAndQuota = useCallback(() => {
    const headers: Record<string, string> = {
      "x-client-session-id": sessionIdRef.current,
    };
    if (typesafeApiKey) {
      headers["x-typesafe-api-key"] = typesafeApiKey;
    }

    fetch("/api/config-status", { headers })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setServerConfig({
            typesafeConfigured: data.typesafeConfigured,
          });
          if (data.quota) {
            setQuota(data.quota);
          }
        }
      })
      .catch((err) => console.error("Config check failed", err));
  }, [typesafeApiKey]);

  useEffect(() => {
    fetchConfigAndQuota();
  }, [fetchConfigAndQuota]);

  // Save TypeSafe API Key
  const handleSaveApiKey = (key: string) => {
    const trimmed = key.trim();
    setTypesafeApiKey(trimmed);
    if (trimmed) {
      localStorage.setItem("typesafe_api_key", trimmed);
    } else {
      localStorage.removeItem("typesafe_api_key");
    }
    fetchConfigAndQuota();
  };

  // Base API caller
  const callAnalysisApi = async (text: string): Promise<ImpressionResult> => {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "x-client-session-id": sessionIdRef.current,
    };
    if (typesafeApiKey) {
      headers["x-typesafe-api-key"] = typesafeApiKey;
    }

    const res = await fetch("/api/analyze-impressions", {
      method: "POST",
      headers,
      body: JSON.stringify({ text }),
    });

    const data = await res.json();
    if (data.quota) {
      setQuota(data.quota);
    }

    if (!res.ok || !data.success) {
      if (data.code === "QUOTA_EXCEEDED" || res.status === 403) {
        setIsQuotaModalOpen(true);
      } else if (data.code === "INVALID_API_KEY" || res.status === 401) {
        setIsSettingsOpen(true);
      }
      throw new Error(data.error || "Jevによる計測に失敗しました。");
    }

    return data.data;
  };

  // Single Text Measurement
  const measureText = useCallback(
    async (textToAnalyze?: string) => {
      const targetText = typeof textToAnalyze === "string" ? textToAnalyze : inputText;
      const trimmed = targetText.trim();
      if (!trimmed) {
        setResult(null);
        return;
      }

      if (quota && !quota.isUnlimited && quota.limitReached) {
        setIsQuotaModalOpen(true);
        setErrorMsg("無料体験の計測上限（10回）に達しました。右上の設定からAPIキーを設定すると無制限にご利用いただけます。");
        return;
      }

      setIsMeasuring(true);
      setErrorMsg(null);
      setMeasureAnimKey((k) => k + 1);

      try {
        const data = await callAnalysisApi(trimmed);
        setResult(data);
        setMeasureAnimKey((k) => k + 1);
      } catch (err: any) {
        console.error(err);
        setErrorMsg(err.message || "計測中にエラーが発生しました。");
      } finally {
        setIsMeasuring(false);
      }
    },
    [inputText, typesafeApiKey, quota]
  );

  // Initial measure on mount with default preset sample
  useEffect(() => {
    measureText(PRESET_SAMPLES[0].text);
  }, []);

  // Handle comparison run for A/B view
  const handleMeasureComparison = async (textA: string, textB: string) => {
    setIsMeasuring(true);
    setErrorMsg(null);
    try {
      const [resA, resB] = await Promise.all([
        callAnalysisApi(textA.trim()),
        callAnalysisApi(textB.trim()),
      ]);
      return { resultA: resA, resultB: resB };
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "A/B比較の計測中にエラーが発生しました。");
      return null;
    } finally {
      setIsMeasuring(false);
    }
  };

  // Handle text change
  const handleTextChange = (newText: string) => {
    setInputText(newText);
    setSelectedPresetId(null);
  };

  // Handle preset selection
  const handleSelectPreset = (preset: PresetSample) => {
    setSelectedPresetId(preset.id);
    setInputText(preset.text);
    measureText(preset.text);
  };

  // Reset text
  const handleReset = () => {
    setInputText("");
    setSelectedPresetId(null);
    setResult(null);
    setErrorMsg(null);
  };

  // Quick text inject/mutation helpers
  const injectSnippet = (snippet: string) => {
    const updated = inputText ? `${inputText} ${snippet}` : snippet;
    handleTextChange(updated);
  };

  // Shortcut key (Ctrl+Enter / Cmd+Enter)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      if (!isMeasuring && inputText.trim() && !isTextOverLimit) {
        measureText(inputText);
      }
    }
  };

  // Copy report to clipboard
  const handleCopyReport = () => {
    if (!result) return;
    const lines = [
      `【TypeSafe Jev 文章印象測定レポート】`,
      `「${inputText.slice(0, 80)}...」`,
      `----------------------------------------`,
      `【基本印象】${result.overallImpression.title} (${result.overallImpression.summary})`,
      `・感情方向: ${result.coreMeters.sentiment.value}/100 [${result.coreMeters.sentiment.level5}] (信頼度 ${result.coreMeters.sentiment.confidence}%)`,
      `・感情強度: ${result.coreMeters.intensity.value}/100 [${result.coreMeters.intensity.level5}] (信頼度 ${result.coreMeters.intensity.confidence}%)`,
      `・断定度・言い切り: ${result.coreMeters.confidence.value}/100 [${result.coreMeters.confidence.level5}] (信頼度 ${result.coreMeters.confidence.confidence}%)`,
      `・文体硬度: ${result.coreMeters.formality.value}/100 [${result.coreMeters.formality.level5}] (信頼度 ${result.coreMeters.formality.confidence}%)`,
      `・対人敵意: ${result.coreMeters.hostility.value}/100 [${result.coreMeters.hostility.level5}] (信頼度 ${result.coreMeters.hostility.confidence}%)`,
      `【ウラ印象】`,
      `・説得度: ${result.nuanceMeters.persuasion.value}/100 [${result.nuanceMeters.persuasion.level5}]`,
      `・皮肉度: ${result.nuanceMeters.sarcasm.value}/100 [${result.nuanceMeters.sarcasm.level5}]`,
      `・AI構文度: ${result.nuanceMeters.aiLikelihood.value}/100 [${result.nuanceMeters.aiLikelihood.level5}]`,
      `・広告っぽさ: ${result.nuanceMeters.commercial.value}/100 [${result.nuanceMeters.commercial.level5}]`,
      `・自己中心度: ${result.nuanceMeters.selfCenteredness.value}/100 [${result.nuanceMeters.selfCenteredness.level5}]`,
      `・知的に見せたい度: ${result.nuanceMeters.intellectualPretense.value}/100 [${result.nuanceMeters.intellectualPretense.level5}]`,
      `----------------------------------------`,
      `計測モデル: ${result.modelUsed} (${result.developerDetails?.durationMs}ms)`,
    ];

    navigator.clipboard.writeText(lines.join("\n"));
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const isTextOverLimit = inputText.length > 2400;
  const isQuotaReached = Boolean(quota && !quota.isUnlimited && quota.limitReached);

  return (
    <div className="min-h-screen bg-zinc-50/80 text-zinc-900 font-sans flex flex-col">
      {/* Header */}
      <Header
        hasTypeSafeKey={Boolean(typesafeApiKey || serverConfig.typesafeConfigured)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onReset={handleReset}
        isProcessing={isMeasuring}
        quota={quota}
        onOpenQuotaModal={() => setIsQuotaModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 space-y-5">
        {/* Navigation Mode Bar: Single Measurement vs A/B Comparison */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-white border border-zinc-200/90 rounded-2xl p-2 shadow-2xs">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setActiveTab("single")}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 ${
                activeTab === "single"
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100/70"
              }`}
            >
              <Activity className="w-4 h-4" />
              <span>単一文章・オシロスコープ計測</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("ab_compare")}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 relative ${
                activeTab === "ab_compare"
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100/70"
              }`}
            >
              <ArrowRightLeft className="w-4 h-4" />
              <span>A/B 比較モード（変化差分 Delta）</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-amber-400 text-amber-950 font-black">
                NEW
              </span>
            </button>
          </div>

          <div className="flex items-center gap-2 text-xs text-zinc-500 px-2">
            <span className="inline-flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>TypeSafe Jev Engine</span>
            </span>
            <span className="text-zinc-300">|</span>
            <span className="font-mono">
              お試し枠: {quota ? (quota.isUnlimited ? "無制限" : `${quota.remaining}/${quota.maxCount}回`) : "25/25回"}
            </span>
          </div>
        </div>

        {/* Quota limit notice banner if limit reached */}
        {isQuotaReached && (
          <div className="p-4 bg-amber-50 border border-amber-200/90 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-amber-900">
                  無料体験の計測上限（{quota?.maxCount ?? 25}回）に達しました
                </h4>
                <p className="text-[11px] text-amber-700 mt-0.5">
                  イタズラ防止および負荷軽減のための制限です。ご自身のTypeSafe APIキーを設定していただくと、引き続き回数無制限でお楽しみいただけます。
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 self-end sm:self-center">
              <button
                type="button"
                onClick={() => setIsSettingsOpen(true)}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors shadow-2xs"
              >
                APIキーを設定する
              </button>
              <button
                type="button"
                onClick={() => setIsQuotaModalOpen(true)}
                className="px-3 py-1.5 bg-white border border-amber-200 text-amber-800 rounded-xl text-xs font-medium hover:bg-amber-100/60 transition-colors"
              >
                詳細を見る
              </button>
            </div>
          </div>
        )}

        {/* Error notification if any */}
        {errorMsg && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
            <button
              onClick={() => setErrorMsg(null)}
              className="text-xs font-semibold hover:underline"
            >
              閉じる
            </button>
          </div>
        )}

        {/* MODE 1: A/B Comparison Mode */}
        {activeTab === "ab_compare" ? (
          <ABComparisonView
            onMeasure={handleMeasureComparison}
            isMeasuring={isMeasuring}
          />
        ) : (
          /* MODE 2: Single Measurement & Meaning Oscilloscope Mode */
          <div className="space-y-6">
            {/* Preset Sample Bar */}
            <section className="bg-white rounded-2xl border border-zinc-200/90 p-3 sm:p-4 shadow-2xs">
              <PresetsBar
                onSelectPreset={handleSelectPreset}
                selectedId={selectedPresetId}
                disabled={isMeasuring}
              />
            </section>

            {/* Dual-Column Layout: Text Editor (Left) & Impression Deck (Right) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* LEFT COLUMN: Text Input & Instrumentation Controls */}
              <div className="lg:col-span-5 space-y-4">
                <div className="bg-white rounded-2xl border border-zinc-200 p-4 sm:p-5 shadow-xs flex flex-col">
                  <div className="flex items-center justify-between mb-2.5">
                    <div className="flex items-center gap-2">
                      <Gauge className="w-4 h-4 text-indigo-600" />
                      <h2 className="text-sm font-bold text-zinc-900">
                        計測対象の文章
                      </h2>
                    </div>

                    <div className="flex items-center gap-2">
                      {isMeasuring && (
                        <span className="flex items-center gap-1.5 text-[11px] text-indigo-600 font-semibold bg-indigo-50 px-2 py-0.5 rounded-md">
                          <span className="w-2 h-2 rounded-full bg-indigo-600 animate-ping" />
                          <span>Jev解析中...</span>
                        </span>
                      )}
                      <span
                        className={`text-[11px] font-mono ${
                          isTextOverLimit
                            ? "text-rose-600 font-bold"
                            : inputText.length > 2000
                            ? "text-amber-600 font-medium"
                            : "text-zinc-400"
                        }`}
                      >
                        {inputText.length} / 2,400 文字
                      </span>
                    </div>
                  </div>

                  {/* Textarea */}
                  <div className="relative">
                    <textarea
                      value={inputText}
                      onChange={(e) => handleTextChange(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="文章を入力して、下の「Jevで印象を計測する」ボタン（または Ctrl+Enter）を押してください..."
                      rows={8}
                      maxLength={2500}
                      className={`w-full text-xs sm:text-sm text-zinc-800 leading-relaxed p-3.5 rounded-xl border bg-zinc-50/40 focus:bg-white focus:outline-hidden resize-y font-sans transition-colors ${
                        isTextOverLimit
                          ? "border-rose-400 focus:ring-2 focus:ring-rose-500/20"
                          : "border-zinc-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                      }`}
                    />
                  </div>

                  {/* Length Warning */}
                  {isTextOverLimit && (
                    <div className="mt-2 text-[11px] text-rose-600 font-medium flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>イタズラ防止のため、計測は2,400文字までとなります。</span>
                    </div>
                  )}

                  {/* Privacy Notice Right Beneath Input */}
                  <div className="mt-2.5">
                    <PrivacyNotice />
                  </div>

                  {/* Action Button: Dedicated TypeSafe Jev Measure Trigger */}
                  <div className="mt-3 flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        if (isQuotaReached) {
                          setIsQuotaModalOpen(true);
                        } else {
                          measureText(inputText);
                        }
                      }}
                      disabled={isMeasuring || !inputText.trim() || isTextOverLimit}
                      className={`w-full py-3 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all shadow-md flex items-center justify-center gap-2.5 ${
                        isQuotaReached
                          ? "bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300"
                          : "bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-700 hover:from-indigo-700 hover:to-violet-700 text-white shadow-indigo-200"
                      } disabled:opacity-50 active:scale-[0.99]`}
                    >
                      <Sparkles className={`w-4 h-4 ${isMeasuring ? "animate-spin text-white" : "text-amber-300"} shrink-0`} />
                      <span>
                        {isMeasuring
                          ? "TypeSafe Jev に問い合わせ中..."
                          : isQuotaReached
                          ? "上限到達（10回）- 詳しくはこちら"
                          : "⚡️ Jevで印象を計測する (Ctrl+Enter)"}
                      </span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-md font-mono ${
                          isQuotaReached
                            ? "bg-amber-200 text-amber-950"
                            : "bg-white/20 text-white"
                        }`}
                      >
                        {quota?.isUnlimited
                          ? "無制限"
                          : isQuotaReached
                          ? "上限到達"
                          : `残り ${quota ? quota.remaining : 10}回`}
                      </span>
                    </button>
                  </div>

                  {/* Instant Word Mutation Chips */}
                  <div className="mt-4 pt-3 border-t border-zinc-100">
                    <div className="text-[11px] font-bold text-zinc-500 mb-1.5 flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <Sliders className="w-3 h-3 text-zinc-400" />
                        <span>文章にフレーズを追加して試す:</span>
                      </div>
                      <span className="text-[10px] text-zinc-400 font-normal">クリックで文章末尾に追加</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      <button
                        type="button"
                        onClick={() => injectSnippet("間違いなく事実である。絶対だ。")}
                        className="text-[10px] px-2 py-1 rounded bg-zinc-100 hover:bg-zinc-200 text-zinc-700 transition-colors"
                        title="断定度・言い切りを急上昇させる"
                      >
                        +「間違いなく事実である（断定）」
                      </button>
                      <button
                        type="button"
                        onClick={() => injectSnippet("かもしれない気がします…")}
                        className="text-[10px] px-2 py-1 rounded bg-zinc-100 hover:bg-zinc-200 text-zinc-700 transition-colors"
                        title="断定度を下げる（推量）"
                      >
                        +「かもしれない気がします（推量）」
                      </button>
                      <button
                        type="button"
                        onClick={() => injectSnippet("！！！！最高すぎ！！")}
                        className="text-[10px] px-2 py-1 rounded bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-100 transition-colors"
                        title="感情強度とポジティブを急上昇"
                      >
                        +「！！！！最高すぎ」
                      </button>
                      <button
                        type="button"
                        onClick={() => injectSnippet("結論として、共存することが極めて重要であると言えるでしょう。")}
                        className="text-[10px] px-2 py-1 rounded bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-100 transition-colors"
                        title="AI構文度を跳ね上げる"
                      >
                        +「AI定型句（結論として）」
                      </button>
                      <button
                        type="button"
                        onClick={() => injectSnippet("今すぐ限定LINEに登録して月収50万！")}
                        className="text-[10px] px-2 py-1 rounded bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-100 transition-colors"
                        title="広告・PR度を急上昇"
                      >
                        +「広告・セールス煽り」
                      </button>
                      <button
                        type="button"
                        onClick={() => injectSnippet("素晴らしいご対応に心底感服いたしました（笑）")}
                        className="text-[10px] px-2 py-1 rounded bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-colors"
                        title="皮肉度を急上昇"
                      >
                        +「皮肉：感服いたしました（笑）」
                      </button>
                    </div>
                  </div>
                </div>

                {/* Signal Highlights (Reasons why meters moved) */}
                {result && result.detectedSignals.length > 0 && (
                  <SignalHighlights signals={result.detectedSignals} />
                )}

                {/* Developer Technical Telemetry Drawer */}
                {result && (
                  <DeveloperDetailsDrawer
                    details={result.developerDetails}
                    modelUsed={result.modelUsed}
                    isOfficialJev={result.isOfficialJev}
                  />
                )}
              </div>

              {/* RIGHT COLUMN: The Impression Meters & Graphical Deck */}
              <div className="lg:col-span-7 space-y-5">
                {!result ? (
                  <div className="bg-white rounded-2xl border border-dashed border-zinc-300 p-12 text-center text-zinc-400">
                    <Gauge className="w-10 h-10 mx-auto mb-3 text-zinc-300" />
                    <p className="text-sm font-semibold text-zinc-700">
                      文章を入力して「Jevで印象を計測する」をクリック
                    </p>
                    <p className="text-xs text-zinc-400 mt-1 max-w-sm mx-auto">
                      左側に文章を入力するか、上部の「変化を体感できる例文」をクリックすると、TypeSafe Jevが直接解析します。
                    </p>
                  </div>
                ) : (
                  <>
                    {/* 1. Overall Impression Banner & Emotional Profile */}
                    <motion.div
                      key={`summary-bar-${result.overallImpression.title}`}
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                      className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl border shadow-2xs transition-colors duration-500 ${
                        result.coreMeters.sentiment.value >= 55
                          ? "bg-blue-50/40 border-blue-200/90 text-blue-950"
                          : result.coreMeters.sentiment.value <= 45
                          ? "bg-rose-50/40 border-rose-200/90 text-rose-950"
                          : "bg-white border-zinc-200/90 text-zinc-900"
                      }`}
                    >
                      <div className="text-xs flex items-center flex-wrap gap-1.5">
                        <span className="font-bold block sm:inline">
                          計測結果サマリー:
                        </span>
                        {result.coreMeters.sentiment.value >= 55 && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200 shadow-2xs">
                            <Sparkles className="w-3 h-3 text-blue-600" />
                            ポジティブ判定 ({result.coreMeters.sentiment.value})
                          </span>
                        )}
                        {result.coreMeters.sentiment.value <= 45 && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-200 shadow-2xs">
                            <AlertCircle className="w-3 h-3 text-rose-600" />
                            ネガティブ判定 ({result.coreMeters.sentiment.value})
                          </span>
                        )}
                        <span className="text-zinc-600 sm:ml-1">
                          {result.overallImpression.title} — {result.overallImpression.summary}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={handleCopyReport}
                        className="self-start sm:self-auto px-3 py-1.5 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700 text-xs font-semibold flex items-center gap-1.5 transition-colors shrink-0 shadow-2xs"
                      >
                        {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-zinc-400" />}
                        <span>{isCopied ? "コピー完了" : "測定結果をコピー"}</span>
                      </button>
                    </motion.div>

                    <EmotionalProfileCard result={result} />

                    {/* 2. Meaning Oscilloscope (文章内の時系列波形グラフ) */}
                    {result.sentenceFlow && (
                      <MeaningOscilloscope sentenceFlow={result.sentenceFlow} />
                    )}

                    {/* 3. Radar Chart & Core Meters Deck */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-stretch">
                      {/* Visual Polygon Radar */}
                      <div className="md:col-span-5 flex">
                        <div className="w-full">
                          <ImpressionRadar meters={result.coreMeters} />
                        </div>
                      </div>

                      {/* Core 5 Meters List with 5-stage tiers, Jev confidence, and definition info */}
                      <div className="md:col-span-7 space-y-3 flex flex-col justify-between">
                        <MeterGauge meter={result.coreMeters.sentiment} animationKey={measureAnimKey} />
                        <MeterGauge meter={result.coreMeters.intensity} animationKey={measureAnimKey} />
                        <MeterGauge meter={result.coreMeters.confidence} animationKey={measureAnimKey} />
                        <MeterGauge meter={result.coreMeters.formality} animationKey={measureAnimKey} />
                        <MeterGauge meter={result.coreMeters.hostility} animationKey={measureAnimKey} />
                      </div>
                    </div>

                    {/* 4. Nuance Meters (修辞・皮肉・AI構文・広告度などの指標群) */}
                    <NuanceMetersDeck
                      nuanceMeters={result.nuanceMeters}
                      animationKey={measureAnimKey}
                    />

                    {/* Footer Metadata */}
                    <div className="flex items-center justify-between text-[11px] text-zinc-400 px-2 font-mono">
                      <span>Engine: {result.modelUsed}</span>
                      <span>Latency: {result.developerDetails?.durationMs}ms</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Production-Grade Footer with Privacy Policy & Anti-Abuse Statement */}
      <footer className="border-t border-zinc-200 bg-white py-6 mt-12 text-xs text-zinc-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-zinc-900 text-white flex items-center justify-center font-bold text-[10px]">
              Jev
            </div>
            <span className="font-semibold text-zinc-700">
              TypeSafe Jev Impression Studio
            </span>
            <span className="text-zinc-400 text-[11px]">|</span>
            <span className="text-[11px] text-zinc-500">
              文章の印象・ニュアンス・意味オシロスコープ測定器
            </span>
          </div>

          <div className="flex items-center gap-4 text-[11px]">
            <span className="text-zinc-400">
              Powered by TypeSafe Jev System One
            </span>
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="text-indigo-600 hover:underline font-semibold"
            >
              APIキー設定
            </button>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <ApiKeyModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        currentKey={typesafeApiKey}
        onSaveKey={handleSaveApiKey}
        serverHasTypeSafeKey={serverConfig.typesafeConfigured}
      />

      <QuotaModal
        isOpen={isQuotaModalOpen}
        onClose={() => setIsQuotaModalOpen(false)}
        usedCount={quota ? quota.usedCount : 0}
        maxCount={quota ? quota.maxCount : 25}
        onOpenKeySettings={() => {
          setIsQuotaModalOpen(false);
          setIsSettingsOpen(true);
        }}
      />
    </div>
  );
}
