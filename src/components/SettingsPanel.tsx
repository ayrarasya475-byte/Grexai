import React, { useState } from 'react';
import { useStore, UserSettings } from '../lib/store';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { X, Save, AlertCircle } from 'lucide-react';

export default function SettingsPanel() {
  const { profile, setSettingsOpen } = useStore();
  const [settings, setSettings] = useState<UserSettings>({
    puterJsActive: profile?.settings?.puterJsActive ?? true,
    geminiApiKey: profile?.settings?.geminiApiKey ?? '',
    deepseekApiKey: profile?.settings?.deepseekApiKey ?? '',
    grokApiKey: profile?.settings?.grokApiKey ?? ''
  });
  const [saving, setSaving] = useState(false);

  const saveConfig = async () => {
    if (!profile) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, 'users', profile.uid), {
        settings,
        updatedAt: Date.now()
      });
      setSettingsOpen(false);
    } catch(err) {
      try { handleFirestoreError(err, OperationType.UPDATE, 'users'); } catch(e){}
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="absolute inset-y-0 right-0 w-80 bg-[#111] border-l border-red-900 z-40 shadow-2xl flex flex-col font-mono text-sm">
      <div className="p-4 border-b border-red-900 flex justify-between items-center bg-black">
        <h2 className="text-red-500 font-bold tracking-widest">KONFIGURASI</h2>
        <button onClick={() => setSettingsOpen(false)} className="text-gray-500 hover:text-red-500">
          <X size={20} />
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        
        <div className="bg-red-950/30 p-3 rounded border border-red-900 flex items-start gap-2">
          <AlertCircle size={16} className="text-red-500 mt-0.5 shrink-0" />
          <p className="text-xs text-red-400">Gunakan Puter.js secara default tanpa API Key. Nonaktifkan jika ingin menggunakan model lain.</p>
        </div>

        <div className="space-y-2">
          <label className="flex items-center gap-2 text-gray-300">
            <input 
              type="checkbox" 
              checked={settings.puterJsActive}
              onChange={(e) => setSettings({ ...settings, puterJsActive: e.target.checked })}
              className="accent-red-600 w-4 h-4"
            />
            <span>Aktifkan endpoint Puter.js</span>
          </label>
        </div>

        {!settings.puterJsActive && (
          <div className="space-y-4 pt-4 border-t border-gray-800">
            <div>
              <label className="block text-gray-400 text-xs mb-1">Gemini API Key</label>
              <input 
                type="password"
                value={settings.geminiApiKey}
                onChange={(e) => setSettings({ ...settings, geminiApiKey: e.target.value })}
                className="w-full bg-gray-900 border border-gray-700 text-white p-2 rounded focus:border-red-500 outline-none"
                placeholder="AIzaSy..."
              />
            </div>
            <div>
              <label className="block text-gray-400 text-xs mb-1">Deepseek API Key</label>
              <input 
                type="password"
                value={settings.deepseekApiKey}
                onChange={(e) => setSettings({ ...settings, deepseekApiKey: e.target.value })}
                className="w-full bg-gray-900 border border-gray-700 text-white p-2 rounded focus:border-red-500 outline-none"
                placeholder="sk-..."
              />
            </div>
            <div>
              <label className="block text-gray-400 text-xs mb-1">Grok API Key</label>
              <input 
                type="password"
                value={settings.grokApiKey}
                onChange={(e) => setSettings({ ...settings, grokApiKey: e.target.value })}
                className="w-full bg-gray-900 border border-gray-700 text-white p-2 rounded focus:border-red-500 outline-none"
                placeholder="x-..."
              />
            </div>
          </div>
        )}
      </div>

      <div className="p-4 bg-black border-t border-red-900">
        <button 
          onClick={saveConfig}
          disabled={saving}
          className="w-full bg-red-900 hover:bg-red-700 text-white font-bold py-2 rounded flex justify-center items-center gap-2 transition"
        >
          <Save size={16} />
          {saving ? 'MENYIMPAN...' : 'SIMPAN Konfigurasi'}
        </button>
      </div>
    </div>
  );
}
