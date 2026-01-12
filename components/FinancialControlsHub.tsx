/**
 * Financial Controls Hub
 * Central dashboard for budget management, fraud detection, and donor transparency
 */

import React, { useState, useEffect } from 'react';
import { DollarSign, AlertTriangle, Shield, TrendingUp, TrendingDown, Eye, CheckCircle, XCircle, Clock } from 'lucide-react';
import { financialControlsService } from '../services/financialControlsService';
import { fraudDetectionService } from '../services/fraudDetectionService';
import type { BudgetAllocation, FraudAlert } from '../types';

export const FinancialControlsHub: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'budgets' | 'fraud' | 'transparency'>('overview');
  const [budgets, setBudgets] = useState<BudgetAllocation[]>([]);
  const [alerts, setAlerts] = useState<FraudAlert[]>([]);
  const [selectedIncident, setSelectedIncident] = useState<string | null>(null);

  useEffect(() => {
    loadFinancialData();
  }, []);

  const loadFinancialData = () => {
    // Load all active budgets
    const allBudgets = financialControlsService.getAllBudgets();
    setBudgets(allBudgets);

    // Load unresolved fraud alerts
    const unresolvedAlerts = fraudDetectionService.getUnresolvedAlerts();
    setAlerts(unresolvedAlerts);
  };

  const calculateTotals = () => {
    const totalBudgeted = budgets.reduce((sum, b) => sum + b.budgetCap, 0);
    const totalAllocated = budgets.reduce((sum, b) => sum + b.allocated, 0);
    const totalRemaining = budgets.reduce((sum, b) => sum + b.remaining, 0);
    const totalNeeds = budgets.reduce((sum, b) => sum + b.estimatedNeeds, 0);
    const criticalAlerts = alerts.filter(a => a.riskLevel === 'critical').length;
    const highRiskAlerts = alerts.filter(a => a.riskLevel === 'high').length;

    return {
      totalBudgeted,
      totalAllocated,
      totalRemaining,
      totalNeeds,
      utilizationRate: totalBudgeted > 0 ? (totalAllocated / totalBudgeted) * 100 : 0,
      criticalAlerts,
      highRiskAlerts,
      budgetsAtRisk: budgets.filter(b => b.remaining < b.estimatedNeeds * 0.2).length
    };
  };

  const totals = calculateTotals();

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'critical': return '#D32F2F';
      case 'high': return '#F57C00';
      case 'medium': return '#FBC02D';
      case 'low': return '#388E3C';
      default: return '#757575';
    }
  };

  const formatCurrency = (amount: number, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>
            <DollarSign size={32} style={styles.titleIcon} />
            Financial Controls & Transparency
          </h1>
          <p style={styles.subtitle}>Budget management, fraud detection, and donor accountability</p>
        </div>
        <div style={styles.headerStats}>
          <div style={styles.statBadge}>
            <Shield size={20} />
            <span>{alerts.length} Active Alerts</span>
          </div>
          <div style={styles.statBadge}>
            <TrendingUp size={20} />
            <span>{totals.utilizationRate.toFixed(1)}% Utilized</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={styles.tabs}>
        <button
          style={{...styles.tab, ...(activeTab === 'overview' ? styles.tabActive : {})}}
          onClick={() => setActiveTab('overview')}
        >
          📊 Overview
        </button>
        <button
          style={{...styles.tab, ...(activeTab === 'budgets' ? styles.tabActive : {})}}
          onClick={() => setActiveTab('budgets')}
        >
          💰 Budget Management
        </button>
        <button
          style={{...styles.tab, ...(activeTab === 'fraud' ? styles.tabActive : {})}}
          onClick={() => setActiveTab('fraud')}
        >
          🛡️ Fraud Detection
        </button>
        <button
          style={{...styles.tab, ...(activeTab === 'transparency' ? styles.tabActive : {})}}
          onClick={() => setActiveTab('transparency')}
        >
          👁️ Donor Transparency
        </button>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div style={styles.content}>
          {/* Key Metrics */}
          <div style={styles.metricsGrid}>
            <div style={styles.metricCard}>
              <div style={styles.metricIcon} className="bg-blue">
                <DollarSign size={28} />
              </div>
              <div style={styles.metricContent}>
                <div style={styles.metricLabel}>Total Budgeted</div>
                <div style={styles.metricValue}>{formatCurrency(totals.totalBudgeted)}</div>
              </div>
            </div>

            <div style={styles.metricCard}>
              <div style={styles.metricIcon} className="bg-green">
                <TrendingUp size={28} />
              </div>
              <div style={styles.metricContent}>
                <div style={styles.metricLabel}>Allocated</div>
                <div style={styles.metricValue}>{formatCurrency(totals.totalAllocated)}</div>
                <div style={styles.metricSubtext}>{totals.utilizationRate.toFixed(1)}% of budget</div>
              </div>
            </div>

            <div style={styles.metricCard}>
              <div style={styles.metricIcon} className="bg-orange">
                <Clock size={28} />
              </div>
              <div style={styles.metricContent}>
                <div style={styles.metricLabel}>Remaining</div>
                <div style={styles.metricValue}>{formatCurrency(totals.totalRemaining)}</div>
                <div style={styles.metricSubtext}>
                  {totals.totalRemaining < totals.totalNeeds * 0.5 ? (
                    <span style={{color: '#F57C00'}}>⚠️ Low reserves</span>
                  ) : (
                    <span style={{color: '#388E3C'}}>✓ Healthy reserves</span>
                  )}
                </div>
              </div>
            </div>

            <div style={styles.metricCard}>
              <div style={styles.metricIcon} className="bg-red">
                <AlertTriangle size={28} />
              </div>
              <div style={styles.metricContent}>
                <div style={styles.metricLabel}>Fraud Alerts</div>
                <div style={styles.metricValue}>{alerts.length}</div>
                <div style={styles.metricSubtext}>
                  {totals.criticalAlerts} critical, {totals.highRiskAlerts} high risk
                </div>
              </div>
            </div>
          </div>

          {/* Budget Health Overview */}
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>Budget Health by Incident</h3>
            <div style={styles.budgetHealthGrid}>
              {budgets.slice(0, 6).map(budget => {
                const utilizationPct = (budget.allocated / budget.budgetCap) * 100;
                const needsCoverage = (budget.remaining / budget.estimatedNeeds) * 100;
                
                return (
                  <div key={budget.id} style={styles.budgetHealthCard}>
                    <div style={styles.budgetHealthHeader}>
                      <h4 style={styles.budgetHealthTitle}>{budget.incidentTitle}</h4>
                      <span style={{
                        ...styles.healthBadge,
                        backgroundColor: needsCoverage > 50 ? '#E8F5E9' : needsCoverage > 20 ? '#FFF9C4' : '#FFEBEE',
                        color: needsCoverage > 50 ? '#388E3C' : needsCoverage > 20 ? '#F57C00' : '#D32F2F'
                      }}>
                        {needsCoverage > 50 ? 'Healthy' : needsCoverage > 20 ? 'At Risk' : 'Critical'}
                      </span>
                    </div>

                    <div style={styles.budgetMetrics}>
                      <div style={styles.budgetMetricRow}>
                        <span>Budget Cap:</span>
                        <strong>{formatCurrency(budget.budgetCap)}</strong>
                      </div>
                      <div style={styles.budgetMetricRow}>
                        <span>Allocated:</span>
                        <strong>{formatCurrency(budget.allocated)}</strong>
                      </div>
                      <div style={styles.budgetMetricRow}>
                        <span>Remaining:</span>
                        <strong style={{color: budget.remaining < budget.estimatedNeeds * 0.2 ? '#D32F2F' : '#388E3C'}}>
                          {formatCurrency(budget.remaining)}
                        </strong>
                      </div>
                    </div>

                    <div style={styles.progressBarContainer}>
                      <div style={styles.progressBar}>
                        <div style={{
                          ...styles.progressFill,
                          width: `${Math.min(utilizationPct, 100)}%`,
                          backgroundColor: utilizationPct > 90 ? '#D32F2F' : utilizationPct > 70 ? '#F57C00' : '#388E3C'
                        }} />
                      </div>
                      <span style={styles.progressLabel}>{utilizationPct.toFixed(1)}% utilized</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recent Fraud Alerts */}
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>
              <AlertTriangle size={20} />
              Recent Fraud Alerts
            </h3>
            {alerts.length === 0 ? (
              <div style={styles.emptyState}>
                <CheckCircle size={48} color="#388E3C" />
                <p>No active fraud alerts. All transactions are clean!</p>
              </div>
            ) : (
              <div style={styles.alertsList}>
                {alerts.slice(0, 5).map(alert => (
                  <div key={alert.id} style={styles.alertCard}>
                    <div style={{...styles.alertRisk, backgroundColor: getRiskColor(alert.riskLevel)}} />
                    <div style={styles.alertContent}>
                      <div style={styles.alertHeader}>
                        <span style={styles.alertType}>{alert.type.replace(/_/g, ' ').toUpperCase()}</span>
                        <span style={{...styles.alertBadge, borderColor: getRiskColor(alert.riskLevel), color: getRiskColor(alert.riskLevel)}}>
                          {alert.riskLevel.toUpperCase()}
                        </span>
                      </div>
                      <p style={styles.alertDescription}>{alert.description}</p>
                      <div style={styles.alertEvidence}>
                        <strong>Evidence:</strong>
                        <ul style={styles.evidenceList}>
                          {alert.evidence.slice(0, 2).map((ev, idx) => (
                            <li key={idx}>{ev}</li>
                          ))}
                        </ul>
                      </div>
                      <div style={styles.alertFooter}>
                        <span style={styles.alertTime}>
                          {new Date(alert.flaggedAt).toLocaleString()}
                        </span>
                        <button style={styles.resolveButton}>
                          Investigate
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Budget Management Tab */}
      {activeTab === 'budgets' && (
        <div style={styles.content}>
          <div style={styles.section}>
            <div style={styles.sectionHeader}>
              <h3 style={styles.sectionTitle}>All Budget Allocations</h3>
              <button style={styles.primaryButton}>
                + Create Budget Plan
              </button>
            </div>

            <div style={styles.budgetTable}>
              <div style={styles.tableHeader}>
                <div style={styles.tableCell}>Incident</div>
                <div style={styles.tableCell}>Budget Cap</div>
                <div style={styles.tableCell}>Allocated</div>
                <div style={styles.tableCell}>Remaining</div>
                <div style={styles.tableCell}>Est. Needs</div>
                <div style={styles.tableCell}>Status</div>
              </div>
              {budgets.map(budget => (
                <div key={budget.id} style={styles.tableRow}>
                  <div style={styles.tableCell}>
                    <strong>{budget.incidentTitle}</strong>
                  </div>
                  <div style={styles.tableCell}>{formatCurrency(budget.budgetCap)}</div>
                  <div style={styles.tableCell}>{formatCurrency(budget.allocated)}</div>
                  <div style={styles.tableCell}>
                    <span style={{color: budget.remaining < 0 ? '#D32F2F' : '#388E3C'}}>
                      {formatCurrency(budget.remaining)}
                    </span>
                  </div>
                  <div style={styles.tableCell}>{formatCurrency(budget.estimatedNeeds)}</div>
                  <div style={styles.tableCell}>
                    {budget.remaining >= budget.estimatedNeeds * 0.5 ? (
                      <span style={styles.statusBadge} className="status-good">✓ On Track</span>
                    ) : budget.remaining >= budget.estimatedNeeds * 0.2 ? (
                      <span style={styles.statusBadge} className="status-warning">⚠️ Watch</span>
                    ) : (
                      <span style={styles.statusBadge} className="status-critical">🚨 Critical</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Fraud Detection Tab */}
      {activeTab === 'fraud' && (
        <div style={styles.content}>
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>Fraud Detection & Risk Analysis</h3>
            
            <div style={styles.fraudStats}>
              <div style={styles.fraudStatCard}>
                <div style={styles.fraudStatValue}>{alerts.length}</div>
                <div style={styles.fraudStatLabel}>Total Alerts</div>
              </div>
              <div style={styles.fraudStatCard}>
                <div style={styles.fraudStatValue} style={{color: '#D32F2F'}}>{totals.criticalAlerts}</div>
                <div style={styles.fraudStatLabel}>Critical Risk</div>
              </div>
              <div style={styles.fraudStatCard}>
                <div style={styles.fraudStatValue} style={{color: '#F57C00'}}>{totals.highRiskAlerts}</div>
                <div style={styles.fraudStatLabel}>High Risk</div>
              </div>
              <div style={styles.fraudStatCard}>
                <div style={styles.fraudStatValue} style={{color: '#388E3C'}}>
                  {alerts.filter(a => a.resolved).length}
                </div>
                <div style={styles.fraudStatLabel}>Resolved</div>
              </div>
            </div>

            <div style={styles.alertsFullList}>
              {alerts.map(alert => (
                <div key={alert.id} style={styles.fraudAlertCard}>
                  <div style={styles.fraudAlertHeader}>
                    <div>
                      <h4 style={styles.fraudAlertTitle}>
                        {alert.type.replace(/_/g, ' ').toUpperCase()}
                      </h4>
                      <p style={styles.fraudAlertDescription}>{alert.description}</p>
                    </div>
                    <div style={{
                      ...styles.riskScoreBadge,
                      backgroundColor: getRiskColor(alert.riskLevel)
                    }}>
                      <div style={styles.riskScoreValue}>{alert.riskScore}</div>
                      <div style={styles.riskScoreLabel}>Risk Score</div>
                    </div>
                  </div>

                  <div style={styles.fraudAlertBody}>
                    <div style={styles.fraudAlertSection}>
                      <strong>Evidence:</strong>
                      <ul style={styles.fraudEvidenceList}>
                        {alert.evidence.map((ev, idx) => (
                          <li key={idx}>{ev}</li>
                        ))}
                      </ul>
                    </div>

                    {alert.donationId && (
                      <div style={styles.fraudAlertSection}>
                        <strong>Donation ID:</strong> {alert.donationId}
                      </div>
                    )}

                    <div style={styles.fraudAlertSection}>
                      <strong>Flagged:</strong> {new Date(alert.flaggedAt).toLocaleString()}
                    </div>
                  </div>

                  <div style={styles.fraudAlertFooter}>
                    <button style={styles.investigateButton}>
                      🔍 Investigate
                    </button>
                    <button style={styles.resolveButton}>
                      ✓ Mark Resolved
                    </button>
                    <button style={styles.dismissButton}>
                      ✕ Dismiss
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Donor Transparency Tab */}
      {activeTab === 'transparency' && (
        <div style={styles.content}>
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>
              <Eye size={20} />
              Donor Transparency & Impact Tracking
            </h3>
            <p style={styles.transparencyIntro}>
              Every donor can see exactly which emergency response step their donation funded,
              with real-time updates on completion and impact.
            </p>

            <div style={styles.transparencyFeatures}>
              <div style={styles.featureCard}>
                <div style={styles.featureIcon}>🎯</div>
                <h4 style={styles.featureTitle}>Step-Level Allocation</h4>
                <p style={styles.featureDesc}>
                  Donations are allocated to specific response steps, not general funds
                </p>
              </div>

              <div style={styles.featureCard}>
                <div style={styles.featureIcon}>📊</div>
                <h4 style={styles.featureTitle}>Real-Time Tracking</h4>
                <p style={styles.featureDesc}>
                  Donors receive updates as their funded step progresses and completes
                </p>
              </div>

              <div style={styles.featureCard}>
                <div style={styles.featureIcon}>🔗</div>
                <h4 style={styles.featureTitle}>Blockchain Verified</h4>
                <p style={styles.featureDesc}>
                  All allocations recorded on-chain with immutable transaction hashes
                </p>
              </div>

              <div style={styles.featureCard}>
                <div style={styles.featureIcon}>📄</div>
                <h4 style={styles.featureTitle}>Impact Receipts</h4>
                <p style={styles.featureDesc}>
                  Automatic generation of detailed receipts showing exact impact
                </p>
              </div>
            </div>

            <div style={styles.exampleReceipt}>
              <h4 style={styles.receiptTitle}>Example Donor Receipt</h4>
              <div style={styles.receipt}>
                <div style={styles.receiptHeader}>
                  <div style={styles.receiptLogo}>🏥</div>
                  <div>
                    <div style={styles.receiptOrgName}>Community Emergency Response</div>
                    <div style={styles.receiptDate}>January 12, 2026</div>
                  </div>
                </div>

                <div style={styles.receiptSection}>
                  <div style={styles.receiptLabel}>Donor Name</div>
                  <div style={styles.receiptValue}>Sarah Johnson</div>
                </div>

                <div style={styles.receiptSection}>
                  <div style={styles.receiptLabel}>Donation Amount</div>
                  <div style={styles.receiptValue}>$250.00 USD</div>
                </div>

                <div style={styles.receiptSection}>
                  <div style={styles.receiptLabel}>Incident</div>
                  <div style={styles.receiptValue}>Medical Emergency - Downtown Area</div>
                </div>

                <div style={styles.receiptSection}>
                  <div style={styles.receiptLabel}>Your Donation Funded</div>
                  <div style={styles.receiptImpact}>
                    ✓ Purchase medical supplies for triage
                  </div>
                </div>

                <div style={styles.receiptSection}>
                  <div style={styles.receiptLabel}>Step Status</div>
                  <div style={styles.receiptStatus}>
                    <CheckCircle size={16} color="#388E3C" />
                    <span>Completed on Jan 12, 2026 at 2:45 PM</span>
                  </div>
                </div>

                <div style={styles.receiptSection}>
                  <div style={styles.receiptLabel}>Impact</div>
                  <div style={styles.receiptImpact}>
                    Your donation directly enabled first responders to provide immediate medical
                    care to 12 individuals at the scene. Supplies purchased included bandages,
                    oxygen masks, and emergency medications.
                  </div>
                </div>

                <div style={styles.receiptSection}>
                  <div style={styles.receiptLabel}>Blockchain Transaction</div>
                  <div style={styles.receiptHash}>0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb9</div>
                </div>

                <div style={styles.receiptFooter}>
                  <div style={styles.taxDeductible}>✓ Tax Deductible</div>
                  <div style={styles.receiptId}>Receipt ID: RCP-2026-001234</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    padding: '2rem',
    maxWidth: '1600px',
    margin: '0 auto',
    backgroundColor: '#f5f7fa'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '2rem',
    padding: '1.5rem',
    backgroundColor: 'white',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
  },
  title: {
    margin: 0,
    fontSize: '2rem',
    color: '#1a237e',
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem'
  },
  titleIcon: {
    color: '#4CAF50'
  },
  subtitle: {
    margin: '0.5rem 0 0 0',
    color: '#666',
    fontSize: '1rem'
  },
  headerStats: {
    display: 'flex',
    gap: '1rem'
  },
  statBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.5rem 1rem',
    backgroundColor: '#f5f7fa',
    borderRadius: '8px',
    fontSize: '0.9rem',
    fontWeight: '600',
    color: '#333'
  },
  tabs: {
    display: 'flex',
    gap: '0.5rem',
    marginBottom: '2rem',
    backgroundColor: 'white',
    padding: '0.5rem',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
  },
  tab: {
    padding: '0.75rem 1.5rem',
    border: 'none',
    backgroundColor: 'transparent',
    cursor: 'pointer',
    borderRadius: '8px',
    fontSize: '1rem',
    fontWeight: '600',
    color: '#666',
    transition: 'all 0.2s'
  },
  tabActive: {
    backgroundColor: '#1a237e',
    color: 'white'
  },
  content: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2rem'
  },
  metricsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '1.5rem',
    marginBottom: '2rem'
  },
  metricCard: {
    backgroundColor: 'white',
    padding: '1.5rem',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    display: 'flex',
    gap: '1rem',
    alignItems: 'center'
  },
  metricIcon: {
    width: '60px',
    height: '60px',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white'
  },
  metricContent: {
    flex: 1
  },
  metricLabel: {
    fontSize: '0.85rem',
    color: '#666',
    marginBottom: '0.25rem',
    fontWeight: '600'
  },
  metricValue: {
    fontSize: '1.8rem',
    fontWeight: '700',
    color: '#1a237e',
    marginBottom: '0.25rem'
  },
  metricSubtext: {
    fontSize: '0.8rem',
    color: '#999'
  },
  section: {
    backgroundColor: 'white',
    padding: '2rem',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
  },
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1.5rem'
  },
  sectionTitle: {
    margin: '0 0 1.5rem 0',
    fontSize: '1.5rem',
    color: '#1a237e',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem'
  },
  budgetHealthGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
    gap: '1.5rem'
  },
  budgetHealthCard: {
    border: '2px solid #e0e0e0',
    borderRadius: '8px',
    padding: '1.5rem',
    transition: 'all 0.2s'
  },
  budgetHealthHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '1rem'
  },
  budgetHealthTitle: {
    margin: 0,
    fontSize: '1.1rem',
    color: '#333'
  },
  healthBadge: {
    padding: '0.25rem 0.75rem',
    borderRadius: '6px',
    fontSize: '0.75rem',
    fontWeight: '700'
  },
  budgetMetrics: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    marginBottom: '1rem'
  },
  budgetMetricRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '0.9rem'
  },
  progressBarContainer: {
    marginTop: '1rem'
  },
  progressBar: {
    width: '100%',
    height: '8px',
    backgroundColor: '#e0e0e0',
    borderRadius: '4px',
    overflow: 'hidden',
    marginBottom: '0.5rem'
  },
  progressFill: {
    height: '100%',
    transition: 'width 0.3s ease'
  },
  progressLabel: {
    fontSize: '0.8rem',
    color: '#666',
    fontWeight: '600'
  },
  alertsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem'
  },
  alertCard: {
    display: 'flex',
    border: '1px solid #e0e0e0',
    borderRadius: '8px',
    overflow: 'hidden',
    transition: 'all 0.2s'
  },
  alertRisk: {
    width: '8px',
    flexShrink: 0
  },
  alertContent: {
    flex: 1,
    padding: '1rem'
  },
  alertHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '0.75rem'
  },
  alertType: {
    fontSize: '0.85rem',
    fontWeight: '700',
    color: '#333'
  },
  alertBadge: {
    padding: '0.25rem 0.75rem',
    borderRadius: '4px',
    fontSize: '0.7rem',
    fontWeight: '700',
    border: '2px solid'
  },
  alertDescription: {
    margin: '0 0 0.75rem 0',
    fontSize: '0.95rem',
    color: '#666'
  },
  alertEvidence: {
    marginBottom: '0.75rem'
  },
  evidenceList: {
    margin: '0.5rem 0 0 0',
    paddingLeft: '1.5rem',
    fontSize: '0.85rem',
    color: '#666'
  },
  alertFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: '0.75rem',
    borderTop: '1px solid #e0e0e0'
  },
  alertTime: {
    fontSize: '0.8rem',
    color: '#999'
  },
  emptyState: {
    textAlign: 'center',
    padding: '3rem',
    color: '#999'
  },
  primaryButton: {
    padding: '0.75rem 1.5rem',
    backgroundColor: '#1a237e',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '1rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'background 0.2s'
  },
  budgetTable: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem'
  },
  tableHeader: {
    display: 'grid',
    gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1fr',
    gap: '1rem',
    padding: '1rem',
    backgroundColor: '#f5f7fa',
    borderRadius: '8px',
    fontWeight: '700',
    fontSize: '0.85rem',
    color: '#666'
  },
  tableRow: {
    display: 'grid',
    gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1fr',
    gap: '1rem',
    padding: '1rem',
    backgroundColor: 'white',
    border: '1px solid #e0e0e0',
    borderRadius: '8px',
    fontSize: '0.9rem'
  },
  tableCell: {
    display: 'flex',
    alignItems: 'center'
  },
  statusBadge: {
    padding: '0.25rem 0.75rem',
    borderRadius: '4px',
    fontSize: '0.8rem',
    fontWeight: '600'
  },
  fraudStats: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '1.5rem',
    marginBottom: '2rem'
  },
  fraudStatCard: {
    textAlign: 'center',
    padding: '1.5rem',
    backgroundColor: '#f9f9f9',
    borderRadius: '8px'
  },
  fraudStatValue: {
    fontSize: '2.5rem',
    fontWeight: '700',
    color: '#1a237e',
    marginBottom: '0.5rem'
  },
  fraudStatLabel: {
    fontSize: '0.9rem',
    color: '#666',
    fontWeight: '600'
  },
  alertsFullList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem'
  },
  fraudAlertCard: {
    border: '2px solid #e0e0e0',
    borderRadius: '8px',
    padding: '1.5rem'
  },
  fraudAlertHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '1rem',
    paddingBottom: '1rem',
    borderBottom: '1px solid #e0e0e0'
  },
  fraudAlertTitle: {
    margin: '0 0 0.5rem 0',
    fontSize: '1.2rem',
    color: '#1a237e'
  },
  fraudAlertDescription: {
    margin: 0,
    color: '#666'
  },
  riskScoreBadge: {
    padding: '1rem',
    borderRadius: '8px',
    color: 'white',
    textAlign: 'center',
    minWidth: '100px'
  },
  riskScoreValue: {
    fontSize: '2rem',
    fontWeight: '700',
    marginBottom: '0.25rem'
  },
  riskScoreLabel: {
    fontSize: '0.75rem',
    opacity: 0.9
  },
  fraudAlertBody: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    marginBottom: '1rem'
  },
  fraudAlertSection: {
    fontSize: '0.9rem'
  },
  fraudEvidenceList: {
    margin: '0.5rem 0 0 0',
    paddingLeft: '1.5rem',
    color: '#666'
  },
  fraudAlertFooter: {
    display: 'flex',
    gap: '1rem',
    paddingTop: '1rem',
    borderTop: '1px solid #e0e0e0'
  },
  investigateButton: {
    padding: '0.5rem 1rem',
    backgroundColor: '#2196F3',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '0.9rem',
    fontWeight: '600',
    cursor: 'pointer'
  },
  resolveButton: {
    padding: '0.5rem 1rem',
    backgroundColor: '#4CAF50',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '0.9rem',
    fontWeight: '600',
    cursor: 'pointer'
  },
  dismissButton: {
    padding: '0.5rem 1rem',
    backgroundColor: '#999',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '0.9rem',
    fontWeight: '600',
    cursor: 'pointer'
  },
  transparencyIntro: {
    fontSize: '1rem',
    color: '#666',
    lineHeight: '1.6',
    marginBottom: '2rem'
  },
  transparencyFeatures: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '1.5rem',
    marginBottom: '3rem'
  },
  featureCard: {
    padding: '1.5rem',
    backgroundColor: '#f9f9f9',
    borderRadius: '8px',
    textAlign: 'center'
  },
  featureIcon: {
    fontSize: '3rem',
    marginBottom: '1rem'
  },
  featureTitle: {
    margin: '0 0 0.75rem 0',
    fontSize: '1.1rem',
    color: '#1a237e'
  },
  featureDesc: {
    margin: 0,
    fontSize: '0.9rem',
    color: '#666',
    lineHeight: '1.5'
  },
  exampleReceipt: {
    marginTop: '2rem'
  },
  receiptTitle: {
    margin: '0 0 1rem 0',
    fontSize: '1.2rem',
    color: '#1a237e'
  },
  receipt: {
    border: '2px solid #e0e0e0',
    borderRadius: '8px',
    padding: '2rem',
    backgroundColor: 'white',
    maxWidth: '600px'
  },
  receiptHeader: {
    display: 'flex',
    gap: '1rem',
    marginBottom: '2rem',
    paddingBottom: '1rem',
    borderBottom: '2px solid #e0e0e0'
  },
  receiptLogo: {
    width: '60px',
    height: '60px',
    backgroundColor: '#1a237e',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '2rem'
  },
  receiptOrgName: {
    fontSize: '1.2rem',
    fontWeight: '700',
    color: '#1a237e',
    marginBottom: '0.25rem'
  },
  receiptDate: {
    fontSize: '0.9rem',
    color: '#666'
  },
  receiptSection: {
    marginBottom: '1.5rem'
  },
  receiptLabel: {
    fontSize: '0.8rem',
    fontWeight: '700',
    color: '#666',
    textTransform: 'uppercase',
    marginBottom: '0.5rem'
  },
  receiptValue: {
    fontSize: '1rem',
    color: '#333',
    fontWeight: '600'
  },
  receiptImpact: {
    fontSize: '0.95rem',
    color: '#333',
    lineHeight: '1.6',
    padding: '1rem',
    backgroundColor: '#E8F5E9',
    borderRadius: '6px',
    border: '2px solid #4CAF50'
  },
  receiptStatus: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    color: '#388E3C',
    fontWeight: '600'
  },
  receiptHash: {
    fontSize: '0.85rem',
    fontFamily: 'monospace',
    color: '#666',
    padding: '0.5rem',
    backgroundColor: '#f5f7fa',
    borderRadius: '4px',
    wordBreak: 'break-all'
  },
  receiptFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    paddingTop: '1rem',
    borderTop: '2px solid #e0e0e0',
    marginTop: '1rem'
  },
  taxDeductible: {
    fontSize: '0.9rem',
    color: '#388E3C',
    fontWeight: '600'
  },
  receiptId: {
    fontSize: '0.85rem',
    color: '#999',
    fontFamily: 'monospace'
  }
};

// Add to global styles
const styleTag = document.createElement('style');
styleTag.innerHTML = `
  .bg-blue { background: linear-gradient(135deg, #2196F3 0%, #1976D2 100%); }
  .bg-green { background: linear-gradient(135deg, #4CAF50 0%, #388E3C 100%); }
  .bg-orange { background: linear-gradient(135deg, #FF9800 0%, #F57C00 100%); }
  .bg-red { background: linear-gradient(135deg, #F44336 0%, #D32F2F 100%); }
  
  .status-good { background-color: #E8F5E9; color: #388E3C; padding: 0.25rem 0.75rem; border-radius: 4px; }
  .status-warning { background-color: #FFF9C4; color: #F57C00; padding: 0.25rem 0.75rem; border-radius: 4px; }
  .status-critical { background-color: #FFEBEE; color: #D32F2F; padding: 0.25rem 0.75rem; border-radius: 4px; }
`;
document.head.appendChild(styleTag);

export default FinancialControlsHub;
