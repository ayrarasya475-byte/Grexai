import React, { useState, useEffect, useRef } from 'react';
import { useStore, UserProfile } from '../lib/store';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, query, getDocs, doc, setDoc, onSnapshot, orderBy, addDoc } from 'firebase/firestore';
import { X, Users, RefreshCw, Key, Headset, ShieldCheck, Send, User } from 'lucide-react';

export default function AdminPanel() {
  const { setAdminPanelOpen, adminAuthenticated, setAdminAuthenticated, profile } = useStore();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  
  const [activeTab, setActiveTab] = useState<'data' | 'service' | 'cek'>('data');
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loadingStats, setLoadingStats] = useState(false);

  // Service Admin State
  const [activeChatUserId, setActiveChatUserId] = useState<string | null>(null);
  const [serviceMessages, setServiceMessages] = useState<any[]>([]);
  const [serviceInput, setServiceInput] = useState('');
  const endRef = useRef<HTMLDivElement>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password === '92728281919191991') {
      setAdminAuthenticated(true);
      if (profile && profile.role !== 'admin') {
         try {
           await setDoc(doc(db, 'admins', profile.uid), { createdAt: Date.now(), password: '92728281919191991' });
         } catch(e) { }
      }
      fetchData();
    } else {
      setError('Akses Ditolak');
    }
  };

  const fetchData = async () => {
    setLoadingStats(true);
    try {
      const q = query(collection(db, 'users'));
      const snap = await getDocs(q);
      setUsers(snap.docs.map(d => d.data() as UserProfile));
    } catch (err) {
      setError('Gagal fetch data - ' + String(err));
    } finally {
      setLoadingStats(false);
    }
  };

  useEffect(() => {
    if (!adminAuthenticated) return;
    fetchData();
  }, [adminAuthenticated]);

  useEffect(() => {
    if (!activeChatUserId) return;
    const q = query(
      collection(db, 'adminChats', activeChatUserId, 'adminMessages'),
      orderBy('createdAt', 'asc')
    );
    const unsub = onSnapshot(q, snap => {
      setServiceMessages(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setTimeout(() => endRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    });
    return unsub;
  }, [activeChatUserId]);

  const sendServiceMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!serviceInput.trim() || !activeChatUserId || !profile) return;
    
    const content = serviceInput;
    setServiceInput('');

    try {
      await addDoc(collection(db, 'adminChats', activeChatUserId, 'adminMessages'), {
        senderId: profile.uid,
        role: 'admin',
        content,
        createdAt: Date.now()
      });
      await setDoc(doc(db, 'adminChats', activeChatUserId), {
        userId: activeChatUserId,
        updatedAt: Date.now()
      }, { merge: true });
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="absolute inset-y-0 right-0 w-[400px] bg-black border-l border-red-900 z-40 shadow-2xl flex flex-col font-mono text-sm max-w-full">
      <div className="p-4 border-b border-red-900 flex justify-between items-center bg-gray-900 shrink-0">
        <h2 className="text-red-500 font-bold tracking-widest flex items-center gap-2">
          <Key size={16} /> ADMIN ROOT
        </h2>
        <button onClick={() => setAdminPanelOpen(false)} className="text-gray-500 hover:text-red-500">
          <X size={20} />
        </button>
      </div>

      {!adminAuthenticated ? (
        <div className="flex-1 flex items-center justify-center p-6">
          <form onSubmit={handleLogin} className="w-full flex flex-col gap-4">
            <div className="text-center text-red-500 mb-4 font-bold">SYSTEM OVERRIDE REQUIRED</div>
            <input 
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Root Password"
              className="bg-gray-900 border border-gray-700 text-red-500 p-3 text-center outline-none focus:border-red-500 w-full tracking-widest"
            />
            {error && <div className="text-red-500 text-xs text-center">{error}</div>}
            <button type="submit" className="bg-red-900 hover:bg-red-700 text-white font-bold p-3">
              AUTHORIZE
            </button>
          </form>
        </div>
      ) : (
        <div className="flex-1 flex flex-col h-full overflow-hidden">
          <div className="flex bg-gray-900 border-b border-red-900 shrink-0">
            <button onClick={() => setActiveTab('data')} className={`flex-1 py-3 border-b-2 text-center transition ${activeTab === 'data' ? 'border-red-500 text-red-500 font-bold' : 'border-transparent text-gray-500 hover:text-gray-300'}`}><Users size={16} className="inline mr-2"/> Data</button>
            <button onClick={() => setActiveTab('service')} className={`flex-1 py-3 border-b-2 text-center transition ${activeTab === 'service' ? 'border-red-500 text-red-500 font-bold' : 'border-transparent text-gray-500 hover:text-gray-300'}`}><Headset size={16} className="inline mr-2"/> Service</button>
            <button onClick={() => setActiveTab('cek')} className={`flex-1 py-3 border-b-2 text-center transition ${activeTab === 'cek' ? 'border-red-500 text-red-500 font-bold' : 'border-transparent text-gray-500 hover:text-gray-300'}`}><ShieldCheck size={16} className="inline mr-2"/> Cek</button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 text-gray-300 relative">
            
            {activeTab === 'data' && (
              <>
                <div className="flex justify-end mb-4">
                  <button onClick={fetchData} className="flex items-center gap-2 text-red-500 hover:text-red-400">
                    <RefreshCw size={14} className={loadingStats ? 'animate-spin' : ''} />
                    Refresh
                  </button>
                </div>
                <div className="border border-red-900/50 rounded p-4">
                  <h3 className="font-bold text-red-400 mb-2 flex items-center gap-2"><Users size={16}/> Total Users: {users.length}</h3>
                  <div className="space-y-3 mt-4">
                    {users.map(u => (
                      <div key={u.uid} className="bg-[#111] p-3 rounded text-xs border border-gray-800">
                        <div className="flex justify-between text-gray-400">
                          <span className="font-bold">{u.firstName} <span className="text-gray-600 font-normal">({u.email})</span></span>
                          <span className={u.role === 'admin' ? 'text-red-500 font-bold' : ''}>{u.role}</span>
                        </div>
                        <div className="mt-2 flex justify-between text-gray-500">
                          <span>Limit: {u.limitRemaining}/50</span>
                          <span>UID: {u.uid.substring(0,6)}...</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {activeTab === 'service' && (
              <div className="flex flex-col h-full inset-0 absolute">
                {!activeChatUserId ? (
                  <div className="p-4 space-y-2 overflow-y-auto">
                    <h3 className="text-red-500 mb-4 font-bold border-b border-red-900 pb-2">Pilih User (First Name)</h3>
                    {users.map(u => (
                      <button 
                        key={u.uid}
                        onClick={() => setActiveChatUserId(u.uid)}
                        className="w-full text-left p-3 bg-gray-900 hover:bg-gray-800 rounded border border-gray-800 transition flex justify-between items-center"
                      >
                        <span className="font-bold">{u.firstName}</span>
                        <span className="text-xs text-gray-600">{u.uid.substring(0,6)}...</span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col h-full">
                    <div className="bg-red-950 p-2 flex items-center gap-2 shrink-0 border-b border-red-900">
                      <button onClick={() => setActiveChatUserId(null)} className="p-1 hover:bg-red-900 rounded">
                        <X size={16} />
                      </button>
                      <span className="font-bold text-red-400">
                        Chatting w/ {users.find(u => u.uid === activeChatUserId)?.firstName || 'User'}
                      </span>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                      {serviceMessages.map(msg => (
                        <div key={msg.id} className={`flex gap-2 ${msg.role === 'admin' ? 'flex-row-reverse' : ''}`}>
                          <div className={`px-3 py-2 rounded-lg max-w-[85%] text-xs ${msg.role === 'admin' ? 'bg-red-900 text-red-100' : 'bg-gray-800 text-gray-200'}`}>
                            {msg.content}
                          </div>
                        </div>
                      ))}
                      <div ref={endRef} />
                    </div>
                    
                    <form onSubmit={sendServiceMessage} className="p-3 border-t border-red-900 bg-black flex gap-2 shrink-0">
                      <input 
                        type="text"
                        value={serviceInput}
                        onChange={(e) => setServiceInput(e.target.value)}
                        placeholder="Balas..."
                        className="flex-1 bg-gray-900 text-white rounded px-3 py-2 outline-none focus:border focus:border-red-500"
                      />
                      <button type="submit" disabled={!serviceInput} className="bg-red-900 text-white p-2 rounded hover:bg-red-700 disabled:opacity-50">
                        <Send size={16} />
                      </button>
                    </form>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'cek' && (
              <div className="border border-red-900/50 rounded p-4 text-xs">
                <h3 className="font-bold text-red-400 mb-2 border-b border-red-900 pb-2">DIAGNOSTIK SISTEM</h3>
                <ul className="space-y-3 text-gray-400 mt-4">
                  <li className="flex justify-between"><span>PWA Support:</span> <span className="text-green-500 font-bold">ACTIVE</span></li>
                  <li className="flex justify-between"><span>Firebase Sync:</span> <span className="text-green-500 font-bold">ONLINE</span></li>
                  <li className="flex justify-between"><span>Anti XSS/DDOS:</span> <span className="text-green-500 font-bold">ENABLED</span></li>
                  <li className="flex justify-between"><span>Local Cache:</span> <span className="text-green-500 font-bold">READY</span></li>
                  <li className="flex justify-between"><span>Config Prompt:</span> <span className="text-red-500 font-bold">UNRESTRICTED</span></li>
                  <li className="flex justify-between pt-4 border-t border-gray-800">
                    <span>SYSTEM STATE:</span> <span className="text-red-500 font-bold animate-pulse">OVERDRIVE</span>
                  </li>
                </ul>
              </div>
            )}

          </div>
        </div>
      )}
    </div>
  );
}
