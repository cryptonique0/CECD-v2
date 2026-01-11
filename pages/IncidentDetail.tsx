import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Incident, User, IncidentStatus, Severity, ChatMessage, PlaybookPlan, PlaybookStep } from '../types';
import { CATEGORY_ICONS, SEVERITY_COLORS, STATUS_COLORS } from '../constants';
import { initialUsers } from '../mockData';
import { baseVaultService } from '../services/baseVaultService';
import { zkService } from '../services/zkService';
import { notificationService } from '../services/notificationService';
import { playbookService } from '../services/playbookService';
import { volunteerOptimizationService, SuggestedSquad, HandoffSuggestion } from '../services/volunteerOptimizationService';
import { stepDonationsService } from '../services/stepDonationsService';
import { auditTrailService } from '../services/auditTrailService';
import { auditTrailService, AuditEvent, IncidentTimeline } from '../services/auditTrailService';
import { secureRoomService } from '../services/secureRoomService';
import { incidentPrivacyService } from '../services/incidentPrivacyService';
import { disclosureService } from '../services/disclosureService';
import { evidenceService, Evidence } from '../services/evidenceService';
import { multiSigService, MultiSigProposal } from '../services/multiSigService';
import { resourceLogisticsService, Asset } from '../services/resourceLogisticsService';

interface IncidentDetailProps {
  incidents: Incident[];
  setIncidents: React.Dispatch<React.SetStateAction<Incident[]>>;
  currentUser: User;
  volunteers: User[];
}

const IncidentDetail: React.FC<IncidentDetailProps> = ({ incidents, setIncidents, currentUser, volunteers }) => {
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
  const [playbook, setPlaybook] = useState<PlaybookPlan | null>(null);
  const [nowTick, setNowTick] = useState<number>(Date.now());
  
  // ZK Verification State
  const [isVerifyingZk, setIsVerifyingZk] = useState(false);
  const [zkVerificationResult, setZkVerificationResult] = useState<'idle' | 'valid' | 'invalid'>('idle');
  const [showToast, setShowToast] = useState(false);
  
  // Volunteer optimization state
  const [suggestedSquads, setSuggestedSquads] = useState<SuggestedSquad[]>([]);
  const [handoffSuggestions, setHandoffSuggestions] = useState<HandoffSuggestion[]>([]);
  const [auditTimeline, setAuditTimeline] = useState<IncidentTimeline | undefined>();
  const [evidence, setEvidence] = useState<Evidence[]>([]);
  const [criticalProposals, setCriticalProposals] = useState<MultiSigProposal[]>([]);
  const [selectedEvidence, setSelectedEvidence] = useState<Evidence | null>(null);
  const [evidenceDescription, setEvidenceDescription] = useState('');
  const [evidenceCategory, setEvidenceCategory] = useState<'photo' | 'video' | 'document' | 'audio' | 'other'>('photo');
  const [lastEphemeralToken, setLastEphemeralToken] = useState<string | null>(null);
  const [disclosureAt, setDisclosureAt] = useState<string>('');
  const [incidentAssets, setIncidentAssets] = useState<Asset[]>([]);

  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!incident) return;
    setChatMessages([
      { id: '1', incidentId: incident.id, senderId: 'user-1', text: `Global Command established. Node active for ${incident.locationName}.`, timestamp: incident.timestamp + 1000 },
      { id: '2', incidentId: incident.id, senderId: 'user-2', text: `Responders identified in the sector. Initial analysis complete.`, timestamp: incident.timestamp + 5000 },
    ]);

    setPlaybook(playbookService.generatePlaybook(incident, volunteers));
    
    // Generate suggested squads and handoffs
    const squads = volunteerOptimizationService.suggestSquads(incident, volunteers);
    setSuggestedSquads(squads);
    
    const assignedResponders = volunteers.filter(v => incident.assignedResponders.includes(v.id));
    const unassignedIncidents = []; // In a real app, fetch other incidents not yet covered
    const handoffs = volunteerOptimizationService.suggestHandoffs(
      assignedResponders.length > 0 ? [incident] : [],
      assignedResponders[0] || volunteers[0],
      unassignedIncidents,
      volunteers
    );
    setHandoffSuggestions(handoffs);    
    // Initialize audit trail
    if (!auditTrailService.getTimeline(incident.id)) {
      auditTrailService.initializeTimeline(incident.id);
    }
    setAuditTimeline(auditTrailService.getTimeline(incident.id));

    // Initialize secure room for incident
    secureRoomService.createRoom(incident.id);
    
    // Record incident opened in audit trail
    auditTrailService.recordEvent(incident.id, currentUser.name, 'INCIDENT_OPENED', `Opened by ${currentUser.name} (${currentUser.role})`);
    
    // Fetch evidence for this incident
    const incidentEvidence = evidenceService.getIncidentEvidence(incident.id);
    setEvidence(incidentEvidence);
    
    // Fetch critical proposals for this incident
    const proposals = multiSigService.getIncidentProposals(incident.id);
    setCriticalProposals(proposals);

    setIncidentAssets(resourceLogisticsService.getIncidentAssets(incident.id));
  }, [incident, volunteers, currentUser]);

  useEffect(() => {
    const id = setInterval(() => setNowTick(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  // Auto-publish scheduled disclosures
  useEffect(() => {
    const timer = setInterval(() => {
      disclosureService.tickAutoPublish(
        (incidentId: string) => incidents.find(i => i.id === incidentId),
        (updated: Incident) => {
          setIncident(updated);
          setIncidents(prev => prev.map(i => i.id === updated.id ? updated : i));
        }
      );
    }, 10000); // check every 10s
    return () => clearInterval(timer);
  }, [incidents, setIncidents]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // Auto-hide verification results
  useEffect(() => {
    if (zkVerificationResult !== 'idle') {
      const timer = setTimeout(() => {
        setZkVerificationResult('idle');
        setShowToast(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [zkVerificationResult]);

  if (!incident) {
    return <div className="p-10 text-center">Incident not found. <button onClick={() => navigate('/incidents')} className="text-primary hover:underline">Go back</button></div>;
  }

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    let newMessage: ChatMessage;
    try {
      const token = lastEphemeralToken;
      const canSecure = token ? secureRoomService.validateKey(incident.id, token) : false;
      if (canSecure) {
        const ct = secureRoomService.encrypt(incident.id, inputText, token!);
        newMessage = {
          id: Date.now().toString(),
          incidentId: incident.id,
          senderId: currentUser.id,
          ciphertext: ct,
          isSecure: true,
          timestamp: Date.now(),
        };
        auditTrailService.recordEvent(incident.id, currentUser.name, 'SECURE_MSG_SENT', 'Encrypted message sent');
      } else {
        newMessage = {
          id: Date.now().toString(),
          incidentId: incident.id,
          senderId: currentUser.id,
          text: inputText,
          timestamp: Date.now(),
        };
      }
    } catch (err) {
      newMessage = {
        id: Date.now().toString(),
        incidentId: incident.id,
        senderId: currentUser.id,
        text: inputText,
        timestamp: Date.now(),
      };
    }
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

  const formatRemaining = (dueAt: number) => {
    const diff = Math.max(0, dueAt - nowTick);
    const mins = Math.floor(diff / 60000);
    const secs = Math.floor((diff % 60000) / 1000);
    return `${mins}m ${secs.toString().padStart(2, '0')}s`;
  };

  const handleStepStatus = (stepId: string, status: PlaybookStep['status']) => {
    setPlaybook(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        steps: prev.steps.map(s => s.id === stepId ? { ...s, status } : s)
      };
    });
  };

  const lateSteps = playbook?.steps.filter(s => nowTick > s.dueAt && s.status !== 'Done') || [];

  const handleVerifyZk = async () => {
    if (!incident?.zkProof) return;
    setIsVerifyingZk(true);
    setZkVerificationResult('idle');
    setShowToast(false);

    try {
      const isValid = await zkService.verifyProof(incident.zkProof);
      const result = isValid ? 'valid' : 'invalid';
      setZkVerificationResult(result);
      
      if (isValid) {
        setShowToast(true);
        // Log to global notifications for visibility
        notificationService.sendNotification({
          type: 'system',
          title: 'ZK Verification Success',
          message: `Cryptographic proof for ${incident.id} validated on-chain. Integrity confirmed.`,
          severity: 'info'
        });
      } else {
        notificationService.sendNotification({
          type: 'system',
          title: 'ZK Verification Failed',
          message: `Critical: Integrity check failed for incident ${incident.id}. Potential proof tampering detected.`,
          severity: 'critical'
        });
      }
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
      {/* High-Visibility Verification Toast */}
      {showToast && (
        <div className="fixed top-8 right-8 z-[2500] animate-in slide-in-from-right duration-500">
          <div className="bg-accent-green/90 backdrop-blur-xl border border-white/20 px-6 py-4 rounded-[2rem] shadow-[0_0_30px_rgba(16,185,129,0.4)] flex items-center gap-4 group">
            <div className="size-10 rounded-full bg-white/20 flex items-center justify-center animate-pulse">
              <span className="material-symbols-outlined text-white text-xl filled">verified</span>
            </div>
            <div className="flex flex-col">
              <span className="text-white font-black text-xs uppercase tracking-widest italic leading-none">Integrity Verified</span>
              <span className="text-white/70 text-[10px] uppercase font-bold tracking-tight mt-1">Proof Hash Authenticated</span>
            </div>
            <button onClick={() => setShowToast(false)} className="ml-4 opacity-50 hover:opacity-100 transition-opacity">
              <span className="material-symbols-outlined text-white text-sm">close</span>
            </button>
          </div>
        </div>
      )}

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

      {/* Verification Status Banner Overlay */}
      {zkVerificationResult !== 'idle' && (
        <div className={`fixed top-24 left-1/2 -translate-x-1/2 z-[1500] px-8 py-4 rounded-full border shadow-[0_20px_40px_-10px_rgba(0,0,0,0.5)] animate-in slide-in-from-top-4 duration-500 flex items-center gap-4 backdrop-blur-xl ${
          zkVerificationResult === 'valid' 
            ? 'bg-accent-green/20 border-accent-green/50 text-accent-green shadow-[0_0_20px_rgba(16,185,129,0.2)]' 
            : 'bg-accent-red/20 border-accent-red/50 text-accent-red shadow-[0_0_20px_rgba(239,68,68,0.2)]'
        }`}>
          <div className={`size-8 rounded-full flex items-center justify-center ${zkVerificationResult === 'valid' ? 'bg-accent-green/20' : 'bg-accent-red/20'}`}>
            <span className="material-symbols-outlined filled text-lg">
              {zkVerificationResult === 'valid' ? 'verified' : 'report_problem'}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-[11px] font-black uppercase tracking-[0.15em] italic">
              {zkVerificationResult === 'valid' ? 'ZK-Proof Integrity Secured' : 'ZK-Proof Integrity Alert'}
            </span>
            <span className="text-[9px] opacity-60 font-bold uppercase tracking-tight">
              {zkVerificationResult === 'valid' ? 'Cryptographic validation complete' : 'Signature mismatch detected'}
            </span>
          </div>
          <button onClick={() => setZkVerificationResult('idle')} className="ml-6 opacity-40 hover:opacity-100 transition-opacity">
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
            {incident.pendingSync && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-300 animate-in fade-in zoom-in duration-500">
                <span className="material-symbols-outlined text-sm">cloud_off</span>
                <span className="text-[9px] font-black uppercase tracking-widest">Pending Sync</span>
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

          {playbook && (
            <section className="bg-card-dark rounded-2xl border border-border-dark p-6 flex flex-col gap-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">playlist_add_check_circle</span>
                  <div className="flex flex-col">
                    <h3 className="text-lg font-bold text-white uppercase tracking-tight">Escalation Playbook</h3>
                    <p className="text-[10px] text-text-secondary font-black uppercase tracking-widest">Auto-generated SOP with owners, timers, and gaps</p>
                  </div>
                </div>
                <span className="px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest bg-slate-800 text-text-secondary border border-border-dark">Live</span>
              </div>

              {lateSteps.length > 0 && (
                <div className="flex items-center gap-2 p-3 rounded-xl border border-accent-red/40 bg-accent-red/10 text-accent-red text-[11px] font-black uppercase tracking-widest">
                  <span className="material-symbols-outlined text-sm">warning</span>
                  {lateSteps.length} step{lateSteps.length > 1 ? 's' : ''} overdue. Reprioritize immediately.
                </div>
              )}

              <div className="flex flex-wrap gap-3">
                <div className="flex items-center gap-2 text-[11px] text-text-secondary font-bold uppercase tracking-widest">
                  <span className="material-symbols-outlined text-sm">handyman</span>
                  Required Skills
                </div>
                {playbook.requiredSkills.map(skill => (
                  <span key={skill} className="px-3 py-1 rounded-full bg-primary/10 text-primary text-[11px] font-black uppercase tracking-widest border border-primary/30">{skill}</span>
                ))}
              </div>

              {playbook.resourceGaps.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-accent-red">Resource Gaps:</span>
                  {playbook.resourceGaps.map(gap => (
                    <span key={gap} className="px-3 py-1 rounded-full bg-accent-red/10 text-accent-red text-[10px] font-black uppercase tracking-widest border border-accent-red/40">{gap}</span>
                  ))}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {playbook.steps.map(step => {
                  const isLate = nowTick > step.dueAt && step.status !== 'Done';
                  const displayStatus = step.status === 'Done' ? 'Done' : isLate ? 'Late' : step.status;
                  const statusClass = displayStatus === 'Done'
                    ? 'bg-emerald-500/10 text-accent-green border-emerald-500/40'
                    : displayStatus === 'Late'
                      ? 'bg-accent-red/10 text-accent-red border-accent-red/40'
                      : displayStatus === 'InProgress'
                        ? 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                        : 'bg-slate-800 text-text-secondary border-border-dark';

                  return (
                    <div key={step.id} className="p-4 rounded-2xl border border-border-dark bg-background-dark/60 flex flex-col gap-3 shadow-sm">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex flex-col gap-1">
                          <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest border ${statusClass}`}>{displayStatus}</span>
                          <h4 className="text-white font-bold text-sm leading-tight">{step.title}</h4>
                          <div className="flex items-center gap-2 text-[10px] text-text-secondary uppercase font-black">
                            <span className="material-symbols-outlined text-[14px]">badge</span>
                            {step.owner}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-[11px] font-black text-white">{formatRemaining(step.dueAt)}</p>
                          <p className="text-[10px] text-text-secondary uppercase font-bold">Due</p>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {step.requiredSkills.map(skill => (
                          <span key={skill} className="px-2 py-1 rounded-lg bg-slate-800 text-[10px] text-text-secondary font-black uppercase tracking-widest border border-border-dark">{skill}</span>
                        ))}
                        {step.resourcesNeeded.map(res => (
                          <span key={res} className="px-2 py-1 rounded-lg bg-amber-500/10 text-amber-300 text-[10px] font-black uppercase tracking-widest border border-amber-500/30">{res}</span>
                        ))}
                      </div>

                      <div className="flex items-center gap-2">
                        {step.status !== 'Done' && (
                          <button
                            onClick={() => handleStepStatus(step.id, 'InProgress')}
                            className="flex-1 py-2 rounded-xl bg-slate-800 text-white text-[10px] font-black uppercase tracking-widest hover:bg-slate-700 transition-all border border-border-dark"
                          >
                            <span className="material-symbols-outlined text-[14px]">play_arrow</span>
                            Start
                          </button>
                        )}
                        <button
                          onClick={() => handleStepStatus(step.id, 'Done')}
                          className="flex-1 py-2 rounded-xl bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest shadow-glow active:scale-95 transition-all flex items-center justify-center gap-1"
                        >
                          <span className="material-symbols-outlined text-[14px]">check_circle</span>
                          Done
                        </button>
                      </div>

                      {/* Donations to Actions: Micro-grants per step */}
                      <div className="mt-2 p-3 rounded-xl bg-primary/5 border border-primary/20 flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary text-[16px]">volunteer_activism</span>
                            <p className="text-[10px] font-black text-text-secondary uppercase tracking-widest">Support This Step</p>
                          </div>
                          <div className="text-right text-[10px] text-text-secondary">
                            {/* Totals by currency */}
                            <span className="font-bold">ETH {stepDonationsService.getTotals(incident.id, step.id).ETH.toFixed(2)}</span>
                            <span className="ml-2 font-bold">USDC {stepDonationsService.getTotals(incident.id, step.id).USDC.toFixed(2)}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 flex-wrap">
                          {step.resourcesNeeded.slice(0,3).map(res => (
                            <button
                              key={res}
                              onClick={() => {
                                stepDonationsService.pledgeDonation(
                                  incident.id,
                                  step.id,
                                  currentUser.name,
                                  donationCurrency === 'ETH' ? parseFloat(donationAmount || '0.05') : parseFloat(donationAmount || '10'),
                                  donationCurrency,
                                  res
                                );
                                auditTrailService.recordEvent(incident.id, currentUser.name, 'STEP_DONATION_PLEDGED', `${res} → ${donationAmount || '0.05'} ${donationCurrency}`);
                                alert(`Pledged ${donationAmount} ${donationCurrency} for ${res}`);
                              }}
                              className="px-2 py-1 rounded-lg bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest border border-primary/30 hover:bg-primary/20 transition-all"
                            >
                              Fund {res}
                            </button>
                          ))}
                          <div className="flex items-center gap-2 ml-auto">
                            <select
                              value={donationCurrency}
                              onChange={(e) => setDonationCurrency(e.target.value as 'ETH' | 'USDC')}
                              className="bg-background-dark border border-border-dark rounded-lg px-2 py-1 text-[10px] text-white"
                            >
                              <option value="ETH">ETH</option>
                              <option value="USDC">USDC</option>
                            </select>
                            <input
                              type="number"
                              step={donationCurrency === 'ETH' ? '0.01' : '1'}
                              value={donationAmount}
                              onChange={(e) => setDonationAmount(e.target.value)}
                              className="w-24 bg-background-dark border border-border-dark rounded-lg px-2 py-1 text-[10px] text-white"
                              placeholder="0.05"
                            />
                            <button
                              onClick={() => {
                                stepDonationsService.pledgeDonation(
                                  incident.id,
                                  step.id,
                                  currentUser.name,
                                  donationCurrency === 'ETH' ? parseFloat(donationAmount || '0.05') : parseFloat(donationAmount || '10'),
                                  donationCurrency,
                                  'General'
                                );
                                auditTrailService.recordEvent(incident.id, currentUser.name, 'STEP_DONATION_PLEDGED', `General → ${donationAmount || '0.05'} ${donationCurrency}`);
                                alert(`Pledged ${donationAmount} ${donationCurrency} to this step`);
                              }}
                              className="px-2 py-1 rounded-lg bg-primary text-white text-[10px] font-black uppercase tracking-widest hover:bg-primary/90 transition-all"
                            >
                              Pledge
                            </button>
                          </div>
                        </div>

                        {step.status === 'Done' && (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={async () => {
                                const res = await stepDonationsService.verifyMilestoneAndDisburse(incident.id, step.id, currentUser.name);
                                alert(`Disbursed ${res.disbursed} pledges. ETH ${res.currencyBreakdown.ETH.toFixed(2)} | USDC ${res.currencyBreakdown.USDC.toFixed(2)}`);
                              }}
                              className="flex-1 py-2 rounded-xl bg-emerald-600 text-white text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all"
                            >
                              Verify Milestone & Disburse
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {suggestedSquads.length > 0 && (
            <section className="bg-card-dark rounded-2xl border border-border-dark p-6 flex flex-col gap-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-blue-400">groups</span>
                  <div className="flex flex-col">
                    <h3 className="text-lg font-bold text-white uppercase tracking-tight">Suggested Response Squads</h3>
                    <p className="text-[10px] text-text-secondary font-black uppercase tracking-widest">Skill-matched teams ranked by composite score (skill, proximity, availability, trust)</p>
                  </div>
                </div>
                <span className="px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest bg-blue-500/10 text-blue-400 border border-blue-500/30">AI-Optimized</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {suggestedSquads.map((squad, idx) => (
                  <div key={idx} className="p-4 rounded-2xl border border-border-dark bg-background-dark/80 flex flex-col gap-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex flex-col gap-1">
                        <span className="px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest border border-blue-500/30 bg-blue-500/10 text-blue-400 w-fit">Squad {idx + 1}</span>
                        <p className="text-[11px] text-text-secondary font-black uppercase tracking-widest">ETA: {squad.estimatedArrival} min</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-black text-white">{(squad.totalScore * 100).toFixed(0)}%</p>
                        <p className="text-[10px] text-text-secondary uppercase font-bold">Score</p>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      <p className="text-[10px] font-black text-text-secondary uppercase tracking-widest">Volunteers ({squad.volunteers.length})</p>
                      {squad.volunteers.map((vol) => {
                        const score = squad.volunteers[0].id === vol.id ? squad.totalScore : 0.8; // Placeholder for other scores
                        return (
                          <div key={vol.id} className="p-2 rounded-lg bg-slate-900/50 border border-border-dark flex items-start gap-2">
                            <div className="size-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white text-[11px] font-black flex-shrink-0">
                              {vol.name.charAt(0)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-[11px] font-bold text-white truncate">{vol.name}</p>
                              <p className="text-[9px] text-text-secondary">{vol.role || 'Responder'}</p>
                              <div className="flex gap-1 flex-wrap mt-1">
                                {(vol.skills || []).slice(0, 2).map(skill => (
                                  <span key={skill} className="px-1 py-0.5 rounded text-[8px] font-black uppercase tracking-widest bg-blue-500/10 text-blue-300 border border-blue-500/20">{skill}</span>
                                ))}
                                {(vol.skills || []).length > 2 && (
                                  <span className="px-1 py-0.5 rounded text-[8px] font-black uppercase tracking-widest bg-slate-700 text-text-secondary">+{vol.skills.length - 2}</span>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black text-text-secondary uppercase tracking-widest">Coverage</span>
                        <div className="flex-1 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-emerald-500 to-cyan-500" style={{width: `${Math.min(100, (squad.skillCoverage.length / 8) * 100)}%`}}></div>
                        </div>
                      </div>
                      {squad.gaps.length > 0 && (
                        <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-start gap-2">
                          <span className="material-symbols-outlined text-[12px] text-amber-400 flex-shrink-0">info</span>
                          <p className="text-[9px] text-amber-300 leading-tight">Gaps: {squad.gaps.join(', ')}</p>
                        </div>
                      )}
                    </div>

                    <button 
                      onClick={() => {
                        const updatedIncident = {...incident, assignedResponders: squad.volunteers.map(v => v.id)};
                        setIncident(updatedIncident);
                        
                        // Regenerate playbook with squad members as primary owners
                        const squadMembers = squad.volunteers.map(v => ({
                          id: v.id,
                          name: v.name,
                          skills: v.skills
                        }));
                        const updatedPlaybook = playbookService.generatePlaybook(updatedIncident, volunteers, squadMembers);
                        setPlaybook(updatedPlaybook);
                        
                        // Trigger notification
                        const assignedNames = squad.volunteers.map(v => v.name).join(', ');
                        alert(`Deployed Squad ${idx + 1}: ${assignedNames} → ETA ${squad.estimatedArrival}min\n\nPlaybook regenerated with squad as primary owners.`);
                      }}
                      className="w-full py-2 rounded-xl bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 shadow-glow-blue transition-all active:scale-95 flex items-center justify-center gap-1"
                    >
                      <span className="material-symbols-outlined text-[14px]">send</span>
                      Deploy Squad {idx + 1}
                    </button>
                  </div>
                ))}
              </div>
            </section>
          )}

          {handoffSuggestions.length > 0 && (
            <section className="bg-card-dark rounded-2xl border border-border-dark p-6 flex flex-col gap-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-amber-400">handshake</span>
                  <div className="flex flex-col">
                    <h3 className="text-lg font-bold text-white uppercase tracking-tight">Load-Balancing Handoffs</h3>
                    <p className="text-[10px] text-text-secondary font-black uppercase tracking-widest">Prevent burnout: suggest cross-region mutual aid</p>
                  </div>
                </div>
                <span className="px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest bg-amber-500/10 text-amber-300 border border-amber-500/30">Recommended</span>
              </div>

              <div className="flex flex-col gap-3">
                {handoffSuggestions.map((handoff, idx) => (
                  <div key={idx} className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/5 flex items-start gap-4">
                    <span className="material-symbols-outlined text-amber-400 text-xl flex-shrink-0">arrow_forward</span>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-white">{handoff.reason}</p>
                      <p className="text-[11px] text-text-secondary mt-1">{handoff.details}</p>
                      <div className="flex gap-2 mt-3">
                        <button className="px-3 py-1 rounded-lg bg-emerald-500 text-white text-[10px] font-black uppercase hover:bg-emerald-600 transition-all active:scale-95">
                          Approve
                        </button>
                        <button className="px-3 py-1 rounded-lg bg-slate-800 text-text-secondary text-[10px] font-black uppercase border border-border-dark hover:bg-slate-700 transition-all active:scale-95">
                          Reject
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}



          {auditTimeline && (
            <section className="bg-card-dark rounded-2xl border border-border-dark p-6 flex flex-col gap-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-cyan-400">history</span>
                  <div className="flex flex-col">
                    <h3 className="text-lg font-bold text-white uppercase tracking-tight">Immutable Incident Timeline</h3>
                    <p className="text-[10px] text-text-secondary font-black uppercase tracking-widest">On-chain anchored audit trail</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={async () => {
                      const anchor = await auditTrailService.anchorToChain(incident.id);
                      alert(`Timeline anchored to chain:\nTx: ${anchor.txHash.slice(0, 10)}...\nBlock: ${anchor.blockNumber}`);
                      setAuditTimeline(auditTrailService.getTimeline(incident.id));
                    }}
                    className="px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500/20 transition-all"
                  >
                    Anchor
                  </button>
                  <button
                    onClick={() => {
                      const ok = auditTrailService.verifyTimeline(incident.id);
                      alert(`Timeline integrity: ${ok ? '✓ VALID' : '✗ INVALID'}`);
                    }}
                    className="px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest bg-slate-800 text-white border border-border-dark hover:bg-slate-700 transition-all"
                  >
                    Verify
                  </button>
                  <button
                    onClick={() => {
                      const report = auditTrailService.exportTimeline(incident.id);
                      console.log(report);
                      alert(`Exported: ${report.eventCount} events\nRoot: ${report.rootHash.slice(0, 16)}...`);
                    }}
                    className="px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest bg-blue-600 text-white hover:bg-blue-700 transition-all shadow-glow-blue"
                  >
                    Export
                  </button>
                </div>
              </div>

              {auditTimeline.lastAnchorTxHash && (
                <div className="p-3 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center gap-2">
                  <span className="material-symbols-outlined text-cyan-400 text-sm">verified</span>
                  <div className="flex-1 text-[10px] text-cyan-300 font-black">
                    <p>Last anchor: Block {auditTimeline.lastAnchorBlock}</p>
                    <p className="font-mono text-[9px] text-cyan-400">{auditTimeline.lastAnchorTxHash.slice(0, 20)}...</p>
                  </div>
                </div>
              )}

              <div className="max-h-64 overflow-y-auto flex flex-col gap-2">
                {auditTimeline.events.slice(-10).reverse().map((event) => (
                  <div key={event.id} className="p-3 rounded-lg bg-background-dark border border-border-dark text-[10px]">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2 py-0.5 rounded bg-slate-700 text-text-secondary font-black uppercase text-[8px]">{event.action}</span>
                      <span className="text-text-secondary font-bold">{event.actor}</span>
                      <span className="ml-auto text-text-secondary text-[9px]">{new Date(event.timestamp).toLocaleTimeString()}</span>
                    </div>
                    <p className="text-text-secondary text-[9px]">{event.details}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          <section className="bg-card-dark rounded-2xl border border-border-dark p-6 flex flex-col gap-5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-amber-400">badge</span>
                <div className="flex flex-col">
                  <h3 className="text-lg font-bold text-white uppercase tracking-tight">Evidence & Chain-of-Custody</h3>
                  <p className="text-[10px] text-text-secondary font-black uppercase tracking-widest">Signed uploads with custody tracking</p>
                </div>
              </div>
              <span className="px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest bg-amber-500/10 text-amber-300 border border-amber-500/30">{evidence.length} items</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-background-dark border border-border-dark flex flex-col gap-3">
                <p className="text-[10px] font-black text-text-secondary uppercase tracking-widest">Upload Evidence</p>
                <input
                  type="text"
                  placeholder="File name (e.g., photo-001.jpg)"
                  value={evidenceDescription}
                  onChange={(e) => setEvidenceDescription(e.target.value)}
                  className="w-full bg-slate-900 border border-border-dark rounded-lg px-3 py-2 text-sm text-white placeholder:text-text-secondary focus:ring-1 focus:ring-amber-400 outline-none"
                />
                <select
                  value={evidenceCategory}
                  onChange={(e) => setEvidenceCategory(e.target.value as any)}
                  className="w-full bg-slate-900 border border-border-dark rounded-lg px-3 py-2 text-sm text-white focus:ring-1 focus:ring-amber-400 outline-none"
                >
                  <option value="photo">📷 Photo</option>
                  <option value="video">🎥 Video</option>
                  <option value="document">📄 Document</option>
                  <option value="audio">🎙️ Audio</option>
                  <option value="other">📦 Other</option>
                </select>
                <button
                  onClick={() => {
                    const newEvidence = evidenceService.uploadEvidence(
                      incident.id,
                      currentUser.name,
                      evidenceDescription || 'evidence.dat',
                      'application/octet-stream',
                      Math.floor(Math.random() * 500) + 50,
                      evidenceCategory,
                      `Uploaded by ${currentUser.name}`
                    );
                    setEvidence(evidenceService.getIncidentEvidence(incident.id));
                    auditTrailService.recordEvent(incident.id, currentUser.name, 'EVIDENCE_UPLOADED', evidenceDescription);
                    setEvidenceDescription('');
                    alert(`Evidence uploaded: ${newEvidence.id}`);
                  }}
                  className="w-full py-2 rounded-xl bg-amber-600 text-white text-[10px] font-black uppercase tracking-widest hover:bg-amber-700 transition-all shadow-glow-amber"
                >
                  Upload & Sign
                </button>
              </div>

              <div className="p-4 rounded-xl bg-background-dark border border-border-dark flex flex-col gap-3">
                <p className="text-[10px] font-black text-text-secondary uppercase tracking-widest">Recent Evidence</p>
                <div className="flex flex-col gap-2 max-h-48 overflow-y-auto">
                  {evidence.slice(-5).reverse().map((ev) => (
                    <button
                      key={ev.id}
                      onClick={() => setSelectedEvidence(ev)}
                      className={`p-2 rounded-lg border ${selectedEvidence?.id === ev.id ? 'bg-amber-500/10 border-amber-500/30' : 'bg-slate-900 border-border-dark'} text-left transition-all`}
                    >
                      <p className="text-[10px] font-bold text-white truncate">{ev.fileName}</p>
                      <p className="text-[9px] text-text-secondary">{ev.category} • {ev.fileSizeKB}KB</p>
                      <p className="text-[8px] text-amber-300">{ev.verified ? '✓ Verified' : '○ Pending'}</p>
                    </button>
                  ))}
                  {evidence.length === 0 && (
                    <p className="text-[10px] text-text-secondary italic">No evidence uploaded yet</p>
                  )}
                </div>
              </div>
            </div>

            {selectedEvidence && (
              <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/30 flex flex-col gap-3">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-bold text-white">{selectedEvidence.fileName}</p>
                    <p className="text-[10px] text-text-secondary mt-1">
                      Uploaded by {selectedEvidence.uploader} • {selectedEvidence.fileSizeKB}KB • {selectedEvidence.category}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedEvidence(null)}
                    className="text-text-secondary hover:text-white transition-colors"
                  >
                    <span className="material-symbols-outlined text-sm">close</span>
                  </button>
                </div>

                <div className="flex flex-col gap-2">
                  <p className="text-[10px] font-black text-text-secondary uppercase tracking-widest">Chain of Custody</p>
                  {selectedEvidence.chainOfCustody.map((entry, idx) => (
                    <div key={idx} className="p-2 rounded-lg bg-slate-900 border border-border-dark text-[9px] flex items-start gap-2">
                      <span className="material-symbols-outlined text-[12px] text-amber-400 flex-shrink-0 mt-0.5">
                        {entry.action === 'uploaded' ? 'upload' : entry.action === 'verified' ? 'verified' : entry.action === 'transferred' ? 'send' : 'archive'}
                      </span>
                      <div className="flex-1">
                        <p className="text-text-secondary font-bold">{entry.actor}</p>
                        <p className="text-text-secondary">{entry.notes}</p>
                        <p className="text-[8px] text-slate-500 mt-0.5">{new Date(entry.timestamp).toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      const result = evidenceService.verifyEvidence(incident.id, selectedEvidence.id);
                      alert(`Verification: ${result.verified ? '✓ VALID' : '✗ INVALID'}\nMessage: ${result.message}`);
                      setEvidence(evidenceService.getIncidentEvidence(incident.id));
                    }}
                    className="flex-1 py-1.5 rounded-lg bg-emerald-600 text-white text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all text-center"
                  >
                    Verify Integrity
                  </button>
                  <button
                    onClick={() => {
                      evidenceService.archiveEvidence(incident.id, selectedEvidence.id, currentUser.name);
                      setEvidence(evidenceService.getIncidentEvidence(incident.id));
                      setSelectedEvidence(null);
                      alert('Evidence archived');
                    }}
                    className="flex-1 py-1.5 rounded-lg bg-slate-700 text-white text-[10px] font-black uppercase tracking-widest hover:bg-slate-600 transition-all text-center"
                  >
                    Archive
                  </button>
                </div>
              </div>
            )}
          </section>

          {criticalProposals.length > 0 && (
            <section className="bg-card-dark rounded-2xl border border-border-dark p-6 flex flex-col gap-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-red-500">security</span>
                  <div className="flex flex-col">
                    <h3 className="text-lg font-bold text-white uppercase tracking-tight">Critical Action Approvals</h3>
                    <p className="text-[10px] text-text-secondary font-black uppercase tracking-widest">Multi-sig consensus required</p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                {criticalProposals.map((prop) => (
                  <div key={prop.id} className="p-4 rounded-xl border border-red-500/30 bg-red-500/5 flex flex-col gap-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-bold text-white">{prop.description}</p>
                        <p className="text-[10px] text-text-secondary mt-1">
                          {prop.type.replace(/_/g, ' ')} • Proposed by {prop.proposedBy}
                        </p>
                        {prop.amount && (
                          <p className="text-[10px] text-amber-300 font-bold mt-1">{prop.amount} {prop.currency}</p>
                        )}
                      </div>
                      <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${
                        prop.status === 'Pending' ? 'bg-amber-500/10 text-amber-300 border-amber-500/30' :
                        prop.status === 'Approved' ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30' :
                        'bg-red-500/10 text-red-300 border-red-500/30'
                      }`}>
                        {prop.status}
                      </span>
                    </div>

                    <div className="p-2 rounded-lg bg-background-dark border border-border-dark">
                      <p className="text-[9px] font-black text-text-secondary uppercase tracking-widest mb-2">Signatures: {prop.signatures}/{prop.required}</p>
                      <div className="flex gap-1">
                        {Array.from({length: prop.required}).map((_, i) => (
                          <div key={i} className={`h-2 flex-1 rounded-full ${i < prop.signatures ? 'bg-emerald-500' : 'bg-slate-700'}`}></div>
                        ))}
                      </div>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {prop.signers.map((signer) => (
                          <span key={signer.actor} className="px-2 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-300 text-[8px] font-black uppercase tracking-widest border border-emerald-500/30">
                            ✓ {signer.actor.split('-')[0]}
                          </span>
                        ))}
                      </div>
                    </div>

                    {prop.status === 'Pending' && (
                      <button
                        onClick={() => {
                          try {
                            multiSigService.signTransaction(prop.id, currentUser.name);
                            setCriticalProposals(multiSigService.getIncidentProposals(incident.id));
                            auditTrailService.recordEvent(incident.id, currentUser.name, 'CRITICAL_ACTION_SIGNED', `Signed: ${prop.id}`);
                            alert(`You signed proposal ${prop.id}`);
                          } catch (err: any) {
                            alert('Error: ' + err.message);
                          }
                        }}
                        className="w-full py-2 rounded-xl bg-red-600 text-white text-[10px] font-black uppercase tracking-widest hover:bg-red-700 transition-all shadow-glow-red"
                      >
                        Sign Approval
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Assigned Assets */}
          <section className="bg-card-dark rounded-2xl border border-border-dark p-6 flex flex-col gap-5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">inventory_2</span>
                <div className="flex flex-col">
                  <h3 className="text-lg font-bold text-white uppercase tracking-tight">Assigned Assets</h3>
                  <p className="text-[10px] text-text-secondary font-black uppercase tracking-widest">Vehicles, generators, kits</p>
                </div>
              </div>
              <button
                onClick={() => setIncidentAssets(resourceLogisticsService.getIncidentAssets(incident.id))}
                className="px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest bg-slate-800 text-white border border-border-dark hover:bg-slate-700 transition-all"
              >
                Refresh
              </button>
            </div>
            {incidentAssets.length === 0 ? (
              <p className="text-[10px] text-text-secondary italic">No assets assigned</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {incidentAssets.map(a => (
                  <div key={a.id} className="p-3 rounded-xl bg-background-dark border border-border-dark">
                    <div className="flex items-center justify-between">
                      <p className="text-[11px] font-bold text-white">{a.name}</p>
                      <span className="px-2 py-0.5 rounded-lg text-[9px] font-black uppercase border bg-slate-800 text-white/80 border-border-dark">{a.type}</span>
                    </div>
                    <div className="mt-1 text-[10px] text-text-secondary flex items-center gap-2">
                      <span>Status: <span className="text-white font-bold">{a.status}</span></span>
                      {a.fuelPct !== undefined && (
                        <span>Fuel: <span className={`${(a.fuelPct||0) < 25 ? 'text-accent-red' : 'text-white'} font-bold`}>{Math.round(a.fuelPct!)}%</span></span>
                      )}
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <button
                        onClick={() => {
                          resourceLogisticsService.unassign(a.id);
                          setIncidentAssets(resourceLogisticsService.getIncidentAssets(incident.id));
                        }}
                        className="px-2 py-1 rounded-lg bg-slate-800 text-white text-[10px] border border-border-dark hover:bg-slate-700"
                      >
                        Unassign
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <div className="flex gap-3">
            <button
              onClick={() => {
                multiSigService.proposeCriticalAction(
                  incident.id,
                  'fund_release',
                  currentUser.name,
                  'Emergency fund release for immediate response',
                  '5.0',
                  'ETH'
                );
                setCriticalProposals(multiSigService.getIncidentProposals(incident.id));
                alert('Critical action proposed and recorded in audit trail');
              }}
              className="px-4 py-2 rounded-lg bg-red-600 text-white text-[10px] font-black uppercase tracking-widest hover:bg-red-700 transition-all shadow-glow-red"
            >
              Propose Fund Release
            </button>
            <button
              onClick={() => {
                multiSigService.proposeCriticalAction(
                  incident.id,
                  'evacuation',
                  currentUser.name,
                  'Evacuate affected zone - multi-sig authorization required'
                );
                setCriticalProposals(multiSigService.getIncidentProposals(incident.id));
                alert('Evacuation order proposed for multi-sig approval');
              }}
              className="px-4 py-2 rounded-lg bg-accent-red text-white text-[10px] font-black uppercase tracking-widest hover:bg-red-700 transition-all"
            >
              Propose Evacuation
            </button>
          </div

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
              {chatMessages.map(msg => {
                const isMine = msg.senderId === currentUser.id;
                const isSecure = msg.isSecure && msg.ciphertext;
                let displayText = msg.text || '';
                if (isSecure) {
                  const token = lastEphemeralToken;
                  try {
                    if (token && secureRoomService.validateKey(incident.id, token)) {
                      displayText = secureRoomService.decrypt(incident.id, msg.ciphertext!, token);
                    } else {
                      displayText = '[Encrypted]';
                    }
                  } catch {
                    displayText = '[Encrypted]';
                  }
                }
                return (
                <div key={msg.id} className={`flex gap-3 ${isMine ? 'flex-row-reverse' : ''} ${msg.isSystem ? 'justify-center w-full' : ''}`}>
                  {!msg.isSystem && <div className="size-8 rounded-full bg-slate-800 bg-cover shrink-0 border border-white/10" style={{ backgroundImage: `url(https://picsum.photos/seed/${msg.senderId}/100/100)` }}></div>}
                  <div className={`flex flex-col gap-1 ${msg.isSystem ? 'w-full items-center' : isMine ? 'items-end max-w-[70%]' : 'max-w-[70%]'}`}>
                    {!msg.isSystem && (
                      <div className="flex items-center gap-2 text-[10px] text-text-secondary font-bold">
                        <span>{initialUsers.find(u => u.id === msg.senderId)?.name || 'Responser'}</span>
                        {isSecure && <span className="material-symbols-outlined text-[12px] text-cyan-400" title="Secure">encrypted</span>}
                      </div>
                    )}
                    <div className={`p-3 text-sm leading-relaxed rounded-2xl ${
                      msg.isSystem ? 'bg-primary/10 text-primary border border-primary/20 text-center text-[10px] font-black uppercase italic' :
                      isMine 
                        ? 'bg-primary text-white rounded-tr-none shadow-glow' 
                        : 'bg-card-hover text-text-primary rounded-tl-none border border-border-dark'
                    }`}>
                      {displayText}
                    </div>
                  </div>
                </div>
              )})}
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
               {(() => {
                 const loc = incidentPrivacyService.getDisplayLocation(incident);
                 return (
                   <>
                     <h4 className="text-sm font-bold text-white mb-1 uppercase tracking-tight">{loc.name}</h4>
                     <p className="text-xs text-text-secondary uppercase font-bold tracking-wider opacity-60">
                       {loc.subtitle || (loc.lat !== undefined && loc.lng !== undefined ? `Lat ${loc.lat}, Lng ${loc.lng}` : 'Strategic Sector Center')}
                     </p>
                   </>
                 );
               })()}
             </div>
          </div>

          {/* Secure Mode & Privacy */}
          <div className="bg-card-dark rounded-2xl border border-border-dark p-5 flex flex-col gap-4">
            <h4 className="text-xs font-bold text-text-secondary uppercase tracking-widest">Secure Mode & Privacy</h4>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-cyan-400">shield_lock</span>
                <span className="text-[10px] font-black uppercase tracking-widest text-white">Sensitive Case</span>
              </div>
              <label className="inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={!!incident.isSensitive}
                  onChange={(e) => {
                    const updated = incidentPrivacyService.setSensitive(incident, e.target.checked, currentUser.name, incident.category === 'Kidnapping' ? 'Kidnapping risk' : undefined);
                    setIncident(updated);
                    setIncidents(prev => prev.map(i => i.id === incident.id ? updated : i));
                  }}
                />
                <span className="ml-2 text-[10px] text-text-secondary">{incident.isSensitive ? 'On' : 'Off'}</span>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-widest text-white">Location Redaction</span>
              <select
                value={incident.locationRedaction || 'none'}
                onChange={(e) => {
                  const updated = incidentPrivacyService.setLocationRedaction(incident, e.target.value as any, currentUser.name);
                  setIncident(updated);
                  setIncidents(prev => prev.map(i => i.id === incident.id ? updated : i));
                }}
                className="bg-background-dark border border-border-dark rounded-lg px-2 py-1 text-[10px] text-white"
              >
                <option value="none">None</option>
                <option value="coarse">Coarse (~1km)</option>
                <option value="hidden">Hidden</option>
              </select>
            </div>

            <div className="p-3 rounded-xl bg-slate-900 border border-border-dark flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-text-secondary uppercase tracking-widest">Secure Room</span>
                <span className="px-2 py-0.5 rounded bg-slate-800 text-[9px] text-text-secondary border border-border-dark">
                  {(secureRoomService.getRoom(incident.id)?.participants.size || 0)} participants
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    secureRoomService.addParticipant(incident.id, currentUser.name);
                    alert('Joined secure room');
                  }}
                  className="flex-1 py-2 rounded-xl bg-slate-800 text-white text-[10px] font-black uppercase tracking-widest hover:bg-slate-700 transition-all"
                >
                  Join Room
                </button>
                <button
                  onClick={() => {
                    const key = secureRoomService.generateEphemeralKey(incident.id, currentUser.name, 60 * 60 * 1000);
                    setLastEphemeralToken(key.token);
                    const updated = { ...incident, ephemeralKeyId: key.id, secureRoomId: secureRoomService.getRoom(incident.id)?.id };
                    setIncident(updated);
                    setIncidents(prev => prev.map(i => i.id === incident.id ? updated : i));
                    alert(`Ephemeral key issued (1h): ${key.id}`);
                  }}
                  className="flex-1 py-2 rounded-xl bg-cyan-600 text-white text-[10px] font-black uppercase tracking-widest hover:bg-cyan-700 transition-all"
                >
                  Generate Ephemeral Key
                </button>
              </div>
              {lastEphemeralToken && (
                <div className="mt-2 p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/30">
                  <p className="text-[9px] text-cyan-300 font-mono break-all">Token: {lastEphemeralToken}</p>
                </div>
              )}
            </div>

            <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/30 flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-amber-400">schedule_send</span>
                <span className="text-[10px] font-black text-text-secondary uppercase tracking-widest">Delayed Public Disclosure</span>
              </div>
              <input
                type="datetime-local"
                value={disclosureAt}
                onChange={(e) => setDisclosureAt(e.target.value)}
                className="bg-background-dark border border-border-dark rounded-lg px-2 py-1 text-[10px] text-white"
              />
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    if (!disclosureAt) { alert('Select date/time'); return; }
                    const ts = new Date(disclosureAt).getTime();
                    const updated = disclosureService.scheduleDisclosure(incident, ts, currentUser.name, 'Auto public');
                    setIncident(updated);
                    setIncidents(prev => prev.map(i => i.id === incident.id ? updated : i));
                    alert('Disclosure scheduled');
                  }}
                  className="flex-1 py-2 rounded-xl bg-amber-600 text-white text-[10px] font-black uppercase tracking-widest hover:bg-amber-700 transition-all"
                >
                  Schedule
                </button>
                <button
                  onClick={() => {
                    const updated = disclosureService.publishNow(incident, currentUser.name, 'Immediate public');
                    setIncident(updated);
                    setIncidents(prev => prev.map(i => i.id === incident.id ? updated : i));
                    alert('Published to public');
                  }}
                  className="flex-1 py-2 rounded-xl bg-emerald-600 text-white text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all"
                >
                  Publish Now
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IncidentDetail;
