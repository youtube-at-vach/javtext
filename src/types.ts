export interface MeterItem {
  id: string;
  name: string;
  value: number; // 0 to 100
  minLabel: string;
  maxLabel: string;
  midLabel?: string;
  color: string; // "emerald" | "rose" | "blue" | "amber" | "indigo" | "purple" | "cyan"
  description: string;
  interpretation: string;
  iconName: string;
  confidence?: number; // Jev System One Model Confidence (e.g. 88%)
  level5?: "低" | "やや低" | "中立" | "やや高" | "高"; // 5-stage human-readable measurement tier
  definition?: string; // Clear definition of what the meter measures
  category?: "core" | "interpersonal" | "rhetoric" | "experimental";
}

export interface DetectedSignal {
  phrase: string;
  impact: string;
  meterId: string;
  type: "positive" | "negative" | "neutral" | "warning";
}

export interface SentenceFlowPoint {
  index: number;
  text: string;
  sentiment: number;
  intensity: number;
  assertiveness: number; // 断定度
  hostility: number;
  sarcasm: number;
}

export interface SynthesisStep {
  stepNumber: number;
  title: string;
  description: string;
  formula?: string;
  calculatedValue?: number;
  unit?: string;
  notes?: string;
}

export interface ElementContribution {
  key: "surfaceCourtesy" | "underlyingGrievance" | "avoidanceIntent" | "indirectCriticism";
  label: string;
  score: number;
  weightPercent: number;
  effectiveContribution: number;
  role: string;
  color: string;
}

export interface SynthesisProcess {
  formulaDisplay: string;
  baseLoad: number;
  gapBonus: number;
  indirectMultiplier: number;
  finalCompositeScore: number;
  steps: SynthesisStep[];
  contributions: ElementContribution[];
  explanationSummary: string;
}

export interface SubtextDecomposition {
  // 4 decomposed atomic scores (0 to 100)
  surfaceCourtesy: number;       // 表面上の丁寧・好意度 (Surface Courtesy)
  underlyingGrievance: number;   // 潜在的不満・失望度 (Underlying Grievance)
  avoidanceIntent: number;       // 関係回避・忌避意図（他手段探索） (Avoidance Intent)
  indirectCriticism: number;     // 婉曲性・当てつけ度 (Indirect Criticism)

  // Synthetic composite metrics
  tatemaeHonneGap: number;       // 本音と建前の乖離度 (0-100)
  rawSarcasmScore: number;       // 単一質問による生Jev皮肉度
  compositeSarcasmScore: number; // 4要素から合成した真意皮肉度

  verdict: "kyoto_passive_aggressive" | "genuine_praise" | "direct_complaint" | "polite_cautious" | "neutral";
  verdictTitle: string;
  verdictBadge: string;
  verdictDescription: string;
  sarcasmBoostReason?: string;
  synthesisProcess?: SynthesisProcess;
}

export interface DeveloperDetails {
  durationMs: number;
  model: string;
  rawConfidence: Record<string, number>;
  questionsCatalog: Array<{ id: string; name: string; prompt: string }>;
}

export interface ImpressionResult {
  emotionalProfileString: string; // e.g. "Positive 72 / Intensity 31 / Assertiveness 88 / Formality 64 / Hostility 12"
  overallImpression: {
    title: string;
    summary: string;
    vibeBadge: string;
    accentColor: string;
  };
  coreMeters: {
    sentiment: MeterItem;
    intensity: MeterItem;
    confidence: MeterItem; // Displayed as 断定度・言い切り度
    formality: MeterItem;
    hostility: MeterItem;
  };
  nuanceMeters: {
    aiLikelihood: MeterItem;
    persuasion: MeterItem;
    commercial: MeterItem;
    sarcasm: MeterItem;
    selfCenteredness: MeterItem;
    intellectualPretense: MeterItem;
  };
  subtextAnalysis?: SubtextDecomposition;
  detectedSignals: DetectedSignal[];
  stats: {
    charCount: number;
    sentenceCount: number;
    readingTimeSeconds: number;
  };
  sentenceFlow?: SentenceFlowPoint[];
  executionTimeMs?: number;
  meterCount?: number;
  developerDetails?: DeveloperDetails;
  modelUsed: string;
  isSimulated: boolean;
  isOfficialJev?: boolean;
  measurementMode?: "realtime_preview" | "jev_official";
  evaluatedAt: string;
}

export interface QuotaInfo {
  usedCount: number;
  maxCount: number;
  remaining: number;
  isUnlimited: boolean;
  limitReached: boolean;
  resetTime?: string;
}

export interface PresetSample {
  id: string;
  title: string;
  category: string;
  description: string;
  text: string;
  targetMeters: string;
}

export interface ABComparisonPreset {
  id: string;
  title: string;
  description: string;
  textA: string;
  labelA: string;
  textB: string;
  labelB: string;
  focalMeter: string;
}

export interface AnalyzeRequest {
  text: string;
  mode?: "preview" | "official";
  typesafeApiKey?: string;
}

export interface AnalyzeResponse {
  success: boolean;
  data?: ImpressionResult;
  quota?: QuotaInfo;
  error?: string;
  code?: "QUOTA_EXCEEDED" | "RATE_LIMITED" | "TEXT_TOO_LONG" | "INVALID_INPUT" | "INVALID_API_KEY" | "SERVER_ERROR";
  warning?: string;
}
