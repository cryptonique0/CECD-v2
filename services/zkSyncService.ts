import { Provider, Wallet } from 'zksync-ethers';
import { ethers } from 'ethers';

// zkSync Service
export class ZkSyncService {
  private provider: Provider;
  private wallet: Wallet;

  constructor(privateKey: string, zkSyncRpcUrl: string) {
    // Initialize zkSync provider and wallet
    this.provider = new Provider(zkSyncRpcUrl);
    this.wallet = new Wallet(privateKey, this.provider);
  }

  // Validate input amount
  private validateAmount(amount: string) {
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      throw new Error('Invalid amount');
    }
  }

  // Validate recipient address
  private validateAddress(address: string) {
    if (!ethers.isAddress(address)) {
      throw new Error('Invalid address');
    }
  }

  // Deposit funds from L1 to zkSync
  async depositFunds(amount: string, token: string = 'ETH') {
    this.validateAmount(amount);

    const depositHandle = await this.wallet.deposit({
      token,
      amount: ethers.parseEther(amount),
    });

    console.log('Deposit submitted:', depositHandle.hash);
    await depositHandle.wait();
    console.log('Deposit confirmed');
  }

  // Transfer funds within zkSync
  async transferFunds(to: string, amount: string, token: string = 'ETH') {
    this.validateAmount(amount);
    this.validateAddress(to);

    const transferHandle = await this.wallet.transfer({
      to,
      token,
      amount: ethers.parseEther(amount),
    });

    console.log('Transfer submitted:', transferHandle.hash);
    await transferHandle.wait();
    console.log('Transfer confirmed');
  }

  // Withdraw funds from zkSync to L1
  async withdrawFunds(amount: string, token: string = 'ETH') {
    const withdrawHandle = await this.wallet.withdraw({
      token,
      amount: ethers.parseEther(amount),
    });

    console.log('Withdrawal submitted:', withdrawHandle.hash);
    await withdrawHandle.wait();
    console.log('Withdrawal confirmed');
  }

  // Helper method to validate Ethereum addresses
  private isValidAddress(address: string): boolean {
    // Basic Ethereum address validation
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  }
}