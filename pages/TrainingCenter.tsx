import React, { useState, useMemo } from 'react';
import { BookOpen, Play, Trophy, Zap, Clock, User, ArrowRight, Target } from 'lucide-react';
import { simulationService } from '../services/simulationService';
import { trainingService } from '../services/trainingService';
import SimulationControl from '../components/SimulationControl';
import TrainingScoreboard from '../components/TrainingScoreboard';

const TrainingCenter: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'scenarios' | 'progress' | 'certifications'>('scenarios');
  const [selectedScenario, setSelectedScenario] = useState<string | null>(null);
  const [activeRun, setActiveRun] = useState<string | null>(null);
  const [simulationResults, setSimulationResults] = useState<any>(null);
  const [filterDifficulty, setFilterDifficulty] = useState<'all' | 'beginner' | 'intermediate' | 'advanced' | 'expert'>('all');
  const [filterCategory, setFilterCategory] = useState<'all' | 'medical' | 'fire' | 'hazmat' | 'earthquake'>('all');

  const currentUserId = 'user-current'; // Placeholder - use auth context in real app

  // Get scenarios
  const allScenarios = simulationService.getAllScenarios();
  const filteredScenarios = useMemo(() => {
    return allScenarios.filter(s => {
      const difficultyMatch = filterDifficulty === 'all' || s.difficulty === filterDifficulty;
      const categoryMatch = filterCategory === 'all' || s.category === filterCategory;
      return difficultyMatch && categoryMatch;
    });
  }, [filterDifficulty, filterCategory]);

  const handleStartSimulation = (scenarioId: string) => {
    const run = simulationService.startSimulation(scenarioId, currentUserId);
    setActiveRun(run.id);
    setSelectedScenario(scenarioId);
  };

  const handleSimulationComplete = (results: any) => {
    setSimulationResults(results);
    
    // Record score
    const run = simulationService.getSimulation(activeRun!);
    if (run) {
      trainingService.recordTrainingScore(activeRun!, results, currentUserId);
    }
  };

  const handleBackFromSimulation = () => {
    setActiveRun(null);
    setSimulationResults(null);
    setSelectedScenario(null);
  };

  // Get user certifications
  const userCerts = trainingService.getUserCertifications(currentUserId);
  const userProgress = trainingService.getUserProgress(currentUserId);
  const stats = trainingService.getTrainingStats(currentUserId);

  // Get available certifications
  const certifications = [
    { name: 'EMT-B', description: 'Emergency Medical Technician - Basic', required: ['scenario-heart-attack'] },
    { name: 'EMT-P', description: 'Emergency Medical Technician - Paramedic', required: ['scenario-heart-attack'] },
    { name: 'HAZMAT', description: 'Hazardous Materials Technician', required: ['scenario-chemical-spill'] },
    { name: 'ICS-100', description: 'Incident Command System Level 100', required: [] },
    { name: 'ICS-200', description: 'Incident Command System Level 200', required: ['scenario-earthquake'] }
  ];

  if (activeRun && !simulationResults) {
    return (
      <div className="container mx-auto px-4 py-8">
        <button
          onClick={handleBackFromSimulation}
          className="mb-4 px-4 py-2 bg-background-darker hover:bg-background-dark rounded-lg text-text-light transition-colors"
        >
          ← Back to Training Center
        </button>
        <SimulationControl runId={activeRun} onComplete={handleSimulationComplete} />
      </div>
    );
  }

  if (simulationResults) {
    return (
      <div className="container mx-auto px-4 py-8">
        <button
          onClick={handleBackFromSimulation}
          className="mb-4 px-4 py-2 bg-background-darker hover:bg-background-dark rounded-lg text-text-light transition-colors"
        >
          ← Back to Training Center
        </button>

        <div className="bg-gradient-to-br from-green-900/30 to-blue-900/30 border border-green-500/50 rounded-lg p-8 mb-6">
          <h2 className="text-3xl font-bold text-white mb-4">Simulation Complete! 🎉</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="bg-background-darker rounded-lg p-4">
              <p className="text-text-light text-sm">Final Score</p>
              <p className="text-4xl font-bold text-blue-400 mt-2">{simulationResults.score}%</p>
            </div>
            <div className="bg-background-darker rounded-lg p-4">
              <p className="text-text-light text-sm">Decisions Made</p>
              <p className="text-4xl font-bold text-green-400 mt-2">
                {simulationResults.decisions.correct}/{simulationResults.decisions.total}
              </p>
            </div>
            <div className="bg-background-darker rounded-lg p-4">
              <p className="text-text-light text-sm">Avg Response Time</p>
              <p className="text-4xl font-bold text-yellow-400 mt-2">
                {(simulationResults.avgResponseTimeMs / 1000).toFixed(2)}s
              </p>
            </div>
          </div>

          {simulationResults.weakPoints.length > 0 && (
            <div className="bg-yellow-900/30 border border-yellow-500/50 rounded-lg p-4 mb-6">
              <h3 className="text-yellow-300 font-semibold mb-3">Areas for Improvement</h3>
              <ul className="space-y-2">
                {simulationResults.weakPoints.map((wp: any, idx: number) => (
                  <li key={idx} className="text-text-light flex items-start gap-2">
                    <span className="text-yellow-400 mt-1">•</span>
                    <span>{wp.feedback}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleBackFromSimulation}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              <Play className="w-4 h-4" />
              Run Another Simulation
            </button>
            <button
              onClick={handleBackFromSimulation}
              className="flex items-center gap-2 px-6 py-3 bg-background-darker hover:bg-background-dark text-text-light rounded-lg transition-colors"
            >
              <ArrowRight className="w-4 h-4" />
              Back to Training
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="space-y-2 mb-8">
        <h1 className="text-4xl font-bold text-white flex items-center gap-3">
          <BookOpen className="w-10 h-10 text-blue-400" />
          Training Center
        </h1>
        <p className="text-text-light">Practice critical incident response skills with realistic simulations and drills</p>
      </div>

      {/* Quick Stats */}
      {userProgress && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-card-dark border border-border-dark rounded-lg p-4">
            <p className="text-text-light text-sm">Avg Score</p>
            <p className="text-3xl font-bold text-blue-400 mt-1">{stats.averageScore}%</p>
          </div>
          <div className="bg-card-dark border border-border-dark rounded-lg p-4">
            <p className="text-text-light text-sm">Scenarios Completed</p>
            <p className="text-3xl font-bold text-green-400 mt-1">{stats.totalScenarios}</p>
          </div>
          <div className="bg-card-dark border border-border-dark rounded-lg p-4">
            <p className="text-text-light text-sm">Certifications</p>
            <p className="text-3xl font-bold text-purple-400 mt-1">{stats.certifications}</p>
          </div>
          <div className="bg-card-dark border border-border-dark rounded-lg p-4">
            <p className="text-text-light text-sm">Training Hours</p>
            <p className="text-3xl font-bold text-yellow-400 mt-1">{stats.totalHours}</p>
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="border-b border-border-dark flex gap-6">
        {[
          { id: 'scenarios' as const, label: 'Training Simulations', icon: Zap },
          { id: 'progress' as const, label: 'My Progress', icon: Target },
          { id: 'certifications' as const, label: 'Certifications', icon: Trophy }
        ].map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 font-semibold border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'text-white border-b-blue-500'
                  : 'text-text-light border-b-transparent hover:text-white'
              }`}
            >
              <Icon className="w-5 h-5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Content */}
      {activeTab === 'scenarios' && (
        <div className="space-y-6">
          {/* Filters */}
          <div className="flex flex-wrap gap-3">
            <div className="flex gap-2">
              <span className="text-text-light text-sm py-2">Difficulty:</span>
              {['all', 'beginner', 'intermediate', 'advanced', 'expert'].map(diff => (
                <button
                  key={diff}
                  onClick={() => setFilterDifficulty(diff as any)}
                  className={`px-3 py-1 rounded text-sm transition-colors ${
                    filterDifficulty === diff
                      ? 'bg-blue-600 text-white'
                      : 'bg-background-darker text-text-light hover:bg-background-dark'
                  }`}
                >
                  {diff.charAt(0).toUpperCase() + diff.slice(1)}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <span className="text-text-light text-sm py-2">Category:</span>
              {['all', 'medical', 'fire', 'hazmat', 'earthquake'].map(cat => (
                <button
                  key={cat}
                  onClick={() => setFilterCategory(cat as any)}
                  className={`px-3 py-1 rounded text-sm transition-colors ${
                    filterCategory === cat
                      ? 'bg-blue-600 text-white'
                      : 'bg-background-darker text-text-light hover:bg-background-dark'
                  }`}
                >
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Scenarios Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredScenarios.map(scenario => (
              <div
                key={scenario.id}
                className="bg-card-dark border border-border-dark rounded-lg p-6 hover:border-blue-500/50 transition-colors space-y-4"
              >
                <div>
                  <h3 className="text-xl font-bold text-white">{scenario.title}</h3>
                  <p className="text-text-light mt-2">{scenario.description}</p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <span className={`text-xs px-2 py-1 rounded ${
                    scenario.difficulty === 'beginner' ? 'bg-green-900/30 text-green-400' :
                    scenario.difficulty === 'intermediate' ? 'bg-yellow-900/30 text-yellow-400' :
                    scenario.difficulty === 'advanced' ? 'bg-orange-900/30 text-orange-400' :
                    'bg-red-900/30 text-red-400'
                  }`}>
                    {scenario.difficulty}
                  </span>
                  <span className="text-xs px-2 py-1 rounded bg-blue-900/30 text-blue-400">
                    {scenario.category}
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-text-light">
                    <Clock className="w-4 h-4" />
                    <span>{scenario.estimatedDurationMins} minutes</span>
                  </div>
                  <div className="text-sm text-text-light">
                    <p className="font-semibold text-white mb-1">Objectives:</p>
                    <ul className="space-y-1">
                      {scenario.objectives.slice(0, 3).map((obj, idx) => (
                        <li key={idx} className="text-xs">• {obj}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                {scenario.requiredCertifications && (
                  <div className="text-sm text-yellow-300">
                    <p className="font-semibold mb-1">Required Certifications:</p>
                    <p>{scenario.requiredCertifications.join(', ')}</p>
                  </div>
                )}

                <button
                  onClick={() => handleStartSimulation(scenario.id)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg font-semibold transition-all"
                >
                  <Play className="w-4 h-4" />
                  Start Simulation
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'progress' && <TrainingScoreboard userId={currentUserId} />}

      {activeTab === 'certifications' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {certifications.map(cert => {
            const hasCert = userCerts.some(c => c.name === cert.name);
            const canEarn = trainingService.canCertify(currentUserId, cert.name).canCertify;
            const progress = userProgress?.trainingScores.filter(s => cert.required.includes(s.scenarioId)) || [];

            return (
              <div
                key={cert.name}
                className={`rounded-lg p-6 border transition-colors ${
                  hasCert
                    ? 'bg-green-900/20 border-green-500/50'
                    : canEarn
                    ? 'bg-blue-900/20 border-blue-500/50'
                    : 'bg-card-dark border-border-dark'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-xl font-bold text-white">{cert.name}</h3>
                    <p className="text-text-light text-sm mt-1">{cert.description}</p>
                  </div>
                  {hasCert && <Trophy className="w-6 h-6 text-yellow-400" />}
                </div>

                {cert.required.length > 0 && (
                  <div className="space-y-2 mb-4">
                    <p className="text-sm font-semibold text-white">Required Simulations:</p>
                    {cert.required.map(req => {
                      const completed = progress.some(p => p.scenarioId === req);
                      return (
                        <div key={req} className="flex items-center gap-2 text-sm">
                          <span className={completed ? 'text-green-400' : 'text-text-light'}>
                            {completed ? '✓' : '○'}
                          </span>
                          <span>{req}</span>
                        </div>
                      );
                    })}
                  </div>
                )}

                <button
                  onClick={() => {
                    if (canEarn) {
                      trainingService.issueCertification(currentUserId, cert.name);
                      window.location.reload(); // Refresh to see updated certs
                    }
                  }}
                  disabled={!canEarn || hasCert}
                  className={`w-full py-2 rounded-lg font-semibold transition-colors ${
                    hasCert
                      ? 'bg-green-900/50 text-green-300 cursor-default'
                      : canEarn
                      ? 'bg-blue-600 hover:bg-blue-700 text-white'
                      : 'bg-background-darker text-text-light cursor-not-allowed opacity-50'
                  }`}
                >
                  {hasCert ? '✓ Earned' : canEarn ? 'Earn Certification' : 'Not Eligible'}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default TrainingCenter;
