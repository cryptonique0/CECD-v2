import React, { useState, useMemo } from 'react';
import { jurisdictionService, Jurisdiction, JurisdictionPolicy } from '../services/jurisdictionService';

interface PrivacyCompliancePanelProps {
  incidentId?: string;
  incidentType?: string;
  incidentLocation?: { lat: number; lng: number };
  onJurisdictionChange?: (jurisdiction: Jurisdiction) => void;
}

const PrivacyCompliancePanel: React.FC<PrivacyCompliancePanelProps> = ({
  incidentId,
  incidentType = 'other',
  incidentLocation,
  onJurisdictionChange,
}) => {
  const [selectedJurisdiction, setSelectedJurisdiction] = useState<Jurisdiction>('GLOBAL');
  const [showDetails, setShowDetails] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'retention' | 'encryption' | 'consent'>('overview');

  // Detect jurisdiction from location
  const detectedJurisdiction = useMemo(() => {
    if (incidentLocation) {
      return jurisdictionService.detectJurisdiction(incidentLocation.lat, incidentLocation.lng);
    }
    return 'GLOBAL';
  }, [incidentLocation]);

  // Get policy for selected jurisdiction
  const policy = useMemo(
    () => jurisdictionService.getPolicy(selectedJurisdiction),
    [selectedJurisdiction]
  );

  // Get retention policy
  const retentionPolicy = useMemo(
    () => jurisdictionService.getRetentionPolicy(incidentType, selectedJurisdiction),
    [incidentType, selectedJurisdiction]
  );

  // Get encryption rules
  const encryptionRules = useMemo(
    () => jurisdictionService.getEncryptionRules(),
    []
  );

  const handleJurisdictionChange = (jurisdiction: Jurisdiction) => {
    setSelectedJurisdiction(jurisdiction);
    onJurisdictionChange?.(jurisdiction);
  };

  const getJurisdictionColor = (jurisdiction: Jurisdiction) => {
    const colors: Record<Jurisdiction, string> = {
      EU: 'from-blue-500 to-blue-400',
      US: 'from-red-500 to-red-400',
      US_CALIFORNIA: 'from-orange-500 to-orange-400',
      UK: 'from-indigo-500 to-indigo-400',
      CANADA: 'from-red-600 to-white',
      AUSTRALIA: 'from-blue-600 to-blue-500',
      GLOBAL: 'from-purple-500 to-pink-500',
    };
    return colors[jurisdiction];
  };

  const formatDays = (days: number) => {
    if (days >= 365) {
      return `${(days / 365).toFixed(1)} years`;
    }
    return `${days} days`;
  };

  return (
    <div className="bg-card-dark border border-border-dark rounded-2xl p-6 flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">policy</span>
            Privacy & Compliance
          </h3>
          <p className="text-text-secondary text-xs mt-1">
            Jurisdiction-aware data protection policies
          </p>
        </div>
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="px-3 py-1.5 rounded-lg bg-primary/20 text-primary text-xs font-semibold hover:bg-primary/30 transition-all"
        >
          {showDetails ? 'Hide Details' : 'Show Details'}
        </button>
      </div>

      {/* Jurisdiction Selector */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <label className="text-sm font-semibold text-white">Data Jurisdiction</label>
          {detectedJurisdiction !== selectedJurisdiction && (
            <span className="text-xs text-yellow-400 flex items-center gap-1">
              <span className="material-symbols-outlined text-xs">location_on</span>
              Detected: {detectedJurisdiction}
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {(['EU', 'US', 'US_CALIFORNIA', 'UK', 'CANADA', 'AUSTRALIA', 'GLOBAL'] as Jurisdiction[]).map(
            jurisdiction => (
              <button
                key={jurisdiction}
                onClick={() => handleJurisdictionChange(jurisdiction)}
                className={`px-3 py-2 rounded-lg border transition-all text-xs font-bold ${
                  selectedJurisdiction === jurisdiction
                    ? `bg-gradient-to-r ${getJurisdictionColor(jurisdiction)} text-white border-transparent`
                    : 'border-border-dark text-text-secondary hover:border-primary/30'
                }`}
              >
                {jurisdiction.replace('_', ' ')}
              </button>
            )
          )}
        </div>
      </div>

      {/* Policy Overview */}
      {policy && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-background-dark rounded-lg p-3 border border-border-dark">
            <div className="flex items-center gap-2 mb-1">
              <span className="material-symbols-outlined text-primary text-sm">shield</span>
              <p className="text-[9px] uppercase font-bold text-text-secondary">Encryption</p>
            </div>
            <p className="text-white font-bold text-sm">
              {policy.encryptionRequired ? 'Required' : 'Optional'}
            </p>
          </div>

          <div className="bg-background-dark rounded-lg p-3 border border-border-dark">
            <div className="flex items-center gap-2 mb-1">
              <span className="material-symbols-outlined text-blue-400 text-sm">edit_document</span>
              <p className="text-[9px] uppercase font-bold text-text-secondary">Consent</p>
            </div>
            <p className="text-white font-bold text-sm">
              {policy.consentRequired ? 'Required' : 'Not Required'}
            </p>
          </div>

          <div className="bg-background-dark rounded-lg p-3 border border-border-dark">
            <div className="flex items-center gap-2 mb-1">
              <span className="material-symbols-outlined text-red-400 text-sm">notification_important</span>
              <p className="text-[9px] uppercase font-bold text-text-secondary">Breach Alert</p>
            </div>
            <p className="text-white font-bold text-sm">{policy.breachNotificationHours}h</p>
          </div>

          <div className="bg-background-dark rounded-lg p-3 border border-border-dark">
            <div className="flex items-center gap-2 mb-1">
              <span className="material-symbols-outlined text-green-400 text-sm">verified_user</span>
              <p className="text-[9px] uppercase font-bold text-text-secondary">Rights</p>
            </div>
            <p className="text-white font-bold text-sm">
              {policy.rightToErasure && policy.rightToPortability ? 'Full' : 'Limited'}
            </p>
          </div>
        </div>
      )}

      {/* Details Tabs */}
      {showDetails && policy && (
        <div className="flex flex-col gap-4">
          {/* Tab Navigation */}
          <div className="flex gap-2 border-b border-border-dark pb-2">
            {[
              { id: 'overview', label: 'Overview', icon: 'info' },
              { id: 'retention', label: 'Retention', icon: 'schedule' },
              { id: 'encryption', label: 'Encryption', icon: 'lock' },
              { id: 'consent', label: 'Consent', icon: 'how_to_reg' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === tab.id
                    ? 'bg-primary/20 text-primary'
                    : 'text-text-secondary hover:text-white'
                }`}
              >
                <span className="material-symbols-outlined text-sm">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>

          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="flex flex-col gap-3">
              <div>
                <p className="text-xs font-bold text-white mb-2">{policy.name}</p>
                <div className="flex flex-wrap gap-1">
                  {policy.regulations.map(reg => (
                    <span
                      key={reg}
                      className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 text-[9px] font-bold border border-blue-500/30"
                    >
                      {reg}
                    </span>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-[10px]">
                <div>
                  <p className="text-text-secondary mb-1">Cross-Border Transfer</p>
                  <p className="text-white font-semibold">
                    {policy.crossBorderTransferRestrictions ? 'Restricted' : 'Allowed'}
                  </p>
                  {policy.allowedCountries && (
                    <p className="text-text-secondary mt-1">
                      Allowed: {policy.allowedCountries.join(', ')}
                    </p>
                  )}
                </div>
                <div>
                  <p className="text-text-secondary mb-1">Audit Log Retention</p>
                  <p className="text-white font-semibold">{formatDays(policy.auditLogRetention)}</p>
                </div>
              </div>
            </div>
          )}

          {/* Retention Tab */}
          {activeTab === 'retention' && retentionPolicy && (
            <div className="flex flex-col gap-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-background-dark rounded-lg p-3 border border-border-dark">
                  <p className="text-[9px] uppercase font-bold text-text-secondary mb-1">Retention Period</p>
                  <p className="text-white font-bold">{formatDays(retentionPolicy.retentionPeriod)}</p>
                </div>
                {retentionPolicy.archiveAfter && (
                  <div className="bg-background-dark rounded-lg p-3 border border-border-dark">
                    <p className="text-[9px] uppercase font-bold text-text-secondary mb-1">Archive After</p>
                    <p className="text-white font-bold">{formatDays(retentionPolicy.archiveAfter)}</p>
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-text-secondary">Auto-Delete</span>
                  <span className={`font-semibold ${retentionPolicy.autoDelete ? 'text-red-400' : 'text-green-400'}`}>
                    {retentionPolicy.autoDelete ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
                {retentionPolicy.anonymizeAfter && (
                  <div className="flex items-center justify-between">
                    <span className="text-text-secondary">Anonymize After</span>
                    <span className="text-white font-semibold">{formatDays(retentionPolicy.anonymizeAfter)}</span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-text-secondary">Legal Hold Override</span>
                  <span className={`font-semibold ${retentionPolicy.legalHoldOverride ? 'text-green-400' : 'text-red-400'}`}>
                    {retentionPolicy.legalHoldOverride ? 'Allowed' : 'Not Allowed'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Encryption Tab */}
          {activeTab === 'encryption' && (
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2 text-xs text-text-secondary mb-2">
                <span className="material-symbols-outlined text-sm">info</span>
                Field-level encryption rules for sensitive data
              </div>

              <div className="flex flex-col gap-2 max-h-60 overflow-y-auto">
                {encryptionRules.slice(0, 6).map((rule, idx) => (
                  <div key={idx} className="bg-background-dark rounded-lg p-3 border border-border-dark">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-bold text-white">{rule.fieldPath}</p>
                      <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 text-[8px] font-bold border border-purple-500/30">
                        {rule.classification.toUpperCase()}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2 text-[9px]">
                      <span className="text-text-secondary">
                        Roles: <span className="text-white">{rule.allowedRoles.join(', ')}</span>
                      </span>
                      {rule.requiresMFA && (
                        <span className="px-1.5 py-0.5 rounded bg-red-500/20 text-red-300 font-bold">
                          MFA Required
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Consent Tab */}
          {activeTab === 'consent' && (
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2 text-xs text-text-secondary mb-2">
                <span className="material-symbols-outlined text-sm">info</span>
                {policy.consentRequired ? 'Explicit consent required for data processing' : 'Consent not required (opt-out model)'}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="bg-background-dark rounded-lg p-3 border border-border-dark">
                  <p className="text-[9px] uppercase font-bold text-text-secondary mb-1">Right to Erasure</p>
                  <p className={`text-xs font-bold ${policy.rightToErasure ? 'text-green-400' : 'text-red-400'}`}>
                    {policy.rightToErasure ? 'Supported' : 'Not Supported'}
                  </p>
                </div>
                <div className="bg-background-dark rounded-lg p-3 border border-border-dark">
                  <p className="text-[9px] uppercase font-bold text-text-secondary mb-1">Data Portability</p>
                  <p className={`text-xs font-bold ${policy.rightToPortability ? 'text-green-400' : 'text-red-400'}`}>
                    {policy.rightToPortability ? 'Supported' : 'Not Supported'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PrivacyCompliancePanel;
