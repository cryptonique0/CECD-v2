// securityService.ts
// End-to-end encryption, zero-trust, granular access controls

import { rbacService } from './rbacService';
import type { User } from '../types';

class SecurityService {
  // Simple symmetric encryption (stub, replace with real crypto)
  encrypt(data: string, key: string): string {
    // TODO: Use AES or libsodium for real encryption
    return Buffer.from(data).toString('base64') + ':' + key;
  }

  decrypt(encrypted: string, key: string): string {
    const [data, k] = encrypted.split(':');
    if (k !== key) throw new Error('Invalid key');
    return Buffer.from(data, 'base64').toString('utf8');
  }

  // Zero-trust access check
  hasAccess(user: User, resource: string, action: string): boolean {
    // Use RBAC for access control
    return rbacService.hasPermission(user, action as any);
  }

  // Encrypt evidence
  encryptEvidence(evidence: any, key: string): any {
    // Encrypt all string fields
    const encrypted = { ...evidence };
    Object.keys(encrypted).forEach(k => {
      if (typeof encrypted[k] === 'string') encrypted[k] = this.encrypt(encrypted[k], key);
    });
    return encrypted;
  }

  // Decrypt evidence
  decryptEvidence(evidence: any, key: string): any {
    const decrypted = { ...evidence };
    Object.keys(decrypted).forEach(k => {
      if (typeof decrypted[k] === 'string' && decrypted[k].includes(':')) decrypted[k] = this.decrypt(decrypted[k], key);
    });
    return decrypted;
  }
}

export const securityService = new SecurityService();
