import React, { useState } from 'react';

interface LoginProps {
  onLogin: (address: string, provider: string) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [showWalletModal, setShowWalletModal] = useState(false);

  const wallets = [
    { name: 'MetaMask', icon: 'account_balance_wallet', color: 'text-orange-500', desc: 'Popular Browser Extension' },
    { name: 'Zerion', icon: 'token', color: 'text-blue-500', desc: 'Smart Wallet Interface' },
    { name: 'Trust Wallet', icon: 'shield', color: 'text-blue-600', desc: 'Mobile Crypto Wallet' },
    { name: 'WalletConnect', icon: 'dynamic_form', color: 'text-sky-500', desc: 'Connect with any Mobile Wallet' }
  ];

  const handleConnectWallet = (wallet: string) => {
    setIsLoading(true);
    setShowWalletModal(false);
    // Simulate smart contract wallet connection handshake
    setTimeout(() => {
      const mockAddress = '0x0522' + Math.random().toString(16).slice(2, 10).toUpperCase() + '...71BF';
      onLogin(mockAddress, wallet);
      setIsLoading(false);
    }, 1200);
  };

  return (
    <div className="min-h-screen w-full bg-background-dark flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute top-0 left-0 w-full h-full opacity-30 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary/20 blur-[150px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-accent-red/10 blur-[150px]"></div>
        <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(#1e293b 0.5px, transparent 0.5px)', backgroundSize: '24px 24px' }}></div>
      </div>

      <div className="max-w-md w-full flex flex-col gap-10 z-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="flex flex-col items-center text-center gap-4">
          <div className="bg-primary/20 p-6 rounded-[3rem] text-primary shadow-glow-lg border border-primary/30 relative overflow-hidden group">
            <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <span className="material-symbols-outlined text-6xl filled relative z-10 flex items-center justify-center">shield</span>
            <div className="absolute -top-1 -right-1 size-4 bg-accent-green rounded-full border-4 border-background-dark animate-pulse z-20"></div>
          </div>
          <div className="flex flex-col gap-2">
            <h1 className="text-4xl font-black text-white tracking-tighter uppercase italic leading-tight">CECD Global</h1>
            <p className="text-text-secondary text-[11px] font-bold tracking-widest uppercase opacity-80">Community Emergency Coordination Dashboard</p>
            <div className="flex items-center justify-center gap-2 mt-3">
              <span className="px-3 py-1 rounded-full bg-slate-800 text-[10px] font-black text-slate-300 border border-border-dark uppercase tracking-widest">Base Mainnet</span>
              <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-[10px] font-black text-accent-green border border-accent-green/20 uppercase tracking-widest">v2.5 Secured</span>
            </div>
          </div>
        </div>

        <div className="bg-card-dark border border-border-dark p-8 rounded-[3rem] shadow-2xl flex flex-col gap-6 relative group overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none"></div>
          
          <div className="flex flex-col gap-1 relative z-10">
            <h2 className="text-xl font-black text-white uppercase italic tracking-tight leading-none">{isSignUp ? 'Onboard New Node' : 'Command Auth'}</h2>
            <p className="text-[11px] text-text-secondary font-bold uppercase tracking-wider mt-1 opacity-60">{isSignUp ? 'Create global profile' : 'Authorize via Base wallet'}</p>
          </div>

          <div className="flex flex-col gap-4 relative z-10">
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest ml-1 opacity-60">Operations Contract</label>
              <div className="bg-background-dark border border-border-dark rounded-2xl py-4 px-5 text-xs font-mono text-white/40 flex items-center justify-between group-hover:border-primary/20 transition-colors">
                <span>0x0522...71BF</span>
                <span className="material-symbols-outlined text-sm text-primary flex items-center justify-center">lock</span>
              </div>
            </div>
          </div>

          {/* Tactical Button - Improved Size and Containment */}
          <button 
            onClick={() => setShowWalletModal(true)}
            disabled={isLoading}
            className="w-full h-16 rounded-[2rem] bg-primary hover:bg-primary-dark text-white font-black transition-all shadow-glow active:scale-95 flex items-center justify-center disabled:opacity-50 group/btn relative overflow-hidden px-8"
          >
            {isLoading ? (
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined animate-spin text-xl flex items-center justify-center">sync</span>
                <span className="text-base uppercase italic tracking-tighter">Connecting...</span>
              </div>
            ) : (
              <div className="flex items-center gap-3 w-full justify-center overflow-hidden">
                <div className="size-8 flex items-center justify-center shrink-0">
                   <span className="material-symbols-outlined text-2xl filled block group-hover/btn:scale-110 transition-transform">
                     account_balance_wallet
                   </span>
                </div>
                <span className="text-base uppercase italic tracking-widest truncate whitespace-nowrap pt-0.5">
                  {isSignUp ? 'Initialize Wallet' : 'Connect Wallet'}
                </span>
              </div>
            )}
          </button>

          <div className="flex items-center gap-4 my-2 opacity-30">
            <div className="flex-1 h-px bg-border-dark"></div>
            <span className="text-[10px] font-black text-text-secondary uppercase tracking-widest text-center whitespace-nowrap">Global Ops Hub</span>
            <div className="flex-1 h-px bg-border-dark"></div>
          </div>

          <div className="flex items-center justify-between text-white/80 transition-colors relative z-10">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-accent-green text-[20px] filled animate-bounce flex items-center justify-center">public</span>
              <span className="text-[11px] font-black tracking-tight italic uppercase">Worldwide Node</span>
            </div>
            <button 
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-[10px] font-black text-primary hover:text-white uppercase tracking-widest transition-colors"
            >
              {isSignUp ? 'Existing Account?' : 'Register Node?'}
            </button>
          </div>
        </div>

        <p className="text-center text-[10px] text-text-secondary/40 leading-relaxed uppercase font-black tracking-widest px-12">
          By connecting, you agree to the immutable ledger policies of the CECD Global Emergency Network.
        </p>
      </div>

      {/* Wallet Selection Modal */}
      {showWalletModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-background-dark/80 backdrop-blur-sm" onClick={() => setShowWalletModal(false)}></div>
          <div className="bg-card-dark border border-border-dark w-full max-sm rounded-[3rem] shadow-2xl relative z-10 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-8 py-6 border-b border-border-dark flex justify-between items-center bg-slate-900/50">
              <h3 className="text-sm font-black text-white uppercase tracking-widest italic">Tactical Provider</h3>
              <button onClick={() => setShowWalletModal(false)} className="size-8 rounded-full hover:bg-white/5 transition-colors flex items-center justify-center">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="p-4 flex flex-col gap-2">
              {wallets.map((wallet) => (
                <button 
                  key={wallet.name}
                  onClick={() => handleConnectWallet(wallet.name)}
                  className="flex items-center justify-between p-4 rounded-3xl hover:bg-primary/10 border border-transparent hover:border-primary/20 transition-all group"
                >
                  <div className="flex items-center gap-4">
                    <div className={`size-14 rounded-2xl bg-slate-800 flex items-center justify-center ${wallet.color} group-hover:scale-110 transition-transform shadow-inner`}>
                      <span className="material-symbols-outlined text-4xl filled">{wallet.icon}</span>
                    </div>
                    <div className="flex flex-col items-start">
                      <span className="text-sm font-black text-white">{wallet.name}</span>
                      <span className="text-[10px] text-text-secondary font-bold uppercase tracking-tight opacity-60">{wallet.desc}</span>
                    </div>
                  </div>
                  <span className="material-symbols-outlined text-text-secondary opacity-0 group-hover:opacity-100 transition-opacity translate-x-[-10px] group-hover:translate-x-0">chevron_right</span>
                </button>
              ))}
            </div>
            <div className="p-6 bg-slate-900/50 text-center border-t border-border-dark">
              <p className="text-[10px] text-text-secondary font-bold uppercase tracking-widest">Connected to Base Mainnet v2.5</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;
