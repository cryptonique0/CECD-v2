import React from 'react';
import { uxUtilityService } from '../services/uxUtilityService';

const criticalActions = [
  { label: 'Dispatch', color: '#ef4444', action: () => alert('Dispatch triggered!') },
  { label: 'SOS', color: '#f59e0b', action: () => alert('SOS sent!') },
  { label: 'Lockdown', color: '#3b82f6', action: () => alert('Lockdown initiated!') }
];

export const OneTapCriticalActions: React.FC = () => {
  const minimal = uxUtilityService.isMinimalMode();
  return (
    <div style={{
      display: 'flex',
      gap: 16,
      marginBottom: 16,
      justifyContent: minimal ? 'center' : 'flex-start'
    }}>
      {criticalActions.map(a => (
        <button
          key={a.label}
          style={{
            background: a.color,
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            padding: '14px 28px',
            fontWeight: 700,
            fontSize: 20,
            cursor: 'pointer',
            boxShadow: '0 2px 8px #0002'
          }}
          onClick={a.action}
          aria-label={a.label}
        >
          {a.label}
        </button>
      ))}
    </div>
  );
};
