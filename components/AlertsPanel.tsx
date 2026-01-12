import React, { useState, useMemo } from 'react';
import { alertManagementService, Alert } from '../services/alertManagementService';

interface AlertsPanelProps {
  incidentId?: string;
  compact?: boolean;
}

const AlertsPanel: React.FC<AlertsPanelProps> = ({ incidentId, compact = false }) => {
  const [showAcknowledged, setShowAcknowledged] = useState(false);
  const alerts = alertManagementService.getAlerts();
  const unacknowledgedAlerts = alertManagementService.getUnacknowledgedAlerts();

  const filteredAlerts = useMemo(() => {
    let result = showAcknowledged ? alerts : unacknowledgedAlerts;
    if (incidentId) {
      result = result.filter(a => a.affectedIncidents?.includes(incidentId));
    }
    return result.slice(0, compact ? 5 : 20);
  }, [alerts, unacknowledgedAlerts, showAcknowledged, incidentId, compact]);

  const stats = useMemo(() => {
    return {
      total: alerts.length,
      critical: alerts.filter(a => a.severity === 'critical').length,
      warning: alerts.filter(a => a.severity === 'warning').length,
      info: alerts.filter(a => a.severity === 'info').length,
      unacknowledged: unacknowledgedAlerts.length,
    };
  }, [alerts, unacknowledgedAlerts]);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'from-red-600 to-red-500';
      case 'warning':
        return 'from-yellow-600 to-yellow-500';
      default:
        return 'from-blue-600 to-blue-500';
    }
  };

  const getSeverityBg = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-500/10 border-red-500/20';
      case 'warning':
        return 'bg-yellow-500/10 border-yellow-500/20';
      default:
        return 'bg-blue-500/10 border-blue-500/20';
    }
  };

  const getTimeAgo = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  const handleAcknowledge = (alertId: string, userId: string = 'current-user') => {
    alertManagementService.acknowledgeAlert(alertId, userId);
  };

  const handleResolve = (alertId: string) => {
    alertManagementService.resolveAlert(alertId);
  };

  if (compact && filteredAlerts.length === 0) {
    return null;
  }

  return (
    <div className={`bg-slate-800 border border-white/10 rounded-lg overflow-hidden flex flex-col ${compact ? 'h-auto' : ''}`}>
      {/* Header */}
      <div className={`${compact ? 'p-3' : 'p-4'} border-b border-white/10`}>
        <div className="flex items-center justify-between mb-3">
          <h3 className={`font-bold text-white ${compact ? 'text-sm' : 'text-base'}`}>
            {compact ? 'Active Alerts' : 'Alert Management'}
          </h3>
          <div className="flex gap-1">
            {stats.critical > 0 && (
              <div className="px-2 py-1 bg-red-500/20 text-red-400 rounded text-xs font-bold">
                {stats.critical}
              </div>
            )}
            {stats.warning > 0 && (
              <div className="px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded text-xs font-bold">
                {stats.warning}
              </div>
            )}
          </div>
        </div>

        {!compact && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
            <div className="bg-red-500/10 p-2 rounded border border-red-500/20">
              <p className="text-red-400 font-bold">{stats.critical}</p>
              <p className="text-red-300/60 text-[10px]">Critical</p>
            </div>
            <div className="bg-yellow-500/10 p-2 rounded border border-yellow-500/20">
              <p className="text-yellow-400 font-bold">{stats.warning}</p>
              <p className="text-yellow-300/60 text-[10px]">Warning</p>
            </div>
            <div className="bg-blue-500/10 p-2 rounded border border-blue-500/20">
              <p className="text-blue-400 font-bold">{stats.info}</p>
              <p className="text-blue-300/60 text-[10px]">Info</p>
            </div>
            <div className="bg-white/5 p-2 rounded border border-white/10">
              <p className="text-white font-bold">{stats.unacknowledged}</p>
              <p className="text-white/60 text-[10px]">Unread</p>
            </div>
          </div>
        )}
      </div>

      {/* Toggle Acknowledged */}
      {!compact && (
        <div className="px-4 py-2 border-b border-white/10 flex items-center gap-2">
          <input
            type="checkbox"
            id="showAcknowledged"
            checked={showAcknowledged}
            onChange={(e) => setShowAcknowledged(e.target.checked)}
            className="w-4 h-4 rounded"
          />
          <label htmlFor="showAcknowledged" className="text-xs text-white/70 cursor-pointer flex-1">
            Show acknowledged ({alerts.length - unacknowledgedAlerts.length})
          </label>
        </div>
      )}

      {/* Alerts List */}
      <div className={`${compact ? 'max-h-64' : 'flex-1'} overflow-y-auto custom-scrollbar`}>
        {filteredAlerts.length === 0 ? (
          <div className={`flex flex-col items-center justify-center text-white/40 ${compact ? 'p-4 text-center' : 'h-32'}`}>
            <span className="material-symbols-outlined text-3xl mb-2">check_circle</span>
            <p className={`${compact ? 'text-xs' : 'text-sm'}`}>All systems normal</p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {filteredAlerts.map(alert => (
              <div
                key={alert.id}
                className={`${getSeverityBg(alert.severity)} border-l-4 ${
                  alert.severity === 'critical'
                    ? 'border-l-red-500'
                    : alert.severity === 'warning'
                    ? 'border-l-yellow-500'
                    : 'border-l-blue-500'
                } ${compact ? 'p-3' : 'p-4'}`}
              >
                <div className="flex gap-3">
                  {/* Icon */}
                  <div className={`bg-gradient-to-br ${getSeverityColor(alert.severity)} p-2 rounded-lg flex-shrink-0 ${compact ? 'h-8 w-8' : 'h-10 w-10'} flex items-center justify-center`}>
                    <span className={`material-symbols-outlined text-white ${compact ? 'text-sm' : 'text-base'}`}>
                      {alert.severity === 'critical' ? 'warning' : alert.severity === 'warning' ? 'priority_high' : 'info'}
                    </span>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <h4 className={`font-semibold text-white line-clamp-1 ${compact ? 'text-xs' : 'text-sm'}`}>
                          {alert.title}
                        </h4>
                        <p className={`text-white/60 ${compact ? 'text-[10px]' : 'text-xs'} mt-0.5 line-clamp-1`}>
                          {alert.description}
                        </p>
                      </div>
                      {!alert.acknowledged && (
                        <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-1"></span>
                      )}
                    </div>

                    {/* Recommendations */}
                    {alert.recommendations && alert.recommendations.length > 0 && !compact && (
                      <div className="mt-2 p-2 bg-white/5 rounded border border-white/10">
                        <p className="text-[10px] text-white/50 font-semibold mb-1">Recommendations:</p>
                        <ul className="space-y-0.5">
                          {alert.recommendations.slice(0, 2).map((rec, idx) => (
                            <li key={idx} className="text-[10px] text-white/60 flex gap-1">
                              <span>•</span>
                              <span>{rec}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Time */}
                    <p className={`text-white/40 mt-1 ${compact ? 'text-[10px]' : 'text-xs'}`}>
                      {getTimeAgo(alert.timestamp)}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                {!compact && !alert.acknowledged && (
                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={() => handleAcknowledge(alert.id)}
                      className="flex-1 px-3 py-2 bg-primary/20 hover:bg-primary/30 text-primary rounded text-xs font-semibold transition-all"
                    >
                      Acknowledge
                    </button>
                    <button
                      onClick={() => handleResolve(alert.id)}
                      className="flex-1 px-3 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded text-xs font-semibold transition-all"
                    >
                      Resolve
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AlertsPanel;
