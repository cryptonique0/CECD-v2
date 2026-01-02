
import React from 'react';
import { User } from '../types';

interface ProfileProps {
  user: User;
}

const Profile: React.FC<ProfileProps> = ({ user }) => {
  return (
    <div className="p-6 md:p-10 flex flex-col gap-8">
      <div className="bg-card-dark rounded-2xl border border-border-dark p-8 flex flex-col md:flex-row gap-8 items-center md:items-start text-center md:text-left shadow-2xl relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none"></div>
        <div className="relative">
          <div className="bg-center bg-no-repeat aspect-square bg-cover rounded-3xl h-32 w-32 ring-4 ring-primary/20 shadow-glow group overflow-hidden" style={{ backgroundImage: `url(${user.avatar})` }}>
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
              <span className="material-symbols-outlined text-white">photo_camera</span>
            </div>
          </div>
          <div className="absolute -bottom-2 -right-2 bg-accent-green size-6 rounded-full border-4 border-card-dark"></div>
        </div>
        <div className="flex flex-col gap-4 flex-1">
          <div className="flex flex-col sm:flex-row items-center sm:items-baseline gap-4">
            <h1 className="text-4xl font-black text-white tracking-tight">{user.name}</h1>
            <span className="px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 text-[10px] font-black uppercase tracking-widest">Verified Identity</span>
          </div>
          <div className="flex flex-wrap justify-center md:justify-start gap-y-2 gap-x-6 text-text-secondary text-sm">
            <div className="flex items-center gap-2 font-mono text-xs bg-background-dark/50 px-3 py-1 rounded-lg border border-border-dark">
              <span className="material-symbols-outlined text-[16px]">wallet</span>
              {user.walletAddress}
            </div>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">location_on</span>
              {user.location}
            </div>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">military_tech</span>
              Level 4 Validator
            </div>
          </div>
        </div>
        <button className="bg-primary hover:bg-primary-dark text-white px-6 py-2.5 rounded-xl font-bold transition-all shadow-glow flex items-center gap-2">
          <span className="material-symbols-outlined text-[20px]">edit</span>
          Edit Profile
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="flex flex-col gap-8">
          <div className="bg-card-dark border border-border-dark rounded-2xl p-6 flex flex-col gap-6 shadow-xl">
             <h3 className="text-lg font-bold text-white flex items-center justify-between">
                <span>Trust Level</span>
                <span className="material-symbols-outlined text-primary">verified</span>
             </h3>
             <div className="bg-background-dark/50 p-6 rounded-2xl border border-border-dark flex flex-col gap-4">
                <div className="flex justify-between items-end">
                  <span className="text-[10px] font-black text-text-secondary uppercase tracking-widest">Reputation Score</span>
                  <span className="text-4xl font-black text-white leading-none">{user.trustScore}<span className="text-base text-text-secondary font-normal ml-1">/100</span></span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                  <div className="bg-gradient-to-r from-primary to-accent-green h-full rounded-full shadow-glow" style={{ width: `${user.trustScore}%` }}></div>
                </div>
                <div className="flex items-center gap-2 text-accent-green text-[10px] font-bold uppercase tracking-widest">
                  <span className="material-symbols-outlined text-sm">trending_up</span>
                  +5% Recent increase
                </div>
             </div>
          </div>

          <div className="bg-card-dark border border-border-dark rounded-2xl p-6 flex flex-col gap-6 shadow-xl">
             <h3 className="text-lg font-bold text-white">Roles & Permissions</h3>
             <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between p-3 rounded-xl bg-primary/10 border border-primary/20">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-primary">person</span>
                    <span className="text-sm font-bold text-white">Citizen</span>
                  </div>
                  <span className="material-symbols-outlined text-accent-green text-[18px]">check_circle</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-purple-500/10 border border-purple-500/20">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-purple-400">volunteer_activism</span>
                    <span className="text-sm font-bold text-white">Volunteer</span>
                  </div>
                  <span className="material-symbols-outlined text-accent-green text-[18px]">check_circle</span>
                </div>
             </div>
          </div>
        </div>

        <div className="lg:col-span-2 flex flex-col gap-8">
          <section className="bg-card-dark border border-border-dark rounded-2xl p-6 md:p-8 shadow-xl">
             <h3 className="text-xl font-bold text-white mb-6">Recent Activity</h3>
             <div className="overflow-x-auto">
               <table className="w-full text-left">
                  <thead>
                    <tr className="text-[10px] uppercase font-bold text-text-secondary border-b border-border-dark">
                      <th className="pb-4">Deployment</th>
                      <th className="pb-4">Date</th>
                      <th className="pb-4">Role</th>
                      <th className="pb-4 text-right">Award</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-dark">
                    {[1, 2, 3].map(i => (
                      <tr key={i} className="group transition-colors hover:bg-white/5">
                        <td className="py-4 text-sm font-bold text-white">Flash Flood Response District {i * 4}</td>
                        <td className="py-4 text-xs text-text-secondary">Oct {20 + i}, 2023</td>
                        <td className="py-4">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-slate-800 border border-border-dark">VOLUNTEER</span>
                        </td>
                        <td className="py-4 text-right text-sm font-bold text-primary">+50 CECD</td>
                      </tr>
                    ))}
                  </tbody>
               </table>
             </div>
          </section>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
            <div className="bg-card-dark border border-border-dark rounded-2xl p-6 flex flex-col gap-4 shadow-xl">
               <h3 className="text-lg font-bold text-white">Verified Skills</h3>
               <div className="flex flex-wrap gap-2">
                 {user.skills.map(s => (
                   <span key={s} className="px-3 py-1 rounded-xl bg-background-dark border border-border-dark text-slate-300 text-xs font-bold flex items-center gap-2">
                     <span className="material-symbols-outlined text-xs text-primary">verified</span>
                     {s}
                   </span>
                 ))}
               </div>
            </div>
            <div className="bg-card-dark border border-border-dark rounded-2xl p-6 flex flex-col gap-4 shadow-xl">
               <h3 className="text-lg font-bold text-white">Equipment Registry</h3>
               <div className="flex flex-col gap-3">
                 <div className="flex items-center gap-3 p-2 bg-background-dark/50 rounded-xl border border-border-dark">
                   <span className="material-symbols-outlined text-text-secondary">directions_car</span>
                   <div className="flex flex-col">
                     <span className="text-xs font-bold text-white leading-none">4x4 Utility Vehicle</span>
                     <span className="text-[10px] text-text-secondary uppercase tracking-widest mt-1">Verified</span>
                   </div>
                 </div>
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
