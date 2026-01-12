import React, { useState, useEffect } from 'react';
import {
  externalIntegrationsService,
  Emergency911Call,
  NGOIntake,
  SatelliteFeed,
  DroneTelemetry,
  IntegrationConnection
} from '../services/externalIntegrationsService';

/**
 * External Integrations Dashboard
 * 
 * Manages and visualizes data from:
 * - 911/Emergency dispatch systems
 * - NGO systems (Red Cross, UN OCHA, etc.)
 * - Satellite feeds (NASA FIRMS, Sentinel, etc.)
 * - Drone telemetry
 */
const ExternalIntegrations: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | '911' | 'ngo' | 'satellite' | 'drones' | 'connections'>('overview');
  const [integrations, setIntegrations] = useState<IntegrationConnection[]>([]);
  const [calls911, setCalls911] = useState<Emergency911Call[]>([]);
  const [ngoReports, setNGOReports] = useState<NGOIntake[]>([]);
  const [satelliteFeeds, setSatelliteFeeds] = useState<SatelliteFeed[]>([]);
  const [droneTelemetry, setDroneTelemetry] = useState<DroneTelemetry[]>([]);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setIntegrations(externalIntegrationsService.getIntegrations());
    setCalls911(externalIntegrationsService.get911Calls());
    setNGOReports(externalIntegrationsService.getNGOReports());
    setSatelliteFeeds(externalIntegrationsService.getSatelliteFeeds());
    setDroneTelemetry(externalIntegrationsService.getDroneTelemetry());
    setStats(externalIntegrationsService.getIngestionStats());
  };

  const handleSync = async (integrationId: string) => {
    const count = await externalIntegrationsService.syncIntegration(integrationId);
    alert(`Synced ${count} new records`);
    loadData();
  };

  const handleTestConnection = async (integrationId: string) => {
    const result = await externalIntegrationsService.testConnection(integrationId);
    alert(`${result.message}${result.latency ? ` (${result.latency}ms)` : ''}`);
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      active: '#10b981',
      inactive: '#6b7280',
      error: '#ef4444',
      pending_authorization: '#f59e0b'
    };
    return colors[status] || '#6b7280';
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>
            <span className="material-symbols-outlined" style={{ fontSize: 36, marginRight: 12 }}>
              hub
            </span>
            External Integrations
          </h1>
          <p style={styles.subtitle}>
            Ingest data from 911 dispatch, NGO systems, satellite feeds, and drone platforms
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div style={styles.tabs}>
        {[
          { id: 'overview', label: 'Overview', icon: 'dashboard' },
          { id: '911', label: '911 Dispatch', icon: 'call' },
          { id: 'ngo', label: 'NGO Systems', icon: 'volunteer_activism' },
          { id: 'satellite', label: 'Satellite Feeds', icon: 'satellite_alt' },
          { id: 'drones', label: 'Drone Telemetry', icon: 'airplanemode_active' },
          { id: 'connections', label: 'Connections', icon: 'link' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            style={{
              ...styles.tab,
              ...(activeTab === tab.id ? styles.tabActive : {})
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
              {tab.icon}
            </span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && stats && (
        <div style={styles.content}>
          {/* Stats Cards */}
          <div style={styles.statsGrid}>
            <div style={{ ...styles.statCard, ...styles.statCard911 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 48, opacity: 0.9 }}>
                call
              </span>
              <div style={styles.statValue}>{stats.calls911}</div>
              <div style={styles.statLabel}>911 Calls (24h)</div>
            </div>

            <div style={{ ...styles.statCard, ...styles.statCardNGO }}>
              <span className="material-symbols-outlined" style={{ fontSize: 48, opacity: 0.9 }}>
                volunteer_activism
              </span>
              <div style={styles.statValue}>{stats.ngoReports}</div>
              <div style={styles.statLabel}>NGO Reports</div>
            </div>

            <div style={{ ...styles.statCard, ...styles.statCardSatellite }}>
              <span className="material-symbols-outlined" style={{ fontSize: 48, opacity: 0.9 }}>
                satellite_alt
              </span>
              <div style={styles.statValue}>{stats.satelliteDetections}</div>
              <div style={styles.statLabel}>Satellite Detections</div>
            </div>

            <div style={{ ...styles.statCard, ...styles.statCardDrone }}>
              <span className="material-symbols-outlined" style={{ fontSize: 48, opacity: 0.9 }}>
                airplanemode_active
              </span>
              <div style={styles.statValue}>{stats.droneMissions}</div>
              <div style={styles.statLabel}>Active Drones</div>
            </div>
          </div>

          {/* Active Integrations */}
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>Active Integrations</h2>
            <div style={styles.integrationsGrid}>
              {integrations.filter(i => i.status === 'active').map(integration => (
                <div key={integration.id} style={styles.integrationCard}>
                  <div style={styles.integrationHeader}>
                    <div style={styles.integrationIcon} className={`bg-${integration.type.split('_')[0]}`}>
                      <span className="material-symbols-outlined">
                        {integration.type === '911_dispatch' ? 'call' :
                         integration.type === 'ngo_system' ? 'volunteer_activism' :
                         integration.type === 'satellite_feed' ? 'satellite_alt' : 'airplanemode_active'}
                      </span>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={styles.integrationName}>{integration.name}</div>
                      <div style={styles.integrationType}>{integration.type.replace('_', ' ')}</div>
                    </div>
                    <div style={{ ...styles.statusDot, background: getStatusColor(integration.status) }} />
                  </div>

                  <div style={styles.integrationStats}>
                    <div style={styles.integrationStat}>
                      <span style={styles.integrationStatLabel}>Records</span>
                      <span style={styles.integrationStatValue}>{integration.statistics.totalRecordsIngested}</span>
                    </div>
                    <div style={styles.integrationStat}>
                      <span style={styles.integrationStatLabel}>Uptime</span>
                      <span style={styles.integrationStatValue}>{integration.statistics.uptime}%</span>
                    </div>
                    <div style={styles.integrationStat}>
                      <span style={styles.integrationStatLabel}>Latency</span>
                      <span style={styles.integrationStatValue}>{integration.statistics.averageLatency}ms</span>
                    </div>
                  </div>

                  <div style={styles.integrationFooter}>
                    <span style={styles.lastSync}>
                      Last sync: {new Date(integration.statistics.lastSync).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 911 Calls Tab */}
      {activeTab === '911' && (
        <div style={styles.content}>
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>911 Emergency Calls</h2>
            <button style={styles.syncButton} onClick={() => handleSync(integrations.find(i => i.type === '911_dispatch')?.id || '')}>
              <span className="material-symbols-outlined">sync</span>
              Sync Now
            </button>
          </div>

          <div style={styles.tableContainer}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Time</th>
                  <th style={styles.th}>Type</th>
                  <th style={styles.th}>Priority</th>
                  <th style={styles.th}>Location</th>
                  <th style={styles.th}>Status</th>
                  <th style={styles.th}>Privacy</th>
                </tr>
              </thead>
              <tbody>
                {calls911.slice(0, 20).map(call => (
                  <tr key={call.id} style={styles.tr}>
                    <td style={styles.td}>{new Date(call.timestamp).toLocaleString()}</td>
                    <td style={styles.td}>{call.emergencyType}</td>
                    <td style={styles.td}>
                      <span style={{
                        ...styles.priorityBadge,
                        background: call.priority === 1 ? '#ef4444' : call.priority === 2 ? '#f59e0b' : '#3b82f6'
                      }}>
                        P{call.priority}
                      </span>
                    </td>
                    <td style={styles.td}>
                      {call.callerLocation.lat.toFixed(4)}, {call.callerLocation.lng.toFixed(4)}
                      <div style={styles.accuracy}>±{call.callerLocation.accuracy}m</div>
                    </td>
                    <td style={styles.td}>
                      <span style={styles.statusBadge}>{call.status}</span>
                    </td>
                    <td style={styles.td}>
                      <span style={styles.privacyBadge}>
                        {call.legalCompliance.privacyLevel === 'strictly_confidential' ? '🔒 Confidential' :
                         call.legalCompliance.privacyLevel === 'authorized_only' ? '🔐 Authorized' : '👁️ Public'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* NGO Reports Tab */}
      {activeTab === 'ngo' && (
        <div style={styles.content}>
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>NGO Incident Reports</h2>
            <div style={{ display: 'flex', gap: 8 }}>
              <button style={styles.syncButton} onClick={async () => {
                const count = await externalIntegrationsService.syncRedCrossData();
                alert(`Synced ${count} Red Cross reports`);
                loadData();
              }}>
                <span className="material-symbols-outlined">sync</span>
                Sync Red Cross
              </button>
              <button style={styles.syncButton} onClick={async () => {
                const count = await externalIntegrationsService.syncUNOCHAData();
                alert(`Synced ${count} UN OCHA reports`);
                loadData();
              }}>
                <span className="material-symbols-outlined">sync</span>
                Sync UN OCHA
              </button>
            </div>
          </div>

          <div style={styles.cardsGrid}>
            {ngoReports.map(report => (
              <div key={report.id} style={styles.ngoCard}>
                <div style={styles.ngoCardHeader}>
                  <div style={styles.ngoSource}>{report.organizationName}</div>
                  <div style={{
                    ...styles.severityBadge,
                    background: report.incidentReport.severity === 'catastrophic' ? '#7f1d1d' :
                                report.incidentReport.severity === 'major' ? '#ef4444' :
                                report.incidentReport.severity === 'moderate' ? '#f59e0b' : '#10b981'
                  }}>
                    {report.incidentReport.severity}
                  </div>
                </div>

                <h3 style={styles.ngoTitle}>{report.incidentReport.incidentType}</h3>
                <div style={styles.ngoLocation}>
                  📍 {report.incidentReport.location.region}, {report.incidentReport.location.country}
                </div>

                <div style={styles.ngoCasualties}>
                  {report.incidentReport.affectedPopulation > 0 && (
                    <div>👥 {report.incidentReport.affectedPopulation.toLocaleString()} affected</div>
                  )}
                  {report.incidentReport.casualties && (
                    <div style={{ display: 'flex', gap: 16, marginTop: 4 }}>
                      {report.incidentReport.casualties.deaths > 0 && <div>☠️ {report.incidentReport.casualties.deaths} deaths</div>}
                      {report.incidentReport.casualties.injured > 0 && <div>🤕 {report.incidentReport.casualties.injured} injured</div>}
                      {report.incidentReport.casualties.missing > 0 && <div>❓ {report.incidentReport.casualties.missing} missing</div>}
                    </div>
                  )}
                </div>

                <div style={styles.ngoNeeds}>
                  <strong>Urgent Needs:</strong>
                  <div style={styles.needsList}>
                    {report.incidentReport.needs.slice(0, 3).map((need, i) => (
                      <div key={i} style={styles.needItem}>
                        <span style={{
                          ...styles.urgencyDot,
                          background: need.urgency === 'immediate' ? '#ef4444' :
                                      need.urgency === 'urgent' ? '#f59e0b' : '#3b82f6'
                        }} />
                        {need.category}: {need.description}
                      </div>
                    ))}
                  </div>
                </div>

                <div style={styles.ngoFooter}>
                  <span style={styles.ngoTimestamp}>
                    {new Date(report.incidentReport.reportedAt).toLocaleString()}
                  </span>
                  <span style={styles.ngoContact}>
                    Contact: {report.incidentReport.contactPerson.name}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Satellite Feeds Tab */}
      {activeTab === 'satellite' && (
        <div style={styles.content}>
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>Satellite Detections</h2>
            <div style={{ display: 'flex', gap: 8 }}>
              <button style={styles.syncButton} onClick={async () => {
                await externalIntegrationsService.subscribeToNASAFIRMS({ north: 38, south: 37, east: -122, west: -123 });
                alert('Subscribed to NASA FIRMS fire detections');
                loadData();
              }}>
                <span className="material-symbols-outlined">whatshot</span>
                NASA FIRMS
              </button>
              <button style={styles.syncButton} onClick={async () => {
                await externalIntegrationsService.detectFloodsFromSentinel({ north: 38, south: 37, east: -122, west: -123 });
                alert('Analyzed Sentinel flood data');
                loadData();
              }}>
                <span className="material-symbols-outlined">water_damage</span>
                Sentinel Floods
              </button>
            </div>
          </div>

          <div style={styles.cardsGrid}>
            {satelliteFeeds.map(feed => (
              <div key={feed.id} style={styles.satelliteCard}>
                <div style={styles.satelliteHeader}>
                  <div style={styles.satelliteSource}>{feed.source.replace('_', ' ')}</div>
                  <div style={styles.satelliteSatellite}>🛰️ {feed.satellite}</div>
                </div>

                <h3 style={styles.satelliteType}>{feed.feedType.replace('_', ' ')}</h3>

                {feed.fireHotspot && (
                  <div style={styles.fireData}>
                    <div style={styles.fireMetric}>
                      <span className="material-symbols-outlined" style={{ color: '#ef4444' }}>whatshot</span>
                      <div>
                        <div style={styles.metricValue}>{feed.fireHotspot.confidence}%</div>
                        <div style={styles.metricLabel}>Confidence</div>
                      </div>
                    </div>
                    <div style={styles.fireMetric}>
                      <span className="material-symbols-outlined" style={{ color: '#f59e0b' }}>
                        thermostat
                      </span>
                      <div>
                        <div style={styles.metricValue}>{feed.fireHotspot.brightness}K</div>
                        <div style={styles.metricLabel}>Brightness</div>
                      </div>
                    </div>
                    <div style={styles.fireMetric}>
                      <span className="material-symbols-outlined" style={{ color: '#f97316' }}>
                        local_fire_department
                      </span>
                      <div>
                        <div style={styles.metricValue}>{feed.fireHotspot.frp} MW</div>
                        <div style={styles.metricLabel}>Fire Power</div>
                      </div>
                    </div>
                  </div>
                )}

                {feed.floodDetection && (
                  <div style={styles.floodData}>
                    <div style={styles.floodStat}>
                      <strong>Affected Area:</strong> {feed.floodDetection.affectedArea} km²
                    </div>
                    <div style={styles.floodStat}>
                      <strong>Water Level:</strong> +{feed.floodDetection.waterLevel}m above normal
                    </div>
                    <div style={styles.floodStat}>
                      <strong>Change Detection:</strong> {feed.floodDetection.changeDetection.changePercent}% increase
                    </div>
                    <div style={styles.floodStat}>
                      <strong>Confidence:</strong> {feed.floodDetection.confidence}%
                    </div>
                  </div>
                )}

                <div style={styles.satelliteFooter}>
                  <span style={styles.satelliteTime}>
                    Acquired: {new Date(feed.acquisitionTime).toLocaleString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Drone Telemetry Tab */}
      {activeTab === 'drones' && (
        <div style={styles.content}>
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>Drone Telemetry</h2>
            <div style={styles.activeDrones}>
              {externalIntegrationsService.getActiveDrones().length} active drones
            </div>
          </div>

          <div style={styles.dronesGrid}>
            {droneTelemetry.map(drone => (
              <div key={drone.id} style={styles.droneCard}>
                <div style={styles.droneHeader}>
                  <div style={styles.droneId}>
                    <span className="material-symbols-outlined">airplanemode_active</span>
                    {drone.droneId}
                  </div>
                  <div style={{
                    ...styles.flightModeBadge,
                    background: drone.telemetry.flightMode === 'manual' ? '#3b82f6' :
                                drone.telemetry.flightMode === 'emergency' ? '#ef4444' : '#10b981'
                  }}>
                    {drone.telemetry.flightMode}
                  </div>
                </div>

                <div style={styles.droneOperator}>
                  👤 {drone.operator.name}
                  {drone.operator.organization && ` (${drone.operator.organization})`}
                </div>

                <div style={styles.telemetryGrid}>
                  <div style={styles.telemetryItem}>
                    <span className="material-symbols-outlined" style={{ fontSize: 20, color: '#3b82f6' }}>
                      location_on
                    </span>
                    <div>
                      <div style={styles.telemetryValue}>{drone.telemetry.position.altitude}m</div>
                      <div style={styles.telemetryLabel}>Altitude</div>
                    </div>
                  </div>

                  <div style={styles.telemetryItem}>
                    <span className="material-symbols-outlined" style={{ fontSize: 20, color: '#10b981' }}>
                      speed
                    </span>
                    <div>
                      <div style={styles.telemetryValue}>{drone.telemetry.position.speed} m/s</div>
                      <div style={styles.telemetryLabel}>Speed</div>
                    </div>
                  </div>

                  <div style={styles.telemetryItem}>
                    <span className="material-symbols-outlined" style={{ fontSize: 20, color: '#f59e0b' }}>
                      battery_charging_full
                    </span>
                    <div>
                      <div style={styles.telemetryValue}>{drone.telemetry.battery.percentage}%</div>
                      <div style={styles.telemetryLabel}>Battery</div>
                    </div>
                  </div>

                  <div style={styles.telemetryItem}>
                    <span className="material-symbols-outlined" style={{ fontSize: 20, color: '#6366f1' }}>
                      satellite_alt
                    </span>
                    <div>
                      <div style={styles.telemetryValue}>{drone.telemetry.sensors.gps.satellites}</div>
                      <div style={styles.telemetryLabel}>GPS Sats</div>
                    </div>
                  </div>
                </div>

                {drone.mission && (
                  <div style={styles.mission}>
                    <div style={styles.missionType}>
                      📋 Mission: {drone.mission.type.replace('_', ' ')}
                    </div>
                    <div style={styles.progressBar}>
                      <div style={{
                        ...styles.progressFill,
                        width: `${drone.mission.coverage.completionPercent}%`
                      }} />
                    </div>
                    <div style={styles.completionText}>
                      {drone.mission.coverage.completionPercent}% complete
                    </div>
                  </div>
                )}

                <div style={styles.droneData}>
                  <div style={styles.dataItem}>
                    📷 {drone.data.photos.length} photos
                  </div>
                  <div style={styles.dataItem}>
                    🎥 {drone.data.videos.length} videos
                  </div>
                  {drone.data.lidarScans && drone.data.lidarScans.length > 0 && (
                    <div style={styles.dataItem}>
                      📡 {drone.data.lidarScans.length} LiDAR scans
                    </div>
                  )}
                </div>

                <div style={styles.droneFooter}>
                  <span style={styles.droneTimestamp}>
                    Updated: {new Date(drone.telemetry.timestamp).toLocaleTimeString()}
                  </span>
                  <span style={styles.compliance}>
                    ✅ {drone.compliance.registrationNumber}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Connections Tab */}
      {activeTab === 'connections' && (
        <div style={styles.content}>
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>Integration Connections</h2>
            <button style={styles.addButton}>
              <span className="material-symbols-outlined">add</span>
              Add Integration
            </button>
          </div>

          <div style={styles.connectionsList}>
            {integrations.map(integration => (
              <div key={integration.id} style={styles.connectionCard}>
                <div style={styles.connectionHeader}>
                  <div style={styles.connectionLeft}>
                    <div style={styles.connectionName}>{integration.name}</div>
                    <div style={styles.connectionType}>{integration.type.replace('_', ' ')}</div>
                    <div style={styles.connectionUrl}>{integration.endpoint.url}</div>
                  </div>
                  <div style={styles.connectionRight}>
                    <div style={{
                      ...styles.statusBadgeLarge,
                      background: getStatusColor(integration.status)
                    }}>
                      {integration.status.replace('_', ' ')}
                    </div>
                  </div>
                </div>

                <div style={styles.connectionDetails}>
                  <div style={styles.detailRow}>
                    <span style={styles.detailLabel}>Protocol:</span>
                    <span style={styles.detailValue}>{integration.endpoint.protocol}</span>
                  </div>
                  <div style={styles.detailRow}>
                    <span style={styles.detailLabel}>Auth:</span>
                    <span style={styles.detailValue}>{integration.endpoint.authMethod}</span>
                  </div>
                  <div style={styles.detailRow}>
                    <span style={styles.detailLabel}>Auto Ingestion:</span>
                    <span style={styles.detailValue}>
                      {integration.configuration.autoIngestion ? '✅ Enabled' : '❌ Disabled'}
                    </span>
                  </div>
                  {integration.configuration.pollingInterval && (
                    <div style={styles.detailRow}>
                      <span style={styles.detailLabel}>Polling:</span>
                      <span style={styles.detailValue}>Every {integration.configuration.pollingInterval}s</span>
                    </div>
                  )}
                </div>

                <div style={styles.connectionStats}>
                  <div style={styles.statItem}>
                    <div style={styles.statItemValue}>{integration.statistics.totalRecordsIngested}</div>
                    <div style={styles.statItemLabel}>Total Records</div>
                  </div>
                  <div style={styles.statItem}>
                    <div style={styles.statItemValue}>{integration.statistics.uptime}%</div>
                    <div style={styles.statItemLabel}>Uptime</div>
                  </div>
                  <div style={styles.statItem}>
                    <div style={styles.statItemValue}>{integration.statistics.averageLatency}ms</div>
                    <div style={styles.statItemLabel}>Latency</div>
                  </div>
                  <div style={styles.statItem}>
                    <div style={styles.statItemValue}>{integration.statistics.failedRecords}</div>
                    <div style={styles.statItemLabel}>Failures</div>
                  </div>
                </div>

                <div style={styles.connectionActions}>
                  <button
                    style={styles.actionButton}
                    onClick={() => handleTestConnection(integration.id)}
                  >
                    <span className="material-symbols-outlined">network_ping</span>
                    Test
                  </button>
                  <button
                    style={styles.actionButton}
                    onClick={() => handleSync(integration.id)}
                  >
                    <span className="material-symbols-outlined">sync</span>
                    Sync
                  </button>
                  <button style={styles.actionButton}>
                    <span className="material-symbols-outlined">settings</span>
                    Configure
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Global Styles */}
      <style>{`
        .bg-911 { background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); }
        .bg-ngo { background: linear-gradient(135deg, #10b981 0%, #059669 100%); }
        .bg-satellite { background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); }
        .bg-drone { background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); }
      `}</style>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    padding: '24px',
    color: '#fff',
    minHeight: '100vh'
  },
  header: {
    marginBottom: 24
  },
  title: {
    fontSize: 32,
    fontWeight: 800,
    margin: 0,
    display: 'flex',
    alignItems: 'center',
    color: '#fff'
  },
  subtitle: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 8
  },
  tabs: {
    display: 'flex',
    gap: 8,
    marginBottom: 24,
    borderBottom: '1px solid #374151',
    paddingBottom: 8,
    overflowX: 'auto'
  },
  tab: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '10px 16px',
    background: 'transparent',
    border: 'none',
    color: '#9ca3af',
    cursor: 'pointer',
    fontSize: 14,
    fontWeight: 600,
    borderRadius: '8px 8px 0 0',
    transition: 'all 0.2s ease',
    whiteSpace: 'nowrap'
  },
  tabActive: {
    background: '#374151',
    color: '#fff'
  },
  content: {
    background: '#1f2937',
    borderRadius: 16,
    padding: 24
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: 20,
    marginBottom: 32
  },
  statCard: {
    borderRadius: 12,
    padding: 24,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    color: '#fff'
  },
  statCard911: {
    background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
  },
  statCardNGO: {
    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
  },
  statCardSatellite: {
    background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)'
  },
  statCardDrone: {
    background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)'
  },
  statValue: {
    fontSize: 36,
    fontWeight: 800,
    marginTop: 12
  },
  statLabel: {
    fontSize: 13,
    opacity: 0.9,
    marginTop: 4,
    textAlign: 'center'
  },
  section: {
    marginBottom: 32
  },
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 700,
    margin: 0,
    color: '#fff'
  },
  integrationsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: 16
  },
  integrationCard: {
    background: '#111827',
    borderRadius: 12,
    padding: 16,
    border: '1px solid #374151'
  },
  integrationHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16
  },
  integrationIcon: {
    width: 48,
    height: 48,
    borderRadius: 10,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#fff',
    fontSize: 24
  },
  integrationName: {
    fontSize: 16,
    fontWeight: 700,
    color: '#fff'
  },
  integrationType: {
    fontSize: 12,
    color: '#9ca3af',
    textTransform: 'capitalize',
    marginTop: 2
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: '50%',
    marginLeft: 'auto'
  },
  integrationStats: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr',
    gap: 12,
    marginBottom: 12
  },
  integrationStat: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 4
  },
  integrationStatLabel: {
    fontSize: 11,
    color: '#9ca3af'
  },
  integrationStatValue: {
    fontSize: 16,
    fontWeight: 700,
    color: '#3b82f6'
  },
  integrationFooter: {
    paddingTop: 12,
    borderTop: '1px solid #374151',
    display: 'flex',
    justifyContent: 'space-between'
  },
  lastSync: {
    fontSize: 11,
    color: '#6b7280'
  },
  syncButton: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '10px 16px',
    background: '#3b82f6',
    border: 'none',
    borderRadius: 8,
    color: '#fff',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer'
  },
  addButton: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '10px 16px',
    background: '#10b981',
    border: 'none',
    borderRadius: 8,
    color: '#fff',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer'
  },
  tableContainer: {
    overflowX: 'auto'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse'
  },
  th: {
    textAlign: 'left',
    padding: 12,
    borderBottom: '2px solid #374151',
    fontSize: 12,
    fontWeight: 700,
    color: '#9ca3af',
    textTransform: 'uppercase',
    letterSpacing: 0.5
  },
  tr: {
    borderBottom: '1px solid #374151'
  },
  td: {
    padding: 12,
    fontSize: 14,
    color: '#d1d5db'
  },
  priorityBadge: {
    padding: '4px 8px',
    borderRadius: 4,
    fontSize: 11,
    fontWeight: 700,
    color: '#fff'
  },
  accuracy: {
    fontSize: 11,
    color: '#6b7280',
    marginTop: 2
  },
  statusBadge: {
    padding: '4px 8px',
    background: '#374151',
    borderRadius: 4,
    fontSize: 11,
    textTransform: 'capitalize'
  },
  privacyBadge: {
    fontSize: 12
  },
  cardsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
    gap: 20
  },
  ngoCard: {
    background: '#111827',
    borderRadius: 12,
    padding: 20,
    border: '1px solid #374151'
  },
  ngoCardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  ngoSource: {
    fontSize: 12,
    color: '#3b82f6',
    fontWeight: 600
  },
  severityBadge: {
    padding: '4px 12px',
    borderRadius: 12,
    fontSize: 11,
    fontWeight: 700,
    color: '#fff',
    textTransform: 'uppercase'
  },
  ngoTitle: {
    fontSize: 18,
    fontWeight: 700,
    margin: '0 0 8px 0',
    color: '#fff'
  },
  ngoLocation: {
    fontSize: 14,
    color: '#9ca3af',
    marginBottom: 12
  },
  ngoCasualties: {
    fontSize: 13,
    color: '#d1d5db',
    marginBottom: 16,
    padding: 12,
    background: '#1f2937',
    borderRadius: 8
  },
  ngoNeeds: {
    marginBottom: 16
  },
  needsList: {
    marginTop: 8
  },
  needItem: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 8,
    fontSize: 13,
    color: '#d1d5db',
    marginBottom: 8
  },
  urgencyDot: {
    width: 8,
    height: 8,
    borderRadius: '50%',
    marginTop: 6,
    flexShrink: 0
  },
  ngoFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTop: '1px solid #374151',
    fontSize: 11,
    color: '#6b7280'
  },
  ngoTimestamp: {},
  ngoContact: {},
  satelliteCard: {
    background: '#111827',
    borderRadius: 12,
    padding: 20,
    border: '1px solid #374151'
  },
  satelliteHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: 12
  },
  satelliteSource: {
    fontSize: 12,
    color: '#3b82f6',
    fontWeight: 600,
    textTransform: 'uppercase'
  },
  satelliteSatellite: {
    fontSize: 12,
    color: '#9ca3af'
  },
  satelliteType: {
    fontSize: 18,
    fontWeight: 700,
    margin: '0 0 16px 0',
    color: '#fff',
    textTransform: 'capitalize'
  },
  fireData: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr',
    gap: 12,
    marginBottom: 16
  },
  fireMetric: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    background: '#1f2937',
    borderRadius: 8
  },
  metricValue: {
    fontSize: 16,
    fontWeight: 700,
    color: '#fff'
  },
  metricLabel: {
    fontSize: 11,
    color: '#9ca3af',
    marginTop: 2
  },
  floodData: {
    padding: 12,
    background: '#1f2937',
    borderRadius: 8,
    marginBottom: 16
  },
  floodStat: {
    fontSize: 13,
    color: '#d1d5db',
    marginBottom: 8
  },
  satelliteFooter: {
    paddingTop: 12,
    borderTop: '1px solid #374151'
  },
  satelliteTime: {
    fontSize: 11,
    color: '#6b7280'
  },
  activeDrones: {
    padding: '8px 16px',
    background: '#10b981',
    borderRadius: 20,
    fontSize: 13,
    fontWeight: 600,
    color: '#fff'
  },
  dronesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
    gap: 20
  },
  droneCard: {
    background: '#111827',
    borderRadius: 12,
    padding: 20,
    border: '1px solid #374151'
  },
  droneHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  droneId: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    fontSize: 16,
    fontWeight: 700,
    color: '#fff'
  },
  flightModeBadge: {
    padding: '4px 12px',
    borderRadius: 12,
    fontSize: 11,
    fontWeight: 700,
    color: '#fff',
    textTransform: 'uppercase'
  },
  droneOperator: {
    fontSize: 13,
    color: '#9ca3af',
    marginBottom: 16
  },
  telemetryGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 12,
    marginBottom: 16
  },
  telemetryItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    background: '#1f2937',
    borderRadius: 8
  },
  telemetryValue: {
    fontSize: 16,
    fontWeight: 700,
    color: '#fff'
  },
  telemetryLabel: {
    fontSize: 11,
    color: '#9ca3af',
    marginTop: 2
  },
  mission: {
    padding: 12,
    background: '#1f2937',
    borderRadius: 8,
    marginBottom: 16
  },
  missionType: {
    fontSize: 13,
    color: '#d1d5db',
    marginBottom: 8,
    textTransform: 'capitalize'
  },
  progressBar: {
    height: 6,
    background: '#374151',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 6
  },
  progressFill: {
    height: '100%',
    background: 'linear-gradient(90deg, #3b82f6 0%, #2563eb 100%)',
    transition: 'width 0.3s ease'
  },
  completionText: {
    fontSize: 11,
    color: '#9ca3af'
  },
  droneData: {
    display: 'flex',
    gap: 16,
    marginBottom: 16,
    fontSize: 13,
    color: '#d1d5db'
  },
  dataItem: {},
  droneFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTop: '1px solid #374151',
    fontSize: 11,
    color: '#6b7280'
  },
  droneTimestamp: {},
  compliance: {},
  connectionsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 20
  },
  connectionCard: {
    background: '#111827',
    borderRadius: 12,
    padding: 20,
    border: '1px solid #374151'
  },
  connectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: 16
  },
  connectionLeft: {
    flex: 1
  },
  connectionName: {
    fontSize: 18,
    fontWeight: 700,
    color: '#fff',
    marginBottom: 4
  },
  connectionType: {
    fontSize: 13,
    color: '#3b82f6',
    textTransform: 'capitalize',
    marginBottom: 4
  },
  connectionUrl: {
    fontSize: 12,
    color: '#6b7280',
    fontFamily: 'monospace'
  },
  connectionRight: {},
  statusBadgeLarge: {
    padding: '8px 16px',
    borderRadius: 20,
    fontSize: 12,
    fontWeight: 700,
    color: '#fff',
    textTransform: 'capitalize'
  },
  connectionDetails: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 12,
    marginBottom: 16,
    padding: 16,
    background: '#1f2937',
    borderRadius: 8
  },
  detailRow: {
    display: 'flex',
    justifyContent: 'space-between'
  },
  detailLabel: {
    fontSize: 13,
    color: '#9ca3af'
  },
  detailValue: {
    fontSize: 13,
    color: '#fff',
    fontWeight: 600
  },
  connectionStats: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: 12,
    marginBottom: 16
  },
  statItem: {
    textAlign: 'center',
    padding: 12,
    background: '#1f2937',
    borderRadius: 8
  },
  statItemValue: {
    fontSize: 20,
    fontWeight: 700,
    color: '#3b82f6',
    marginBottom: 4
  },
  statItemLabel: {
    fontSize: 11,
    color: '#9ca3af'
  },
  connectionActions: {
    display: 'flex',
    gap: 8
  },
  actionButton: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: '10px 16px',
    background: '#374151',
    border: 'none',
    borderRadius: 8,
    color: '#fff',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer'
  }
};

export default ExternalIntegrations;
