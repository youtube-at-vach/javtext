import { AlertCircle, Key, Sparkles, X, ShieldAlert, Check } from "lucide-react";

interface QuotaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenKeySettings: () => void;
  usedCount: number;
  maxCount: number;
}

export function QuotaModal({
  isOpen,
  onClose,
  onOpenKeySettings,
  usedCount,
  maxCount,
}: QuotaModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-zinc-200 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-zinc-400 hover:text-zinc-600 rounded-lg hover:bg-zinc-100 transition-colors"
          aria-label="閉じる"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Icon & Heading */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center shrink-0">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-zinc-900 leading-tight">
              申し訳ありません
            </h3>
            <p className="text-xs text-amber-700 font-semibold mt-0.5">
              無料体験の計測上限（{maxCount}回）に達しました
            </p>
          </div>
        </div>

        {/* Explanation Card */}
        <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-4 text-xs text-zinc-600 space-y-2.5 mb-5 leading-relaxed">
          <p>
            当サービスは一般公開中のため、不正利用やイタズラ防止、およびサーバー負荷軽減の観点から、<strong>1セッションあたり最大{maxCount}回まで</strong>の無料計測制限を設けております。
          </p>
          <p className="text-zinc-500">
            たくさんの文章をTypeSafe Jevでお試しいただき、誠にありがとうございました！
          </p>
          
          <div className="pt-2 border-t border-zinc-200/80">
            <div className="flex items-center gap-1.5 font-bold text-zinc-800 text-[11px] mb-1">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span>続けて無制限にJevで遊びたい場合:</span>
            </div>
            <p className="text-[11px] text-zinc-500">
              ご自身のTypeSafe APIキーをお持ちの場合、キーを設定していただくことで制限なく何度でもJevでの印象計測をお楽しみいただけます。
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-2 pt-2">
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenKeySettings();
            }}
            className="w-full sm:flex-1 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors shadow-xs flex items-center justify-center gap-2"
          >
            <Key className="w-4 h-4" />
            <span>APIキーを設定して継続利用</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto py-2.5 px-4 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-xl text-xs font-semibold transition-colors"
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
}
