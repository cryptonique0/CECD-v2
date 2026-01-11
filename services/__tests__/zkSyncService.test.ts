import { ZkSyncService } from '../zkSyncService';
import { ethers } from 'ethers';
import { JsonRpcProvider } from 'zksync-ethers';

// Mock data
const mockPrivateKey = '0x0123456789012345678901234567890123456789012345678901234567890123';
const mockRpcUrl = 'https://zksync2-testnet.zksync.dev';
const mockAddress = '0x1234567890123456789012345678901234567890';

// Mock ethers.js functions
jest.mock('ethers', () => {
  const originalModule = jest.requireActual('ethers');
  return {
    ...originalModule,
    Wallet: jest.fn().mockImplementation(() => ({
      deposit: jest.fn(() => ({ hash: 'mockDepositHash', wait: jest.fn() })),
      transfer: jest.fn(() => ({ hash: 'mockTransferHash', wait: jest.fn() })),
      withdraw: jest.fn(() => ({ hash: 'mockWithdrawHash', wait: jest.fn() })),
    })),
  };
});

// Mock zksync-ethers functions
jest.mock('zksync-ethers', () => {
  const originalModule = jest.requireActual('zksync-ethers');
  return {
    ...originalModule,
    JsonRpcProvider: jest.fn().mockImplementation(() => ({
      getNetwork: jest.fn(() => Promise.resolve({})),
      detectNetwork: jest.fn(() => Promise.resolve({})),
      send: jest.fn(() => Promise.resolve({})),
    })),
    Wallet: jest.fn().mockImplementation(() => ({
      deposit: jest.fn(() => ({ hash: 'mockDepositHash', wait: jest.fn() })),
      transfer: jest.fn(() => ({ hash: 'mockTransferHash', wait: jest.fn() })),
      withdraw: jest.fn(() => ({ hash: 'mockWithdrawHash', wait: jest.fn() })),
    })),
  };
});

describe('ZkSyncService', () => {
  let zkSyncService: ZkSyncService;

  beforeEach(() => {
    zkSyncService = new ZkSyncService(mockPrivateKey, mockRpcUrl);
  });

  it('should deposit funds', async () => {
    const consoleSpy = jest.spyOn(console, 'log');
    await zkSyncService.depositFunds('1');

    expect(consoleSpy).toHaveBeenCalledWith('Deposit submitted:', 'mockDepositHash');
    expect(consoleSpy).toHaveBeenCalledWith('Deposit confirmed');
  });

  it('should transfer funds', async () => {
    const consoleSpy = jest.spyOn(console, 'log');
    await zkSyncService.transferFunds(mockAddress, '1');

    expect(consoleSpy).toHaveBeenCalledWith('Transfer submitted:', 'mockTransferHash');
    expect(consoleSpy).toHaveBeenCalledWith('Transfer confirmed');
  });

  it('should withdraw funds', async () => {
    const consoleSpy = jest.spyOn(console, 'log');
    await zkSyncService.withdrawFunds('1');

    expect(consoleSpy).toHaveBeenCalledWith('Withdrawal submitted:', 'mockWithdrawHash');
    expect(consoleSpy).toHaveBeenCalledWith('Withdrawal confirmed');
  });
});

describe('ZkSyncService - Edge Cases', () => {
  let zkSyncService: ZkSyncService;

  beforeEach(() => {
    zkSyncService = new ZkSyncService(mockPrivateKey, mockRpcUrl);
  });

  it('should throw an error for invalid deposit amount', async () => {
    await expect(zkSyncService.depositFunds('-1')).rejects.toThrow('Invalid amount');
  });

  it('should throw an error for invalid transfer address', async () => {
    await expect(zkSyncService.transferFunds('invalid_address', '1')).rejects.toThrow('Invalid address');
  });

  it('should handle network errors gracefully', async () => {
    jest.spyOn(zkSyncService.wallet, 'deposit').mockImplementationOnce(() => {
      throw new Error('Network error');
    });

    await expect(zkSyncService.depositFunds('1')).rejects.toThrow('Network error');
  });
});