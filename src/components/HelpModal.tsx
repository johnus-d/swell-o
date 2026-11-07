import React, { useEffect } from 'react';
import { X, HelpCircle, Activity, Calendar, ShieldCheck, Smartphone, Sparkles, TrendingUp } from 'lucide-react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShowSplash?: () => void;
}

const BASE_LEVELS = [
  { level: 0, label: 'Ok', desc: 'No swelling or pain', color: '#22c55e' },
  { level: 2, label: 'Ache', desc: 'Dull or tender ache', color: '#eab308' },
  { level: 4, label: 'Mild', desc: 'Noticeable joint puffiness', color: '#f97316' },
  { level: 6, label: 'Moderate', desc: 'Significant flare & warmth', color: '#ef4444' },
  { level: 8, label: 'Severe', desc: 'Intense flare & swelling', color: '#dc2626' },
  { level: 10, label: 'Total loss', desc: 'Immobilized joint', color: '#18181b' },
];

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose, onShowSplash }) => {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Swell-o Help & User Guide"
    >
      <div
        className="w-full sm:max-w-lg max-h-[88vh] bg-[#0c1322] border border-cyan-950/80 rounded-t-3xl sm:rounded-2xl flex flex-col shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-cyan-950/60 bg-[#090f1c] shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 flex items-center justify-center shrink-0">
              <HelpCircle className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">Swell-o User Guide</h2>
              <p className="text-[11px] text-cyan-300/70">Frictionless arthritis & joint flare tracking</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors"
            aria-label="Close help"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5 text-slate-300 text-xs leading-relaxed">
          {/* Quick Logging Steps */}
          <section className="space-y-2.5">
            <div className="flex items-center gap-2 text-cyan-300 font-bold text-sm">
              <Activity className="w-4 h-4" />
              <h3>Quick Logging in 10 Seconds</h3>
            </div>
            <div className="space-y-2 bg-[#080d19] p-3.5 rounded-2xl border border-cyan-950/50">
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-300 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">1</span>
                <div>
                  <strong className="text-white">Pick Date:</strong> Defaults to today. Tap any of the prior 6 days on the top strip, or tap the calendar icon for older dates.
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-300 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">2</span>
                <div>
                  <strong className="text-white">Select Joint:</strong> Pre-selected with your most frequent joint. Options are automatically sorted by your frequency. Choose <em>Other</em> for custom joints.
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-300 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">3</span>
                <div>
                  <strong className="text-white">Rate Severity (0–10):</strong> Slide to match your swelling or pain. The tick markers guide your selection.
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-300 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">4</span>
                <div>
                  <strong className="text-white">Side & Multiple Joints:</strong> Toggle Left, Right, Both, or None. Tap <em>+ Add Another Joint</em> if multiple joints are flared on the same day.
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-300 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">5</span>
                <div>
                  <strong className="text-white">Save Entry:</strong> Saves instantly to local storage and updates your flare trends.
                </div>
              </div>
            </div>
          </section>

          {/* Severity Scale Reference */}
          <section className="space-y-2.5">
            <div className="flex items-center gap-2 text-cyan-300 font-bold text-sm">
              <Calendar className="w-4 h-4" />
              <h3>Severity Scale (0–10)</h3>
            </div>
            <p className="text-[11px] text-slate-400">
              Ratings between defined anchor levels are automatically slash-joined (e.g. 3 is <em>mild / moderate swelling</em>):
            </p>
            <div className="grid grid-cols-2 gap-2">
              {BASE_LEVELS.map((lvl) => (
                <div 
                  key={lvl.level}
                  className="p-2.5 rounded-xl border border-cyan-950/50 bg-[#080d19] flex items-center gap-2.5"
                >
                  <span 
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black text-white shrink-0 shadow-sm"
                    style={{ backgroundColor: lvl.color }}
                  >
                    {lvl.level}
                  </span>
                  <div>
                    <div className="font-bold text-white text-[11px] capitalize">{lvl.label}</div>
                    <div className="text-[10px] text-slate-400">{lvl.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Insights & Cycle Tracking */}
          <section className="space-y-2">
            <div className="flex items-center gap-2 text-cyan-300 font-bold text-sm">
              <TrendingUp className="w-4 h-4" />
              <h3>Insights & Flare Cycles</h3>
            </div>
            <p className="bg-[#080d19] p-3 rounded-xl border border-cyan-950/50">
              Visit the <strong className="text-cyan-200">Insights</strong> tab to view your severity over time, joint counts, smoothed trend lines, and automated calculation of your <strong className="text-cyan-200">Typical Flare Cycle Length</strong>.
            </p>
          </section>

          {/* Data Privacy & Backup */}
          <section className="space-y-2">
            <div className="flex items-center gap-2 text-cyan-300 font-bold text-sm">
              <ShieldCheck className="w-4 h-4" />
              <h3>Privacy & No Data Lock-in</h3>
            </div>
            <p className="bg-[#080d19] p-3 rounded-xl border border-cyan-950/50">
              All your data is kept exclusively in your device’s local storage—no tracking and no cloud sync. Use the <strong className="text-cyan-200">Export</strong> tab to download CSV or Excel (.xlsx) backups regularly, which can be re-imported anytime.
            </p>
          </section>

          {/* iPhone / PWA Tip */}
          <section className="space-y-2">
            <div className="flex items-center gap-2 text-cyan-300 font-bold text-sm">
              <Smartphone className="w-4 h-4" />
              <h3>iPhone Home Screen App</h3>
            </div>
            <p className="bg-[#080d19] p-3 rounded-xl border border-cyan-950/50">
              For full-screen mobile usage without Safari browser bars: tap the Safari <strong className="text-white">Share</strong> button (bottom bar) and select <strong className="text-white">Add to Home Screen</strong>.
            </p>
          </section>

          {/* Replay Splash */}
          {onShowSplash && (
            <div className="pt-2 flex justify-center">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onShowSplash();
                }}
                className="text-[11px] text-cyan-400/80 hover:text-cyan-300 flex items-center gap-1.5 underline decoration-cyan-500/40"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>View Intro Splash Animation</span>
              </button>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 border-t border-cyan-950/60 bg-[#090f1c] shrink-0 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-2 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-slate-950 font-bold text-xs shadow-md shadow-cyan-500/20 active:scale-95 transition-all"
          >
            Got It
          </button>
        </div>
      </div>
    </div>
  );
};
