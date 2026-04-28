import React, { useEffect, useState, useRef } from 'react';
import { useStore } from '../lib/store';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, query, orderBy, onSnapshot, addDoc, updateDoc, doc } from 'firebase/firestore';
import { Send, ThumbsUp, ThumbsDown, User, Bot, Loader } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { askAI } from '../lib/ai';

export default function ChatArea() {
  const { profile, currentChatId } = useStore();
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!currentChatId || !profile) return;
    
    // Check locally cached first for offline pseudo-support
    const cached = localStorage.getItem(`chat_${currentChatId}`);
    if (cached) setMessages(JSON.parse(cached));
    
    const q = query(
      collection(db, 'chats', currentChatId, 'messages'),
      orderBy('createdAt', 'asc')
    );
    
    const unsub = onSnapshot(q, (snap) => {
      const parsed = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setMessages(parsed);
      localStorage.setItem(`chat_${currentChatId}`, JSON.stringify(parsed));
      setTimeout(() => endRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    }, (error) => {
      try { handleFirestoreError(error, OperationType.GET, `chats/${currentChatId}/messages`); } catch(e){}
    });
    
    return unsub;
  }, [currentChatId, profile]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !currentChatId || !profile || isLoading) return;

    if (profile.limitRemaining <= 0) {
      alert("Limit habis.");
      return;
    }

    const content = input;
    setInput('');
    setIsLoading(true);

    try {
      // 1. Save user message
      await addDoc(collection(db, 'chats', currentChatId, 'messages'), {
        userId: profile.uid,
        role: 'user',
        content,
        createdAt: Date.now(),
        feedback: 'none'
      });
      
      // Update chat title if it's the first message
      if (messages.length === 0) {
        await updateDoc(doc(db, 'chats', currentChatId), {
           title: content.substring(0, 30) + '...',
           updatedAt: Date.now()
        });
      }

      // Decrement limit
      await updateDoc(doc(db, 'users', profile.uid), {
        limitRemaining: profile.limitRemaining - 1,
        updatedAt: Date.now()
      });

      // 2. Prepare AI request context
      const history = messages.map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content
      }));
      history.push({ role: 'user', content });

      // Determine model based on settings
      let selectedModel: 'puter' | 'gemini' | 'deepseek' | 'grok' = 'puter';
      let apiKey = '';

      if (profile.settings?.puterJsActive) {
        selectedModel = 'puter';
      } else if (profile.settings?.geminiApiKey) {
        selectedModel = 'gemini';
        apiKey = profile.settings.geminiApiKey;
      } else if (profile.settings?.deepseekApiKey) {
        selectedModel = 'deepseek';
        apiKey = profile.settings.deepseekApiKey;
      } else if (profile.settings?.grokApiKey) {
        selectedModel = 'grok';
        apiKey = profile.settings.grokApiKey;
      }

      // 3. Get AI Response
      const aiResponseText = await askAI({ model: selectedModel, messages: history, apiKey });

      // 4. Save AI Response
      await addDoc(collection(db, 'chats', currentChatId, 'messages'), {
        userId: profile.uid,
        role: 'ai',
        content: aiResponseText,
        createdAt: Date.now(),
        feedback: 'none'
      });
      
      await updateDoc(doc(db, 'chats', currentChatId), {
         updatedAt: Date.now()
      });

    } catch (err) {
      console.error(err);
      try {
        await addDoc(collection(db, 'chats', currentChatId, 'messages'), {
          userId: profile.uid,
          role: 'ai',
          content: 'SYSTEM FAILURE: Akses ditolak atau terjadi kesalahan koneksi. ' + String(err),
          createdAt: Date.now(),
          feedback: 'none'
        });
      } catch(e){}
    } finally {
      setIsLoading(false);
    }
  };

  const handleFeedback = async (msgId: string, type: 'like' | 'dislike') => {
    if (!currentChatId) return;
    try {
      await updateDoc(doc(db, 'chats', currentChatId, 'messages', msgId), {
        feedback: type
      });
    } catch(err) {
      try { handleFirestoreError(err, OperationType.UPDATE, `messages`); } catch(e){}
    }
  };

  if (!currentChatId) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-500">
        Pilih atau buat sesi chat di sebelah kiri.
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0a0a0a] relative">
      <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex gap-4 max-w-4xl mx-auto ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`w-8 h-8 rounded shrink-0 flex items-center justify-center ${msg.role === 'user' ? 'bg-gray-700' : 'bg-red-900 border border-red-500'}`}>
              {msg.role === 'user' ? <User size={16} /> : <Bot size={16} className="text-red-400" />}
            </div>
            <div className={`flex flex-col gap-2 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
              <div 
                className={`px-4 py-3 rounded-lg max-w-full overflow-x-auto
                  ${msg.role === 'user' 
                    ? 'bg-gray-800 text-gray-200' 
                    : 'bg-[#111] border border-red-900 text-red-100 shadow-[0_0_10px_rgba(153,27,27,0.1)]'
                  }`}
              >
                {msg.role === 'ai' ? (
                  <div className="markdown-body text-sm leading-relaxed">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                ) : (
                  <div className="text-sm whitespace-pre-wrap">{msg.content}</div>
                )}
              </div>
              
              {msg.role === 'ai' && (
                <div className="flex gap-2 text-gray-500">
                  <button onClick={() => handleFeedback(msg.id, 'like')} className={`hover:text-red-500 transition ${msg.feedback === 'like' ? 'text-red-500' : ''}`}>
                    <ThumbsUp size={14} />
                  </button>
                  <button onClick={() => handleFeedback(msg.id, 'dislike')} className={`hover:text-red-500 transition ${msg.feedback === 'dislike' ? 'text-red-500' : ''}`}>
                    <ThumbsDown size={14} />
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex gap-4 max-w-4xl mx-auto">
            <div className="w-8 h-8 rounded shrink-0 flex items-center justify-center bg-red-900 border border-red-500">
              <Bot size={16} className="text-red-400" />
            </div>
            <div className="flex items-center text-red-500 gap-2">
              <Loader className="animate-spin" size={16} />
              <span className="text-xs tracking-widest uppercase">Memproses data...</span>
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      <div className="p-4 bg-[#0a0a0a] border-t border-red-900">
        <form onSubmit={sendMessage} className="max-w-4xl mx-auto relative flex items-end bg-gray-900 rounded-xl overflow-hidden border border-gray-700 focus-within:border-red-500 transition shadow-lg">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage(e);
              }
            }}
            placeholder="Perintah..."
            className="w-full bg-transparent p-4 outline-none text-gray-100 placeholder-gray-500 resize-none max-h-48 min-h-[56px] text-sm"
            rows={1}
          />
          <button 
            type="submit" 
            disabled={isLoading || !input.trim()}
            className="p-4 text-red-500 hover:text-red-400 disabled:text-gray-600 transition h-full shrink-0"
          >
            <Send size={20} />
          </button>
        </form>
        <div className="text-center mt-2 text-[10px] text-red-900 tracking-widest">
          SYSTEM: ONLINE // LIMIT: {profile?.limitRemaining}
        </div>
      </div>
    </div>
  );
}
