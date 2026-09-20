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
