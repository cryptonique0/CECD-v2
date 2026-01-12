/**
 * External Integrations Service
 * 
 * Handles ingestion from external emergency systems:
 * - 911/Emergency dispatch systems (E911, Next Generation 911)
 * - NGO systems (Red Cross, UN OCHA, etc.)
 * - Satellite feeds (NASA FIRMS, Sentinel, etc.)
 * - Drone telemetry (DJI FlightHub, custom UAVs)
 * 
 * All integrations respect legal boundaries and data privacy regulations.
 */

export interface Emergency911Call {
  id: string;
  callId: string; // External system's call ID
  timestamp: number;
  callerPhone: string; // Anonymized based on jurisdiction
  callerLocation: {
    lat: number;
    lng: number;
    accuracy: number; // meters
    source: 'cell_tower' | 'gps' | 'wifi' | 'manual';
  };
  callType: 'voice' | 'text' | 'video' | 'sos_button';
  emergencyType: string;
  transcription?: string; // AI-generated transcription
  audioUrl?: string; // Secure link (requires authorization)
  dispatchCenter: string;
  assignedUnits?: string[];
  priority: 1 | 2 | 3 | 4 | 5; // 1 = highest
  status: 'received' | 'dispatched' | 'en_route' | 'on_scene' | 'resolved';
  callerConsent?: {
    shareWithCommunity: boolean;
    anonymousReporting: boolean;
  };
  legalCompliance: {
    jurisdiction: string;
    consentObtained: boolean;
    dataRetentionDays: number;
    privacyLevel: 'public' | 'authorized_only' | 'strictly_confidential';
  };
}

export interface NGOIntake {
  id: string;
  source: 'red_cross' | 'un_ocha' | 'msf' | 'oxfam' | 'care' | 'save_the_children' | 'custom';
  organizationName: string;
  apiEndpoint?: string;
  incidentReport: {
    reportId: string;
    reportedAt: number;
    location: {
      lat: number;
      lng: number;
      address?: string;
      region: string;
      country: string;
    };
    incidentType: string;
    severity: 'minor' | 'moderate' | 'major' | 'catastrophic';
    affectedPopulation: number;
    casualties?: {
      deaths: number;
      injured: number;
      missing: number;
    };
    needs: {
      category: 'shelter' | 'food' | 'water' | 'medical' | 'sanitation' | 'protection' | 'logistics';
      urgency: 'immediate' | 'urgent' | 'moderate' | 'low';
      quantity?: number;
      description: string;
    }[];
    assessment: string;
    contactPerson: {
      name: string;
      role: string;
      phone: string;
      email: string;
    };
  };
  dataSharing: {
    allowPublicView: boolean;
    allowCrossOrganization: boolean;
    restrictedToMembers: boolean;
  };
  standardFormat: 'EDXL-DE' | 'CAP' | 'OCHA_3W' | 'custom'; // Emergency data exchange standards
}

export interface SatelliteFeed {
  id: string;
  source: 'nasa_firms' | 'sentinel_hub' | 'noaa_goes' | 'esa_copernicus' | 'planet_labs' | 'maxar';
  feedType: 'fire_hotspots' | 'flood_detection' | 'deforestation' | 'land_change' | 'weather' | 'multispectral';
  timestamp: number;
  acquisitionTime: number;
  satellite: string; // e.g., "VIIRS", "MODIS", "Sentinel-2", "Landsat-8"
  
  // Fire hotspot data
  fireHotspot?: {
    lat: number;
    lng: number;
    confidence: number; // 0-100
    brightness: number; // Kelvin
    frp: number; // Fire Radiative Power (MW)
    dayNight: 'D' | 'N';
    detectionType: 'thermal' | 'smoke' | 'combined';
  };
  
  // Flood detection data
  floodDetection?: {
    boundingBox: {
      north: number;
      south: number;
      east: number;
      west: number;
    };
    affectedArea: number; // square km
    waterLevel?: number; // meters above normal
    confidence: number; // 0-100
    changeDetection: {
      before: string; // Image URL
      after: string; // Image URL
      changePercent: number;
    };
  };
  
  // General imagery
  imagery?: {
    url: string;
    resolution: number; // meters per pixel
    bands: string[]; // e.g., ["red", "green", "blue", "nir"]
    cloudCover: number; // percentage
    previewUrl: string;
  };
  
  metadata: {
    license: string;
    attribution: string;
    apiKey?: string;
    refreshRate: number; // minutes
  };
}

export interface DroneTelemetry {
  id: string;
  droneId: string;
  operator: {
    id: string;
    name: string;
    certifications: string[];
    organization?: string;
  };
  missionId?: string;
  incidentId?: string;
  
  // Real-time position and status
  telemetry: {
    timestamp: number;
    position: {
      lat: number;
      lng: number;
      altitude: number; // meters AGL (Above Ground Level)
      heading: number; // degrees (0-360)
      speed: number; // m/s
    };
    battery: {
      percentage: number;
      voltage: number;
      estimatedFlightTime: number; // minutes
    };
    sensors: {
      gps: {
        satellites: number;
        hdop: number; // Horizontal Dilution of Precision
        fixType: '2D' | '3D' | 'RTK' | 'none';
      };
      camera?: {
        isRecording: boolean;
        resolution: string;
        gimbalPitch: number; // degrees
        gimbalYaw: number;
        zoom: number;
      };
      thermal?: {
        enabled: boolean;
        minTemp: number;
        maxTemp: number;
        palette: string;
      };
      lidar?: {
        enabled: boolean;
        pointCloudUrl?: string;
      };
    };
    flightMode: 'manual' | 'gps' | 'waypoint' | 'orbit' | 'return_to_home' | 'emergency';
    warnings: string[];
  };
  
  // Mission data
  mission?: {
    type: 'survey' | 'search_rescue' | 'damage_assessment' | 'delivery' | 'monitoring';
    waypoints: {
      lat: number;
      lng: number;
      altitude: number;
      action?: string;
    }[];
    coverage: {
      type: 'area' | 'linear' | 'point';
      geometry: any; // GeoJSON
      completionPercent: number;
    };
  };
  
  // Captured data
  data: {
    photos: {
      id: string;
      timestamp: number;
      lat: number;
      lng: number;
      altitude: number;
      url: string;
      thumbnailUrl: string;
      type: 'rgb' | 'thermal' | 'multispectral';
      annotations?: {
        detections: {
          type: 'person' | 'vehicle' | 'fire' | 'damage' | 'obstacle';
          confidence: number;
          boundingBox: [number, number, number, number];
        }[];
      };
    }[];
    videos: {
      id: string;
      startTime: number;
      duration: number; // seconds
      url: string;
      thumbnailUrl: string;
      type: 'rgb' | 'thermal';
    }[];
    lidarScans?: {
      id: string;
      timestamp: number;
      pointCloudUrl: string;
      coverage: any; // GeoJSON
    }[];
  };
  
  compliance: {
    registrationNumber: string;
    flightAuthorization: string;
    noFlyZoneCheck: boolean;
    altitudeLimitCompliance: boolean;
    privacyConsiderations: string[];
  };
}

export interface IntegrationConnection {
  id: string;
  name: string;
  type: '911_dispatch' | 'ngo_system' | 'satellite_feed' | 'drone_platform';
  status: 'active' | 'inactive' | 'error' | 'pending_authorization';
  
  endpoint: {
    url: string;
    protocol: 'REST' | 'WebSocket' | 'MQTT' | 'AMQP' | 'gRPC';
    authMethod: 'api_key' | 'oauth2' | 'mutual_tls' | 'saml';
    rateLimits?: {
      requestsPerMinute: number;
      requestsPerDay: number;
    };
  };
  
  configuration: {
    autoIngestion: boolean;
    pollingInterval?: number; // seconds
    webhookUrl?: string;
    filters?: Record<string, any>;
    fieldMapping?: Record<string, string>;
  };
  
  statistics: {
    lastSync: number;
    totalRecordsIngested: number;
    failedRecords: number;
    averageLatency: number; // ms
    uptime: number; // percentage
  };
  
  legalAgreements: {
    dataUsageAgreement: boolean;
    privacyPolicy: boolean;
    termsOfService: boolean;
    mou?: string; // Memorandum of Understanding
    expirationDate?: number;
  };
}

interface ExternalIntegrationsService {
  // 911/Emergency Dispatch
  ingest911Call(callData: Partial<Emergency911Call>): Promise<Emergency911Call>;
  get911Calls(filters?: { dateFrom?: number; dateTo?: number; priority?: number }): Emergency911Call[];
  anonymize911Data(call: Emergency911Call, jurisdiction: string): Emergency911Call;
  
  // NGO Systems
  ingestNGOReport(reportData: Partial<NGOIntake>): Promise<NGOIntake>;
  getNGOReports(filters?: { source?: string; severity?: string }): NGOIntake[];
  syncRedCrossData(): Promise<number>; // Returns number of new records
  syncUNOCHAData(): Promise<number>;
  
  // Satellite Feeds
  ingestSatelliteFeed(feedData: Partial<SatelliteFeed>): Promise<SatelliteFeed>;
  getSatelliteFeeds(filters?: { source?: string; feedType?: string; dateFrom?: number }): SatelliteFeed[];
  subscribeToNASAFIRMS(region: { north: number; south: number; east: number; west: number }): Promise<void>;
  detectFloodsFromSentinel(region: any): Promise<SatelliteFeed[]>;
  
  // Drone Telemetry
  ingestDroneTelemetry(telemetryData: Partial<DroneTelemetry>): Promise<DroneTelemetry>;
  getDroneTelemetry(filters?: { droneId?: string; incidentId?: string; active?: boolean }): DroneTelemetry[];
  getActiveDrones(): DroneTelemetry[];
  getDroneMedia(droneId: string, type?: 'photos' | 'videos' | 'lidar'): any[];
  
  // Connection Management
  addIntegration(connection: Partial<IntegrationConnection>): IntegrationConnection;
  getIntegrations(type?: IntegrationConnection['type']): IntegrationConnection[];
  testConnection(integrationId: string): Promise<{ success: boolean; message: string; latency?: number }>;
  syncIntegration(integrationId: string): Promise<number>;
  
  // Data transformation
  transformToIncident(externalData: Emergency911Call | NGOIntake | SatelliteFeed | DroneTelemetry): any;
  
  // Analytics
  getIngestionStats(timeRange: number): {
    calls911: number;
    ngoReports: number;
    satelliteDetections: number;
    droneMissions: number;
    totalRecords: number;
  };
}

class ExternalIntegrationsServiceImpl implements ExternalIntegrationsService {
  private calls911: Map<string, Emergency911Call> = new Map();
  private ngoReports: Map<string, NGOIntake> = new Map();
  private satelliteFeeds: Map<string, SatelliteFeed> = new Map();
  private droneTelemetry: Map<string, DroneTelemetry> = new Map();
  private integrations: Map<string, IntegrationConnection> = new Map();
  
  constructor() {
    this.seedMockData();
  }
  
  // ===== 911/Emergency Dispatch =====
  
  async ingest911Call(callData: Partial<Emergency911Call>): Promise<Emergency911Call> {
    const call: Emergency911Call = {
      id: `CALL-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      callId: callData.callId || `911-${Date.now()}`,
      timestamp: callData.timestamp || Date.now(),
      callerPhone: this.anonymizePhone(callData.callerPhone || '***-***-****'),
      callerLocation: callData.callerLocation || {
        lat: 37.7749,
        lng: -122.4194,
        accuracy: 50,
        source: 'gps'
      },
      callType: callData.callType || 'voice',
      emergencyType: callData.emergencyType || 'Unknown Emergency',
      transcription: callData.transcription,
      audioUrl: callData.audioUrl,
      dispatchCenter: callData.dispatchCenter || 'Central Dispatch',
      assignedUnits: callData.assignedUnits || [],
      priority: callData.priority || 3,
      status: callData.status || 'received',
      callerConsent: callData.callerConsent || {
        shareWithCommunity: false,
        anonymousReporting: true
      },
      legalCompliance: callData.legalCompliance || {
        jurisdiction: 'US-CA',
        consentObtained: true,
        dataRetentionDays: 90,
        privacyLevel: 'authorized_only'
      }
    };
    
    this.calls911.set(call.id, call);
    console.log(`[911 Ingestion] Call ${call.id} ingested: ${call.emergencyType}`);
    return call;
  }
  
  get911Calls(filters?: { dateFrom?: number; dateTo?: number; priority?: number }): Emergency911Call[] {
    let calls = Array.from(this.calls911.values());
    
    if (filters?.dateFrom) {
      calls = calls.filter(c => c.timestamp >= filters.dateFrom!);
    }
    if (filters?.dateTo) {
      calls = calls.filter(c => c.timestamp <= filters.dateTo!);
    }
    if (filters?.priority) {
      calls = calls.filter(c => c.priority === filters.priority);
    }
    
    return calls.sort((a, b) => b.timestamp - a.timestamp);
  }
  
  anonymize911Data(call: Emergency911Call, jurisdiction: string): Emergency911Call {
    // Apply jurisdiction-specific anonymization rules
    const anonymized = { ...call };
    
    if (jurisdiction === 'EU' || jurisdiction.startsWith('EU-')) {
      // GDPR compliance: full anonymization
      anonymized.callerPhone = '***-***-****';
      anonymized.transcription = anonymized.transcription?.replace(/\b[A-Z][a-z]+ [A-Z][a-z]+\b/g, '[REDACTED]');
      anonymized.audioUrl = undefined;
    } else if (jurisdiction.startsWith('US-')) {
      // US: Partial anonymization, last 4 digits may be visible to authorized personnel
      anonymized.callerPhone = `***-***-${call.callerPhone.slice(-4)}`;
    }
    
    return anonymized;
  }
  
  // ===== NGO Systems =====
  
  async ingestNGOReport(reportData: Partial<NGOIntake>): Promise<NGOIntake> {
    const report: NGOIntake = {
      id: `NGO-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      source: reportData.source || 'custom',
      organizationName: reportData.organizationName || 'Partner NGO',
      apiEndpoint: reportData.apiEndpoint,
      incidentReport: reportData.incidentReport || {
        reportId: `RPT-${Date.now()}`,
        reportedAt: Date.now(),
        location: {
          lat: 0,
          lng: 0,
          region: 'Unknown',
          country: 'Unknown'
        },
        incidentType: 'Unknown',
        severity: 'moderate',
        affectedPopulation: 0,
        needs: [],
        assessment: '',
        contactPerson: {
          name: 'Contact',
          role: 'Coordinator',
          phone: '',
          email: ''
        }
      },
      dataSharing: reportData.dataSharing || {
        allowPublicView: false,
        allowCrossOrganization: true,
        restrictedToMembers: false
      },
      standardFormat: reportData.standardFormat || 'custom'
    };
    
    this.ngoReports.set(report.id, report);
    console.log(`[NGO Ingestion] Report ${report.id} from ${report.organizationName}`);
    return report;
  }
  
  getNGOReports(filters?: { source?: string; severity?: string }): NGOIntake[] {
    let reports = Array.from(this.ngoReports.values());
    
    if (filters?.source) {
      reports = reports.filter(r => r.source === filters.source);
    }
    if (filters?.severity) {
      reports = reports.filter(r => r.incidentReport.severity === filters.severity);
    }
    
    return reports.sort((a, b) => b.incidentReport.reportedAt - a.incidentReport.reportedAt);
  }
  
  async syncRedCrossData(): Promise<number> {
    // Simulate API call to Red Cross systems
    console.log('[Red Cross Sync] Fetching data from Red Cross API...');
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Mock: Ingest 3 new reports
    const mockReports = [
      {
        source: 'red_cross' as const,
        organizationName: 'American Red Cross',
        incidentReport: {
          reportId: 'RC-2026-001',
          reportedAt: Date.now() - 3600000,
          location: {
            lat: 34.0522,
            lng: -118.2437,
            address: 'Los Angeles, CA',
            region: 'Southern California',
            country: 'USA'
          },
          incidentType: 'Wildfire',
          severity: 'major' as const,
          affectedPopulation: 12000,
          casualties: { deaths: 2, injured: 15, missing: 3 },
          needs: [
            {
              category: 'shelter' as const,
              urgency: 'immediate' as const,
              quantity: 500,
              description: 'Emergency shelter for evacuated families'
            },
            {
              category: 'medical' as const,
              urgency: 'urgent' as const,
              quantity: 200,
              description: 'Burn treatment supplies and respiratory masks'
            }
          ],
          assessment: 'Large wildfire spreading rapidly due to high winds. Multiple neighborhoods evacuated.',
          contactPerson: {
            name: 'Maria Rodriguez',
            role: 'Disaster Response Coordinator',
            phone: '+1-555-0123',
            email: 'maria.rodriguez@redcross.org'
          }
        },
        standardFormat: 'CAP' as const
      }
    ];
    
    for (const report of mockReports) {
      await this.ingestNGOReport(report);
    }
    
    return mockReports.length;
  }
  
  async syncUNOCHAData(): Promise<number> {
    console.log('[UN OCHA Sync] Fetching data from UN OCHA API...');
    await new Promise(resolve => setTimeout(resolve, 1200));
    return 2; // Mock: 2 new reports
  }
  
  // ===== Satellite Feeds =====
  
  async ingestSatelliteFeed(feedData: Partial<SatelliteFeed>): Promise<SatelliteFeed> {
    const feed: SatelliteFeed = {
      id: `SAT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      source: feedData.source || 'nasa_firms',
      feedType: feedData.feedType || 'fire_hotspots',
      timestamp: feedData.timestamp || Date.now(),
      acquisitionTime: feedData.acquisitionTime || Date.now() - 600000,
      satellite: feedData.satellite || 'VIIRS',
      fireHotspot: feedData.fireHotspot,
      floodDetection: feedData.floodDetection,
      imagery: feedData.imagery,
      metadata: feedData.metadata || {
        license: 'Public Domain',
        attribution: 'NASA',
        refreshRate: 60
      }
    };
    
    this.satelliteFeeds.set(feed.id, feed);
    console.log(`[Satellite Ingestion] ${feed.feedType} from ${feed.source}`);
    return feed;
  }
  
  getSatelliteFeeds(filters?: { source?: string; feedType?: string; dateFrom?: number }): SatelliteFeed[] {
    let feeds = Array.from(this.satelliteFeeds.values());
    
    if (filters?.source) {
      feeds = feeds.filter(f => f.source === filters.source);
    }
    if (filters?.feedType) {
      feeds = feeds.filter(f => f.feedType === filters.feedType);
    }
    if (filters?.dateFrom) {
      feeds = feeds.filter(f => f.timestamp >= filters.dateFrom!);
    }
    
    return feeds.sort((a, b) => b.timestamp - a.timestamp);
  }
  
  async subscribeToNASAFIRMS(region: { north: number; south: number; east: number; west: number }): Promise<void> {
    console.log('[NASA FIRMS] Subscribing to fire hotspot data for region:', region);
    
    // Simulate subscribing to NASA FIRMS active fire data
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Mock: Ingest 5 fire hotspots
    const hotspots = [
      { lat: 37.8, lng: -122.4, confidence: 85, brightness: 340, frp: 15.5 },
      { lat: 37.82, lng: -122.38, confidence: 92, brightness: 358, frp: 22.3 },
      { lat: 37.79, lng: -122.42, confidence: 78, brightness: 325, frp: 12.1 }
    ];
    
    for (const hotspot of hotspots) {
      await this.ingestSatelliteFeed({
        source: 'nasa_firms',
        feedType: 'fire_hotspots',
        satellite: 'VIIRS',
        fireHotspot: {
          ...hotspot,
          dayNight: 'D',
          detectionType: 'thermal'
        }
      });
    }
    
    console.log(`[NASA FIRMS] Ingested ${hotspots.length} fire hotspots`);
  }
  
  async detectFloodsFromSentinel(region: any): Promise<SatelliteFeed[]> {
    console.log('[Sentinel] Analyzing flood detection...');
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const floodFeed = await this.ingestSatelliteFeed({
      source: 'sentinel_hub',
      feedType: 'flood_detection',
      satellite: 'Sentinel-1',
      floodDetection: {
        boundingBox: region,
        affectedArea: 45.2,
        waterLevel: 2.5,
        confidence: 88,
        changeDetection: {
          before: 'https://sentinel.example.com/before.tif',
          after: 'https://sentinel.example.com/after.tif',
          changePercent: 67
        }
      }
    });
    
    return [floodFeed];
  }
  
  // ===== Drone Telemetry =====
  
  async ingestDroneTelemetry(telemetryData: Partial<DroneTelemetry>): Promise<DroneTelemetry> {
    const telemetry: DroneTelemetry = {
      id: `DRONE-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      droneId: telemetryData.droneId || `UAV-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
      operator: telemetryData.operator || {
        id: 'operator-1',
        name: 'John Pilot',
        certifications: ['Part 107', 'Emergency Response']
      },
      missionId: telemetryData.missionId,
      incidentId: telemetryData.incidentId,
      telemetry: telemetryData.telemetry || {
        timestamp: Date.now(),
        position: {
          lat: 37.7749,
          lng: -122.4194,
          altitude: 120,
          heading: 180,
          speed: 12
        },
        battery: {
          percentage: 75,
          voltage: 22.8,
          estimatedFlightTime: 18
        },
        sensors: {
          gps: {
            satellites: 12,
            hdop: 0.8,
            fixType: '3D'
          }
        },
        flightMode: 'gps',
        warnings: []
      },
      mission: telemetryData.mission,
      data: telemetryData.data || {
        photos: [],
        videos: [],
        lidarScans: []
      },
      compliance: telemetryData.compliance || {
        registrationNumber: 'FA123456789',
        flightAuthorization: 'LAANC-2026-001',
        noFlyZoneCheck: true,
        altitudeLimitCompliance: true,
        privacyConsiderations: ['No residential photography below 200ft']
      }
    };
    
    this.droneTelemetry.set(telemetry.id, telemetry);
    console.log(`[Drone Telemetry] ${telemetry.droneId} ingested`);
    return telemetry;
  }
  
  getDroneTelemetry(filters?: { droneId?: string; incidentId?: string; active?: boolean }): DroneTelemetry[] {
    let telemetry = Array.from(this.droneTelemetry.values());
    
    if (filters?.droneId) {
      telemetry = telemetry.filter(t => t.droneId === filters.droneId);
    }
    if (filters?.incidentId) {
      telemetry = telemetry.filter(t => t.incidentId === filters.incidentId);
    }
    if (filters?.active) {
      // Active drones have telemetry from last 5 minutes
      const cutoff = Date.now() - 300000;
      telemetry = telemetry.filter(t => t.telemetry.timestamp >= cutoff);
    }
    
    return telemetry.sort((a, b) => b.telemetry.timestamp - a.telemetry.timestamp);
  }
  
  getActiveDrones(): DroneTelemetry[] {
    return this.getDroneTelemetry({ active: true });
  }
  
  getDroneMedia(droneId: string, type?: 'photos' | 'videos' | 'lidar'): any[] {
    const drone = Array.from(this.droneTelemetry.values()).find(t => t.droneId === droneId);
    if (!drone) return [];
    
    if (type === 'photos') return drone.data.photos;
    if (type === 'videos') return drone.data.videos;
    if (type === 'lidar') return drone.data.lidarScans || [];
    
    return [...drone.data.photos, ...drone.data.videos];
  }
  
  // ===== Connection Management =====
  
  addIntegration(connection: Partial<IntegrationConnection>): IntegrationConnection {
    const integration: IntegrationConnection = {
      id: `INT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: connection.name || 'New Integration',
      type: connection.type || '911_dispatch',
      status: connection.status || 'pending_authorization',
      endpoint: connection.endpoint || {
        url: '',
        protocol: 'REST',
        authMethod: 'api_key'
      },
      configuration: connection.configuration || {
        autoIngestion: false
      },
      statistics: connection.statistics || {
        lastSync: 0,
        totalRecordsIngested: 0,
        failedRecords: 0,
        averageLatency: 0,
        uptime: 0
      },
      legalAgreements: connection.legalAgreements || {
        dataUsageAgreement: false,
        privacyPolicy: false,
        termsOfService: false
      }
    };
    
    this.integrations.set(integration.id, integration);
    return integration;
  }
  
  getIntegrations(type?: IntegrationConnection['type']): IntegrationConnection[] {
    let integrations = Array.from(this.integrations.values());
    
    if (type) {
      integrations = integrations.filter(i => i.type === type);
    }
    
    return integrations;
  }
  
  async testConnection(integrationId: string): Promise<{ success: boolean; message: string; latency?: number }> {
    const integration = this.integrations.get(integrationId);
    if (!integration) {
      return { success: false, message: 'Integration not found' };
    }
    
    const startTime = Date.now();
    
    // Simulate connection test
    await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 500));
    
    const latency = Date.now() - startTime;
    const success = Math.random() > 0.1; // 90% success rate
    
    return {
      success,
      message: success ? 'Connection successful' : 'Connection failed: Timeout',
      latency: success ? latency : undefined
    };
  }
  
  async syncIntegration(integrationId: string): Promise<number> {
    const integration = this.integrations.get(integrationId);
    if (!integration) return 0;
    
    console.log(`[Sync] Starting sync for ${integration.name}...`);
    
    let recordsIngested = 0;
    
    if (integration.type === '911_dispatch') {
      // Mock: Sync 5 new 911 calls
      for (let i = 0; i < 5; i++) {
        await this.ingest911Call({
          emergencyType: ['Medical Emergency', 'Fire', 'Traffic Accident'][i % 3],
          priority: (Math.floor(Math.random() * 3) + 1) as any
        });
        recordsIngested++;
      }
    } else if (integration.type === 'ngo_system') {
      recordsIngested = await this.syncRedCrossData();
    } else if (integration.type === 'satellite_feed') {
      await this.subscribeToNASAFIRMS({ north: 38, south: 37, east: -122, west: -123 });
      recordsIngested = 3;
    }
    
    integration.statistics.lastSync = Date.now();
    integration.statistics.totalRecordsIngested += recordsIngested;
    
    return recordsIngested;
  }
  
  // ===== Data Transformation =====
  
  transformToIncident(externalData: Emergency911Call | NGOIntake | SatelliteFeed | DroneTelemetry): any {
    // Transform external data to internal incident format
    if ('callId' in externalData) {
      // 911 Call
      return {
        id: `INC-911-${externalData.id}`,
        title: externalData.emergencyType,
        category: this.mapEmergencyTypeToCategory(externalData.emergencyType),
        severity: this.mapPriorityToSeverity(externalData.priority),
        location: {
          lat: externalData.callerLocation.lat,
          lng: externalData.callerLocation.lng
        },
        reportedAt: externalData.timestamp,
        source: '911_dispatch',
        externalId: externalData.callId
      };
    } else if ('incidentReport' in externalData) {
      // NGO Report
      const report = externalData.incidentReport;
      return {
        id: `INC-NGO-${externalData.id}`,
        title: `${report.incidentType} - ${report.location.region}`,
        category: report.incidentType,
        severity: this.mapNGOSeverity(report.severity),
        location: {
          lat: report.location.lat,
          lng: report.location.lng
        },
        reportedAt: report.reportedAt,
        source: externalData.source,
        externalId: report.reportId,
        affectedPopulation: report.affectedPopulation
      };
    } else if ('fireHotspot' in externalData || 'floodDetection' in externalData) {
      // Satellite Feed
      return {
        id: `INC-SAT-${externalData.id}`,
        title: `${externalData.feedType.replace('_', ' ')} detected`,
        category: externalData.feedType.includes('fire') ? 'Fire' : 'Flood',
        severity: 'High',
        location: externalData.fireHotspot 
          ? { lat: externalData.fireHotspot.lat, lng: externalData.fireHotspot.lng }
          : { lat: 0, lng: 0 },
        reportedAt: externalData.timestamp,
        source: externalData.source,
        confidence: externalData.fireHotspot?.confidence || externalData.floodDetection?.confidence
      };
    }
    
    return null;
  }
  
  // ===== Analytics =====
  
  getIngestionStats(timeRange: number = 86400000): {
    calls911: number;
    ngoReports: number;
    satelliteDetections: number;
    droneMissions: number;
    totalRecords: number;
  } {
    const cutoff = Date.now() - timeRange;
    
    const calls911 = Array.from(this.calls911.values()).filter(c => c.timestamp >= cutoff).length;
    const ngoReports = Array.from(this.ngoReports.values()).filter(r => r.incidentReport.reportedAt >= cutoff).length;
    const satelliteDetections = Array.from(this.satelliteFeeds.values()).filter(f => f.timestamp >= cutoff).length;
    const droneMissions = Array.from(this.droneTelemetry.values()).filter(d => d.telemetry.timestamp >= cutoff).length;
    
    return {
      calls911,
      ngoReports,
      satelliteDetections,
      droneMissions,
      totalRecords: calls911 + ngoReports + satelliteDetections + droneMissions
    };
  }
  
  // ===== Helper Methods =====
  
  private anonymizePhone(phone: string): string {
    return phone.replace(/\d{3}-\d{3}-\d{4}/, '***-***-****');
  }
  
  private mapEmergencyTypeToCategory(type: string): string {
    const mapping: Record<string, string> = {
      'Medical Emergency': 'Medical',
      'Fire': 'Fire',
      'Traffic Accident': 'Security',
      'Assault': 'Security',
      'Burglary': 'Theft'
    };
    return mapping[type] || 'Other';
  }
  
  private mapPriorityToSeverity(priority: number): string {
    if (priority === 1) return 'Critical';
    if (priority === 2) return 'High';
    if (priority === 3) return 'Medium';
    return 'Low';
  }
  
  private mapNGOSeverity(severity: string): string {
    const mapping: Record<string, string> = {
      'catastrophic': 'Critical',
      'major': 'High',
      'moderate': 'Medium',
      'minor': 'Low'
    };
    return mapping[severity] || 'Medium';
  }
  
  private seedMockData(): void {
    // Add pre-configured integrations
    this.addIntegration({
      name: 'San Francisco 911 Dispatch',
      type: '911_dispatch',
      status: 'active',
      endpoint: {
        url: 'https://sf911.example.com/api/v1',
        protocol: 'WebSocket',
        authMethod: 'mutual_tls',
        rateLimits: { requestsPerMinute: 1000, requestsPerDay: 50000 }
      },
      configuration: {
        autoIngestion: true,
        webhookUrl: 'https://cecd.example.com/webhook/911'
      },
      statistics: {
        lastSync: Date.now() - 300000,
        totalRecordsIngested: 1247,
        failedRecords: 3,
        averageLatency: 145,
        uptime: 99.8
      },
      legalAgreements: {
        dataUsageAgreement: true,
        privacyPolicy: true,
        termsOfService: true,
        mou: 'MOU-SF-2026-001'
      }
    });
    
    this.addIntegration({
      name: 'American Red Cross Integration',
      type: 'ngo_system',
      status: 'active',
      endpoint: {
        url: 'https://api.redcross.org/v2',
        protocol: 'REST',
        authMethod: 'oauth2',
        rateLimits: { requestsPerMinute: 60, requestsPerDay: 10000 }
      },
      configuration: {
        autoIngestion: true,
        pollingInterval: 300,
        filters: { region: 'California', severity: ['major', 'catastrophic'] }
      },
      statistics: {
        lastSync: Date.now() - 600000,
        totalRecordsIngested: 89,
        failedRecords: 0,
        averageLatency: 520,
        uptime: 100
      },
      legalAgreements: {
        dataUsageAgreement: true,
        privacyPolicy: true,
        termsOfService: true
      }
    });
    
    this.addIntegration({
      name: 'NASA FIRMS Fire Detection',
      type: 'satellite_feed',
      status: 'active',
      endpoint: {
        url: 'https://firms.modaps.eosdis.nasa.gov/api',
        protocol: 'REST',
        authMethod: 'api_key'
      },
      configuration: {
        autoIngestion: true,
        pollingInterval: 600
      },
      statistics: {
        lastSync: Date.now() - 900000,
        totalRecordsIngested: 342,
        failedRecords: 2,
        averageLatency: 2300,
        uptime: 99.5
      },
      legalAgreements: {
        dataUsageAgreement: true,
        privacyPolicy: true,
        termsOfService: true
      }
    });
    
    this.addIntegration({
      name: 'DJI FlightHub Integration',
      type: 'drone_platform',
      status: 'active',
      endpoint: {
        url: 'wss://flighthub.dji.com/ws',
        protocol: 'WebSocket',
        authMethod: 'api_key'
      },
      configuration: {
        autoIngestion: true,
        webhookUrl: 'https://cecd.example.com/webhook/drone'
      },
      statistics: {
        lastSync: Date.now() - 60000,
        totalRecordsIngested: 156,
        failedRecords: 1,
        averageLatency: 180,
        uptime: 98.9
      },
      legalAgreements: {
        dataUsageAgreement: true,
        privacyPolicy: true,
        termsOfService: true
      }
    });
    
    // Seed some sample data
    this.ingest911Call({
      emergencyType: 'Structure Fire',
      priority: 1,
      status: 'dispatched',
      callerLocation: {
        lat: 37.7749,
        lng: -122.4194,
        accuracy: 25,
        source: 'gps'
      }
    });
  }
}

export const externalIntegrationsService = new ExternalIntegrationsServiceImpl();
