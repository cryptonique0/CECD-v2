import React, { useState } from 'react';
import { citizenEngagementService, CitizenReport } from '../services/citizenEngagementService';

export const CitizenPortal: React.FC = () => {
  const [form, setForm] = useState({ reporterName: '', contact: '', lat: '', lng: '', incidentType: '', description: '' });
  const [reports, setReports] = useState<CitizenReport[]>(citizenEngagementService.getReports());
  const [message, setMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const report = citizenEngagementService.submitReport({
      reporterName: form.reporterName,
      contact: form.contact,
      location: { lat: Number(form.lat), lng: Number(form.lng) },
      incidentType: form.incidentType,
      description: form.description
    });
    setReports(citizenEngagementService.getReports());
    setMessage('Report submitted!');
    setForm({ reporterName: '', contact: '', lat: '', lng: '', incidentType: '', description: '' });
  };

  return (
    <div style={{ maxWidth: 480, margin: '32px auto', padding: 24, background: '#fff', borderRadius: 10, boxShadow: '0 2px 8px #0001' }}>
      <h2 style={{ fontSize: 24, marginBottom: 16 }}>Citizen Engagement Portal</h2>
      <form onSubmit={handleSubmit} style={{ marginBottom: 24 }}>
        <input required placeholder="Your Name" value={form.reporterName} onChange={e => setForm({ ...form, reporterName: e.target.value })} style={{ width: '100%', marginBottom: 8 }} />
        <input required placeholder="Contact (email/phone)" value={form.contact} onChange={e => setForm({ ...form, contact: e.target.value })} style={{ width: '100%', marginBottom: 8 }} />
        <input required placeholder="Latitude" value={form.lat} onChange={e => setForm({ ...form, lat: e.target.value })} style={{ width: '100%', marginBottom: 8 }} />
        <input required placeholder="Longitude" value={form.lng} onChange={e => setForm({ ...form, lng: e.target.value })} style={{ width: '100%', marginBottom: 8 }} />
        <input required placeholder="Incident Type" value={form.incidentType} onChange={e => setForm({ ...form, incidentType: e.target.value })} style={{ width: '100%', marginBottom: 8 }} />
        <textarea required placeholder="Description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} style={{ width: '100%', marginBottom: 8 }} />
        <button type="submit" style={{ background: '#10b981', color: '#fff', padding: '10px 20px', borderRadius: 8, fontWeight: 700, fontSize: 16, cursor: 'pointer' }}>Submit Report</button>
      </form>
      {message && <div style={{ color: '#10b981', marginBottom: 16 }}>{message}</div>}
      <h3 style={{ fontSize: 18, marginBottom: 8 }}>Your Reports & Status</h3>
      <ul>
        {reports.map(r => (
          <li key={r.id} style={{ marginBottom: 12, background: '#f3f4f6', padding: 12, borderRadius: 6 }}>
            <b>{r.incidentType}</b> ({r.status})<br />
            {r.description}<br />
            <span style={{ fontSize: 13, color: '#6b7280' }}>Updates: {r.updates.join(' | ') || 'None yet'}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};
