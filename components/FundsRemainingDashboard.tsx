/**
 * Funds Remaining Dashboard
 * Shows real-time budget status and allocation breakdown
 */

import React, { useState, useEffect } from 'react';
import styles from './FundsRemainingDashboard.module.css';

interface BudgetAllocation {
  stepId: string;
  stepName: string;
  category: string;
  allocatedAmount: number;
  spentAmount: number;
  remaining: number;
  percentUsed: number;
  status: 'pending' | 'allocated' | 'spent' | 'refunded';
}

interface BudgetStatus {
  totalBudget: number;
  totalSpent: number;
  totalRemaining: number;
  percentRemaining: number;
  allocations: BudgetAllocation[];
  currency: string;
  lastUpdated: number;
}

interface Props {
  incidentId: string;
  budgetStatus?: BudgetStatus;
  onAllocate?: (stepId: string, amount: number) => void;
  onUpdateSpending?: (stepId: string, amount: number) => void;
}

export const FundsRemainingDashboard: React.FC<Props> = ({
  incidentId,
  budgetStatus,
  onAllocate,
  onUpdateSpending
}) => {
  const [expandedAllocations, setExpandedAllocations] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState<'allocation' | 'spent' | 'remaining' | 'risk'>('spent');
  const [showEditMode, setShowEditMode] = useState(false);
  const [editValues, setEditValues] = useState<Record<string, number>>({});

  const defaultBudget: BudgetStatus = budgetStatus || {
    totalBudget: 10000,
    totalSpent: 3500,
    totalRemaining: 6500,
    percentRemaining: 65,
    currency: 'USD',
    lastUpdated: Date.now(),
    allocations: [
      {
        stepId: '1',
        stepName: 'Emergency Response Setup',
        category: 'Personnel',
        allocatedAmount: 2000,
        spentAmount: 1800,
        remaining: 200,
        percentUsed: 90,
        status: 'spent'
      },
      {
        stepId: '2',
        stepName: 'Medical Support',
        category: 'Medical',
        allocatedAmount: 3000,
        spentAmount: 1200,
        remaining: 1800,
        percentUsed: 40,
        status: 'allocated'
      },
      {
        stepId: '3',
        stepName: 'Equipment & Supplies',
        category: 'Equipment',
        allocatedAmount: 2500,
        spentAmount: 500,
        remaining: 2000,
        percentUsed: 20,
        status: 'allocated'
      },
      {
        stepId: '4',
        stepName: 'Logistics & Transportation',
        category: 'Logistics',
        allocatedAmount: 2500,
        spentAmount: 0,
        remaining: 2500,
        percentUsed: 0,
        status: 'pending'
      }
    ]
  };

  const budget = budgetStatus || defaultBudget;

  const handleToggleExpand = (stepId: string) => {
    const newExpanded = new Set(expandedAllocations);
    if (newExpanded.has(stepId)) {
      newExpanded.delete(stepId);
    } else {
      newExpanded.add(stepId);
    }
    setExpandedAllocations(newExpanded);
  };

  const getSortedAllocations = () => {
    const sorted = [...budget.allocations];
    if (sortBy === 'spent') {
      sorted.sort((a, b) => b.spentAmount - a.spentAmount);
    } else if (sortBy === 'remaining') {
      sorted.sort((a, b) => b.remaining - a.remaining);
    } else if (sortBy === 'allocation') {
      sorted.sort((a, b) => b.allocatedAmount - a.allocatedAmount);
    } else if (sortBy === 'risk') {
      sorted.sort((a, b) => b.percentUsed - a.percentUsed);
    }
    return sorted;
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'Personnel': '#FF6B6B',
      'Medical': '#4ECDC4',
      'Equipment': '#45B7D1',
      'Logistics': '#FFA07A',
      'Safety': '#98D8C8',
      'Communication': '#F7DC6F',
      'Facilities': '#BB8FCE',
      'Other': '#95A5A6'
    };
    return colors[category] || '#95A5A6';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return '⏳';
      case 'allocated':
        return '📦';
      case 'spent':
        return '✓';
      case 'refunded':
        return '↩️';
      default:
        return '●';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return '#FFC107';
      case 'allocated':
        return '#2196F3';
      case 'spent':
        return '#4CAF50';
      case 'refunded':
        return '#9C27B0';
      default:
        return '#999';
    }
  };

  const getRiskLevel = (percentUsed: number) => {
    if (percentUsed >= 90) return 'critical';
    if (percentUsed >= 70) return 'high';
    if (percentUsed >= 50) return 'medium';
    return 'low';
  };

  const getRiskColor = (percentUsed: number) => {
    const risk = getRiskLevel(percentUsed);
    switch (risk) {
      case 'critical':
        return '#F44336';
      case 'high':
        return '#FF9800';
      case 'medium':
        return '#FFC107';
      case 'low':
        return '#4CAF50';
      default:
        return '#999';
    }
  };

  const totalCritical = budget.allocations.filter(a => getRiskLevel(a.percentUsed) === 'critical').length;
  const totalHigh = budget.allocations.filter(a => getRiskLevel(a.percentUsed) === 'high').length;

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <h1>Budget & Funds Status</h1>
        <p>Real-time tracking of funds allocated vs spent by emergency response step</p>
      </div>

      {/* Main Budget Status */}
      <div className={styles.mainStatus}>
        <div className={styles.mainCard}>
          <div className={styles.budgetCircle}>
            <div className={styles.circleLabel}>Remaining</div>
            <div className={styles.circleValue}>${budget.totalRemaining.toLocaleString()}</div>
            <div className={styles.circlePercent}>{budget.percentRemaining}%</div>
          </div>

          <div className={styles.budgetDetails}>
            <div className={styles.detailRow}>
              <span className={styles.label}>Total Budget:</span>
              <span className={styles.value}>${budget.totalBudget.toLocaleString()} {budget.currency}</span>
            </div>
            <div className={styles.detailRow}>
              <span className={styles.label}>Total Spent:</span>
              <span className={styles.value}>${budget.totalSpent.toLocaleString()}</span>
            </div>
            <div className={styles.detailRow}>
              <span className={styles.label}>Available:</span>
              <span className={styles.value} style={{ color: '#4CAF50', fontWeight: '700' }}>
                ${budget.totalRemaining.toLocaleString()}
              </span>
            </div>

            {/* Overall Progress */}
            <div className={styles.progressSection}>
              <div className={styles.progressLabel}>
                <span>Budget Utilization</span>
                <span>{Math.round((budget.totalSpent / budget.totalBudget) * 100)}%</span>
              </div>
              <div className={styles.progressBar}>
                <div
                  className={styles.progressFill}
                  style={{
                    width: `${(budget.totalSpent / budget.totalBudget) * 100}%`,
                    backgroundColor: getRiskColor((budget.totalSpent / budget.totalBudget) * 100)
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Risk Indicators */}
        <div className={styles.riskIndicators}>
          <div className={styles.riskCard}>
            <div className={styles.riskIcon}>🔴</div>
            <div className={styles.riskContent}>
              <div className={styles.riskLabel}>Critical (>90%)</div>
              <div className={styles.riskValue}>{totalCritical}</div>
            </div>
          </div>

          <div className={styles.riskCard}>
            <div className={styles.riskIcon}>🟠</div>
            <div className={styles.riskContent}>
              <div className={styles.riskLabel}>High (70-90%)</div>
              <div className={styles.riskValue}>{totalHigh}</div>
            </div>
          </div>

          <div className={styles.riskCard}>
            <div className={styles.riskIcon}>📊</div>
            <div className={styles.riskContent}>
              <div className={styles.riskLabel}>Budget Health</div>
              <div className={styles.riskValue}>{budget.percentRemaining}% Free</div>
            </div>
          </div>
        </div>
      </div>

      {/* Allocations Controls */}
      <div className={styles.controlsSection}>
        <div className={styles.sortControl}>
          <label>Sort by:</label>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value as any)}>
            <option value="spent">Amount Spent (High → Low)</option>
            <option value="allocation">Allocation Size (High → Low)</option>
            <option value="remaining">Amount Remaining (High → Low)</option>
            <option value="risk">Risk Level (Critical → Safe)</option>
          </select>
        </div>

        <button
          className={styles.editBtn}
          onClick={() => setShowEditMode(!showEditMode)}
        >
          {showEditMode ? '✓ Done Editing' : '✎ Edit Spending'}
        </button>

        <button className={styles.printBtn}>
          🖨️ Export Report
        </button>
      </div>

      {/* Allocations List */}
      <div className={styles.allocationsList}>
        {getSortedAllocations().length === 0 ? (
          <div className={styles.emptyState}>
            <p>No budget allocations yet</p>
          </div>
        ) : (
          getSortedAllocations().map((allocation) => {
            const riskLevel = getRiskLevel(allocation.percentUsed);
            return (
              <div
                key={allocation.stepId}
                className={`${styles.allocationCard} ${styles[`risk-${riskLevel}`]}`}
              >
                {/* Allocation Header */}
                <div
                  className={styles.allocationHeader}
                  onClick={() => handleToggleExpand(allocation.stepId)}
                >
                  <div className={styles.allocationLeft}>
                    {/* Category Badge */}
                    <div
                      className={styles.categoryBadge}
                      style={{ backgroundColor: getCategoryColor(allocation.category) }}
                    >
                      {allocation.category.charAt(0)}
                    </div>

                    <div className={styles.allocationInfo}>
                      <h4>{allocation.stepName}</h4>
                      <p className={styles.category}>{allocation.category}</p>
                    </div>
                  </div>

                  {/* Main Amounts */}
                  <div className={styles.allocationAmounts}>
                    <div className={styles.amountColumn}>
                      <span className={styles.amountLabel}>Allocated</span>
                      <span className={styles.amount}>${allocation.allocatedAmount.toLocaleString()}</span>
                    </div>

                    <div className={styles.amountColumn}>
                      <span className={styles.amountLabel}>Spent</span>
                      <span className={styles.amount}>${allocation.spentAmount.toLocaleString()}</span>
                    </div>

                    <div className={styles.amountColumn}>
                      <span className={styles.amountLabel}>Remaining</span>
                      <span className={styles.amount} style={{ color: '#4CAF50' }}>
                        ${allocation.remaining.toLocaleString()}
                      </span>
                    </div>

                    <div className={styles.riskIndicator} style={{ backgroundColor: getRiskColor(allocation.percentUsed) }}>
                      {allocation.percentUsed}%
                    </div>
                  </div>

                  <button className={styles.expandBtn}>
                    {expandedAllocations.has(allocation.stepId) ? '▼' : '▶'}
                  </button>
                </div>

                {/* Progress Bar */}
                <div className={styles.allocationProgress}>
                  <div className={styles.progressBar}>
                    <div
                      className={styles.progressFill}
                      style={{
                        width: `${Math.min(allocation.percentUsed, 100)}%`,
                        backgroundColor: getRiskColor(allocation.percentUsed)
                      }}
                    />
                  </div>
                </div>

                {/* Expanded Details */}
                {expandedAllocations.has(allocation.stepId) && (
                  <div className={styles.allocationDetails}>
                    {/* Status Info */}
                    <div className={styles.detailsGrid}>
                      <div className={styles.detailCard}>
                        <div className={styles.detailLabel}>Status</div>
                        <div className={styles.detailValue}>
                          <span style={{ color: getStatusColor(allocation.status) }}>
                            {getStatusIcon(allocation.status)} {allocation.status}
                          </span>
                        </div>
                      </div>

                      <div className={styles.detailCard}>
                        <div className={styles.detailLabel}>Budget Available</div>
                        <div className={styles.detailValue}>
                          ${allocation.remaining.toLocaleString()}
                          <span className={styles.percentText}>
                            ({Math.round(((allocation.remaining / allocation.allocatedAmount) * 100))}%)
                          </span>
                        </div>
                      </div>

                      <div className={styles.detailCard}>
                        <div className={styles.detailLabel}>Burn Rate</div>
                        <div className={styles.detailValue}>
                          {allocation.spentAmount > 0
                            ? `$${(allocation.spentAmount / 10).toLocaleString()}/hour`
                            : 'Not started'}
                        </div>
                      </div>

                      <div className={styles.detailCard}>
                        <div className={styles.detailLabel}>Risk Level</div>
                        <div className={styles.detailValue}>
                          <span style={{ color: getRiskColor(allocation.percentUsed), fontWeight: '600' }}>
                            {riskLevel.toUpperCase()}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Spending Adjustment (if in edit mode) */}
                    {showEditMode && (
                      <div className={styles.editSection}>
                        <label>Update Spending:</label>
                        <div className={styles.editInput}>
                          <span>$</span>
                          <input
                            type="number"
                            value={editValues[allocation.stepId] || allocation.spentAmount}
                            onChange={(e) => setEditValues(prev => ({
                              ...prev,
                              [allocation.stepId]: parseFloat(e.target.value) || 0
                            }))}
                          />
                          <button
                            className={styles.updateBtn}
                            onClick={() => {
                              onUpdateSpending?.(allocation.stepId, editValues[allocation.stepId] || allocation.spentAmount);
                            }}
                          >
                            Update
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Forecast */}
                    <div className={styles.forecastSection}>
                      <h5>Budget Forecast</h5>
                      {allocation.spentAmount === 0 ? (
                        <p className={styles.forecastText}>No spending yet - estimate based on historical data</p>
                      ) : (
                        <p className={styles.forecastText}>
                          At current burn rate, remaining budget will be depleted in ~{Math.round(allocation.remaining / (allocation.spentAmount / 10))} hours
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Alerts */}
      {(totalCritical > 0 || totalHigh > 0) && (
        <div className={styles.alertsSection}>
          <h3>⚠️ Budget Alerts</h3>
          {totalCritical > 0 && (
            <div className={styles.alert} style={{ borderColor: '#F44336' }}>
              <span style={{ color: '#F44336' }}>🔴 CRITICAL:</span> {totalCritical} allocation(s) over 90% budget used
            </div>
          )}
          {totalHigh > 0 && (
            <div className={styles.alert} style={{ borderColor: '#FF9800' }}>
              <span style={{ color: '#FF9800' }}>🟠 HIGH:</span> {totalHigh} allocation(s) between 70-90% budget used
            </div>
          )}
        </div>
      )}

      {/* Recommendations */}
      <div className={styles.recommendationsSection}>
        <h3>💡 Recommendations</h3>
        <ul>
          <li>Monitor critical allocations - consider requesting additional budget if needed</li>
          <li>Review spending patterns to identify cost optimization opportunities</li>
          {budget.percentRemaining < 20 && (
            <li><strong>Budget running low:</strong> Only {budget.percentRemaining}% remaining</li>
          )}
          <li>Track actual vs budgeted costs for post-incident analysis</li>
        </ul>
      </div>
    </div>
  );
};

export default FundsRemainingDashboard;
