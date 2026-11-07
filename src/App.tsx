import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { Navigation, TabType } from './components/Navigation';
import { EntryForm } from './components/EntryForm';
import { DiaryView } from './components/DiaryView';
import { InsightsView } from './components/InsightsView';
import { ExportView } from './components/ExportView';
import { ImportView } from './components/ImportView';
import { BackupReminderBanner } from './components/BackupReminderBanner';
import { SplashScreen } from './components/SplashScreen';
import { HelpModal } from './components/HelpModal';
import {
  getAllEntries,
  getCollapsedDayRecords,
  shouldShowExportReminder,
  loadSampleDataIfEmpty
} from './utils/storage';
import { DayRecord, JointEntry } from './types';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('entry');
  const [allEntries, setAllEntries] = useState<JointEntry[]>(() => getAllEntries());
  const [dayRecords, setDayRecords] = useState<DayRecord[]>(() => getCollapsedDayRecords());
  const [dateToEdit, setDateToEdit] = useState<string | undefined>(undefined);
  const [showBackupReminder, setShowBackupReminder] = useState<boolean>(false);
  const [showHelp, setShowHelp] = useState<boolean>(false);
  const [showSplash, setShowSplash] = useState<boolean>(() => {
    // Show splash once per browser session
    const seen = sessionStorage.getItem('swello_splash_seen');
    if (!seen) {
      sessionStorage.setItem('swello_splash_seen', 'true');
      return true;
    }
    return false;
  });

  // Reload data from local storage
  const refreshData = useCallback(() => {
    const entries = getAllEntries();
    setAllEntries(entries);
    setDayRecords(getCollapsedDayRecords(entries));
    setShowBackupReminder(shouldShowExportReminder(entries.length));
  }, []);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  const handleSaved = (date: string) => {
    refreshData();
    setDateToEdit(date);
  };

  const handleDeleted = () => {
    refreshData();
    setDateToEdit(undefined);
  };

  const handleSelectDateToEdit = (date: string) => {
    setDateToEdit(date);
    setActiveTab('entry');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLoadSampleData = () => {
    loadSampleDataIfEmpty();
    refreshData();
  };

  return (
    <div className="min-h-screen bg-[#070c18] text-slate-100 flex flex-col font-sans">
      {/* Splash Screen */}
      {showSplash && <SplashScreen onDismiss={() => setShowSplash(false)} />}

      {/* Help Modal */}
      <HelpModal
        isOpen={showHelp}
        onClose={() => setShowHelp(false)}
        onShowSplash={() => setShowSplash(true)}
      />

      {/* Top Header */}
      <Header
        onLoadSampleData={handleLoadSampleData}
        entriesCount={allEntries.length}
        onOpenHelp={() => setShowHelp(true)}
        onShowSplash={() => setShowSplash(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-xl mx-auto px-3.5 py-4 pb-28 space-y-4">
        {/* Backup Reminder Banner */}
        {showBackupReminder && (
          <BackupReminderBanner
            onExportClick={() => setActiveTab('export')}
            onDismiss={() => setShowBackupReminder(false)}
          />
        )}

        {/* Tab Views */}
        {activeTab === 'entry' && (
          <EntryForm
            initialDate={dateToEdit}
            dayRecords={dayRecords}
            allEntries={allEntries}
            onSaved={handleSaved}
            onDeleted={handleDeleted}
          />
        )}

        {activeTab === 'diary' && (
          <DiaryView
            dayRecords={dayRecords}
            onSelectDateToEdit={handleSelectDateToEdit}
            onNewEntryClick={() => {
              setDateToEdit(undefined);
              setActiveTab('entry');
            }}
          />
        )}

        {activeTab === 'insights' && (
          <InsightsView
            dayRecords={dayRecords}
            allEntries={allEntries}
          />
        )}

        {activeTab === 'export' && (
          <ExportView
            allEntries={allEntries}
            onExportDone={refreshData}
          />
        )}

        {activeTab === 'import' && (
          <ImportView
            onImportComplete={() => {
              refreshData();
              setActiveTab('diary');
            }}
          />
        )}
      </main>

      {/* Bottom Navigation */}
      <Navigation activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
};

export default App;
