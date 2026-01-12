import React, { useState, useEffect } from 'react';
import { walletAuthService, WalletUser } from '../services/blockchain/walletAuthService';
import { blockchainIntegration } from '../services/blockchainIntegration';

interface BlockchainWalletProps {
  onConnected?: (user: WalletUser) => void;
  onDisconnected?: () => void;
}

const BlockchainWallet: React.FC<BlockchainWalletProps> = ({ onConnected, onDisconnected }) => {
  const [user, setUser] = useState<WalletUser | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [networkInfo, setNetworkInfo] = useState<any>(null);

  useEffect(() => {
    // Try to restore session on mount
    restoreSession();

    // Listen to account changes
    walletAuthService.onAccountsChanged((address) => {
      if (!address) {
        handleDisconnect();
      }
    });
  }, []);

  const restoreSession = async () => {
    try {
      const restoredUser = await walletAuthService.restoreSession();
      if (restoredUser) {
        setUser(restoredUser);
        setNetworkInfo(blockchainIntegration.getNetworkInfo());
        onConnected?.(restoredUser);
      }
    } catch (err) {
      console.error('Failed to restore session:', err);
    }
  };

  const handleConnect = async () => {
    setIsConnecting(true);
    setError(null);

    try {
      const address = await blockchainIntegration.initialize();
      const connectedUser = walletAuthService.getCurrentUser();
      
      if (connectedUser) {
        setUser(connectedUser);
        setNetworkInfo(blockchainIntegration.getNetworkInfo());
        onConnected?.(connectedUser);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to connect wallet');
      console.error('Wallet connection error:', err);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = () => {
    blockchainIntegration.disconnect();
    setUser(null);
    setNetworkInfo(null);
    onDisconnected?.();
  };

  const getRoleBadgeColor = (role: WalletUser['role']) => {
    const colors: Record<WalletUser['role'], string> = {
      admin: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
      commander: 'bg-red-500/20 text-red-300 border-red-500/40',
      dispatcher: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
      analyst: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
      responder: 'bg-green-500/20 text-green-300 border-green-500/40',
      volunteer: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40',
      donor: 'bg-pink-500/20 text-pink-300 border-pink-500/40',
    };
    return colors[role];
  };

  if (!user) {
    return (
      <div className="flex flex-col items-center gap-4">
        <button
          onClick={handleConnect}
          disabled={isConnecting}
          className="px-6 py-3 rounded-lg bg-gradient-to-r from-primary to-blue-500 text-white font-bold hover:shadow-lg hover:shadow-primary/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3"
        >
          <span className="material-symbols-outlined">account_balance_wallet</span>
          {isConnecting ? 'Connecting...' : 'Connect Wallet'}
        </button>
        
        {error && (
          <div className="px-4 py-2 rounded-lg bg-accent-red/10 border border-accent-red/30 text-accent-red text-sm">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">error</span>
              {error}
            </div>
          </div>
        )}

        <p className="text-text-secondary text-xs text-center max-w-sm">
          Connect your wallet to access blockchain features: on-chain incident anchoring, transparent donations, and verified identity.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* User Info Card */}
      <div className="bg-card-dark border border-border-dark rounded-2xl p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="material-symbols-outlined text-primary">account_circle</span>
              <h3 className="text-white font-bold">
                {user.displayName || walletAuthService.formatAddress(user.address)}
              </h3>
              {user.verified && (
                <span className="material-symbols-outlined text-emerald-400 text-sm" title="Verified">
                  verified
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 mb-3">
              <code className="text-[10px] text-text-secondary bg-background-dark px-2 py-1 rounded font-mono">
                {user.address}
              </code>
              <button
                onClick={() => navigator.clipboard.writeText(user.address)}
                className="text-text-secondary hover:text-white transition-colors"
                title="Copy address"
              >
                <span className="material-symbols-outlined text-sm">content_copy</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <span className={`px-2 py-1 rounded text-[9px] font-black uppercase border ${getRoleBadgeColor(user.role)}`}>
                {user.role}
              </span>
              {networkInfo && (
                <span className="px-2 py-1 rounded text-[9px] font-semibold bg-slate-800 text-text-secondary border border-border-dark">
                  {networkInfo.name}
                </span>
              )}
            </div>
          </div>

          <button
            onClick={handleDisconnect}
            className="px-3 py-1.5 rounded-lg text-[10px] font-semibold text-text-secondary hover:text-white hover:bg-white/5 transition-all border border-border-dark"
          >
            Disconnect
          </button>
        </div>
      </div>

      {/* Network Info */}
      {networkInfo && (
        <div className="text-[10px] text-text-secondary flex items-center gap-4">
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Connected to {networkInfo.name}
          </div>
          <a
            href={networkInfo.blockExplorer}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline flex items-center gap-1"
          >
            View on Explorer
            <span className="material-symbols-outlined text-xs">open_in_new</span>
          </a>
        </div>
      )}
    </div>
  );
};

export default BlockchainWallet;
