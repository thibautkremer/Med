import React, { useState } from 'react';
import { Send, Bot, User } from 'lucide-react';

export default function AIChat() {
  const [messages, setMessages] = useState<{role: 'user' | 'bot', text: string}[]>([]);
  const [input, setInput] = useState('');

  const sendMessage = async () => {
    if (!input.trim()) return;
    const userMsg = {role: 'user' as const, text: input};
    setMessages([...messages, userMsg]);
    setInput('');

    // Call API (placeholder)
    try {
        // const response = await fetch('/api/chat', { ... });
        // const data = await response.json();
        setMessages(prev => [...prev, {role: 'bot', text: 'Fonctionnalité IA en cours de développement...'}]);
    } catch(e) {
        setMessages(prev => [...prev, {role: 'bot', text: 'Erreur lors de la communication avec l\'IA.'}]);
    }
  };

  return (
    <div className="flex flex-col h-[400px]">
      <div className="flex-1 overflow-y-auto space-y-4 p-4">
        {messages.map((m, i) => (
          <div key={i} className={`flex gap-3 ${m.role === 'user' ? 'justify-end' : ''}`}>
            {m.role === 'bot' && <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center"><Bot className="w-5 h-5 text-emerald-600" /></div>}
            <div className={`p-3 rounded-2xl max-w-[80%] text-sm ${m.role === 'user' ? 'bg-emerald-600 text-white' : 'bg-slate-100 dark:bg-slate-800'}`}>
                {m.text}
            </div>
            {m.role === 'user' && <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center"><User className="w-5 h-5 text-slate-600" /></div>}
          </div>
        ))}
      </div>
      <div className="border-t p-4 flex gap-2">
        <input 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            className="flex-1 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 outline-none"
            placeholder="Posez votre question sur les médicaments..."
        />
        <button onClick={sendMessage} className="p-3 bg-emerald-600 text-white rounded-xl">
            <Send className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}