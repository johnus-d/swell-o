import React from 'react';
import { ShieldAlert, Download, X } from 'lucide-react';

interface BackupReminderBannerProps {
  onExportClick: () => void;
  onDismiss: () => void;
}

export const BackupReminderBanner: React.FC<BackupReminderBannerProps> = ({
  onExportClick,
  onDismiss
}) => {
  return (
    <div className="bg-gradient-to-r from-amber-950/70 via-slate-900 to-amber-950/70 border border-amber-500/40 rounded-2xl p-3 shadow-lg flex items-center justify-between gap-3 text-xs animate-fade-in">
      <div className="flex items-center gap-2.5">
        <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 shrink-0">
          <ShieldAlert className="w-4 h-4" />
        </div>
        <div>
          <div className="font-bold text-amber-200">Backup Reminder</div>
          <div className="text-[11px] text-slate-300">
            Remember to export your data regularly to prevent data loss.
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        <button
          type="button"
          onClick={onExportClick}
          className="px-2.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1 transition-colors shadow-sm"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export</span>
        </button>
        <button
          type="button"
          onClick={onDismiss}
          className="p-1.5 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800 transition-colors"
          title="Dismiss reminder"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
