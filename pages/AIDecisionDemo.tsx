import React, { useState, useEffect } from 'react';
import AIDecisionPanel from '../components/AIDecisionPanel';
import { aiDecisionSupportService } from '../services/aiDecisionSupportService';

/**
 * AIDecisionDemo Page
 * 
 * Demonstrates advanced AI decision support capabilities:
 * - Confidence scoring
 * - Explainability panels
 * - Counterfactual analysis
 * - AI vs Human decision comparison
 * 
 * Emphasizes human-in-the-loop decision making.
 */
const AIDecisionDemo: React.FC = () => {
  const [demoIncidentId] = useState('INC-DEMO-001');
  const [currentUser] = useState({ id: 'user-demo', name: 'Demo User' });
  const [showingRecommendation, setShowingRecommendation] = useState(false);
  const [metrics, setMetrics] = useState<any>(null);

  useEffect(() => {
    loadMetrics();
  }, []);

  const loadMetrics = () => {
    const m = aiDecisionSupportService.getAccuracyMetrics();
    setMetrics(m);
  };

  const generateSampleRecommendation = async (type: 'dispatch' | 'escalation' | 'resource_allocation') => {
    setShowingRecommendation(true);
    
    if (type === 'dispatch') {
      await aiDecisionSupportService.generateDispatchRecommendation(
        demoIncidentId,
        [
          { id: 'sq-1', name: 'Medical Squad Alpha', skills: ['EMT', 'Paramedic'], location: '2.3 km' },
          { id: 'sq-2', name: 'Medical Squad Beta', skills: ['EMT'], location: '4.1 km' },
          { id: 'sq-3', name: 'Fire Squad Delta', skills: ['Firefighting', 'EMT'], location: '3.2 km' }
        ],
        { severity: 'high', category: 'Medical', requiresEMT: true }
      );
    } else if (type === 'escalation') {
      await aiDecisionSupportService.generateEscalationRecommendation(
        demoIncidentId,
        { level: 2, duration: 45 },
        ['complexity_increasing', 'resource_shortage', 'weather_deteriorating']
      );
    } else if (type === 'resource_allocation') {
      await aiDecisionSupportService.generateResourceAllocationRecommendation(
        demoIncidentId,
        [
          { name: 'First Aid Kits', needed: 10 },
          { name: 'Fire Extinguishers', needed: 5 },
          { name: 'Emergency Blankets', needed: 20 }
        ],
        [
          { item: 'First Aid Kits', available: 50, location: 'Central Depot' },
          { item: 'Fire Extinguishers', available: 15, location: 'Station 3' }
        ]
      );
    }
    
    loadMetrics();
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>
            <span className="material-symbols-outlined" style={{ fontSize: 36, marginRight: 12 }}>
              psychology_alt
            </span>
            Advanced AI Decision Support
          </h1>
          <p style={styles.subtitle}>
            AI augments human expertise, never replaces it. Full transparency and explainability built in.
          </p>
        </div>
      </div>

      {/* Key Features */}
      <div style={styles.featuresSection}>
        <h2 style={styles.sectionTitle}>Key Features</h2>
        <div style={styles.featuresGrid}>
          <div style={styles.featureCard}>
            <div style={styles.featureIcon} className="bg-blue">
              <span className="material-symbols-outlined">verified</span>
            </div>
            <h3 style={styles.featureTitle}>Confidence Scores</h3>
            <p style={styles.featureDescription}>
              Every AI recommendation includes a detailed confidence score (0-100%) with breakdown by:
              data quality, model certainty, historical accuracy, and context completeness.
            </p>
          </div>

          <div style={styles.featureCard}>
            <div style={styles.featureIcon} className="bg-green">
              <span className="material-symbols-outlined">lightbulb</span>
            </div>
            <h3 style={styles.featureTitle}>Explainability</h3>
            <p style={styles.featureDescription}>
              Understand <strong>why</strong> the AI suggested a specific action. See key factors, data sources,
              assumptions, and limitations in plain language.
            </p>
          </div>

          <div style={styles.featureCard}>
            <div style={styles.featureIcon} className="bg-orange">
              <span className="material-symbols-outlined">alt_route</span>
            </div>
            <h3 style={styles.featureTitle}>Counterfactual Analysis</h3>
            <p style={styles.featureDescription}>
              "What if Squad 1 was deployed instead?" See predicted outcomes for alternative scenarios
              with metrics like ETA changes, risk deltas, and cost impacts.
            </p>
          </div>

          <div style={styles.featureCard}>
            <div style={styles.featureIcon} className="bg-purple">
              <span className="material-symbols-outlined">compare</span>
            </div>
            <h3 style={styles.featureTitle}>AI vs Human Comparison</h3>
            <p style={styles.featureDescription}>
              Track when humans accept, modify, or reject AI suggestions. Build institutional knowledge
              about when AI excels and when human judgment is critical.
            </p>
          </div>
        </div>
      </div>

      {/* Demo Actions */}
      <div style={styles.demoSection}>
        <h2 style={styles.sectionTitle}>Try a Demo Recommendation</h2>
        <p style={styles.demoSubtitle}>
          Generate a sample AI recommendation to see confidence scores, explainability, and counterfactuals in action.
        </p>
        
        <div style={styles.demoButtons}>
          <button
            onClick={() => generateSampleRecommendation('dispatch')}
            style={{ ...styles.demoButton, ...styles.demoButtonBlue }}
          >
            <span className="material-symbols-outlined">local_shipping</span>
            <div>
              <div style={styles.demoButtonTitle}>Dispatch Recommendation</div>
              <div style={styles.demoButtonDesc}>Which squad to send?</div>
            </div>
          </button>

          <button
            onClick={() => generateSampleRecommendation('escalation')}
            style={{ ...styles.demoButton, ...styles.demoButtonOrange }}
          >
            <span className="material-symbols-outlined">trending_up</span>
            <div>
              <div style={styles.demoButtonTitle}>Escalation Decision</div>
              <div style={styles.demoButtonDesc}>Should we escalate?</div>
            </div>
          </button>

          <button
            onClick={() => generateSampleRecommendation('resource_allocation')}
            style={{ ...styles.demoButton, ...styles.demoButtonGreen }}
          >
            <span className="material-symbols-outlined">inventory_2</span>
            <div>
              <div style={styles.demoButtonTitle}>Resource Allocation</div>
              <div style={styles.demoButtonDesc}>Optimize resource deployment</div>
            </div>
          </button>
        </div>
      </div>

      {/* AI Decision Panel */}
      {showingRecommendation && (
        <div style={{ marginTop: 32 }}>
          <AIDecisionPanel
            incidentId={demoIncidentId}
            currentUser={currentUser}
            onDecisionMade={(recId, action) => {
              console.log('Decision made:', recId, action);
              loadMetrics();
            }}
          />
        </div>
      )}

      {/* Performance Metrics */}
      {metrics && (
        <div style={styles.metricsSection}>
          <h2 style={styles.sectionTitle}>AI Performance Metrics</h2>
          <div style={styles.metricsGrid}>
            <div style={styles.metricCard}>
              <div style={styles.metricValue}>{metrics.totalRecommendations}</div>
              <div style={styles.metricLabel}>Total Recommendations</div>
            </div>
            
            <div style={styles.metricCard}>
              <div style={styles.metricValue}>{metrics.acceptanceRate.toFixed(1)}%</div>
              <div style={styles.metricLabel}>Acceptance Rate</div>
              <div style={styles.metricBar}>
                <div style={{ ...styles.metricBarFill, width: `${metrics.acceptanceRate}%`, background: '#10b981' }} />
              </div>
            </div>
            
            <div style={styles.metricCard}>
              <div style={styles.metricValue}>{metrics.modificationRate.toFixed(1)}%</div>
              <div style={styles.metricLabel}>Modification Rate</div>
              <div style={styles.metricBar}>
                <div style={{ ...styles.metricBarFill, width: `${metrics.modificationRate}%`, background: '#3b82f6' }} />
              </div>
            </div>
            
            <div style={styles.metricCard}>
              <div style={styles.metricValue}>{metrics.rejectionRate.toFixed(1)}%</div>
              <div style={styles.metricLabel}>Rejection Rate</div>
              <div style={styles.metricBar}>
                <div style={{ ...styles.metricBarFill, width: `${metrics.rejectionRate}%`, background: '#6b7280' }} />
              </div>
            </div>
            
            <div style={styles.metricCard}>
              <div style={styles.metricValue}>{metrics.averageConfidence.toFixed(1)}%</div>
              <div style={styles.metricLabel}>Average Confidence</div>
            </div>
          </div>

          <div style={styles.accuracyByType}>
            <h3 style={styles.accuracyTitle}>Accuracy by Recommendation Type</h3>
            {Object.entries(metrics.accuracyByType).map(([type, accuracy]: [string, any]) => (
              <div key={type} style={styles.accuracyRow}>
                <span style={styles.accuracyType}>{type.replace('_', ' ')}</span>
                <div style={styles.accuracyBar}>
                  <div style={{ ...styles.accuracyBarFill, width: `${accuracy}%` }} />
                </div>
                <span style={styles.accuracyPercent}>{accuracy}%</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Philosophy */}
      <div style={styles.philosophySection}>
        <h2 style={styles.sectionTitle}>Design Philosophy</h2>
        <div style={styles.philosophyGrid}>
          <div style={styles.philosophyCard}>
            <span className="material-symbols-outlined" style={{ fontSize: 32, color: '#3b82f6' }}>
              person_check
            </span>
            <h3 style={styles.philosophyTitle}>Human Authority</h3>
            <p style={styles.philosophyText}>
              AI provides suggestions, humans make decisions. Every recommendation can be accepted,
              modified, or rejected based on ground truth and situational awareness.
            </p>
          </div>

          <div style={styles.philosophyCard}>
            <span className="material-symbols-outlined" style={{ fontSize: 32, color: '#10b981' }}>
              visibility
            </span>
            <h3 style={styles.philosophyTitle}>Full Transparency</h3>
            <p style={styles.philosophyText}>
              No black boxes. Every AI decision shows its reasoning, data sources, assumptions,
              and limitations. You know exactly how the AI reached its conclusion.
            </p>
          </div>

          <div style={styles.philosophyCard}>
            <span className="material-symbols-outlined" style={{ fontSize: 32, color: '#f59e0b' }}>
              school
            </span>
            <h3 style={styles.philosophyTitle}>Continuous Learning</h3>
            <p style={styles.philosophyText}>
              Track AI vs human decisions to identify patterns. Learn when AI recommendations
              are most valuable and when human expertise trumps algorithms.
            </p>
          </div>
        </div>
      </div>

      {/* Global styles for icon backgrounds */}
      <style>{`
        .bg-blue {
          background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
        }
        .bg-green {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
        }
        .bg-orange {
          background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
        }
        .bg-purple {
          background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
        }
      `}</style>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    padding: '32px 24px',
    maxWidth: 1400,
    margin: '0 auto',
    color: '#fff'
  },
  header: {
    marginBottom: 48
  },
  title: {
    fontSize: 32,
    fontWeight: 800,
    margin: 0,
    display: 'flex',
    alignItems: 'center',
    color: '#fff'
  },
  subtitle: {
    fontSize: 16,
    color: '#9ca3af',
    marginTop: 12,
    maxWidth: 800
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 700,
    marginBottom: 24,
    color: '#fff'
  },
  featuresSection: {
    marginBottom: 48
  },
  featuresGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: 24
  },
  featureCard: {
    background: '#1f2937',
    borderRadius: 16,
    padding: 24,
    border: '1px solid #374151'
  },
  featureIcon: {
    width: 56,
    height: 56,
    borderRadius: 12,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    color: '#fff',
    fontSize: 28
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: 700,
    marginBottom: 12,
    color: '#fff'
  },
  featureDescription: {
    fontSize: 14,
    color: '#d1d5db',
    lineHeight: 1.6
  },
  demoSection: {
    marginBottom: 48,
    padding: 32,
    background: 'linear-gradient(135deg, #1f2937 0%, #111827 100%)',
    borderRadius: 16,
    border: '2px solid #3b82f6'
  },
  demoSubtitle: {
    fontSize: 14,
    color: '#9ca3af',
    marginBottom: 24
  },
  demoButtons: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: 16
  },
  demoButton: {
    display: 'flex',
    alignItems: 'center',
    gap: 16,
    padding: 20,
    borderRadius: 12,
    border: 'none',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    fontSize: 16,
    color: '#fff',
    textAlign: 'left'
  },
  demoButtonBlue: {
    background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)'
  },
  demoButtonOrange: {
    background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
  },
  demoButtonGreen: {
    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
  },
  demoButtonTitle: {
    fontSize: 16,
    fontWeight: 700,
    marginBottom: 4
  },
  demoButtonDesc: {
    fontSize: 13,
    opacity: 0.9
  },
  metricsSection: {
    marginBottom: 48,
    padding: 32,
    background: '#1f2937',
    borderRadius: 16,
    border: '1px solid #374151'
  },
  metricsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: 20,
    marginBottom: 32
  },
  metricCard: {
    background: '#111827',
    borderRadius: 12,
    padding: 20,
    textAlign: 'center'
  },
  metricValue: {
    fontSize: 32,
    fontWeight: 800,
    color: '#3b82f6',
    marginBottom: 8
  },
  metricLabel: {
    fontSize: 13,
    color: '#9ca3af',
    textTransform: 'uppercase',
    letterSpacing: 0.5
  },
  metricBar: {
    marginTop: 12,
    height: 6,
    background: '#374151',
    borderRadius: 3,
    overflow: 'hidden'
  },
  metricBarFill: {
    height: '100%',
    transition: 'width 0.3s ease'
  },
  accuracyByType: {
    background: '#111827',
    borderRadius: 12,
    padding: 20
  },
  accuracyTitle: {
    fontSize: 16,
    fontWeight: 700,
    marginBottom: 16,
    color: '#fff'
  },
  accuracyRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12
  },
  accuracyType: {
    fontSize: 14,
    color: '#d1d5db',
    width: 180,
    textTransform: 'capitalize'
  },
  accuracyBar: {
    flex: 1,
    height: 8,
    background: '#374151',
    borderRadius: 4,
    overflow: 'hidden'
  },
  accuracyBarFill: {
    height: '100%',
    background: 'linear-gradient(90deg, #3b82f6 0%, #2563eb 100%)',
    transition: 'width 0.3s ease'
  },
  accuracyPercent: {
    fontSize: 14,
    fontWeight: 700,
    color: '#3b82f6',
    width: 50,
    textAlign: 'right'
  },
  philosophySection: {
    marginBottom: 48
  },
  philosophyGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: 24
  },
  philosophyCard: {
    background: '#1f2937',
    borderRadius: 16,
    padding: 32,
    textAlign: 'center',
    border: '1px solid #374151'
  },
  philosophyTitle: {
    fontSize: 20,
    fontWeight: 700,
    margin: '16px 0 12px 0',
    color: '#fff'
  },
  philosophyText: {
    fontSize: 14,
    color: '#d1d5db',
    lineHeight: 1.6
  }
};

export default AIDecisionDemo;
