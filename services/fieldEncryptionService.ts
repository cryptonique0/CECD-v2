/**
 * Field-Level Encryption Service
 * Implements encryption/decryption for sensitive fields with role-based access
 */

interface EncryptedField {
  value: string; // encrypted data (base64)
  algorithm: 'AES-256-GCM' | 'RSA-2048' | 'ChaCha20-Poly1305';
  iv: string; // initialization vector (base64)
  tag?: string; // authentication tag for GCM (base64)
  encryptedAt: number;
  expiresAt?: number;
  encryptedBy: string;
}

interface DecryptionContext {
  userId: string;
  userRole: string;
  certifications: string[];
  hasMFA: boolean;
  jurisdiction: string;
}

class FieldEncryptionService {
  private masterKey: string = ''; // In production, fetch from secure key management service
  private fieldKeys: Map<string, CryptoKey> = new Map();

  /**
   * Initialize encryption service
   */
  async initialize(masterKey?: string) {
    if (masterKey) {
      this.masterKey = masterKey;
    } else {
      // Generate a random master key (in production, use KMS)
      this.masterKey = this.generateRandomKey(32);
    }
  }

  /**
   * Generate random key
   */
  private generateRandomKey(length: number): string {
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Derive field-specific key from master key
   */
  private async deriveFieldKey(fieldPath: string): Promise<CryptoKey> {
    if (this.fieldKeys.has(fieldPath)) {
      return this.fieldKeys.get(fieldPath)!;
    }

    // Use Web Crypto API to derive key
    const encoder = new TextEncoder();
    const masterKeyData = encoder.encode(this.masterKey + fieldPath);
    
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      masterKeyData,
      'PBKDF2',
      false,
      ['deriveBits', 'deriveKey']
    );

    const salt = encoder.encode('cecd-field-encryption-salt');
    const key = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt,
        iterations: 100000,
        hash: 'SHA-256',
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt']
    );

    this.fieldKeys.set(fieldPath, key);
    return key;
  }

  /**
   * Encrypt field value
   */
  async encryptField(
    fieldPath: string,
    value: any,
    userId: string,
    expiryMs?: number
  ): Promise<EncryptedField> {
    const key = await this.deriveFieldKey(fieldPath);
    const encoder = new TextEncoder();
    const data = encoder.encode(JSON.stringify(value));

    // Generate random IV
    const iv = crypto.getRandomValues(new Uint8Array(12));

    // Encrypt with AES-GCM
    const encryptedData = await crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv,
      },
      key,
      data
    );

    // Extract ciphertext and auth tag
    const encryptedArray = new Uint8Array(encryptedData);
    const ciphertext = encryptedArray.slice(0, -16);
    const tag = encryptedArray.slice(-16);

    return {
      value: this.arrayBufferToBase64(ciphertext),
      algorithm: 'AES-256-GCM',
      iv: this.arrayBufferToBase64(iv),
      tag: this.arrayBufferToBase64(tag),
      encryptedAt: Date.now(),
      expiresAt: expiryMs ? Date.now() + expiryMs : undefined,
      encryptedBy: userId,
    };
  }

  /**
   * Decrypt field value
   */
  async decryptField(
    fieldPath: string,
    encrypted: EncryptedField,
    context: DecryptionContext
  ): Promise<any> {
    // Check expiry
    if (encrypted.expiresAt && encrypted.expiresAt < Date.now()) {
      throw new Error('Encrypted data has expired');
    }

    // In production, check access permissions here using jurisdictionService
    // For now, simplified check
    if (!this.hasAccess(fieldPath, context)) {
      throw new Error('Access denied: insufficient permissions to decrypt this field');
    }

    const key = await this.deriveFieldKey(fieldPath);

    // Reconstruct encrypted data with tag
    const ciphertext = this.base64ToArrayBuffer(encrypted.value);
    const iv = this.base64ToArrayBuffer(encrypted.iv);
    const tag = encrypted.tag ? this.base64ToArrayBuffer(encrypted.tag) : new Uint8Array(0);

    // Combine ciphertext and tag
    const encryptedData = new Uint8Array(ciphertext.byteLength + tag.byteLength);
    encryptedData.set(new Uint8Array(ciphertext), 0);
    encryptedData.set(new Uint8Array(tag), ciphertext.byteLength);

    try {
      const decryptedData = await crypto.subtle.decrypt(
        {
          name: 'AES-GCM',
          iv,
        },
        key,
        encryptedData
      );

      const decoder = new TextDecoder();
      const jsonString = decoder.decode(decryptedData);
      return JSON.parse(jsonString);
    } catch (error) {
      throw new Error('Decryption failed: data may be corrupted or tampered with');
    }
  }

  /**
   * Check if user has access to decrypt field
   */
  private hasAccess(fieldPath: string, context: DecryptionContext): boolean {
    // Medical notes - only certified medical personnel
    if (fieldPath === 'medicalNotes') {
      const medicalRoles = ['emt', 'paramedic', 'doctor', 'nurse', 'admin'];
      const medicalCerts = ['EMT-B', 'EMT-A', 'EMT-P', 'RN', 'MD', 'DO'];
      
      if (!medicalRoles.includes(context.userRole)) {
        return false;
      }

      const hasCert = context.certifications.some(cert => medicalCerts.includes(cert));
      if (!hasCert) {
        return false;
      }

      // Require MFA for medical notes
      if (!context.hasMFA) {
        return false;
      }

      return true;
    }

    // Patient vitals - medical personnel and dispatchers
    if (fieldPath === 'patientVitals') {
      const allowedRoles = ['emt', 'paramedic', 'doctor', 'nurse', 'dispatcher', 'admin'];
      return allowedRoles.includes(context.userRole);
    }

    // PII - commanders, dispatchers, admins
    if (fieldPath === 'personalInfo') {
      const allowedRoles = ['dispatcher', 'commander', 'admin'];
      return allowedRoles.includes(context.userRole) && context.hasMFA;
    }

    // Financial data - admins and financial managers only
    if (fieldPath === 'financialData') {
      const allowedRoles = ['admin', 'financial_manager'];
      return allowedRoles.includes(context.userRole) && context.hasMFA;
    }

    // Witness statements - commanders, analysts, admins
    if (fieldPath === 'witnessStatements') {
      const allowedRoles = ['commander', 'analyst', 'admin'];
      return allowedRoles.includes(context.userRole);
    }

    // Default: allow access
    return true;
  }

  /**
   * Encrypt multiple fields in an object
   */
  async encryptFields(
    obj: any,
    fieldPaths: string[],
    userId: string
  ): Promise<any> {
    const encrypted = { ...obj };

    for (const fieldPath of fieldPaths) {
      const value = this.getNestedValue(obj, fieldPath);
      if (value !== undefined) {
        const encryptedField = await this.encryptField(fieldPath, value, userId);
        this.setNestedValue(encrypted, fieldPath, encryptedField);
      }
    }

    return encrypted;
  }

  /**
   * Decrypt multiple fields in an object
   */
  async decryptFields(
    obj: any,
    fieldPaths: string[],
    context: DecryptionContext
  ): Promise<any> {
    const decrypted = { ...obj };

    for (const fieldPath of fieldPaths) {
      const encryptedValue = this.getNestedValue(obj, fieldPath);
      if (encryptedValue && this.isEncryptedField(encryptedValue)) {
        try {
          const decryptedValue = await this.decryptField(fieldPath, encryptedValue, context);
          this.setNestedValue(decrypted, fieldPath, decryptedValue);
        } catch (error) {
          // If decryption fails, set to null or keep encrypted
          this.setNestedValue(decrypted, fieldPath, '[ENCRYPTED - ACCESS DENIED]');
        }
      }
    }

    return decrypted;
  }

  /**
   * Check if value is an encrypted field
   */
  private isEncryptedField(value: any): value is EncryptedField {
    return (
      value &&
      typeof value === 'object' &&
      'value' in value &&
      'algorithm' in value &&
      'iv' in value &&
      'encryptedAt' in value
    );
  }

  /**
   * Get nested value from object
   */
  private getNestedValue(obj: any, path: string): any {
    const keys = path.split('.');
    let value = obj;
    for (const key of keys) {
      if (value === null || value === undefined) return undefined;
      value = value[key];
    }
    return value;
  }

  /**
   * Set nested value in object
   */
  private setNestedValue(obj: any, path: string, value: any) {
    const keys = path.split('.');
    let current = obj;
    for (let i = 0; i < keys.length - 1; i++) {
      if (!(keys[i] in current)) {
        current[keys[i]] = {};
      }
      current = current[keys[i]];
    }
    current[keys[keys.length - 1]] = value;
  }

  /**
   * Utility: ArrayBuffer to Base64
   */
  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  /**
   * Utility: Base64 to ArrayBuffer
   */
  private base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  }

  /**
   * Generate encryption key for export (for data portability)
   */
  async generateExportKey(userId: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(this.masterKey + userId + Date.now());
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    return this.arrayBufferToBase64(hashBuffer);
  }

  /**
   * Audit log for decryption attempts
   */
  logDecryptionAttempt(
    fieldPath: string,
    userId: string,
    success: boolean,
    reason?: string
  ) {
    console.log('[Field Encryption Audit]', {
      timestamp: new Date().toISOString(),
      fieldPath,
      userId,
      success,
      reason,
    });
    // In production, send to audit trail service
  }
}

// Export singleton
export const fieldEncryptionService = new FieldEncryptionService();
export type { EncryptedField, DecryptionContext };
