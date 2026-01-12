/**
 * Donor Transparency View
 * Shows donors exactly which steps their money funded and the impact
 */

import React, { useState, useEffect } from 'react';
import styles from './DonorTransparencyView.module.css';

interface DonationTracking {
  donationId: string;
  donorName: string;
  amount: number;
  currency: string;
  pledgeDate: string;
  incidentId: string;
  incidentTitle: string;
  stepsFunded: Array<{
    stepId: string;
    stepName: string;
    category: string;
    allocatedAmount: number;
    spentAmount: number;
    status: 'pending' | 'in-progress' | 'completed';
    description: string;
    receipts: Array<{
      id: string;
      vendor: string;
      amount: number;
      date: string;
      proof?: string;
    }>;
  }>;
  impactNarrative: string;
  verificationStatus: 'pledged' | 'verified' | 'disbursed' | 'documented';
}

interface Props {
  donorName: string;
  donations?: DonationTracking[];
  onClose?: () => void;
}

export const DonorTransparencyView: React.FC<Props> = ({ donorName, donations = [], onClose }) => {
  const [selectedDonation, setSelectedDonation] = useState<DonationTracking | null>(null);
  const [filterIncident, setFilterIncident] = useState<string>('all');
  const [expandedSteps, setExpandedSteps] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (donations.length > 0) {
      setSelectedDonation(donations[0]);
    }
  }, [donations]);

  const handleExpandStep = (stepId: string) => {
    const newExpanded = new Set(expandedSteps);
    if (newExpanded.has(stepId)) {
      newExpanded.delete(stepId);
    } else {
      newExpanded.add(stepId);
    }
    setExpandedSteps(newExpanded);
  };

  const filteredDonations = filterIncident === 'all'
    ? donations
    : donations.filter(d => d.incidentId === filterIncident);

  const totalDonated = donations.reduce((sum, d) => sum + d.amount, 0);
  const totalStepsFunded = donations.reduce((sum, d) => sum + d.stepsFunded.length, 0);
  const completedSteps = donations.reduce(
    (sum, d) => sum + d.stepsFunded.filter(s => s.status === 'completed').length,
    0
  );

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pledged':
        return '💰';
      case 'verified':
        return '✓';
      case 'disbursed':
        return '↗️';
      case 'documented':
        return '📋';
      default:
        return '●';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pledged':
        return '#FFA500';
      case 'verified':
        return '#4CAF50';
      case 'disbursed':
        return '#2196F3';
      case 'documented':
        return '#9C27B0';
      default:
        return '#999';
    }
  };

  const getStepStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return '#FFA500';
      case 'in-progress':
        return '#2196F3';
      case 'completed':
        return '#4CAF50';
      default:
        return '#999';
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Your Impact</h1>
        <p>See exactly how your contributions are making a difference</p>
        {onClose && <button className={styles.closeBtn} onClick={onClose}>✕</button>}
      </div>

      {/* Summary Cards */}
      <div className={styles.summaryCards}>
        <div className={styles.card}>
          <div className={styles.cardIcon}>💵</div>
          <div className={styles.cardContent}>
            <div className={styles.cardLabel}>Total Contributed</div>
            <div className={styles.cardValue}>${totalDonated.toLocaleString()}</div>
          </div>
        </div>

        <div className={styles.card}>
          <div className={styles.cardIcon}>🎯</div>
          <div className={styles.cardContent}>
            <div className={styles.cardLabel}>Emergency Steps Funded</div>
            <div className={styles.cardValue}>{totalStepsFunded}</div>
          </div>
        </div>

        <div className={styles.card}>
          <div className={styles.cardIcon}>✓</div>
          <div className={styles.cardContent}>
            <div className={styles.cardLabel}>Completed Actions</div>
            <div className={styles.cardValue}>{completedSteps}</div>
          </div>
        </div>

        <div className={styles.card}>
          <div className={styles.cardIcon}>🏅</div>
          <div className={styles.cardContent}>
            <div className={styles.cardLabel}>Incidents Helped</div>
            <div className={styles.cardValue}>{new Set(donations.map(d => d.incidentId)).size}</div>
          </div>
        </div>
      </div>

      {/* Filter */}
      <div className={styles.filterSection}>
        <label>Filter by Incident:</label>
        <select value={filterIncident} onChange={(e) => setFilterIncident(e.target.value)}>
          <option value="all">All Incidents</option>
          {[...new Set(donations.map(d => d.incidentId))].map(incidentId => (
            <option key={incidentId} value={incidentId}>
              {donations.find(d => d.incidentId === incidentId)?.incidentTitle}
            </option>
          ))}
        </select>
      </div>

      {/* Donations List */}
      <div className={styles.donationsList}>
        {filteredDonations.length === 0 ? (
          <div className={styles.empty}>
            <p>No donations found matching your filter</p>
          </div>
        ) : (
          filteredDonations.map((donation) => (
            <div
              key={donation.donationId}
              className={`${styles.donationCard} ${selectedDonation?.donationId === donation.donationId ? styles.selected : ''}`}
              onClick={() => setSelectedDonation(donation)}
            >
              <div className={styles.donationHeader}>
                <div className={styles.donationInfo}>
                  <h3>{donation.incidentTitle}</h3>
                  <p className={styles.donationDate}>{donation.pledgeDate}</p>
                </div>
                <div className={styles.donationAmount}>
                  <span className={styles.amount}>${donation.amount.toLocaleString()}</span>
                  <span className={styles.currency}>{donation.currency}</span>
                </div>
              </div>

              {/* Status Timeline */}
              <div className={styles.statusTimeline}>
                {['pledged', 'verified', 'disbursed', 'documented'].map((status) => (
                  <div
                    key={status}
                    className={styles.statusStep}
                    style={{
                      opacity: donation.verificationStatus === status ||
                        ['pledged', 'verified', 'disbursed', 'documented'].indexOf(donation.verificationStatus) >= ['pledged', 'verified', 'disbursed', 'documented'].indexOf(status)
                        ? 1 : 0.3
                    }}
                  >
                    <div
                      className={styles.statusDot}
                      style={{ backgroundColor: getStatusColor(status) }}
                    >
                      {getStatusIcon(status)}
                    </div>
                    <span className={styles.statusLabel}>{status}</span>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Selected Donation Details */}
      {selectedDonation && (
        <div className={styles.detailsSection}>
          <h2>Donation Impact Details</h2>

          <div className={styles.impactNarrative}>
            <h3>What Your Contribution Funded</h3>
            <p>{selectedDonation.impactNarrative || 'Your contribution is being used to support emergency response operations.'}</p>
          </div>

          {/* Steps Funded */}
          <div className={styles.stepsList}>
            <h3>Emergency Response Steps ({selectedDonation.stepsFunded.length})</h3>

            {selectedDonation.stepsFunded.map((step) => (
              <div key={step.stepId} className={styles.stepCard}>
                <div
                  className={styles.stepHeader}
                  onClick={() => handleExpandStep(step.stepId)}
                >
                  <div className={styles.stepTitle}>
                    <span
                      className={styles.stepStatus}
                      style={{ backgroundColor: getStepStatusColor(step.status) }}
                    >
                      {step.status.charAt(0).toUpperCase() + step.status.slice(1)}
                    </span>
                    <h4>{step.stepName}</h4>
                    <span className={styles.stepCategory}>{step.category}</span>
                  </div>

                  <div className={styles.stepAmount}>
                    <div className={styles.amountBreakdown}>
                      <span className={styles.allocLabel}>Allocated:</span>
                      <span className={styles.allocValue}>${step.allocatedAmount.toLocaleString()}</span>
                      {step.spentAmount > 0 && (
                        <>
                          <span className={styles.spentLabel}>Spent:</span>
                          <span className={styles.spentValue}>${step.spentAmount.toLocaleString()}</span>
                        </>
                      )}
                    </div>
                  </div>

                  <button className={styles.expandBtn}>
                    {expandedSteps.has(step.stepId) ? '▼' : '▶'}
                  </button>
                </div>

                {/* Expanded Content */}
                {expandedSteps.has(step.stepId) && (
                  <div className={styles.stepDetails}>
                    <p className={styles.stepDescription}>{step.description}</p>

                    {/* Progress Bar */}
                    <div className={styles.progressContainer}>
                      <div className={styles.progressLabel}>
                        <span>Fund Usage</span>
                        <span>{Math.round((step.spentAmount / step.allocatedAmount) * 100)}%</span>
                      </div>
                      <div className={styles.progressBar}>
                        <div
                          className={styles.progressFill}
                          style={{ width: `${Math.min((step.spentAmount / step.allocatedAmount) * 100, 100)}%` }}
                        />
                      </div>
                    </div>

                    {/* Receipts */}
                    {step.receipts.length > 0 && (
                      <div className={styles.receiptsSection}>
                        <h5>Purchase Records ({step.receipts.length})</h5>
                        <div className={styles.receiptsList}>
                          {step.receipts.map((receipt) => (
                            <div key={receipt.id} className={styles.receiptItem}>
                              <div className={styles.receiptInfo}>
                                <span className={styles.vendor}>{receipt.vendor}</span>
                                <span className={styles.receiptDate}>{receipt.date}</span>
                              </div>
                              <div className={styles.receiptAmount}>
                                ${receipt.amount.toLocaleString()}
                              </div>
                              {receipt.proof && (
                                <a href={receipt.proof} target="_blank" rel="noopener noreferrer" className={styles.receiptProof}>
                                  📸 Proof
                                </a>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Verification Badge */}
          <div className={styles.verificationBadge}>
            <h3>Verification Status</h3>
            <div className={styles.badge}>
              <span className={styles.badgeIcon}>✓</span>
              <span className={styles.badgeText}>
                Your contribution has been verified and is being used as intended
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {donations.length === 0 && (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>💝</div>
          <h2>No Contributions Yet</h2>
          <p>Once you make a contribution to an emergency response, you'll be able to track exactly where your funds go and the impact they have.</p>
        </div>
      )}
    </div>
  );
};

export default DonorTransparencyView;
