/**
 * Incident Replay Component
 * Allows users to replay past incidents step-by-step for training purposes
 */

import React, { useState, useEffect } from 'react';
import { Play, Pause, SkipForward, SkipBack, RotateCcw, X, Clock, MapPin, AlertTriangle } from 'lucide-react';
import { simulationService } from '../services/simulationService';
import type { Incident } from '../types';

interface Props {
  incident: Incident;
  onClose: () => void;
  onComplete?: (results: any) => void;
}

export const IncidentReplay: React.FC<Props> = ({ incident, onClose, onComplete }) => {
  const [scenario, setScenario] = useState<any>(null);
  const [run, setRun] = useState<any>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [decisions, setDecisions] = useState<any[]>([]);
  const [showFeedback, setShowFeedback] = useState(false);

  useEffect(() => {
    // Create replay scenario from incident
    const replayScenario = simulationService.replayIncident(incident);
    setScenario(replayScenario);
    
    // Start simulation run
    const simulationRun = simulationService.startSimulation(
      replayScenario.id,
      'replay-user', // Use current user in production
      'Replay Mode'
    );
    setRun(simulationRun);
  }, [incident]);

  useEffect(() => {
    if (!isPlaying || !scenario || currentStep >= scenario.events.length) {
      return;
    }

    const interval = setInterval(() => {
      setCurrentStep(prev => {
        if (prev >= scenario.events.length - 1) {
          setIsPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, 2000 / playbackSpeed); // Speed up or slow down

    return () => clearInterval(interval);
  }, [isPlaying, scenario, currentStep, playbackSpeed]);

  const handlePlayPause = () => {
    if (currentStep >= scenario?.events.length - 1) {
      handleRestart();
    }
    setIsPlaying(!isPlaying);
  };

  const handleStepForward = () => {
    if (currentStep < scenario?.events.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleStepBackward = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleRestart = () => {
    setCurrentStep(0);
    setIsPlaying(false);
    setDecisions([]);
    setShowFeedback(false);
  };

  const handleDecision = (decision: string, isOptimal: boolean) => {
    const newDecision = {
      step: currentStep,
      decision,
      isOptimal,
      timestamp: Date.now()
    };
    setDecisions([...decisions, newDecision]);
    
    if (run) {
      simulationService.recordDecision(
        run.id,
        scenario.events[currentStep].id,
        decision,
        Date.now() - run.startTime
      );
    }

    setShowFeedback(true);
    setTimeout(() => {
      setShowFeedback(false);
      handleStepForward();
    }, 2000);
  };

  const handleComplete = () => {
    if (run) {
      const results = simulationService.getSimulationResults(run.id);
      if (onComplete && results) {
        onComplete(results);
      }
    }
    onClose();
  };

  const getProgressPercentage = () => {
    if (!scenario) return 0;
    return ((currentStep + 1) / scenario.events.length) * 100;
  };

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  if (!scenario || !run) {
    return (
      <div style={styles.loading}>
        <div>Loading replay...</div>
      </div>
    );
  }

  const currentEvent = scenario.events[currentStep];
  const isComplete = currentStep >= scenario.events.length - 1;

  return (
    <div style={styles.overlay}>
      <div style={styles.container}>
        {/* Header */}
        <div style={styles.header}>
          <div>
            <h2 style={styles.title}>
              <RotateCcw size={24} style={styles.icon} />
              Incident Replay: {incident.title}
            </h2>
            <p style={styles.subtitle}>Analyzing decisions from past incident</p>
          </div>
          <button style={styles.closeButton} onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        {/* Progress Bar */}
        <div style={styles.progressContainer}>
          <div style={styles.progressBar}>
            <div
              style={{
                ...styles.progressFill,
                width: `${getProgressPercentage()}%`
              }}
            />
          </div>
          <div style={styles.progressText}>
            Step {currentStep + 1} of {scenario.events.length}
          </div>
        </div>

        {/* Main Content Area */}
        <div style={styles.content}>
          {/* Incident Info Panel */}
          <div style={styles.infoPanel}>
            <div style={styles.infoRow}>
              <MapPin size={16} />
              <span>{incident.location}</span>
            </div>
            <div style={styles.infoRow}>
              <AlertTriangle size={16} />
              <span>Severity: {incident.severity}</span>
            </div>
            <div style={styles.infoRow}>
              <Clock size={16} />
              <span>Original Time: {new Date(incident.timestamp).toLocaleString()}</span>
            </div>
          </div>

          {/* Current Event Display */}
          <div style={styles.eventCard}>
            <div style={styles.eventHeader}>
              <span style={styles.eventType}>{currentEvent.type.replace(/_/g, ' ').toUpperCase()}</span>
              <span style={styles.eventTime}>
                T+{formatTime(currentEvent.timestamp)}
              </span>
            </div>
            <div style={styles.eventDescription}>{currentEvent.description}</div>

            {/* Decision Point */}
            {currentEvent.type === 'decision_point' && currentEvent.data?.options && !showFeedback && (
              <div style={styles.decisionBox}>
                <h4 style={styles.decisionTitle}>What would you do?</h4>
                <div style={styles.optionsGrid}>
                  {currentEvent.data.options.map((option: any, idx: number) => (
                    <button
                      key={idx}
                      style={styles.optionButton}
                      onClick={() => handleDecision(option.text, option.isOptimal || false)}
                    >
                      {option.text}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Feedback Display */}
            {showFeedback && currentEvent.type === 'decision_point' && (
              <div style={styles.feedbackBox}>
                <div style={styles.feedbackIcon}>
                  {decisions[decisions.length - 1]?.isOptimal ? '✅' : '⚠️'}
                </div>
                <div style={styles.feedbackText}>
                  {decisions[decisions.length - 1]?.isOptimal
                    ? 'Excellent choice! This was an optimal response.'
                    : 'Not optimal. Review the best practices for this scenario.'}
                </div>
              </div>
            )}

            {/* Incident Updates */}
            {currentEvent.type === 'incident_update' && currentEvent.data && (
              <div style={styles.updateBox}>
                <strong>Status Update:</strong>
                <pre style={styles.updateData}>{JSON.stringify(currentEvent.data, null, 2)}</pre>
              </div>
            )}
          </div>

          {/* Decision History Sidebar */}
          <div style={styles.sidebar}>
            <h3 style={styles.sidebarTitle}>Your Decisions</h3>
            <div style={styles.decisionHistory}>
              {decisions.map((d, idx) => (
                <div
                  key={idx}
                  style={{
                    ...styles.historyItem,
                    borderLeftColor: d.isOptimal ? '#4CAF50' : '#FF9800'
                  }}
                >
                  <div style={styles.historyStep}>Step {d.step + 1}</div>
                  <div style={styles.historyDecision}>{d.decision}</div>
                  <div style={styles.historyResult}>
                    {d.isOptimal ? '✓ Optimal' : '⚠ Suboptimal'}
                  </div>
                </div>
              ))}
              {decisions.length === 0 && (
                <div style={styles.noDecisions}>No decisions recorded yet</div>
              )}
            </div>

            {/* Score Summary */}
            {decisions.length > 0 && (
              <div style={styles.scoreSummary}>
                <div style={styles.scoreLabel}>Current Score</div>
                <div style={styles.scoreValue}>
                  {Math.round((decisions.filter(d => d.isOptimal).length / decisions.length) * 100)}%
                </div>
                <div style={styles.scoreBreakdown}>
                  {decisions.filter(d => d.isOptimal).length} / {decisions.length} optimal
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Controls */}
        <div style={styles.controls}>
          <div style={styles.playbackControls}>
            <button
              style={styles.controlButton}
              onClick={handleStepBackward}
              disabled={currentStep === 0}
            >
              <SkipBack size={20} />
            </button>

            <button
              style={{...styles.controlButton, ...styles.playButton}}
              onClick={handlePlayPause}
            >
              {isPlaying ? <Pause size={24} /> : <Play size={24} />}
            </button>

            <button
              style={styles.controlButton}
              onClick={handleStepForward}
              disabled={currentStep >= scenario.events.length - 1}
            >
              <SkipForward size={20} />
            </button>

            <button
              style={styles.controlButton}
              onClick={handleRestart}
            >
              <RotateCcw size={20} />
            </button>
          </div>

          <div style={styles.speedControls}>
            <span style={styles.speedLabel}>Speed:</span>
            {[0.5, 1, 2, 4].map(speed => (
              <button
                key={speed}
                style={{
                  ...styles.speedButton,
                  ...(playbackSpeed === speed ? styles.speedButtonActive : {})
                }}
                onClick={() => setPlaybackSpeed(speed)}
              >
                {speed}x
              </button>
            ))}
          </div>

          {isComplete && (
            <button style={styles.completeButton} onClick={handleComplete}>
              Complete Replay
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999
  },
  loading: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
    fontSize: '1.5rem',
    color: 'white'
  },
  container: {
    backgroundColor: 'white',
    borderRadius: '12px',
    width: '90vw',
    height: '85vh',
    maxWidth: '1400px',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden'
  },
  header: {
    padding: '1.5rem',
    borderBottom: '2px solid #e0e0e0',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start'
  },
  title: {
    margin: 0,
    fontSize: '1.5rem',
    color: '#1a237e',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem'
  },
  subtitle: {
    margin: '0.25rem 0 0 0',
    fontSize: '0.9rem',
    color: '#666'
  },
  icon: {
    color: '#1a237e'
  },
  closeButton: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '0.5rem',
    color: '#666',
    transition: 'color 0.2s'
  },
  progressContainer: {
    padding: '1rem 1.5rem',
    backgroundColor: '#f5f7fa'
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
    backgroundColor: '#1a237e',
    transition: 'width 0.3s ease'
  },
  progressText: {
    textAlign: 'center',
    fontSize: '0.85rem',
    color: '#666',
    fontWeight: '600'
  },
  content: {
    flex: 1,
    display: 'grid',
    gridTemplateColumns: '250px 1fr 300px',
    gap: '1rem',
    padding: '1.5rem',
    overflow: 'hidden'
  },
  infoPanel: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    padding: '1rem',
    backgroundColor: '#f9f9f9',
    borderRadius: '8px',
    height: 'fit-content'
  },
  infoRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    fontSize: '0.9rem',
    color: '#333'
  },
  eventCard: {
    backgroundColor: '#fff',
    border: '2px solid #e0e0e0',
    borderRadius: '8px',
    padding: '1.5rem',
    overflowY: 'auto'
  },
  eventHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1rem',
    paddingBottom: '0.75rem',
    borderBottom: '1px solid #e0e0e0'
  },
  eventType: {
    backgroundColor: '#1a237e',
    color: 'white',
    padding: '0.25rem 0.75rem',
    borderRadius: '4px',
    fontSize: '0.8rem',
    fontWeight: '600'
  },
  eventTime: {
    fontSize: '0.9rem',
    color: '#666',
    fontFamily: 'monospace'
  },
  eventDescription: {
    fontSize: '1.1rem',
    lineHeight: '1.6',
    color: '#333',
    marginBottom: '1.5rem'
  },
  decisionBox: {
    marginTop: '1.5rem',
    padding: '1rem',
    backgroundColor: '#FFF9C4',
    borderRadius: '8px',
    border: '2px solid #FDD835'
  },
  decisionTitle: {
    margin: '0 0 1rem 0',
    fontSize: '1rem',
    color: '#333'
  },
  optionsGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '0.75rem'
  },
  optionButton: {
    padding: '0.75rem 1rem',
    backgroundColor: 'white',
    border: '2px solid #1a237e',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.95rem',
    fontWeight: '500',
    transition: 'all 0.2s',
    textAlign: 'left'
  },
  feedbackBox: {
    marginTop: '1.5rem',
    padding: '1rem',
    borderRadius: '8px',
    backgroundColor: '#E8F5E9',
    border: '2px solid #4CAF50',
    display: 'flex',
    alignItems: 'center',
    gap: '1rem'
  },
  feedbackIcon: {
    fontSize: '2rem'
  },
  feedbackText: {
    fontSize: '1rem',
    color: '#333'
  },
  updateBox: {
    marginTop: '1rem',
    padding: '1rem',
    backgroundColor: '#f5f7fa',
    borderRadius: '6px',
    fontSize: '0.9rem'
  },
  updateData: {
    marginTop: '0.5rem',
    fontSize: '0.8rem',
    color: '#666',
    overflow: 'auto'
  },
  sidebar: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem'
  },
  sidebarTitle: {
    margin: 0,
    fontSize: '1.1rem',
    color: '#1a237e',
    paddingBottom: '0.75rem',
    borderBottom: '2px solid #e0e0e0'
  },
  decisionHistory: {
    flex: 1,
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem'
  },
  historyItem: {
    padding: '0.75rem',
    backgroundColor: '#f9f9f9',
    borderRadius: '6px',
    borderLeft: '4px solid',
    fontSize: '0.85rem'
  },
  historyStep: {
    fontWeight: '600',
    color: '#666',
    marginBottom: '0.25rem'
  },
  historyDecision: {
    color: '#333',
    marginBottom: '0.25rem'
  },
  historyResult: {
    fontSize: '0.75rem',
    fontWeight: '600'
  },
  noDecisions: {
    textAlign: 'center',
    color: '#999',
    padding: '2rem',
    fontSize: '0.9rem'
  },
  scoreSummary: {
    padding: '1rem',
    backgroundColor: '#1a237e',
    borderRadius: '8px',
    textAlign: 'center',
    color: 'white'
  },
  scoreLabel: {
    fontSize: '0.8rem',
    marginBottom: '0.25rem',
    opacity: 0.9
  },
  scoreValue: {
    fontSize: '2rem',
    fontWeight: '700',
    marginBottom: '0.25rem'
  },
  scoreBreakdown: {
    fontSize: '0.85rem',
    opacity: 0.9
  },
  controls: {
    padding: '1.5rem',
    borderTop: '2px solid #e0e0e0',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f5f7fa'
  },
  playbackControls: {
    display: 'flex',
    gap: '0.5rem',
    alignItems: 'center'
  },
  controlButton: {
    padding: '0.75rem',
    backgroundColor: 'white',
    border: '2px solid #1a237e',
    borderRadius: '6px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s'
  },
  playButton: {
    padding: '1rem',
    backgroundColor: '#1a237e',
    color: 'white'
  },
  speedControls: {
    display: 'flex',
    gap: '0.5rem',
    alignItems: 'center'
  },
  speedLabel: {
    fontSize: '0.9rem',
    fontWeight: '600',
    marginRight: '0.5rem',
    color: '#666'
  },
  speedButton: {
    padding: '0.5rem 0.75rem',
    backgroundColor: 'white',
    border: '2px solid #e0e0e0',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '0.85rem',
    fontWeight: '600',
    transition: 'all 0.2s'
  },
  speedButtonActive: {
    backgroundColor: '#1a237e',
    borderColor: '#1a237e',
    color: 'white'
  },
  completeButton: {
    padding: '0.75rem 2rem',
    backgroundColor: '#4CAF50',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '1rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'background 0.2s'
  }
};

export default IncidentReplay;
