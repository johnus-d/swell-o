import React, { useState } from 'react';
import { X, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';

interface HomescreenBannerProps {
  entriesTodayCount: number;
}

export const HomescreenBanner: React.FC<HomescreenBannerProps> = ({ entriesTodayCount }) => {
  const [isDismissed, setIsDismissed] = useState<boolean>(() => {
    return localStorage.getItem('swello_banner_dismissed') === 'true';
  });
  const [isMinimized, setIsMinimized] = useState<boolean>(false);

  if (isDismissed) return null;

  const handleDismiss = () => {
    setIsDismissed(true);
    localStorage.setItem('swello_banner_dismissed', 'true');
  };

  return (
    <div className="relative w-full rounded-2xl overflow-hidden border border-cyan-900/40 shadow-xl shadow-cyan-950/40 transition-all duration-200">
      {/* Background Graphic */}
      <div className="relative w-full h-36 sm:h-40 overflow-hidden bg-slate-950">
        <img
          src="/homescreen-banner.jpg"
          alt="Swell-o Daily Flare Diary"
          className="w-full h-full object-cover object-center filter brightness-90 contrast-105"
        />
        {/* Thematic Cyan/Indigo Vignette Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#070c18] via-[#070c18]/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#070c18]/90 via-[#070c18]/40 to-transparent" />
      </div>

      {/* Floating Content */}
      <div className="absolute inset-0 p-4 flex flex-col justify-between">
        {/* Top Controls */}
        <div className="flex items-center justify-between">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 backdrop-blur-md">
            <Sparkles className="w-3 h-3 text-cyan-300" />
            <span>Joint & Flare Diary</span>
          </span>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setIsMinimized(!isMinimized)}
              className="p-1 rounded-lg bg-black/40 hover:bg-black/60 text-slate-300 hover:text-white backdrop-blur-md transition-colors"
              title={isMinimized ? 'Expand banner' : 'Collapse banner'}
            >
              {isMinimized ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
            </button>
            <button
              type="button"
              onClick={handleDismiss}
              className="p-1 rounded-lg bg-black/40 hover:bg-black/60 text-slate-400 hover:text-white backdrop-blur-md transition-colors"
              title="Close banner"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Bottom Banner Tagline */}
        {!isMinimized && (
          <div className="space-y-1 drop-shadow-md">
            <h2 className="text-base sm:text-lg font-black tracking-tight text-white flex items-center gap-1.5">
              <span>Track Swelling Seamlessly</span>
            </h2>
            <div className="flex items-center justify-between text-xs">
              <p className="text-slate-300 text-[11px] max-w-[70%] leading-snug">
                One-tap joint updates with timeline flare tracking & zero data lock-in.
              </p>
              <span className="px-2 py-0.5 rounded-md bg-cyan-950/80 border border-cyan-700/50 text-cyan-300 font-mono text-[10px]">
                {entriesTodayCount > 0 ? `${entriesTodayCount} logged today` : 'Ready to log'}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
