import React from 'react';
import { uxUtilityService, AccessibilityMode } from '../services/uxUtilityService';

const modes: { label: string; value: AccessibilityMode }[] = [
  { label: 'Default', value: 'default' },
  { label: 'Colorblind', value: 'colorblind' },
  { label: 'Low-Light', value: 'low-light' },
  { label: 'Large Text', value: 'large-text' }
];

export const AccessibilityModeSelector: React.FC = () => {
  const current = uxUtilityService.getAccessibilityMode();
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ fontWeight: 600, marginRight: 12 }}>Accessibility Mode:</label>
      {modes.map(m => (
        <button
          key={m.value}
          style={{
            background: current === m.value ? '#3b82f6' : '#374151',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            padding: '8px 16px',
            fontWeight: 600,
            fontSize: current === 'large-text' ? 22 : 16,
            marginRight: 8,
            cursor: 'pointer'
          }}
          onClick={() => uxUtilityService.setAccessibilityMode(m.value)}
          aria-label={m.label}
        >
          {m.label}
        </button>
      ))}
    </div>
  );
};
