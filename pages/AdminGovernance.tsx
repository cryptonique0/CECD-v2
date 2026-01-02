
import React, { useState } from 'react';
import { multiSigService } from '../services/multiSigService';

const AdminGovernance: React.FC = () => {
  const [proposals, setProposals] = useState(multiSigService.proposals);

  const handleSign = async (id: string) => {
    await multiSigService.signTransaction(id);
    setProposals([...multiSigService.proposals]);
  };

  const configs = [
    { label: 'Trust Decay Rate', value: '5%', unit: 'per 24hr', icon: 'history_toggle_off' },
    { label: 'Escalation Threshold', value: '3', unit: 'sigs required', icon: 'verified_user' },
    { label: 'Base Node Status', value: 'Active', unit: '0x39...a21', icon: 'dns', color: 'text-accent-green' },
    { label: 'ZK Prover Load', value: '14%', unit: 'Optimal', icon: 'security', color: 'text-cyan-400' },
  ];

  return (
    <div className="p-6 md:p-10 flex flex-col gap-10">
       <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-black text-white italic tracking-tight">System Governance</h1>
        <p className="text-text-secondary text-base">Manage global parameters for the CECD network, Base node synchronization, and community multi-sig vaults.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {configs.map((c, i) => (
          <div key={i} className="bg-card-dark border border-border-dark rounded-2xl p-5 flex flex-col gap-2 hover:border-primary transition-colors">
            <div className="flex justify-between items-start">
              <span className="text-[10px] font-bold text-text-secondary uppercase tracking-widest">{c.label}</span>
              <span className={`material-symbols-outlined text-primary ${c.color || ''}`}>{c.icon}</span>
            </div>
            <p className="text-3xl font-black text-white tracking-tight">{c.value}</p>
            <p className="text-[10px] text-text-secondary font-mono uppercase opacity-60 font-bold">{c.unit}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <section className="bg-card-dark border border-border-dark rounded-2xl overflow-hidden shadow-2xl flex flex-col">
          <div className="px-6 py-4 border-b border-border-dark bg-[#111a22] flex justify-between items-center">
            <h3 className="text-sm font-bold text-white uppercase tracking-widest italic">Base Vault Proposals</h3>
          </div>
          <div className="p-6 overflow-y-auto max-h-[400px]">
            <div className="space-y-4">
              {proposals.map(prop => (
                <div key={prop.id} className="p-4 bg-background-dark/50 rounded-2xl border border-border-dark flex flex-col gap-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-sm font-black text-white uppercase">{prop.description}</h4>
                      <p className="text-xs text-text-secondary font-mono mt-1 font-bold">{prop.amount} {prop.currency}</p>
                    </div>
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded border ${prop.status === 'Approved' ? 'bg-accent-green/10 text-accent-green border-accent-green' : 'bg-accent-orange/10 text-accent-orange border-accent-orange'}`}>
                      {prop.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-primary shadow-glow" style={{ width: `${(prop.signatures / prop.required) * 100}%` }}></div>
                    </div>
                    <span className="text-[10px] font-mono text-white font-bold">{prop.signatures}/{prop.required} Sigs</span>
                  </div>
                  {prop.status === 'Pending' && (
                    <button onClick={() => handleSign(prop.id)} className="w-full py-3 bg-primary hover:bg-primary-dark text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-glow">Sign Tactical Transaction</button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-card-dark border border-border-dark rounded-2xl overflow-hidden shadow-2xl flex flex-col">
          <div className="px-6 py-4 border-b border-border-dark bg-[#111a22] flex justify-between items-center">
            <h3 className="text-sm font-bold text-white uppercase tracking-widest italic">ZK-Rollup Health & Audit</h3>
          </div>
          <div className="p-6 flex flex-col gap-6 overflow-y-auto custom-scrollbar h-[350px]">
             <div className="p-4 bg-cyan-400/5 border border-cyan-400/20 rounded-2xl">
               <div className="flex justify-between mb-2">
                 <span className="text-[10px] font-black text-cyan-400 uppercase tracking-widest">Avg Verification Time</span>
                 <span className="text-[10px] font-mono text-white">420ms</span>
               </div>
               <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-cyan-400" style={{ width: '42%' }}></div>
               </div>
             </div>

             {[1, 2, 3, 4, 5].map(i => (
               <div key={i} className="flex gap-4 items-start relative pb-6 border-l border-border-dark last:border-0 ml-2 pl-6">
                 <div className="absolute left-[-5px] top-1 size-2.5 rounded-full bg-cyan-400 ring-4 ring-background-dark z-10"></div>
                 <div className="flex flex-col gap-1">
                   <div className="flex items-center gap-2">
                     <span className="text-[10px] font-black text-cyan-200 uppercase tracking-widest">ZK-Proof Verified</span>
                     <span className="text-[10px] font-mono text-text-secondary opacity-60">Batch #952{i}</span>
                   </div>
                   <p className="text-sm font-medium text-white">Shielded report for <span className="text-primary">INC-2025-00{i}</span> verified by SNARK circuit.</p>
                   <p className="text-xs text-text-secondary opacity-60 font-mono">Proof: 0x{Math.random().toString(16).slice(2, 12)}...</p>
                 </div>
               </div>
             ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default AdminGovernance;
