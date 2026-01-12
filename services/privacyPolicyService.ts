// privacyPolicyService.ts
// Centralized privacy and retention enforcement

export interface DataRetentionPolicy {
  resource: string;
  retentionDays: number;
  anonymizeOnExpire: boolean;
}

const defaultPolicies: DataRetentionPolicy[] = [
  { resource: '911_call', retentionDays: 90, anonymizeOnExpire: true },
  { resource: 'incident', retentionDays: 365, anonymizeOnExpire: false },
  { resource: 'chat_message', retentionDays: 30, anonymizeOnExpire: true },
  { resource: 'audit_log', retentionDays: 730, anonymizeOnExpire: false }
];

class PrivacyPolicyService {
  private policies: DataRetentionPolicy[] = defaultPolicies;

  getPolicy(resource: string): DataRetentionPolicy {
    return this.policies.find(p => p.resource === resource) || { resource, retentionDays: 365, anonymizeOnExpire: false };
  }

  setPolicy(policy: DataRetentionPolicy) {
    const idx = this.policies.findIndex(p => p.resource === policy.resource);
    if (idx >= 0) this.policies[idx] = policy;
    else this.policies.push(policy);
  }

  // Check if a record is expired
  isExpired(resource: string, createdAt: number): boolean {
    const policy = this.getPolicy(resource);
    const ageDays = (Date.now() - createdAt) / 86400000;
    return ageDays > policy.retentionDays;
  }

  // Enforce retention: purge or anonymize expired records
  enforceRetention(records: any[], resource: string): any[] {
    const policy = this.getPolicy(resource);
    return records.map(r => {
      if (this.isExpired(resource, r.timestamp || r.createdAt)) {
        if (policy.anonymizeOnExpire) {
          // Mask all PII fields
          Object.keys(r).forEach(k => {
            if (k.match(/phone|name|email|location|address|transcript|message/)) r[k] = 'REDACTED';
          });
        } else {
          return null;
        }
      }
      return r;
    }).filter(Boolean);
  }
}

export const privacyPolicyService = new PrivacyPolicyService();
