# Financial Controls Integration Guide

## Quick Start

This guide shows how to integrate the Financial Controls system into existing pages and services.

## 1. Integrating with IncidentDetail Page

Add financial controls display to incident details:

```typescript
// pages/IncidentDetail.tsx
import { useState } from 'react';
import { FundsRemainingDashboard } from '../components/FundsRemainingDashboard';
import { FraudDetectionDashboard } from '../components/FraudDetectionDashboard';
import { financialControlsService } from '../services/financialControlsService';

export const IncidentDetail = ({ incidentId }) => {
  const [budgetStatus, setBudgetStatus] = useState(null);
  const [fraudAlerts, setFraudAlerts] = useState([]);

  // Load financial data when incident loads
  useEffect(() => {
    const loadFinancialData = async () => {
      const budget = await financialControlsService.getFundingStatus(incidentId);
      const alerts = await fraudDetectionService.getFraudAlerts(incidentId);
      
      setBudgetStatus(budget);
      setFraudAlerts(alerts);
    };

    loadFinancialData();
  }, [incidentId]);

  return (
    <div>
      {/* Existing incident details */}
      <h1>{incident.title}</h1>

      {/* Add financial tabs */}
      <Tabs>
        <Tab label="Overview">
          {/* Existing content */}
        </Tab>

        <Tab label="Budget & Funds">
          <FundsRemainingDashboard 
            incidentId={incidentId}
            budgetStatus={budgetStatus}
            onUpdateSpending={(stepId, amount) => {
              financialControlsService.recordSpending(incidentId, stepId, amount);
              // Refresh budget status
            }}
          />
        </Tab>

        <Tab label="Fraud Monitoring">
          <FraudDetectionDashboard
            incidentId={incidentId}
            alerts={fraudAlerts}
            onResolveAlert={(alertId, notes) => {
              fraudDetectionService.resolveFraudAlert(incidentId, alertId, notes);
              // Refresh alerts
            }}
          />
        </Tab>
      </Tabs>
    </div>
  );
};
```

## 2. Integrating with Donation Processing

When processing donations, automatically check for fraud:

```typescript
// services/donationHandler.ts
import { stepDonationsService } from './stepDonationsService';
import { fraudDetectionService } from './fraudDetectionService';
import { financialControlsService } from './financialControlsService';

export async function processDonation(donationData) {
  // 1. Record the pledge
  const donation = await stepDonationsService.pledgeDonation({
    incidentId: donationData.incidentId,
    stepId: donationData.stepId,
    donorName: donationData.donorName,
    amount: donationData.amount,
    currency: donationData.currency,
    itemCategory: donationData.category
  });

  // 2. Get all donations for context
  const allDonations = await stepDonationsService.listStepDonations(
    donationData.incidentId,
    donationData.stepId
  );

  // 3. Check for fraud
  const fraudAnalysis = fraudDetectionService.analyzeDonation(
    donationData.incidentId,
    donation,
    allDonations
  );

  // 4. Handle based on risk level
  if (fraudAnalysis.riskScore >= 80) {
    // Critical risk - block and alert
    await fraudDetectionService.reportSuspiciousDonation(
      donation.id,
      'critical',
      `Automated fraud detection score: ${fraudAnalysis.riskScore}`
    );

    return {
      success: false,
      status: 'FRAUD_ALERT',
      message: 'Donation flagged for review'
    };
  } else if (fraudAnalysis.riskScore >= 50) {
    // Medium risk - process but flag
    await fraudDetectionService.reportSuspiciousDonation(
      donation.id,
      'medium',
      `Automated fraud detection score: ${fraudAnalysis.riskScore}`
    );
  }

  // 5. If approved, allocate to budget
  if (fraudAnalysis.riskScore < 80) {
    await financialControlsService.allocateToStep(
      donationData.incidentId,
      donationData.stepId,
      donationData.category,
      donationData.amount
    );
  }

  return {
    success: true,
    donationId: donation.id,
    riskScore: fraudAnalysis.riskScore,
    status: 'PROCESSED'
  };
}
```

## 3. Showing Donors Their Impact

Create a donor dashboard page:

```typescript
// pages/DonorDashboard.tsx
import { useState, useEffect } from 'react';
import { DonorTransparencyView } from '../components/DonorTransparencyView';
import { financialControlsService } from '../services/financialControlsService';

export const DonorDashboard = ({ donorId, donorName }) => {
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDonorData = async () => {
      // Get transaction history
      const transactions = await financialControlsService.getTransactionHistory(donorId);

      // Map to component format
      const mapped = transactions.map(t => ({
        donationId: t.id,
        donorName: t.donorName,
        amount: t.amount,
        currency: t.currency,
        pledgeDate: new Date(t.timestamp).toLocaleDateString(),
        incidentId: t.incidentId,
        incidentTitle: getIncidentTitle(t.incidentId),
        stepsFunded: t.stepsFunded.map(step => ({
          stepId: step.id,
          stepName: step.name,
          category: step.category,
          allocatedAmount: step.allocated,
          spentAmount: step.spent,
          status: step.status,
          description: step.description,
          receipts: step.receipts || []
        })),
        impactNarrative: `Your $${t.amount} contribution helped fund ${t.stepsFunded.length} critical response steps including ${t.stepsFunded.map(s => s.name).join(', ')}. These funds were used to purchase essential supplies and services.`,
        verificationStatus: t.verified ? 'documented' : 'disbursed'
      }));

      setDonations(mapped);
      setLoading(false);
    };

    loadDonorData();
  }, [donorId]);

  if (loading) return <div>Loading...</div>;

  return (
    <DonorTransparencyView 
      donorName={donorName} 
      donations={donations}
    />
  );
};
```

## 4. Budget Monitoring in Real-Time

Track budget health in a status component:

```typescript
// components/BudgetStatusBar.tsx
import { useEffect, useState } from 'react';
import { financialControlsService } from '../services/financialControlsService';
import { fraudDetectionService } from '../services/fraudDetectionService';

export const BudgetStatusBar = ({ incidentId }) => {
  const [budgetHealth, setBudgetHealth] = useState(null);
  const [fraudSummary, setFraudSummary] = useState(null);

  useEffect(() => {
    const interval = setInterval(async () => {
      const remaining = await financialControlsService.getFundsRemaining(incidentId);
      const frauds = await fraudDetectionService.getFraudSummary(incidentId);

      setBudgetHealth(remaining);
      setFraudSummary(frauds);
    }, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, [incidentId]);

  if (!budgetHealth) return null;

  const getHealthColor = (percentRemaining) => {
    if (percentRemaining > 30) return 'green';
    if (percentRemaining > 10) return 'orange';
    return 'red';
  };

  return (
    <div className="budget-status-bar">
      <div className="budget-info">
        <span className="label">Budget Remaining:</span>
        <span className={`value ${getHealthColor(budgetHealth.percentRemaining)}`}>
          ${budgetHealth.remaining.toLocaleString()} ({budgetHealth.percentRemaining}%)
        </span>
      </div>

      {fraudSummary && fraudSummary.criticalAlerts > 0 && (
        <div className="fraud-alert">
          <span className="alert-icon">🚨</span>
          <span className="alert-text">
            {fraudSummary.criticalAlerts} critical fraud alert(s) require review
          </span>
        </div>
      )}
    </div>
  );
};
```

## 5. Automated Spending Updates from Field

Update spending as field teams report expenses:

```typescript
// services/fieldExpenseHandler.ts
import { financialControlsService } from './financialControlsService';

export async function recordFieldExpense(expense: {
  incidentId: string;
  stepId: string;
  vendor: string;
  amount: number;
  description: string;
  receipt?: {
    url: string;
    hash: string;
  };
}) {
  // 1. Record spending
  const updated = await financialControlsService.recordSpending(
    expense.incidentId,
    expense.stepId,
    expense.amount,
    expense.description
  );

  // 2. Validate receipt if provided
  if (expense.receipt) {
    const validation = await fraudDetectionService.validateReceipt(
      expense.stepId,
      expense.vendor,
      updated.allocatedAmount,
      expense.amount
    );

    if (!validation.isValid) {
      console.warn('Receipt validation issues:', validation.issues);
      // Could trigger review process
    }
  }

  // 3. Check budget health
  const remaining = await financialControlsService.getFundsRemaining(expense.incidentId);
  
  if (remaining.percentRemaining < 10) {
    // Critical budget - notify command
    await notificationService.sendAlert({
      title: 'Budget Critical',
      message: `Only ${remaining.percentRemaining}% budget remaining for incident`,
      severity: 'critical'
    });
  }

  return updated;
}
```

## 6. Compliance Reporting

Generate financial compliance reports:

```typescript
// services/complianceReporter.ts
import { financialControlsService } from './financialControlsService';
import { fraudDetectionService } from './fraudDetectionService';

export async function generateIncidentFinancialReport(incidentId: string) {
  const [
    budgetStatus,
    fraudReport,
    transactionHistory
  ] = await Promise.all([
    financialControlsService.getFundingStatus(incidentId),
    financialControlsService.generateFraudReport(incidentId),
    financialControlsService.exportForAudit(incidentId)
  ]);

  return {
    incidentId,
    generatedAt: new Date().toISOString(),
    budgetSummary: {
      totalBudget: budgetStatus.totalBudget,
      totalSpent: budgetStatus.totalSpent,
      remaining: budgetStatus.remaining,
      utilizationPercent: (budgetStatus.totalSpent / budgetStatus.totalBudget) * 100
    },
    fraudAnalysis: {
      totalAlerts: fraudReport.totalAlerts,
      unresolvedAlerts: fraudReport.unresolvedAlerts,
      criticalAlerts: fraudReport.criticalAlerts,
      resolutionRate: (fraudReport.resolvedAlerts / fraudReport.totalAlerts) * 100
    },
    allocations: budgetStatus.allocations,
    transactions: transactionHistory,
    auditTrail: await financialControlsService.exportForAudit(incidentId)
  };
}
```

## 7. Donor Reputation Management

Monitor and manage donor reputation scores:

```typescript
// services/donorManagement.ts
import { fraudDetectionService } from './fraudDetectionService';

export async function updateDonorReputation(donorId: string) {
  const profile = fraudDetectionService.getDonorRiskProfile(donorId);

  // Determine appropriate trust level
  let trustLevel = 'verified';
  if (profile.riskScore > 50) trustLevel = 'caution';
  if (profile.riskScore > 75) trustLevel = 'blocked';

  // Handle accordingly
  switch (trustLevel) {
    case 'verified':
      // Fast-track processing
      break;
    case 'caution':
      // Require verification
      break;
    case 'blocked':
      // Require manual approval
      fraudDetectionService.blacklistDonor(profile.donorName, 'High risk score');
      break;
  }

  return { donorId, trustLevel, profile };
}

export async function allowlistReputableDonor(donorName: string) {
  fraudDetectionService.whitelistDonor(donorName);
  // Send thank you email, offer expedited processing, etc.
}
```

## 8. Mobile Field App Integration

Simple integration for mobile field teams:

```typescript
// Mobile app - record expense via camera
async function captureExpensePhoto(photo: Blob, metadata: {
  amount: number;
  vendor: string;
  category: string;
  incidentId: string;
  stepId: string;
}) {
  // Upload receipt photo
  const receiptHash = await uploadReceipt(photo);

  // Record expense with receipt
  const expense = {
    incidentId: metadata.incidentId,
    stepId: metadata.stepId,
    vendor: metadata.vendor,
    amount: metadata.amount,
    description: metadata.category,
    receipt: {
      url: receiptHash,
      hash: receiptHash
    }
  };

  return recordFieldExpense(expense);
}
```

## Integration Checklist

- [ ] Add financial controls service imports to incident management
- [ ] Add budget creation when incidents are created
- [ ] Integrate fraud detection into donation processing
- [ ] Add financial tabs to IncidentDetail page
- [ ] Add budget status bar to incident header
- [ ] Create donor dashboard page
- [ ] Add donation monitoring to admin panel
- [ ] Set up automated alerts for critical budgets
- [ ] Create compliance reporting schedule
- [ ] Train staff on fraud alert review process

## Testing Financial Controls

```typescript
// Example test cases
describe('Financial Controls', () => {
  it('should detect suspicious donation timing', async () => {
    const donations = [
      // 5+ donations within 5 minutes
    ];
    const result = fraudDetectionService.analyzeMultipleDonations(
      'test-incident',
      donations
    );
    expect(result.some(r => r.riskScore > 50)).toBe(true);
  });

  it('should enforce budget caps', async () => {
    const plan = await financialControlsService.createBudgetPlan(
      'test-incident',
      1000,
      'USD',
      'medical'
    );
    
    // Try to allocate more than budget
    const allocate = () => financialControlsService.allocateToStep(
      'test-incident',
      'step-1',
      'testing',
      1500
    );
    
    expect(allocate).toThrow('Allocation exceeds remaining budget');
  });

  it('should calculate funds remaining correctly', async () => {
    const remaining = await financialControlsService.getFundsRemaining(
      'test-incident'
    );
    
    expect(remaining.remaining).toEqual(
      remaining.totalBudget - remaining.spent
    );
  });
});
```

## Performance Optimization

For large incidents with many donations:

```typescript
// Use batch processing for fraud analysis
async function batchAnalyzeDonations(incidentId: string, batchSize = 100) {
  const allDonations = await stepDonationsService.listAllDonations(incidentId);
  
  for (let i = 0; i < allDonations.length; i += batchSize) {
    const batch = allDonations.slice(i, i + batchSize);
    
    // Process batch in parallel
    await Promise.all(
      batch.map(donation =>
        fraudDetectionService.analyzeDonation(incidentId, donation, allDonations)
      )
    );
  }
}
```

## Support

For integration questions or issues:
- Check FINANCIAL_CONTROLS_GUIDE.md for API reference
- Review example components above
- Test with small donations first
- Monitor fraud alerts during initial rollout
