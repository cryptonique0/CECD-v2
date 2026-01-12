import React, { useState, useMemo } from 'react';
import { trainingService, TrainingScenario, TrainingSession, TrainingDrill } from '../services/trainingService';

interface TrainingPageProps {
  currentUser?: any;
}

const TrainingPage: React.FC<TrainingPageProps> = ({ currentUser }) => {
  const [activeTab, setActiveTab] = useState<'scenarios' | 'sessions' | 'drills'>('scenarios');
  const [scenarios] = useState<TrainingScenario[]>(trainingService.listScenarios());
  const [selectedScenario, setSelectedScenario] = useState<TrainingScenario | null>(scenarios[0] || null);
  const [sessions, setSessions] = useState<TrainingSession[]>(trainingService.getSessionHistory(currentUser?.id || 'user-1'));
  const [drills] = useState<TrainingDrill[]>([...trainingService.getUpcomingDrills(), ...trainingService.getPastDrills()]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDifficulty, setFilterDifficulty] = useState('All');

  const filteredScenarios = useMemo(() => {
    return scenarios.filter(s => {
      const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesDifficulty = filterDifficulty === 'All' || s.difficulty === filterDifficulty;
      return matchesSearch && matchesDifficulty;
    });
  }, [scenarios, searchQuery, filterDifficulty]);

  const handleStartTraining = (scenarioId: string) => {
    const scenario = scenarios.find(s => s.id === scenarioId);
    if (scenario) {
      const session = trainingService.startSession(scenarioId, currentUser?.id || 'user-1', currentUser?.name || 'Anonymous');
      setSessions([...sessions, session]);
      // Simulate session completion after demo time
      setTimeout(() => {
        trainingService.completeSession(session.id, Math.floor(Math.random() * 40) + 60, 'Great job!');
        setSessions([...trainingService.getSessionHistory(currentUser?.id || 'user-1')]);
      }, 3000);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'intermediate':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'advanced':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      default:
        return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-400';
      case 'in-progress':
        return 'text-blue-400';
      case 'abandoned':
        return 'text-red-400';
      default:
        return 'text-white/60';
    }
  };

  return (
    <div className="p-6 flex flex-col gap-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col gap-2 mb-4">
        <h1 className="text-3xl font-bold text-white">Training & Drills</h1>
        <p className="text-white/60">Develop skills and prepare for emergencies</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-white/10">
        {['scenarios', 'sessions', 'drills'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={`px-6 py-3 font-semibold transition-all border-b-2 ${
              activeTab === tab
                ? 'text-white border-primary'
                : 'text-white/60 hover:text-white border-transparent hover:border-white/20'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Scenarios Tab */}
      {activeTab === 'scenarios' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Scenario List */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex gap-4">
              <input
                type="text"
                placeholder="Search scenarios..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 px-4 py-2 bg-slate-700 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-primary"
              />
              <select
                value={filterDifficulty}
                onChange={(e) => setFilterDifficulty(e.target.value)}
                className="px-4 py-2 bg-slate-700 border border-white/20 rounded-lg text-white focus:outline-none focus:border-primary"
              >
                <option value="All">All Levels</option>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>

            {filteredScenarios.map(scenario => (
              <div
                key={scenario.id}
                onClick={() => setSelectedScenario(scenario)}
                className={`p-4 rounded-lg border cursor-pointer transition-all ${
                  selectedScenario?.id === scenario.id
                    ? 'bg-primary/20 border-primary'
                    : 'bg-slate-800 border-white/10 hover:border-white/20'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-white">{scenario.name}</h3>
                    <p className="text-sm text-white/60 mt-1">{scenario.description}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getDifficultyColor(scenario.difficulty)}`}>
                    {scenario.difficulty}
                  </span>
                </div>

                <div className="flex gap-4 text-sm text-white/70">
                  <div className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-lg">schedule</span>
                    {scenario.estimatedDurationMinutes}m
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-lg">category</span>
                    {scenario.category}
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-lg">school</span>
                    {scenario.requiredSkills.length} skills
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Scenario Detail */}
          {selectedScenario && (
            <div className="bg-slate-800 border border-white/10 rounded-lg p-6 h-fit sticky top-6">
              <h2 className="text-xl font-bold text-white mb-4">{selectedScenario.name}</h2>

              <div className="space-y-4">
                <div>
                  <p className="text-white/60 text-sm mb-1">Objectives</p>
                  <ul className="space-y-1">
                    {selectedScenario.objectives.map((obj, idx) => (
                      <li key={idx} className="text-white/80 text-sm flex gap-2">
                        <span className="text-primary">•</span>
                        {obj}
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <p className="text-white/60 text-sm mb-2">Required Skills</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedScenario.requiredSkills.map(skill => (
                      <span key={skill} className="px-2 py-1 bg-primary/20 text-primary rounded text-xs font-semibold">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-white/60 text-sm mb-2">Target Audience</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedScenario.targetAudience.map(role => (
                      <span key={role} className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-xs">
                        {role}
                      </span>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => handleStartTraining(selectedScenario.id)}
                  className="w-full mt-6 px-4 py-3 bg-gradient-to-r from-primary to-blue-600 hover:from-primary/80 hover:to-blue-500 text-white font-semibold rounded-lg transition-all"
                >
                  Start Training
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Sessions Tab */}
      {activeTab === 'sessions' && (
        <div className="space-y-4">
          {sessions.length === 0 ? (
            <div className="text-center py-12 text-white/60">
              <p>No training sessions yet. Start one to get began!</p>
            </div>
          ) : (
            sessions.map(session => (
              <div key={session.id} className="bg-slate-800 border border-white/10 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-white">{session.participantName}</h3>
                    <p className="text-sm text-white/60">Scenario: {session.scenarioId}</p>
                  </div>
                  <div className="text-right">
                    <p className={`font-semibold ${getStatusColor(session.status)}`}>
                      {session.status}
                    </p>
                    {session.performanceScore && (
                      <p className="text-white/60 text-sm">Score: {session.performanceScore}%</p>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Drills Tab */}
      {activeTab === 'drills' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-xl font-bold text-white mb-4">Upcoming Drills</h3>
            <div className="space-y-3">
              {drills.filter(d => !d.result).map(drill => (
                <div key={drill.id} className="bg-slate-800 border border-white/10 rounded-lg p-4">
                  <h4 className="text-white font-semibold">{drill.name}</h4>
                  <p className="text-white/60 text-sm mt-1">{drill.scenario.name}</p>
                  <p className="text-white/60 text-sm mt-2">Participants: {drill.participants.length}</p>
                  <p className="text-primary text-sm mt-2">{new Date(drill.scheduledDate).toLocaleDateString()}</p>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-xl font-bold text-white mb-4">Past Drills</h3>
            <div className="space-y-3">
              {drills.filter(d => d.result).slice(0, 5).map(drill => (
                <div key={drill.id} className="bg-slate-800 border border-white/10 rounded-lg p-4">
                  <h4 className="text-white font-semibold">{drill.name}</h4>
                  <p className="text-white/60 text-sm mt-1">{drill.scenario.name}</p>
                  {drill.result && (
                    <div className="mt-2">
                      <p className="text-green-400 text-sm font-semibold">Success: {drill.result.successRate}%</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TrainingPage;
