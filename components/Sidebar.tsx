
import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Role } from '../types';
import { CONTRACT_ADDRESS } from '../mockData';

interface SidebarProps {
  role: Role;
  onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ role, onLogout }) => {
  const navigate = useNavigate();
  const navItems = [
    { to: '/', label: 'Global Dashboard', icon: 'dashboard' },
    { to: '/incidents', label: 'Emergency Ledger', icon: 'emergency_home' },
    { to: '/volunteers', label: 'Global Responders', icon: 'diversity_3' },
    { to: '/admin', label: 'Governance', icon: 'admin_panel_settings', adminOnly: true },
    { to: '/profile', label: 'Responder Profile', icon: 'person' },
  ];

  const handleSignOut = (e: React.MouseEvent) => {
    e.preventDefault();
    if (confirm("Are you sure you want to sign out of the CECD Global Command Center?")) {
      onLogout();
      navigate('/login');
    }
  };

  return (
    <aside className="w-64 flex-none hidden md:flex flex-col border-r border-border-dark bg-card-dark h-full z-20 shadow-2xl">
      <div className="p-6 flex flex-col gap-10 h-full">
        <div className="flex items-center gap-3 px-2 cursor-pointer" onClick={() => navigate('/')}>
          <div className="bg-primary/20 p-2 rounded-xl text-primary shadow-glow">
            <span className="material-symbols-outlined text-2xl filled">shield</span>
          </div>
          <div>
            <h1 className="text-white text-lg font-extrabold tracking-tight italic">CECD</h1>
            <p className="text-text-secondary text-[10px] uppercase tracking-widest font-black opacity-60">Global Ops</p>
          </div>
        </div>

        <nav className="flex flex-col gap-2">
          {navItems.map((item) => (
            (!item.adminOnly || role === Role.OWNER) && (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 group ${
                    isActive
                      ? 'bg-primary/10 text-white border border-primary/20 shadow-glow'
                      : 'text-text-secondary hover:text-white hover:bg-card-hover'
                  }`
                }
              >
                <span className={`material-symbols-outlined text-xl`}>
                  {item.icon}
                </span>
                <span className="text-sm font-semibold">{item.label}</span>
              </NavLink>
            )
          ))}
        </nav>

        <div className="mt-auto pt-6 border-t border-border-dark">
          <div className="bg-background-dark/50 p-4 rounded-xl border border-border-dark mb-4 overflow-hidden relative group">
            <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] uppercase font-bold text-text-secondary">Network</span>
              <span className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold text-accent-green">BASE MAINNET</span>
                <span className="flex h-2 w-2 rounded-full bg-accent-green animate-pulse"></span>
              </span>
            </div>
            <div className="text-[9px] font-mono text-white opacity-80 break-all leading-relaxed">{CONTRACT_ADDRESS}</div>
            <div className="text-[10px] text-text-secondary mt-1.5 font-bold flex items-center gap-1">
              <span className="material-symbols-outlined text-[12px]">public</span>
              Global Node Connected
            </div>
          </div>
          <button 
            type="button"
            onClick={handleSignOut}
            className="flex items-center gap-3 px-4 py-2.5 w-full rounded-xl hover:bg-accent-red/10 text-accent-red transition-all group active:scale-95 cursor-pointer"
          >
            <span className="material-symbols-outlined group-hover:rotate-12 transition-transform">logout</span>
            <span className="text-sm font-bold">Secure Exit</span>
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
