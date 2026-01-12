import React, { useState, useMemo } from 'react';
import { alertManagementService, Alert, AlertRule } from '../services/alertManagementService';
import { useNavigate } from 'react-router-dom';

const AlertsManager: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'alerts' | 'rules' | 'config'>('alerts');
  const [showNewRuleForm, setShowNewRuleForm] = useState(false);
  const [newRuleName, setNewRuleName] = useState('');
  const [newRuleCondition, setNewRuleCondition] = useState('');
  const [newRuleThreshold, setNewRuleThreshold] = useState('10');
  const [newRuleSeverity, setNewRuleSeverity] = useState<'critical' | 'warning' | 'info'>('warning');

  const alerts = alertManagementService.getAlerts();
  const rules = alertManagementService.getRules();
  const unacknowledgedAlerts = alertManagementService.getUnacknowledgedAlerts();

  const stats = useMemo(() => {
    return {
      total: alerts.length,
      critical: alerts.filter(a => a.severity === 'critical').length,
      warning: alerts.filter(a => a.severity === 'warning').length,
      info: alerts.filter(a => a.severity === 'info').length,
      unacknowledged: unacknowledgedAlerts.length,
      ruleCount: rules.length,
      enabledRules: rules.filter(r => r.enabled).length,
    };
  }, [alerts, unacknowledgedAlerts, rules]);

  const handleCreateRule = (e: React.FormEvent) => {
    e.preventDefault();
    const rule: AlertRule = {
      id: `rule-${Date.now()}`,
      name: newRuleName,
      condition: newRuleCondition,
      threshold: parseInt(newRuleThreshold),
      severity: newRuleSeverity,
      enabled: true,
      createdAt: Date.now(),
      triggeredCount: 0,
    };
    alertManagementService.createRule(rule);
    setNewRuleName('');
    setNewRuleCondition('');
    setNewRuleThreshold('10');
    setShowNewRuleForm(false);
  };

  const handleToggleRule = (ruleId: string) => {
    const rule = rules.find(r => r.id === ruleId);
    if (rule) {
      alertManagementService.updateRule(ruleId, { ...rule, enabled: !rule.enabled });
    }
  };

  const handleDeleteRule = (ruleId: string) => {
    alertManagementService.deleteRule(ruleId);
  };

  const handleAcknowledgeAlert = (alertId: string) => {
    alertManagementService.acknowledgeAlert(alertId);
  };

  const handleResolveAlert = (alertId: string) => {
    alertManagementService.resolveAlert(alertId);
  };

  return (
    <div className="p-6 md:p-8 flex flex-col gap-6 h-full">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight italic uppercase">Alert Management</h1>
          <p className="text-text-secondary text-sm mt-1">Configure rules, monitor alerts, and manage system notifications</p>
        </div>
        <button
          onClick={() => navigate('/dashboard')}
          className="px-4 py-2 rounded-lg border border-border-dark text-text-secondary hover:text-white transition-colors flex items-center gap-2 w-fit"
        >
          <span className="material-symbols-outlined text-sm">arrow_back</span>
          Back to Dashboard
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-card-dark border border-border-dark rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-text-secondary text-[10px] font-bold uppercase tracking-wider">Total Alerts</p>
              <p className="text-white text-2xl font-black mt-1">{stats.total}</p>
            </div>
            <span className="material-symbols-outlined text-3xl text-primary/30">notifications</span>
          </div>
          <div className="flex gap-2 mt-3 text-[10px]">
            <span className="px-2 py-1 rounded bg-accent-red/20 text-accent-red font-semibold">{stats.critical} Critical</span>
            <span className="px-2 py-1 rounded bg-accent-orange/20 text-accent-orange font-semibold">{stats.warning} Warning</span>
          </div>
        </div>

        <div className="bg-card-dark border border-border-dark rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-text-secondary text-[10px] font-bold uppercase tracking-wider">Unacknowledged</p>
              <p className="text-accent-red text-2xl font-black mt-1">{stats.unacknowledged}</p>
            </div>
            <span className="material-symbols-outlined text-3xl text-accent-red/30">warning</span>
          </div>
          <p className="text-text-secondary text-[10px] mt-3">Need immediate attention</p>
        </div>

        <div className="bg-card-dark border border-border-dark rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-text-secondary text-[10px] font-bold uppercase tracking-wider">Active Rules</p>
              <p className="text-primary text-2xl font-black mt-1">{stats.enabledRules}/{stats.ruleCount}</p>
            </div>
            <span className="material-symbols-outlined text-3xl text-primary/30">rule</span>
          </div>
          <p className="text-text-secondary text-[10px] mt-3">Monitoring system triggers</p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 border-b border-border-dark overflow-x-auto pb-4">
        {[
          { id: 'alerts', label: 'Active Alerts', icon: 'warning' },
          { id: 'rules', label: 'Alert Rules', icon: 'rule' },
          { id: 'config', label: 'Configuration', icon: 'settings' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-primary/20 border-primary/50 text-primary font-semibold'
                : 'border-border-dark text-text-secondary hover:border-primary/30 hover:text-white'
            }`}
          >
            <span className="material-symbols-outlined text-sm">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Alerts Tab */}
      {activeTab === 'alerts' && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-white">Active Alerts</h3>
            <div className="flex gap-2 text-[10px]">
              <span className="px-3 py-1 rounded-full bg-slate-800 border border-border-dark text-text-secondary">
                {alerts.length} Total
              </span>
              <span className="px-3 py-1 rounded-full bg-accent-red/10 border border-accent-red/30 text-accent-red font-semibold">
                {unacknowledgedAlerts.length} Unacknowledged
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-3 max-h-96 overflow-y-auto">
            {alerts.length === 0 ? (
              <div className="p-6 text-center border border-dashed border-border-dark rounded-2xl">
                <span className="material-symbols-outlined text-4xl text-white/20 mb-2 block">check_circle</span>
                <p className="text-text-secondary">No active alerts</p>
              </div>
            ) : (
              alerts.map(alert => (
                <div
                  key={alert.id}
                  className={`p-4 rounded-xl border ${
                    alert.severity === 'critical'
                      ? 'bg-accent-red/10 border-accent-red/30'
                      : alert.severity === 'warning'
                      ? 'bg-accent-orange/10 border-accent-orange/30'
                      : 'bg-accent-blue/10 border-accent-blue/30'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className={`text-[10px] font-black uppercase px-2 py-0.5 rounded border ${
                            alert.severity === 'critical'
                              ? 'bg-accent-red/20 text-accent-red border-accent-red/40'
                              : alert.severity === 'warning'
                              ? 'bg-accent-orange/20 text-accent-orange border-accent-orange/40'
                              : 'bg-accent-blue/20 text-accent-blue border-accent-blue/40'
                          }`}
                        >
                          {alert.severity}
                        </span>
                        <p className="text-sm font-bold text-white">{alert.title}</p>
                      </div>
                      <p className="text-[10px] text-text-secondary mt-1">{alert.message}</p>
                      <p className="text-[9px] text-text-secondary/50 mt-2">
                        Triggered: {new Date(alert.timestamp).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {!alert.acknowledged && (
                        <button
                          onClick={() => handleAcknowledgeAlert(alert.id)}
                          className="px-3 py-1 rounded-lg bg-primary/20 text-primary text-[10px] font-semibold hover:bg-primary/30 transition-all"
                        >
                          Acknowledge
                        </button>
                      )}
                      {alert.status === 'active' && (
                        <button
                          onClick={() => handleResolveAlert(alert.id)}
                          className="px-3 py-1 rounded-lg bg-emerald-500/20 text-emerald-400 text-[10px] font-semibold hover:bg-emerald-500/30 transition-all"
                        >
                          Resolve
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Rules Tab */}
      {activeTab === 'rules' && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-white">Alert Rules</h3>
            <button
              onClick={() => setShowNewRuleForm(!showNewRuleForm)}
              className="px-4 py-2 rounded-lg bg-primary/20 text-primary text-[10px] font-semibold hover:bg-primary/30 transition-all flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-sm">add</span>
              New Rule
            </button>
          </div>

          {showNewRuleForm && (
            <form onSubmit={handleCreateRule} className="p-4 rounded-2xl bg-card-dark border border-primary/20 flex flex-col gap-4">
              <div>
                <label className="text-[10px] font-semibold text-text-secondary uppercase">Rule Name</label>
                <input
                  type="text"
                  value={newRuleName}
                  onChange={e => setNewRuleName(e.target.value)}
                  placeholder="e.g., High Temperature Alert"
                  className="w-full mt-1 px-3 py-2 rounded-lg bg-background-dark border border-border-dark text-white text-sm placeholder-text-secondary/50 focus:border-primary/50 outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-semibold text-text-secondary uppercase">Condition</label>
                  <input
                    type="text"
                    value={newRuleCondition}
                    onChange={e => setNewRuleCondition(e.target.value)}
                    placeholder="e.g., temperature > 50"
                    className="w-full mt-1 px-3 py-2 rounded-lg bg-background-dark border border-border-dark text-white text-sm placeholder-text-secondary/50 focus:border-primary/50 outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="text-[10px] font-semibold text-text-secondary uppercase">Threshold</label>
                  <input
                    type="number"
                    value={newRuleThreshold}
                    onChange={e => setNewRuleThreshold(e.target.value)}
                    className="w-full mt-1 px-3 py-2 rounded-lg bg-background-dark border border-border-dark text-white text-sm focus:border-primary/50 outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-semibold text-text-secondary uppercase">Severity</label>
                <select
                  value={newRuleSeverity}
                  onChange={e => setNewRuleSeverity(e.target.value as any)}
                  className="w-full mt-1 px-3 py-2 rounded-lg bg-background-dark border border-border-dark text-white text-sm focus:border-primary/50 outline-none"
                >
                  <option value="info">Info</option>
                  <option value="warning">Warning</option>
                  <option value="critical">Critical</option>
                </select>
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-lg bg-primary text-white font-semibold hover:bg-primary-dark transition-all"
                >
                  Create Rule
                </button>
                <button
                  type="button"
                  onClick={() => setShowNewRuleForm(false)}
                  className="flex-1 py-2 rounded-lg border border-border-dark text-text-secondary hover:text-white transition-all"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          <div className="flex flex-col gap-3">
            {rules.length === 0 ? (
              <div className="p-6 text-center border border-dashed border-border-dark rounded-2xl">
                <span className="material-symbols-outlined text-4xl text-white/20 mb-2 block">rule</span>
                <p className="text-text-secondary">No alert rules configured</p>
              </div>
            ) : (
              rules.map(rule => (
                <div key={rule.id} className="p-4 rounded-xl bg-card-dark border border-border-dark flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="text-sm font-bold text-white">{rule.name}</h4>
                      <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase border ${
                        rule.enabled
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                          : 'bg-slate-700 text-text-secondary border-border-dark'
                      }`}>
                        {rule.enabled ? 'Enabled' : 'Disabled'}
                      </span>
                    </div>
                    <p className="text-[10px] text-text-secondary">{rule.condition} (threshold: {rule.threshold})</p>
                    <p className="text-[9px] text-text-secondary/50 mt-1">Triggered {rule.triggeredCount} times</p>
                  </div>
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => handleToggleRule(rule.id)}
                      className={`px-3 py-1 rounded-lg text-[10px] font-semibold transition-all ${
                        rule.enabled
                          ? 'bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30'
                          : 'bg-slate-800 text-text-secondary hover:bg-slate-700 border border-border-dark'
                      }`}
                    >
                      {rule.enabled ? 'Disable' : 'Enable'}
                    </button>
                    <button
                      onClick={() => handleDeleteRule(rule.id)}
                      className="px-3 py-1 rounded-lg bg-accent-red/10 text-accent-red text-[10px] font-semibold hover:bg-accent-red/20 transition-all"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Configuration Tab */}
      {activeTab === 'config' && (
        <div className="flex flex-col gap-4">
          <h3 className="text-lg font-bold text-white">Alert Configuration</h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="p-6 rounded-2xl bg-card-dark border border-border-dark">
              <h4 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined">notifications</span>
                Notification Settings
              </h4>
              <div className="space-y-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" defaultChecked className="rounded border-border-dark" />
                  <span className="text-[10px] font-semibold text-text-secondary">Email notifications</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" defaultChecked className="rounded border-border-dark" />
                  <span className="text-[10px] font-semibold text-text-secondary">SMS alerts for critical</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" defaultChecked className="rounded border-border-dark" />
                  <span className="text-[10px] font-semibold text-text-secondary">In-app notifications</span>
                </label>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-card-dark border border-border-dark">
              <h4 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined">schedule</span>
                Alert Retention
              </h4>
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-semibold text-text-secondary block mb-2">Keep alerts for</label>
                  <select className="w-full px-3 py-2 rounded-lg bg-background-dark border border-border-dark text-white text-sm">
                    <option>7 days</option>
                    <option>30 days</option>
                    <option>90 days</option>
                    <option>Forever</option>
                  </select>
                </div>
                <button className="w-full py-2 rounded-lg bg-primary/20 text-primary text-[10px] font-semibold hover:bg-primary/30 transition-all">
                  Cleanup Old Alerts
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AlertsManager;
