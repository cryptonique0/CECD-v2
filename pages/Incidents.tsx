import React, { useState, useMemo, useEffect } from 'react';
import { Incident, IncidentStatus, Severity, IncidentCategory } from '../types';
import { useNavigate } from 'react-router-dom';
import { STATUS_COLORS, SEVERITY_COLORS, CATEGORY_ICONS } from '../constants';
import { notificationService } from '../services/notificationService';

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
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(true);

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
        i.description.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
        i.locationName.toLowerCase().includes(debouncedSearchQuery.toLowerCase());
      
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

  useEffect(() => {
    const newIncidents = incidents.filter(i => i.status === IncidentStatus.REPORTED);
    newIncidents.forEach(incident => {
      notificationService.sendNotification({
        type: 'incident',
        title: `New Incident: ${incident.title}`,
        message: `Severity: ${incident.severity}, Location: ${incident.locationName}`,
        severity: incident.severity === Severity.CRITICAL ? 'critical' : 'info',
      });
    });
  }, [incidents]);

  const getSeverityGradient = (severity: Severity) => {
    switch (severity) {
      case Severity.CRITICAL: return 'from-red-600 to-red-500';
      case Severity.HIGH: return 'from-orange-600 to-orange-500';
      case Severity.MEDIUM: return 'from-yellow-600 to-yellow-500';
      default: return 'from-green-600 to-green-500';
    }
  };

  const getTimeAgo = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    const minutes = Math.floor(diff / 60000);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  const statCards = [
    { label: 'Total Active', value: incidents.filter(i => i.status !== IncidentStatus.CLOSED && i.status !== IncidentStatus.RESOLVED).length, icon: 'emergency', color: 'red' },
    { label: 'Critical', value: incidents.filter(i => i.severity === Severity.CRITICAL).length, icon: 'priority_high', color: 'orange' },
    { label: 'In Progress', value: incidents.filter(i => i.status === IncidentStatus.IN_PROGRESS).length, icon: 'pending', color: 'blue' },
    { label: 'Resolved Today', value: incidents.filter(i => i.status === IncidentStatus.RESOLVED).length, icon: 'check_circle', color: 'green' },
  ];

  return (
    <div className="p-4 md:p-6 lg:p-8 flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:gap-0">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between md:gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">Incident Registry</h1>
              <span className="px-2 py-1 rounded-lg bg-primary/10 border border-primary/20 text-primary text-[10px] font-bold">
                {filteredIncidents.length} results
              </span>
            </div>
            <p className="text-white/50 text-sm">Real-time ledger of verified emergencies on Base network</p>
          </div>
          <button 
            onClick={() => navigate('/report')} 
            className="w-full md:w-auto flex items-center justify-center gap-2 px-4 py-3 md:py-2 bg-gradient-to-r from-red-600 to-red-500 text-white rounded-xl font-semibold text-sm shadow-lg shadow-red-500/20 hover:shadow-red-500/30 transition-all active:scale-95 md:mt-0 mt-2"
          >
            <span className="material-symbols-outlined text-lg">add</span>
            <span>Report Emergency</span>
          </button>
        </div>

        {/* Controls - Responsive Grid */}
        <div className="flex flex-col sm:flex-row gap-2 md:gap-3 items-stretch md:items-center md:justify-end flex-wrap">
          {/* View Toggle */}
          <div className="flex bg-white/5 border border-white/10 rounded-xl p-1 flex-shrink-0">
            <button 
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-all text-sm md:text-base ${viewMode === 'grid' ? 'bg-primary text-white' : 'text-white/50 hover:text-white active:bg-white/10'}`}
              title="Grid view"
            >
              <span className="material-symbols-outlined text-lg">grid_view</span>
            </button>
            <button 
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-all text-sm md:text-base ${viewMode === 'list' ? 'bg-primary text-white' : 'text-white/50 hover:text-white active:bg-white/10'}`}
              title="List view"
            >
              <span className="material-symbols-outlined text-lg">view_list</span>
            </button>
          </div>
          
          {/* Sort Buttons */}
          <div className="flex bg-white/5 border border-white/10 rounded-xl p-1 flex-wrap overflow-hidden flex-shrink-0">
            {(['newest', 'severity', 'oldest'] as const).map((sort) => (
              <button 
                key={sort}
                onClick={() => setSortBy(sort)}
                className={`px-2 sm:px-3 py-2 rounded-lg text-[9px] sm:text-[10px] font-bold uppercase transition-all ${sortBy === sort ? 'bg-primary text-white' : 'text-white/50 hover:text-white active:bg-white/10'}`}
                title={`Sort by ${sort}`}
              >
                {sort === 'newest' ? 'New' : sort === 'oldest' ? 'Old' : 'Severity'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {statCards.map((stat, i) => (
          <div key={i} className={`p-4 rounded-xl bg-gradient-to-br from-${stat.color}-500/10 to-${stat.color}-600/5 border border-${stat.color}-500/20`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-black text-white">{stat.value}</p>
                <p className="text-[10px] text-white/50 font-medium uppercase">{stat.label}</p>
              </div>
              <div className={`p-2 rounded-xl bg-${stat.color}-500/20`}>
                <span className={`material-symbols-outlined text-${stat.color}-400`}>{stat.icon}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Filters Sidebar */}
        <aside className={`lg:col-span-1 ${showFilters ? '' : 'hidden lg:block'}`}>
          <div className="bg-gradient-to-br from-slate-900 to-slate-950 p-5 rounded-2xl border border-white/5 sticky top-24">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">tune</span>
                <h3 className="text-sm font-bold text-white">Filters</h3>
              </div>
              <button 
                onClick={() => {
                  setFilterStatus('All');
                  setFilterSeverity('All');
                  setFilterCategory('All');
                  setSearchQuery('');
                  setRadius(100);
                }}
                className="text-[10px] text-red-400 hover:text-red-300 font-semibold transition-colors"
              >
                Reset
              </button>
            </div>

            <div className="space-y-5">
              {/* Search */}
              <div>
                <label className="text-[10px] text-white/40 font-semibold uppercase mb-2 block">Search</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-white/30 text-sm">search</span>
                  <input 
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-3 py-2.5 text-sm text-white focus:ring-2 focus:ring-primary/30 focus:border-primary/50 outline-none transition-all placeholder:text-white/30" 
                    placeholder="ID, title, location..."
                  />
                </div>
              </div>

              {/* Status */}
              <div>
                <label className="text-[10px] text-white/40 font-semibold uppercase mb-2 block">Status</label>
                <div className="flex flex-wrap gap-1.5">
                  {['All', ...Object.values(IncidentStatus)].map(s => (
                    <button 
                      key={s} 
                      onClick={() => setFilterStatus(s)}
                      className={`px-2.5 py-1.5 rounded-lg text-[10px] font-semibold transition-all ${
                        filterStatus === s 
                          ? 'bg-primary text-white' 
                          : 'bg-white/5 text-white/50 hover:text-white hover:bg-white/10 border border-white/10'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Severity */}
              <div>
                <label className="text-[10px] text-white/40 font-semibold uppercase mb-2 block">Severity</label>
                <div className="grid grid-cols-2 gap-1.5">
                  {['All', ...Object.values(Severity)].map(s => (
                    <button 
                      key={s} 
                      onClick={() => setFilterSeverity(s)}
                      className={`px-2.5 py-1.5 rounded-lg text-[10px] font-semibold transition-all ${
                        filterSeverity === s 
                          ? 'bg-primary text-white' 
                          : 'bg-white/5 text-white/50 hover:text-white hover:bg-white/10 border border-white/10'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Category */}
              <div>
                <label className="text-[10px] text-white/40 font-semibold uppercase mb-2 block">Category</label>
                <select 
                  value={filterCategory}
                  onChange={e => setFilterCategory(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:ring-primary py-2.5 px-3 outline-none appearance-none cursor-pointer"
                >
                  <option value="All">All Categories</option>
                  {Object.values(IncidentCategory).map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
          </div>
        </aside>

        {/* Incidents Grid/List */}
        <div className="lg:col-span-3">
          {/* Mobile Filter Toggle */}
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className="lg:hidden w-full mb-4 flex items-center justify-center gap-2 p-3 bg-white/5 border border-white/10 rounded-xl text-white/60 hover:text-white transition-colors"
          >
            <span className="material-symbols-outlined">tune</span>
            {showFilters ? 'Hide' : 'Show'} Filters
          </button>

          {filteredIncidents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="p-4 rounded-2xl bg-white/5 mb-4">
                <span className="material-symbols-outlined text-4xl text-white/20">search_off</span>
              </div>
              <h3 className="text-lg font-bold text-white mb-2">No incidents found</h3>
              <p className="text-sm text-white/50 max-w-sm">Try adjusting your filters or search query to find what you're looking for.</p>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
              {filteredIncidents.map(incident => (
                <div 
                  key={incident.id} 
                  onClick={() => navigate(`/incidents/${incident.id}`)}
                  className="group bg-gradient-to-br from-slate-900 to-slate-950 border border-white/5 rounded-2xl overflow-hidden hover:border-primary/30 active:border-primary/50 transition-all cursor-pointer active:scale-95 touch-manipulation"
                >
                  {/* Severity Bar */}
                  <div className={`h-1 bg-gradient-to-r ${getSeverityGradient(incident.severity)}`}></div>
                  
                  <div className="p-4 sm:p-5">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="p-2.5 rounded-xl bg-white/5 group-hover:bg-primary/20 active:bg-primary/30 transition-colors flex-shrink-0">
                          <span className="material-symbols-outlined text-primary text-xl">{CATEGORY_ICONS[incident.category]}</span>
                        </div>
                        <div className="min-w-0">
                          <span className="text-[10px] font-mono text-primary/70 font-semibold">{incident.id}</span>
                          <h3 className="text-base font-bold text-white group-hover:text-primary active:text-primary transition-colors line-clamp-2">{incident.title}</h3>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1 flex-shrink-0">
                        <span className={`px-2 py-0.5 rounded-lg text-[9px] font-bold uppercase whitespace-nowrap ${SEVERITY_COLORS[incident.severity]}`}>
                          {incident.severity}
                        </span>
                        <span className={`px-2 py-0.5 rounded-lg text-[9px] font-semibold whitespace-nowrap ${STATUS_COLORS[incident.status]}`}>
                          {incident.status}
                        </span>
                        {incident.pendingSync && (
                          <span className="mt-1 inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[9px] font-bold uppercase bg-amber-500/10 text-amber-300 border border-amber-500/30 whitespace-nowrap">
                            <span className="material-symbols-outlined text-[12px]">cloud_off</span>
                            Sync
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Description */}
                    <p className="text-sm text-white/50 line-clamp-2 mb-4">{incident.description}</p>

                    {/* Footer */}
                    <div className="flex items-center justify-between pt-4 border-t border-white/5 gap-2">
                      <div className="flex items-center gap-2 sm:gap-4 text-[9px] sm:text-[10px] text-white/40 min-w-0">
                        <span className="flex items-center gap-1 truncate">
                          <span className="material-symbols-outlined text-sm flex-shrink-0">location_on</span>
                          <span className="truncate">{incident.locationName.split(',')[0]}</span>
                        </span>
                        <span className="flex items-center gap-1 whitespace-nowrap flex-shrink-0">
                          <span className="material-symbols-outlined text-sm">schedule</span>
                          {getTimeAgo(incident.timestamp)}
                        </span>
                      </div>
                      <button 
                        onClick={(e) => { e.stopPropagation(); navigate(`/incidents/${incident.id}`); }}
                        className="flex items-center justify-center gap-1 px-3 py-2 sm:py-1.5 rounded-lg bg-emerald-500/10 active:bg-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 transition-all text-[10px] font-semibold whitespace-nowrap flex-shrink-0 active:scale-95"
                      >
                        <span className="material-symbols-outlined text-xs">volunteer_activism</span>
                        <span className="hidden sm:inline">Donate</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* List View */
            <div className="flex flex-col gap-2">
              {filteredIncidents.map(incident => (
                <div 
                  key={incident.id} 
                  onClick={() => navigate(`/incidents/${incident.id}`)}
                  className="group flex items-center gap-4 p-4 bg-gradient-to-r from-slate-900 to-slate-950 border border-white/5 rounded-xl hover:border-primary/30 transition-all cursor-pointer"
                >
                  <div className={`w-1 h-12 rounded-full bg-gradient-to-b ${getSeverityGradient(incident.severity)}`}></div>
                  <div className="p-2 rounded-xl bg-white/5">
                    <span className="material-symbols-outlined text-primary">{CATEGORY_ICONS[incident.category]}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono text-primary/70">{incident.id}</span>
                      <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase ${SEVERITY_COLORS[incident.severity]}`}>{incident.severity}</span>
                    </div>
                    <h3 className="text-sm font-bold text-white truncate group-hover:text-primary transition-colors">{incident.title}</h3>
                    <p className="text-xs text-white/40 truncate">{incident.locationName}</p>
                  </div>
                  <div className="hidden sm:flex flex-col items-end gap-1">
                    <span className={`px-2 py-0.5 rounded text-[9px] font-semibold ${STATUS_COLORS[incident.status]}`}>{incident.status}</span>
                    <span className="text-[10px] text-white/40">{getTimeAgo(incident.timestamp)}</span>
                    {incident.pendingSync && (
                      <span className="mt-1 inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-amber-500/10 text-amber-300 border border-amber-500/30">
                        <span className="material-symbols-outlined text-[12px]">cloud_off</span>
                        Pending Sync
                      </span>
                    )}
                  </div>
                  <span className="material-symbols-outlined text-white/20 group-hover:text-primary group-hover:translate-x-1 transition-all">chevron_right</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Incidents;
