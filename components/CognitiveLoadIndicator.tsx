import React from 'react';
import { uxUtilityService } from '../services/uxUtilityService';

export const CognitiveLoadIndicator: React.FC = () => {
  const load = uxUtilityService.getCognitiveLoad();
  let color = '#10b981';
  if (load > 70) color = '#ef4444';
  else if (load > 40) color = '#f59e0b';

  return (
    <div style={{
      background: '#111827',
      borderRadius: 8,
      padding: 12,
      marginBottom: 12,
      display: 'flex',
      alignItems: 'center',
      boxShadow: '0 2px 8px #0002'
    }}>
      <span style={{ fontWeight: 600, fontSize: 16, marginRight: 12 }}>Cognitive Load:</span>
      <div style={{
        width: 120,
        height: 16,
        background: '#374151',
        borderRadius: 8,
        overflow: 'hidden',
        marginRight: 12
      }}>
        <div style={{
          width: `${load}%`,
          height: '100%',
          background: color,
          transition: 'width 0.3s'
        }} />
      </div>
      <span style={{ color, fontWeight: 700 }}>{load}%</span>
    </div>
  );
};
