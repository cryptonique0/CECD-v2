import React, { useState, useEffect } from 'react';
import { Play, Pause, SkipForward, RotateCcw, Zap, Clock, Target } from 'lucide-react';
import { simulationService, SimulationRun, SimulationEvent } from '../services/simulationService';
import { trainingService } from '../services/trainingService';

interface SimulationControlProps {
  runId: string;
  onComplete?: (results: any) => void;
}

const SimulationControl: React.FC<SimulationControlProps> = ({ runId, onComplete }) => {
  const [run, setRun] = useState<SimulationRun | null>(null);
  const [currentEvent, setCurrentEvent] = useState<SimulationEvent | null>(null);
  const [decisionTime, setDecisionTime] = useState(0);
  const [isDecisionActive, setIsDecisionActive] = useState(false);
  const [selectedDecision, setSelectedDecision] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string>('');
  const [elapsedTime, setElapsedTime] = useState(0);

  useEffect(() => {
    const simulation = simulationService.getSimulation(runId);
    setRun(simulation || null);
    updateCurrentEvent();
  }, [runId]);

  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedTime(prev => prev + 1000);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (isDecisionActive) {
      const timer = setInterval(() => {
        setDecisionTime(prev => prev + 1);
      }, 1);
      return () => clearInterval(timer);
    }
  }, [isDecisionActive]);

  const updateCurrentEvent = () => {
    const event = simulationService.getNextEvent(runId);
    setCurrentEvent(event || null);
    
    if (event?.type === 'decision_point') {
      setIsDecisionActive(true);
      setDecisionTime(0);
    }
  };

  const handlePlayPause = () => {
    if (run?.isPaused) {
      simulationService.resumeSimulation(runId);
    } else {
      simulationService.pauseSimulation(runId);
    }
    setRun({ ...run!, isPaused: !run?.isPaused });
  };

  const handleNextEvent = () => {
    if (selectedDecision && isDecisionActive) {
      simulationService.recordDecision(runId, currentEvent!.id, selectedDecision, decisionTime);
      setFeedback('Decision recorded');
      setSelectedDecision(null);
      setIsDecisionActive(false);
    }

    simulationService.nextEvent(runId);
    const updated = simulationService.getSimulation(runId);
    setRun(updated || null);

    if (updated?.isComplete) {
      const results = simulationService.getSimulationResults(runId);
      if (onComplete) onComplete(results);
    } else {
      updateCurrentEvent();
    }
  };

  const handleTimeScale = (scale: number) => {
    simulationService.setTimeScale(runId, scale);
  };

  const handleDecisionSelect = (decision: string) => {
    setSelectedDecision(decision);
    setFeedback('Decision selected');
  };

  if (!run) return <div>Loading simulation...</div>;

  const progressPercent = run.currentEventIndex / (simulationService.getSimulation(runId)?.scenarioId ? 100 : 1);
  const scenario = simulationService.getAllScenarios().find(s => s.id === run.scenarioId);

  return (
    <div className="bg-card-dark border border-border-dark rounded-lg p-6 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-white">{scenario?.title || 'Simulation'}</h2>
        <p className="text-text-light">{scenario?.description}</p>
      </div>

      {/* Incident State */}
      <div className="bg-background-darker rounded-lg p-4 border border-border-dark">
        <h3 className="text-lg font-semibold text-white mb-3">Current Incident State</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-text-light">Status:</span>
            <span className="ml-2 font-semibold text-blue-400">{run.incidentState.status}</span>
          </div>
          <div>
            <span className="text-text-light">Severity:</span>
            <span className="ml-2 font-semibold text-red-400">{run.incidentState.severity}</span>
          </div>
          <div className="col-span-2">
            <span className="text-text-light">Description:</span>
            <p className="text-white mt-1">{run.incidentState.description}</p>
          </div>
        </div>
      </div>

      {/* Current Event */}
      {currentEvent && (
        <div className="bg-blue-900/30 border border-blue-500/50 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-blue-300 mb-2 flex items-center gap-2">
            <Clock className="w-5 h-5" />
            {currentEvent.type === 'decision_point' ? 'Decision Point' : 'Event Update'}
          </h3>
          <p className="text-white">{currentEvent.description}</p>

          {currentEvent.type === 'decision_point' && currentEvent.data.options && (
            <div className="mt-4 space-y-2">
              <p className="text-text-light text-sm">Select your response:</p>
              {currentEvent.data.options.map((option: string, idx: number) => (
                <button
                  key={idx}
                  onClick={() => handleDecisionSelect(option)}
                  className={`w-full text-left p-3 rounded-lg border transition-colors ${
                    selectedDecision === option
                      ? 'bg-blue-500 border-blue-400 text-white'
                      : 'bg-background-darker border-border-dark text-text-light hover:bg-blue-900/30'
                  }`}
                >
                  • {option}
                </button>
              ))}
            </div>
          )}

          {feedback && (
            <p className={`mt-3 text-sm ${selectedDecision ? 'text-green-400' : 'text-yellow-400'}`}>
              ✓ {feedback}
            </p>
          )}
        </div>
      )}

      {/* Response Time */}
      {isDecisionActive && (
        <div className="bg-yellow-900/30 border border-yellow-500/50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <span className="text-yellow-300 font-semibold flex items-center gap-2">
              <Zap className="w-5 h-5" />
              Response Time
            </span>
            <span className="text-2xl font-mono font-bold text-yellow-400">
              {(decisionTime / 1000).toFixed(2)}s
            </span>
          </div>
          <p className="text-text-light text-sm mt-2">Quick decision-making is critical</p>
        </div>
      )}

      {/* Controls */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={handlePlayPause}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          {run.isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
          {run.isPaused ? 'Resume' : 'Pause'}
        </button>

        <button
          onClick={handleNextEvent}
          disabled={isDecisionActive && !selectedDecision}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <SkipForward className="w-4 h-4" />
          Next Event
        </button>

        <div className="flex gap-1">
          {[1, 2, 5, 10, 60].map(scale => (
            <button
              key={scale}
              onClick={() => handleTimeScale(scale)}
              className={`px-3 py-2 rounded-lg transition-colors text-sm ${
                run.timeScale === scale
                  ? 'bg-purple-600 text-white'
                  : 'bg-background-darker text-text-light hover:bg-purple-900/30'
              }`}
            >
              {scale}x
            </button>
          ))}
        </div>
      </div>

      {/* Progress */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-text-light">Simulation Progress</span>
          <span className="text-white font-semibold">
            {run.currentEventIndex + 1} / {scenario?.events.length}
          </span>
        </div>
        <div className="w-full bg-background-darker rounded-full h-2">
          <div
            className="bg-gradient-to-r from-blue-500 to-cyan-400 h-2 rounded-full transition-all"
            style={{ width: `${progressPercent * 100}%` }}
          />
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-background-darker rounded-lg p-3 text-center">
          <Target className="w-5 h-5 text-blue-400 mx-auto mb-1" />
          <span className="text-2xl font-bold text-white">{run.decisions.length}</span>
          <p className="text-text-light text-xs mt-1">Decisions</p>
        </div>
        <div className="bg-background-darker rounded-lg p-3 text-center">
          <Clock className="w-5 h-5 text-yellow-400 mx-auto mb-1" />
          <span className="text-2xl font-bold text-white">{(elapsedTime / 1000).toFixed(0)}s</span>
          <p className="text-text-light text-xs mt-1">Elapsed</p>
        </div>
        <div className="bg-background-darker rounded-lg p-3 text-center">
          <Zap className="w-5 h-5 text-green-400 mx-auto mb-1" />
          <span className="text-2xl font-bold text-white">
            {run.decisions.filter(d => d.isOptimal).length}/{run.decisions.length}
          </span>
          <p className="text-text-light text-xs mt-1">Correct</p>
        </div>
      </div>

      {run.isComplete && (
        <div className="bg-green-900/30 border border-green-500/50 rounded-lg p-4 text-center">
          <p className="text-green-300 font-semibold">✓ Simulation Complete!</p>
          <p className="text-text-light text-sm mt-2">Review your performance and unlock certifications</p>
        </div>
      )}
    </div>
  );
};

export default SimulationControl;
