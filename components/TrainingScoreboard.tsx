import React, { useState, useMemo } from 'react';
import { Award, TrendingUp, Clock, AlertCircle, CheckCircle, Zap } from 'lucide-react';
import { trainingService } from '../services/trainingService';

interface TrainingScoreboardProps {
  userId: string;
}

const TrainingScoreboard: React.FC<TrainingScoreboardProps> = ({ userId }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'certifications' | 'weakpoints' | 'leaderboard'>('overview');

  // Get user data
  const progress = trainingService.getUserProgress(userId);
  const stats = trainingService.getTrainingStats(userId);
  const certs = trainingService.getUserCertifications(userId);
  const weakPoints = trainingService.identifyWeakPoints(userId);
  const responseAnalysis = trainingService.getResponseTimeAnalysis(userId);
  const leaderboard = trainingService.getLeaderboard(10);
  const userRank = useMemo(() => {
    return leaderboard.findIndex(u => u.userId === userId) + 1;
  }, [leaderboard, userId]);

  if (!progress) {
    return (
      <div className="bg-card-dark border border-border-dark rounded-lg p-6 text-center">
        <p className="text-text-light">No training data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-900/30 to-blue-900/10 border border-blue-500/30 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-text-light text-sm">Average Score</p>
              <p className="text-3xl font-bold text-white mt-1">{stats.averageScore}%</p>
            </div>
            <Zap className="w-8 h-8 text-blue-400 opacity-50" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-900/30 to-green-900/10 border border-green-500/30 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-text-light text-sm">Scenarios Completed</p>
              <p className="text-3xl font-bold text-white mt-1">{stats.totalScenarios}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-400 opacity-50" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-900/30 to-purple-900/10 border border-purple-500/30 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-text-light text-sm">Certifications</p>
              <p className="text-3xl font-bold text-white mt-1">{stats.certifications}</p>
            </div>
            <Award className="w-8 h-8 text-purple-400 opacity-50" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-yellow-900/30 to-yellow-900/10 border border-yellow-500/30 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-text-light text-sm">Training Hours</p>
              <p className="text-3xl font-bold text-white mt-1">{stats.totalHours}</p>
            </div>
            <Clock className="w-8 h-8 text-yellow-400 opacity-50" />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-border-dark flex gap-4">
        {[
          { id: 'overview' as const, label: 'Overview' },
          { id: 'certifications' as const, label: 'Certifications' },
          { id: 'weakpoints' as const, label: 'Weak Points' },
          { id: 'leaderboard' as const, label: 'Leaderboard' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-3 font-semibold border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'text-white border-b-blue-500'
                : 'text-text-light border-b-transparent hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div>
        {activeTab === 'overview' && (
          <div className="space-y-4">
            {/* Response Time Analysis */}
            <div className="bg-card-dark border border-border-dark rounded-lg p-4">
              <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-400" />
                Response Time Analysis
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-background-darker rounded-lg p-3">
                  <p className="text-text-light text-xs">Average</p>
                  <p className="text-xl font-bold text-white mt-1">
                    {(responseAnalysis.averageMs / 1000).toFixed(2)}s
                  </p>
                </div>
                <div className="bg-background-darker rounded-lg p-3">
                  <p className="text-text-light text-xs">Median</p>
                  <p className="text-xl font-bold text-white mt-1">
                    {(responseAnalysis.medianMs / 1000).toFixed(2)}s
                  </p>
                </div>
                <div className="bg-background-darker rounded-lg p-3">
                  <p className="text-text-light text-xs">Fastest</p>
                  <p className="text-xl font-bold text-green-400 mt-1">
                    {(responseAnalysis.fastestMs / 1000).toFixed(2)}s
                  </p>
                </div>
                <div className="bg-background-darker rounded-lg p-3">
                  <p className="text-text-light text-xs">Trend</p>
                  <p className={`text-xl font-bold mt-1 ${
                    responseAnalysis.trend === 'improving' ? 'text-green-400' :
                    responseAnalysis.trend === 'degrading' ? 'text-red-400' :
                    'text-yellow-400'
                  }`}>
                    {responseAnalysis.trend}
                  </p>
                </div>
              </div>
            </div>

            {/* Recent Scores */}
            <div className="bg-card-dark border border-border-dark rounded-lg p-4">
              <h3 className="font-semibold text-white mb-4">Recent Training Scores</h3>
              <div className="space-y-2">
                {progress.trainingScores.slice(0, 5).map(score => (
                  <div
                    key={score.id}
                    className="flex items-center justify-between p-3 bg-background-darker rounded-lg"
                  >
                    <div className="flex-1">
                      <p className="text-white font-semibold">{score.scenarioTitle}</p>
                      <p className="text-text-light text-sm">
                        {new Date(score.timestamp).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={`text-2xl font-bold ${
                        score.score >= 80 ? 'text-green-400' :
                        score.score >= 60 ? 'text-yellow-400' :
                        'text-red-400'
                      }`}>
                        {score.score}%
                      </p>
                      <p className="text-text-light text-xs">
                        {score.decisions.correct}/{score.decisions.total}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'certifications' && (
          <div className="space-y-3">
            {certs.length > 0 ? (
              certs.map(cert => (
                <div
                  key={cert.name}
                  className={`p-4 rounded-lg border ${
                    cert.isValid
                      ? 'bg-green-900/20 border-green-500/50'
                      : 'bg-red-900/20 border-red-500/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white font-semibold flex items-center gap-2">
                        <Award className="w-5 h-5" />
                        {cert.name}
                      </p>
                      <p className="text-text-light text-sm mt-1">
                        Earned {new Date(cert.earnedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      {cert.isValid ? (
                        <>
                          <p className="text-green-400 font-semibold">Valid</p>
                          <p className="text-text-light text-sm">
                            {cert.daysUntilExpiry} days remaining
                          </p>
                        </>
                      ) : (
                        <>
                          <p className="text-red-400 font-semibold">Expired</p>
                          <p className="text-text-light text-sm">Renewal required</p>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-card-dark border border-border-dark rounded-lg p-6 text-center">
                <AlertCircle className="w-12 h-12 text-text-light mx-auto opacity-50 mb-2" />
                <p className="text-text-light">No certifications yet</p>
                <p className="text-text-light text-sm mt-2">Complete mandatory training to earn certifications</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'weakpoints' && (
          <div className="space-y-3">
            {weakPoints.length > 0 ? (
              weakPoints.slice(0, 10).map((wp, idx) => (
                <div key={idx} className="bg-card-dark border border-border-dark rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-white font-semibold flex items-center gap-2">
                        <AlertCircle className="w-5 h-5 text-yellow-400" />
                        {wp.topic}
                      </p>
                      <p className="text-text-light text-sm mt-2">
                        Appeared in {wp.frequency} scenario{wp.frequency > 1 ? 's' : ''}
                      </p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {wp.affectedScenarios.map(scenario => (
                          <span
                            key={scenario}
                            className="text-xs bg-yellow-900/30 text-yellow-300 px-2 py-1 rounded"
                          >
                            {scenario}
                          </span>
                        ))}
                      </div>
                    </div>
                    <span className="text-2xl font-bold text-yellow-400 ml-4">{wp.frequency}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-card-dark border border-border-dark rounded-lg p-6 text-center">
                <CheckCircle className="w-12 h-12 text-green-400 mx-auto opacity-50 mb-2" />
                <p className="text-text-light">No significant weak points detected!</p>
                <p className="text-text-light text-sm mt-2">Keep up the excellent training performance</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'leaderboard' && (
          <div className="space-y-3">
            <div className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 border border-blue-500/30 rounded-lg p-4 mb-4">
              <p className="text-text-light text-sm">Your Rank</p>
              <p className="text-3xl font-bold text-white mt-1">#{userRank}</p>
            </div>
            {leaderboard.map((entry, idx) => (
              <div
                key={entry.userId}
                className={`p-4 rounded-lg border transition-colors ${
                  entry.userId === userId
                    ? 'bg-blue-900/30 border-blue-500/50'
                    : 'bg-card-dark border-border-dark'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-background-darker flex items-center justify-center">
                      <span className="font-bold text-white">#{idx + 1}</span>
                    </div>
                    <div>
                      <p className="text-white font-semibold">{entry.userId}</p>
                      <p className="text-text-light text-sm">
                        {entry.completedScenarios} scenarios • {entry.certifications} certs
                      </p>
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-blue-400">{entry.averageScore}%</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TrainingScoreboard;
