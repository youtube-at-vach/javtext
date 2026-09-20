import React, { useState } from "react";
import { Sparkles, Eye, ShieldAlert, Cpu, Filter } from "lucide-react";
import { MeterItem } from "../types";
import { MeterGauge } from "./MeterGauge";

interface NuanceMetersDeckProps {
  nuanceMeters: {
    aiLikelihood: MeterItem;
    persuasion: MeterItem;
    commercial: MeterItem;
    sarcasm: MeterItem;
    selfCenteredness: MeterItem;
    intellectualPretense: MeterItem;
  };
  animationKey?: string | number;
}

export function NuanceMetersDeck({ nuanceMeters, animationKey }: NuanceMetersDeckProps) {
  const [filter, setFilter] = useState<"all" | "rhetoric" | "experimental">("all");

  const allList = [
    nuanceMeters.persuasion,
    nuanceMeters.sarcasm,
    nuanceMeters.commercial,
    nuanceMeters.aiLikelihood,
    nuanceMeters.selfCenteredness,
    nuanceMeters.intellectualPretense,
  ];

  const filteredList = allList.filter((m) => {
    if (filter === "rhetoric") {
      return ["persuasion", "sarcasm", "commercial"].includes(m.id);
    }
    if (filter === "experimental") {
      return ["aiLikelihood", "selfCenteredness", "intellectualPretense"].includes(m.id);
    }
    return true;
  });

  return (
    <div className="bg-white rounded-2xl border border-zinc-200 p-4 sm:p-5 shadow-2xs space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-zinc-100">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-violet-600" />
            <h3 className="text-sm font-bold text-zinc-900 tracking-tight">
              文章のウラ印象メーター（修辞・ニュアンス・実験的指標）
            </h3>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-violet-50 text-violet-700 border border-violet-200">
              6 Dimensions
            </span>
          </div>
          <p className="text-xs text-zinc-500 mt-0.5">
            <strong>説得度</strong>・<strong>皮肉度</strong>をはじめ、文章表現の裏に潜むスタンスやAI構文度をTypeSafe Jevが直接解析します。
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1 bg-zinc-100 p-0.5 rounded-xl text-xs font-semibold self-start sm:self-auto max-w-full overflow-x-auto scrollbar-none">
          <button
            type="button"
            onClick={() => setFilter("all")}
            className={`px-2.5 py-1 rounded-lg transition-all shrink-0 whitespace-nowrap ${
              filter === "all" ? "bg-white text-zinc-900 shadow-2xs font-bold" : "text-zinc-600 hover:text-zinc-900"
            }`}
          >
            すべて (6)
          </button>
          <button
            type="button"
            onClick={() => setFilter("rhetoric")}
            className={`px-2.5 py-1 rounded-lg transition-all shrink-0 whitespace-nowrap ${
              filter === "rhetoric" ? "bg-white text-zinc-900 shadow-2xs font-bold" : "text-zinc-600 hover:text-zinc-900"
            }`}
          >
            修辞・広告・皮肉
          </button>
          <button
            type="button"
            onClick={() => setFilter("experimental")}
            className={`px-2.5 py-1 rounded-lg transition-all shrink-0 whitespace-nowrap ${
              filter === "experimental" ? "bg-white text-zinc-900 shadow-2xs font-bold" : "text-zinc-600 hover:text-zinc-900"
            }`}
          >
            AI構文・自己・衒学
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {filteredList.map((meter) => (
          <MeterGauge
            key={meter.id}
            meter={meter}
            isCompact={false}
            animationKey={animationKey}
          />
        ))}
      </div>
    </div>
  );
}
