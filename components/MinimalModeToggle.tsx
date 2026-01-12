import React from 'react';
import { uxUtilityService } from '../services/uxUtilityService';

export const MinimalModeToggle: React.FC = () => {
  const minimal = uxUtilityService.isMinimalMode();
  return (
    <button
      style={{
        background: minimal ? '#ef4444' : '#10b981',
        color: '#fff',
        border: 'none',
        borderRadius: 8,
        padding: '10px 20px',
        fontWeight: 700,
        fontSize: 18,
        cursor: 'pointer',
        marginBottom: 16
      }}
      onClick={() => uxUtilityService.setMinimalMode(!minimal)}
      aria-label="Toggle Minimal Mode"
    >
      {minimal ? 'Exit Minimal Mode' : 'Enter Minimal Mode'}
    </button>
  );
};
