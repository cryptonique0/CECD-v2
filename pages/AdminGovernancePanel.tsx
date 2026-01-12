import React, { useState } from 'react';
import { rbacService } from '../services/rbacService';
import { auditLogService } from '../services/auditLogService';
import { privacyPolicyService, DataRetentionPolicy } from '../services/privacyPolicyService';
import { reliabilityService } from '../services/reliabilityService';

// Mock users for demo
const mockUsers = [
  { id: 'u1', name: 'Alice Admin', role: 'admin' },
  { id: 'u2', name: 'Bob Dispatcher', role: 'dispatcher' },
  { id: 'u3', name: 'Carol Auditor', role: 'auditor' }
];

export const AdminGovernancePanel: React.FC = () => {
  const [users, setUsers] = useState(mockUsers);
  const [selectedUser, setSelectedUser] = useState(mockUsers[0]);
  const [policies, setPolicies] = useState<DataRetentionPolicy[]>([
    privacyPolicyService.getPolicy('911_call'),
    privacyPolicyService.getPolicy('incident'),
    privacyPolicyService.getPolicy('chat_message'),
    privacyPolicyService.getPolicy('audit_log')
  ]);
  const [auditLogs] = useState(auditLogService.getLogs().slice(-20));
  const [subsystems] = useState(reliabilityService.getAllSubsystemHealth());

  // Role management
  const handleRoleChange = (userId: string, newRole: string) => {
    setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
  };

  // Policy editor
  const handlePolicyChange = (idx: number, field: keyof DataRetentionPolicy, value: any) => {
    const updated = [...policies];
    updated[idx] = { ...updated[idx], [field]: value };
    setPolicies(updated);
    privacyPolicyService.setPolicy(updated[idx]);
  };

  return (
    <div style={{ padding: 32, background: '#f3f4f6', minHeight: '100vh', color: '#1f2937' }}>
      <h2 style={{ fontSize: 28, marginBottom: 24 }}>Admin Governance Panel</h2>
      {/* User/Role Management */}
      <section style={{ marginBottom: 40 }}>
        <h3 style={{ fontSize: 22, marginBottom: 16 }}>User & Role Management</h3>
        <table style={{ width: '100%', marginBottom: 12 }}>
          <thead>
            <tr style={{ background: '#e5e7eb' }}>
              <th style={{ padding: 8 }}>Name</th>
              <th style={{ padding: 8 }}>Role</th>
              <th style={{ padding: 8 }}>Change Role</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id}>
                <td style={{ padding: 8 }}>{u.name}</td>
                <td style={{ padding: 8 }}>{u.role}</td>
                <td style={{ padding: 8 }}>
                  <select value={u.role} onChange={e => handleRoleChange(u.id, e.target.value)}>
                    <option value="admin">Admin</option>
                    <option value="dispatcher">Dispatcher</option>
                    <option value="responder">Responder</option>
                    <option value="ngo">NGO</option>
                    <option value="public">Public</option>
                    <option value="auditor">Auditor</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      {/* Audit Log Review */}
      <section style={{ marginBottom: 40 }}>
        <h3 style={{ fontSize: 22, marginBottom: 16 }}>Audit Log Review (Last 20)</h3>
        <table style={{ width: '100%', marginBottom: 12 }}>
          <thead>
            <tr style={{ background: '#e5e7eb' }}>
              <th style={{ padding: 8 }}>User</th>
              <th style={{ padding: 8 }}>Role</th>
              <th style={{ padding: 8 }}>Action</th>
              <th style={{ padding: 8 }}>Resource</th>
              <th style={{ padding: 8 }}>Result</th>
              <th style={{ padding: 8 }}>Time</th>
            </tr>
          </thead>
          <tbody>
            {auditLogs.map(l => (
              <tr key={l.id}>
                <td style={{ padding: 8 }}>{l.userName}</td>
                <td style={{ padding: 8 }}>{l.userRole}</td>
                <td style={{ padding: 8 }}>{l.action}</td>
                <td style={{ padding: 8 }}>{l.resource}</td>
                <td style={{ padding: 8, color: l.result === 'success' ? '#10b981' : '#ef4444' }}>{l.result}</td>
                <td style={{ padding: 8 }}>{new Date(l.timestamp).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      {/* Privacy/Retention Policy Editor */}
      <section style={{ marginBottom: 40 }}>
        <h3 style={{ fontSize: 22, marginBottom: 16 }}>Privacy & Retention Policy Editor</h3>
        <table style={{ width: '100%', marginBottom: 12 }}>
          <thead>
            <tr style={{ background: '#e5e7eb' }}>
              <th style={{ padding: 8 }}>Resource</th>
              <th style={{ padding: 8 }}>Retention (days)</th>
              <th style={{ padding: 8 }}>Anonymize on Expire</th>
            </tr>
          </thead>
          <tbody>
            {policies.map((p, idx) => (
              <tr key={p.resource}>
                <td style={{ padding: 8 }}>{p.resource}</td>
                <td style={{ padding: 8 }}>
                  <input type="number" value={p.retentionDays} min={1} max={3650} onChange={e => handlePolicyChange(idx, 'retentionDays', Number(e.target.value))} />
                </td>
                <td style={{ padding: 8 }}>
                  <input type="checkbox" checked={p.anonymizeOnExpire} onChange={e => handlePolicyChange(idx, 'anonymizeOnExpire', e.target.checked)} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      {/* Integration Health & SLA Overview */}
      <section>
        <h3 style={{ fontSize: 22, marginBottom: 16 }}>Integration Health & SLA Overview</h3>
        <table style={{ width: '100%' }}>
          <thead>
            <tr style={{ background: '#e5e7eb' }}>
              <th style={{ padding: 8 }}>Subsystem</th>
              <th style={{ padding: 8 }}>Status</th>
              <th style={{ padding: 8 }}>Last Checked</th>
              <th style={{ padding: 8 }}>Details</th>
            </tr>
          </thead>
          <tbody>
            {subsystems.map(s => (
              <tr key={s.name}>
                <td style={{ padding: 8 }}>{s.name}</td>
                <td style={{ padding: 8, color: s.status === 'healthy' ? '#10b981' : s.status === 'degraded' ? '#f59e0b' : '#ef4444' }}>{s.status}</td>
                <td style={{ padding: 8 }}>{new Date(s.lastChecked).toLocaleString()}</td>
                <td style={{ padding: 8 }}>{s.details || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
};
