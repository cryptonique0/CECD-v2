import React, { useEffect, useState } from 'react';
import { triageService, TriageResult } from '../services/triageService';
import { mockData } from '../mockData'; // Assume mockData.incidents[] and mockData.responders[]

export const TriageDashboard: React.FC = () => {
  const [triageResults, setTriageResults] = useState<TriageResult[]>([]);

  useEffect(() => {
    // Simulate triage for all mock incidents
    const results: TriageResult[] = [];
    for (const incident of mockData.incidents) {
      const triage = triageService.triageIncident(incident, mockData.responders);
      results.push(triage);
    }
    setTriageResults(results);
  }, []);

  return (
    <div style={{ padding: 32, background: '#f3f4f6', minHeight: '100vh', color: '#1f2937' }}>
      <h2 style={{ fontSize: 28, marginBottom: 24 }}>Automated Triage & Prioritization Dashboard</h2>
      <table style={{ width: '100%', background: '#fff', borderRadius: 10, boxShadow: '0 2px 8px #0001' }}>
        <thead>
          <tr style={{ background: '#e5e7eb' }}>
            <th style={{ padding: 12 }}>Incident</th>
            <th style={{ padding: 12 }}>Severity Score</th>
            <th style={{ padding: 12 }}>Priority Level</th>
            <th style={{ padding: 12 }}>Assigned Responders</th>
            <th style={{ padding: 12 }}>Assignment Narrative</th>
          </tr>
        </thead>
        <tbody>
          {triageResults.map(t => (
            <tr key={t.incidentId}>
              <td style={{ padding: 12 }}>{t.incidentId}</td>
              <td style={{ padding: 12, color: t.severityScore > 80 ? '#ef4444' : t.severityScore > 60 ? '#f59e0b' : '#10b981' }}>{t.severityScore}</td>
              <td style={{ padding: 12 }}>{t.priorityLevel}</td>
              <td style={{ padding: 12 }}>{t.autoRoute.join(', ')}</td>
              <td style={{ padding: 12 }}>{t.assignmentNarrative}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
