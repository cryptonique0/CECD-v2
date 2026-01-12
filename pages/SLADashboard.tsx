import React, { useEffect, useState } from 'react';
import { reliabilityService } from '../services/reliabilityService';

interface SLAMetrics {
  subsystem: string;
  uptime: number; // %
  latency: number; // ms
  errorRate: number; // %
  lastChecked: number;
}

const mockMetrics: SLAMetrics[] = [
  { subsystem: 'Dispatch', uptime: 99.98, latency: 120, errorRate: 0.01, lastChecked: Date.now() },
  { subsystem: 'Secure Chat', uptime: 99.92, latency: 180, errorRate: 0.03, lastChecked: Date.now() },
  { subsystem: 'Incident Replay', uptime: 99.99, latency: 90, errorRate: 0.00, lastChecked: Date.now() },
  { subsystem: 'NGO Integration', uptime: 99.95, latency: 250, errorRate: 0.02, lastChecked: Date.now() }
];

export const SLADashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<SLAMetrics[]>(mockMetrics);

  useEffect(() => {
    // In production, fetch metrics from backend
    setMetrics(mockMetrics);
  }, []);

  return (
    <div style={{ padding: 32, background: '#1f2937', minHeight: '100vh', color: '#fff' }}>
      <h2 style={{ fontSize: 28, marginBottom: 24 }}>SLA & Reliability Dashboard</h2>
      <table style={{ width: '100%', borderCollapse: 'collapse', background: '#111827', borderRadius: 8 }}>
        <thead>
          <tr style={{ background: '#374151' }}>
            <th style={{ padding: 12, textAlign: 'left' }}>Subsystem</th>
            <th style={{ padding: 12, textAlign: 'right' }}>Uptime (%)</th>
            <th style={{ padding: 12, textAlign: 'right' }}>Latency (ms)</th>
            <th style={{ padding: 12, textAlign: 'right' }}>Error Rate (%)</th>
            <th style={{ padding: 12, textAlign: 'right' }}>Last Checked</th>
          </tr>
        </thead>
        <tbody>
          {metrics.map(m => (
            <tr key={m.subsystem} style={{ borderBottom: '1px solid #374151' }}>
              <td style={{ padding: 12 }}>{m.subsystem}</td>
              <td style={{ padding: 12, textAlign: 'right', color: m.uptime > 99.95 ? '#10b981' : '#f59e0b' }}>{m.uptime.toFixed(2)}</td>
              <td style={{ padding: 12, textAlign: 'right' }}>{m.latency}</td>
              <td style={{ padding: 12, textAlign: 'right', color: m.errorRate < 0.02 ? '#10b981' : '#ef4444' }}>{m.errorRate.toFixed(2)}</td>
              <td style={{ padding: 12, textAlign: 'right' }}>{new Date(m.lastChecked).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
