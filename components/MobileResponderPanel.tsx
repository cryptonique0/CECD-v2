import React, { useState } from 'react';
import { User, Incident, IncidentStatus } from '../types';

interface MobileResponderPanelProps {
  currentUser: User;
  incidents: Incident[];
  onStatusChange: (newStatus: string) => void;
  onNavigateToIncident: (incidentId: string) => void;
}

const MobileResponderPanel: React.FC<MobileResponderPanelProps> = ({
  currentUser,
  incidents,
  onStatusChange,
  onNavigateToIncident
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Get assigned incidents for this responder
  const assignedIncidents = incidents.filter(inc =>
    inc.assignedResponders.includes(currentUser.id) &&
    inc.status !== IncidentStatus.CLOSED &&
    inc.status !== IncidentStatus.RESOLVED
  ).slice(0, 3);

  const statusOptions = ['Available', 'Busy', 'Resting'];
  const statusColors: Record<string, string> = {
    'Available': 'bg-emerald-500 text-white',
    'Busy': 'bg-amber-500 text-white',
    'Resting': 'bg-slate-500 text-white'
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 md:hidden z-40 bg-gradient-to-t from-slate-900 to-slate-900/90 border-t border-white/5 backdrop-blur-xl" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      <div className="max-w-full">
        {/* Minimized View */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full px-4 py-3 flex items-center justify-between hover:bg-white/5 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center">
              <span className="material-symbols-outlined text-primary text-lg">badge</span>
            </div>
            <div className="text-left">
              <p className="text-sm font-bold text-white">{currentUser.name}</p>
              <p className="text-xs text-white/50">{currentUser.skills[0] || 'Responder'}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase ${statusColors[currentUser.status] || statusColors['Available']}`}>
              {currentUser.status}
            </span>
            <span className={`material-symbols-outlined transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
              expand_less
            </span>
          </div>
        </button>

        {/* Expanded View */}
        {isExpanded && (
          <div className="border-t border-white/5 bg-black/20 animate-in slide-in-from-bottom-4">
            <div className="p-4 space-y-4 max-h-96 overflow-y-auto custom-scrollbar">
              {/* Status Quick Switch */}
              <div className="space-y-2">
                <p className="text-xs font-bold text-white/60 uppercase tracking-widest">Current Status</p>
                <div className="flex gap-2">
                  {statusOptions.map(status => (
                    <button
                      key={status}
                      onClick={() => {
                        onStatusChange(status);
                      }}
                      className={`flex-1 px-3 py-2.5 rounded-xl text-xs font-bold uppercase transition-all ${
                        currentUser.status === status
                          ? `${statusColors[status]} shadow-lg`
                          : 'bg-white/5 text-white/60 hover:bg-white/10 border border-white/10'
                      }`}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quick Location */}
              <div className="bg-white/5 rounded-xl p-3 border border-white/10">
                <p className="text-xs font-bold text-white/60 uppercase tracking-widest mb-2">Current Location</p>
                <p className="text-sm font-bold text-white truncate">{currentUser.location}</p>
                <p className="text-[10px] text-white/50 mt-1">
                  Coordinates: {currentUser.lat?.toFixed(4)}, {currentUser.lng?.toFixed(4)}
                </p>
              </div>

              {/* Assigned Incidents */}
              {assignedIncidents.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-bold text-white/60 uppercase tracking-widest">Your Active Assignments</p>
                  <div className="space-y-2">
                    {assignedIncidents.map(incident => (
                      <button
                        key={incident.id}
                        onClick={() => {
                          onNavigateToIncident(incident.id);
                          setIsExpanded(false);
                        }}
                        className="w-full text-left p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all active:scale-95"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-xs font-mono text-primary/70">{incident.id}</p>
                            <p className="text-sm font-bold text-white truncate">{incident.title}</p>
                            <p className="text-[10px] text-white/50 mt-1">{incident.locationName}</p>
                          </div>
                          <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase whitespace-nowrap ${
                            incident.severity === 'Critical' ? 'bg-red-500/20 text-red-300' :
                            incident.severity === 'High' ? 'bg-amber-500/20 text-amber-300' :
                            'bg-blue-500/20 text-blue-300'
                          }`}>
                            {incident.severity}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Quick Actions */}
              <div className="space-y-2">
                <p className="text-xs font-bold text-white/60 uppercase tracking-widest">Quick Actions</p>
                <div className="grid grid-cols-2 gap-2">
                  <button className="px-4 py-3 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 rounded-xl text-xs font-bold uppercase transition-all active:scale-95">
                    <div className="flex flex-col items-center gap-1">
                      <span className="material-symbols-outlined">check_circle</span>
                      <span>On Scene</span>
                    </div>
                  </button>
                  <button className="px-4 py-3 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-500/30 rounded-xl text-xs font-bold uppercase transition-all active:scale-95">
                    <div className="flex flex-col items-center gap-1">
                      <span className="material-symbols-outlined">send</span>
                      <span>Update</span>
                    </div>
                  </button>
                  <button className="px-4 py-3 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 rounded-xl text-xs font-bold uppercase transition-all active:scale-95">
                    <div className="flex flex-col items-center gap-1">
                      <span className="material-symbols-outlined">warning</span>
                      <span>Support</span>
                    </div>
                  </button>
                  <button className="px-4 py-3 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/30 rounded-xl text-xs font-bold uppercase transition-all active:scale-95">
                    <div className="flex flex-col items-center gap-1">
                      <span className="material-symbols-outlined">message</span>
                      <span>Comms</span>
                    </div>
                  </button>
                </div>
              </div>

              {/* Trust & Performance */}
              <div className="grid grid-cols-2 gap-2 text-center">
                <div className="bg-white/5 rounded-xl p-3 border border-white/10">
                  <p className="text-xs font-bold text-white/60 uppercase mb-1">Trust Score</p>
                  <p className="text-lg font-black text-primary">{Math.round(currentUser.trustScore * 100)}%</p>
                </div>
                <div className="bg-white/5 rounded-xl p-3 border border-white/10">
                  <p className="text-xs font-bold text-white/60 uppercase mb-1">Assignments</p>
                  <p className="text-lg font-black text-emerald-400">{assignedIncidents.length}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MobileResponderPanel;
