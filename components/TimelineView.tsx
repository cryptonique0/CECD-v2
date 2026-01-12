import React, { useState, useMemo } from 'react';
import { timelineService, TimelineEvent } from '../services/timelineService';

interface TimelineViewProps {
  incidentId: string;
}

const TimelineView: React.FC<TimelineViewProps> = ({ incidentId }) => {
  const [filterType, setFilterType] = useState<'all' | TimelineEvent['type']>('all');
  const events = timelineService.getIncidentTimeline(incidentId);

  const filteredEvents = useMemo(() => {
    if (filterType === 'all') return events;
    return events.filter(e => e.type === filterType);
  }, [events, filterType]);

  const getEventIcon = (type: TimelineEvent['type']) => {
    switch (type) {
      case 'status_change':
        return 'update';
      case 'assignment':
        return 'assignment';
      case 'resource_allocated':
        return 'inventory_2';
      case 'message':
        return 'mail';
      case 'location_update':
        return 'location_on';
      case 'severity_change':
        return 'priority_high';
      case 'escalation':
        return 'trending_up';
      case 'resolution':
        return 'check_circle';
      default:
        return 'event';
    }
  };

  const getEventColor = (type: TimelineEvent['type']) => {
    switch (type) {
      case 'status_change':
        return 'from-blue-600 to-blue-500';
      case 'assignment':
        return 'from-green-600 to-green-500';
      case 'resource_allocated':
        return 'from-purple-600 to-purple-500';
      case 'message':
        return 'from-cyan-600 to-cyan-500';
      case 'location_update':
        return 'from-orange-600 to-orange-500';
      case 'severity_change':
        return 'from-red-600 to-red-500';
      case 'escalation':
        return 'from-yellow-600 to-yellow-500';
      case 'resolution':
        return 'from-emerald-600 to-emerald-500';
      default:
        return 'from-slate-600 to-slate-500';
    }
  };

  const getSeverityBg = (severity?: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-500/10';
      case 'warning':
        return 'bg-yellow-500/10';
      default:
        return 'bg-blue-500/10';
    }
  };

  const getTimeFormat = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const getDateFormat = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const eventTypes: Array<TimelineEvent['type']> = [
    'status_change',
    'assignment',
    'resource_allocated',
    'message',
    'location_update',
    'severity_change',
    'escalation',
    'resolution',
  ];

  return (
    <div className="bg-slate-800 border border-white/10 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-white">Incident Timeline</h3>
          <span className="px-2 py-1 bg-white/10 rounded text-xs text-white/70 font-semibold">
            {filteredEvents.length} events
          </span>
        </div>

        {/* Filter Buttons */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
              filterType === 'all'
                ? 'bg-primary text-white'
                : 'bg-slate-700 text-white/60 hover:text-white'
            }`}
          >
            All
          </button>
          {eventTypes.map(type => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                filterType === type
                  ? 'bg-primary text-white'
                  : 'bg-slate-700 text-white/60 hover:text-white'
              }`}
            >
              {type.replace(/_/g, ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Timeline */}
      <div className="p-6">
        {filteredEvents.length === 0 ? (
          <div className="text-center py-8 text-white/40">
            <span className="material-symbols-outlined text-3xl mb-2 block">history</span>
            <p className="text-sm">No events yet</p>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredEvents.map((event, idx) => (
              <div key={event.id} className="relative">
                {/* Timeline Line */}
                {idx < filteredEvents.length - 1 && (
                  <div className="absolute left-4 top-12 w-0.5 h-12 bg-gradient-to-b from-white/20 to-transparent"></div>
                )}

                <div className="flex gap-4">
                  {/* Icon Circle */}
                  <div className={`bg-gradient-to-br ${getEventColor(event.type)} p-2 rounded-full flex-shrink-0 mt-1 z-10`}>
                    <span className="material-symbols-outlined text-white text-lg">
                      {getEventIcon(event.type)}
                    </span>
                  </div>

                  {/* Event Content */}
                  <div className="flex-1">
                    <div className="bg-slate-700/50 rounded-lg p-4 border border-white/5">
                      {/* Event Header */}
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="font-semibold text-white">{event.title}</h4>
                          <p className="text-xs text-white/50 mt-1">
                            {event.actor.name} • {event.actor.role}
                          </p>
                        </div>
                        {event.severity && (
                          <span
                            className={`px-2 py-1 rounded text-xs font-semibold whitespace-nowrap ${getSeverityBg(event.severity)} ${
                              event.severity === 'critical'
                                ? 'text-red-400'
                                : event.severity === 'warning'
                                ? 'text-yellow-400'
                                : 'text-blue-400'
                            }`}
                          >
                            {event.severity}
                          </span>
                        )}
                      </div>

                      {/* Event Description */}
                      <p className="text-sm text-white/70">{event.description}</p>

                      {/* Event Metadata */}
                      {event.metadata && Object.keys(event.metadata).length > 0 && (
                        <div className="mt-3 pt-3 border-t border-white/10 space-y-1">
                          {Object.entries(event.metadata).map(([key, value]) => (
                            <div key={key} className="flex justify-between text-xs text-white/60">
                              <span className="capitalize">{key.replace(/_/g, ' ')}:</span>
                              <span className="text-white/80 font-mono">
                                {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Timestamp */}
                      <div className="mt-3 flex gap-4 text-[10px] text-white/40">
                        <div className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-xs">today</span>
                          {getDateFormat(event.timestamp)}
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-xs">schedule</span>
                          {getTimeFormat(event.timestamp)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TimelineView;
