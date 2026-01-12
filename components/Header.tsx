import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { User } from '../types';
import NotificationButton from './NotificationButton';

interface HeaderProps {
  user: User;
  walletProvider?: string;
  mobileMenuOpen?: boolean;
  onMobileMenuToggle?: (open: boolean) => void;
}

// Helper function to get page title from route
const getPageTitle = (pathname: string): string => {
  const titleMap: { [key: string]: string } = {
    '/dashboard': 'Dashboard',
    '/incidents': 'Incidents',
    '/volunteers': 'Volunteers',
    '/teams': 'Teams',
    '/analytics': 'Analytics',
    '/training': 'Training',
    '/profile': 'Profile',
    '/admin': 'Admin Governance',
    '/report': 'Report Incident',
  };
  
  for (const [path, title] of Object.entries(titleMap)) {
    if (pathname.startsWith(path)) {
      return title;
    }
  }
  return 'CECD';
};

// Helper function to format time ago
const getTimeAgo = (timestamp: number): string => {
  const now = Date.now();
  const diff = now - timestamp;
  
  if (diff < 60000) return 'Just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`;
  
  return new Date(timestamp).toLocaleDateString();
};

const Header: React.FC<HeaderProps> = ({ user, walletProvider, mobileMenuOpen = false, onMobileMenuToggle }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

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
            <span className="text-white font-semibold text-sm">{getPageTitle(location.pathname)}</span>
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

          {/* Notifications - Using NotificationButton Component */}
          <NotificationButton 
            userId={user.id} 
            onNavigate={() => {
              navigate('/incidents');
              setShowNotifications(false);
            }}
          />

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
