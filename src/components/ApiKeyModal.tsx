import { useState } from "react";
import { Key, Check, ExternalLink, ShieldCheck, X, AlertCircle } from "lucide-react";

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentKey: string;
  onSaveKey: (key: string) => void;
  serverHasTypeSafeKey: boolean;
}

export function ApiKeyModal({
  isOpen,
  onClose,
  currentKey,
  onSaveKey,
  serverHasTypeSafeKey,
}: ApiKeyModalProps) {
  const [keyInput, setKeyInput] = useState(currentKey);
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSave = () => {
    onSaveKey(keyInput.trim());
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 900);
  };

  const handleClear = () => {
    setKeyInput("");
    onSaveKey("");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-zinc-200 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-zinc-400 hover:text-zinc-600 rounded-lg hover:bg-zinc-100 transition-colors"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-violet-50 border border-violet-100 text-violet-600 flex items-center justify-center">
            <Key className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-zinc-900">TypeSafe Jev API設定</h2>
            <p className="text-xs text-zinc-500">
              文章の印象計測に利用するTypeSafe APIキーを設定できます
            </p>
          </div>
        </div>

        {/* Server status banner */}
        <div className="mb-5 p-3 rounded-xl border bg-zinc-50/70 border-zinc-200 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-zinc-700">環境変数のTypeSafe APIキー:</span>
            {serverHasTypeSafeKey ? (
              <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                <Check className="w-3 h-3" /> 設定済み
              </span>
            ) : (
              <span className="text-amber-700 font-semibold bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                未設定（シミュレーション稼働中）
              </span>
            )}
          </div>
          <p className="text-[11px] text-zinc-500 mt-1.5 leading-relaxed">
            ※ APIキーが未設定でも、高精度な内蔵計測エンジンにより、テキスト編集に合わせてリアルタイムに全メーターが反応します。
          </p>
        </div>

        {/* Client-side key input */}
        <div className="space-y-3 mb-6">
          <label className="block text-xs font-bold text-zinc-800">
            ブラウザ用 TypeSafe APIキー（任意）
          </label>
          <div className="relative">
            <input
              type="password"
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
              placeholder="ts_live_..."
              className="w-full text-xs font-mono px-3.5 py-2.5 rounded-xl border border-zinc-300 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 bg-white"
            />
          </div>
          <p className="text-[11px] text-zinc-400">
            キーはブラウザのLocalStorageにのみ保存され、サーバーへはリクエスト時のみ送信されます。
          </p>
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-between gap-3 pt-3 border-t border-zinc-100">
          <button
            type="button"
            onClick={handleClear}
            className="text-xs text-zinc-500 hover:text-zinc-800 hover:underline"
          >
            キーをクリア
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-2 text-xs font-medium text-zinc-600 hover:bg-zinc-100 rounded-xl transition-colors"
            >
              キャンセル
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-4 py-2 text-xs font-bold text-white bg-violet-600 hover:bg-violet-700 rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
            >
              {savedSuccess ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>保存しました</span>
                </>
              ) : (
                <span>保存する</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
