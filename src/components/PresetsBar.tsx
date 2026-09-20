import { PRESET_SAMPLES } from "../data/presets";
import { PresetSample } from "../types";
import { Sparkles } from "lucide-react";

interface PresetsBarProps {
  onSelectPreset: (preset: PresetSample) => void;
  selectedId: string | null;
  disabled: boolean;
}

export function PresetsBar({
  onSelectPreset,
  selectedId,
  disabled,
}: PresetsBarProps) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none text-xs">
      <span className="text-zinc-500 flex items-center gap-1 shrink-0 font-medium text-[11px]">
        <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
        <span>変化を体感できる例文:</span>
      </span>

      <div className="flex items-center gap-1.5 shrink-0">
        {PRESET_SAMPLES.map((preset) => {
          const isSelected = selectedId === preset.id;
          return (
            <button
              key={preset.id}
              onClick={() => onSelectPreset(preset)}
              disabled={disabled}
              className={`px-2.5 py-1 rounded-lg border text-xs font-medium transition-all flex items-center gap-1.5 whitespace-nowrap ${
                isSelected
                  ? "bg-indigo-50 text-indigo-700 border-indigo-300 shadow-2xs font-bold"
                  : "bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-50 hover:border-zinc-300"
              } disabled:opacity-50`}
              title={`${preset.description} (${preset.targetMeters})`}
            >
              <span>{preset.title}</span>
              <span className="text-[9px] px-1.5 py-0.2 rounded bg-zinc-100 text-zinc-600 font-mono">
                {preset.category}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
