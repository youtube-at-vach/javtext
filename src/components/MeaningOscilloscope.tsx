import React, { useState, useMemo } from "react";
import { motion } from "motion/react";
import {
  Activity,
  Zap,
  TrendingUp,
  Info,
  Maximize2,
  Filter,
  Eye,
  Layers,
} from "lucide-react";
import { SentenceFlowPoint } from "../types";

interface MeaningOscilloscopeProps {
  sentenceFlow?: SentenceFlowPoint[];
  title?: string;
  isCompact?: boolean;
}

type ChannelKey = "sentiment" | "intensity" | "assertiveness" | "hostility" | "sarcasm";

interface ChannelConfig {
  key: ChannelKey;
  label: string;
  subLabel: string;
  color: string;
  stroke: string;
  fill: string;
  defaultOn: boolean;
}

const CHANNELS: ChannelConfig[] = [
  {
    key: "assertiveness",
    label: "断定度 (Assertiveness)",
    subLabel: "言い切りの強さ",
    color: "text-indigo-600 bg-indigo-50 border-indigo-200",
    stroke: "#4f46e5",
    fill: "rgba(79, 70, 229, 0.15)",
    defaultOn: true,
  },
  {
    key: "sentiment",
    label: "感情方向 (Positive/Neg)",
    subLabel: "好意・快・不快",
    color: "text-emerald-600 bg-emerald-50 border-emerald-200",
    stroke: "#059669",
    fill: "rgba(5, 150, 105, 0.12)",
    defaultOn: true,
  },
  {
    key: "intensity",
    label: "感情強度 (Intensity)",
    subLabel: "テンション・興奮度",
    color: "text-amber-600 bg-amber-50 border-amber-200",
    stroke: "#d97706",
    fill: "rgba(217, 119, 6, 0.12)",
    defaultOn: true,
  },
  {
    key: "hostility",
    label: "対人敵意 (Hostility)",
    subLabel: "攻撃性・刺々しさ",
    color: "text-rose-600 bg-rose-50 border-rose-200",
    stroke: "#e11d48",
    fill: "rgba(225, 29, 72, 0.12)",
    defaultOn: false,
  },
  {
    key: "sarcasm",
    label: "皮肉度 (Sarcasm)",
    subLabel: "当てこすり・アイロニー",
    color: "text-purple-600 bg-purple-50 border-purple-200",
    stroke: "#9333ea",
    fill: "rgba(147, 51, 234, 0.12)",
    defaultOn: false,
  },
];

export function MeaningOscilloscope({
  sentenceFlow = [],
  title = "文章内の意味オシロスコープ（文ごとの感情・断定推移）",
  isCompact = false,
}: MeaningOscilloscopeProps) {
  const [activeChannels, setActiveChannels] = useState<Record<ChannelKey, boolean>>({
    assertiveness: true,
    sentiment: true,
    intensity: true,
    hostility: false,
    sarcasm: false,
  });

  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const toggleChannel = (key: ChannelKey) => {
    setActiveChannels((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const points = sentenceFlow;
  const count = points.length;

  // Compute graph geometry
  const width = 800;
  const height = isCompact ? 220 : 260;
  const padding = { top: 25, right: 35, bottom: 40, left: 45 };

  const graphWidth = width - padding.left - padding.right;
  const graphHeight = height - padding.top - padding.bottom;

  // Helpers to convert value to x, y
  const getX = (index: number) => {
    if (count <= 1) return padding.left + graphWidth / 2;
    return padding.left + (index / (count - 1)) * graphWidth;
  };

  const getY = (val: number) => {
    const clamped = Math.max(0, Math.min(100, val));
    return padding.top + (1 - clamped / 100) * graphHeight;
  };

  // Generate SVG path for a channel
  const makePath = (key: ChannelKey) => {
    if (count === 0) return "";
    return points
      .map((pt, i) => {
        const x = getX(i);
        const y = getY(pt[key]);
        return `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
      })
      .join(" ");
  };

  // Generate area fill path
  const makeAreaPath = (key: ChannelKey) => {
    if (count === 0) return "";
    const line = points
      .map((pt, i) => {
        const x = getX(i);
        const y = getY(pt[key]);
        return `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
      })
      .join(" ");

    const lastX = getX(count - 1);
    const firstX = getX(0);
    const baseY = getY(0);

    return `${line} L ${lastX.toFixed(1)} ${baseY.toFixed(1)} L ${firstX.toFixed(1)} ${baseY.toFixed(1)} Z`;
  };

  // Calculate high-level summary metrics
  const stats = useMemo(() => {
    if (count === 0) return { peakAssertiveness: 0, peakSentence: "", volatility: "穏やか" };
    let maxAssert = -1;
    let maxPt = points[0];

    for (const pt of points) {
      if (pt.assertiveness > maxAssert) {
        maxAssert = pt.assertiveness;
        maxPt = pt;
      }
    }

    // Volatility measure based on diffs
    let totalDelta = 0;
    for (let i = 1; i < count; i++) {
      totalDelta += Math.abs(points[i].sentiment - points[i - 1].sentiment);
      totalDelta += Math.abs(points[i].assertiveness - points[i - 1].assertiveness);
    }
    const avgDelta = count > 1 ? totalDelta / (count - 1) : 0;
    const volatility = avgDelta > 45 ? "激しい起伏" : avgDelta > 20 ? "中程度の推移" : "安定的";

    return {
      peakAssertiveness: maxAssert,
      peakSentence: maxPt?.text || "",
      volatility,
    };
  }, [points, count]);

  if (count === 0) {
    return (
      <div className="bg-white rounded-2xl border border-zinc-200 p-6 text-center shadow-2xs">
        <Activity className="w-8 h-8 text-zinc-300 mx-auto mb-2" />
        <p className="text-sm font-medium text-zinc-600">
          文章が入力されると、文ごとの波形オシロスコープが展開されます。
        </p>
      </div>
    );
  }

  const activeHoverPoint = hoveredIndex !== null ? points[hoveredIndex] : null;

  return (
    <div className="bg-white rounded-2xl border border-zinc-200 p-4 sm:p-5 shadow-2xs space-y-3">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2 border-b border-zinc-100">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600">
              <Activity className="w-3.5 h-3.5" />
            </div>
            <h3 className="text-sm font-bold text-zinc-900 tracking-tight flex items-center gap-1.5">
              <span>{title}</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-zinc-100 text-zinc-600 border border-zinc-200">
                {count} 文検出
              </span>
            </h3>
          </div>
          <p className="text-xs text-zinc-500 mt-0.5">
            文章の冒頭から結びにかけて、感情や断定度（言い切り度）がどう変化したかを時間軸（波形）で可視化します。
          </p>
        </div>

        {/* Quick summary stats chips */}
        <div className="flex items-center gap-2 text-[11px] shrink-0">
          <span className="bg-zinc-50 border border-zinc-200 text-zinc-700 px-2 py-0.5 rounded-md font-mono">
            推移特性: <strong>{stats.volatility}</strong>
          </span>
          <span className="bg-indigo-50 border border-indigo-200 text-indigo-800 px-2 py-0.5 rounded-md font-mono">
            最大断定度: <strong>{stats.peakAssertiveness}</strong>
          </span>
        </div>
      </div>

      {/* Channel toggles */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
        <span className="text-zinc-400 text-[11px] font-medium flex items-center gap-1 shrink-0">
          <Layers className="w-3 h-3" />
          <span>表示チャンネル:</span>
        </span>
        {CHANNELS.map((ch) => {
          const isOn = activeChannels[ch.key];
          return (
            <button
              key={ch.key}
              type="button"
              onClick={() => toggleChannel(ch.key)}
              className={`px-2.5 py-1 rounded-lg border text-xs font-semibold transition-all flex items-center gap-1.5 shrink-0 ${
                isOn
                  ? `${ch.color} shadow-2xs font-bold`
                  : "bg-zinc-50 text-zinc-400 border-zinc-200 hover:bg-zinc-100"
              }`}
            >
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: isOn ? ch.stroke : "#a1a1aa" }}
              />
              <span>{ch.label}</span>
            </button>
          );
        })}
      </div>

      {/* Oscilloscope Viewport */}
      <div className="relative bg-zinc-950 rounded-xl p-2.5 border border-zinc-800 overflow-hidden shadow-inner">
        {/* CRT Scanline / grid overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px] opacity-40 pointer-events-none" />

        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto overflow-visible select-none"
        >
          {/* Horizontal Level Grid Lines (0, 25, 50, 75, 100) */}
          {[0, 25, 50, 75, 100].map((lvl) => {
            const y = getY(lvl);
            const isCenter = lvl === 50;
            return (
              <g key={lvl}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={width - padding.right}
                  y2={y}
                  stroke={isCenter ? "#334155" : "#1e293b"}
                  strokeWidth={isCenter ? "1.5" : "1"}
                  strokeDasharray={isCenter ? undefined : "3,3"}
                />
                <text
                  x={padding.left - 8}
                  y={y}
                  textAnchor="end"
                  dominantBaseline="central"
                  className="text-[9px] font-mono fill-zinc-500 font-semibold"
                >
                  {lvl}
                </text>
              </g>
            );
          })}

          {/* Vertical sentence markers */}
          {points.map((_, i) => {
            const x = getX(i);
            const isHovered = hoveredIndex === i;
            return (
              <g key={i}>
                <line
                  x1={x}
                  y1={padding.top}
                  x2={x}
                  y2={height - padding.bottom}
                  stroke={isHovered ? "#6366f1" : "#1e293b"}
                  strokeWidth={isHovered ? "1.5" : "1"}
                  strokeDasharray="2,2"
                />
                <text
                  x={x}
                  y={height - padding.bottom + 14}
                  textAnchor="middle"
                  className={`text-[10px] font-mono ${
                    isHovered ? "fill-indigo-400 font-bold" : "fill-zinc-500"
                  }`}
                >
                  第{i + 1}文
                </text>
              </g>
            );
          })}

          {/* Render Area & Line Waves for Active Channels */}
          {CHANNELS.map((ch) => {
            if (!activeChannels[ch.key]) return null;
            return (
              <g key={`channel-${ch.key}`}>
                {/* Area fill */}
                <path d={makeAreaPath(ch.key)} fill={ch.fill} className="transition-all duration-300" />
                {/* Wave line */}
                <path
                  d={makePath(ch.key)}
                  fill="none"
                  stroke={ch.stroke}
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="transition-all duration-300"
                />
                {/* Data point dots */}
                {points.map((pt, i) => {
                  const x = getX(i);
                  const y = getY(pt[ch.key]);
                  const isHovered = hoveredIndex === i;
                  return (
                    <circle
                      key={i}
                      cx={x}
                      cy={y}
                      r={isHovered ? 5 : 3.5}
                      fill="#09090b"
                      stroke={ch.stroke}
                      strokeWidth={isHovered ? 2.5 : 1.5}
                      className="transition-all duration-200 cursor-pointer"
                    />
                  );
                })}
              </g>
            );
          })}

          {/* Interactive invisible hover hitboxes for each sentence column */}
          {points.map((_, i) => {
            const x = getX(i);
            const colWidth = count > 1 ? graphWidth / (count - 1) : graphWidth;
            return (
              <rect
                key={`hitbox-${i}`}
                x={x - colWidth / 2}
                y={padding.top}
                width={colWidth}
                height={graphHeight}
                fill="transparent"
                className="cursor-pointer"
                onMouseEnter={() => setHoveredIndex(i)}
                onMouseLeave={() => setHoveredIndex(null)}
              />
            );
          })}
        </svg>

        {/* Oscilloscope Status Light */}
        <div className="absolute top-2.5 right-3 flex items-center gap-1.5 text-[9px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800/80 px-2 py-0.5 rounded-full">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>LIVE OSCILLOSCOPE</span>
        </div>
      </div>

      {/* Sentence Inspection HUD: shows when hovered or defaults to sentence 1 */}
      {activeHoverPoint ? (
        <motion.div
          key={activeHoverPoint.index}
          initial={{ opacity: 0, y: 3 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3 bg-zinc-50 border border-indigo-200/90 rounded-xl shadow-2xs space-y-1.5"
        >
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-indigo-950 flex items-center gap-1">
              <Eye className="w-3.5 h-3.5 text-indigo-600" />
              <span>第 {activeHoverPoint.index} 文のリアルタイム測定値</span>
            </span>
            <span className="text-[11px] font-mono text-zinc-500">
              文字数: {activeHoverPoint.text.length} 文字
            </span>
          </div>

          <p className="text-xs text-zinc-800 font-medium bg-white p-2 rounded-lg border border-zinc-200/80 shadow-2xs">
            「{activeHoverPoint.text}」
          </p>

          {/* Metrics grid for this sentence */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 pt-1 text-[11px] font-mono">
            <div className="bg-white border border-zinc-200 rounded p-1 text-center">
              <span className="text-zinc-500 text-[10px] block">断定度</span>
              <strong className="text-indigo-600">{activeHoverPoint.assertiveness}</strong>
            </div>
            <div className="bg-white border border-zinc-200 rounded p-1 text-center">
              <span className="text-zinc-500 text-[10px] block">感情方向</span>
              <strong className="text-emerald-600">{activeHoverPoint.sentiment}</strong>
            </div>
            <div className="bg-white border border-zinc-200 rounded p-1 text-center">
              <span className="text-zinc-500 text-[10px] block">感情強度</span>
              <strong className="text-amber-600">{activeHoverPoint.intensity}</strong>
            </div>
            <div className="bg-white border border-zinc-200 rounded p-1 text-center">
              <span className="text-zinc-500 text-[10px] block">対人敵意</span>
              <strong className="text-rose-600">{activeHoverPoint.hostility}</strong>
            </div>
            <div className="bg-white border border-zinc-200 rounded p-1 text-center">
              <span className="text-zinc-500 text-[10px] block">皮肉度</span>
              <strong className="text-purple-600">{activeHoverPoint.sarcasm}</strong>
            </div>
          </div>
        </motion.div>
      ) : (
        <div className="text-center py-2 text-xs text-zinc-400">
          ※上の波形グラフの任意のポイントにマウスを乗せると、該当文の詳細な測定値がここに表示されます。
        </div>
      )}
    </div>
  );
}
