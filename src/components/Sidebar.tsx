import React, { useEffect, useState } from 'react';
import { useStore } from '../lib/store';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, query, where, orderBy, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { Plus, MessageSquare, Settings, LogOut, ShieldAlert } from 'lucide-react';
import { logout } from '../lib/firebase';

export default function Sidebar() {
  const { profile, currentChatId, setCurrentChatId, setSettingsOpen, settingsOpen, setAdminPanelOpen } = useStore();
  const [chats, setChats] = useState<any[]>([]);

  useEffect(() => {
    if (!profile) return;
    const q = query(
      collection(db, 'chats'),
      where('userId', '==', profile.uid),
      orderBy('updatedAt', 'desc')
    );
    
    const unsub = onSnapshot(q, (snap) => {
      const parsed = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setChats(parsed);
      if (!currentChatId && parsed.length > 0) {
        setCurrentChatId(parsed[0].id);
      }
    }, (error) => {
      try { handleFirestoreError(error, OperationType.GET, 'chats'); } catch(e){}
    });
    
    return unsub;
  }, [profile]);

  const newChat = async () => {
    if (!profile) return;
    try {
      const docRef = await addDoc(collection(db, 'chats'), {
        userId: profile.uid,
        title: 'New Session',
        createdAt: Date.now(),
        updatedAt: Date.now()
      });
      setCurrentChatId(docRef.id);
    } catch(err) {
      try { handleFirestoreError(err, OperationType.CREATE, 'chats'); } catch(e){}
    }
  };

  return (
    <aside className="w-64 bg-black border-r border-red-900 flex flex-col">
      <div className="p-4 border-b border-red-900 flex items-center justify-between">
        <h1 className="text-red-600 font-bold tracking-widest drop-shadow-[0_0_5px_rgba(220,38,38,0.8)]">GREXAI</h1>
      </div>
      
      <div className="p-4">
        <button 
          onClick={newChat}
          className="w-full flex items-center gap-2 bg-red-950 hover:bg-red-900 text-red-500 border border-red-800 p-3 rounded transition"
        >
          <Plus size={18} />
          <span>Sesi Baru</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-2 space-y-1">
        {chats.map(chat => (
          <button
            key={chat.id}
            onClick={() => setCurrentChatId(chat.id)}
            className={`w-full text-left p-3 rounded flex items-center gap-3 transition ${currentChatId === chat.id ? 'bg-red-900/30 text-white' : 'text-gray-400 hover:bg-gray-800'}`}
          >
            <MessageSquare size={16} />
            <span className="truncate text-sm">{chat.title}</span>
          </button>
        ))}
      </div>

      <div className="p-4 border-t border-red-900 space-y-2">
        <div className="text-xs text-red-500 mb-4 px-2">Limit Aktif: {profile?.limitRemaining}/50</div>
        
        <button 
          onClick={() => { setSettingsOpen(!settingsOpen); setAdminPanelOpen(false); }}
          className="w-full flex items-center gap-3 p-2 text-gray-400 hover:text-white transition"
        >
          <Settings size={18} />
          <span>Pengaturan</span>
        </button>
        
        <button 
          onClick={() => { setAdminPanelOpen(true); setSettingsOpen(false); }}
          className="w-full flex items-center gap-3 p-2 text-red-700 hover:text-red-500 transition"
        >
          <ShieldAlert size={18} />
          <span>Panel Admin</span>
        </button>
        
        <button 
          onClick={logout}
          className="w-full flex items-center gap-3 p-2 text-gray-500 hover:text-white transition"
        >
          <LogOut size={18} />
          <span>Keluar</span>
        </button>
      </div>
    </aside>
  );
}
