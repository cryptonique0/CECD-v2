import React, { useState, useEffect } from 'react';
import { aiDecisionSupportService, AIRecommendation, Counterfactual } from '../services/aiDecisionSupportService';

interface AIDecisionPanelProps {
  incidentId: string;
  currentUser: { id: string; name: string };
  onDecisionMade?: (recommendationId: string, action: 'accepted' | 'modified' | 'rejected') => void;
}

/**
 * AIDecisionPanel
 * 
 * Displays AI recommendations with full transparency:
 * - Confidence scores
 * - Explainability (why the AI suggested this)
 * - Counterfactual analysis (what-if scenarios)
 * - AI vs Human decision comparison
 * 
 * Emphasizes human decision-making authority with AI as support tool.
 */
const AIDecisionPanel: React.FC<AIDecisionPanelProps> = ({
  incidentId,
  currentUser,
  onDecisionMade
}) => {
  const [recommendations, setRecommendations] = useState<AIRecommendation[]>([]);
  const [selectedRec, setSelectedRec] = useState<AIRecommendation | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [showCounterfactuals, setShowCounterfactuals] = useState(false);
  const [showComparison, setShowComparison] = useState(false);
  const [decisionNotes, setDecisionNotes] = useState('');

  useEffect(() => {
    loadRecommendations();
  }, [incidentId]);

  const loadRecommendations = () => {
    const recs = aiDecisionSupportService.getRecommendations({ incidentId });
    setRecommendations(recs);
    if (recs.length > 0 && !selectedRec) {
      setSelectedRec(recs[0]);
    }
  };

  const handleDecision = (action: 'accepted' | 'modified' | 'rejected') => {
    if (!selectedRec) return;

    aiDecisionSupportService.recordHumanDecision(
      selectedRec.id,
      currentUser.id,
      currentUser.name,
      action,
      action === 'rejected' ? { reasonForDeviation: decisionNotes } : undefined
    );

    onDecisionMade?.(selectedRec.id, action);
    loadRecommendations();
    setDecisionNotes('');
  };

  const getConfidenceBadgeStyle = (level: string): React.CSSProperties => {
    const styles: Record<string, React.CSSProperties> = {
      very_high: { background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: '#fff' },
      high: { background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', color: '#fff' },
      moderate: { background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', color: '#fff' },
      low: { background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)', color: '#fff' },
      very_low: { background: 'linear-gradient(135deg, #7f1d1d 0%, #991b1b 100%)', color: '#fff' }
    };
    return styles[level] || styles.moderate;
  };

  const getImpactIcon = (impact: string) => {
    if (impact === 'positive') return '✓';
    if (impact === 'negative') return '⚠';
    return '•';
  };

  const getDeltaStyle = (deltaType: string): React.CSSProperties => {
    if (deltaType === 'increase') return { color: '#ef4444', fontWeight: 600 };
    if (deltaType === 'decrease') return { color: '#10b981', fontWeight: 600 };
    return { color: '#6b7280', fontWeight: 600 };
  };

  if (!selectedRec) {
    return (
      <div style={styles.emptyState}>
        <span className="material-symbols-outlined" style={{ fontSize: 48, opacity: 0.3 }}>
          psychology_alt
        </span>
        <p style={{ marginTop: 16, opacity: 0.6 }}>No AI recommendations available for this incident</p>
      </div>
    );
  }

  const comparison = selectedRec.humanDecision 
    ? aiDecisionSupportService.compareAIvsHuman(selectedRec.id)
    : null;

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <span className="material-symbols-outlined" style={{ fontSize: 28, color: '#3b82f6' }}>
            psychology_alt
          </span>
          <div>
            <h3 style={styles.title}>AI Decision Support</h3>
            <p style={styles.subtitle}>AI assists, you decide</p>
          </div>
        </div>
        <div style={styles.confidenceBadge}>
          <div style={{ ...styles.badge, ...getConfidenceBadgeStyle(selectedRec.confidence.level) }}>
            {selectedRec.confidence.score}% Confidence
          </div>
          <span style={{ fontSize: 11, color: '#9ca3af', marginTop: 4 }}>
            {selectedRec.confidence.level.replace('_', ' ').toUpperCase()}
          </span>
        </div>
      </div>

      {/* AI Recommendation Card */}
      <div style={styles.recommendationCard}>
        <div style={styles.recommendationHeader}>
          <span style={styles.recommendationType}>
            {selectedRec.recommendationType.replace('_', ' ').toUpperCase()}
          </span>
          <span style={styles.timestamp}>
            {new Date(selectedRec.timestamp).toLocaleString()}
          </span>
        </div>
        
        <div style={styles.primaryAction}>
          <span className="material-symbols-outlined" style={{ color: '#3b82f6', fontSize: 20 }}>
            lightbulb
          </span>
          <span style={{ fontSize: 16, fontWeight: 600 }}>{selectedRec.suggestion.primaryAction}</span>
        </div>

        {/* Quick Details */}
        <div style={styles.detailsGrid}>
          {Object.entries(selectedRec.suggestion.details).slice(0, 4).map(([key, value]) => (
            <div key={key} style={styles.detailItem}>
              <span style={styles.detailLabel}>{key.replace(/([A-Z])/g, ' $1').trim()}</span>
              <span style={styles.detailValue}>{String(value)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Confidence Breakdown */}
      <div style={styles.section}>
        <h4 style={styles.sectionTitle}>
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>analytics</span>
          Confidence Breakdown
        </h4>
        <div style={styles.confidenceGrid}>
          {Object.entries(selectedRec.confidence.factors).map(([factor, score]) => (
            <div key={factor} style={styles.confidenceItem}>
              <div style={styles.confidenceItemHeader}>
                <span style={styles.confidenceLabel}>
                  {factor.replace(/([A-Z])/g, ' $1').trim()}
                </span>
                <span style={styles.confidenceScore}>{score}%</span>
              </div>
              <div style={styles.progressBar}>
                <div style={{ ...styles.progressFill, width: `${score}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Explainability Toggle */}
      <div style={styles.section}>
        <button
          onClick={() => setShowExplanation(!showExplanation)}
          style={styles.toggleButton}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
            {showExplanation ? 'expand_less' : 'expand_more'}
          </span>
          <span style={{ fontWeight: 600 }}>Why did AI suggest this?</span>
          <span style={styles.toggleBadge}>Explainability</span>
        </button>

        {showExplanation && (
          <div style={styles.explanationPanel}>
            {/* Reasoning */}
            <div style={{ marginBottom: 20 }}>
              <h5 style={styles.explanationSubtitle}>Key Reasoning</h5>
              <ul style={styles.reasoningList}>
                {selectedRec.explanation.reasoning.map((reason, i) => (
                  <li key={i} style={styles.reasoningItem}>{reason}</li>
                ))}
              </ul>
            </div>

            {/* Decision Factors */}
            <div style={{ marginBottom: 20 }}>
              <h5 style={styles.explanationSubtitle}>Decision Factors (by importance)</h5>
              {selectedRec.explanation.keyFactors
                .sort((a, b) => b.weight - a.weight)
                .map((factor, i) => (
                  <div key={i} style={styles.factorCard}>
                    <div style={styles.factorHeader}>
                      <div style={styles.factorLeft}>
                        <span style={{ fontSize: 16, marginRight: 8 }}>
                          {getImpactIcon(factor.impact)}
                        </span>
                        <span style={{ fontWeight: 600 }}>{factor.factor}</span>
                      </div>
                      <div style={styles.factorRight}>
                        <span style={styles.factorValue}>{factor.value}</span>
                        <span style={styles.factorWeight}>{factor.weight}% weight</span>
                      </div>
                    </div>
                    <div style={styles.progressBar}>
                      <div style={{ ...styles.progressFill, width: `${factor.weight}%`, background: '#3b82f6' }} />
                    </div>
                  </div>
                ))}
            </div>

            {/* Data Sources */}
            <div style={{ marginBottom: 20 }}>
              <h5 style={styles.explanationSubtitle}>Data Sources Used</h5>
              <div style={styles.tagContainer}>
                {selectedRec.explanation.dataSourcesUsed.map((source, i) => (
                  <span key={i} style={styles.dataSourceTag}>{source}</span>
                ))}
              </div>
            </div>

            {/* Assumptions & Limitations */}
            <div style={styles.warningsGrid}>
              <div>
                <h5 style={styles.explanationSubtitle}>Assumptions</h5>
                <ul style={styles.assumptionList}>
                  {selectedRec.explanation.assumptions.map((assumption, i) => (
                    <li key={i} style={styles.assumptionItem}>{assumption}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h5 style={styles.explanationSubtitle}>Limitations</h5>
                <ul style={styles.limitationList}>
                  {selectedRec.explanation.limitations.map((limitation, i) => (
                    <li key={i} style={styles.limitationItem}>⚠ {limitation}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Counterfactual Analysis */}
      {selectedRec.counterfactuals.length > 0 && (
        <div style={styles.section}>
          <button
            onClick={() => setShowCounterfactuals(!showCounterfactuals)}
            style={styles.toggleButton}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
              {showCounterfactuals ? 'expand_less' : 'expand_more'}
            </span>
            <span style={{ fontWeight: 600 }}>What if we chose differently?</span>
            <span style={styles.toggleBadge}>Counterfactuals</span>
          </button>

          {showCounterfactuals && (
            <div style={styles.counterfactualPanel}>
              <p style={styles.counterfactualIntro}>
                Here's how alternative decisions might have played out:
              </p>
              {selectedRec.counterfactuals.map((cf, i) => (
                <div key={cf.id} style={styles.counterfactualCard}>
                  <div style={styles.counterfactualHeader}>
                    <span style={styles.counterfactualTitle}>Scenario {i + 1}: {cf.scenario}</span>
                    <span style={styles.counterfactualConfidence}>{cf.confidence}% confidence</span>
                  </div>

                  {/* Changes */}
                  <div style={styles.changesSection}>
                    {cf.changes.map((change, j) => (
                      <div key={j} style={styles.changeItem}>
                        <span style={styles.changeLabel}>{change.parameter}:</span>
                        <span style={styles.changeFrom}>{String(change.originalValue)}</span>
                        <span className="material-symbols-outlined" style={{ fontSize: 14, color: '#9ca3af' }}>
                          arrow_forward
                        </span>
                        <span style={styles.changeTo}>{String(change.alternativeValue)}</span>
                      </div>
                    ))}
                  </div>

                  {/* Predicted Outcomes */}
                  <div style={styles.outcomesSection}>
                    <h6 style={styles.outcomeTitle}>Predicted Impact:</h6>
                    <div style={styles.metricsGrid}>
                      {cf.predictedOutcome.metrics.map((metric, j) => (
                        <div key={j} style={styles.metricCard}>
                          <span style={styles.metricLabel}>{metric.label}</span>
                          <div style={styles.metricValues}>
                            <span style={styles.metricValue}>{metric.value}</span>
                            <span style={getDeltaStyle(metric.deltaType)}>{metric.delta}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                    <p style={styles.counterfactualReasoning}>{cf.reasoning}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* AI vs Human Decision Comparison */}
      {comparison && (
        <div style={styles.section}>
          <button
            onClick={() => setShowComparison(!showComparison)}
            style={styles.toggleButton}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
              {showComparison ? 'expand_less' : 'expand_more'}
            </span>
            <span style={{ fontWeight: 600 }}>AI vs Human Decision</span>
            <span style={{ ...styles.toggleBadge, background: '#10b981' }}>
              {selectedRec.humanDecision?.action.toUpperCase()}
            </span>
          </button>

          {showComparison && (
            <div style={styles.comparisonPanel}>
              <div style={styles.comparisonGrid}>
                <div style={styles.comparisonColumn}>
                  <div style={styles.comparisonHeader}>
                    <span className="material-symbols-outlined" style={{ color: '#3b82f6' }}>
                      psychology_alt
                    </span>
                    <span style={styles.comparisonLabel}>AI Suggestion</span>
                  </div>
                  <p style={styles.comparisonText}>{comparison.aiSuggestion}</p>
                </div>

                <div style={styles.comparisonDivider}>
                  <span className="material-symbols-outlined" style={{ color: '#9ca3af', fontSize: 24 }}>
                    compare_arrows
                  </span>
                </div>

                <div style={styles.comparisonColumn}>
                  <div style={styles.comparisonHeader}>
                    <span className="material-symbols-outlined" style={{ color: '#10b981' }}>
                      person
                    </span>
                    <span style={styles.comparisonLabel}>Human Decision</span>
                  </div>
                  <p style={styles.comparisonText}>{comparison.humanDecision}</p>
                  <div style={styles.decisionMeta}>
                    <span>By: {selectedRec.humanDecision?.decidedByName}</span>
                    <span>{new Date(comparison.timestamp).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {comparison.differences.length > 0 && (
                <div style={styles.differencesSection}>
                  <h6 style={styles.differencesTitle}>Key Differences:</h6>
                  {comparison.differences.map((diff, i) => (
                    <div key={i} style={styles.differenceItem}>
                      <span style={styles.differenceAspect}>{diff.aspect}:</span>
                      <div style={styles.differenceValues}>
                        <span>AI: <strong>{String(diff.aiValue)}</strong></span>
                        <span>→</span>
                        <span>Human: <strong>{String(diff.humanValue)}</strong></span>
                      </div>
                      <p style={styles.differenceImpact}>{diff.impact}</p>
                    </div>
                  ))}
                </div>
              )}

              {selectedRec.humanDecision?.reasonForDeviation && (
                <div style={styles.deviationReason}>
                  <strong>Reason for deviation:</strong>
                  <p>{selectedRec.humanDecision.reasonForDeviation}</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Decision Actions (if not already decided) */}
      {!selectedRec.humanDecision && (
        <div style={styles.actionSection}>
          <h4 style={styles.actionTitle}>Your Decision</h4>
          <p style={styles.actionSubtitle}>
            This is a recommendation. You have full authority to accept, modify, or reject it.
          </p>
          
          <textarea
            placeholder="Optional: Add notes about your decision..."
            value={decisionNotes}
            onChange={(e) => setDecisionNotes(e.target.value)}
            style={styles.notesInput}
          />

          <div style={styles.actionButtons}>
            <button
              onClick={() => handleDecision('accepted')}
              style={{ ...styles.actionButton, ...styles.acceptButton }}
            >
              <span className="material-symbols-outlined">check_circle</span>
              Accept AI Recommendation
            </button>
            <button
              onClick={() => handleDecision('modified')}
              style={{ ...styles.actionButton, ...styles.modifyButton }}
            >
              <span className="material-symbols-outlined">edit</span>
              Modify & Proceed
            </button>
            <button
              onClick={() => handleDecision('rejected')}
              style={{ ...styles.actionButton, ...styles.rejectButton }}
            >
              <span className="material-symbols-outlined">cancel</span>
              Reject & Use Alternative
            </button>
          </div>
        </div>
      )}

      {/* Decision Already Made */}
      {selectedRec.humanDecision && (
        <div style={styles.decisionMadePanel}>
          <span className="material-symbols-outlined" style={{ fontSize: 32, color: '#10b981' }}>
            task_alt
          </span>
          <div>
            <h4 style={styles.decisionMadeTitle}>Decision Recorded</h4>
            <p style={styles.decisionMadeText}>
              {selectedRec.humanDecision.decidedByName} {selectedRec.humanDecision.action} this recommendation
              on {new Date(selectedRec.humanDecision.acceptedAt).toLocaleString()}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    background: '#1f2937',
    borderRadius: 16,
    padding: 24,
    color: '#fff',
    maxWidth: 1000,
    margin: '0 auto'
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 60,
    color: '#9ca3af'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
    paddingBottom: 16,
    borderBottom: '1px solid #374151'
  },
  headerLeft: {
    display: 'flex',
    gap: 12,
    alignItems: 'center'
  },
  title: {
    fontSize: 20,
    fontWeight: 700,
    margin: 0,
    color: '#fff'
  },
  subtitle: {
    fontSize: 13,
    color: '#9ca3af',
    margin: '4px 0 0 0'
  },
  confidenceBadge: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end'
  },
  badge: {
    padding: '8px 16px',
    borderRadius: 20,
    fontSize: 14,
    fontWeight: 700
  },
  recommendationCard: {
    background: 'linear-gradient(135deg, #374151 0%, #1f2937 100%)',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    border: '1px solid #4b5563'
  },
  recommendationHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: 16
  },
  recommendationType: {
    fontSize: 11,
    fontWeight: 700,
    color: '#3b82f6',
    letterSpacing: 1.2
  },
  timestamp: {
    fontSize: 11,
    color: '#9ca3af'
  },
  primaryAction: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
    padding: 16,
    background: '#111827',
    borderRadius: 8,
    border: '1px solid #3b82f6'
  },
  detailsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: 12
  },
  detailItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4
  },
  detailLabel: {
    fontSize: 11,
    color: '#9ca3af',
    textTransform: 'uppercase',
    letterSpacing: 0.5
  },
  detailValue: {
    fontSize: 14,
    fontWeight: 600,
    color: '#fff'
  },
  section: {
    marginBottom: 20
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 700,
    marginBottom: 12,
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    color: '#e5e7eb'
  },
  confidenceGrid: {
    display: 'grid',
    gap: 12
  },
  confidenceItem: {
    background: '#374151',
    borderRadius: 8,
    padding: 12
  },
  confidenceItemHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: 8
  },
  confidenceLabel: {
    fontSize: 12,
    color: '#d1d5db',
    textTransform: 'capitalize'
  },
  confidenceScore: {
    fontSize: 12,
    fontWeight: 700,
    color: '#3b82f6'
  },
  progressBar: {
    height: 6,
    background: '#1f2937',
    borderRadius: 3,
    overflow: 'hidden'
  },
  progressFill: {
    height: '100%',
    background: 'linear-gradient(90deg, #3b82f6 0%, #2563eb 100%)',
    transition: 'width 0.3s ease'
  },
  toggleButton: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    background: '#374151',
    border: '1px solid #4b5563',
    borderRadius: 10,
    color: '#fff',
    cursor: 'pointer',
    fontSize: 14,
    transition: 'all 0.2s ease'
  },
  toggleBadge: {
    marginLeft: 'auto',
    padding: '4px 12px',
    background: '#3b82f6',
    borderRadius: 12,
    fontSize: 11,
    fontWeight: 600
  },
  explanationPanel: {
    marginTop: 16,
    padding: 20,
    background: '#111827',
    borderRadius: 10,
    border: '1px solid #374151'
  },
  explanationSubtitle: {
    fontSize: 13,
    fontWeight: 700,
    marginBottom: 12,
    color: '#e5e7eb'
  },
  reasoningList: {
    listStyle: 'none',
    padding: 0,
    margin: 0
  },
  reasoningItem: {
    padding: '10px 0',
    paddingLeft: 24,
    position: 'relative',
    fontSize: 13,
    color: '#d1d5db',
    borderLeft: '2px solid #3b82f6',
    marginBottom: 8
  },
  factorCard: {
    background: '#1f2937',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10
  },
  factorHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  factorLeft: {
    display: 'flex',
    alignItems: 'center'
  },
  factorRight: {
    display: 'flex',
    alignItems: 'center',
    gap: 12
  },
  factorValue: {
    fontSize: 14,
    fontWeight: 600,
    color: '#3b82f6'
  },
  factorWeight: {
    fontSize: 11,
    color: '#9ca3af'
  },
  tagContainer: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 8
  },
  dataSourceTag: {
    padding: '6px 12px',
    background: '#374151',
    borderRadius: 6,
    fontSize: 11,
    color: '#d1d5db',
    border: '1px solid #4b5563'
  },
  warningsGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 20
  },
  assumptionList: {
    listStyle: 'none',
    padding: 0,
    margin: 0
  },
  assumptionItem: {
    padding: '8px 0',
    fontSize: 12,
    color: '#9ca3af',
    paddingLeft: 16,
    position: 'relative'
  },
  limitationList: {
    listStyle: 'none',
    padding: 0,
    margin: 0
  },
  limitationItem: {
    padding: '8px 0',
    fontSize: 12,
    color: '#f59e0b',
    paddingLeft: 4
  },
  counterfactualPanel: {
    marginTop: 16,
    padding: 20,
    background: '#111827',
    borderRadius: 10,
    border: '1px solid #374151'
  },
  counterfactualIntro: {
    fontSize: 13,
    color: '#9ca3af',
    marginBottom: 16
  },
  counterfactualCard: {
    background: '#1f2937',
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
    border: '1px solid #4b5563'
  },
  counterfactualHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottom: '1px solid #374151'
  },
  counterfactualTitle: {
    fontSize: 14,
    fontWeight: 600,
    color: '#fff'
  },
  counterfactualConfidence: {
    fontSize: 12,
    color: '#9ca3af'
  },
  changesSection: {
    marginBottom: 16
  },
  changeItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '8px 0',
    fontSize: 13
  },
  changeLabel: {
    color: '#9ca3af',
    fontWeight: 600
  },
  changeFrom: {
    color: '#ef4444',
    textDecoration: 'line-through'
  },
  changeTo: {
    color: '#10b981',
    fontWeight: 600
  },
  outcomesSection: {
    background: '#111827',
    borderRadius: 8,
    padding: 12
  },
  outcomeTitle: {
    fontSize: 12,
    fontWeight: 700,
    color: '#e5e7eb',
    marginBottom: 12
  },
  metricsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
    gap: 10,
    marginBottom: 12
  },
  metricCard: {
    background: '#1f2937',
    borderRadius: 6,
    padding: 10
  },
  metricLabel: {
    fontSize: 11,
    color: '#9ca3af',
    display: 'block',
    marginBottom: 6
  },
  metricValues: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4
  },
  metricValue: {
    fontSize: 14,
    fontWeight: 600,
    color: '#fff'
  },
  counterfactualReasoning: {
    fontSize: 12,
    color: '#9ca3af',
    fontStyle: 'italic',
    marginTop: 8
  },
  comparisonPanel: {
    marginTop: 16,
    padding: 20,
    background: '#111827',
    borderRadius: 10,
    border: '1px solid #374151'
  },
  comparisonGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr auto 1fr',
    gap: 20,
    marginBottom: 20
  },
  comparisonColumn: {
    background: '#1f2937',
    borderRadius: 10,
    padding: 16
  },
  comparisonHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12
  },
  comparisonLabel: {
    fontSize: 13,
    fontWeight: 700,
    color: '#e5e7eb'
  },
  comparisonText: {
    fontSize: 14,
    color: '#d1d5db',
    lineHeight: 1.6
  },
  comparisonDivider: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  decisionMeta: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    marginTop: 12,
    fontSize: 11,
    color: '#9ca3af'
  },
  differencesSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTop: '1px solid #374151'
  },
  differencesTitle: {
    fontSize: 13,
    fontWeight: 700,
    marginBottom: 12,
    color: '#e5e7eb'
  },
  differenceItem: {
    background: '#1f2937',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10
  },
  differenceAspect: {
    fontSize: 12,
    fontWeight: 700,
    color: '#3b82f6',
    display: 'block',
    marginBottom: 8
  },
  differenceValues: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    fontSize: 13,
    color: '#d1d5db',
    marginBottom: 6
  },
  differenceImpact: {
    fontSize: 12,
    color: '#9ca3af',
    fontStyle: 'italic',
    marginTop: 6
  },
  deviationReason: {
    marginTop: 16,
    padding: 12,
    background: '#374151',
    borderRadius: 8,
    fontSize: 13,
    color: '#d1d5db'
  },
  actionSection: {
    marginTop: 24,
    padding: 20,
    background: 'linear-gradient(135deg, #1f2937 0%, #111827 100%)',
    borderRadius: 12,
    border: '2px solid #3b82f6'
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: 700,
    marginBottom: 8,
    color: '#fff'
  },
  actionSubtitle: {
    fontSize: 13,
    color: '#9ca3af',
    marginBottom: 16
  },
  notesInput: {
    width: '100%',
    minHeight: 80,
    padding: 12,
    background: '#374151',
    border: '1px solid #4b5563',
    borderRadius: 8,
    color: '#fff',
    fontSize: 13,
    fontFamily: 'inherit',
    resize: 'vertical',
    marginBottom: 16
  },
  actionButtons: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: 12
  },
  actionButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: '12px 16px',
    borderRadius: 8,
    border: 'none',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  },
  acceptButton: {
    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    color: '#fff'
  },
  modifyButton: {
    background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
    color: '#fff'
  },
  rejectButton: {
    background: 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)',
    color: '#fff'
  },
  decisionMadePanel: {
    display: 'flex',
    alignItems: 'center',
    gap: 16,
    padding: 20,
    background: '#065f46',
    borderRadius: 12,
    marginTop: 24
  },
  decisionMadeTitle: {
    fontSize: 16,
    fontWeight: 700,
    margin: 0,
    color: '#fff'
  },
  decisionMadeText: {
    fontSize: 13,
    color: '#d1fae5',
    margin: '4px 0 0 0'
  }
};

export default AIDecisionPanel;
