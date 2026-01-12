// auditLogService.ts
// Logs sensitive actions for governance and compliance

import type { User } from '../types';

export interface AuditLogEntry {
  id: string;
  timestamp: number;
  userId: string;
  userName: string;
  userRole: string;
  action: string;
  resource: string;
  details?: string;
  result: 'success' | 'failure';
}

class AuditLogService {
  private logs: AuditLogEntry[] = [];

  logAction(entry: Omit<AuditLogEntry, 'id' | 'timestamp'>) {
    this.logs.push({
      id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      timestamp: Date.now(),
      ...entry
    });
  }

  getLogs(filter?: Partial<AuditLogEntry>): AuditLogEntry[] {
    if (!filter) return this.logs;
    return this.logs.filter(log => {
      return Object.entries(filter).every(([key, value]) => (log as any)[key] === value);
    });
  }

  clearLogs() {
    this.logs = [];
  }
}

export const auditLogService = new AuditLogService();
