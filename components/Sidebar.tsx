import React, { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { Role } from '../types';
import { CONTRACT_ADDRESS } from '../mockData';

interface SidebarProps {
  role: Role;
  onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ role, onLogout }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(false);

  const navItems = [
    { to: '/', label: 'Dashboard', icon: 'space_dashboard', description: 'Command center overview' },
    { to: '/incidents', label: 'Incidents', icon: 'emergency_home', description: 'Emergency ledger', badge: 3 },
    { to: '/volunteers', label: 'Responders', icon: 'diversity_3', description: 'Global network' },
    { to: '/teams', label: 'Teams', icon: 'groups', description: 'Crew management' },
    { to: '/analytics', label: 'Analytics', icon: 'analytics', description: 'Performance metrics' },
    { to: '/training', label: 'Training', icon: 'school', description: 'Drills & courses' },
    { to: '/admin', label: 'Governance', icon: 'admin_panel_settings', description: 'Protocol settings', adminOnly: true },
    { to: '/profile', label: 'Profile', icon: 'person', description: 'Your settings' },
  ];

  const quickActions = [
    { icon: 'add_alert', label: 'Report Emergency', path: '/report', color: 'red' },
    { icon: 'qr_code_scanner', label: 'Scan QR', path: '#', color: 'blue' },
    { icon: 'map', label: 'View Map', path: '/', color: 'green' },
  ];

  const handleSignOut = (e: React.MouseEvent) => {
    e.preventDefault();
    if (confirm("Are you sure you want to sign out of the CECD Global Command Center?")) {
      onLogout();
      navigate('/login');
    }
  };

  return (
    <aside className={`${isCollapsed ? 'w-20' : 'w-64'} flex-none hidden md:flex flex-col bg-gradient-to-b from-slate-900 to-slate-950 h-full z-20 transition-all duration-300 border-r border-white/5`}>
      <div className="flex flex-col h-full">
        {/* Logo Header */}
        <div className={`p-4 ${isCollapsed ? 'px-2' : 'px-5'}`}>
          <div 
            className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'} cursor-pointer group`} 
            onClick={() => navigate('/')}
          >
            <div className="relative">
              <div className="bg-gradient-to-br from-primary to-blue-600 p-2.5 rounded-xl shadow-lg shadow-primary/20 group-hover:shadow-primary/40 transition-all">
                <span className="material-symbols-outlined text-white text-xl">shield</span>
              </div>
            </div>
          </div>
        </div>

        {/* Collapse Toggle */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="hidden lg:flex absolute top-6 -right-3 size-6 bg-slate-800 border border-white/10 rounded-full items-center justify-center text-white/60 hover:text-white hover:bg-slate-700 transition-all z-10"
        >
          <span className="material-symbols-outlined text-sm">
            {isCollapsed ? 'chevron_right' : 'chevron_left'}
          </span>
        </button>

        {/* Quick Action Button */}
        <div className={`px-4 mb-4 ${isCollapsed ? 'px-2' : ''}`}>
          <button 
            onClick={() => navigate('/report')}
            className={`w-full flex items-center ${isCollapsed ? 'justify-center p-3' : 'gap-2 px-4 py-3'} bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white rounded-xl font-semibold text-sm shadow-lg shadow-red-500/20 hover:shadow-red-500/30 transition-all active:scale-95`}
          >
            <span className="material-symbols-outlined text-lg">emergency</span>
            {!isCollapsed && <span>Report Emergency</span>}
          </button>
        </div>

        {/* Navigation */}
        <nav className={`flex-1 flex flex-col gap-1 px-3 ${isCollapsed ? 'px-2' : ''}`}>
          {!isCollapsed && (
            <span className="text-[10px] text-white/30 font-semibold uppercase tracking-widest px-3 mb-2">Navigation</span>
          )}
          {navItems.map((item) => (
            (!item.adminOnly || role === Role.OWNER) && (
              <NavLink
                key={item.to}
                to={item.to}
                title={isCollapsed ? item.label : undefined}
                className={({ isActive }) =>
                  `relative flex items-center ${isCollapsed ? 'justify-center p-3' : 'gap-3 px-4 py-3'} rounded-xl transition-all duration-200 group ${
                    isActive
                      ? 'bg-gradient-to-r from-primary/20 to-blue-500/10 text-white'
                      : 'text-white/50 hover:text-white hover:bg-white/5'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary rounded-r-full"></div>
                    )}
                    <div className={`${isActive ? 'bg-primary/20' : 'bg-white/5 group-hover:bg-white/10'} p-1.5 rounded-lg transition-colors`}>
                      <span className={`material-symbols-outlined text-lg ${isActive ? 'text-primary' : ''}`}>
                        {item.icon}
                      </span>
                    </div>
                    {!isCollapsed && (
                      <div className="flex-1 flex items-center justify-between">
                        <div>
                          <span className="text-sm font-medium block">{item.label}</span>
                          <span className="text-[10px] text-white/30 block">{item.description}</span>
                        </div>
                        {item.badge && (
                          <span className="px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 text-[10px] font-bold">
                            {item.badge}
                          </span>
                        )}
                      </div>
                    )}
                    {isCollapsed && item.badge && (
                      <span className="absolute -top-1 -right-1 size-4 flex items-center justify-center rounded-full bg-red-500 text-white text-[8px] font-bold">
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            )
          ))}
        </nav>

        {/* Network Status & Footer */}
        <div className={`mt-auto p-4 ${isCollapsed ? 'p-2' : ''}`}>
          {/* Network Status Card */}
          {!isCollapsed && (
            <div className="bg-gradient-to-br from-white/5 to-white/[0.02] p-4 rounded-xl border border-white/5 mb-3 overflow-hidden relative group">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-emerald-400 text-sm">lan</span>
                  <span className="text-[10px] font-semibold text-white/60 uppercase">Network</span>
                </div>
                <span className="flex items-center gap-1.5">
                  <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span className="text-[10px] font-semibold text-emerald-400">LIVE</span>
                </span>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-white/40">Chain</span>
                  <span className="text-[10px] text-white font-mono">Base Mainnet</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-white/40">Contract</span>
                  <span className="text-[10px] text-primary font-mono truncate max-w-[100px]">{CONTRACT_ADDRESS.slice(0, 10)}...</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-white/40">Latency</span>
                  <span className="text-[10px] text-emerald-400 font-mono">4ms</span>
                </div>
              </div>
              <button 
                onClick={() => navigate('/admin')}
                className="w-full mt-3 py-2 text-[10px] text-white/60 hover:text-white font-medium border border-white/10 rounded-lg hover:bg-white/5 transition-all flex items-center justify-center gap-1"
              >
                View Details
                <span className="material-symbols-outlined text-xs">open_in_new</span>
              </button>
            </div>
          )}

          {/* Collapsed Network Indicator */}
          {isCollapsed && (
            <div className="flex justify-center mb-3">
              <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20" title="Base Mainnet - Connected">
                <span className="material-symbols-outlined text-emerald-400 text-lg">lan</span>
              </div>
            </div>
          )}

          {/* Sign Out Button */}
          <button 
            type="button"
            onClick={handleSignOut}
            title={isCollapsed ? 'Sign Out' : undefined}
            className={`flex items-center ${isCollapsed ? 'justify-center p-3' : 'gap-3 px-4 py-2.5'} w-full rounded-xl hover:bg-red-500/10 text-red-400 hover:text-red-300 transition-all group active:scale-95`}
          >
            <span className="material-symbols-outlined group-hover:rotate-12 transition-transform">logout</span>
            {!isCollapsed && <span className="text-sm font-medium">Sign Out</span>}
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
