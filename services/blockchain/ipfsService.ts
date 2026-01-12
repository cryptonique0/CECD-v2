/**
 * IPFS Service for decentralized evidence storage
 * Uses Pinata, Web3.Storage, or NFT.Storage as pinning services
 */

interface IPFSFile {
  cid: string;
  name: string;
  size: number;
  type: string;
  url: string;
  pinnedAt: number;
}

interface EvidenceMetadata {
  incidentId: string;
  evidenceType: 'photo' | 'video' | 'document' | 'audio' | 'other';
  uploadedBy: string;
  timestamp: number;
  location?: {
    lat: number;
    lng: number;
  };
  description?: string;
  hash: string;
}

class IPFSService {
  private pinataApiKey: string = '';
  private pinataSecretKey: string = '';
  private web3StorageToken: string = '';
  private useArweave: boolean = false;

  /**
   * Configure IPFS service
   */
  configure(config: {
    pinataApiKey?: string;
    pinataSecretKey?: string;
    web3StorageToken?: string;
    useArweave?: boolean;
  }) {
    if (config.pinataApiKey) this.pinataApiKey = config.pinataApiKey;
    if (config.pinataSecretKey) this.pinataSecretKey = config.pinataSecretKey;
    if (config.web3StorageToken) this.web3StorageToken = config.web3StorageToken;
    if (config.useArweave !== undefined) this.useArweave = config.useArweave;
  }

  /**
   * Upload file to IPFS via Pinata
   */
  async uploadToPinata(file: File, metadata: EvidenceMetadata): Promise<IPFSFile> {
    if (!this.pinataApiKey || !this.pinataSecretKey) {
      throw new Error('Pinata API credentials not configured');
    }

    const formData = new FormData();
    formData.append('file', file);

    // Add metadata
    const pinataMetadata = JSON.stringify({
      name: file.name,
      keyvalues: {
        incidentId: metadata.incidentId,
        evidenceType: metadata.evidenceType,
        uploadedBy: metadata.uploadedBy,
        timestamp: metadata.timestamp.toString(),
      },
    });
    formData.append('pinataMetadata', pinataMetadata);

    const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
      method: 'POST',
      headers: {
        pinata_api_key: this.pinataApiKey,
        pinata_secret_api_key: this.pinataSecretKey,
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Pinata upload failed: ${response.statusText}`);
    }

    const data = await response.json();

    return {
      cid: data.IpfsHash,
      name: file.name,
      size: file.size,
      type: file.type,
      url: `https://gateway.pinata.cloud/ipfs/${data.IpfsHash}`,
      pinnedAt: Date.now(),
    };
  }

  /**
   * Upload to Web3.Storage
   */
  async uploadToWeb3Storage(file: File, metadata: EvidenceMetadata): Promise<IPFSFile> {
    if (!this.web3StorageToken) {
      throw new Error('Web3.Storage token not configured');
    }

    // Create metadata file
    const metadataBlob = new Blob([JSON.stringify(metadata)], { type: 'application/json' });
    const metadataFile = new File([metadataBlob], 'metadata.json');

    const formData = new FormData();
    formData.append('file', file);
    formData.append('file', metadataFile);

    const response = await fetch('https://api.web3.storage/upload', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.web3StorageToken}`,
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Web3.Storage upload failed: ${response.statusText}`);
    }

    const data = await response.json();

    return {
      cid: data.cid,
      name: file.name,
      size: file.size,
      type: file.type,
      url: `https://${data.cid}.ipfs.w3s.link/${file.name}`,
      pinnedAt: Date.now(),
    };
  }

  /**
   * Upload to Arweave (permanent storage)
   */
  async uploadToArweave(file: File, metadata: EvidenceMetadata): Promise<IPFSFile> {
    // This would require Arweave wallet integration
    // For now, use a bundling service like Bundlr
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('tags', JSON.stringify([
      { name: 'Content-Type', value: file.type },
      { name: 'App-Name', value: 'CECD' },
      { name: 'Incident-ID', value: metadata.incidentId },
      { name: 'Evidence-Type', value: metadata.evidenceType },
      { name: 'Uploaded-By', value: metadata.uploadedBy },
      { name: 'Timestamp', value: metadata.timestamp.toString() },
    ]));

    // Using Bundlr network for Arweave uploads
    const response = await fetch('https://node1.bundlr.network/tx', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Arweave upload failed: ${response.statusText}`);
    }

    const data = await response.json();

    return {
      cid: data.id,
      name: file.name,
      size: file.size,
      type: file.type,
      url: `https://arweave.net/${data.id}`,
      pinnedAt: Date.now(),
    };
  }

  /**
   * Upload evidence file (automatically chooses service)
   */
  async uploadEvidence(file: File, metadata: EvidenceMetadata): Promise<IPFSFile> {
    // Hash the file for integrity verification
    const hash = await this.hashFile(file);
    metadata.hash = hash;

    // Choose upload service based on configuration
    if (this.useArweave) {
      return await this.uploadToArweave(file, metadata);
    } else if (this.web3StorageToken) {
      return await this.uploadToWeb3Storage(file, metadata);
    } else if (this.pinataApiKey && this.pinataSecretKey) {
      return await this.uploadToPinata(file, metadata);
    } else {
      throw new Error('No IPFS service configured. Please configure Pinata, Web3.Storage, or Arweave.');
    }
  }

  /**
   * Hash file for integrity verification
   */
  private async hashFile(file: File): Promise<string> {
    const buffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
  }

  /**
   * Retrieve file from IPFS
   */
  async retrieveFile(cid: string, gateway: string = 'ipfs.io'): Promise<Blob> {
    const response = await fetch(`https://${gateway}/ipfs/${cid}`);
    if (!response.ok) {
      throw new Error(`Failed to retrieve file: ${response.statusText}`);
    }
    return await response.blob();
  }

  /**
   * Verify file integrity
   */
  async verifyFileIntegrity(file: File, expectedHash: string): Promise<boolean> {
    const actualHash = await this.hashFile(file);
    return actualHash === expectedHash;
  }

  /**
   * Get file metadata from IPFS
   */
  async getFileMetadata(cid: string): Promise<any> {
    if (!this.pinataApiKey || !this.pinataSecretKey) {
      throw new Error('Pinata API credentials required for metadata retrieval');
    }

    const response = await fetch(`https://api.pinata.cloud/data/pinList?hashContains=${cid}`, {
      headers: {
        pinata_api_key: this.pinataApiKey,
        pinata_secret_api_key: this.pinataSecretKey,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to retrieve metadata');
    }

    const data = await response.json();
    return data.rows[0]?.metadata || null;
  }

  /**
   * Pin existing IPFS hash (if you have a hash from another source)
   */
  async pinByCID(cid: string, name: string): Promise<void> {
    if (!this.pinataApiKey || !this.pinataSecretKey) {
      throw new Error('Pinata API credentials not configured');
    }

    const response = await fetch('https://api.pinata.cloud/pinning/pinByHash', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        pinata_api_key: this.pinataApiKey,
        pinata_secret_api_key: this.pinataSecretKey,
      },
      body: JSON.stringify({
        hashToPin: cid,
        pinataMetadata: { name },
      }),
    });

    if (!response.ok) {
      throw new Error(`Pin by CID failed: ${response.statusText}`);
    }
  }

  /**
   * Unpin file from IPFS
   */
  async unpinFile(cid: string): Promise<void> {
    if (!this.pinataApiKey || !this.pinataSecretKey) {
      throw new Error('Pinata API credentials not configured');
    }

    const response = await fetch(`https://api.pinata.cloud/pinning/unpin/${cid}`, {
      method: 'DELETE',
      headers: {
        pinata_api_key: this.pinataApiKey,
        pinata_secret_api_key: this.pinataSecretKey,
      },
    });

    if (!response.ok) {
      throw new Error(`Unpin failed: ${response.statusText}`);
    }
  }

  /**
   * Generate IPFS gateway URL
   */
  getGatewayUrl(cid: string, filename?: string, gateway: string = 'ipfs.io'): string {
    const path = filename ? `${cid}/${filename}` : cid;
    return `https://${gateway}/ipfs/${path}`;
  }

  /**
   * Batch upload multiple files
   */
  async uploadMultiple(files: File[], baseMetadata: Omit<EvidenceMetadata, 'hash'>): Promise<IPFSFile[]> {
    const uploads = files.map(file => 
      this.uploadEvidence(file, { ...baseMetadata, hash: '' })
    );
    return await Promise.all(uploads);
  }
}

// Export singleton
export const ipfsService = new IPFSService();
export type { IPFSFile, EvidenceMetadata };
