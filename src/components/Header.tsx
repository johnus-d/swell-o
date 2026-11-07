import React from 'react';
import { Sparkles, HelpCircle } from 'lucide-react';

interface HeaderProps {
  onLoadSampleData: () => void;
  entriesCount: number;
  onShowSplash?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onLoadSampleData, entriesCount, onShowSplash }) => {
  return (
    <header className="w-full pt-safe px-4 pb-2.5 flex items-center justify-between border-b border-cyan-950/60 bg-[#070c18]/90 backdrop-blur-md sticky top-0 z-30">
      <div className="flex items-center gap-2.5">
        {/* App Logo */}
        <div 
          onClick={onShowSplash}
          className="w-9 h-9 rounded-xl overflow-hidden ring-1 ring-cyan-500/40 shadow-md shadow-cyan-500/20 bg-white/95 flex items-center justify-center cursor-pointer transition-transform active:scale-95 shrink-0"
          title="Swell-o Joint Flare Tracker Logo (Tap to view splash)"
        >
          <img
            src={`${import.meta.env.BASE_URL}app-logo.png`}
            alt="Swell-o Logo"
            className="w-full h-full object-contain p-0.5"
          />
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <h1 className="text-base font-black tracking-tight text-white">
              Swell-o
            </h1>
          </div>
          <p className="text-[10px] text-cyan-200/70 font-medium tracking-wide">
            joint & flare tracker
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1.5">
        {entriesCount === 0 && (
          <button
            type="button"
            onClick={onLoadSampleData}
            className="px-2.5 py-1 text-xs font-semibold rounded-xl bg-cyan-950/60 hover:bg-cyan-900/60 text-cyan-300 border border-cyan-700/50 flex items-center gap-1 transition-colors active:scale-95"
            title="Load demo data to see insights and history"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Demo Data</span>
          </button>
        )}

        {onShowSplash && (
          <button
            type="button"
            onClick={onShowSplash}
            className="p-1.5 rounded-xl text-slate-400 hover:text-cyan-300 hover:bg-cyan-950/40 transition-colors"
            title="View splash screen"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
        )}
      </div>
    </header>
  );
};
