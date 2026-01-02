
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Notification } from '../types';
import { baseVaultService } from '../services/baseVaultService';

interface HeaderProps {
  user: User;
  walletProvider?: string;
}

const Header: React.FC<HeaderProps> = ({ user, walletProvider }) => {
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [blockHeight, setBlockHeight] = useState(1950420);
  const [nodeHealth, setNodeHealth] = useState({ status: 'Stable', nodes: 842 });
  
  const [notifications] = useState<Notification[]>([
    { id: 'n1', type: 'incident', title: 'Critical Incident', message: 'New flash flood alert in District 4', severity: 'critical', timestamp: Date.now() - 120000, read: false },
    { id: 'n2', type: 'donation', title: 'Donation Received', message: 'Received 0.25 ETH for INC-2024-001', severity: 'info', timestamp: Date.now() - 3600000, read: true },
    { id: 'n3', type: 'system', title: 'Sync Complete', message: 'Offline reports synchronized to Base ledger', severity: 'info', timestamp: Date.now() - 7200000, read: true }
  ]);

  // Simulate live block updates for high-tech feel
  useEffect(() => {
    const interval = setInterval(() => {
      setBlockHeight(prev => prev + 1);
    }, 2500);
    
    // Fetch initial health from base vault service
    baseVaultService.getValidatorHealth().then(health => {
      setNodeHealth({ status: health.l2Status, nodes: health.activeNodes });
    });

    return () => clearInterval(interval);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/incidents?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const formatAddress = (addr: string) => {
    if (!addr || addr === 'Disconnected') return '';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const isConnected = user.walletAddress && user.walletAddress !== 'Disconnected';

  return (
    <header className="flex-none flex items-center justify-between bg-background-dark/80 backdrop-blur-md px-8 py-4 border-b border-border-dark z-30 sticky top-0">
      <div className="flex items-center gap-8 flex-1">
        <button className="md:hidden text-white hover:bg-white/5 p-2 rounded-lg transition-colors">
          <span className="material-symbols-outlined">menu</span>
        </button>
        
        <form onSubmit={handleSearch} className="hidden lg:flex relative w-full max-w-md group">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-secondary group-focus-within:text-primary transition-colors">
            <span className="material-symbols-outlined">search</span>
          </div>
          <input 
            className="block w-full p-2.5 pl-10 text-sm text-white bg-card-dark border border-border-dark rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary placeholder-text-secondary/50 transition-all outline-none"
            placeholder="Query Ledger..." 
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button type="button" onClick={() => setSearchQuery('')} className="absolute inset-y-0 right-3 flex items-center text-text-secondary hover:text-white">
              <span className="material-symbols-outlined text-sm">close</span>
            </button>
          )}
        </form>

        {/* Real-time Tactical Network Status Indicators */}
        <div className="hidden xl:flex items-center gap-8 pl-6 border-l border-border-dark">
           <div className="flex flex-col gap-0.5 min-w-[100px]">
             <div className="flex items-center gap-2">
               <div className="relative">
                 <span className="flex size-2 rounded-full bg-accent-green"></span>
                 <span className="absolute inset-0 size-2 rounded-full bg-accent-green animate-ping opacity-75"></span>
               </div>
               <span className="text-[10px] font-black text-white uppercase tracking-widest leading-none">NODE: {nodeHealth.status.toUpperCase()}</span>
             </div>
             <span className="text-[8px] font-bold text-text-secondary uppercase tracking-tighter opacity-60">BASE MAINNET ACTIVE</span>
           </div>
           
           <div className="flex flex-col gap-0.5">
             <div className="flex items-center gap-1.5">
               <span className="material-symbols-outlined text-[12px] text-primary filled">database</span>
               <span className="text-[10px] font-mono font-black text-white uppercase tracking-widest leading-none">BLOCK #{blockHeight}</span>
             </div>
             <span className="text-[8px] font-bold text-text-secondary uppercase tracking-tighter opacity-60">LATEST BROADCAST</span>
           </div>

           <div className="flex flex-col gap-0.5">
             <div className="flex items-center gap-1.5">
               <span className="material-symbols-outlined text-[12px] text-accent-orange filled">hub</span>
               <span className="text-[10px] font-black text-white uppercase tracking-widest leading-none">{nodeHealth.nodes} PEERS</span>
             </div>
             <span className="text-[8px] font-bold text-text-secondary uppercase tracking-tighter opacity-60">DECENTRALIZED SYNC</span>
           </div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {isConnected ? (
          <div className="flex items-center gap-4 group cursor-pointer" onClick={() => navigate('/profile')}>
            <div className="hidden xl:flex flex-col items-end">
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-primary/10 border border-primary/20">
                <span className="text-[9px] font-black text-primary uppercase tracking-widest leading-none">SECURE LINK</span>
              </div>
              <span className="text-[8px] font-bold text-text-secondary uppercase tracking-tighter opacity-60 mt-1">HANDSHAKE: {walletProvider || 'VERIFIED'}</span>
            </div>
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-primary/10 border border-primary/20 group-hover:bg-primary/20 transition-all shadow-glow-sm">
              <span className="material-symbols-outlined text-primary text-[16px] filled">account_balance_wallet</span>
              <span className="text-[10px] font-mono font-black text-primary uppercase tracking-widest">{formatAddress(user.walletAddress)}</span>
            </div>
          </div>
        ) : (
          <button 
            onClick={() => navigate('/login')}
            className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 border border-border-dark text-white hover:bg-slate-700 transition-all text-[10px] font-black uppercase tracking-widest group shadow-lg"
          >
            <span className="material-symbols-outlined text-sm group-hover:rotate-12 transition-transform">link</span>
            Connect Wallet
          </button>
        )}

        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 cursor-pointer hover:bg-emerald-500/20 transition-colors" onClick={() => navigate('/admin')}>
          <span className="material-symbols-outlined text-accent-green text-sm filled">payments</span>
          <span className="text-[10px] font-mono text-accent-green font-bold">2.45 ETH</span>
        </div>

        <button 
          onClick={() => navigate('/report')}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-accent-red hover:bg-red-600 text-white transition-all shadow-glow-red font-bold text-sm active:scale-95"
        >
          <span className="material-symbols-outlined text-[20px]">warning</span>
          <span className="hidden md:inline">Report</span>
        </button>

        <div className="h-8 w-px bg-border-dark mx-2"></div>

        <div className="relative">
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className={`relative p-2 rounded-full transition-colors ${showNotifications ? 'bg-primary/20 text-primary' : 'text-text-secondary hover:text-white hover:bg-card-hover'}`}
          >
            <span className="material-symbols-outlined">notifications</span>
            <span className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full border-2 border-background-dark"></span>
          </button>

          {showNotifications && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)}></div>
              <div className="absolute right-0 mt-4 w-80 bg-card-dark border border-border-dark rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="px-5 py-4 border-b border-border-dark flex justify-between items-center bg-slate-800/50">
                  <h4 className="text-xs font-bold text-white uppercase tracking-widest">Feed</h4>
                  <button className="text-[10px] text-primary hover:underline font-bold" onClick={() => setShowNotifications(false)}>Clear</button>
                </div>
                <div className="max-h-[350px] overflow-y-auto custom-scrollbar">
                  {notifications.map(n => (
                    <div 
                      key={n.id} 
                      onClick={() => { navigate('/incidents'); setShowNotifications(false); }}
                      className={`p-4 border-b border-border-dark hover:bg-white/5 transition-colors cursor-pointer ${!n.read ? 'bg-primary/5' : ''}`}
                    >
                      <div className="flex gap-3">
                        <div className={`shrink-0 size-8 rounded-full flex items-center justify-center ${
                          n.severity === 'critical' ? 'bg-red-500/20 text-red-500' : 'bg-primary/20 text-primary'
                        }`}>
                          <span className="material-symbols-outlined text-lg">{n.type === 'donation' ? 'payments' : n.type === 'incident' ? 'emergency' : 'info'}</span>
                        </div>
                        <div className="flex flex-col gap-0.5">
                          <p className="text-sm font-bold text-white">{n.title}</p>
                          <p className="text-xs text-text-secondary line-clamp-2">{n.message}</p>
                          <p className="text-[10px] text-text-secondary opacity-60 mt-1 uppercase font-bold">10m ago</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        <div 
          onClick={() => navigate('/profile')}
          className="flex items-center gap-3 p-1.5 rounded-xl hover:bg-card-hover transition-colors cursor-pointer border border-transparent hover:border-border-dark group"
        >
          <div className="bg-center bg-no-repeat bg-cover rounded-lg size-9 ring-1 ring-white/10" style={{ backgroundImage: `url(${user.avatar})` }}></div>
          <div className="hidden xl:flex flex-col">
            <span className="text-sm font-bold text-white leading-none">{user.name}</span>
            <span className="text-[10px] text-text-secondary font-medium tracking-wide uppercase mt-1">{user.role}</span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
