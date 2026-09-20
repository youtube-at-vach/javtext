import { Tag, AlertCircle, CheckCircle, Info } from "lucide-react";
import { DetectedSignal } from "../types";

interface SignalHighlightsProps {
  signals: DetectedSignal[];
}

export function SignalHighlights({ signals }: SignalHighlightsProps) {
  if (!signals || signals.length === 0) return null;

  return (
    <div className="bg-white rounded-2xl border border-zinc-200 p-4 sm:p-5 shadow-xs">
      <div className="flex items-center gap-2 mb-3">
        <Tag className="w-4 h-4 text-zinc-600" />
        <h4 className="text-xs font-bold text-zinc-800 uppercase tracking-wider">
          メーターを動かした主な印象シグナル
        </h4>
        <span className="text-[10px] text-zinc-400">（文章から検出された表現）</span>
      </div>

      <div className="flex flex-wrap gap-2">
        {signals.map((sig, idx) => {
          let badgeColor = "bg-zinc-100 text-zinc-700 border-zinc-200";
          let icon = <Info className="w-3 h-3 text-zinc-400" />;

          if (sig.type === "positive") {
            badgeColor = "bg-emerald-50 text-emerald-800 border-emerald-200";
            icon = <CheckCircle className="w-3 h-3 text-emerald-600" />;
          } else if (sig.type === "negative") {
            badgeColor = "bg-rose-50 text-rose-800 border-rose-200";
            icon = <AlertCircle className="w-3 h-3 text-rose-600" />;
          } else if (sig.type === "warning") {
            badgeColor = "bg-amber-50 text-amber-800 border-amber-200";
            icon = <AlertCircle className="w-3 h-3 text-amber-600" />;
          }

          return (
            <div
              key={idx}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-medium transition-all ${badgeColor}`}
            >
              {icon}
              <span className="font-bold underline decoration-current/30">
                "{sig.phrase}"
              </span>
              <span className="text-[10px] opacity-80">
                → {sig.impact}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
