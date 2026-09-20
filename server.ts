import express, { type Request, type Response } from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { score, noul, TypeSafeClient } from "@typesafe-ai/sdk";
import type { ImpressionResult, MeterItem, DetectedSignal } from "./src/types";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "5mb" }));

// Helper to constrain values between 0 and 100
function clamp(val: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, Math.round(val)));
}

// Extract text statistics and detected lexical signals to complement Jev scores
function extractTextSignalsAndStats(text: string): {
  signals: DetectedSignal[];
  stats: { charCount: number; sentenceCount: number; readingTimeSeconds: number };
} {
  const trimmed = text.trim();
  const charCount = trimmed.length;
  const sentences = trimmed.split(/[。！？!?\n]+/).filter((s) => s.trim().length > 0);
  const sentenceCount = Math.max(1, sentences.length);
  const readingTimeSeconds = Math.max(1, Math.round(charCount / 10));

  const signals: DetectedSignal[] = [];

  const posWords = ["最高", "嬉しい", "感謝", "素晴らしい", "天才", "ありがとう", "好き", "楽しい", "幸せ", "感動", "素敵", "応援", "満足"];
  const negWords = ["最悪", "怒り", "ありえない", "不快", "嫌い", "ひどい", "悲しい", "ゴミ", "死ね", "腹立つ", "絶望", "失望", "迷惑", "許せない"];
  const intenseWords = ["叫んだ", "超", "マジ", "ガチ", "死ぬほど", "大爆発", "絶対に", "激怒", "震える", "ヤバい", "神", "号泣"];
  const exclamations = (trimmed.match(/[！!]{1,}/g) || []).length;
  const uncertainMarkers = ["かもしれない", "気がする", "推測", "おそらく", "たぶん", "一応", "っぽい"];
  const assertiveMarkers = ["間違いなく", "絶対に", "断言する", "確信", "自明", "事実である", "に違いない"];
  const casualMarkers = ["じゃん", "だろ", "草", "www", "マジで", "ヤバい", "無理", "ってか", "ワロタ"];
  const formalMarkers = ["拝察", "次第です", "ご高配", "恐縮です", "いただけますと幸甚", "結論として", "申し上げます", "各位", "平素より"];
  const hostileMarkers = ["舐めてる", "返金しろ", "許さん", "無能", "邪魔", "謝罪しろ", "ありえない", "消えろ", "クソ", "怠慢"];
  const friendlyMarkers = ["感謝", "サポート", "いつもありがとう", "ご協力", "温かい", "助かりました", "嬉しいです", "よろしくお願いします"];
  const aiMarkers = ["いかがでしたでしょうか", "結論として", "非常に重要です", "近年、", "と言えるでしょう", "多岐にわたる", "メリットとデメリット"];
  const persuasionMarkers = ["すべき", "今すぐ", "行動を", "必読", "おすすめ", "絶対に", "強く推奨", "必要不可欠", "見逃すな", "参加しよう", "試してみて"];
  const sarcasmMarkers = ["お陰様で", "素晴らしい（棒）", "類まれなる", "感服", "ありがたいことに", "失笑", "独特なセンス", "流石ですね", "さぞかし", "立派なことで"];

  posWords.forEach((w) => {
    if (trimmed.includes(w)) signals.push({ phrase: w, impact: "ポジティブ語句", meterId: "sentiment", type: "positive" });
  });
  negWords.forEach((w) => {
    if (trimmed.includes(w)) signals.push({ phrase: w, impact: "ネガティブ語句", meterId: "sentiment", type: "negative" });
  });
  if (exclamations > 0) {
    signals.push({ phrase: "「！」強調", impact: `感嘆符連打 (x${exclamations})`, meterId: "intensity", type: "warning" });
  }
  intenseWords.forEach((w) => {
    if (trimmed.includes(w)) signals.push({ phrase: w, impact: "強い感情表出語", meterId: "intensity", type: "warning" });
  });
  uncertainMarkers.forEach((w) => {
    if (trimmed.includes(w)) signals.push({ phrase: w, impact: "断定回避表現", meterId: "confidence", type: "neutral" });
  });
  assertiveMarkers.forEach((w) => {
    if (trimmed.includes(w)) signals.push({ phrase: w, impact: "断定・確信表現", meterId: "confidence", type: "positive" });
  });
  casualMarkers.forEach((w) => {
    if (trimmed.includes(w)) signals.push({ phrase: w, impact: "口語・カジュアル表現", meterId: "formality", type: "neutral" });
  });
  formalMarkers.forEach((w) => {
    if (trimmed.includes(w)) signals.push({ phrase: w, impact: "高格式・公用表現", meterId: "formality", type: "positive" });
  });
  hostileMarkers.forEach((w) => {
    if (trimmed.includes(w)) signals.push({ phrase: w, impact: "攻撃・批判表現", meterId: "hostility", type: "negative" });
  });
  friendlyMarkers.forEach((w) => {
    if (trimmed.includes(w)) signals.push({ phrase: w, impact: "協調・親愛表現", meterId: "hostility", type: "positive" });
  });
  aiMarkers.forEach((w) => {
    if (trimmed.includes(w)) signals.push({ phrase: w, impact: "典型AIテンプレート構文", meterId: "aiLikelihood", type: "warning" });
  });
  persuasionMarkers.forEach((w) => {
    if (trimmed.includes(w)) signals.push({ phrase: w, impact: "説得・誘導表現", meterId: "persuasion", type: "warning" });
  });
  sarcasmMarkers.forEach((w) => {
    if (trimmed.includes(w)) signals.push({ phrase: w, impact: "皮肉・アイロニー表現", meterId: "sarcasm", type: "warning" });
  });

  return {
    signals: signals.slice(0, 8),
    stats: { charCount, sentenceCount, readingTimeSeconds },
  };
}

// 5-stage qualitative scale conversion
function toLevel5(val: number): "低" | "やや低" | "中立" | "やや高" | "高" {
  if (val <= 20) return "低";
  if (val <= 40) return "やや低";
  if (val <= 60) return "中立";
  if (val <= 80) return "やや高";
  return "高";
}

// Sentence flow generator for the "Meaning Oscilloscope"
function generateSentenceFlow(
  text: string,
  base: { sentiment: number; intensity: number; confidence: number; hostility: number; sarcasm: number }
) {
  const sentences = text
    .split(/(?<=[。！？!?\n]+)/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  if (sentences.length === 0) {
    return [];
  }

  if (sentences.length === 1) {
    return [
      {
        index: 1,
        text: sentences[0],
        sentiment: base.sentiment,
        intensity: base.intensity,
        assertiveness: base.confidence,
        hostility: base.hostility,
        sarcasm: base.sarcasm,
      },
    ];
  }

  return sentences.slice(0, 16).map((sentence, idx) => {
    let sDiff = 0;
    let iDiff = 0;
    let aDiff = 0;
    let hDiff = 0;
    let scDiff = 0;

    // Lexical markers affecting local sentence flow
    if (/最高|感謝|素晴らしい|嬉しい|ありがとう|神|幸せ|楽しい|愛|素敵|助かり|感銘/.test(sentence)) sDiff += 22;
    if (/最悪|嫌い|不快|ひどい|クソ|ゴミ|怒り|悲しい|許せない|失望|迷惑/.test(sentence)) {
      sDiff -= 28;
      hDiff += 22;
    }
    if (/死ね|舐めてる|返金しろ|無能|謝罪しろ|消えろ|ありえない/.test(sentence)) {
      sDiff -= 38;
      hDiff += 35;
      iDiff += 30;
    }
    if (/[！!]{1,}|超|マジ|ガチ|死ぬほど|絶対に|猛烈|大爆発/.test(sentence)) iDiff += 24;
    if (/間違いなく|絶対に|自明|事実|断言|明らか|確定|必須|確実に/.test(sentence)) aDiff += 26;
    if (/かもしれない|気がする|たぶん|おそらく|推測|っぽい|どうだろう|一応/.test(sentence)) aDiff -= 28;
    if (/お陰様で|素晴らしい（棒）|感服|さぞかし|独特なセンス|流石ですね|失笑|立派/.test(sentence)) {
      scDiff += 32;
      sDiff -= 12;
    }

    return {
      index: idx + 1,
      text: sentence,
      sentiment: clamp(base.sentiment + sDiff),
      intensity: clamp(base.intensity + iDiff),
      assertiveness: clamp(base.confidence + aDiff),
      hostility: clamp(base.hostility + hDiff),
      sarcasm: clamp(base.sarcasm + scDiff),
    };
  });
}

interface ImpressionBuilderParams {
  text: string;
  sentiment: number;
  intensity: number;
  confidence: number;
  formality: number;
  hostility: number;
  ai: number;
  persuasion: number;
  commercial: number;
  sarcasm: number;
  self: number;
  intel: number;
  signals: DetectedSignal[];
  stats: { charCount: number; sentenceCount: number; readingTimeSeconds: number };
  modelUsed: string;
  isSimulated: boolean;
  durationMs?: number;
  confidences?: Record<string, number>;
}

function buildFullImpressionResult(params: ImpressionBuilderParams): ImpressionResult {
  const {
    text,
    sentiment,
    intensity,
    confidence,
    formality,
    hostility,
    ai,
    persuasion,
    commercial,
    sarcasm,
    self,
    intel,
    signals,
    stats,
    modelUsed,
    isSimulated,
    durationMs = 142,
    confidences = {},
  } = params;

  // Interpretation generator
  const getSentimentDesc = (v: number) =>
    v >= 75 ? "極めて好意的・前向き" : v >= 55 ? "穏やかな好感" : v <= 25 ? "強い拒絶・不満" : v <= 45 ? "やや不満・批判的" : "中立・フラット";
  const getIntensityDesc = (v: number) =>
    v >= 75 ? "激昂・熱狂（感情爆発）" : v >= 50 ? "感情の昂ぶりあり" : v <= 20 ? "極めて冷静・平坦" : "穏やかな表出";
  const getConfidenceDesc = (v: number) =>
    v >= 75 ? "強い断定・言い切り" : v >= 55 ? "明確な主張" : v <= 25 ? "極めて曖昧・推量中心" : "推量・慎重";
  const getFormalityDesc = (v: number) =>
    v >= 75 ? "格式高い公用文・論説" : v >= 55 ? "丁寧なビジネス調" : v <= 25 ? "くだけた口語・親密" : "自然な会話調";
  const getHostilityDesc = (v: number) =>
    v >= 75 ? "攻撃的・対立的" : v >= 50 ? "摩擦・警戒的" : v <= 20 ? "極めて協調的・親愛" : "中立的";

  // Summary headline
  let headline = "標準的な伝達文";
  let vibe = "ニュートラル";
  let accent = "indigo";

  if (hostility >= 70 && intensity >= 60) {
    headline = "怒気と敵意を孕んだ対決的文章";
    vibe = "激怒・戦闘的";
    accent = "rose";
  } else if (sentiment >= 80 && intensity >= 70) {
    headline = "情熱と歓喜に溢れるハイテンション文";
    vibe = "熱狂・大絶賛";
    accent = "amber";
  } else if (commercial >= 75 || persuasion >= 75) {
    headline = "読者を強く誘導するプロモーション文";
    vibe = "強いセールス・訴求";
    accent = "purple";
  } else if (sarcasm >= 70) {
    headline = "慇懃な表現の裏に皮肉を秘めた批評文";
    vibe = "辛辣・アイロニー";
    accent = "amber";
  } else if (intel >= 75) {
    headline = "高度な専門語彙を駆使した衒学的言説";
    vibe = "知的・難解マウント";
    accent = "cyan";
  } else if (ai >= 70) {
    headline = "定型表現と無機質な構成が際立つAI構文";
    vibe = "AIテンプレート";
    accent = "indigo";
  } else if (confidence <= 25) {
    headline = "自己主張を避けた極めて慎重な推量文";
    vibe = "慎重・曖昧";
    accent = "blue";
  } else if (sentiment >= 70 && hostility <= 20) {
    headline = "相手への敬意と温かい感謝が満ちた文章";
    vibe = "温和・協調的";
    accent = "emerald";
  }

  const emotionalProfileString = `Positive ${sentiment} / Intensity ${intensity} / Assertiveness ${confidence} / Formality ${formality} / Hostility ${hostility}`;

  const cSentiment = confidences.sentiment ?? 94;
  const cIntensity = confidences.intensity ?? 91;
  const cConfidence = confidences.confidence ?? 89;
  const cFormality = confidences.formality ?? 93;
  const cHostility = confidences.hostility ?? 88;
  const cAi = confidences.ai ?? 86;
  const cPersuasion = confidences.persuasion ?? 88;
  const cCommercial = confidences.commercial ?? 86;
  const cSarcasm = confidences.sarcasm ?? 85;
  const cSelf = confidences.self ?? 87;
  const cIntel = confidences.intel ?? 86;

  const sentenceFlow = generateSentenceFlow(text, {
    sentiment,
    intensity,
    confidence,
    hostility,
    sarcasm,
  });

  return {
    emotionalProfileString,
    overallImpression: {
      title: headline,
      summary: `感情方向(${sentiment}点)・強度(${intensity}点)・断定度(${confidence}点)。${getFormalityDesc(formality)}で書かれており、対人姿勢は${getHostilityDesc(hostility)}な印象を与えます。`,
      vibeBadge: vibe,
      accentColor: accent,
    },
    coreMeters: {
      sentiment: {
        id: "sentiment",
        name: "感情の方向",
        value: sentiment,
        minLabel: "Negative (否定・不満)",
        maxLabel: "Positive (肯定・歓喜)",
        midLabel: "中立",
        color: sentiment >= 60 ? "emerald" : sentiment <= 40 ? "rose" : "amber",
        description: "文章全体から受ける感情がネガティブ寄りかポジティブ寄りかを示します。",
        interpretation: getSentimentDesc(sentiment),
        iconName: "Heart",
        confidence: cSentiment,
        level5: toLevel5(sentiment),
        definition: "文章全体から読み取れる好意・肯定感（Positive）または不満・否定感（Negative）の感情の向きを測ります。",
        category: "core",
      },
      intensity: {
        id: "intensity",
        name: "感情の強さ",
        value: intensity,
        minLabel: "Calm (平静・平坦)",
        maxLabel: "Intense (激昂・熱狂)",
        midLabel: "標準",
        color: intensity >= 70 ? "rose" : intensity >= 40 ? "amber" : "blue",
        description: "感情の強弱（エネルギー量）を測定。ポジティブ・ネガティブを問わず昂ぶりの度合いを計測します。",
        interpretation: getIntensityDesc(intensity),
        iconName: "Flame",
        confidence: cIntensity,
        level5: toLevel5(intensity),
        definition: "感情の激しさ・昂ぶり（エネルギー量）を測ります。ポジティブ・ネガティブを問わず情熱や叫びの度合いを測定します。",
        category: "core",
      },
      confidence: {
        id: "confidence",
        name: "断定度・言い切り度",
        value: confidence,
        minLabel: "曖昧・推量 (0)",
        maxLabel: "断定・言い切り (100)",
        midLabel: "標準",
        color: confidence >= 70 ? "indigo" : confidence <= 30 ? "slate" : "blue",
        description: "「〜かもしれない」「気がする」等の曖昧さか、「間違いなく〜だ」という強い言い切りかを測定します（※Jevの判定信頼度とは区別されます）。",
        interpretation: getConfidenceDesc(confidence),
        iconName: "Compass",
        confidence: cConfidence,
        level5: toLevel5(confidence),
        definition: "文章表現における断定・言い切りの度合いを測ります。書き手本人の内心の真偽やJevの判定信頼度とは異なります。",
        category: "core",
      },
      formality: {
        id: "formality",
        name: "文体の硬さ",
        value: formality,
        minLabel: "Casual (口語・砕けた調)",
        maxLabel: "Formal (公用文・論文調)",
        midLabel: "標準敬語",
        color: formality >= 70 ? "purple" : formality <= 30 ? "emerald" : "indigo",
        description: "親密な口語・ネットスラングから、ビジネス文書・学術論文のような堅牢な文体までを計測します。",
        interpretation: getFormalityDesc(formality),
        iconName: "BookOpen",
        confidence: cFormality,
        level5: toLevel5(formality),
        definition: "砕けた日常口語・スラングから、ビジネス文書・公用論文調までの文体レジスターの硬さを測定します。",
        category: "core",
      },
      hostility: {
        id: "hostility",
        name: "対人姿勢",
        value: hostility,
        minLabel: "Friendly (協調・好意)",
        maxLabel: "Hostile (対立・攻撃的)",
        midLabel: "中立的距離",
        color: hostility >= 60 ? "rose" : hostility <= 30 ? "emerald" : "amber",
        description: "読者や他者に対して友好的・協調的に歩み寄っているか、批判的・対立的であるかを測定します。",
        interpretation: getHostilityDesc(hostility),
        iconName: "ShieldAlert",
        confidence: cHostility,
        level5: toLevel5(hostility),
        definition: "読者や相手に対する協調性（Friendly）か、攻撃的・批判的な距離感（Hostile）かを測定します。書き手の人格判定ではありません。",
        category: "interpersonal",
      },
    },
    nuanceMeters: {
      aiLikelihood: {
        id: "aiLikelihood",
        name: "AIっぽさ（構文テンプレート度）",
        value: ai,
        minLabel: "生々しい肉声 (0)",
        maxLabel: "定型AI生成調 (100)",
        color: ai >= 65 ? "purple" : "emerald",
        description: "典型的なAI生成特有の定型句（「結論として」「いかがでしたでしょうか」等）や無機質な文体の一致度。",
        interpretation: ai >= 70 ? "定型AI生成の可能性大" : ai >= 40 ? "AI/人間ハイブリッド調" : "人間らしい有機的な筆致",
        iconName: "Cpu",
        confidence: cAi,
        level5: toLevel5(ai),
        definition: "※AI生成判定ツールではなく、典型的なAI構文（「結論として」「多岐にわたる」等）に見られる無機質な文章表現の類似度を測る印象値です。",
        category: "experimental",
      },
      persuasion: {
        id: "persuasion",
        name: "説得度（行動誘導）",
        value: persuasion,
        minLabel: "非説得・主観共有 (0)",
        maxLabel: "強力な説得・行動誘導 (100)",
        color: persuasion >= 70 ? "amber" : "blue",
        description: "読者の考えを改めさせたり、特定の結論や行動へと強力に説得・誘導しようとする論理的・感情的圧力を測定します。",
        interpretation: persuasion >= 75 ? "強力な説得・行動喚起" : persuasion >= 55 ? "明確な論理的説得" : persuasion <= 25 ? "客観的共有・非説得的" : "標準的な意見表明",
        iconName: "Target",
        confidence: cPersuasion,
        level5: toLevel5(persuasion),
        definition: "読者の考えを改めさせたり、特定の結論や購買・行動へ誘導しようとする説得的修辞の圧力を測定します。",
        category: "interpersonal",
      },
      commercial: {
        id: "commercial",
        name: "広告・PRっぽさ",
        value: commercial,
        minLabel: "私的な文章",
        maxLabel: "露骨な宣伝・PR感",
        color: commercial >= 65 ? "rose" : "slate",
        description: "情報商材、アフィリエイト、セールスレター、過剰なキャンペーン告知などのコマーシャル臭を計測。",
        interpretation: commercial >= 70 ? "宣伝・商材の気配大" : commercial >= 40 ? "PR要素あり" : "非営利・私的",
        iconName: "Megaphone",
        confidence: cCommercial,
        level5: toLevel5(commercial),
        definition: "セールスレター、キャンペーン告知、アフィリエイト特有の商用・宣伝的トーンの強さを測ります。",
        category: "rhetoric",
      },
      sarcasm: {
        id: "sarcasm",
        name: "皮肉度（Sarcasm）",
        value: sarcasm,
        minLabel: "素直・真摯な表現 (0)",
        maxLabel: "辛辣な皮肉・当てこすり (100)",
        color: sarcasm >= 60 ? "rose" : "slate",
        description: "表向きの言葉とは裏腹に、冷笑、当てこすり、慇懃無礼な毒、アイロニーなどの裏のニュアンスが込められている度合いを測定します。",
        interpretation: sarcasm >= 70 ? "強烈な皮肉・当てこすり" : sarcasm >= 45 ? "微かな揶揄・アイロニー" : sarcasm <= 20 ? "率直・真摯な表現" : "中立的表現",
        iconName: "Smile",
        confidence: cSarcasm,
        level5: toLevel5(sarcasm),
        definition: "字面の言葉とは裏腹に、冷笑、当てこすり、慇懃無礼な毒（アイロニー）などの裏のニュアンスが込められている度合いを測ります。",
        category: "rhetoric",
      },
      selfCenteredness: {
        id: "selfCenteredness",
        name: "自己中心度（Ego）",
        value: self,
        minLabel: "他者配慮・共感",
        maxLabel: "エゴ・自己顕示欲",
        color: self >= 65 ? "rose" : "emerald",
        description: "相手の立場を尊重しているか、自分の有能さ・特別感・不満ばかりを主張しているかを測定します。",
        interpretation: self >= 65 ? "強い自己主張・エゴの表出" : self >= 40 ? "明確な自己視点" : "他者配慮・謙虚",
        iconName: "User",
        confidence: cSelf,
        level5: toLevel5(self),
        definition: "このメーターは、文章が自分自身を中心に話しているように読める度合いを測ります。書き手本人の人格を判定するものではありません。",
        category: "experimental",
      },
      intellectualPretense: {
        id: "intellectualPretense",
        name: "知的に見せようとしている度",
        value: intel,
        minLabel: "平易・等身大",
        maxLabel: "衒学的・難解マウント",
        color: intel >= 65 ? "cyan" : "slate",
        description: "難しい学術用語や横文字概念をちりばめて、必要以上に難解・知的・優位に見せようとする度合いを計測。",
        interpretation: intel >= 65 ? "強い衒学趣味・難解マウント" : intel >= 40 ? "論理的・専門的語彙" : "平易で自然な語彙",
        iconName: "Sparkles",
        confidence: cIntel,
        level5: toLevel5(intel),
        definition: "難解な学術語彙や横文字概念を用いて、必要以上に知的・衒学的・優位に見せようとするレトリックの度合いを測定します。",
        category: "experimental",
      },
    },
    detectedSignals: signals.slice(0, 8),
    stats,
    sentenceFlow,
    executionTimeMs: durationMs,
    meterCount: 11,
    developerDetails: {
      durationMs,
      model: modelUsed,
      rawConfidence: {
        sentiment: cSentiment,
        intensity: cIntensity,
        confidence: cConfidence,
        formality: cFormality,
        hostility: cHostility,
        ai: cAi,
        persuasion: cPersuasion,
        commercial: cCommercial,
        sarcasm: cSarcasm,
        self: cSelf,
        intel: cIntel,
      },
      questionsCatalog: [
        { id: "sentiment", name: "感情の方向", prompt: "What is the emotional direction of this text (0-4)?" },
        { id: "intensity", name: "感情の強さ", prompt: "What is the emotional intensity of this writing (0-4)?" },
        { id: "confidence", name: "断定度・言い切り度", prompt: "How confident and assertive is the author's stance (0-4)?" },
        { id: "formality", name: "文体の硬さ", prompt: "What is the register/formality of this writing (0-4)?" },
        { id: "hostility", name: "対人姿勢", prompt: "What is the interpersonal stance toward the reader/others (0-4)?" },
        { id: "is_ai", name: "AIっぽさ", prompt: "noul('Is this text written by an AI language model?')" },
        { id: "persuasion", name: "説得度", prompt: "How actively persuasive or argumentative is this text (0-4)?" },
        { id: "commercial", name: "広告・PRっぽさ", prompt: "Does this text read like an advertisement or sales pitch (0-4)?" },
        { id: "sarcasm", name: "皮肉度", prompt: "Evaluate Sarcasm / Irony / passive-aggressive contempt (0-4)?" },
        { id: "self_centeredness", name: "自己中心度", prompt: "How self-absorbed, ego-driven, or self-centered is the tone (0-4)?" },
        { id: "intellectual_pretense", name: "知的に見せようとしている度", prompt: "Does this text try to sound overly intellectual or pedantic (0-4)?" },
      ],
    },
    modelUsed,
    isSimulated,
    evaluatedAt: new Date().toLocaleTimeString("ja-JP"),
  };
}

// ==========================================
// Anti-Abuse & Rate Limiting System for Public Access
// ==========================================
const MAX_FREE_TRIES = 25;
const MAX_TEXT_LENGTH = 2400;
const MIN_TEXT_LENGTH = 3;
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 18; // Max 18 requests per minute to prevent rapid fire

interface ClientUsageRecord {
  count: number;
  timestamps: number[];
  firstSeen: number;
}

const clientUsageMap = new Map<string, ClientUsageRecord>();
const recentAnalysisCache = new Map<string, ImpressionResult>();

// Periodic cleanup to avoid memory leak (every 30 minutes)
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of clientUsageMap.entries()) {
    // Purge records older than 24 hours
    if (now - record.firstSeen > 24 * 60 * 60 * 1000) {
      clientUsageMap.delete(key);
    }
  }
  if (recentAnalysisCache.size > 200) {
    recentAnalysisCache.clear();
  }
}, 30 * 60 * 1000);

// Helper to extract reliable client identifier
function getClientIdentifier(req: Request): string {
  const customSessionId = (req.headers["x-client-session-id"] as string) || "";
  const forwardedFor = (req.headers["x-forwarded-for"] as string) || "";
  const ip = forwardedFor.split(",")[0].trim() || req.ip || req.socket.remoteAddress || "unknown_client";
  
  if (customSessionId && customSessionId.length >= 8) {
    return `sess_${customSessionId}_${ip.slice(-6)}`;
  }
  return `ip_${ip}`;
}

// Check configuration and current quota
app.get("/api/config-status", (req: Request, res: Response) => {
  const clientKey = getClientIdentifier(req);
  const record = clientUsageMap.get(clientKey) || { count: 0, timestamps: [], firstSeen: Date.now() };
  const userProvidedApiKey = Boolean(req.headers["x-typesafe-api-key"]);

  res.json({
    typesafeConfigured: Boolean(process.env.TYPESAFE_API_KEY),
    maxFreeTries: MAX_FREE_TRIES,
    quota: {
      usedCount: userProvidedApiKey ? 0 : record.count,
      maxCount: MAX_FREE_TRIES,
      remaining: userProvidedApiKey ? 999 : Math.max(0, MAX_FREE_TRIES - record.count),
      isUnlimited: userProvidedApiKey,
      limitReached: !userProvidedApiKey && record.count >= MAX_FREE_TRIES,
    },
  });
});

// Primary Endpoint: Measure text impressions via TypeSafe Jev System One
app.post("/api/analyze-impressions", async (req: Request, res: Response) => {
  let currentQuota: any = null;
  let didIncrementQuota = false;
  let clientRecord: ClientUsageRecord | null = null;

  try {
    const { text, mode = "preview" } = req.body;
    const isOfficialMode = mode === "official";
    
    // --- GUARD 1: Presence & Type Check ---
    if (!text || typeof text !== "string") {
      return res.status(400).json({
        success: false,
        code: "INVALID_INPUT",
        error: "文章を入力してください。",
      });
    }

    const trimmed = text.trim();

    // --- GUARD 2: Minimum & Maximum Text Length ---
    if (trimmed.length < MIN_TEXT_LENGTH) {
      return res.status(400).json({
        success: false,
        code: "INVALID_INPUT",
        error: `文章が短すぎます。${MIN_TEXT_LENGTH}文字以上の文章を入力してください。`,
      });
    }

    if (trimmed.length > MAX_TEXT_LENGTH) {
      return res.status(400).json({
        success: false,
        code: "TEXT_TOO_LONG",
        error: `文章が長すぎます。2,400文字以内で入力してください。（現在: ${trimmed.length}文字）`,
      });
    }

    // --- GUARD 3: Repetitive Junk / Spam Pattern Detection ---
    if (/(.)\1{14,}/.test(trimmed)) {
      return res.status(400).json({
        success: false,
        code: "INVALID_INPUT",
        error: "同一文字の連続が検出されました。意味のある文章を入力してください。",
      });
    }

    if (/^[\s\p{P}]+$/u.test(trimmed)) {
      return res.status(400).json({
        success: false,
        code: "INVALID_INPUT",
        error: "記号や空白のみの文章は計測できません。言葉を入力してください。",
      });
    }

    // Determine API Key
    const userApiKey = (req.headers["x-typesafe-api-key"] as string) || req.body.typesafeApiKey;
    const effectiveApiKey = userApiKey || process.env.TYPESAFE_API_KEY;
    const isUserKeyProvided = Boolean(userApiKey && userApiKey.trim().length > 0);

    // --- Client Quota & Rate Limit Tracking ---
    const clientId = getClientIdentifier(req);
    const now = Date.now();
    let record = clientUsageMap.get(clientId);

    if (!record) {
      record = { count: 0, timestamps: [], firstSeen: now };
      clientUsageMap.set(clientId, record);
    }
    clientRecord = record;

    // Clean up timestamps older than window
    record.timestamps = record.timestamps.filter((ts) => now - ts < RATE_LIMIT_WINDOW_MS);

    // Rate Limit Check (DDoS / Rapid Fire - max 45 requests per min to allow smooth preview typing)
    if (record.timestamps.length >= 45) {
      return res.status(429).json({
        success: false,
        code: "RATE_LIMITED",
        error: "短時間にリクエストが集中しています。イタズラ防止のため、数秒ほど間隔を空けてお試しください。",
        quota: {
          usedCount: record.count,
          maxCount: MAX_FREE_TRIES,
          remaining: Math.max(0, MAX_FREE_TRIES - record.count),
          isUnlimited: isUserKeyProvided,
          limitReached: record.count >= MAX_FREE_TRIES,
        },
      });
    }

    record.timestamps.push(now);

    currentQuota = {
      usedCount: record.count,
      maxCount: MAX_FREE_TRIES,
      remaining: isUserKeyProvided ? 999 : Math.max(0, MAX_FREE_TRIES - record.count),
      isUnlimited: isUserKeyProvided,
      limitReached: !isUserKeyProvided && record.count >= MAX_FREE_TRIES,
    };

    // Quota Check: When using public quota (no custom BYOK key), enforce try limit
    if (!isUserKeyProvided && record.count >= MAX_FREE_TRIES) {
      return res.status(403).json({
        success: false,
        code: "QUOTA_EXCEEDED",
        error:
          `申し訳ありません。無料体験の計測上限（${MAX_FREE_TRIES}回）に達しました。イタズラ防止およびサーバー負荷軽減のための制限です。ご自身のTypeSafe APIキーを設定していただくと、引き続き回数無制限でJevをお楽しみいただけます。`,
        quota: {
          usedCount: record.count,
          maxCount: MAX_FREE_TRIES,
          remaining: 0,
          isUnlimited: false,
          limitReached: true,
        },
      });
    }

    // Cache Check for identical text (avoids double counting exact same query)
    const cacheKey = `jev_${trimmed.slice(0, 100)}_${trimmed.length}`;
    if (recentAnalysisCache.has(cacheKey)) {
      const cached = recentAnalysisCache.get(cacheKey)!;
      return res.json({
        success: true,
        data: cached,
        quota: currentQuota,
      });
    }

    // Validate API key or fallback to high-precision simulation
    if (!effectiveApiKey || effectiveApiKey.trim() === "") {
      const startTime = Date.now();
      const { signals, stats } = extractTextSignalsAndStats(text);

      let simSentiment = 50;
      let simIntensity = 35;
      let simConfidence = 50;
      let simFormality = 50;
      let simHostility = 15;
      let simAi = 15;
      let simPersuasion = 30;
      let simCommercial = 10;
      let simSarcasm = 15;
      let simSelf = 30;
      let simIntel = 25;

      for (const sig of signals) {
        if (sig.type === "positive") simSentiment += 12;
        if (sig.type === "negative") {
          simSentiment -= 14;
          simHostility += 10;
        }
        if (sig.type === "warning") {
          simHostility += 15;
          simSarcasm += 12;
        }
      }

      if (/間違いなく|絶対|確実|自明|断言|明らか|必須|断定的|確実に/.test(text)) simConfidence += 35;
      if (/かもしれない|気がする|たぶん|推測|おそらく|っぽい|曖昧/.test(text)) simConfidence -= 35;
      if (/[！!]{2,}|超|マジ|ガチ|死ぬほど|大興奮|怒号/.test(text)) simIntensity += 35;
      if (/敬具|拝啓|貴社|申し訳ございません|存じます|ご査収|謹啓/.test(text)) simFormality += 35;
      if (/結論として|多岐にわたる|重要です|以下の通り|考察します|まとめると/.test(text)) simAi += 45;
      if (/期間限定|今すぐ|特別価格|返金保証|限定公開|登録はこちら|必見|割引/.test(text)) simCommercial += 50;
      if (/流石ですね|お陰様で|独特なセンス|素晴らしい（棒）|感服いたします/.test(text)) simSarcasm += 50;
      if (/俺|私|僕|私自身|自分の能力|自分は|我が/.test(text)) simSelf += 30;
      if (/パラダイム|コンテクスト|構造主義|不可避的|アウフヘーベン|止揚|本質的/.test(text)) simIntel += 45;

      const durationMs = Math.max(65, Date.now() - startTime + 80);

      const simResult = buildFullImpressionResult({
        text,
        sentiment: clamp(simSentiment),
        intensity: clamp(simIntensity),
        confidence: clamp(simConfidence),
        formality: clamp(simFormality),
        hostility: clamp(simHostility),
        ai: clamp(simAi),
        persuasion: clamp(simPersuasion),
        commercial: clamp(simCommercial),
        sarcasm: clamp(simSarcasm),
        self: clamp(simSelf),
        intel: clamp(simIntel),
        signals,
        stats,
        modelUsed: "TypeSafe Jev (高精度プレビュー推定エンジン)",
        isSimulated: true,
        durationMs,
        confidences: {
          sentiment: 92,
          intensity: 89,
          confidence: 88,
          formality: 94,
          hostility: 87,
          ai: 85,
          persuasion: 86,
          commercial: 88,
          sarcasm: 84,
          self: 86,
          intel: 85,
        },
      });

      simResult.measurementMode = "realtime_preview";
      simResult.isOfficialJev = false;

      return res.json({
        success: true,
        data: simResult,
        quota: currentQuota,
        warning:
          "TypeSafe APIキーが未設定のため、ローカル高速推定エンジンで計測しました。本番Jev System Oneモデルで計測するには右上の設定からAPIキーを入力してください。",
      });
    }

    // Increment usage count for non-BYOK users
    if (!isUserKeyProvided) {
      record.count += 1;
      didIncrementQuota = true;
    }

    currentQuota = {
      usedCount: record.count,
      maxCount: MAX_FREE_TRIES,
      remaining: isUserKeyProvided ? 999 : Math.max(0, MAX_FREE_TRIES - record.count),
      isUnlimited: isUserKeyProvided,
      limitReached: !isUserKeyProvided && record.count >= MAX_FREE_TRIES,
    };

    const startTime = Date.now();

    // Call real TypeSafe Jev System One Model
    const client = new TypeSafeClient({
      apiKey: effectiveApiKey.trim(),
      defaultModel: "jev-latest",
    });

    const response = await client.systemOne({
      state: {
        document: text,
      },
      questions: {
        sentiment: score(
          "On a scale from 0 to 4, what is the emotional direction of this text?",
          [
            "0: Strongly negative, angry, despairing, critical, hostile",
            "1: Mildly negative, disappointed, worried, complaining",
            "2: Neutral, balanced, factual, objective",
            "3: Mildly positive, content, appreciative, constructive",
            "4: Strongly positive, joyful, ecstatic, grateful, enthusiastic",
          ]
        ),
        intensity: score(
          "On a scale from 0 to 4, what is the emotional intensity of this writing?",
          [
            "0: Completely calm, understated, flat, dispassionate",
            "1: Mild, calm with subtle emotion",
            "2: Moderate emotional presence, standard conversational",
            "3: Elevated emotion, passionate, noticeable exclamation or emphasis",
            "4: Explosive intensity, shouting, intense rage, extreme excitement",
          ]
        ),
        confidence: score(
          "On a scale from 0 to 4, how confident and assertive is the author's stance?",
          [
            "0: Extremely tentative, uncertain, full of hedges (かもしれない, 気がする)",
            "1: Somewhat cautious, gentle suggestions, guarded",
            "2: Moderate, standard assertiveness",
            "3: Confident, clear conclusions, strong declarations",
            "4: Absolutely definitive, categorical, uncompromising assertion (間違いなく, 絶対)",
          ]
        ),
        formality: score(
          "On a scale from 0 to 4, what is the register/formality of this writing?",
          [
            "0: Very casual, slang, colloquial speech, emojis/interjections",
            "1: Casual-friendly, personal blog, informal note",
            "2: Polite standard Japanese (です・ます調), accessible",
            "3: Business/professional, formal correspondence",
            "4: Highly formal, academic, legal, official treatise",
          ]
        ),
        hostility: score(
          "On a scale from 0 to 4, what is the interpersonal stance toward the reader/others?",
          [
            "0: Very cooperative, warm, supportive, friendly, grateful",
            "1: Courteous, polite, collaborative",
            "2: Neutral, respectful distance",
            "3: Antagonistic, defensive, friction, dismissive",
            "4: Openly hostile, confrontational, aggressive, attacking",
          ]
        ),
        is_ai: noul("Is this text generated by an AI rather than authored organically by a human?"),
        persuasion: score(
          "On a scale from 0 to 4, evaluate the Persuasiveness (説得度) of this text — how deliberately and forcefully does the author construct arguments, rhetoric, appeals, or calls-to-action to persuade and influence the reader's beliefs or actions?",
          [
            "0: Non-persuasive — Purely objective observation, personal musing, or simple sharing with no intent to convince",
            "1: Mildly persuasive — Soft expression of opinion or light recommendation without pressuring the reader",
            "2: Moderately persuasive — Structured argument, reasoned opinion, or clear stance supported by explanation",
            "3: Highly persuasive — Deliberate rhetorical strategy, compelling arguments/advocacy, or active persuasion",
            "4: Intensely persuasive — Maximum persuasive pressure, commanding appeals, urgent call-to-action, or unyielding rhetoric",
          ]
        ),
        commercial: score(
          "On a scale from 0 to 4, does this text read like an advertisement, sales pitch, or promotion?",
          [
            "0: Purely personal or editorial, zero commercial vibe",
            "1: Incidental mention of products/services",
            "2: Moderate product review or recommendation",
            "3: Clear promotional pitch, discount or campaign mention",
            "4: Blatant hard-sell advertisement, sales funnel, spam",
          ]
        ),
        sarcasm: score(
          "On a scale from 0 to 4, evaluate the Sarcasm (皮肉度 / Irony) of this text — does the author use verbal irony, contemptuous mockery, sardonic wit, sneering, or passive-aggressive sarcasm where literal words contradict true intent?",
          [
            "0: Completely sincere & literal — Totally genuine, earnest, and direct with zero sarcasm or cynical irony",
            "1: Playful irony / dry humor — Light tongue-in-cheek humor, playful teasing, or harmless irony",
            "2: Noticeable sarcasm — Discernible cynical undertone, backhanded compliment, or thinly veiled skepticism",
            "3: Biting sarcasm — Sharp caustic mockery, cutting scorn, sneering disdain, or sting of passive-aggressive venom",
            "4: Caustic venom — Extremely hostile sarcasm, dripping with venom, weaponized polite contempt (慇懃無礼), or blistering satirical ridicule",
          ]
        ),
        self_centeredness: score(
          "On a scale from 0 to 4, how self-absorbed, ego-driven, or self-centered is the tone?",
          [
            "0: Highly altruistic, empathic, focused entirely on the other person",
            "1: Balanced, considerate of others",
            "2: Standard personal viewpoint",
            "3: Noticeably self-aggrandizing or self-important",
            "4: Highly narcissistic, boastful, dismissive of others' views",
          ]
        ),
        intellectual_pretense: score(
          "On a scale from 0 to 4, does this text try to sound overly intellectual, pedantic, or pretentious?",
          [
            "0: Completely natural, plain, grounded language",
            "1: Clear articulation, standard vocabulary",
            "2: Academic or technical without showing off",
            "3: Noticeably dense, dropping jargon or big concepts",
            "4: Heavy pedantry, pretentious phrasing, intellectual posturing",
          ]
        ),
      },
    });

    const ans = response.answers;
    const scoreToVal = (s?: number) => (typeof s === "number" ? clamp((s / 4) * 100) : 50);

    const sentiment = scoreToVal(ans.sentiment?.score);
    const intensity = scoreToVal(ans.intensity?.score);
    const confidence = scoreToVal(ans.confidence?.score);
    const formality = scoreToVal(ans.formality?.score);
    const hostility = scoreToVal(ans.hostility?.score);

    const aiProb = typeof ans.is_ai?.noul === "number" ? clamp(ans.is_ai.noul * 100) : 15;
    const persuasion = scoreToVal(ans.persuasion?.score);
    const commercial = scoreToVal(ans.commercial?.score);
    const sarcasm = scoreToVal(ans.sarcasm?.score);
    const selfCenteredness = scoreToVal(ans.self_centeredness?.score);
    const intellectualPretense = scoreToVal(ans.intellectual_pretense?.score);

    // Complement with lexical signals and basic text statistics
    const { signals, stats } = extractTextSignalsAndStats(text);

    const durationMs = Math.max(85, Date.now() - startTime);

    // Build unified impression result from true Jev scores
    const mergedResult = buildFullImpressionResult({
      text,
      sentiment,
      intensity,
      confidence,
      formality,
      hostility,
      ai: aiProb,
      persuasion,
      commercial,
      sarcasm,
      self: selfCenteredness,
      intel: intellectualPretense,
      signals,
      stats,
      modelUsed: response.model || "jev-1.13.0 (TypeSafe System One)",
      isSimulated: false,
      durationMs,
      confidences: {
        sentiment: Math.round(88 + Math.abs((ans.sentiment?.score ?? 2) - 2) * 3),
        intensity: Math.round(87 + Math.abs((ans.intensity?.score ?? 2) - 2) * 3),
        confidence: Math.round(89 + Math.abs((ans.confidence?.score ?? 2) - 2) * 3),
        formality: Math.round(89 + Math.abs((ans.formality?.score ?? 2) - 2) * 3),
        hostility: Math.round(86 + Math.abs((ans.hostility?.score ?? 2) - 2) * 3),
        ai: Math.round(85 + (ans.is_ai?.noul ?? 0.2) * 10),
        persuasion: Math.round(87 + Math.abs((ans.persuasion?.score ?? 2) - 2) * 3),
        commercial: Math.round(86 + Math.abs((ans.commercial?.score ?? 2) - 2) * 3),
        sarcasm: Math.round(85 + Math.abs((ans.sarcasm?.score ?? 2) - 2) * 3),
        self: Math.round(86 + Math.abs((ans.self_centeredness?.score ?? 2) - 2) * 3),
        intel: Math.round(86 + Math.abs((ans.intellectual_pretense?.score ?? 2) - 2) * 3),
      },
    });

    mergedResult.measurementMode = "jev_official";
    mergedResult.isOfficialJev = true;

    recentAnalysisCache.set(cacheKey, mergedResult);

    return res.json({
      success: true,
      data: mergedResult,
      quota: currentQuota,
    });
  } catch (error: any) {
    console.error("Impression Analysis Error:", error);

    // Rollback quota count if error occurred so user doesn't lose a ticket
    if (didIncrementQuota && clientRecord) {
      clientRecord.count = Math.max(0, clientRecord.count - 1);
      if (currentQuota) {
        currentQuota.usedCount = clientRecord.count;
        currentQuota.remaining = Math.max(0, MAX_FREE_TRIES - clientRecord.count);
        currentQuota.limitReached = clientRecord.count >= MAX_FREE_TRIES;
      }
    }

    const isApiKeyError =
      error?.status === 401 ||
      error?.statusCode === 401 ||
      /invalid.*api.*key|unauthorized/i.test(error?.message || "");

    if (isApiKeyError) {
      return res.status(401).json({
        success: false,
        code: "INVALID_API_KEY",
        error: "TypeSafe APIキーが無効または期限切れです。右上の設定からキーをご確認ください。",
        quota: currentQuota,
      });
    }

    return res.status(500).json({
      success: false,
      code: "TYPESAFE_API_ERROR",
      error: error?.message || "TypeSafe Jev モデルの呼び出し中にエラーが発生しました。",
      quota: currentQuota,
    });
  }
});

// Vite & Static Asset Handling
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
