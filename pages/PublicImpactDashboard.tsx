import React, { useEffect, useState } from 'react';
import { impactService, IncidentImpactSummary, RegionImpactReport } from '../services/impactService';

// Mock data for demo
const mockIncidentImpacts: IncidentImpactSummary[] = [
  {
    incidentId: 'INC-001',
    title: 'Wildfire Response - Sonoma',
    region: 'Sonoma County',
    livesAssisted: 320,
    responseTimeImprovement: 180,
    resourcesUsed: ['Fire Engines', 'Helicopters', 'Volunteers'],
    narrative: 'Rapid deployment of resources reduced evacuation time by 3 minutes, assisting 320 residents.',
    timestamp: Date.now() - 86400000
  },
  {
    incidentId: 'INC-002',
    title: 'Flood Relief - Sacramento',
    region: 'Sacramento',
    livesAssisted: 210,
    responseTimeImprovement: 240,
    resourcesUsed: ['Rescue Boats', 'Medical Teams'],
    narrative: 'Coordinated response improved rescue times by 4 minutes, saving 210 lives.',
    timestamp: Date.now() - 43200000
  }
];

const mockRegionReports: RegionImpactReport[] = [
  {
    region: 'Sonoma County',
    totalIncidents: 12,
    totalLivesAssisted: 1800,
    avgResponseTimeImprovement: 150,
    improvementNarrative: 'Evacuation and rescue times have improved by 2.5 minutes on average over the past year.',
    lastUpdated: Date.now() - 3600000
  },
  {
    region: 'Sacramento',
    totalIncidents: 8,
    totalLivesAssisted: 950,
    avgResponseTimeImprovement: 210,
    improvementNarrative: 'Flood response times improved by 3.5 minutes, with 950 lives assisted.',
    lastUpdated: Date.now() - 7200000
  }
];

export const PublicImpactDashboard: React.FC = () => {
  const [incidentImpacts, setIncidentImpacts] = useState<IncidentImpactSummary[]>(mockIncidentImpacts);
  const [regionReports, setRegionReports] = useState<RegionImpactReport[]>(mockRegionReports);

  useEffect(() => {
    // In production, fetch from backend
    setIncidentImpacts(mockIncidentImpacts);
    setRegionReports(mockRegionReports);
  }, []);

  return (
    <div style={{ padding: 32, background: '#f9fafb', minHeight: '100vh', color: '#1f2937' }}>
      <h2 style={{ fontSize: 28, marginBottom: 24 }}>Proof of Impact Dashboard</h2>
      <section style={{ marginBottom: 40 }}>
        <h3 style={{ fontSize: 22, marginBottom: 16 }}>Incident Impact Summaries</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 24 }}>
          {incidentImpacts.map(i => (
            <div key={i.incidentId} style={{ background: '#fff', borderRadius: 10, boxShadow: '0 2px 8px #0001', padding: 20 }}>
              <h4 style={{ fontSize: 18, marginBottom: 8 }}>{i.title}</h4>
              <div style={{ marginBottom: 6 }}><b>Region:</b> {i.region}</div>
              <div style={{ marginBottom: 6 }}><b>Lives Assisted:</b> <span style={{ color: '#10b981', fontWeight: 700 }}>{i.livesAssisted}</span></div>
              <div style={{ marginBottom: 6 }}><b>Response Time Improvement:</b> <span style={{ color: '#3b82f6', fontWeight: 700 }}>{i.responseTimeImprovement} sec</span></div>
              <div style={{ marginBottom: 6 }}><b>Resources Used:</b> {i.resourcesUsed.join(', ')}</div>
              <div style={{ marginBottom: 6 }}><b>Narrative:</b> {i.narrative}</div>
              <div style={{ fontSize: 13, color: '#6b7280', marginTop: 8 }}>Updated: {new Date(i.timestamp).toLocaleString()}</div>
            </div>
          ))}
        </div>
      </section>
      <section>
        <h3 style={{ fontSize: 22, marginBottom: 16 }}>Region-Level Improvement Reports</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 24 }}>
          {regionReports.map(r => (
            <div key={r.region} style={{ background: '#fff', borderRadius: 10, boxShadow: '0 2px 8px #0001', padding: 20 }}>
              <h4 style={{ fontSize: 18, marginBottom: 8 }}>{r.region}</h4>
              <div style={{ marginBottom: 6 }}><b>Total Incidents:</b> {r.totalIncidents}</div>
              <div style={{ marginBottom: 6 }}><b>Total Lives Assisted:</b> <span style={{ color: '#10b981', fontWeight: 700 }}>{r.totalLivesAssisted}</span></div>
              <div style={{ marginBottom: 6 }}><b>Avg. Response Time Improvement:</b> <span style={{ color: '#3b82f6', fontWeight: 700 }}>{r.avgResponseTimeImprovement} sec</span></div>
              <div style={{ marginBottom: 6 }}><b>Improvement Narrative:</b> {r.improvementNarrative}</div>
              <div style={{ fontSize: 13, color: '#6b7280', marginTop: 8 }}>Last Updated: {new Date(r.lastUpdated).toLocaleString()}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
