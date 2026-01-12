import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { User, Notification } from '../types';

interface HeaderProps {
  user: User;
  walletProvider?: string;
  mobileMenuOpen?: boolean;
  onMobileMenuToggle?: (open: boolean) => void;
}

const Header: React.FC<HeaderProps> = ({ user, walletProvider, mobileMenuOpen = false, onMobileMenuToggle }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const [notifications, setNotifications] = useState<Notification[]>([
    { id: 'n1', type: 'incident', title: 'Critical Incident', message: 'New flash flood alert in District 4', severity: 'critical', timestamp: Date.now() - 120000, read: false },
    { id: 'n2', type: 'donation', title: 'Donation Received', message: 'Received 0.25 ETH for INC-2024-001', severity: 'info', timestamp: Date.now() - 3600000, read: false },
    { id: 'n3', type: 'system', title: 'Sync Complete', message: 'Offline reports synchronized to Base ledger', severity: 'info', timestamp: Date.now() - 7200000, read: true }
  ]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/incidents?q=${encodeURIComponent(searchQuery)}`);
      setShowSearch(false);
    }
  };

  const formatAddress = (addr: string) => {
    if (!addr || addr === 'Disconnected') return '';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  return (
    <header className="flex-none bg-gradient-to-r from-background-dark/95 to-slate-900/95 backdrop-blur-xl border-b border-white/5 z-30 sticky top-0">
      <div className="flex items-center justify-between px-4 md:px-6 lg:px-8 py-3">
        {/* Left Section */}
        <div className="flex items-center gap-4">
          {/* Mobile Menu */}
          <button 
            onClick={() => onMobileMenuToggle?.(!mobileMenuOpen)}
            className={`md:hidden p-2 rounded-xl transition-all ${mobileMenuOpen ? 'bg-primary/20 text-primary' : 'text-white/60 hover:text-white hover:bg-white/10'}`}
            title="Toggle Navigation Menu"
          >
            <span className="material-symbols-outlined">{mobileMenuOpen ? 'close' : 'menu'}</span>
          </button>
          
          {/* Breadcrumb / Page Title */}
          <div className="hidden sm:flex items-center gap-2">
            <span className="text-white/40 text-sm">CECD</span>
            <span className="material-symbols-outlined text-white/20 text-sm">chevron_right</span>
            <span className="text-white font-semibold text-sm">{getPageTitle()}</span>
          </div>
        </div>

        {/* Center - Search (Desktop) */}
        <div className="hidden lg:flex flex-1 max-w-xl mx-8">
          <form onSubmit={handleSearch} className="relative w-full">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <span className="material-symbols-outlined text-white/30">search</span>
            </div>
            <input 
              className="w-full py-2.5 pl-11 pr-4 text-sm text-white bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary/50 focus:bg-white/10 placeholder-white/30 transition-all outline-none"
              placeholder="Search incidents, locations, IDs..." 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button 
                type="button" 
                onClick={() => setSearchQuery('')} 
                className="absolute inset-y-0 right-3 flex items-center text-white/40 hover:text-white transition-colors"
              >
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            )}
          </form>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-2 md:gap-3">
          {/* Mobile Search Toggle */}
          <button 
            onClick={() => setShowSearch(!showSearch)}
            className="lg:hidden p-2 rounded-xl text-white/60 hover:text-white hover:bg-white/10 transition-all"
          >
            <span className="material-symbols-outlined">search</span>
          </button>

          {/* Wallet Info */}
          {user.walletAddress && (
            <div 
              className="hidden md:flex items-center gap-2 px-3 py-2 rounded-xl bg-gradient-to-r from-primary/10 to-blue-500/10 border border-primary/20 cursor-pointer hover:from-primary/20 hover:to-blue-500/20 transition-all"
              onClick={() => navigate('/profile')}
            >
              <span className="material-symbols-outlined text-primary text-sm">account_balance_wallet</span>
              <span className="text-xs font-mono font-semibold text-primary">{formatAddress(user.walletAddress)}</span>
            </div>
          )}

          {/* ETH Balance */}
          <div 
            className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-xl bg-gradient-to-r from-emerald-500/10 to-green-500/10 border border-emerald-500/20 cursor-pointer hover:from-emerald-500/20 hover:to-green-500/20 transition-all"
            onClick={() => navigate('/admin')}
          >
            <span className="material-symbols-outlined text-emerald-400 text-sm">token</span>
            <span className="text-xs font-mono text-emerald-400 font-semibold">2.45 ETH</span>
          </div>

          {/* Report Emergency Button */}
          <button 
            onClick={() => navigate('/report')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white transition-all shadow-lg shadow-red-500/20 hover:shadow-red-500/30 font-semibold text-sm active:scale-95"
          >
            <span className="material-symbols-outlined text-lg">emergency</span>
            <span className="hidden md:inline">SOS</span>
          </button>

          <div className="h-6 w-px bg-white/10 mx-1 hidden sm:block"></div>

          {/* Notifications */}
          <div className="relative">
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className={`relative p-2 rounded-xl transition-all ${
                showNotifications 
                  ? 'bg-primary/20 text-primary' 
                  : 'text-white/60 hover:text-white hover:bg-white/10'
              }`}
            >
              <span className="material-symbols-outlined">notifications</span>
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center bg-red-500 text-white text-[10px] font-bold rounded-full px-1 border-2 border-background-dark">
                  {unreadCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)}></div>
                <div className="absolute right-0 mt-2 w-80 md:w-96 bg-slate-900 border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="px-4 py-3 border-b border-white/10 flex justify-between items-center bg-gradient-to-r from-slate-800 to-slate-900">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary text-lg">notifications</span>
                      <h4 className="text-sm font-bold text-white">Notifications</h4>
                      {unreadCount > 0 && (
                        <span className="px-2 py-0.5 rounded-full bg-primary/20 text-primary text-[10px] font-bold">{unreadCount} new</span>
                      )}
                    </div>
                    {unreadCount > 0 && (
                      <button 
                        onClick={markAllAsRead}
                        className="text-[10px] text-primary hover:text-primary/80 font-semibold transition-colors"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>
                  <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                    {notifications.length === 0 ? (
                      <div className="p-8 text-center">
                        <span className="material-symbols-outlined text-4xl text-white/20 mb-2">notifications_off</span>
                        <p className="text-sm text-white/40">No notifications</p>
                      </div>
                    ) : (
                      notifications.map(n => (
                        <div 
                          key={n.id} 
                          onClick={() => { markAsRead(n.id); navigate('/incidents'); setShowNotifications(false); }}
                          className={`p-4 border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer ${!n.read ? 'bg-primary/5' : ''}`}
                        >
                          <div className="flex gap-3">
                            <div className={`shrink-0 p-2 rounded-xl ${
                              n.severity === 'critical' ? 'bg-red-500/20 text-red-400' : 
                              n.type === 'donation' ? 'bg-emerald-500/20 text-emerald-400' : 
                              'bg-primary/20 text-primary'
                            }`}>
                              <span className="material-symbols-outlined text-lg">
                                {n.type === 'donation' ? 'payments' : n.type === 'incident' ? 'emergency' : 'info'}
                              </span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2">
                                <p className="text-sm font-semibold text-white truncate">{n.title}</p>
                                {!n.read && <span className="size-2 rounded-full bg-primary flex-shrink-0"></span>}
                              </div>
                              <p className="text-xs text-white/60 line-clamp-2 mt-0.5">{n.message}</p>
                              <p className="text-[10px] text-white/40 mt-1.5 font-medium">{getTimeAgo(n.timestamp)}</p>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="p-3 border-t border-white/10 bg-slate-900">
                    <button 
                      onClick={() => { navigate('/incidents'); setShowNotifications(false); }}
                      className="w-full py-2 text-xs font-semibold text-primary hover:text-primary/80 transition-colors flex items-center justify-center gap-1"
                    >
                      View all activity
                      <span className="material-symbols-outlined text-sm">arrow_forward</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* User Profile */}
          <div 
            onClick={() => navigate('/profile')}
            className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-white/10 transition-all cursor-pointer group"
          >
            <div className="relative">
              <div 
                className="bg-center bg-no-repeat bg-cover rounded-xl size-9 ring-2 ring-white/10 group-hover:ring-primary/50 transition-all" 
                style={{ backgroundImage: `url(${user.avatar})` }}
              ></div>
              <span className={`absolute -bottom-0.5 -right-0.5 size-3 rounded-full border-2 border-slate-900 ${
                user.status === 'Available' ? 'bg-emerald-500' : 
                user.status === 'Busy' ? 'bg-orange-500' : 'bg-slate-500'
              }`}></span>
            </div>
            <div className="hidden xl:flex flex-col">
              <span className="text-sm font-semibold text-white leading-tight">{user.name}</span>
              <span className="text-[10px] text-white/50 font-medium">{user.role}</span>
            </div>
            <span className="material-symbols-outlined text-white/30 text-sm hidden xl:block">expand_more</span>
          </div>
        </div>
      </div>

      {/* Mobile Search Overlay */}
      {showSearch && (
        <div className="lg:hidden px-4 pb-3 border-t border-white/5 bg-slate-900/95">
          <form onSubmit={handleSearch} className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="material-symbols-outlined text-white/30">search</span>
            </div>
            <input 
              className="w-full py-2.5 pl-10 pr-4 text-sm text-white bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary/50 placeholder-white/30 transition-all outline-none"
              placeholder="Search..." 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
            />
          </form>
        </div>
      )}
    </header>
  );
};

export default Header;
