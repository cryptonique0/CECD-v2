/**
 * Financial Controls Service
 * Manages budget caps per incident, allocates funds, tracks spending
 * Provides real-time funds remaining vs needs analysis
 */

import { Incident } from '../types';

export interface BudgetAllocation {
  id: string;
  incidentId: string;
  incidentTitle: string;
  budgetCap: number; // Total allowed spend in USD
  currency: 'USD' | 'ETH' | 'USDC';
  allocated: number; // Already committed/spent
  remaining: number; // budgetCap - allocated
  estimatedNeeds: number; // Total estimated cost of all steps
  surplus: number; // If allocated < needs, this is negative
  allocations: Array<{
    stepId: string;
    stepTitle: string;
    allocated: number;
    spent: number;
    estimate: number;
    status: 'pending' | 'in_progress' | 'complete';
  }>;
  createdAt: number;
  updatedAt: number;
}

export interface BudgetException {
  id: string;
  incidentId: string;
  stepId: string;
  reason: 'budget_exceeded' | 'over_estimate' | 'emergency_need';
  amountOver: number;
  severity: 'low' | 'medium' | 'high';
  resolved: boolean;
  createdAt: number;
  resolvedAt?: number;
  notes?: string;
}

export interface FundAllocation {
  id: string;
  donationId: string;
  incidentId: string;
  stepId: string;
  amount: number;
  allocatedAt: number;
  executedAt?: number;
  status: 'allocated' | 'executed' | 'refunded';
}

class FinancialControlsService {
  private budgets: Map<string, BudgetAllocation> = new Map();
  private exceptions: Map<string, BudgetException[]> = new Map();
  private fundAllocations: Map<string, FundAllocation[]> = new Map();
  private exchangeRates = {
    'ETH': 2200, // ETH to USD
    'USDC': 1.0  // USDC to USD
  };

  /**
   * Create budget cap for incident
   */
  createBudgetCap(
    incidentId: string,
    incidentTitle: string,
    budgetCapUSD: number,
    steps: Array<{ stepId: string; title: string; estimate: number }>
  ): BudgetAllocation {
    const estimatedNeeds = steps.reduce((sum, s) => sum + s.estimate, 0);

    const budget: BudgetAllocation = {
      id: `budget-${incidentId}`,
      incidentId,
      incidentTitle,
      budgetCap: budgetCapUSD,
      currency: 'USD',
      allocated: 0,
      remaining: budgetCapUSD,
      estimatedNeeds,
      surplus: budgetCapUSD - estimatedNeeds,
      allocations: steps.map(s => ({
        stepId: s.stepId,
        stepTitle: s.title,
        allocated: 0,
        spent: 0,
        estimate: s.estimate,
        status: 'pending'
      })),
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    this.budgets.set(incidentId, budget);
    return budget;
  }

  /**
   * Get budget for incident
   */
  getBudget(incidentId: string): BudgetAllocation | null {
    return this.budgets.get(incidentId) || null;
  }

  /**
   * Allocate funds to a step
   */
  allocateToStep(
    incidentId: string,
    stepId: string,
    amount: number,
    donationId: string
  ): { success: boolean; message: string; exception?: BudgetException } {
    const budget = this.budgets.get(incidentId);
    if (!budget) {
      return { success: false, message: 'No budget found for incident' };
    }

    const stepAlloc = budget.allocations.find(a => a.stepId === stepId);
    if (!stepAlloc) {
      return { success: false, message: 'Step not found in budget' };
    }

    const newAllocated = budget.allocated + amount;
    const newRemaining = budget.budgetCap - newAllocated;

    // Check if exceeds budget
    if (newRemaining < 0) {
      const exception = this.createBudgetException(
        incidentId,
        stepId,
        'budget_exceeded',
        Math.abs(newRemaining),
        'high',
        `Allocation of $${amount} exceeds remaining budget of $${budget.remaining}`
      );

      return {
        success: false,
        message: `Budget exceeded by $${Math.abs(newRemaining)}`,
        exception
      };
    }

    // Check if step estimate exceeded by >20%
    if (stepAlloc.allocated + amount > stepAlloc.estimate * 1.2) {
      const overAmount = (stepAlloc.allocated + amount) - stepAlloc.estimate;
      this.createBudgetException(
        incidentId,
        stepId,
        'over_estimate',
        overAmount,
        'medium',
        `Step spending exceeds estimate by $${overAmount.toFixed(2)}`
      );
    }

    // Update allocation
    budget.allocated = newAllocated;
    budget.remaining = newRemaining;
    budget.surplus = newRemaining - (budget.estimatedNeeds - stepAlloc.estimate);
    stepAlloc.allocated += amount;
    budget.updatedAt = Date.now();

    // Record fund allocation
    const allocation: FundAllocation = {
      id: `alloc-${Date.now()}`,
      donationId,
      incidentId,
      stepId,
      amount,
      allocatedAt: Date.now(),
      status: 'allocated'
    };

    if (!this.fundAllocations.has(incidentId)) {
      this.fundAllocations.set(incidentId, []);
    }
    this.fundAllocations.get(incidentId)!.push(allocation);

    return { success: true, message: `Allocated $${amount} to step ${stepId}` };
  }

  /**
   * Mark funds as spent/executed
   */
  executeFunds(incidentId: string, stepId: string, amount: number): boolean {
    const budget = this.budgets.get(incidentId);
    if (!budget) return false;

    const stepAlloc = budget.allocations.find(a => a.stepId === stepId);
    if (!stepAlloc) return false;

    stepAlloc.spent += amount;
    stepAlloc.allocated -= amount;

    // Update step status
    if (stepAlloc.spent >= stepAlloc.estimate) {
      stepAlloc.status = 'complete';
    } else if (stepAlloc.spent > 0) {
      stepAlloc.status = 'in_progress';
    }

    budget.updatedAt = Date.now();
    return true;
  }

  /**
   * Get real-time financial summary
   */
  getFinancialSummary(incidentId: string): {
    budgetCap: number;
    allocated: number;
    spent: number;
    remaining: number;
    estimatedNeeds: number;
    fundingPercentage: number;
    statusColor: 'green' | 'yellow' | 'red';
    status: string;
  } | null {
    const budget = this.budgets.get(incidentId);
    if (!budget) return null;

    const allocated = budget.allocations.reduce((sum, a) => sum + a.allocated, 0);
    const spent = budget.allocations.reduce((sum, a) => sum + a.spent, 0);
    const remaining = budget.budgetCap - spent;
    const fundingPercentage = (allocated / budget.estimatedNeeds) * 100;

    // Determine status
    let statusColor: 'green' | 'yellow' | 'red' = 'green';
    let status = '';

    if (remaining < 0) {
      statusColor = 'red';
      status = `Over budget by $${Math.abs(remaining).toFixed(2)}`;
    } else if (fundingPercentage < 50) {
      statusColor = 'red';
      status = `Only ${fundingPercentage.toFixed(0)}% funded`;
    } else if (fundingPercentage < 80) {
      statusColor = 'yellow';
      status = `${fundingPercentage.toFixed(0)}% funded`;
    } else if (fundingPercentage >= 100) {
      statusColor = 'green';
      status = `Fully funded (${fundingPercentage.toFixed(0)}%)`;
    } else {
      statusColor = 'green';
      status = `${fundingPercentage.toFixed(0)}% funded`;
    }

    return {
      budgetCap: budget.budgetCap,
      allocated,
      spent,
      remaining,
      estimatedNeeds: budget.estimatedNeeds,
      fundingPercentage,
      statusColor,
      status
    };
  }

  /**
   * Get funding by step
   */
  getFundingByStep(incidentId: string): Array<{
    stepId: string;
    stepTitle: string;
    estimate: number;
    allocated: number;
    spent: number;
    remaining: number;
    fundingPercentage: number;
  }> {
    const budget = this.budgets.get(incidentId);
    if (!budget) return [];

    return budget.allocations.map(step => ({
      stepId: step.stepId,
      stepTitle: step.stepTitle,
      estimate: step.estimate,
      allocated: step.allocated,
      spent: step.spent,
      remaining: step.estimate - step.spent,
      fundingPercentage: (step.spent / step.estimate) * 100
    }));
  }

  /**
   * Get fund allocations for incident
   */
  getFundAllocations(incidentId: string): FundAllocation[] {
    return this.fundAllocations.get(incidentId) || [];
  }

  /**
   * Create budget exception
   */
  private createBudgetException(
    incidentId: string,
    stepId: string,
    reason: 'budget_exceeded' | 'over_estimate' | 'emergency_need',
    amountOver: number,
    severity: 'low' | 'medium' | 'high',
    notes?: string
  ): BudgetException {
    const exception: BudgetException = {
      id: `exc-${Date.now()}`,
      incidentId,
      stepId,
      reason,
      amountOver,
      severity,
      resolved: false,
      createdAt: Date.now(),
      notes
    };

    if (!this.exceptions.has(incidentId)) {
      this.exceptions.set(incidentId, []);
    }
    this.exceptions.get(incidentId)!.push(exception);

    return exception;
  }

  /**
   * Get budget exceptions
   */
  getBudgetExceptions(incidentId: string): BudgetException[] {
    return (this.exceptions.get(incidentId) || []).filter(e => !e.resolved);
  }

  /**
   * Resolve exception
   */
  resolveException(incidentId: string, exceptionId: string, notes?: string): boolean {
    const exceptions = this.exceptions.get(incidentId);
    if (!exceptions) return false;

    const exc = exceptions.find(e => e.id === exceptionId);
    if (!exc) return false;

    exc.resolved = true;
    exc.resolvedAt = Date.now();
    if (notes) exc.notes = notes;

    return true;
  }

  /**
   * Get budget utilization trends
   */
  getBudgetTrends(incidentId: string): Array<{
    timestamp: number;
    allocated: number;
    spent: number;
    remaining: number;
  }> {
    const budget = this.budgets.get(incidentId);
    if (!budget) return [];

    // Simplified - in production, would store historical snapshots
    return [
      {
        timestamp: budget.createdAt,
        allocated: 0,
        spent: 0,
        remaining: budget.budgetCap
      },
      {
        timestamp: budget.updatedAt,
        allocated: budget.allocated,
        spent: budget.allocations.reduce((sum, a) => sum + a.spent, 0),
        remaining: budget.remaining
      }
    ];
  }

  /**
   * Get all active budgets
   */
  getAllBudgets(): BudgetAllocation[] {
    return Array.from(this.budgets.values());
  }

  /**
   * Convert amount to USD
   */
  convertToUSD(amount: number, currency: 'USD' | 'ETH' | 'USDC'): number {
    if (currency === 'USD') return amount;
    const rate = this.exchangeRates[currency] || 1;
    return amount * rate;
  }

  /**
   * Get budget health check
   */
  getHealthCheck(incidentId: string): {
    isHealthy: boolean;
    riskLevel: 'low' | 'medium' | 'high';
    alerts: string[];
    recommendations: string[];
  } {
    const budget = this.budgets.get(incidentId);
    if (!budget) {
      return {
        isHealthy: false,
        riskLevel: 'high',
        alerts: ['No budget found'],
        recommendations: ['Create a budget cap for this incident']
      };
    }

    const summary = this.getFinancialSummary(incidentId);
    const exceptions = this.getBudgetExceptions(incidentId);
    const alerts: string[] = [];
    const recommendations: string[] = [];
    let riskLevel: 'low' | 'medium' | 'high' = 'low';

    if (!summary) {
      return {
        isHealthy: false,
        riskLevel: 'high',
        alerts: ['Cannot calculate financial summary'],
        recommendations: ['Check budget configuration']
      };
    }

    // Check remaining budget
    if (summary.remaining < 0) {
      alerts.push(`Over budget by $${Math.abs(summary.remaining).toFixed(2)}`);
      riskLevel = 'high';
      recommendations.push('Request additional funding or reduce scope');
    } else if (summary.remaining < budget.estimatedNeeds * 0.1) {
      alerts.push(`Low remaining budget ($${summary.remaining.toFixed(2)})`);
      riskLevel = 'medium';
      recommendations.push('Monitor spending closely');
    }

    // Check funding percentage
    if (summary.fundingPercentage < 50) {
      alerts.push(`Only ${summary.fundingPercentage.toFixed(0)}% of needs funded`);
      riskLevel = 'high';
      recommendations.push('Accelerate fundraising efforts');
    }

    // Check exceptions
    if (exceptions.length > 0) {
      alerts.push(`${exceptions.length} budget exception(s)`);
      if (exceptions.some(e => e.severity === 'high')) {
        riskLevel = 'high';
      } else if (exceptions.some(e => e.severity === 'medium')) {
        riskLevel = riskLevel === 'high' ? 'high' : 'medium';
      }
      recommendations.push('Review and resolve budget exceptions');
    }

    // Check step completion
    const incompleteSteps = budget.allocations.filter(s => s.status !== 'complete');
    if (incompleteSteps.length > 0) {
      const underAllocated = incompleteSteps.filter(s => s.allocated === 0);
      if (underAllocated.length > 0) {
        alerts.push(`${underAllocated.length} step(s) with no funding`);
      }
    }

    return {
      isHealthy: riskLevel === 'low' && alerts.length === 0,
      riskLevel,
      alerts,
      recommendations
    };
  }
}

export const financialControlsService = new FinancialControlsService();
