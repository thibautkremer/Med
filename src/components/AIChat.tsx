import React, { useState } from 'react';
import { Send, Bot, User, Sparkles, Loader2, MessageSquare, ShieldAlert } from 'lucide-react';
import { UserProfile } from '../types';

interface AIChatProps {
  activeProfile?: UserProfile | null;
}

const SUGGESTED_PROMPTS = [
  "🇫🇷 Doliprane ➔ Quel est l'équivalent exact aux USA ?",
  "Puis-je donner de l'Ibuprofène à un enfant de 15 kg ?",
  "Comment lire une température de 101.5 °F aux USA ?",
  "Quelle différence entre médicament OTC et sur ordonnance (Rx) ?"
];

export default function AIChat({ activeProfile }: AIChatProps) {
  const [messages, setMessages] = useState<{role: 'user' | 'bot', text: string}[]>([
    {
      role: 'bot',
      text: `Bonjour ! Je suis votre assistant pharmacien virtuel franco-américain. Posez-moi vos questions sur les équivalences de médicaments, les posologies, ou la réglementation entre la France et les USA.`
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSend = async (textToSend?: string) => {
    const query = textToSend || input;
    if (!query.trim() || loading) return;

    const userMsg = { role: 'user' as const, text: query };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    if (!textToSend) setInput('');
    setLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updatedMessages,
          profile: activeProfile
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erreur de connexion avec le service IA.");
      }

      const data = await response.json();
      setMessages(prev => [...prev, { role: 'bot', text: data.reply }]);
    } catch (e: any) {
      setMessages(prev => [...prev, { role: 'bot', text: e.message || "Désolé, une erreur s'est produite lors de la communication avec l'assistant IA." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm flex flex-col h-[550px] overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white p-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-white/10 rounded-xl">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-sm">Assistant IA Pharmacien Virtuel</h3>
            <p className="text-[10px] text-emerald-100">
              Conseils franco-américains & Posologies par IA
            </p>
          </div>
        </div>

        {activeProfile && (
          <span className="bg-white/20 text-white font-bold text-[10px] px-2.5 py-1 rounded-full">
            Patient : {activeProfile.name}
          </span>
        )}
      </div>

      {/* Suggested prompts list */}
      <div className="bg-slate-50 border-b border-slate-100 p-2.5 px-4 overflow-x-auto flex gap-2">
        <span className="text-[10px] text-slate-400 font-bold self-center shrink-0 flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-amber-500" /> Suggestions :
        </span>
        {SUGGESTED_PROMPTS.map((prompt, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(prompt)}
            disabled={loading}
            className="text-[10px] bg-white hover:bg-emerald-50 hover:text-emerald-700 text-slate-600 font-medium px-2.5 py-1 rounded-lg border border-slate-200 transition-colors shrink-0 cursor-pointer disabled:opacity-50"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((m, i) => (
          <div key={i} className={`flex gap-3 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {m.role === 'bot' && (
              <div className="w-8 h-8 rounded-full bg-emerald-100 border border-emerald-200 flex items-center justify-center shrink-0 mt-0.5">
                <Bot className="w-4 h-4 text-emerald-700" />
              </div>
            )}

            <div className={`p-3.5 rounded-2xl max-w-[85%] text-xs leading-relaxed ${
              m.role === 'user' 
                ? 'bg-emerald-600 text-white rounded-br-none shadow-sm' 
                : 'bg-slate-50 text-slate-800 border border-slate-100 rounded-bl-none'
            }`}>
              {m.text}
            </div>

            {m.role === 'user' && (
              <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center shrink-0 mt-0.5">
                <User className="w-4 h-4 text-white" />
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex gap-3 justify-start">
            <div className="w-8 h-8 rounded-full bg-emerald-100 border border-emerald-200 flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4 text-emerald-700" />
            </div>
            <div className="p-3 bg-slate-50 text-slate-500 border border-slate-100 rounded-2xl rounded-bl-none text-xs flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
              <span>Réflexion en cours par Gemini IA...</span>
            </div>
          </div>
        )}
      </div>

      {/* Input box */}
      <div className="border-t border-slate-100 p-3 bg-white flex gap-2">
        <input 
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          disabled={loading}
          className="flex-1 p-2.5 px-3.5 bg-slate-50 rounded-xl border border-slate-200 outline-none text-xs text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all disabled:opacity-50"
          placeholder="Posez votre question (ex: Posologie du Doliprane aux USA...)"
        />
        <button 
          onClick={() => handleSend()}
          disabled={loading || !input.trim()}
          className="p-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-all font-bold text-xs flex items-center gap-1 cursor-pointer disabled:opacity-50"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}