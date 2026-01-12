/**
 * Fraud Detection Dashboard
 * Displays fraud alerts, patterns, and risk analytics
 */

import React, { useState, useEffect } from 'react';
import styles from './FraudDetectionDashboard.module.css';

interface FraudAlert {
  id: string;
  donationId?: string;
  riskScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  type: string;
  description: string;
  evidence: string[];
  flaggedAt: number;
  resolved: boolean;
}

interface Props {
  incidentId: string;
  alerts?: FraudAlert[];
  onResolveAlert?: (alertId: string, notes?: string) => void;
  onInvestigate?: (alertId: string) => void;
}

export const FraudDetectionDashboard: React.FC<Props> = ({
  incidentId,
  alerts = [],
  onResolveAlert,
  onInvestigate
}) => {
  const [selectedAlert, setSelectedAlert] = useState<FraudAlert | null>(null);
  const [filterLevel, setFilterLevel] = useState<string>('all');
  const [expandedAlerts, setExpandedAlerts] = useState<Set<string>>(new Set());
  const [resolutionNotes, setResolutionNotes] = useState<Record<string, string>>({});

  const unresolvedAlerts = alerts.filter(a => !a.resolved);
  const filteredAlerts = filterLevel === 'all'
    ? unresolvedAlerts
    : unresolvedAlerts.filter(a => a.riskLevel === filterLevel);

  const handleToggleExpand = (alertId: string) => {
    const newExpanded = new Set(expandedAlerts);
    if (newExpanded.has(alertId)) {
      newExpanded.delete(alertId);
    } else {
      newExpanded.add(alertId);
    }
    setExpandedAlerts(newExpanded);
  };

  const handleResolveAlert = (alertId: string) => {
    const notes = resolutionNotes[alertId];
    onResolveAlert?.(alertId, notes);
    setResolutionNotes(prev => {
      const updated = { ...prev };
      delete updated[alertId];
      return updated;
    });
    setExpandedAlerts(prev => {
      const updated = new Set(prev);
      updated.delete(alertId);
      return updated;
    });
  };

  const getRiskIcon = (level: string) => {
    switch (level) {
      case 'low':
        return '⚠️';
      case 'medium':
        return '⚠️⚠️';
      case 'high':
        return '🔴';
      case 'critical':
        return '🚨';
      default:
        return '●';
    }
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'low':
        return '#FFC107';
      case 'medium':
        return '#FF9800';
      case 'high':
        return '#F44336';
      case 'critical':
        return '#B71C1C';
      default:
        return '#999';
    }
  };

  const getAlertTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'duplicate_donation': 'Duplicate Donation',
      'unusually_large': 'Unusually Large Amount',
      'rapid_sequence': 'Rapid Sequence',
      'missing_receipt': 'Missing Receipt',
      'receipt_discrepancy': 'Receipt Mismatch',
      'mismatched_vendor': 'Vendor Mismatch',
      'suspicious_location': 'Suspicious Location'
    };
    return labels[type] || type;
  };

  const criticalCount = unresolvedAlerts.filter(a => a.riskLevel === 'critical').length;
  const highCount = unresolvedAlerts.filter(a => a.riskLevel === 'high').length;
  const mediumCount = unresolvedAlerts.filter(a => a.riskLevel === 'medium').length;
  const averageRiskScore = unresolvedAlerts.length > 0
    ? Math.round(unresolvedAlerts.reduce((sum, a) => sum + a.riskScore, 0) / unresolvedAlerts.length)
    : 0;

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <h1>Fraud Detection Dashboard</h1>
        <p>Monitor suspicious donation patterns and receipt anomalies</p>
      </div>

      {/* Risk Summary */}
      <div className={styles.riskSummary}>
        <div className={styles.summaryCard}>
          <div className={styles.cardIcon}>🚨</div>
          <div className={styles.cardContent}>
            <div className={styles.cardLabel}>Critical Alerts</div>
            <div className={styles.cardValue} style={{ color: '#B71C1C' }}>
              {criticalCount}
            </div>
          </div>
        </div>

        <div className={styles.summaryCard}>
          <div className={styles.cardIcon}>🔴</div>
          <div className={styles.cardContent}>
            <div className={styles.cardLabel}>High Risk</div>
            <div className={styles.cardValue} style={{ color: '#F44336' }}>
              {highCount}
            </div>
          </div>
        </div>

        <div className={styles.summaryCard}>
          <div className={styles.cardIcon}>⚠️</div>
          <div className={styles.cardContent}>
            <div className={styles.cardLabel}>Medium Risk</div>
            <div className={styles.cardValue} style={{ color: '#FF9800' }}>
              {mediumCount}
            </div>
          </div>
        </div>

        <div className={styles.summaryCard}>
          <div className={styles.cardIcon}>📊</div>
          <div className={styles.cardContent}>
            <div className={styles.cardLabel}>Average Risk Score</div>
            <div className={styles.cardValue}>{averageRiskScore}</div>
          </div>
        </div>

        <div className={styles.summaryCard}>
          <div className={styles.cardIcon}>📋</div>
          <div className={styles.cardContent}>
            <div className={styles.cardLabel}>Total Unresolved</div>
            <div className={styles.cardValue}>{unresolvedAlerts.length}</div>
          </div>
        </div>
      </div>

      {/* Filter */}
      <div className={styles.filterSection}>
        <label>Filter by Risk Level:</label>
        <div className={styles.filterButtons}>
          {['all', 'critical', 'high', 'medium', 'low'].map(level => (
            <button
              key={level}
              className={`${styles.filterBtn} ${filterLevel === level ? styles.active : ''}`}
              onClick={() => setFilterLevel(level)}
            >
              {level === 'all' ? 'All' : level.charAt(0).toUpperCase() + level.slice(1)}
              {level !== 'all' && ` (${unresolvedAlerts.filter(a => a.riskLevel === level).length})`}
            </button>
          ))}
        </div>
      </div>

      {/* Alerts List */}
      <div className={styles.alertsList}>
        {filteredAlerts.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>✓</div>
            <h3>No {filterLevel === 'all' ? 'Fraud' : filterLevel} Alerts</h3>
            <p>Your donations are looking clean!</p>
          </div>
        ) : (
          filteredAlerts.map((alert) => (
            <div
              key={alert.id}
              className={`${styles.alertCard} ${styles[`risk-${alert.riskLevel}`]}`}
              onClick={() => {
                setSelectedAlert(alert);
                handleToggleExpand(alert.id);
              }}
            >
              {/* Alert Header */}
              <div className={styles.alertHeader}>
                <div className={styles.alertLeft}>
                  <div className={styles.riskIndicator} style={{ backgroundColor: getRiskColor(alert.riskLevel) }}>
                    {getRiskIcon(alert.riskLevel)}
                  </div>
                  <div className={styles.alertInfo}>
                    <h4>{getAlertTypeLabel(alert.type)}</h4>
                    <p className={styles.description}>{alert.description}</p>
                  </div>
                </div>

                <div className={styles.alertRight}>
                  <div className={styles.riskScore}>
                    <div className={styles.scoreCircle} style={{ borderColor: getRiskColor(alert.riskLevel) }}>
                      <span className={styles.scoreValue}>{alert.riskScore}</span>
                      <span className={styles.scoreLabel}>Risk</span>
                    </div>
                  </div>
                  <button
                    className={styles.expandBtn}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleExpand(alert.id);
                    }}
                  >
                    {expandedAlerts.has(alert.id) ? '▼' : '▶'}
                  </button>
                </div>
              </div>

              {/* Alert Details (Expanded) */}
              {expandedAlerts.has(alert.id) && (
                <div className={styles.alertDetails}>
                  {/* Timeline */}
                  <div className={styles.detailSection}>
                    <h5>Flagged</h5>
                    <p>{new Date(alert.flaggedAt).toLocaleString()}</p>
                  </div>

                  {/* Evidence */}
                  <div className={styles.detailSection}>
                    <h5>Evidence</h5>
                    <ul className={styles.evidenceList}>
                      {alert.evidence.map((item, idx) => (
                        <li key={idx}>{item}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Risk Score Breakdown */}
                  <div className={styles.detailSection}>
                    <h5>Risk Level Breakdown</h5>
                    <div className={styles.riskBreakdown}>
                      <div className={styles.riskBar}>
                        <div
                          className={styles.riskFill}
                          style={{
                            width: `${alert.riskScore}%`,
                            backgroundColor: getRiskColor(alert.riskLevel)
                          }}
                        />
                      </div>
                      <div className={styles.riskLabels}>
                        <span>Low (0)</span>
                        <span>Medium (33)</span>
                        <span>High (66)</span>
                        <span>Critical (100)</span>
                      </div>
                    </div>
                  </div>

                  {/* Resolution */}
                  <div className={styles.detailSection}>
                    <h5>Resolution Action</h5>
                    <div className={styles.actionButtons}>
                      <button
                        className={styles.actionBtn}
                        onClick={() => onInvestigate?.(alert.id)}
                      >
                        🔍 Investigate
                      </button>
                      <button
                        className={styles.actionBtn}
                        onClick={() => handleResolveAlert(alert.id)}
                      >
                        ✓ Resolve
                      </button>
                    </div>

                    {expandedAlerts.has(alert.id) && (
                      <div className={styles.notesSection}>
                        <label>Resolution Notes (optional)</label>
                        <textarea
                          placeholder="Document your investigation findings..."
                          value={resolutionNotes[alert.id] || ''}
                          onChange={(e) => setResolutionNotes(prev => ({
                            ...prev,
                            [alert.id]: e.target.value
                          }))}
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Resolved Alerts Summary */}
      {alerts.filter(a => a.resolved).length > 0 && (
        <div className={styles.resolvedSection}>
          <h3>✓ Resolved Alerts ({alerts.filter(a => a.resolved).length})</h3>
          <p className={styles.resolvedNote}>These fraud alerts have been investigated and resolved.</p>
        </div>
      )}

      {/* Recommendations */}
      {unresolvedAlerts.length > 0 && (
        <div className={styles.recommendations}>
          <h3>🎯 Recommendations</h3>
          <ul>
            {unresolvedAlerts.length > 3 && (
              <li>Review <strong>{unresolvedAlerts.length} unresolved alerts</strong> - consider blocking high-risk donations temporarily</li>
            )}
            {unresolvedAlerts.some(a => a.riskLevel === 'critical') && (
              <li>Address <strong>critical alerts immediately</strong> - contact donors if needed for verification</li>
            )}
            {unresolvedAlerts.filter(a => a.type === 'missing_receipt').length > 2 && (
              <li>Send <strong>receipt reminders</strong> to donors with missing documentation</li>
            )}
            {unresolvedAlerts.some(a => a.type === 'rapid_sequence') && (
              <li>Consider implementing <strong>rate limiting</strong> for rapid donation sequences</li>
            )}
            {unresolvedAlerts.filter(a => a.riskLevel === 'high').length > 2 && (
              <li>Escalate to compliance team for <strong>detailed investigation</strong></li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
};

export default FraudDetectionDashboard;
