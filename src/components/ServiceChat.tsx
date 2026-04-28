import React, { useEffect, useState, useRef } from 'react';
import { useStore } from '../lib/store';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, query, orderBy, onSnapshot, addDoc, doc, setDoc } from 'firebase/firestore';
import { X, Send, User, ShieldAlert } from 'lucide-react';

export default function ServiceChat({ onClose }: { onClose: () => void }) {
  const { profile } = useStore();
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!profile) return;
    
    // Ensure chat doc exists
    setDoc(doc(db, 'adminChats', profile.uid), {
      userId: profile.uid,
      updatedAt: Date.now()
    }, { merge: true }).catch(() => {});

    const q = query(
      collection(db, 'adminChats', profile.uid, 'adminMessages'),
      orderBy('createdAt', 'asc')
    );
    
    const unsub = onSnapshot(q, (snap) => {
      setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setTimeout(() => endRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    }, (error) => {
      try { handleFirestoreError(error, OperationType.GET, `adminMessages`); } catch(e){}
    });
    
    return unsub;
  }, [profile]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !profile) return;

    const content = input;
    setInput('');

    try {
      await addDoc(collection(db, 'adminChats', profile.uid, 'adminMessages'), {
        senderId: profile.uid,
        role: 'user',
        content,
        createdAt: Date.now()
      });
      
      await setDoc(doc(db, 'adminChats', profile.uid), {
        userId: profile.uid,
        updatedAt: Date.now()
      }, { merge: true });
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="absolute inset-y-0 right-0 w-80 bg-[#111] border-l border-red-900 z-30 shadow-2xl flex flex-col font-mono text-sm max-w-full">
      <div className="p-4 border-b border-red-900 flex justify-between items-center bg-gray-900">
        <h2 className="text-red-500 font-bold tracking-widest">CUSTOMER SERVICE</h2>
        <button onClick={onClose} className="text-gray-500 hover:text-red-500">
          <X size={20} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`w-6 h-6 rounded shrink-0 flex items-center justify-center ${msg.role === 'user' ? 'bg-gray-700' : 'bg-red-900'}`}>
              {msg.role === 'user' ? <User size={12} /> : <ShieldAlert size={12} />}
            </div>
            <div className={`px-3 py-2 rounded-lg max-w-[80%] ${msg.role === 'user' ? 'bg-gray-800 text-gray-200' : 'bg-red-950 border border-red-900 text-red-100'}`}>
              {msg.content}
            </div>
          </div>
        ))}
        <div ref={endRef} />
      </div>

      <form onSubmit={sendMessage} className="p-3 border-t border-red-900 bg-black flex gap-2">
        <input 
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Pesan..."
          className="flex-1 bg-gray-900 text-white rounded px-3 py-2 outline-none focus:border focus:border-red-500"
        />
        <button type="submit" disabled={!input} className="bg-red-900 text-white p-2 rounded hover:bg-red-700 disabled:opacity-50">
          <Send size={16} />
        </button>
      </form>
    </div>
  );
}
