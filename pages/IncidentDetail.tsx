
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Incident, User, IncidentStatus, Severity, ChatMessage } from '../types';
import { CATEGORY_ICONS, SEVERITY_COLORS, STATUS_COLORS } from '../constants';
import { initialUsers } from '../mockData';
import { baseVaultService } from '../services/baseVaultService';
import { zkService } from '../services/zkService';

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
  const [showShareModal, setShowShareModal] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState(false);
  
  // ZK Verification State
  const [isVerifyingZk, setIsVerifyingZk] = useState(false);
  const [zkVerificationResult, setZkVerificationResult] = useState<'idle' | 'valid' | 'invalid'>('idle');
  
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

  const handleVerifyZk = async () => {
    if (!incident?.zkProof) return;
    setIsVerifyingZk(true);
    setZkVerificationResult('idle');
    try {
      // Cryptographic verification call to our ZK Service
      const isValid = await zkService.verifyProof(incident.zkProof);
      setZkVerificationResult(isValid ? 'valid' : 'invalid');
    } catch (e) {
      setZkVerificationResult('invalid');
    } finally {
      setIsVerifyingZk(false);
    }
  };

  const shareUrl = window.location.href;
  const qrData = `CECD-INTEL: ${incident.id} | URI: ${shareUrl}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(qrData)}&bgcolor=0f172a&color=137fec`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopyFeedback(true);
    setTimeout(() => setCopyFeedback(false), 2000);
  };

  return (
    <div className="p-6 md:p-8 flex flex-col gap-6 relative">
      {/* Share Incident Modal */}
      {showShareModal && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-background-dark/80 backdrop-blur-md animate-in fade-in duration-300" onClick={() => setShowShareModal(false)}></div>
          <div className="bg-card-dark border border-border-dark w-full max-w-sm rounded-[3rem] p-8 shadow-2xl relative z-10 animate-in fade-in zoom-in-95 duration-300 flex flex-col items-center gap-6">
            <div className="w-full flex justify-between items-center mb-2">
              <h3 className="text-sm font-black text-white uppercase italic tracking-widest">Share Intel</h3>
              <button onClick={() => setShowShareModal(false)} className="text-text-secondary hover:text-white transition-colors">
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>
            
            <div className="bg-slate-900 p-6 rounded-[2.5rem] border border-primary/30 shadow-glow relative group">
              <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <img src={qrCodeUrl} alt="Incident QR Code" className="w-48 h-48 rounded-2xl relative z-10" />
            </div>

            <div className="flex flex-col items-center gap-1 text-center">
              <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">{incident.id}</span>
              <p className="text-[9px] text-text-secondary font-bold uppercase tracking-tight opacity-60">Scan to access encrypted situation room</p>
            </div>

            <div className="w-full flex flex-col gap-3">
              <button 
                onClick={handleCopyLink}
                className={`w-full py-4 rounded-2xl border flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all ${copyFeedback ? 'bg-emerald-500/10 border-emerald-500/40 text-accent-green' : 'bg-background-dark border-border-dark text-text-secondary hover:border-primary/50'}`}
              >
                <span className="material-symbols-outlined text-sm">{copyFeedback ? 'check_circle' : 'content_copy'}</span>
                {copyFeedback ? 'Link Copied' : 'Copy Direct Link'}
              </button>
              <button 
                onClick={() => setShowShareModal(false)}
                className="w-full py-4 rounded-2xl bg-slate-800 text-white text-[10px] font-black uppercase tracking-widest hover:bg-slate-700 transition-all"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Verification Success/Failure Banner Overlay */}
      {zkVerificationResult !== 'idle' && (
        <div className={`fixed top-24 left-1/2 -translate-x-1/2 z-[1500] px-6 py-3 rounded-full border shadow-2xl animate-in slide-in-from-top-4 duration-500 flex items-center gap-3 backdrop-blur-md ${
          zkVerificationResult === 'valid' ? 'bg-accent-green/20 border-accent-green/40 text-accent-green' : 'bg-accent-red/20 border-accent-red/40 text-accent-red'
        }`}>
          <span className="material-symbols-outlined filled">
            {zkVerificationResult === 'valid' ? 'verified' : 'report_problem'}
          </span>
          <span className="text-sm font-black uppercase tracking-widest italic">
            {zkVerificationResult === 'valid' ? 'ZK-Proof Integrity Verified' : 'ZK-Proof Verification Failed'}
          </span>
          <button onClick={() => setZkVerificationResult('idle')} className="ml-4 opacity-60 hover:opacity-100">
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        </div>
      )}

      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 pb-2 border-b border-border-dark">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 text-sm text-text-secondary">
            <span className="hover:text-primary cursor-pointer transition-colors" onClick={() => navigate('/incidents')}>Emergency Ledger</span>
            <span className="material-symbols-outlined text-xs">chevron_right</span>
            <span className="text-white font-medium">{incident.id}</span>
          </div>
          <div className="flex items-center gap-4">
            <h1 className="text-3xl font-black text-white italic tracking-tight uppercase">{incident.title}</h1>
            {incident.isWhisperMode && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-cyan-500/10 border border-cyan-400/30 rounded-lg text-cyan-400 animate-in fade-in zoom-in duration-500">
                <span className="material-symbols-outlined text-sm filled">shield_lock</span>
                <span className="text-[9px] font-black uppercase tracking-widest">ZK-Shielded Identity</span>
              </div>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-3 text-sm text-text-secondary">
            <span className="flex items-center gap-1 font-bold">
              <span className="material-symbols-outlined text-base">person</span> 
              {incident.isWhisperMode ? 'Shielded Reporter' : (initialUsers.find(u => u.id === incident.reporterId)?.name || 'Command')}
            </span>
            <span className="size-1 rounded-full bg-slate-600"></span>
            <span className="flex items-center gap-1 font-bold"><span className="material-symbols-outlined text-base">schedule</span> {new Date(incident.timestamp).toLocaleString()}</span>
          </div>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => setShowShareModal(true)}
            className="flex items-center justify-center size-10 rounded-lg bg-slate-800 border border-border-dark text-white hover:bg-slate-700 transition-all active:scale-95 shadow-lg"
            title="Share Incident Intel"
          >
            <span className="material-symbols-outlined text-[20px]">share</span>
          </button>
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
          {incident.zkProof && (
             <div className="absolute top-0 right-0 p-2 opacity-20 group-hover:opacity-100 transition-opacity">
               <span className="material-symbols-outlined text-cyan-400 text-xl" title="ZK Proof Attached">encrypted</span>
             </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 flex flex-col gap-6">
          <section className="bg-card-dark rounded-2xl border border-border-dark p-6">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2 uppercase tracking-tight">
              <span className="material-symbols-outlined text-primary">description</span> Situation Analysis
            </h3>
            <p className="text-text-secondary text-sm leading-relaxed mb-6">{incident.description}</p>
            
            {incident.zkProof && (
              <div className="mt-4 p-5 rounded-[2rem] bg-slate-900/50 border border-cyan-500/20 flex flex-col gap-4">
                 <div className="flex items-center justify-between">
                   <div className="flex items-center gap-2">
                     <span className="material-symbols-outlined text-cyan-400 text-lg">verified_user</span>
                     <span className="text-[10px] font-black text-cyan-400 uppercase tracking-widest">Verification Intel (ZK-SNARK)</span>
                   </div>
                   
                   {zkVerificationResult === 'idle' ? (
                     <button 
                       onClick={handleVerifyZk}
                       disabled={isVerifyingZk}
                       className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500/20 transition-all text-[9px] font-black uppercase tracking-widest disabled:opacity-50 shadow-glow"
                     >
                       {isVerifyingZk ? <span className="material-symbols-outlined text-[12px] animate-spin">sync</span> : <span className="material-symbols-outlined text-[12px]">security</span>}
                       {isVerifyingZk ? 'Calculating Proof...' : 'Verify Cryptographic Proof'}
                     </button>
                   ) : (
                     <div className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full border text-[9px] font-black uppercase tracking-widest animate-in fade-in zoom-in duration-300 ${
                       zkVerificationResult === 'valid' ? 'bg-emerald-500/10 text-accent-green border-accent-green/30' : 'bg-accent-red/10 text-accent-red border-accent-red/30'
                     }`}>
                       <span className="material-symbols-outlined text-[12px]">{zkVerificationResult === 'valid' ? 'verified' : 'error'}</span>
                       {zkVerificationResult === 'valid' ? 'Proof Verified' : 'Integrity Failure'}
                     </div>
                   )}
                 </div>
                 
                 <div className="relative group">
                   <div className="absolute inset-0 bg-cyan-400/5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                   <div className="flex flex-col gap-1">
                     <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest ml-1">On-Chain Proof Data</span>
                     <code className="block p-4 text-[9px] font-mono text-slate-400 break-all bg-background-dark/30 rounded-xl border border-border-dark select-all">
                       {incident.zkProof}
                     </code>
                   </div>
                 </div>
              </div>
            )}
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
