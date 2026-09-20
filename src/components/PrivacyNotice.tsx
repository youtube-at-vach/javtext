import React from "react";
import { ShieldCheck, Info, AlertTriangle } from "lucide-react";

export function PrivacyNotice() {
  return (
    <div className="px-3.5 py-2.5 bg-zinc-50/80 border border-zinc-200/90 rounded-xl flex items-start gap-2.5 text-[11px] text-zinc-500 leading-relaxed">
      <ShieldCheck className="w-4 h-4 text-zinc-400 mt-0.5 shrink-0" />
      <div>
        <span className="font-semibold text-zinc-700">プライバシーとお取り扱いについて:</span>
        <span className="ml-1 text-zinc-600">
          入力されたテキストは印象値測定のためTypeSafe APIへ送信されます。個人を特定できる情報や機密情報の入力はお控えください。
        </span>
        <span className="ml-1 text-zinc-500">
          測定結果は文章の言い回しや修辞に基づく「受ける印象の傾向」を可視化したものであり、書き手自身の人格診断や客観的事実を断定するものではありません。
        </span>
      </div>
    </div>
  );
}
