
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Incident, User, IncidentStatus, Severity, ChatMessage } from '../types';
import { CATEGORY_ICONS, SEVERITY_COLORS, STATUS_COLORS } from '../constants';
import { initialUsers } from '../mockData';
import { baseVaultService } from '../services/baseVaultService';

interface IncidentDetailProps {
  incidents: Incident[];
  setIncidents: React.Dispatch<React.SetStateAction<Incident[]>>;
  currentUser: User;
}

const IncidentDetail: React.FC<IncidentDetailProps> = ({ incidents, setIncidents, currentUser }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [incident, setIncident] = useState<Incident | undefined>(incidents.find(i => i.id === id));
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isDonating, setIsDonating] = useState(false);
  const [donationAmount, setDonationAmount] = useState('0.1');
  const [donationCurrency, setDonationCurrency] = useState<'ETH' | 'USDC'>('ETH');
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!incident) return;
    setChatMessages([
      { id: '1', incidentId: incident.id, senderId: 'user-1', text: `Global Command established. Node active for ${incident.locationName}.`, timestamp: incident.timestamp + 1000 },
      { id: '2', incidentId: incident.id, senderId: 'user-2', text: `Responders identified in the sector. Initial analysis complete.`, timestamp: incident.timestamp + 5000 },
    ]);
  }, [incident]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  if (!incident) {
    return <div className="p-10 text-center">Incident not found. <button onClick={() => navigate('/incidents')} className="text-primary hover:underline">Go back</button></div>;
  }

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      incidentId: incident.id,
      senderId: currentUser.id,
      text: inputText,
      timestamp: Date.now(),
    };
    setChatMessages([...chatMessages, newMessage]);
    setInputText('');
  };

  const handleDonation = async () => {
    setIsDonating(true);
    try {
      await baseVaultService.initiateBaseDonation(incident.id, donationAmount, donationCurrency, 'BASE_TREASURY_RECIPIENT');
      const systemMsg: ChatMessage = {
        id: `sys-${Date.now()}`,
        incidentId: incident.id,
        senderId: 'system',
        text: `COMMUNITY SUPPORT: A donation of ${donationAmount} ${donationCurrency} has been confirmed on the Base Mainnet for this incident.`,
        timestamp: Date.now(),
        isSystem: true
      };
      setChatMessages(prev => [...prev, systemMsg]);
      alert(`Thank you for your support! ${donationAmount} ${donationCurrency} has been sent to the Base Vault for local relief.`);
    } catch (e) {
      alert("Donation broadcast failed. Please verify your Base wallet connection.");
    } finally {
      setIsDonating(false);
    }
  };

  const updateStatus = (newStatus: IncidentStatus) => {
    const updatedIncidents = incidents.map(i => i.id === incident.id ? { ...i, status: newStatus } : i);
    setIncidents(updatedIncidents);
    setIncident({ ...incident, status: newStatus });
  };

  return (
    <div className="p-6 md:p-8 flex flex-col gap-6 relative">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 pb-2 border-b border-border-dark">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 text-sm text-text-secondary">
            <span className="hover:text-primary cursor-pointer transition-colors" onClick={() => navigate('/incidents')}>Emergency Ledger</span>
            <span className="material-symbols-outlined text-xs">chevron_right</span>
            <span className="text-white font-medium">{incident.id}</span>
          </div>
          <h1 className="text-3xl font-black text-white italic tracking-tight uppercase">{incident.title}</h1>
          <div className="flex flex-wrap items-center gap-3 text-sm text-text-secondary">
            <span className="flex items-center gap-1 font-bold"><span className="material-symbols-outlined text-base">person</span> Authorized by {initialUsers.find(u => u.id === incident.reporterId)?.name || 'Command'}</span>
            <span className="size-1 rounded-full bg-slate-600"></span>
            <span className="flex items-center gap-1 font-bold"><span className="material-symbols-outlined text-base">schedule</span> {new Date(incident.timestamp).toLocaleString()}</span>
          </div>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-4 h-10 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm shadow-glow transition-all active:scale-95" onClick={() => {
            const el = document.getElementById('donation-section');
            el?.scrollIntoView({ behavior: 'smooth' });
          }}>
            <span className="material-symbols-outlined text-[20px]">volunteer_activism</span>
            Donate Now
          </button>
          <button className="flex items-center gap-2 px-4 h-10 rounded-lg bg-accent-red hover:bg-red-700 text-white font-bold text-sm shadow-glow-red transition-all">
            <span className="material-symbols-outlined text-[20px]">warning</span>
            Escalate
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-card-dark border border-border-dark flex flex-col gap-2">
          <p className="text-text-secondary text-[10px] font-bold uppercase tracking-wider">Tactical Status</p>
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border w-fit ${STATUS_COLORS[incident.status]}`}>
            {incident.status}
          </span>
        </div>
        <div className="p-5 rounded-2xl bg-card-dark border-l-4 border-l-red-500 border-y border-r border-border-dark flex flex-col gap-2">
          <p className="text-text-secondary text-[10px] font-bold uppercase tracking-wider">Severity Rating</p>
          <p className="text-accent-red text-2xl font-black uppercase">{incident.severity}</p>
        </div>
        <div className="p-5 rounded-2xl bg-card-dark border border-border-dark flex flex-col gap-2 relative overflow-hidden group">
          <p className="text-text-secondary text-[10px] font-bold uppercase tracking-wider relative z-10">Base Vault Allocation</p>
          <div className="mt-1 relative z-10 flex items-end gap-2">
            <p className="text-white text-2xl font-black font-mono leading-tight">1.25</p>
            <p className="text-[10px] text-primary font-bold mb-1 uppercase">ETH</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 flex flex-col gap-6">
          <section className="bg-card-dark rounded-2xl border border-border-dark p-6">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2 uppercase tracking-tight">
              <span className="material-symbols-outlined text-primary">description</span> Situation Analysis
            </h3>
            <p className="text-text-secondary text-sm leading-relaxed mb-6">{incident.description}</p>
          </section>

          <section id="donation-section" className="bg-gradient-to-br from-primary/10 to-emerald-500/5 rounded-2xl border border-primary/20 p-8 flex flex-col md:flex-row items-center gap-8">
            <div className="flex flex-col gap-3 flex-1">
              <div className="bg-primary/20 size-12 rounded-2xl flex items-center justify-center text-primary border border-primary/30">
                <span className="material-symbols-outlined text-2xl">rocket_launch</span>
              </div>
              <h3 className="text-xl font-black text-white uppercase italic tracking-tight">Global Support Channel</h3>
              <p className="text-xs text-text-secondary leading-relaxed">
                Directly contribute assets to the relief efforts on the <strong>Base chain</strong>. Donations are immutably logged and disbursed to verified responders via the Base Vault's multi-sig decentralized governance.
              </p>
            </div>
            <div className="bg-card-dark border border-border-dark p-6 rounded-3xl w-full md:w-80 shadow-2xl flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest ml-1 opacity-60">Asset & Amount</label>
                <div className="flex gap-2">
                  {['ETH', 'USDC'].map(cur => (
                    <button 
                      key={cur} 
                      onClick={() => setDonationCurrency(cur as 'ETH' | 'USDC')}
                      className={`flex-1 py-2 rounded-xl text-xs font-black transition-all border ${donationCurrency === cur ? 'bg-primary border-primary text-white shadow-glow' : 'bg-background-dark border-border-dark text-text-secondary hover:border-slate-500'}`}
                    >
                      {cur}
                    </button>
                  ))}
                </div>
                <div className="relative mt-2">
                  <input 
                    type="number" 
                    step={donationCurrency === 'ETH' ? '0.01' : '1'}
                    value={donationAmount}
                    onChange={(e) => setDonationAmount(e.target.value)}
                    className="w-full bg-background-dark border border-border-dark rounded-xl px-4 py-2.5 text-sm text-white focus:ring-1 focus:ring-primary outline-none font-mono"
                    placeholder="0.00"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-text-secondary">{donationCurrency}</span>
                </div>
              </div>
              <button 
                onClick={handleDonation}
                disabled={isDonating}
                className="w-full py-4 rounded-2xl bg-primary hover:bg-primary-dark text-white font-black text-[11px] uppercase tracking-widest shadow-glow active:scale-95 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
              >
                {isDonating ? <span className="material-symbols-outlined animate-spin">sync</span> : <span className="material-symbols-outlined text-sm">payments</span>}
                {isDonating ? 'Broadcasting...' : `Donate ${donationCurrency} to relief`}
              </button>
            </div>
          </section>

          <section className="bg-card-dark rounded-2xl border border-border-dark overflow-hidden flex flex-col h-[400px]">
            <div className="px-6 py-4 border-b border-border-dark bg-[#111a22]">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 italic">
                <span className="material-symbols-outlined text-primary">forum</span> Secure Command Channel
              </h3>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-background-dark/20 custom-scrollbar">
              {chatMessages.map(msg => (
                <div key={msg.id} className={`flex gap-3 ${msg.senderId === currentUser.id ? 'flex-row-reverse' : ''} ${msg.isSystem ? 'justify-center w-full' : ''}`}>
                  {!msg.isSystem && <div className="size-8 rounded-full bg-slate-800 bg-cover shrink-0 border border-white/10" style={{ backgroundImage: `url(https://picsum.photos/seed/${msg.senderId}/100/100)` }}></div>}
                  <div className={`flex flex-col gap-1 ${msg.isSystem ? 'w-full items-center' : msg.senderId === currentUser.id ? 'items-end max-w-[70%]' : 'max-w-[70%]'}`}>
                    {!msg.isSystem && (
                      <div className="flex items-center gap-2 text-[10px] text-text-secondary font-bold">
                        <span>{initialUsers.find(u => u.id === msg.senderId)?.name || 'Responser'}</span>
                      </div>
                    )}
                    <div className={`p-3 text-sm leading-relaxed rounded-2xl ${
                      msg.isSystem ? 'bg-primary/10 text-primary border border-primary/20 text-center text-[10px] font-black uppercase italic' :
                      msg.senderId === currentUser.id 
                        ? 'bg-primary text-white rounded-tr-none shadow-glow' 
                        : 'bg-card-hover text-text-primary rounded-tl-none border border-border-dark'
                    }`}>
                      {msg.text}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>
            <form onSubmit={handleSendMessage} className="p-4 bg-[#111a22] border-t border-border-dark flex items-center gap-3">
              <input 
                value={inputText}
                onChange={e => setInputText(e.target.value)}
                className="flex-1 bg-background-dark border border-border-dark rounded-xl px-4 py-2.5 text-sm text-white focus:ring-1 focus:ring-primary outline-none"
                placeholder="Submit tactical update..."
              />
              <button type="submit" className="bg-primary hover:bg-primary-dark text-white p-2.5 rounded-xl transition-all shadow-glow">
                <span className="material-symbols-outlined">send</span>
              </button>
            </form>
          </section>
        </div>

        <div className="lg:col-span-4 flex flex-col gap-6">
          <div className="bg-card-dark rounded-2xl border border-border-dark p-5">
            <h4 className="text-xs font-bold text-text-secondary uppercase tracking-widest mb-4">Tactical Actions</h4>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => updateStatus(IncidentStatus.ACKNOWLEDGED)} className="flex flex-col items-center gap-2 p-4 rounded-xl bg-background-dark border border-border-dark hover:border-primary/50 transition-all group">
                <span className="material-symbols-outlined text-primary group-hover:scale-110 transition-transform">check_circle</span>
                <span className="text-[10px] font-bold text-white uppercase tracking-tight">Acknowledge</span>
              </button>
              <button onClick={() => updateStatus(IncidentStatus.IN_PROGRESS)} className="flex flex-col items-center gap-2 p-4 rounded-xl bg-background-dark border border-border-dark hover:border-primary/50 transition-all group">
                <span className="material-symbols-outlined text-blue-400 group-hover:scale-110 transition-transform">bolt</span>
                <span className="text-[10px] font-bold text-white uppercase tracking-tight">Respond</span>
              </button>
              <button onClick={() => updateStatus(IncidentStatus.RESOLVED)} className="flex flex-col items-center gap-2 p-4 rounded-xl bg-background-dark border border-border-dark hover:border-emerald-500/50 transition-all group">
                <span className="material-symbols-outlined text-accent-green group-hover:scale-110 transition-transform">task_alt</span>
                <span className="text-[10px] font-bold text-white uppercase tracking-tight">Resolve</span>
              </button>
              <button onClick={() => navigate('/incidents')} className="flex flex-col items-center gap-2 p-4 rounded-xl bg-background-dark border border-border-dark hover:border-primary/50 transition-all group">
                <span className="material-symbols-outlined text-text-secondary group-hover:scale-110 transition-transform">close</span>
                <span className="text-[10px] font-bold text-white uppercase tracking-tight">Close</span>
              </button>
            </div>
          </div>

          <div className="bg-card-dark rounded-2xl border border-border-dark overflow-hidden shadow-xl">
             <div className="h-48 bg-slate-800 relative w-full group">
                <div className="absolute inset-0 bg-cover bg-center transition-transform group-hover:scale-110 opacity-40 grayscale" style={{ backgroundImage: `url('https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&q=80&w=600')` }}></div>
                <div className="absolute inset-0 flex items-center justify-center">
                    <span className="material-symbols-outlined text-accent-red text-5xl drop-shadow-xl relative z-10">location_on</span>
                </div>
             </div>
             <div className="p-4 border-t border-border-dark">
                <h4 className="text-sm font-bold text-white mb-1 uppercase tracking-tight">{incident.locationName}</h4>
                <p className="text-xs text-text-secondary uppercase font-bold tracking-wider opacity-60">Strategic Sector Center</p>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IncidentDetail;
