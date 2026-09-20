import { useMemo } from "react";
import { MeterItem } from "../types";

interface ImpressionRadarProps {
  meters: {
    sentiment: MeterItem;
    intensity: MeterItem;
    confidence: MeterItem;
    formality: MeterItem;
    hostility: MeterItem;
  };
  comparisonMeters?: {
    sentiment: MeterItem;
    intensity: MeterItem;
    confidence: MeterItem;
    formality: MeterItem;
    hostility: MeterItem;
  };
  labelA?: string;
  labelB?: string;
}

export function ImpressionRadar({
  meters,
  comparisonMeters,
  labelA = "文章A",
  labelB = "文章B",
}: ImpressionRadarProps) {
  const size = 260;
  const center = size / 2;
  const radius = size * 0.38;

  const axes = useMemo(
    () => [
      { key: "sentiment", label: "Positive", value: meters.sentiment.value, desc: "感情方向" },
      { key: "intensity", label: "Intensity", value: meters.intensity.value, desc: "感情強度" },
      { key: "confidence", label: "Assertiveness", value: meters.confidence.value, desc: "断定度" },
      { key: "formality", label: "Formality", value: meters.formality.value, desc: "文体硬度" },
      { key: "hostility", label: "Hostility", value: meters.hostility.value, desc: "対人敵意" },
    ],
    [meters]
  );

  const totalAxes = axes.length;
  const angleSlice = (Math.PI * 2) / totalAxes;

  // Compute polygon points for active meters
  const polygonPoints = useMemo(() => {
    return axes
      .map((axis, i) => {
        const angle = i * angleSlice - Math.PI / 2;
        const normalizedVal = Math.max(0.05, axis.value / 100);
        const r = radius * normalizedVal;
        const x = center + r * Math.cos(angle);
        const y = center + r * Math.sin(angle);
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(" ");
  }, [axes, radius, center, angleSlice]);

  // Compute comparison polygon points if provided
  const comparisonPolygonPoints = useMemo(() => {
    if (!comparisonMeters) return null;
    const compAxes = [
      comparisonMeters.sentiment.value,
      comparisonMeters.intensity.value,
      comparisonMeters.confidence.value,
      comparisonMeters.formality.value,
      comparisonMeters.hostility.value,
    ];
    return compAxes
      .map((val, i) => {
        const angle = i * angleSlice - Math.PI / 2;
        const normalizedVal = Math.max(0.05, val / 100);
        const r = radius * normalizedVal;
        const x = center + r * Math.cos(angle);
        const y = center + r * Math.sin(angle);
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(" ");
  }, [comparisonMeters, radius, center, angleSlice]);

  // Compute background grid concentric polygons (at 25%, 50%, 75%, 100%)
  const gridLevels = [0.25, 0.5, 0.75, 1.0];

  return (
    <div className="bg-white rounded-2xl border border-zinc-200 p-4 flex flex-col items-center justify-center shadow-2xs">
      <div className="text-center mb-1 w-full flex items-center justify-between">
        <div>
          <h4 className="text-xs font-bold text-zinc-800 uppercase tracking-wider text-left">
            Impression Radar
          </h4>
          <p className="text-[10px] text-zinc-400 text-left">5次元バランス比較</p>
        </div>

        {comparisonMeters && (
          <div className="flex items-center gap-2 text-[10px] font-semibold">
            <span className="inline-flex items-center gap-1 text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200">
              <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
              <span>{labelA}</span>
            </span>
            <span className="inline-flex items-center gap-1 text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
              <span>{labelB}</span>
            </span>
          </div>
        )}
      </div>

      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="overflow-visible max-w-full h-auto"
      >
        {/* Background concentric level polygons */}
        {gridLevels.map((lvl) => {
          const pts = Array.from({ length: totalAxes })
            .map((_, i) => {
              const angle = i * angleSlice - Math.PI / 2;
              const r = radius * lvl;
              const x = center + r * Math.cos(angle);
              const y = center + r * Math.sin(angle);
              return `${x.toFixed(1)},${y.toFixed(1)}`;
            })
            .join(" ");

          return (
            <polygon
              key={lvl}
              points={pts}
              fill="none"
              stroke="#e4e4e7"
              strokeDasharray={lvl < 1 ? "2,2" : undefined}
              strokeWidth="1"
            />
          );
        })}

        {/* Radial spoke lines */}
        {axes.map((_, i) => {
          const angle = i * angleSlice - Math.PI / 2;
          const x = center + radius * Math.cos(angle);
          const y = center + radius * Math.sin(angle);
          return (
            <line
              key={i}
              x1={center}
              y1={center}
              x2={x}
              y2={y}
              stroke="#e4e4e7"
              strokeWidth="1"
            />
          );
        })}

        {/* Comparison Polygon B if present */}
        {comparisonPolygonPoints && (
          <polygon
            points={comparisonPolygonPoints}
            fill="rgba(245, 158, 11, 0.15)"
            stroke="#f59e0b"
            strokeWidth="2"
            strokeDasharray="4,2"
            className="transition-all duration-500 ease-out"
          />
        )}

        {/* Primary Data Polygon A */}
        <polygon
          points={polygonPoints}
          fill="rgba(99, 102, 241, 0.2)"
          stroke="#4f46e5"
          strokeWidth="2.5"
          className="transition-all duration-500 ease-out"
        />

        {/* Data points & labels */}
        {axes.map((axis, i) => {
          const angle = i * angleSlice - Math.PI / 2;
          const normalizedVal = Math.max(0.05, axis.value / 100);
          const r = radius * normalizedVal;
          const x = center + r * Math.cos(angle);
          const y = center + r * Math.sin(angle);

          // Label positions (outside the circle)
          const labelRadius = radius + 22;
          const lx = center + labelRadius * Math.cos(angle);
          const ly = center + labelRadius * Math.sin(angle);

          return (
            <g key={i} className="transition-all duration-500 ease-out">
              {/* Point circle */}
              <circle
                cx={x}
                cy={y}
                r="4"
                fill="#ffffff"
                stroke="#4f46e5"
                strokeWidth="2.5"
              />

              {/* Axis Label */}
              <text
                x={lx}
                y={ly}
                textAnchor="middle"
                dominantBaseline="central"
                className="text-[10px] font-bold fill-zinc-700 tracking-tight select-none"
              >
                {axis.label}
              </text>
              <text
                x={lx}
                y={ly + 10}
                textAnchor="middle"
                dominantBaseline="central"
                className="text-[9px] font-mono font-semibold fill-indigo-600 select-none"
              >
                {axis.value}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
