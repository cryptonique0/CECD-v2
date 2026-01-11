import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Incident, IncidentCategory, Severity, IncidentStatus, User } from '../types';
import { CATEGORY_ICONS, SEVERITY_COLORS } from '../constants';
import { aiService, PredictionResult } from '../services/aiService';
import { zkService } from '../services/zkService';
import { offlineService } from '../services/offlineService';

interface ReportIncidentProps {
  onSubmit: (incident: Incident) => void;
  currentUser: User;
  isWhisperMode: boolean;
  setIsWhisperMode: (active: boolean) => void;
}

const ReportIncident: React.FC<ReportIncidentProps> = ({ onSubmit, currentUser, isWhisperMode, setIsWhisperMode }) => {
  const navigate = useNavigate();
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isAddressLoading, setIsAddressLoading] = useState(false);
  const [isZkLoading, setIsZkLoading] = useState(false);
  const [aiResult, setAiResult] = useState<PredictionResult | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: IncidentCategory.OTHER,
    severity: Severity.LOW,
    location: currentUser.location || '',
    lat: currentUser.lat || 0,
    lng: currentUser.lng || 0
  });

  const resolveAddress = async (lat: number, lng: number) => {
    setIsAddressLoading(true);
    try {
      const result = await aiService.getAddressFromCoords(lat, lng);
      setFormData(prev => ({ ...prev, location: result.address }));
    } catch (error) {
      console.warn("Failed to resolve address via AI");
    } finally {
      setIsAddressLoading(false);
    }
  };

  const handleLocateMe = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition((pos) => {
        const { latitude, longitude } = pos.coords;
        setFormData(prev => ({ ...prev, lat: latitude, lng: longitude }));
        resolveAddress(latitude, longitude);
      }, (err) => alert("Please enable location permissions for tactical geocoding."));
    }
  };

  const handleAiAnalysis = async () => {
    if (!formData.description.trim() || formData.description.length < 15) {
      setAnalysisError("Operational requirement: Provide more detail (min 15 chars) for AI triangulation.");
      return;
    }
    
    setIsAiLoading(true);
    setAnalysisError(null);
    try {
      const result = await aiService.predictIncident(formData.description);
      setAiResult(result);
      
      const predictedCategory = Object.values(IncidentCategory).find(
        cat => cat.toLowerCase() === result.category.toLowerCase()
      ) || IncidentCategory.OTHER;
      
      const predictedSeverity = Object.values(Severity).find(
        sev => sev.toLowerCase() === result.severity.toLowerCase()
      ) || Severity.LOW;

      setFormData(prev => ({
        ...prev,
        title: prev.title || result.reasoning.split('.')[0].slice(0, 50) + "...",
        category: predictedCategory as IncidentCategory,
        severity: predictedSeverity as Severity
      }));
    } catch (error: any) {
      console.error("AI Analysis failed:", error);
      setAnalysisError(error.message || "Protocol Error: AI analysis failed. Please manually categorize.");
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    let zkProof: string | undefined = undefined;
    
    if (isWhisperMode) {
      setIsZkLoading(true);
      try {
        // Generating ZK proof for the reporter's identity based on full payload
        zkProof = await zkService.generateIncidentProof(currentUser.id, formData);
      } catch (err) {
        alert("ZK-Prover Error: Failed to generate anonymity proof. Protocol aborted.");
        setIsZkLoading(false);
        return;
      }
      setIsZkLoading(false);
    }

    const newIncident: Incident = {
      id: `INC-25-${Math.floor(Math.random() * 900) + 100}`,
      title: formData.title || `${formData.category} ALERT`,
      description: formData.description,
      translatedDescription: aiResult?.translation,
      category: formData.category,
      severity: formData.severity,
      status: IncidentStatus.REPORTED,
      locationName: formData.location || 'Tactical Sector',
      lat: formData.lat,
      lng: formData.lng,
      reporterId: isWhisperMode ? 'anonymous' : currentUser.id,
      timestamp: Date.now(),
      assignedResponders: [],
      blockNumber: 1950100 + Math.floor(Math.random() * 100),
      hash: '0x' + Math.random().toString(16).slice(2, 66).padEnd(64, '0'),
      confidenceScore: aiResult?.confidence || 0.5,
      isWhisperMode: isWhisperMode,
      zkProof: zkProof,
      pendingSync: !offlineService.isOnline
    };
    onSubmit(newIncident);

    // If offline, queue for later sync and inform user
    const wasOnline = await offlineService.queueAction('incident', newIncident);
    if (!wasOnline) {
      alert('Stored offline. Will auto-sync when back online.');
    }
    navigate('/incidents');
  };

  return (
    <div className="p-6 md:p-12 lg:px-24 max-w-6xl mx-auto flex flex-col gap-10">
      {/* Loading Overlay for ZK Proof Generation */}
      {isZkLoading && (
        <div className="fixed inset-0 z-[1000] flex flex-col items-center justify-center bg-background-dark/95 backdrop-blur-xl animate-in fade-in duration-300">
           <div className="relative mb-10">
             <div className="size-32 rounded-full border-4 border-cyan-500/20 flex items-center justify-center animate-spin duration-[3000ms]">
               <div className="size-24 rounded-full border-4 border-t-cyan-400 border-l-cyan-400 border-r-transparent border-b-transparent"></div>
             </div>
             <span className="material-symbols-outlined text-4xl text-cyan-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 filled">shield_with_heart</span>
           </div>
           <h2 className="text-2xl font-black text-white uppercase italic tracking-widest mb-2">Generating ZK-SNARK Proof</h2>
           <p className="text-text-secondary text-xs uppercase font-bold tracking-[0.2em] opacity-60 animate-pulse">Obfuscating PII & Signing Privacy-Preserving Payload</p>
           <div className="mt-8 w-64 h-1 bg-slate-800 rounded-full overflow-hidden">
             <div className="h-full bg-cyan-400 animate-[loading_2.5s_ease-in-out_infinite]"></div>
           </div>
        </div>
      )}

      <div className="flex flex-col gap-2">
        <h1 className="text-4xl font-black text-white leading-tight italic tracking-tighter uppercase">Global Incident Dispatch</h1>
        <div className="flex items-center gap-3">
           <div className="flex items-center gap-1.5 px-3 py-1 bg-primary/10 border border-primary/20 rounded-full">
             <span className="material-symbols-outlined text-[14px] text-primary filled animate-pulse">radar</span>
             <span className="text-[10px] font-black text-primary uppercase tracking-widest">Base Ledger Sync Active</span>
           </div>
           <div className="flex items-center gap-1.5 px-3 py-1 bg-cyan-500/10 border border-cyan-500/20 rounded-full">
             <span className="material-symbols-outlined text-[14px] text-cyan-400 filled">security</span>
             <span className="text-[10px] font-black text-cyan-400 uppercase tracking-widest">ZK-Shielding Enabled</span>
           </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-10 pb-24">
        <div className="lg:col-span-7 flex flex-col gap-8">
          <section className="bg-card-dark border border-border-dark rounded-[3rem] p-8 md:p-10 flex flex-col gap-8 shadow-2xl relative overflow-hidden">
            {isWhisperMode && <div className="absolute top-0 right-0 px-6 py-2 bg-cyan-500 text-black text-[10px] font-black uppercase tracking-widest shadow-lg flex items-center gap-2">
              <span className="material-symbols-outlined text-xs">shield_lock</span> ZK-WHISPER ACTIVE
            </div>}
            
            <div className="flex items-center justify-between pb-6 border-b border-border-dark">
              <div className="flex items-center gap-4">
                <div className="bg-primary/20 p-2.5 rounded-2xl text-primary">
                  <span className="material-symbols-outlined filled">edit_document</span>
                </div>
                <h3 className="text-xl font-bold text-white uppercase italic tracking-tight">Situation Intel</h3>
              </div>
              
              {/* Tactical Toggle Switch for ZK-Whisper Mode */}
              <div className="flex items-center gap-3">
                <div className="flex flex-col items-end">
                  <span className="text-[8px] font-black text-cyan-400 uppercase tracking-[0.2em] leading-none mb-1">ZK-Whisper Mode</span>
                  <span className="text-[10px] font-bold text-text-secondary uppercase tracking-tight opacity-60 leading-none">Anonymity Protocol</span>
                </div>
                <button 
                  type="button" 
                  onClick={() => setIsWhisperMode(!isWhisperMode)}
                  className={`relative w-14 h-7 rounded-full transition-all duration-300 ${isWhisperMode ? 'bg-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.5)]' : 'bg-slate-800'}`}
                >
                  <div className={`absolute top-1 size-5 rounded-full bg-white shadow-md transition-all duration-300 ${isWhisperMode ? 'left-8' : 'left-1'}`}></div>
                </button>
              </div>
            </div>
            
            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-2.5 relative">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tactical Log</label>
                <textarea 
                  required
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  rows={6}
                  className="w-full bg-background-dark border border-border-dark rounded-2xl px-5 py-4 text-white focus:ring-2 focus:ring-primary/20 outline-none transition-all resize-none placeholder:text-text-secondary/20 font-medium leading-relaxed" 
                  placeholder="Provide detailed observations, immediate needs, and environmental hazards..."
                />
                
                <div className="mt-4 flex items-center justify-between gap-4">
                  <p className="text-[9px] text-text-secondary italic uppercase font-black tracking-widest opacity-40">AI Analysis will pre-fill categories and severity</p>
                  {isAiLoading ? (
                    <div className="flex items-center gap-3 px-5 py-2.5 rounded-xl bg-primary/10 text-primary border border-primary/20 animate-pulse">
                      <span className="material-symbols-outlined text-sm animate-spin">cyclone</span>
                      <span className="text-[10px] font-black uppercase tracking-widest">Processing Intelligence...</span>
                    </div>
                  ) : (
                    <button 
                      type="button"
                      onClick={handleAiAnalysis}
                      disabled={formData.description.length < 15}
                      className="flex items-center gap-2.5 px-6 py-2.5 rounded-xl bg-primary hover:bg-primary-dark text-white shadow-glow transition-all disabled:opacity-30 group active:scale-95"
                    >
                      <span className="material-symbols-outlined text-sm">magic_button</span>
                      <span className="text-[10px] font-black uppercase tracking-widest">Magic Fill & Triage</span>
                    </button>
                  )}
                </div>
              </div>

              {analysisError && (
                <div className="p-4 bg-accent-red/10 border border-accent-red/20 rounded-2xl text-accent-red text-xs font-bold animate-shake">
                  {analysisError}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-border-dark">
                <div className="flex flex-col gap-2.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Generated Headline</label>
                  <input 
                    required
                    value={formData.title}
                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                    className="w-full bg-background-dark border border-border-dark rounded-2xl px-5 py-4 text-white focus:ring-2 focus:ring-primary/20 outline-none transition-all placeholder:text-text-secondary/20 font-bold" 
                    placeholder="Enter or AI-suggest headline..."
                  />
                </div>
                <div className="flex flex-col gap-2.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Strategic Class</label>
                  <select 
                    value={formData.category}
                    onChange={e => setFormData({ ...formData, category: e.target.value as IncidentCategory })}
                    className="w-full h-[56px] bg-background-dark border border-border-dark rounded-2xl px-5 text-white focus:ring-2 focus:ring-primary/20 outline-none font-bold uppercase text-xs"
                  >
                    {Object.values(IncidentCategory).map(cat => (
                      <option key={cat} value={cat}>{cat.toUpperCase()}</option>
                    ))}
                  </select>
                </div>
              </div>

              {aiResult && !isAiLoading && (
                <div className="animate-in fade-in slide-in-from-top-6 duration-700 p-8 rounded-[2.5rem] bg-slate-900/60 border border-primary/30 flex flex-col gap-6 shadow-3xl mt-4">
                  <div className="flex items-center justify-between border-b border-border-dark pb-6">
                    <div className="flex items-center gap-4">
                      <div className="bg-primary/20 p-2.5 rounded-2xl text-primary">
                        <span className="material-symbols-outlined filled">verified_user</span>
                      </div>
                      <div className="flex flex-col">
                        <h4 className="text-sm font-black text-white uppercase tracking-wider italic leading-none">AI Intelligence Report</h4>
                        <p className="text-[9px] text-text-secondary uppercase font-bold mt-1.5 opacity-60">Status: Form Auto-Populated</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent-green/10 text-accent-green border border-accent-green/30">
                      <span className="text-[10px] font-black tracking-widest uppercase">{(aiResult.confidence * 100).toFixed(0)}% CONFIDENCE</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    <div className="flex flex-col gap-2">
                      <span className="text-[9px] font-black text-text-secondary uppercase tracking-widest">Assessment Detail</span>
                      <p className="text-xs text-slate-300 leading-relaxed italic">"{aiResult.reasoning}"</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1">
                        <span className="text-[9px] font-black text-text-secondary uppercase">Tactical Category</span>
                        <div className="flex items-center gap-2 text-white font-bold">
                          <span className="material-symbols-outlined text-primary text-base">
                            {CATEGORY_ICONS[Object.values(IncidentCategory).find(c => c.toLowerCase() === aiResult.category.toLowerCase()) as IncidentCategory] || 'category'}
                          </span>
                          {aiResult.category}
                        </div>
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="text-[9px] font-black text-text-secondary uppercase">Severity Index</span>
                        <span className={`text-xs font-black px-2 py-0.5 rounded border w-fit ${SEVERITY_COLORS[Object.values(Severity).find(s => s.toLowerCase() === aiResult.severity.toLowerCase()) as Severity] || 'border-border-dark'}`}>
                          {aiResult.severity}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </section>
        </div>

        <div className="lg:col-span-5 flex flex-col gap-8">
          <div className="bg-card-dark border border-border-dark rounded-[3rem] overflow-hidden shadow-2xl">
             <div className="p-6 border-b border-border-dark bg-[#111a22] flex items-center justify-between">
                <h3 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-3 italic">
                  <span className="material-symbols-outlined text-primary">location_searching</span> Coordinates
                </h3>
                <button 
                  type="button"
                  onClick={handleLocateMe}
                  className="flex items-center gap-2.5 px-4 py-2 bg-primary/10 border border-primary/20 rounded-xl text-primary text-[10px] font-black uppercase tracking-widest hover:bg-primary hover:text-white transition-all shadow-glow active:scale-95"
                >
                   <span className="material-symbols-outlined text-sm">my_location</span>
                   Auto-Ping
                </button>
             </div>
             <div className="h-72 bg-slate-800 relative w-full overflow-hidden">
                <div className="absolute inset-0 bg-cover bg-center transition-all duration-1000" style={{ backgroundImage: `url('https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&q=80&w=600')`, filter: 'grayscale(100%) brightness(0.35)' }}></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-4">
                   <div className="size-16 bg-primary/20 rounded-full animate-ping absolute"></div>
                   <span className="material-symbols-outlined text-primary text-6xl drop-shadow-2xl relative z-10 filled">location_on</span>
                </div>
             </div>
             <div className="p-8 flex flex-col gap-8">
                <div className="flex flex-col gap-2.5">
                  <span className="text-[10px] font-black text-text-secondary uppercase tracking-widest ml-1">Geospatial Neighborhood</span>
                  <div className="relative">
                    <input 
                      required
                      value={formData.location}
                      onChange={e => setFormData({ ...formData, location: e.target.value })}
                      className="w-full bg-background-dark border border-border-dark rounded-2xl px-5 py-4 text-sm text-white focus:ring-2 focus:ring-primary/20 outline-none transition-all font-bold italic" 
                      placeholder="e.g., District 7, Metropolis..."
                    />
                    {isAddressLoading && (
                      <div className="absolute right-4 top-1/2 -translate-y-1/2">
                        <span className="material-symbols-outlined text-lg animate-spin text-primary">sync</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex flex-col gap-2.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Deployment Urgency</label>
                  <div className="grid grid-cols-4 gap-2">
                    {Object.values(Severity).map(sev => (
                      <button
                        key={sev}
                        type="button"
                        onClick={() => setFormData({ ...formData, severity: sev })}
                        className={`py-3 rounded-xl text-[9px] font-black uppercase border transition-all ${
                          formData.severity === sev 
                            ? 'bg-accent-red text-white border-accent-red shadow-glow-red' 
                            : 'bg-background-dark border-border-dark text-text-secondary hover:border-slate-500'
                        }`}
                      >
                        {sev}
                      </button>
                    ))}
                  </div>
                </div>
             </div>
          </div>

          <div className="flex flex-col gap-5 mt-auto">
            <button type="submit" className="w-full py-6 rounded-[2.5rem] bg-primary hover:bg-primary-dark text-white font-black text-xl transition-all shadow-glow-lg active:scale-95 flex items-center justify-center gap-4 italic uppercase tracking-tighter">
              <span>{isWhisperMode ? 'Shield & Broadcast' : 'Broadcast to Ledger'}</span>
              <span className="material-symbols-outlined text-2xl">{isWhisperMode ? 'security' : 'send_and_archive'}</span>
            </button>
            <div className="flex items-center justify-center gap-3 px-6 text-center">
               <span className="material-symbols-outlined text-accent-green text-sm filled">lock</span>
               <p className="text-[10px] text-text-secondary/60 leading-relaxed uppercase font-black tracking-widest">
                 {isWhisperMode ? 'Identity shielded via ZK-SNARK circuit v2.5' : `Signed by Base Wallet ID: 0x...${currentUser.walletAddress.slice(-4)}`}
               </p>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default ReportIncident;
