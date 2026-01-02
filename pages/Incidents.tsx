
import React, { useState, useMemo, useEffect } from 'react';
import { Incident, IncidentStatus, Severity, IncidentCategory } from '../types';
import { useNavigate } from 'react-router-dom';
import { STATUS_COLORS, SEVERITY_COLORS, CATEGORY_ICONS } from '../constants';

interface IncidentsProps {
  incidents: Incident[];
}

const Incidents: React.FC<IncidentsProps> = ({ incidents }) => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [filterSeverity, setFilterSeverity] = useState<string>('All');
  const [filterCategory, setFilterCategory] = useState<string>('All');
  const [radius, setRadius] = useState<number>(100);
  const [sortBy, setSortBy] = useState<'newest' | 'severity' | 'oldest'>('newest');

  // Debounce effect: Update debouncedSearchQuery only after 300ms of inactivity
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);

    return () => {
      clearTimeout(handler);
    };
  }, [searchQuery]);

  const filteredIncidents = useMemo(() => {
    let result = incidents.filter(i => {
      const matchesStatus = filterStatus === 'All' || i.status === filterStatus;
      const matchesSeverity = filterSeverity === 'All' || i.severity === filterSeverity;
      const matchesCategory = filterCategory === 'All' || i.category === filterCategory;
      const matchesSearch = 
        i.title.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) || 
        i.id.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
        i.description.toLowerCase().includes(debouncedSearchQuery.toLowerCase());
      
      const pseudoDistance = (parseInt(i.id.replace(/\D/g, '')) % 100);
      const matchesRadius = radius === 100 || pseudoDistance <= radius;
      
      return matchesStatus && matchesSearch && matchesSeverity && matchesCategory && matchesRadius;
    });

    if (sortBy === 'newest') result.sort((a, b) => b.timestamp - a.timestamp);
    if (sortBy === 'oldest') result.sort((a, b) => a.timestamp - b.timestamp);
    if (sortBy === 'severity') {
      const severityMap: Record<Severity, number> = { [Severity.CRITICAL]: 3, [Severity.HIGH]: 2, [Severity.MEDIUM]: 1, [Severity.LOW]: 0 };
      result.sort((a, b) => severityMap[b.severity] - severityMap[a.severity]);
    }

    return result;
  }, [incidents, debouncedSearchQuery, filterStatus, filterSeverity, filterCategory, radius, sortBy]);

  return (
    <div className="p-6 md:p-8 lg:p-10 flex flex-col gap-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-black text-white italic tracking-tight uppercase">Emergency Repository</h1>
          <p className="text-text-secondary text-base italic">Real-time immutable ledger of global Base incidents.</p>
        </div>
        <div className="flex gap-3">
           <div className="flex bg-card-dark border border-border-dark rounded-xl p-1">
              <button 
                onClick={() => setSortBy('newest')}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all ${sortBy === 'newest' ? 'bg-primary text-white shadow-glow' : 'text-text-secondary hover:text-white'}`}
              >
                Newest
              </button>
              <button 
                onClick={() => setSortBy('severity')}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all ${sortBy === 'severity' ? 'bg-primary text-white shadow-glow' : 'text-text-secondary hover:text-white'}`}
              >
                Severity
              </button>
           </div>
           <button onClick={() => navigate('/report')} className="bg-primary hover:bg-primary-dark text-white px-6 py-2.5 rounded-xl font-bold transition-all shadow-glow flex items-center gap-2 active:scale-95 uppercase italic tracking-tighter">
              <span className="material-symbols-outlined">add</span>
              New Dispatch
           </button>
        </div>
      </div>

      {/* Global Command Search Console */}
      <div className="w-full bg-card-dark border border-border-dark rounded-[2.5rem] p-6 shadow-2xl relative overflow-hidden group">
        <div className="absolute inset-0 bg-primary/5 opacity-50"></div>
        <div className="relative flex flex-col md:flex-row items-center gap-6">
          <div className="flex-1 w-full relative">
            <span className="material-symbols-outlined absolute left-5 top-1/2 -translate-y-1/2 text-primary text-2xl group-focus-within:animate-pulse">search</span>
            <input 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-background-dark/80 border border-border-dark rounded-2xl pl-14 pr-24 py-5 text-lg text-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all placeholder:text-text-secondary/20 font-medium italic" 
              placeholder="Search by ID, Title, or Description..."
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-3">
              {searchQuery !== debouncedSearchQuery && (
                <div className="animate-spin size-4 border-2 border-primary border-t-transparent rounded-full opacity-60"></div>
              )}
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="size-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center transition-colors border border-border-dark"
                >
                  <span className="material-symbols-outlined text-xs text-text-secondary">close</span>
                </button>
              )}
              <div className="px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-widest">
                {filteredIncidents.length} Match
              </div>
            </div>
          </div>
          <div className="hidden lg:flex items-center gap-4 px-6 border-l border-border-dark">
            <div className="flex flex-col items-end">
              <p className="text-[10px] font-black text-text-secondary uppercase tracking-widest opacity-60">Ledger Status</p>
              <div className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-accent-green animate-pulse"></span>
                <span className="text-[11px] font-black text-white uppercase italic">Active Sync</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Advanced Triage Sidebar */}
        <aside className="bg-card-dark p-6 rounded-2xl border border-border-dark h-fit flex flex-col gap-6 sticky top-24 shadow-xl">
          <h3 className="text-sm font-bold text-white uppercase tracking-widest flex items-center justify-between italic">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-base">tune</span>
              Advanced Triage
            </div>
            <button 
              onClick={() => {
                setFilterStatus('All');
                setFilterSeverity('All');
                setFilterCategory('All');
                setSearchQuery('');
                setRadius(100);
              }}
              className="text-[10px] text-accent-red font-black hover:underline"
            >
              RESET
            </button>
          </h3>

          <div className="space-y-6">
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-bold text-text-secondary uppercase flex items-center gap-1.5 tracking-widest">
                <span className="material-symbols-outlined text-sm">emergency</span> Status
              </label>
              <div className="flex flex-wrap gap-2">
                {['All', ...Object.values(IncidentStatus)].map(s => (
                  <button 
                    key={s} 
                    onClick={() => setFilterStatus(s)}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase border transition-all ${
                      filterStatus === s ? 'bg-primary/20 text-white border-primary/50 shadow-glow' : 'bg-background-dark/50 text-text-secondary border-border-dark hover:border-slate-600'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-bold text-text-secondary uppercase flex items-center gap-1.5 tracking-widest">
                <span className="material-symbols-outlined text-sm">priority_high</span> Severity
              </label>
              <div className="grid grid-cols-2 gap-2">
                {['All', ...Object.values(Severity)].map(s => (
                  <button 
                    key={s} 
                    onClick={() => setFilterSeverity(s)}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase border transition-all ${
                      filterSeverity === s ? 'bg-primary/20 text-white border-primary/50 shadow-glow' : 'bg-background-dark/50 text-text-secondary border-border-dark hover:border-slate-600'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-bold text-text-secondary uppercase flex items-center gap-1.5 tracking-widest">
                <span className="material-symbols-outlined text-sm">category</span> Category
              </label>
              <select 
                value={filterCategory}
                onChange={e => setFilterCategory(e.target.value)}
                className="bg-background-dark border border-border-dark rounded-xl text-sm text-white focus:ring-primary h-12 px-3 outline-none uppercase font-bold"
              >
                <option value="All">All Categories</option>
                {Object.values(IncidentCategory).map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
        </aside>

        {/* Incidents Grid */}
        <div className="lg:col-span-3 flex flex-col gap-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredIncidents.map(incident => (
              <div 
                key={incident.id} 
                className="bg-card-dark border border-border-dark rounded-2xl p-6 flex flex-col gap-6 hover:border-primary/50 transition-all group animate-in fade-in slide-in-from-bottom-2 duration-300 relative overflow-hidden"
              >
                <div onClick={() => navigate(`/incidents/${incident.id}`)} className="cursor-pointer flex flex-col gap-6">
                  <div className="flex justify-between items-start">
                    <div className="flex gap-3">
                      <div className="bg-primary/10 size-10 rounded-xl flex items-center justify-center text-primary border border-primary/20">
                        <span className="material-symbols-outlined">{CATEGORY_ICONS[incident.category]}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] font-mono text-primary font-bold tracking-tighter">{incident.id}</span>
                        <h3 className="text-lg font-bold text-white group-hover:text-primary transition-colors leading-tight uppercase tracking-tight">{incident.title}</h3>
                      </div>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase border tracking-widest ${SEVERITY_COLORS[incident.severity]}`}>
                      {incident.severity}
                    </span>
                  </div>
                  <p className="text-sm text-text-secondary line-clamp-2 leading-relaxed h-10 italic">
                    {incident.description}
                  </p>
                </div>

                <div className="flex flex-col gap-4 mt-auto">
                  <div className="flex items-center justify-between text-xs text-text-secondary border-t border-border-dark pt-4">
                    <div className="flex items-center gap-1.5 font-bold uppercase tracking-tight">
                      <span className="material-symbols-outlined text-sm">location_on</span>
                      {incident.locationName}
                    </div>
                    <button 
                      onClick={(e) => { e.stopPropagation(); navigate(`/incidents/${incident.id}`); }}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 transition-all text-[10px] font-black uppercase tracking-widest shadow-glow"
                    >
                      <span className="material-symbols-outlined text-xs">volunteer_activism</span>
                      Enter Room
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {filteredIncidents.length === 0 && (
              <div className="col-span-full py-20 bg-card-dark/30 border-2 border-dashed border-border-dark rounded-[3rem] flex flex-col items-center justify-center text-center">
                <span className="material-symbols-outlined text-6xl text-text-secondary/20 mb-4">search_off</span>
                <p className="text-xl font-black text-white/50 uppercase tracking-widest italic">No Intel Matches Query</p>
                <p className="text-sm text-text-secondary max-w-xs mt-2 italic opacity-60">Try adjusting your triage parameters or tactical query.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Incidents;
