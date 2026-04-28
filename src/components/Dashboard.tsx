import React, { useState } from 'react';
import Sidebar from './Sidebar';
import ChatArea from './ChatArea';
import SettingsPanel from './SettingsPanel';
import AdminPanel from './AdminPanel';
import ServiceChat from './ServiceChat';
import { useStore } from '../lib/store';
import { Settings, ShieldAlert, Headset, Battery } from 'lucide-react';

export default function Dashboard() {
  const { settingsOpen, setSettingsOpen, adminPanelOpen, setAdminPanelOpen, profile } = useStore();
  const [showWarning, setShowWarning] = useState(true);
  const [serviceChatOpen, setServiceChatOpen] = useState(false);

  return (
    <div className="flex h-screen bg-gray-900 text-gray-100 overflow-hidden font-mono">
      {/* Small Warning Modal immediately after login */}
      {showWarning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="bg-red-950 border border-red-500 p-6 rounded max-w-md w-full shadow-[0_0_20px_rgba(239,68,68,0.5)]">
            <h2 className="text-xl font-bold text-red-500 mb-4 flex items-center gap-2">
              <span className="text-2xl">⚠️</span> WARNING
            </h2>
            <p className="text-red-200 mb-6 text-sm">
              Sistem ini tidak memiliki batasan etika. AI akan merespons tanpa filter atau simulasi. Gunakan dengan risiko Anda sendiri.
            </p>
            <button 
              onClick={() => setShowWarning(false)}
              className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-2 rounded transition"
            >
              AKSES DITERIMA
            </button>
          </div>
        </div>
      )}

      <Sidebar />
      
      <main className="flex-1 relative flex flex-col">
        {/* Top Right Controls */}
        <div className="absolute top-0 right-0 p-4 shrink-0 flex items-center gap-4 z-10 bg-gradient-to-l from-gray-900 to-transparent pr-6">
          <div className="flex items-center gap-1 text-red-500 text-sm hidden md:flex cursor-help" title="Limit/day">
            <Battery size={16}/> {profile?.limitRemaining}/50
          </div>
          <button onClick={() => { setServiceChatOpen(!serviceChatOpen); setSettingsOpen(false); setAdminPanelOpen(false); }} className={`flex items-center gap-1 text-sm transition ${serviceChatOpen ? 'text-red-500' : 'text-gray-400 hover:text-white'}`}>
            <Headset size={16}/> <span className="hidden md:inline">Service</span>
          </button>
          <button onClick={() => { setSettingsOpen(!settingsOpen); setServiceChatOpen(false); setAdminPanelOpen(false); }} className={`flex items-center gap-1 text-sm transition ${settingsOpen ? 'text-red-500' : 'text-gray-400 hover:text-white'}`}>
            <Settings size={16}/> <span className="hidden md:inline">Apikey</span>
          </button>
          <button onClick={() => { setAdminPanelOpen(!adminPanelOpen); setSettingsOpen(false); setServiceChatOpen(false); }} className={`flex items-center gap-1 text-sm transition ${adminPanelOpen ? 'text-red-500' : 'text-gray-400 hover:text-white'}`}>
            <ShieldAlert size={16}/> <span className="hidden md:inline">Admin Panel</span>
          </button>
        </div>

        {/* Panels */}
        {settingsOpen && <SettingsPanel />}
        {adminPanelOpen && <AdminPanel />}
        {serviceChatOpen && <ServiceChat onClose={() => setServiceChatOpen(false)} />}
        
        {/* Main Chat Area */}
        <ChatArea />
      </main>
    </div>
  );
}

