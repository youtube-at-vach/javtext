import { Gauge, Key, RefreshCw, Zap, ShieldCheck, AlertCircle } from "lucide-react";
import { QuotaInfo } from "../types";

interface HeaderProps {
  hasTypeSafeKey: boolean;
  onOpenSettings: () => void;
  onReset: () => void;
  isProcessing: boolean;
  quota: QuotaInfo | null;
  onOpenQuotaModal: () => void;
}

export function Header({
  hasTypeSafeKey,
  onOpenSettings,
  onReset,
  isProcessing,
  quota,
  onOpenQuotaModal,
}: HeaderProps) {
  return (
    <header className="border-b border-zinc-200/80 bg-white/95 backdrop-blur-md sticky top-0 z-30 shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-violet-600 to-sky-500 flex items-center justify-center text-white shadow-sm shadow-indigo-200">
            <Gauge className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold text-zinc-900 tracking-tight">
                Jev 文章印象メーター
              </h1>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-violet-50 text-violet-700 border border-violet-200">
                TypeSafe Jev 直結
              </span>
            </div>
            <p className="text-xs text-zinc-500 hidden sm:block">
              TypeSafe Jev System One による多次元文章印象の定量的アナライズ
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {/* Public Trial Quota Counter Badge */}
          {quota && !quota.isUnlimited && (
            <button
              type="button"
              onClick={onOpenQuotaModal}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                quota.limitReached
                  ? "bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100"
                  : quota.remaining <= 3
                  ? "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100"
                  : "bg-zinc-100 text-zinc-700 border-zinc-200 hover:bg-zinc-200/70"
              }`}
              title={
                quota.limitReached
                  ? "無料体験の計測上限（10回）に達しました"
                  : `TypeSafe Jev 無料体験 残り: ${quota.remaining}/${quota.maxCount}回`
              }
            >
              {quota.limitReached ? (
                <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
              ) : (
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
              )}
              <span className="hidden md:inline">無料枠:</span>
              <span className="font-mono font-bold">
                {quota.limitReached ? "上限到達(10/10)" : `${quota.remaining}/${quota.maxCount}回`}
              </span>
            </button>
          )}

          {/* Jev API Key Button */}
          <button
            onClick={onOpenSettings}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-all ${
              hasTypeSafeKey
                ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                : "bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100"
            }`}
            title="TypeSafe Jev APIキー設定"
          >
            <Key className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Jev APIキー:</span>
            <span className="hidden sm:inline">{hasTypeSafeKey ? "設定済み (無制限)" : "設定 / 無料体験中"}</span>
            <span className="sm:hidden">{hasTypeSafeKey ? "APIキー" : "API設定"}</span>
          </button>

          {/* Reset button */}
          <button
            onClick={onReset}
            disabled={isProcessing}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 border border-zinc-200 rounded-lg transition-colors disabled:opacity-50"
            title="クリアして最初に戻す"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isProcessing ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">クリア</span>
          </button>
        </div>
      </div>
    </header>
  );
}
