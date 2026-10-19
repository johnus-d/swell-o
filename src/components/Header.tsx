import React from 'react';
import { Activity, Sparkles } from 'lucide-react';

interface HeaderProps {
  onLoadSampleData: () => void;
  entriesCount: number;
}

export const Header: React.FC<HeaderProps> = ({ onLoadSampleData, entriesCount }) => {
  return (
    <header className="w-full pt-safe px-4 pb-2 flex items-center justify-between border-b border-slate-900 bg-slate-950/80 backdrop-blur-md sticky top-0 z-30">
      <div className="flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-300 p-0.5 shadow-md shadow-amber-500/20">
          <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
            <Activity className="w-5 h-5 text-amber-400 stroke-[2.5]" />
          </div>
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <h1 className="text-base font-black tracking-tight text-slate-100">
              Swell-o
            </h1>
            <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
              PWA
            </span>
          </div>
          <p className="text-[10px] text-slate-400 font-medium tracking-wide">
            joint & flare tracker
          </p>
        </div>
      </div>

      {entriesCount === 0 && (
        <button
          type="button"
          onClick={onLoadSampleData}
          className="px-2.5 py-1 text-xs font-semibold rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-400 border border-slate-800 flex items-center gap-1 transition-colors active:scale-95"
          title="Load demo data to see insights and history"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Demo Data</span>
        </button>
      )}
    </header>
  );
};
