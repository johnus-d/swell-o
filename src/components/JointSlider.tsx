import React from 'react';
import { getSeverityDescription, getSeverityHexColor } from '../utils/severity';

interface JointSliderProps {
  value: number | null; // null if unselected
  onChange: (val: number) => void;
  requiredError?: boolean;
}

const TICKS = [
  { val: 0, label: 'ok' },
  { val: 2, label: 'ache' },
  { val: 4, label: 'mild' },
  { val: 6, label: 'med' },
  { val: 8, label: 'severe' },
  { val: 10, label: 'total' }
];

export const JointSlider: React.FC<JointSliderProps> = ({
  value,
  onChange,
  requiredError = false
}) => {
  const isSelected = value !== null;
  const currentVal = value ?? 0;
  const activeColor = isSelected ? getSeverityHexColor(currentVal) : '#64748b';
  const fullDescription = isSelected ? getSeverityDescription(currentVal) : 'Tap or slide to rate severity';

  return (
    <div className="w-full space-y-2.5">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
          <span>Severity</span>
          <span className="text-cyan-400 font-bold">*</span>
          {!isSelected && (
            <span className={`text-[11px] font-normal ${requiredError ? 'text-red-400 font-semibold' : 'text-slate-400'}`}>
              (Required)
            </span>
          )}
        </label>

        {isSelected ? (
          <div className="flex items-center gap-2">
            <span
              className="px-2.5 py-0.5 text-xs font-bold rounded-full shadow-sm text-white"
              style={{
                backgroundColor: activeColor,
                boxShadow: `0 0 10px ${activeColor}55`
              }}
            >
              Level {currentVal}
            </span>
          </div>
        ) : (
          <span className="text-xs text-slate-500 italic">Not set</span>
        )}
      </div>

      {/* Interactive Slider Track */}
      <div className="relative pt-1 pb-1">
        <input
          type="range"
          min={0}
          max={10}
          step={1}
          value={isSelected ? currentVal : 0}
          onChange={(e) => onChange(parseInt(e.target.value, 10))}
          className={`w-full h-3 rounded-lg appearance-none cursor-pointer transition-colors ${
            requiredError && !isSelected ? 'ring-2 ring-red-500/60' : ''
          }`}
          style={{
            background: isSelected
              ? `linear-gradient(to right, #22c55e 0%, #eab308 20%, #ef4444 80%, #09090b 100%)`
              : '#334155'
          }}
          aria-label="Severity rating from 0 to 10"
        />

        {/* Ticks & Short Descriptions - Mathematically aligned to thumb center */}
        <div className="relative w-full h-10 mt-1 select-none">
          {TICKS.map((tick) => {
            const isTickActive = isSelected && currentVal === tick.val;
            const pct = tick.val / 10;
            return (
              <button
                key={tick.val}
                type="button"
                onClick={() => onChange(tick.val)}
                className="absolute flex flex-col items-center group py-0.5 touch-manipulation focus:outline-none -translate-x-1/2"
                style={{
                  left: `calc(14px + ${pct} * (100% - 28px))`
                }}
              >
                <span
                  className={`text-xs font-bold transition-colors ${
                    isTickActive
                      ? 'text-cyan-400 scale-110 drop-shadow-[0_0_6px_rgba(34,211,238,0.5)]'
                      : 'text-slate-400 group-hover:text-slate-200'
                  }`}
                >
                  {tick.val}
                </span>
                <span
                  className={`text-[10px] tracking-tight uppercase mt-0.5 transition-colors whitespace-nowrap ${
                    isTickActive
                      ? 'text-cyan-300 font-bold'
                      : 'text-slate-500 group-hover:text-slate-400'
                  }`}
                >
                  {tick.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Full Description Banner */}
      <div
        className={`px-3 py-2 rounded-xl border transition-all text-center flex items-center justify-center gap-2 ${
          isSelected
            ? 'bg-slate-950/80 border-slate-700/80'
            : requiredError
            ? 'bg-red-950/30 border-red-800/60 text-red-300 animate-pulse'
            : 'bg-slate-950/40 border-slate-800 text-slate-500'
        }`}
      >
        {isSelected && (
          <span
            className="w-2.5 h-2.5 rounded-full shrink-0"
            style={{
              backgroundColor: activeColor,
              boxShadow: `0 0 6px ${activeColor}`
            }}
          />
        )}
        <span className={`text-sm ${isSelected ? 'font-semibold text-slate-100' : 'text-xs'}`}>
          {fullDescription}
        </span>
      </div>
    </div>
  );
};
