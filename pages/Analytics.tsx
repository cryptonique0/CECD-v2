import React, { useState, useMemo } from 'react';
import { Incident, Severity, IncidentStatus } from '../types';
import { analyticsService } from '../services/performanceAnalyticsService';

interface AnalyticsPageProps {
  incidents: Incident[];
}

const AnalyticsPage: React.FC<AnalyticsPageProps> = ({ incidents }) => {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');
  const [selectedMetric, setSelectedMetric] = useState<'response' | 'resolution' | 'success' | 'category'>('success');

  // Mock incident data for analytics
  incidents.forEach(inc => {
    const responseTime = Math.floor(Math.random() * 30) + 5;
    const resolutionTime = Math.floor(Math.random() * 120) + 30;
    const success = Math.random() > 0.15;
    analyticsService.recordIncident(inc.id, inc.category, inc.severity, responseTime, resolutionTime, success);
  });

  const analytics = useMemo(() => {
    return analyticsService.getIncidentAnalytics();
  }, [incidents]);

  const topPerformers = useMemo(() => {
    return analyticsService.getTopPerformers(5);
  }, []);

  const getTimeAgo = (ts: number) => {
    const diff = Date.now() - ts;
    const days = Math.floor(diff / (24 * 60 * 60 * 1000));
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    return `${days}d ago`;
  };

  const kpiCards = [
    {
      label: 'Total Incidents',
      value: analytics.totalIncidents,
      icon: 'emergency',
      color: 'from-red-600 to-red-500',
      change: '+2.5%',
    },
    {
      label: 'Average Response Time',
      value: `${analytics.averageResponseTime}m`,
      icon: 'schedule',
      color: 'from-blue-600 to-blue-500',
      change: '-1.2m',
    },
    {
      label: 'Success Rate',
      value: `${analytics.successRate}%`,
      icon: 'check_circle',
      color: 'from-green-600 to-green-500',
      change: '+3.1%',
    },
    {
      label: 'Active Incidents',
      value: analytics.activeIncidents,
      icon: 'pending',
      color: 'from-yellow-600 to-yellow-500',
      change: '-1',
    },
  ];

  return (
    <div className="p-6 flex flex-col gap-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Analytics & Reporting</h1>
          <p className="text-white/60">Performance metrics and incident trends</p>
        </div>
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value as any)}
          className="px-4 py-2 bg-slate-700 border border-white/20 rounded-lg text-white focus:outline-none focus:border-primary"
        >
          <option value="7d">Last 7 days</option>
          <option value="30d">Last 30 days</option>
          <option value="90d">Last 90 days</option>
        </select>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((card, idx) => (
          <div key={idx} className="bg-slate-800 border border-white/10 rounded-lg p-6 hover:border-white/20 transition-all">
            <div className="flex items-start justify-between mb-4">
              <div className={`bg-gradient-to-br ${card.color} p-3 rounded-lg`}>
                <span className="material-symbols-outlined text-white text-2xl">{card.icon}</span>
              </div>
              <span className="text-green-400 text-sm font-semibold">{card.change}</span>
            </div>
            <p className="text-white/60 text-sm mb-1">{card.label}</p>
            <p className="text-3xl font-bold text-white">{card.value}</p>
          </div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Breakdown */}
        <div className="bg-slate-800 border border-white/10 rounded-lg p-6">
          <h2 className="text-xl font-bold text-white mb-4">Incidents by Category</h2>
          <div className="space-y-3">
            {Object.entries(analytics.byCategoryBreakdown).map(([category, count]) => (
              <div key={category} className="flex items-center gap-3">
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-white/70 text-sm">{category}</span>
                    <span className="text-white font-semibold">{count}</span>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-primary to-blue-500 h-2 rounded-full"
                      style={{ width: `${(count / analytics.totalIncidents) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Severity Breakdown */}
        <div className="bg-slate-800 border border-white/10 rounded-lg p-6">
          <h2 className="text-xl font-bold text-white mb-4">Incidents by Severity</h2>
          <div className="space-y-3">
            {Object.entries(analytics.bySeverityBreakdown).map(([severity, count]) => {
              const colors: Record<string, string> = {
                Low: 'from-green-500 to-green-400',
                Medium: 'from-yellow-500 to-yellow-400',
                High: 'from-orange-500 to-orange-400',
                Critical: 'from-red-600 to-red-500',
              };
              return (
                <div key={severity} className="flex items-center gap-3">
                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-white/70 text-sm">{severity}</span>
                      <span className="text-white font-semibold">{count}</span>
                    </div>
                    <div className="w-full bg-slate-700 rounded-full h-2">
                      <div
                        className={`bg-gradient-to-r ${colors[severity] || 'from-primary to-blue-500'} h-2 rounded-full`}
                        style={{ width: `${(count / analytics.totalIncidents) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Top Performers */}
      <div className="bg-slate-800 border border-white/10 rounded-lg p-6">
        <h2 className="text-xl font-bold text-white mb-4">Top Responders</h2>
        <div className="space-y-3">
          {topPerformers.map((responder, idx) => (
            <div key={idx} className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-primary to-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                  {idx + 1}
                </div>
                <div>
                  <p className="text-white font-semibold">{responder.name}</p>
                  <p className="text-xs text-white/50">{responder.role}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-white font-bold">{responder.performanceScore}%</p>
                <p className="text-xs text-white/60">{responder.totalIncidentsResponded} incidents</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Response Time Trend */}
      <div className="bg-slate-800 border border-white/10 rounded-lg p-6">
        <h2 className="text-xl font-bold text-white mb-4">Response Time Trend</h2>
        <div className="h-48 flex items-end gap-2">
          {[30, 25, 28, 22, 18, 20, 15, 12, 18, 22, 20, 18].map((value, idx) => (
            <div
              key={idx}
              className="flex-1 bg-gradient-to-t from-primary to-blue-500 rounded-t-lg hover:from-primary/80 hover:to-blue-400 transition-all relative group"
              style={{ height: `${(value / 35) * 100}%` }}
            >
              <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 px-2 py-1 rounded text-xs text-white opacity-0 group-hover:opacity-100 transition-all">
                {value}m
              </div>
            </div>
          ))}
        </div>
        <p className="text-xs text-white/50 mt-4">Showing last 12 days • Target: &lt;15 minutes</p>
      </div>

      {/* Success Rate Timeline */}
      <div className="bg-slate-800 border border-white/10 rounded-lg p-6">
        <h2 className="text-xl font-bold text-white mb-4">Success Rate Over Time</h2>
        <div className="flex items-end gap-2 h-32">
          {[85, 87, 85, 88, 90, 89, 92, 90, 93, 91, 92, 94].map((value, idx) => (
            <div
              key={idx}
              className="flex-1 bg-gradient-to-t from-green-500 to-green-400 rounded-t-lg hover:from-green-500/80 hover:to-green-400/80 transition-all relative group"
              style={{ height: `${(value / 100) * 100}%` }}
            >
              <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 px-2 py-1 rounded text-xs text-white opacity-0 group-hover:opacity-100 transition-all">
                {value}%
              </div>
            </div>
          ))}
        </div>
        <p className="text-xs text-white/50 mt-4">Showing last 12 days</p>
      </div>

      {/* Export Options */}
      <div className="flex gap-3 justify-end">
        <button
          onClick={() => console.log(analyticsService.exportAnalytics('json'))}
          className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-all flex items-center gap-2"
        >
          <span className="material-symbols-outlined text-lg">download</span>
          Export JSON
        </button>
        <button
          onClick={() => console.log(analyticsService.exportAnalytics('csv'))}
          className="px-4 py-2 bg-primary hover:bg-primary/80 text-white rounded-lg transition-all flex items-center gap-2"
        >
          <span className="material-symbols-outlined text-lg">download</span>
          Export CSV
        </button>
      </div>
    </div>
  );
};

export default AnalyticsPage;
