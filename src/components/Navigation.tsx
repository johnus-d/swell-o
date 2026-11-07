import React from 'react';
import { PlusCircle, BookOpen, TrendingUp, Download, Upload } from 'lucide-react';

export type TabType = 'entry' | 'diary' | 'insights' | 'export' | 'import';

interface NavigationProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

export const Navigation: React.FC<NavigationProps> = ({ activeTab, onTabChange }) => {
  const tabs: {
    id: TabType;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
  }[] = [
    { id: 'entry', label: 'Track', icon: PlusCircle },
    { id: 'diary', label: 'Diary', icon: BookOpen },
    { id: 'insights', label: 'Insights', icon: TrendingUp },
    { id: 'export', label: 'Export', icon: Download },
    { id: 'import', label: 'Import', icon: Upload }
  ];

  const handleSelect = (tabId: TabType) => {
    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }
    onTabChange(tabId);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#070c18]/95 backdrop-blur-xl border-t border-cyan-950/60 pb-safe">
      <div className="max-w-md mx-auto grid grid-cols-5 px-1 py-1.5">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => handleSelect(tab.id)}
              className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-2xl transition-all duration-150 touch-manipulation select-none ${
                isActive
                  ? 'text-cyan-300 font-bold'
                  : 'text-slate-400 hover:text-slate-200 active:scale-95'
              }`}
              style={{ minHeight: '48px' }}
            >
              <div className="h-6 flex items-center justify-center">
                <Icon
                  className={`w-5 h-5 transition-all duration-150 ${
                    isActive
                      ? 'text-cyan-300 scale-110 drop-shadow-[0_0_8px_rgba(34,211,238,0.5)] stroke-[2.3]'
                      : 'text-slate-400 group-hover:text-slate-200 stroke-[1.8]'
                  }`}
                />
              </div>
              <span className={`text-[10px] mt-0.5 tracking-tight ${isActive ? 'text-cyan-300 font-extrabold' : 'text-slate-400 font-medium'}`}>
                {tab.label}
              </span>
              {isActive && (
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-0.5 shadow-[0_0_6px_#22d3ee]" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
