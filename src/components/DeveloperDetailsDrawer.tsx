import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ChevronDown,
  ChevronUp,
  Terminal,
} from "lucide-react";
import { DeveloperDetails } from "../types";

interface DeveloperDetailsDrawerProps {
  details?: DeveloperDetails;
  modelUsed?: string;
  isOfficialJev?: boolean;
}

export function DeveloperDetailsDrawer({
  details,
  modelUsed,
  isOfficialJev = false,
}: DeveloperDetailsDrawerProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (!details) return null;

  const catalog = details.questionsCatalog || [];
  const rawConf = details.rawConfidence || {};

  return (
    <div className="bg-white rounded-2xl border border-zinc-200 shadow-2xs overflow-hidden">
      {/* Toggle button */}
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        className="w-full px-4 py-3 bg-zinc-50/70 hover:bg-zinc-100/70 transition-colors flex items-center justify-between text-xs font-bold text-zinc-700 select-none"
      >
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-zinc-500" />
          <span>開発者向け技術詳細 (TypeSafe Jev System One Telemetry)</span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-zinc-200/80 text-zinc-700">
            {details.durationMs}ms / {catalog.length > 0 ? catalog.length : 11} 軸
          </span>
        </div>

        <div className="flex items-center gap-1 text-zinc-400">
          <span className="text-[11px] font-normal">{isOpen ? "閉じる" : "展開する"}</span>
          {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="p-4 sm:p-5 border-t border-zinc-200 text-xs text-zinc-700 space-y-4"
          >
            {/* Quick stats grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-zinc-800">
              <div className="bg-zinc-50 p-2.5 rounded-xl border border-zinc-200/80">
                <span className="text-[10px] text-zinc-500 block">Jev エンジンモデル</span>
                <strong className="font-mono text-indigo-700 text-xs truncate block">
                  {details.model || modelUsed || "jev-1.13.0"}
                </strong>
              </div>
              <div className="bg-zinc-50 p-2.5 rounded-xl border border-zinc-200/80">
                <span className="text-[10px] text-zinc-500 block">計測レイテンシ</span>
                <strong className="font-mono text-zinc-900 text-xs">
                  {details.durationMs} ms
                </strong>
              </div>
              <div className="bg-zinc-50 p-2.5 rounded-xl border border-zinc-200/80">
                <span className="text-[10px] text-zinc-500 block">評価軸数</span>
                <strong className="font-mono text-zinc-900 text-xs">
                  {catalog.length > 0 ? catalog.length : 11} Dimensions
                </strong>
              </div>
              <div className="bg-zinc-50 p-2.5 rounded-xl border border-zinc-200/80">
                <span className="text-[10px] text-zinc-500 block">計測モード</span>
                <strong className="font-mono text-emerald-700 text-xs">
                  {isOfficialJev ? "Jev Official Engine" : "High-Precision Preview"}
                </strong>
              </div>
            </div>

            {/* Questions Catalog */}
            {catalog.length > 0 && (
              <div className="space-y-1.5">
                <h5 className="font-bold text-zinc-900 text-[11px] uppercase tracking-wider">
                  TypeSafe Jev 単一APIクエリ質問定義（11軸プロンプト）
                </h5>
                <div className="bg-zinc-950 text-zinc-300 p-3 rounded-xl font-mono text-[11px] leading-relaxed max-h-48 overflow-y-auto space-y-2 border border-zinc-800">
                  {catalog.map((q, i) => (
                    <div key={i} className="border-b border-zinc-800/80 pb-1.5 last:border-none">
                      <span className="text-indigo-400 font-bold">[{q.id}]</span>{" "}
                      <span className="text-zinc-200">{q.prompt}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Raw confidence scores list */}
            {Object.keys(rawConf).length > 0 && (
              <div className="space-y-1.5">
                <h5 className="font-bold text-zinc-900 text-[11px] uppercase tracking-wider">
                  各測定軸のJev判定信頼度 (Confidence Metrics)
                </h5>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 font-mono text-[11px]">
                  {Object.entries(rawConf).map(([k, v]) => (
                    <div
                      key={k}
                      className="bg-zinc-50 border border-zinc-200 rounded-lg px-2.5 py-1 flex items-center justify-between"
                    >
                      <span className="text-zinc-600 truncate">{k}</span>
                      <strong className="text-indigo-600">{v}%</strong>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
