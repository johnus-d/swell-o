import React from 'react';

export type TabType = 'entry' | 'diary' | 'insights' | 'export' | 'import';

interface NavigationProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

export const Navigation: React.FC<NavigationProps> = ({ activeTab, onTabChange }) => {
  const tabs: { id: TabType; emoji: string; label: string }[] = [
    { id: 'entry', emoji: '➕', label: 'Track' },
    { id: 'diary', emoji: '📋', label: 'Diary' },
    { id: 'insights', emoji: '📈', label: 'Insights' },
    { id: 'export', emoji: '💾', label: 'Export' },
    { id: 'import', emoji: '📥', label: 'Import' }
  ];

  const handleSelect = (tabId: TabType) => {
    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }
    onTabChange(tabId);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-slate-950/90 backdrop-blur-xl border-t border-slate-900 pb-safe">
      <div className="max-w-md mx-auto grid grid-cols-5 px-1 py-1.5">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => handleSelect(tab.id)}
              className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-2xl transition-all duration-150 touch-manipulation select-none ${
                isActive
                  ? 'text-amber-400 font-bold'
                  : 'text-slate-400 hover:text-slate-200 active:scale-95'
              }`}
              style={{ minHeight: '48px' }}
            >
              <span className={`text-xl transition-transform ${isActive ? 'scale-115' : 'opacity-80'}`}>
                {tab.emoji}
              </span>
              <span className={`text-[10px] mt-0.5 tracking-tight ${isActive ? 'text-amber-400 font-extrabold' : 'text-slate-400 font-medium'}`}>
                {tab.label}
              </span>
              {isActive && (
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-0.5 shadow-sm shadow-amber-400" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
