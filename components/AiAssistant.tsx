
import React, { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { aiService } from '../services/aiService';
import { Incident } from '../types';

interface AiAssistantProps {
  incidents: Incident[];
  isWhisperActive?: boolean;
}

const AiAssistant: React.FC<AiAssistantProps> = ({ incidents, isWhisperActive = false }) => {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{role: 'user' | 'assistant', text: string}[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Detect current incident from URL using live incidents prop
  const [currentIncident, setCurrentIncident] = useState<Incident | undefined>();

  useEffect(() => {
    const match = location.pathname.match(/\/incidents\/(INC-[\w-]+)/);
    if (match && match[1]) {
      const found = incidents.find(i => i.id === match[1]);
      setCurrentIncident(found);
    } else {
      setCurrentIncident(undefined);
    }
  }, [location.pathname, incidents]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  // Combined logic: Whisper mode is active if viewing a whisper incident OR if global whisper is active
  const effectiveWhisperActive = isWhisperActive || !!currentIncident?.isWhisperMode;

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isTyping) return;

    const userMsg = input.trim();
    setInput('');
    
    // UI update for user message
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsTyping(true);

    try {
      // Prepend ZK-proof indicator to signify an anonymous query to the AI service
      const whisperPrefix = effectiveWhisperActive ? "[ZK-PROOF: ANONYMOUS-QUERY-HANDSHAKE] " : "";
      const response = await aiService.getAiChatResponse(whisperPrefix + userMsg, currentIncident);
      setMessages(prev => [...prev, { role: 'assistant', text: response }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', text: "Service temporarily unavailable. Please try again later." }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {isOpen ? (
        <div className="w-80 h-[450px] bg-card-dark border border-border-dark rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
          <div className={`${effectiveWhisperActive ? 'bg-cyan-600' : 'bg-primary'} p-4 flex items-center justify-between text-white transition-colors duration-500`}>
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined filled">{effectiveWhisperActive ? 'shield_lock' : 'smart_toy'}</span>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-[11px] uppercase tracking-wider leading-none">
                    {effectiveWhisperActive ? 'Anonymous AI' : 'Tactical AI'}
                  </span>
                  {effectiveWhisperActive && (
                    <span className="flex size-1.5 rounded-full bg-white animate-pulse"></span>
                  )}
                </div>
                {currentIncident && <span className="text-[9px] opacity-70 mt-1 uppercase font-black truncate max-w-[150px]">{currentIncident.title}</span>}
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="hover:bg-white/10 p-1 rounded-lg transition-colors">
              <span className="material-symbols-outlined text-sm">close</span>
            </button>
          </div>
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 custom-scrollbar bg-background-dark/20">
            {messages.length === 0 && (
              <div className="text-center py-6 flex flex-col gap-2">
                <span className={`material-symbols-outlined ${effectiveWhisperActive ? 'text-cyan-400/30' : 'text-primary/30'} text-4xl`}>
                  {effectiveWhisperActive ? 'security' : 'radar'}
                </span>
                <p className="text-[10px] text-text-secondary uppercase font-black tracking-widest px-4">
                  {effectiveWhisperActive 
                    ? "Anonymity Protocol Active. Encrypted connection established." 
                    : (currentIncident 
                        ? `I am ready to assist with the ${currentIncident.category} incident in ${currentIncident.locationName}. How can I help?` 
                        : "Global Emergency Assistant Online. State your query.")
                  }
                </p>
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] p-3 rounded-2xl text-xs leading-relaxed ${
                  m.role === 'user' 
                    ? (effectiveWhisperActive ? 'bg-cyan-600 shadow-[0_0_10px_rgba(8,145,178,0.4)]' : 'bg-primary shadow-glow') + ' text-white rounded-tr-none' 
                    : 'bg-slate-800 text-slate-200 rounded-tl-none border border-border-dark'
                }`}>
                  {m.text}
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-slate-800 text-slate-400 p-3 rounded-2xl rounded-tl-none flex gap-1">
                  <span className={`w-1.5 h-1.5 ${effectiveWhisperActive ? 'bg-cyan-400' : 'bg-primary'}/50 rounded-full animate-bounce`}></span>
                  <span className={`w-1.5 h-1.5 ${effectiveWhisperActive ? 'bg-cyan-400' : 'bg-primary'}/50 rounded-full animate-bounce delay-75`}></span>
                  <span className={`w-1.5 h-1.5 ${effectiveWhisperActive ? 'bg-cyan-400' : 'bg-primary'}/50 rounded-full animate-bounce delay-150`}></span>
                </div>
              </div>
            )}
          </div>
          <form onSubmit={handleSend} className="p-3 border-t border-border-dark bg-[#111a22] flex gap-2">
            <input 
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder={effectiveWhisperActive ? "Transmit anonymous query..." : "Transmit query..."}
              className={`flex-1 bg-background-dark border ${effectiveWhisperActive ? 'border-cyan-500/30' : 'border-border-dark'} rounded-xl px-4 py-2.5 text-xs text-white focus:ring-1 focus:ring-primary outline-none placeholder:text-text-secondary/30`}
            />
            <button type="submit" className={`${effectiveWhisperActive ? 'bg-cyan-600' : 'bg-primary'} text-white size-10 rounded-xl flex items-center justify-center shadow-glow active:scale-95 transition-all`}>
              <span className="material-symbols-outlined text-sm">send</span>
            </button>
          </form>
        </div>
      ) : (
        <button 
          onClick={() => setIsOpen(true)}
          className={`size-14 ${effectiveWhisperActive ? 'bg-cyan-600 shadow-[0_0_20px_rgba(8,145,178,0.6)]' : 'bg-primary shadow-glow'} text-white rounded-2xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center group relative`}
        >
          <span className="material-symbols-outlined text-3xl filled group-hover:rotate-12 transition-transform">
            {effectiveWhisperActive ? 'shield_lock' : 'smart_toy'}
          </span>
          <div className={`absolute -top-1 -right-1 size-4 ${effectiveWhisperActive ? 'bg-cyan-300' : 'bg-accent-red'} rounded-full border-2 border-background-dark animate-pulse`}></div>
        </button>
      )}
    </div>
  );
};

export default AiAssistant;
