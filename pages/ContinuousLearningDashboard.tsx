import React, { useState } from 'react';
import { continuousLearningService, TrainingSession, AfterActionReview } from '../services/continuousLearningService';

export const ContinuousLearningDashboard: React.FC = () => {
  const [sessions] = useState<TrainingSession[]>(continuousLearningService.getTrainingSessions());
  const [reviews] = useState<AfterActionReview[]>(continuousLearningService.getAfterActionReviews());

  return (
    <div style={{ padding: 32, background: '#f3f4f6', minHeight: '100vh', color: '#1f2937' }}>
      <h2 style={{ fontSize: 28, marginBottom: 24 }}>Continuous Learning & Simulation Dashboard</h2>
      <section style={{ marginBottom: 40 }}>
        <h3 style={{ fontSize: 22, marginBottom: 16 }}>Training Sessions</h3>
        <table style={{ width: '100%', background: '#fff', borderRadius: 10, boxShadow: '0 2px 8px #0001' }}>
          <thead>
            <tr style={{ background: '#e5e7eb' }}>
              <th style={{ padding: 12 }}>Title</th>
              <th style={{ padding: 12 }}>Participants</th>
              <th style={{ padding: 12 }}>Scenario</th>
              <th style={{ padding: 12 }}>Score</th>
              <th style={{ padding: 12 }}>Feedback</th>
              <th style={{ padding: 12 }}>Completed</th>
            </tr>
          </thead>
          <tbody>
            {sessions.map(s => (
              <tr key={s.id}>
                <td style={{ padding: 12 }}>{s.title}</td>
                <td style={{ padding: 12 }}>{s.participants.join(', ')}</td>
                <td style={{ padding: 12 }}>{s.scenario}</td>
                <td style={{ padding: 12 }}>{s.score}</td>
                <td style={{ padding: 12 }}>{s.feedback}</td>
                <td style={{ padding: 12 }}>{s.completed ? 'Yes' : 'No'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      <section>
        <h3 style={{ fontSize: 22, marginBottom: 16 }}>After-Action Reviews & AI Recommendations</h3>
        <table style={{ width: '100%', background: '#fff', borderRadius: 10, boxShadow: '0 2px 8px #0001' }}>
          <thead>
            <tr style={{ background: '#e5e7eb' }}>
              <th style={{ padding: 12 }}>Incident</th>
              <th style={{ padding: 12 }}>Summary</th>
              <th style={{ padding: 12 }}>Lessons Learned</th>
              <th style={{ padding: 12 }}>AI Recommendations</th>
            </tr>
          </thead>
          <tbody>
            {reviews.map(r => (
              <tr key={r.id}>
                <td style={{ padding: 12 }}>{r.incidentId}</td>
                <td style={{ padding: 12 }}>{r.summary}</td>
                <td style={{ padding: 12 }}>{r.lessonsLearned.join('; ')}</td>
                <td style={{ padding: 12 }}>{r.aiRecommendations.join('; ')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
};
