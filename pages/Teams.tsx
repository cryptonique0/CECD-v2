import React, { useState } from 'react';
import { teamService, Team, TeamMember } from '../services/teamService';
import { Role } from '../types';

interface TeamsPageProps {
  currentUser?: any;
}

const TeamsPage: React.FC<TeamsPageProps> = ({ currentUser }) => {
  const [teams, setTeams] = useState<Team[]>(teamService.listTeams());
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(teams[0] || null);
  const [viewMode, setViewMode] = useState<'grid' | 'detail'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSpecialization, setFilterSpecialization] = useState('All');

  const filteredTeams = teams.filter(t => {
    const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.members.some(m => m.name.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesSpecialization = filterSpecialization === 'All' || t.specialization === filterSpecialization;
    return matchesSearch && matchesSpecialization;
  });

  const specializations = ['All', ...new Set(teams.map(t => t.specialization))];

  const getPerformanceColor = (score: number) => {
    if (score >= 90) return 'text-green-500';
    if (score >= 75) return 'text-blue-500';
    if (score >= 60) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getAvailableMembers = (team: Team) => {
    return team.members.filter(m => m.status === 'active').length;
  };

  return (
    <div className="p-6 flex flex-col gap-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold text-white">Teams & Crew Management</h1>
        <p className="text-white/60">Manage teams, track performance, and monitor certifications</p>
      </div>

      {/* Controls */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between bg-slate-800/50 p-4 rounded-lg border border-white/10">
        <div className="flex-1 flex gap-4">
          <input
            type="text"
            placeholder="Search teams or members..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 px-4 py-2 bg-slate-700 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-primary"
          />
          <select
            value={filterSpecialization}
            onChange={(e) => setFilterSpecialization(e.target.value)}
            className="px-4 py-2 bg-slate-700 border border-white/20 rounded-lg text-white focus:outline-none focus:border-primary"
          >
            {specializations.map(spec => (
              <option key={spec} value={spec}>{spec}</option>
            ))}
          </select>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode('grid')}
            className={`px-4 py-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-primary text-white' : 'bg-slate-700 text-white/70 hover:text-white'}`}
          >
            <span className="material-symbols-outlined text-lg">view_comfy</span>
          </button>
          <button
            onClick={() => setViewMode('detail')}
            className={`px-4 py-2 rounded-lg transition-all ${viewMode === 'detail' ? 'bg-primary text-white' : 'bg-slate-700 text-white/70 hover:text-white'}`}
          >
            <span className="material-symbols-outlined text-lg">view_list</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Teams Grid/List */}
        <div className={`lg:col-span-${viewMode === 'grid' ? '3' : '1'}`}>
          <div className={`grid gap-4 ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
            {filteredTeams.map(team => (
              <div
                key={team.id}
                onClick={() => { setSelectedTeam(team); setViewMode('detail'); }}
                className={`p-4 rounded-lg border cursor-pointer transition-all ${
                  selectedTeam?.id === team.id
                    ? 'bg-primary/20 border-primary'
                    : 'bg-slate-800 border-white/10 hover:border-white/20 hover:bg-slate-800/80'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-lg font-semibold text-white">{team.name}</h3>
                    <p className="text-sm text-white/60">{team.specialization}</p>
                  </div>
                  <div className={`text-2xl font-bold ${getPerformanceColor(team.performanceScore)}`}>
                    {team.performanceScore}
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-white/70">
                    <span>Members</span>
                    <span className="text-white font-semibold">{team.members.length}</span>
                  </div>
                  <div className="flex justify-between text-white/70">
                    <span>Available</span>
                    <span className="text-green-400 font-semibold">{getAvailableMembers(team)}</span>
                  </div>
                  <div className="flex justify-between text-white/70">
                    <span>Active Incidents</span>
                    <span className="text-blue-400 font-semibold">{team.activeIncidents.length}</span>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-white/10">
                  <div className="text-xs text-white/50">Team Leader: {team.leader}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Team Detail Panel */}
        {selectedTeam && viewMode === 'detail' && (
          <div className="lg:col-span-2 space-y-6">
            {/* Team Info */}
            <div className="bg-slate-800 border border-white/10 rounded-lg p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-white">{selectedTeam.name}</h2>
                  <p className="text-white/60">{selectedTeam.specialization} Team</p>
                </div>
                <div className={`text-4xl font-bold ${getPerformanceColor(selectedTeam.performanceScore)}`}>
                  {selectedTeam.performanceScore}%
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <p className="text-white/60 text-sm">Total Members</p>
                  <p className="text-2xl font-bold text-white">{selectedTeam.members.length}</p>
                </div>
                <div>
                  <p className="text-white/60 text-sm">Active Members</p>
                  <p className="text-2xl font-bold text-green-400">{getAvailableMembers(selectedTeam)}</p>
                </div>
                <div>
                  <p className="text-white/60 text-sm">Active Incidents</p>
                  <p className="text-2xl font-bold text-blue-400">{selectedTeam.activeIncidents.length}</p>
                </div>
                <div>
                  <p className="text-white/60 text-sm">Certifications</p>
                  <p className="text-2xl font-bold text-white">{selectedTeam.certifications.length}</p>
                </div>
              </div>
            </div>

            {/* Members */}
            <div className="bg-slate-800 border border-white/10 rounded-lg p-6">
              <h3 className="text-xl font-bold text-white mb-4">Team Members</h3>
              <div className="space-y-3">
                {selectedTeam.members.map(member => (
                  <div key={member.userId} className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg">
                    <div className="flex-1">
                      <p className="text-white font-semibold">{member.name}</p>
                      <p className="text-sm text-white/60">{member.role}</p>
                      <p className="text-xs text-white/40 mt-1">Skills: {member.skills.join(', ')}</p>
                    </div>
                    <div className="text-right">
                      <div className="flex gap-1">
                        {Array(5).fill(0).map((_, i) => (
                          <span
                            key={i}
                            className={`text-lg ${i < Math.floor(member.performanceRating) ? 'text-yellow-400' : 'text-white/20'}`}
                          >
                            ★
                          </span>
                        ))}
                      </div>
                      <p className={`text-xs mt-1 ${member.status === 'active' ? 'text-green-400' : 'text-yellow-400'}`}>
                        {member.status}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Certifications */}
            {selectedTeam.certifications.length > 0 && (
              <div className="bg-slate-800 border border-white/10 rounded-lg p-6">
                <h3 className="text-xl font-bold text-white mb-4">Certifications</h3>
                <div className="space-y-2">
                  {selectedTeam.certifications.map(cert => (
                    <div key={cert.id} className="flex items-center justify-between p-2 text-white/70 text-sm">
                      <span>{cert.name} • {cert.issuer}</span>
                      <span className="text-white/50">{new Date(cert.expiryDate).toLocaleDateString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TeamsPage;
