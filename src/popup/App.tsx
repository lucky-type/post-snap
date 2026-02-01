import React, { useState, useEffect } from 'react';
import Settings from './components/Settings';
import HostSelector from './components/HostSelector';
import CaptureControls from './components/CaptureControls';
import CollectionSelector from './components/CollectionSelector';
import { Activity, Settings as SettingsIcon, Layout, AlertCircle, CheckCircle2 } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

type Tab = 'capture' | 'settings';

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('capture');
  const [selectedHost, setSelectedHost] = useState<string | null>(null);
  const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Auto-clear messages after 5 seconds
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  return (
    <div className="w-[500px] h-[500px] bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex flex-col font-sans text-slate-800">
      {/* Header */}
      <header className="px-6 py-5 bg-white/60 backdrop-blur-xl border-b border-indigo-100/50 flex justify-between items-center z-10 sticky top-0">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-600 rounded-xl shadow-lg shadow-indigo-600/20">
            <Layout className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-700 to-purple-700 tracking-tight">
              PostSnap
            </h1>
            <p className="text-xs text-slate-500 font-medium">Capture & Sync</p>
          </div>
        </div>

        <div className="flex bg-slate-100/80 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('capture')}
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200",
              activeTab === 'capture'
                ? "bg-white text-indigo-700 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            )}
          >
            <Activity className="w-4 h-4" />
            Capture
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200",
              activeTab === 'settings'
                ? "bg-white text-indigo-700 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            )}
          >
            <SettingsIcon className="w-4 h-4" />
            Settings
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-hidden p-6 relative">
        {activeTab === 'capture' ? (
          <div className="h-full flex flex-col gap-4">
            {/* Host Selection */}
            <div className="glass-panel p-4 rounded-xl">
              <HostSelector
                selectedHost={selectedHost}
                onSelectHost={setSelectedHost}
              />
            </div>

            {/* Collection Selection */}
            <div className="glass-panel p-4 rounded-xl">
              <CollectionSelector
                selectedCollectionId={selectedCollectionId}
                onSelectCollection={setSelectedCollectionId}
              />
            </div>

            {/* Capture Controls */}
            <div className="mt-auto">
              <CaptureControls
                selectedHost={selectedHost}
                selectedCollectionId={selectedCollectionId}
                onMessage={setMessage}
              />
            </div>
          </div>
        ) : (
          <div className="h-full">
            <Settings />
          </div>
        )}
      </main>

      {/* Message Toast */}
      {message && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-full max-w-[90%] z-50">
          <div
            className={cn(
              "px-4 py-3 rounded-xl shadow-xl border flex items-center gap-3 animate-in slide-in-from-bottom-5 fade-in duration-300",
              message.type === 'success'
                ? 'bg-emerald-50 border-emerald-100 text-emerald-900'
                : 'bg-rose-50 border-rose-100 text-rose-900'
            )}
          >
            {message.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
            )}
            <p className="text-sm font-medium leading-relaxed">{message.text}</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
