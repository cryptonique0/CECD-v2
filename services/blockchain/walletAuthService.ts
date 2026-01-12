import { ethers } from 'ethers';

interface WalletUser {
  address: string;
  role: 'dispatcher' | 'analyst' | 'commander' | 'responder' | 'admin' | 'volunteer' | 'donor';
  displayName?: string;
  verified: boolean;
  registeredAt: number;
  lastLogin: number;
  nonce?: string;
}

interface SignInMessage {
  domain: string;
  address: string;
  statement: string;
  uri: string;
  version: string;
  chainId: number;
  nonce: string;
  issuedAt: string;
}

class WalletAuthService {
  private currentUser: WalletUser | null = null;
  private nonces: Map<string, string> = new Map();
  private sessionDuration = 24 * 60 * 60 * 1000; // 24 hours

  /**
   * Generate authentication nonce for wallet
   */
  generateNonce(address: string): string {
    const nonce = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    this.nonces.set(address.toLowerCase(), nonce);
    return nonce;
  }

  /**
   * Create sign-in message (SIWE - Sign-In with Ethereum compatible)
   */
  createSignInMessage(address: string, chainId: number): string {
    const nonce = this.generateNonce(address);
    const issuedAt = new Date().toISOString();

    const message = `CECD - Community Emergency Coordination Dashboard

Welcome to CECD! Sign this message to authenticate your wallet.

Address: ${address}
Chain ID: ${chainId}
Nonce: ${nonce}
Issued At: ${issuedAt}
URI: ${window.location.origin}
Version: 1

This request will not trigger a blockchain transaction or cost any gas fees.`;

    return message;
  }

  /**
   * Sign in with wallet
   */
  async signInWithWallet(): Promise<WalletUser> {
    if (typeof window === 'undefined' || !(window as any).ethereum) {
      throw new Error('MetaMask or compatible wallet not found');
    }

    const browserProvider = new ethers.BrowserProvider((window as any).ethereum);
    await browserProvider.send('eth_requestAccounts', []);
    
    const signer = await browserProvider.getSigner();
    const address = await signer.getAddress();
    const network = await browserProvider.getNetwork();

    // Create sign-in message
    const message = this.createSignInMessage(address, Number(network.chainId));

    // Request signature
    const signature = await signer.signMessage(message);

    // Verify signature
    const verified = await this.verifySignature(address, message, signature);
    
    if (!verified) {
      throw new Error('Signature verification failed');
    }

    // Get or create user profile
    const user = this.getUserProfile(address) || this.createUserProfile(address);
    user.lastLogin = Date.now();
    
    this.currentUser = user;
    this.saveSession(user);

    return user;
  }

  /**
   * Verify signature
   */
  private async verifySignature(address: string, message: string, signature: string): Promise<boolean> {
    try {
      const recoveredAddress = ethers.verifyMessage(message, signature);
      return recoveredAddress.toLowerCase() === address.toLowerCase();
    } catch (error) {
      console.error('Signature verification error:', error);
      return false;
    }
  }

  /**
   * Create new user profile
   */
  private createUserProfile(address: string): WalletUser {
    const user: WalletUser = {
      address: address.toLowerCase(),
      role: 'volunteer', // Default role
      verified: false,
      registeredAt: Date.now(),
      lastLogin: Date.now(),
    };

    // Save to localStorage (in production, save to backend)
    this.saveUserProfile(user);
    return user;
  }

  /**
   * Get user profile from storage
   */
  private getUserProfile(address: string): WalletUser | null {
    const stored = localStorage.getItem(`wallet_user_${address.toLowerCase()}`);
    if (!stored) return null;
    return JSON.parse(stored);
  }

  /**
   * Save user profile
   */
  private saveUserProfile(user: WalletUser) {
    localStorage.setItem(`wallet_user_${user.address}`, JSON.stringify(user));
  }

  /**
   * Save session
   */
  private saveSession(user: WalletUser) {
    const session = {
      user,
      expiresAt: Date.now() + this.sessionDuration,
    };
    localStorage.setItem('wallet_session', JSON.stringify(session));
  }

  /**
   * Restore session
   */
  async restoreSession(): Promise<WalletUser | null> {
    const stored = localStorage.getItem('wallet_session');
    if (!stored) return null;

    const session = JSON.parse(stored);
    
    // Check if session expired
    if (Date.now() > session.expiresAt) {
      this.signOut();
      return null;
    }

    // Verify wallet is still connected
    if (typeof window !== 'undefined' && (window as any).ethereum) {
      try {
        const browserProvider = new ethers.BrowserProvider((window as any).ethereum);
        const accounts = await browserProvider.send('eth_accounts', []);
        
        if (accounts.length === 0 || accounts[0].toLowerCase() !== session.user.address) {
          this.signOut();
          return null;
        }
      } catch (error) {
        this.signOut();
        return null;
      }
    }

    this.currentUser = session.user;
    return session.user;
  }

  /**
   * Sign out
   */
  signOut() {
    this.currentUser = null;
    localStorage.removeItem('wallet_session');
  }

  /**
   * Get current user
   */
  getCurrentUser(): WalletUser | null {
    return this.currentUser;
  }

  /**
   * Update user role (admin only)
   */
  async updateUserRole(address: string, role: WalletUser['role']): Promise<void> {
    if (!this.currentUser || this.currentUser.role !== 'admin') {
      throw new Error('Only admins can update user roles');
    }

    const user = this.getUserProfile(address);
    if (!user) {
      throw new Error('User not found');
    }

    user.role = role;
    this.saveUserProfile(user);
  }

  /**
   * Verify user (mark as verified responder/dispatcher)
   */
  async verifyUser(address: string): Promise<void> {
    if (!this.currentUser || this.currentUser.role !== 'admin') {
      throw new Error('Only admins can verify users');
    }

    const user = this.getUserProfile(address);
    if (!user) {
      throw new Error('User not found');
    }

    user.verified = true;
    this.saveUserProfile(user);
  }

  /**
   * Update display name
   */
  async updateDisplayName(displayName: string): Promise<void> {
    if (!this.currentUser) {
      throw new Error('Not authenticated');
    }

    this.currentUser.displayName = displayName;
    this.saveUserProfile(this.currentUser);
    this.saveSession(this.currentUser);
  }

  /**
   * Get user by address
   */
  getUserByAddress(address: string): WalletUser | null {
    return this.getUserProfile(address);
  }

  /**
   * Check if address has role
   */
  hasRole(address: string, role: WalletUser['role'] | WalletUser['role'][]): boolean {
    const user = this.getUserProfile(address);
    if (!user) return false;

    if (Array.isArray(role)) {
      return role.includes(user.role);
    }
    return user.role === role;
  }

  /**
   * Check if current user has permission
   */
  hasPermission(permission: string): boolean {
    if (!this.currentUser) return false;

    const rolePermissions: Record<WalletUser['role'], string[]> = {
      admin: ['*'], // All permissions
      commander: ['deploy', 'escalate', 'override', 'authorize_funds', 'manage_teams'],
      dispatcher: ['deploy', 'reassign', 'authorize_small_funds', 'view_all'],
      analyst: ['view_all', 'generate_reports', 'analytics'],
      responder: ['update_status', 'report_incident', 'upload_evidence'],
      volunteer: ['create_incident', 'view_assignments', 'offline_sync'],
      donor: ['donate', 'view_donations', 'track_disbursement'],
    };

    const userPermissions = rolePermissions[this.currentUser.role];
    return userPermissions.includes('*') || userPermissions.includes(permission);
  }

  /**
   * Get short address (0x1234...5678)
   */
  formatAddress(address: string): string {
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  }

  /**
   * Listen to account changes
   */
  onAccountsChanged(callback: (address: string | null) => void) {
    if (typeof window !== 'undefined' && (window as any).ethereum) {
      (window as any).ethereum.on('accountsChanged', (accounts: string[]) => {
        if (accounts.length === 0) {
          this.signOut();
          callback(null);
        } else {
          callback(accounts[0]);
        }
      });
    }
  }

  /**
   * Listen to chain changes
   */
  onChainChanged(callback: (chainId: string) => void) {
    if (typeof window !== 'undefined' && (window as any).ethereum) {
      (window as any).ethereum.on('chainChanged', (chainId: string) => {
        callback(chainId);
        // Reload page on chain change
        window.location.reload();
      });
    }
  }
}

// Export singleton
export const walletAuthService = new WalletAuthService();
export type { WalletUser, SignInMessage };
