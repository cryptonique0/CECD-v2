import React, { useEffect, useState } from 'react';
import { predictiveAnalyticsService, RiskForecast } from '../services/predictiveAnalyticsService';
import { mockData } from '../mockData'; // Assume mockData.incidents[]

export const PredictiveAnalyticsDashboard: React.FC = () => {
  const [forecasts, setForecasts] = useState<RiskForecast[]>([]);

  useEffect(() => {
    async function runForecasts() {
      // Simulate predictions for all mock incidents
      const results: RiskForecast[] = [];
      for (const incident of mockData.incidents) {
        const forecast = await predictiveAnalyticsService.predictIncident(incident);
        results.push(forecast);
      }
      setForecasts(results);
    }
    runForecasts();
  }, []);

  return (
    <div style={{ padding: 32, background: '#f3f4f6', minHeight: '100vh', color: '#1f2937' }}>
      <h2 style={{ fontSize: 28, marginBottom: 24 }}>AI Predictive Analytics Dashboard</h2>
      <table style={{ width: '100%', background: '#fff', borderRadius: 10, boxShadow: '0 2px 8px #0001' }}>
        <thead>
          <tr style={{ background: '#e5e7eb' }}>
            <th style={{ padding: 12 }}>Incident</th>
            <th style={{ padding: 12 }}>Risk Score</th>
            <th style={{ padding: 12 }}>Escalation Probability</th>
            <th style={{ padding: 12 }}>Recommended Resources</th>
            <th style={{ padding: 12 }}>Forecast Narrative</th>
          </tr>
        </thead>
        <tbody>
          {forecasts.map(f => (
            <tr key={f.incidentId}>
              <td style={{ padding: 12 }}>{f.incidentId}</td>
              <td style={{ padding: 12, color: f.riskScore > 70 ? '#ef4444' : f.riskScore > 40 ? '#f59e0b' : '#10b981' }}>{f.riskScore}</td>
              <td style={{ padding: 12 }}>{(f.escalationProbability*100).toFixed(1)}%</td>
              <td style={{ padding: 12 }}>{f.recommendedResources.join(', ')}</td>
              <td style={{ padding: 12 }}>{f.forecastNarrative}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
