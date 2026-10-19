import React, { useState, useEffect } from 'react';

interface SplashScreenProps {
  onDismiss: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onDismiss }) => {
  const [fading, setFading] = useState(false);

  useEffect(() => {
    // Show splash for 1.2s, then fade out smoothly
    const timer = setTimeout(() => {
      setFading(true);
      setTimeout(onDismiss, 400); // 400ms fade transition
    }, 1200);

    return () => clearTimeout(timer);
  }, [onDismiss]);

  const handleInstantDismiss = () => {
    setFading(true);
    setTimeout(onDismiss, 200);
  };

  return (
    <div
      onClick={handleInstantDismiss}
      className={`fixed inset-0 z-50 bg-[#050811] flex flex-col items-center justify-center p-6 transition-opacity duration-400 cursor-pointer select-none ${
        fading ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
      aria-label="Swell-o Splash Screen"
    >
      <div className="w-full max-w-sm flex flex-col items-center text-center space-y-6 animate-fade-in">
        {/* Splash Image */}
        <div className="relative w-full aspect-[16/9] rounded-2xl overflow-hidden shadow-2xl shadow-cyan-500/20 border border-cyan-900/40">
          <img
            src="/splash-screen.jpg"
            alt="Swell-o — Joint & Flare Tracker"
            className="w-full h-full object-cover"
          />
        </div>

        {/* Pulse Loading Indicator */}
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
          <span className="text-xs font-semibold text-cyan-300 tracking-wider uppercase">
            Loading Swell-o...
          </span>
        </div>

        <span className="text-[11px] text-slate-500">Tap anywhere to skip</span>
      </div>
    </div>
  );
};
