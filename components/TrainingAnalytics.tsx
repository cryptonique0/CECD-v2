/**
 * Training Analytics Dashboard
 * Advanced analytics for training program effectiveness
 */

import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Minus, Award, Clock, Target, Users, AlertTriangle } from 'lucide-react';
import { trainingService } from '../services/trainingService';

export const TrainingAnalytics: React.FC = () => {
  const [timeframe, setTimeframe] = useState<'week' | 'month' | 'quarter' | 'year'>('month');
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [organizationStats, setOrganizationStats] = useState<any>(null);

  useEffect(() => {
    loadAnalytics();
  }, [timeframe]);

  const loadAnalytics = () => {
    // Load leaderboard
    const leaders = trainingService.getLeaderboard(10);
    setLeaderboard(leaders);

    // Mock organization stats - In production, aggregate from all users
    setOrganizationStats({
      totalTrainees: 156,
      averageScore: 78.5,
      totalHoursTrained: 1247,
      certificationRate: 67.3,
      completionRate: 82.1,
      averageResponseTime: 8.4, // seconds
      trendScore: 'improving',
      trendResponseTime: 'improving',
      weakestAreas: [
        { topic: 'Hazmat containment procedures', frequency: 23, impact: 'high' },
        { topic: 'Triage prioritization under pressure', frequency: 18, impact: 'medium' },
        { topic: 'Resource allocation decisions', frequency: 15, impact: 'medium' }
      ],
      mostPopularScenarios: [
        { name: 'Medical Emergency - Multi-Victim', completions: 89 },
        { name: 'Hazmat Spill Response', completions: 67 },
        { name: 'Wildfire Evacuation', completions: 54 }
      ]
    });
  };

  const getTrendIcon = (trend: string) => {
    if (trend === 'improving') return <TrendingUp color="#4CAF50" size={20} />;
    if (trend === 'degrading') return <TrendingDown color="#F44336" size={20} />;
    return <Minus color="#FF9800" size={20} />;
  };

  const getImpactColor = (impact: string) => {
    if (impact === 'high') return '#F44336';
    if (impact === 'medium') return '#FF9800';
    return '#FDD835';
  };

  if (!organizationStats) {
    return <div style={styles.loading}>Loading analytics...</div>;
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>Training Analytics</h2>
        <div style={styles.timeframeTabs}>
          {(['week', 'month', 'quarter', 'year'] as const).map(tf => (
            <button
              key={tf}
              style={{
                ...styles.tab,
                ...(timeframe === tf ? styles.tabActive : {})
              }}
              onClick={() => setTimeframe(tf)}
            >
              {tf.charAt(0).toUpperCase() + tf.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Key Metrics */}
      <div style={styles.metricsGrid}>
        <div style={styles.metricCard}>
          <div style={styles.metricIcon}>
            <Users size={28} color="#1a237e" />
          </div>
          <div style={styles.metricContent}>
            <div style={styles.metricValue}>{organizationStats.totalTrainees}</div>
            <div style={styles.metricLabel}>Active Trainees</div>
          </div>
        </div>

        <div style={styles.metricCard}>
          <div style={styles.metricIcon}>
            <Target size={28} color="#4CAF50" />
          </div>
          <div style={styles.metricContent}>
            <div style={styles.metricValue}>
              {organizationStats.averageScore.toFixed(1)}%
              <span style={styles.trendIcon}>{getTrendIcon(organizationStats.trendScore)}</span>
            </div>
            <div style={styles.metricLabel}>Average Score</div>
          </div>
        </div>

        <div style={styles.metricCard}>
          <div style={styles.metricIcon}>
            <Clock size={28} color="#FF9800" />
          </div>
          <div style={styles.metricContent}>
            <div style={styles.metricValue}>
              {organizationStats.averageResponseTime.toFixed(1)}s
              <span style={styles.trendIcon}>{getTrendIcon(organizationStats.trendResponseTime)}</span>
            </div>
            <div style={styles.metricLabel}>Avg Response Time</div>
          </div>
        </div>

        <div style={styles.metricCard}>
          <div style={styles.metricIcon}>
            <Award size={28} color="#9C27B0" />
          </div>
          <div style={styles.metricContent}>
            <div style={styles.metricValue}>{organizationStats.certificationRate.toFixed(1)}%</div>
            <div style={styles.metricLabel}>Certification Rate</div>
          </div>
        </div>
      </div>

      {/* Two Column Layout */}
      <div style={styles.twoColumn}>
        {/* Leaderboard */}
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>
            🏆 Top Performers
          </h3>
          <div style={styles.leaderboardContainer}>
            {leaderboard.map((leader, idx) => (
              <div
                key={leader.userId}
                style={{
                  ...styles.leaderboardItem,
                  ...(idx < 3 ? styles.topThree : {})
                }}
              >
                <div style={styles.leaderRank}>
                  {idx === 0 && '🥇'}
                  {idx === 1 && '🥈'}
                  {idx === 2 && '🥉'}
                  {idx > 2 && `#${idx + 1}`}
                </div>
                <div style={styles.leaderInfo}>
                  <div style={styles.leaderName}>User {leader.userId.slice(-8)}</div>
                  <div style={styles.leaderStats}>
                    {leader.completedScenarios} scenarios · {leader.certifications} certs
                  </div>
                </div>
                <div style={styles.leaderScore}>
                  <span style={styles.leaderScoreValue}>{leader.averageScore.toFixed(1)}</span>
                  <span style={styles.leaderScoreLabel}>/100</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Weak Areas */}
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>
            <AlertTriangle size={20} color="#F44336" />
            Areas for Improvement
          </h3>
          <div style={styles.weakAreasContainer}>
            {organizationStats.weakestAreas.map((area: any, idx: number) => (
              <div key={idx} style={styles.weakAreaItem}>
                <div style={styles.weakAreaHeader}>
                  <div style={styles.weakAreaTopic}>{area.topic}</div>
                  <div
                    style={{
                      ...styles.weakAreaImpact,
                      backgroundColor: getImpactColor(area.impact)
                    }}
                  >
                    {area.impact.toUpperCase()}
                  </div>
                </div>
                <div style={styles.weakAreaBar}>
                  <div
                    style={{
                      ...styles.weakAreaBarFill,
                      width: `${(area.frequency / 30) * 100}%`,
                      backgroundColor: getImpactColor(area.impact)
                    }}
                  />
                </div>
                <div style={styles.weakAreaFrequency}>
                  {area.frequency} trainees struggling
                </div>
              </div>
            ))}
          </div>

          <div style={styles.recommendationBox}>
            <strong>💡 Recommendation:</strong>
            <p>Schedule targeted training sessions for "Hazmat containment procedures" - highest impact weakness affecting 23 responders.</p>
          </div>
        </div>
      </div>

      {/* Popular Scenarios */}
      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>📚 Most Popular Training Scenarios</h3>
        <div style={styles.scenariosGrid}>
          {organizationStats.mostPopularScenarios.map((scenario: any, idx: number) => (
            <div key={idx} style={styles.scenarioCard}>
              <div style={styles.scenarioRank}>#{idx + 1}</div>
              <div style={styles.scenarioName}>{scenario.name}</div>
              <div style={styles.scenarioCompletions}>
                <Users size={16} />
                {scenario.completions} completions
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Progress Over Time */}
      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>📈 Training Progress Trends</h3>
        <div style={styles.chartPlaceholder}>
          <div style={styles.chartBar} data-value="65">
            <div style={styles.chartLabel}>Week 1</div>
            <div style={{...styles.chartBarFill, height: '65%'}} />
            <div style={styles.chartValue}>65%</div>
          </div>
          <div style={styles.chartBar} data-value="72">
            <div style={styles.chartLabel}>Week 2</div>
            <div style={{...styles.chartBarFill, height: '72%'}} />
            <div style={styles.chartValue}>72%</div>
          </div>
          <div style={styles.chartBar} data-value="75">
            <div style={styles.chartLabel}>Week 3</div>
            <div style={{...styles.chartBarFill, height: '75%'}} />
            <div style={styles.chartValue}>75%</div>
          </div>
          <div style={styles.chartBar} data-value="79">
            <div style={styles.chartLabel}>Week 4</div>
            <div style={{...styles.chartBarFill, height: '79%'}} />
            <div style={styles.chartValue}>79%</div>
          </div>
        </div>
        <div style={styles.chartCaption}>
          Average training scores showing steady improvement over the past month
        </div>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    padding: '2rem',
    backgroundColor: '#f5f7fa'
  },
  loading: {
    padding: '3rem',
    textAlign: 'center',
    color: '#666'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '2rem'
  },
  title: {
    margin: 0,
    fontSize: '2rem',
    color: '#1a237e'
  },
  timeframeTabs: {
    display: 'flex',
    gap: '0.5rem',
    backgroundColor: 'white',
    padding: '0.25rem',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
  },
  tab: {
    padding: '0.5rem 1.5rem',
    border: 'none',
    backgroundColor: 'transparent',
    cursor: 'pointer',
    borderRadius: '6px',
    fontWeight: '600',
    transition: 'all 0.2s',
    color: '#666'
  },
  tabActive: {
    backgroundColor: '#1a237e',
    color: 'white'
  },
  metricsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
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
    backgroundColor: '#f5f7fa',
    padding: '1rem',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  metricContent: {
    flex: 1
  },
  metricValue: {
    fontSize: '1.8rem',
    fontWeight: '700',
    color: '#1a237e',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem'
  },
  metricLabel: {
    fontSize: '0.9rem',
    color: '#666',
    marginTop: '0.25rem'
  },
  trendIcon: {
    display: 'inline-flex',
    alignItems: 'center'
  },
  twoColumn: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '1.5rem',
    marginBottom: '2rem'
  },
  section: {
    backgroundColor: 'white',
    padding: '1.5rem',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
  },
  sectionTitle: {
    margin: '0 0 1.5rem 0',
    fontSize: '1.3rem',
    color: '#1a237e',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem'
  },
  leaderboardContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem'
  },
  leaderboardItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    padding: '0.75rem',
    borderRadius: '8px',
    backgroundColor: '#f9f9f9',
    transition: 'all 0.2s'
  },
  topThree: {
    backgroundColor: '#FFF9C4',
    border: '2px solid #FDD835'
  },
  leaderRank: {
    fontSize: '1.2rem',
    fontWeight: '700',
    minWidth: '40px',
    textAlign: 'center'
  },
  leaderInfo: {
    flex: 1
  },
  leaderName: {
    fontWeight: '600',
    color: '#333',
    marginBottom: '0.25rem'
  },
  leaderStats: {
    fontSize: '0.8rem',
    color: '#666'
  },
  leaderScore: {
    display: 'flex',
    alignItems: 'baseline',
    gap: '0.25rem'
  },
  leaderScoreValue: {
    fontSize: '1.5rem',
    fontWeight: '700',
    color: '#1a237e'
  },
  leaderScoreLabel: {
    fontSize: '0.9rem',
    color: '#999'
  },
  weakAreasContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    marginBottom: '1rem'
  },
  weakAreaItem: {
    padding: '0.75rem',
    backgroundColor: '#f9f9f9',
    borderRadius: '6px'
  },
  weakAreaHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '0.5rem'
  },
  weakAreaTopic: {
    fontWeight: '600',
    color: '#333',
    fontSize: '0.95rem'
  },
  weakAreaImpact: {
    padding: '0.25rem 0.75rem',
    borderRadius: '4px',
    fontSize: '0.7rem',
    fontWeight: '700',
    color: 'white'
  },
  weakAreaBar: {
    width: '100%',
    height: '6px',
    backgroundColor: '#e0e0e0',
    borderRadius: '3px',
    overflow: 'hidden',
    marginBottom: '0.5rem'
  },
  weakAreaBarFill: {
    height: '100%',
    transition: 'width 0.3s ease'
  },
  weakAreaFrequency: {
    fontSize: '0.8rem',
    color: '#666'
  },
  recommendationBox: {
    padding: '1rem',
    backgroundColor: '#E3F2FD',
    borderRadius: '6px',
    border: '2px solid #2196F3',
    fontSize: '0.9rem',
    marginTop: '1rem'
  },
  scenariosGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '1rem'
  },
  scenarioCard: {
    padding: '1rem',
    backgroundColor: '#f9f9f9',
    borderRadius: '8px',
    textAlign: 'center',
    position: 'relative'
  },
  scenarioRank: {
    position: 'absolute',
    top: '0.5rem',
    right: '0.5rem',
    backgroundColor: '#1a237e',
    color: 'white',
    width: '30px',
    height: '30px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '0.8rem',
    fontWeight: '700'
  },
  scenarioName: {
    fontWeight: '600',
    color: '#333',
    marginBottom: '0.5rem',
    paddingRight: '2rem'
  },
  scenarioCompletions: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    fontSize: '0.85rem',
    color: '#666'
  },
  chartPlaceholder: {
    display: 'flex',
    gap: '1.5rem',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    height: '200px',
    padding: '1rem',
    backgroundColor: '#f9f9f9',
    borderRadius: '8px',
    marginBottom: '0.5rem'
  },
  chartBar: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    position: 'relative',
    height: '100%',
    justifyContent: 'flex-end'
  },
  chartLabel: {
    fontSize: '0.8rem',
    color: '#666',
    marginBottom: '0.5rem'
  },
  chartBarFill: {
    width: '60px',
    backgroundColor: '#1a237e',
    borderRadius: '4px 4px 0 0',
    transition: 'height 0.3s ease'
  },
  chartValue: {
    position: 'absolute',
    top: '-1.5rem',
    fontSize: '0.9rem',
    fontWeight: '700',
    color: '#1a237e'
  },
  chartCaption: {
    textAlign: 'center',
    fontSize: '0.85rem',
    color: '#666',
    fontStyle: 'italic'
  }
};

export default TrainingAnalytics;
