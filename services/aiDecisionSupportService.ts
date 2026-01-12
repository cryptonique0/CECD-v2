/**
 * AI Decision Support Service
 * 
 * Provides AI recommendations with transparency, confidence scores, and explainability.
 * Emphasizes human-in-the-loop decision making with AI as an augmentation tool, not automation.
 */

export interface AIRecommendation {
  id: string;
  timestamp: number;
  incidentId: string;
  recommendationType: 'dispatch' | 'escalation' | 'resource_allocation' | 'route_planning' | 'triage' | 'evacuation' | 'medical_priority';
  
  // The AI's suggestion
  suggestion: {
    primaryAction: string;
    details: Record<string, any>;
    alternativesConsidered: string[];
  };
  
  // Confidence scoring
  confidence: {
    score: number; // 0-100
    level: 'very_low' | 'low' | 'moderate' | 'high' | 'very_high';
    factors: {
      dataQuality: number; // 0-100
      modelCertainty: number; // 0-100
      historicalAccuracy: number; // 0-100
      contextCompleteness: number; // 0-100
    };
  };
  
  // Explainability
  explanation: {
    reasoning: string[];
    keyFactors: {
      factor: string;
      weight: number; // 0-100 (importance)
      value: string;
      impact: 'positive' | 'negative' | 'neutral';
    }[];
    dataSourcesUsed: string[];
    assumptions: string[];
    limitations: string[];
  };
  
  // Counterfactual analysis
  counterfactuals: Counterfactual[];
  
  // Human decision tracking
  humanDecision?: {
    acceptedAt: number;
    decidedBy: string;
    decidedByName: string;
    action: 'accepted' | 'modified' | 'rejected';
    modificationDetails?: Record<string, any>;
    reasonForDeviation?: string;
    outcomeNotes?: string;
  };
  
  // Outcome tracking for learning
  actualOutcome?: {
    recordedAt: number;
    success: boolean;
    metrics: Record<string, number>;
    aiAccuracyScore: number; // How well did AI predict actual outcome
    lessons: string[];
  };
}

export interface Counterfactual {
  id: string;
  scenario: string;
  changes: {
    parameter: string;
    originalValue: any;
    alternativeValue: any;
  }[];
  predictedOutcome: {
    description: string;
    metrics: {
      label: string;
      value: string;
      delta: string; // e.g., "+12 mins", "-8%", "+2 units"
      deltaType: 'increase' | 'decrease' | 'neutral';
    }[];
  };
  confidence: number; // 0-100
  reasoning: string;
}

export interface DecisionComparison {
  recommendationId: string;
  incidentId: string;
  aiSuggestion: string;
  humanDecision: string;
  differences: {
    aspect: string;
    aiValue: any;
    humanValue: any;
    impact: string;
  }[];
  timestamp: number;
}

interface AIDecisionSupportService {
  // Generate recommendations
  generateDispatchRecommendation(
    incidentId: string,
    availableSquads: any[],
    incidentDetails: any
  ): Promise<AIRecommendation>;
  
  generateEscalationRecommendation(
    incidentId: string,
    currentStatus: any,
    riskFactors: any[]
  ): Promise<AIRecommendation>;
  
  generateResourceAllocationRecommendation(
    incidentId: string,
    requiredResources: any[],
    availableInventory: any[]
  ): Promise<AIRecommendation>;
  
  // Counterfactual analysis
  generateCounterfactuals(
    recommendation: AIRecommendation,
    numberOfScenarios?: number
  ): Counterfactual[];
  
  // Human decision tracking
  recordHumanDecision(
    recommendationId: string,
    decidedBy: string,
    decidedByName: string,
    action: 'accepted' | 'modified' | 'rejected',
    details?: {
      modificationDetails?: Record<string, any>;
      reasonForDeviation?: string;
    }
  ): void;
  
  // Decision comparison
  compareAIvsHuman(recommendationId: string): DecisionComparison | null;
  
  // Explainability
  getDetailedExplanation(recommendationId: string): string;
  
  // Analytics
  getAccuracyMetrics(timeRangeMs?: number): {
    totalRecommendations: number;
    acceptanceRate: number;
    modificationRate: number;
    rejectionRate: number;
    averageConfidence: number;
    accuracyByType: Record<string, number>;
  };
  
  // Recommendation history
  getRecommendations(filters?: {
    incidentId?: string;
    type?: string;
    dateFrom?: number;
    dateTo?: number;
  }): AIRecommendation[];
}

class AIDecisionSupportServiceImpl implements AIDecisionSupportService {
  private recommendations: Map<string, AIRecommendation> = new Map();
  
  constructor() {
    this.seedMockRecommendations();
  }
  
  async generateDispatchRecommendation(
    incidentId: string,
    availableSquads: any[],
    incidentDetails: any
  ): Promise<AIRecommendation> {
    // Simulate AI processing delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const bestSquad = availableSquads[0];
    const alternatives = availableSquads.slice(1, 3);
    
    const recommendation: AIRecommendation = {
      id: `REC-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      incidentId,
      recommendationType: 'dispatch',
      
      suggestion: {
        primaryAction: `Dispatch ${bestSquad.name} to incident`,
        details: {
          squadId: bestSquad.id,
          squadName: bestSquad.name,
          estimatedETA: '8 minutes',
          matchScore: 94,
          skillsMatch: ['EMT', 'Firefighting', 'Rescue Operations'],
          proximity: '2.3 km'
        },
        alternativesConsidered: alternatives.map(s => s.name)
      },
      
      confidence: this.calculateConfidence({
        dataQuality: 92,
        modelCertainty: 87,
        historicalAccuracy: 89,
        contextCompleteness: 95
      }),
      
      explanation: {
        reasoning: [
          `${bestSquad.name} has the highest skill match (94%) for this incident type`,
          'Squad is currently available and closest to incident location (2.3 km)',
          'Historical data shows 89% success rate for similar dispatches',
          'Weather conditions are favorable for rapid deployment',
          'Traffic patterns indicate clear route to incident site'
        ],
        keyFactors: [
          {
            factor: 'Skill Match Score',
            weight: 35,
            value: '94%',
            impact: 'positive'
          },
          {
            factor: 'Proximity',
            weight: 25,
            value: '2.3 km',
            impact: 'positive'
          },
          {
            factor: 'Squad Availability',
            weight: 20,
            value: 'Immediately available',
            impact: 'positive'
          },
          {
            factor: 'Equipment Match',
            weight: 15,
            value: '100% equipped',
            impact: 'positive'
          },
          {
            factor: 'Historical Success',
            weight: 5,
            value: '89% success rate',
            impact: 'positive'
          }
        ],
        dataSourcesUsed: [
          'Squad roster and availability database',
          'GPS location tracking system',
          'Historical incident outcome database (last 12 months)',
          'Real-time traffic API',
          'Weather service API'
        ],
        assumptions: [
          'Squad members are at their reported locations',
          'Equipment status is up-to-date',
          'Traffic conditions remain stable',
          'No additional high-priority incidents will arise during transit'
        ],
        limitations: [
          'Cannot predict squad member fatigue levels without biometric data',
          'Limited visibility into individual skill proficiency beyond certifications',
          'Weather forecast accuracy decreases beyond 2-hour window'
        ]
      },
      
      counterfactuals: []
    };
    
    // Generate counterfactuals
    recommendation.counterfactuals = this.generateCounterfactuals(recommendation, 3);
    
    this.recommendations.set(recommendation.id, recommendation);
    return recommendation;
  }
  
  async generateEscalationRecommendation(
    incidentId: string,
    currentStatus: any,
    riskFactors: any[]
  ): Promise<AIRecommendation> {
    await new Promise(resolve => setTimeout(resolve, 600));
    
    const shouldEscalate = riskFactors.length >= 2;
    
    const recommendation: AIRecommendation = {
      id: `REC-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      incidentId,
      recommendationType: 'escalation',
      
      suggestion: {
        primaryAction: shouldEscalate 
          ? 'Escalate to Level 3 - Request additional resources' 
          : 'Maintain current response level',
        details: {
          currentLevel: currentStatus.level || 2,
          recommendedLevel: shouldEscalate ? 3 : currentStatus.level || 2,
          additionalResources: shouldEscalate ? ['Hazmat Team', 'Medical Support', 'Command Vehicle'] : [],
          riskScore: riskFactors.length * 15,
          urgency: shouldEscalate ? 'high' : 'moderate'
        },
        alternativesConsidered: [
          'Request mutual aid from neighboring jurisdictions',
          'Deploy specialized equipment without escalation',
          'Monitor situation for 15 minutes before deciding'
        ]
      },
      
      confidence: this.calculateConfidence({
        dataQuality: 88,
        modelCertainty: 82,
        historicalAccuracy: 85,
        contextCompleteness: 90
      }),
      
      explanation: {
        reasoning: shouldEscalate ? [
          `${riskFactors.length} critical risk factors identified`,
          'Incident complexity exceeds current resource capabilities',
          'Predictive model shows 78% probability of deterioration without escalation',
          'Similar incidents historically required escalation in 82% of cases',
          'Early escalation reduces average incident duration by 34%'
        ] : [
          'Current resources are adequate for incident complexity',
          'Risk factors are within manageable thresholds',
          'No indicators of immediate deterioration',
          'Premature escalation would tie up resources unnecessarily'
        ],
        keyFactors: [
          {
            factor: 'Number of Risk Factors',
            weight: 40,
            value: `${riskFactors.length} identified`,
            impact: shouldEscalate ? 'negative' : 'neutral'
          },
          {
            factor: 'Resource Adequacy',
            weight: 30,
            value: shouldEscalate ? 'Insufficient' : 'Adequate',
            impact: shouldEscalate ? 'negative' : 'positive'
          },
          {
            factor: 'Deterioration Probability',
            weight: 20,
            value: shouldEscalate ? '78%' : '32%',
            impact: shouldEscalate ? 'negative' : 'positive'
          },
          {
            factor: 'Historical Pattern Match',
            weight: 10,
            value: shouldEscalate ? '82% required escalation' : '76% resolved at current level',
            impact: shouldEscalate ? 'negative' : 'positive'
          }
        ],
        dataSourcesUsed: [
          'Real-time incident telemetry',
          'Risk assessment matrix',
          'Historical escalation database',
          'Resource allocation tracker',
          'Predictive deterioration model'
        ],
        assumptions: [
          'Risk factors are accurately identified and weighted',
          'Additional resources can arrive within expected timeframes',
          'Current on-scene assessment is complete and accurate'
        ],
        limitations: [
          'Model trained on regional data, may not capture all local variations',
          'Cannot predict sudden external factors (e.g., secondary incidents)',
          'Escalation decision depends on availability of higher-tier resources'
        ]
      },
      
      counterfactuals: []
    };
    
    recommendation.counterfactuals = this.generateCounterfactuals(recommendation, 2);
    
    this.recommendations.set(recommendation.id, recommendation);
    return recommendation;
  }
  
  async generateResourceAllocationRecommendation(
    incidentId: string,
    requiredResources: any[],
    availableInventory: any[]
  ): Promise<AIRecommendation> {
    await new Promise(resolve => setTimeout(resolve, 700));
    
    const allocation = requiredResources.slice(0, 3);
    
    const recommendation: AIRecommendation = {
      id: `REC-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      incidentId,
      recommendationType: 'resource_allocation',
      
      suggestion: {
        primaryAction: 'Allocate optimized resource package',
        details: {
          allocations: allocation.map((r, i) => ({
            resource: r.name,
            quantity: r.needed,
            source: availableInventory[i]?.location || 'Central Depot',
            estimatedDelivery: `${10 + i * 5} minutes`
          })),
          totalCost: '$2,450',
          priorityScore: 87
        },
        alternativesConsidered: [
          'Request resources from mutual aid partners',
          'Deploy backup resources from secondary depot',
          'Staged delivery to reduce initial response time'
        ]
      },
      
      confidence: this.calculateConfidence({
        dataQuality: 95,
        modelCertainty: 90,
        historicalAccuracy: 88,
        contextCompleteness: 92
      }),
      
      explanation: {
        reasoning: [
          'Allocation optimizes for fastest delivery while maintaining inventory reserves',
          'Selected sources minimize total transport distance by 32%',
          'Package composition based on 94% historical success rate for similar incidents',
          'Maintains 20% reserve capacity for concurrent incidents',
          'Cost-effective allocation within budget constraints'
        ],
        keyFactors: [
          {
            factor: 'Delivery Speed',
            weight: 35,
            value: 'Average 15 mins',
            impact: 'positive'
          },
          {
            factor: 'Inventory Availability',
            weight: 30,
            value: '100% in stock',
            impact: 'positive'
          },
          {
            factor: 'Cost Efficiency',
            weight: 20,
            value: '18% below budget',
            impact: 'positive'
          },
          {
            factor: 'Reserve Maintenance',
            weight: 15,
            value: '20% buffer maintained',
            impact: 'positive'
          }
        ],
        dataSourcesUsed: [
          'Real-time inventory management system',
          'Transport logistics optimizer',
          'Historical resource effectiveness database',
          'Cost accounting system',
          'Geographic information system (GIS)'
        ],
        assumptions: [
          'Inventory data is current and accurate',
          'Transport vehicles are available and operational',
          'No traffic disruptions en route',
          'Resources are properly maintained and functional'
        ],
        limitations: [
          'Cannot account for last-minute inventory discrepancies',
          'Delivery estimates assume normal traffic conditions',
          'Does not factor in potential equipment failures'
        ]
      },
      
      counterfactuals: []
    };
    
    recommendation.counterfactuals = this.generateCounterfactuals(recommendation, 3);
    
    this.recommendations.set(recommendation.id, recommendation);
    return recommendation;
  }
  
  generateCounterfactuals(
    recommendation: AIRecommendation,
    numberOfScenarios: number = 3
  ): Counterfactual[] {
    const counterfactuals: Counterfactual[] = [];
    
    if (recommendation.recommendationType === 'dispatch') {
      const details = recommendation.suggestion.details;
      
      // Scenario 1: Alternative squad
      if (recommendation.suggestion.alternativesConsidered.length > 0) {
        counterfactuals.push({
          id: `CF-${Date.now()}-1`,
          scenario: `Deploy ${recommendation.suggestion.alternativesConsidered[0]} instead`,
          changes: [
            {
              parameter: 'Squad',
              originalValue: details.squadName,
              alternativeValue: recommendation.suggestion.alternativesConsidered[0]
            }
          ],
          predictedOutcome: {
            description: 'Alternative squad with different skill composition and location',
            metrics: [
              {
                label: 'Estimated ETA',
                value: '20 minutes',
                delta: '+12 mins',
                deltaType: 'increase'
              },
              {
                label: 'Skill Match',
                value: '86%',
                delta: '-8%',
                deltaType: 'decrease'
              },
              {
                label: 'Success Probability',
                value: '81%',
                delta: '-8%',
                deltaType: 'decrease'
              }
            ]
          },
          confidence: 82,
          reasoning: 'Second-best squad has lower skill match and greater distance, increasing response time and slightly reducing success probability.'
        });
      }
      
      // Scenario 2: Wait for optimal squad
      counterfactuals.push({
        id: `CF-${Date.now()}-2`,
        scenario: 'Wait 15 minutes for higher-rated squad to become available',
        changes: [
          {
            parameter: 'Response Strategy',
            originalValue: 'Immediate dispatch',
            alternativeValue: 'Delayed dispatch (optimal squad)'
          }
        ],
        predictedOutcome: {
          description: 'Delay deployment to wait for best-equipped squad',
          metrics: [
            {
              label: 'Total Response Time',
              value: '23 minutes',
              delta: '+15 mins',
              deltaType: 'increase'
            },
            {
              label: 'Skill Match',
              value: '98%',
              delta: '+4%',
              deltaType: 'increase'
            },
            {
              label: 'Risk of Escalation',
              value: '35%',
              delta: '+12%',
              deltaType: 'increase'
            }
          ]
        },
        confidence: 74,
        reasoning: 'Waiting increases skill match but delays critical response, raising escalation risk during delay period.'
      });
      
      // Scenario 3: Multi-squad deployment
      counterfactuals.push({
        id: `CF-${Date.now()}-3`,
        scenario: 'Deploy two squads simultaneously for redundancy',
        changes: [
          {
            parameter: 'Number of Squads',
            originalValue: 1,
            alternativeValue: 2
          }
        ],
        predictedOutcome: {
          description: 'Faster response with backup capabilities but higher resource consumption',
          metrics: [
            {
              label: 'Response Time',
              value: '6 minutes',
              delta: '-2 mins',
              deltaType: 'decrease'
            },
            {
              label: 'Resource Cost',
              value: '$4,200',
              delta: '+$2,100',
              deltaType: 'increase'
            },
            {
              label: 'Success Probability',
              value: '96%',
              delta: '+2%',
              deltaType: 'increase'
            }
          ]
        },
        confidence: 79,
        reasoning: 'Redundant deployment improves outcomes but doubles resource consumption. May not be justified for current incident severity.'
      });
    } else if (recommendation.recommendationType === 'escalation') {
      counterfactuals.push({
        id: `CF-${Date.now()}-1`,
        scenario: 'Do not escalate - maintain current response level',
        changes: [
          {
            parameter: 'Response Level',
            originalValue: recommendation.suggestion.details.recommendedLevel,
            alternativeValue: recommendation.suggestion.details.currentLevel
          }
        ],
        predictedOutcome: {
          description: 'Continue with existing resources without requesting additional support',
          metrics: [
            {
              label: 'Resolution Time',
              value: '85 minutes',
              delta: '+32 mins',
              deltaType: 'increase'
            },
            {
              label: 'Risk Score',
              value: '68',
              delta: '+23 points',
              deltaType: 'increase'
            },
            {
              label: 'Resource Cost',
              value: '$3,200',
              delta: '-$1,800',
              deltaType: 'decrease'
            }
          ]
        },
        confidence: 77,
        reasoning: 'Not escalating saves immediate resources but increases incident duration and risk of complications.'
      });
      
      counterfactuals.push({
        id: `CF-${Date.now()}-2`,
        scenario: 'Request mutual aid instead of internal escalation',
        changes: [
          {
            parameter: 'Resource Source',
            originalValue: 'Internal escalation',
            alternativeValue: 'Mutual aid partners'
          }
        ],
        predictedOutcome: {
          description: 'Leverage neighboring jurisdiction resources',
          metrics: [
            {
              label: 'Response Time',
              value: '28 minutes',
              delta: '+15 mins',
              deltaType: 'increase'
            },
            {
              label: 'Internal Cost',
              value: '$800',
              delta: '-$4,200',
              deltaType: 'decrease'
            },
            {
              label: 'Coordination Complexity',
              value: 'High',
              delta: '+40%',
              deltaType: 'increase'
            }
          ]
        },
        confidence: 68,
        reasoning: 'Mutual aid reduces internal resource strain but adds coordination overhead and delays response.'
      });
    } else if (recommendation.recommendationType === 'resource_allocation') {
      counterfactuals.push({
        id: `CF-${Date.now()}-1`,
        scenario: 'Source all resources from single closest depot',
        changes: [
          {
            parameter: 'Source Strategy',
            originalValue: 'Optimized multi-source',
            alternativeValue: 'Single depot (closest)'
          }
        ],
        predictedOutcome: {
          description: 'Simplify logistics by using one source',
          metrics: [
            {
              label: 'Delivery Time',
              value: '22 minutes',
              delta: '+7 mins',
              deltaType: 'increase'
            },
            {
              label: 'Coordination Effort',
              value: 'Low',
              delta: '-40%',
              deltaType: 'decrease'
            },
            {
              label: 'Some Items Unavailable',
              value: '2 items',
              delta: '+2 items',
              deltaType: 'increase'
            }
          ]
        },
        confidence: 85,
        reasoning: 'Single-source delivery is simpler but slower and may have stock limitations.'
      });
      
      counterfactuals.push({
        id: `CF-${Date.now()}-2`,
        scenario: 'Use premium/expedited delivery for critical items',
        changes: [
          {
            parameter: 'Delivery Method',
            originalValue: 'Standard transport',
            alternativeValue: 'Expedited (helicopter/priority)'
          }
        ],
        predictedOutcome: {
          description: 'Fast-track most critical resources',
          metrics: [
            {
              label: 'Critical Item Delivery',
              value: '5 minutes',
              delta: '-10 mins',
              deltaType: 'decrease'
            },
            {
              label: 'Total Cost',
              value: '$5,900',
              delta: '+$3,450',
              deltaType: 'increase'
            },
            {
              label: 'Incident Impact',
              value: 'Moderate improvement',
              delta: '+12%',
              deltaType: 'increase'
            }
          ]
        },
        confidence: 71,
        reasoning: 'Expedited delivery significantly reduces time for critical items but at substantial cost increase.'
      });
    }
    
    return counterfactuals.slice(0, numberOfScenarios);
  }
  
  recordHumanDecision(
    recommendationId: string,
    decidedBy: string,
    decidedByName: string,
    action: 'accepted' | 'modified' | 'rejected',
    details?: {
      modificationDetails?: Record<string, any>;
      reasonForDeviation?: string;
    }
  ): void {
    const recommendation = this.recommendations.get(recommendationId);
    if (!recommendation) return;
    
    recommendation.humanDecision = {
      acceptedAt: Date.now(),
      decidedBy,
      decidedByName,
      action,
      modificationDetails: details?.modificationDetails,
      reasonForDeviation: details?.reasonForDeviation
    };
    
    this.recommendations.set(recommendationId, recommendation);
  }
  
  compareAIvsHuman(recommendationId: string): DecisionComparison | null {
    const recommendation = this.recommendations.get(recommendationId);
    if (!recommendation || !recommendation.humanDecision) return null;
    
    const differences: DecisionComparison['differences'] = [];
    
    if (recommendation.humanDecision.action === 'modified' && recommendation.humanDecision.modificationDetails) {
      Object.keys(recommendation.humanDecision.modificationDetails).forEach(key => {
        const aiValue = (recommendation.suggestion.details as any)[key];
        const humanValue = recommendation.humanDecision!.modificationDetails![key];
        
        if (aiValue !== humanValue) {
          differences.push({
            aspect: key,
            aiValue,
            humanValue,
            impact: 'Modified by human decision-maker based on situational awareness'
          });
        }
      });
    }
    
    return {
      recommendationId,
      incidentId: recommendation.incidentId,
      aiSuggestion: recommendation.suggestion.primaryAction,
      humanDecision: recommendation.humanDecision.action === 'accepted' 
        ? recommendation.suggestion.primaryAction 
        : (recommendation.humanDecision.reasonForDeviation || 'Alternative action taken'),
      differences,
      timestamp: recommendation.humanDecision.acceptedAt
    };
  }
  
  getDetailedExplanation(recommendationId: string): string {
    const rec = this.recommendations.get(recommendationId);
    if (!rec) return 'Recommendation not found';
    
    let explanation = `## AI Recommendation Explanation\n\n`;
    explanation += `**Recommendation Type:** ${rec.recommendationType}\n`;
    explanation += `**Confidence Level:** ${rec.confidence.level.toUpperCase()} (${rec.confidence.score}%)\n\n`;
    
    explanation += `### Primary Recommendation\n${rec.suggestion.primaryAction}\n\n`;
    
    explanation += `### Reasoning\n`;
    rec.explanation.reasoning.forEach((reason, i) => {
      explanation += `${i + 1}. ${reason}\n`;
    });
    
    explanation += `\n### Key Decision Factors (by importance)\n`;
    rec.explanation.keyFactors
      .sort((a, b) => b.weight - a.weight)
      .forEach(factor => {
        const icon = factor.impact === 'positive' ? '✓' : factor.impact === 'negative' ? '⚠' : '•';
        explanation += `${icon} **${factor.factor}** (${factor.weight}% weight): ${factor.value}\n`;
      });
    
    explanation += `\n### Data Sources\n`;
    rec.explanation.dataSourcesUsed.forEach(source => {
      explanation += `- ${source}\n`;
    });
    
    explanation += `\n### Assumptions\n`;
    rec.explanation.assumptions.forEach(assumption => {
      explanation += `- ${assumption}\n`;
    });
    
    explanation += `\n### Limitations\n`;
    rec.explanation.limitations.forEach(limitation => {
      explanation += `⚠ ${limitation}\n`;
    });
    
    return explanation;
  }
  
  getAccuracyMetrics(timeRangeMs: number = 30 * 24 * 60 * 60 * 1000): {
    totalRecommendations: number;
    acceptanceRate: number;
    modificationRate: number;
    rejectionRate: number;
    averageConfidence: number;
    accuracyByType: Record<string, number>;
  } {
    const cutoff = Date.now() - timeRangeMs;
    const recentRecs = Array.from(this.recommendations.values()).filter(r => r.timestamp >= cutoff);
    
    const withDecisions = recentRecs.filter(r => r.humanDecision);
    const accepted = withDecisions.filter(r => r.humanDecision?.action === 'accepted').length;
    const modified = withDecisions.filter(r => r.humanDecision?.action === 'modified').length;
    const rejected = withDecisions.filter(r => r.humanDecision?.action === 'rejected').length;
    
    const total = withDecisions.length || 1;
    
    return {
      totalRecommendations: recentRecs.length,
      acceptanceRate: (accepted / total) * 100,
      modificationRate: (modified / total) * 100,
      rejectionRate: (rejected / total) * 100,
      averageConfidence: recentRecs.reduce((sum, r) => sum + r.confidence.score, 0) / (recentRecs.length || 1),
      accuracyByType: {
        dispatch: 87.5,
        escalation: 82.3,
        resource_allocation: 91.2,
        overall: 86.8
      }
    };
  }
  
  getRecommendations(filters?: {
    incidentId?: string;
    type?: string;
    dateFrom?: number;
    dateTo?: number;
  }): AIRecommendation[] {
    let recommendations = Array.from(this.recommendations.values());
    
    if (filters?.incidentId) {
      recommendations = recommendations.filter(r => r.incidentId === filters.incidentId);
    }
    
    if (filters?.type) {
      recommendations = recommendations.filter(r => r.recommendationType === filters.type);
    }
    
    if (filters?.dateFrom) {
      recommendations = recommendations.filter(r => r.timestamp >= filters.dateFrom!);
    }
    
    if (filters?.dateTo) {
      recommendations = recommendations.filter(r => r.timestamp <= filters.dateTo!);
    }
    
    return recommendations.sort((a, b) => b.timestamp - a.timestamp);
  }
  
  private calculateConfidence(factors: {
    dataQuality: number;
    modelCertainty: number;
    historicalAccuracy: number;
    contextCompleteness: number;
  }): AIRecommendation['confidence'] {
    const score = Math.round(
      (factors.dataQuality * 0.25) +
      (factors.modelCertainty * 0.35) +
      (factors.historicalAccuracy * 0.25) +
      (factors.contextCompleteness * 0.15)
    );
    
    let level: AIRecommendation['confidence']['level'];
    if (score >= 90) level = 'very_high';
    else if (score >= 75) level = 'high';
    else if (score >= 60) level = 'moderate';
    else if (score >= 40) level = 'low';
    else level = 'very_low';
    
    return {
      score,
      level,
      factors
    };
  }
  
  private seedMockRecommendations(): void {
    // Seed with some historical recommendations for demo
    const mockRec1: AIRecommendation = {
      id: 'REC-SEED-001',
      timestamp: Date.now() - 3600000,
      incidentId: 'INC-001',
      recommendationType: 'dispatch',
      suggestion: {
        primaryAction: 'Dispatch Medical Squad Alpha',
        details: { squadId: 'SQ-001', estimatedETA: '6 mins' },
        alternativesConsidered: ['Medical Squad Beta', 'Fire Squad Delta']
      },
      confidence: {
        score: 91,
        level: 'very_high',
        factors: { dataQuality: 95, modelCertainty: 89, historicalAccuracy: 92, contextCompleteness: 88 }
      },
      explanation: {
        reasoning: ['Closest squad with appropriate medical capabilities'],
        keyFactors: [
          { factor: 'Proximity', weight: 40, value: '1.2 km', impact: 'positive' }
        ],
        dataSourcesUsed: ['GPS tracking'],
        assumptions: ['Squad available'],
        limitations: ['Traffic conditions may vary']
      },
      counterfactuals: [],
      humanDecision: {
        acceptedAt: Date.now() - 3500000,
        decidedBy: 'user-dispatch-1',
        decidedByName: 'Sarah Martinez',
        action: 'accepted'
      },
      actualOutcome: {
        recordedAt: Date.now() - 2400000,
        success: true,
        metrics: { responseTime: 7, patientsSaved: 2 },
        aiAccuracyScore: 94,
        lessons: ['ETA prediction was highly accurate']
      }
    };
    
    this.recommendations.set(mockRec1.id, mockRec1);
  }
}

export const aiDecisionSupportService = new AIDecisionSupportServiceImpl();
