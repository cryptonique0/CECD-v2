export interface EnvironmentalHazard {
  id: string;
  type: 'weather' | 'earthquake' | 'flood' | 'air_quality' | 'chemical' | 'biological';
  severity: 'low' | 'medium' | 'high' | 'critical';
  location: {
    lat: number;
    lng: number;
    radius: number; // km
    name: string;
  };
  description: string;
  startTime: number;
  estimatedEndTime?: number;
  affectedIncidents: string[];
  recommendations: string[];
  metadata: Record<string, any>;
}

export interface WeatherAlert {
  id: string;
  type: 'storm' | 'tornado' | 'hurricane' | 'blizzard' | 'extreme_heat' | 'extreme_cold' | 'fog' | 'hail';
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: number;
  location: { lat: number; lng: number; name: string };
  description: string;
  windSpeed?: number; // km/h
  visibility?: number; // meters
  temperature?: number; // celsius
  coverage: number; // km radius
}

export interface AirQualityData {
  location: { lat: number; lng: number; name: string };
  aqi: number; // 0-500+
  level: 'good' | 'moderate' | 'unhealthy_sensitive' | 'unhealthy' | 'very_unhealthy' | 'hazardous';
  pollutants: Record<string, number>;
  timestamp: number;
}

interface EnvironmentalAlertsService {
  reportHazard(hazard: Omit<EnvironmentalHazard, 'id'>): EnvironmentalHazard;
  getHazards(type?: string, severity?: string): EnvironmentalHazard[];
  getHazardsNearLocation(lat: number, lng: number, radiusKm: number): EnvironmentalHazard[];
  updateHazard(hazardId: string, updates: Partial<EnvironmentalHazard>): EnvironmentalHazard | null;
  resolveHazard(hazardId: string): void;
  addWeatherAlert(alert: Omit<WeatherAlert, 'id' | 'timestamp'>): WeatherAlert;
  getWeatherAlerts(): WeatherAlert[];
  getWeatherAlertsForLocation(lat: number, lng: number): WeatherAlert[];
  updateAirQuality(data: AirQualityData): void;
  getAirQualityAtLocation(lat: number, lng: number): AirQualityData | null;
  getIncidentEnvironmentalContext(incidentId: string, lat: number, lng: number): { hazards: EnvironmentalHazard[]; weather: WeatherAlert[]; airQuality: AirQualityData | null };
  generateSafetyRecommendations(hazards: EnvironmentalHazard[], weather: WeatherAlert[]): string[];
  forecastHazardSpread(hazardId: string, hours: number): Array<{ timestamp: number; affectedArea: number }>;
}

class EnvironmentalAlertsServiceImpl implements EnvironmentalAlertsService {
  private hazards: Map<string, EnvironmentalHazard> = new Map();
  private weatherAlerts: Map<string, WeatherAlert> = new Map();
  private airQualityData: Map<string, AirQualityData> = new Map();
  private hazardCounter = 0;
  private weatherCounter = 0;

  constructor() {
    this.initializeSampleData();
  }

  private initializeSampleData() {
    // Add some sample hazards
    const sampleHazard = this.reportHazard({
      type: 'weather',
      severity: 'high',
      location: {
        lat: 40.7128,
        lng: -74.006,
        radius: 25,
        name: 'New York Metropolitan Area',
      },
      description: 'Storm system moving through region with heavy rain expected',
      startTime: Date.now(),
      estimatedEndTime: Date.now() + 6 * 60 * 60 * 1000,
      affectedIncidents: [],
      recommendations: ['Activate drainage protocols', 'Alert flood response teams', 'Increase staff availability'],
      metadata: {
        windSpeed: 60,
        rainfall: 50, // mm
        source: 'NOAA',
      },
    });

    // Add weather alert
    this.addWeatherAlert({
      type: 'storm',
      severity: 'high',
      location: { lat: 40.7128, lng: -74.006, name: 'New York' },
      description: 'Severe thunderstorm warning',
      windSpeed: 60,
      visibility: 1000,
      temperature: 18,
      coverage: 50,
    });

    // Add air quality data
    this.updateAirQuality({
      location: { lat: 40.7128, lng: -74.006, name: 'New York' },
      aqi: 142,
      level: 'unhealthy_sensitive',
      pollutants: {
        PM2_5: 52.3,
        O3: 45.2,
        NO2: 38.1,
      },
      timestamp: Date.now(),
    });
  }

  reportHazard(hazard: Omit<EnvironmentalHazard, 'id'>): EnvironmentalHazard {
    const fullHazard: EnvironmentalHazard = {
      id: `hazard-${++this.hazardCounter}`,
      ...hazard,
    };
    this.hazards.set(fullHazard.id, fullHazard);
    return fullHazard;
  }

  getHazards(type?: string, severity?: string): EnvironmentalHazard[] {
    let results = Array.from(this.hazards.values());
    if (type) results = results.filter(h => h.type === type);
    if (severity) results = results.filter(h => h.severity === severity);
    return results;
  }

  getHazardsNearLocation(lat: number, lng: number, radiusKm: number): EnvironmentalHazard[] {
    return Array.from(this.hazards.values()).filter(h => {
      const distance = this.haversineDistance(lat, lng, h.location.lat, h.location.lng);
      return distance <= radiusKm + h.location.radius;
    });
  }

  private haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371; // Earth's radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  updateHazard(hazardId: string, updates: Partial<EnvironmentalHazard>): EnvironmentalHazard | null {
    const hazard = this.hazards.get(hazardId);
    if (!hazard) return null;
    const updated = { ...hazard, ...updates };
    this.hazards.set(hazardId, updated);
    return updated;
  }

  resolveHazard(hazardId: string): void {
    const hazard = this.hazards.get(hazardId);
    if (hazard) {
      hazard.estimatedEndTime = Date.now();
    }
  }

  addWeatherAlert(alert: Omit<WeatherAlert, 'id' | 'timestamp'>): WeatherAlert {
    const fullAlert: WeatherAlert = {
      id: `weather-${++this.weatherCounter}`,
      timestamp: Date.now(),
      ...alert,
    };
    this.weatherAlerts.set(fullAlert.id, fullAlert);
    return fullAlert;
  }

  getWeatherAlerts(): WeatherAlert[] {
    return Array.from(this.weatherAlerts.values());
  }

  getWeatherAlertsForLocation(lat: number, lng: number): WeatherAlert[] {
    return Array.from(this.weatherAlerts.values()).filter(w => {
      const distance = this.haversineDistance(lat, lng, w.location.lat, w.location.lng);
      return distance <= w.coverage;
    });
  }

  updateAirQuality(data: AirQualityData): void {
    const key = `${Math.round(data.location.lat * 10)}-${Math.round(data.location.lng * 10)}`;
    this.airQualityData.set(key, data);
  }

  getAirQualityAtLocation(lat: number, lng: number): AirQualityData | null {
    const key = `${Math.round(lat * 10)}-${Math.round(lng * 10)}`;
    return this.airQualityData.get(key) || null;
  }

  getIncidentEnvironmentalContext(incidentId: string, lat: number, lng: number) {
    return {
      hazards: this.getHazardsNearLocation(lat, lng, 50),
      weather: this.getWeatherAlertsForLocation(lat, lng),
      airQuality: this.getAirQualityAtLocation(lat, lng),
    };
  }

  generateSafetyRecommendations(hazards: EnvironmentalHazard[], weather: WeatherAlert[]): string[] {
    const recommendations: string[] = [];

    hazards.forEach(h => {
      if (h.type === 'flood') {
        recommendations.push('Avoid low-lying areas', 'Position teams on higher ground', 'Have evacuation routes ready');
      } else if (h.type === 'weather') {
        recommendations.push('Use weather-appropriate protective gear', 'Increase communication frequency');
      } else if (h.type === 'air_quality') {
        recommendations.push('Use respiratory protection', 'Limit outdoor exposure');
      }
    });

    weather.forEach(w => {
      if (w.type === 'storm' || w.type === 'tornado') {
        recommendations.push('Take shelter immediately', 'Activate indoor facilities');
      } else if (w.type === 'extreme_heat') {
        recommendations.push('Increase hydration', 'Provide cooling stations', 'Reduce physical exertion');
      } else if (w.type === 'blizzard') {
        recommendations.push('Activate cold-weather protocol', 'Ensure heating facilities available');
      }
    });

    return [...new Set(recommendations)]; // Remove duplicates
  }

  forecastHazardSpread(hazardId: string, hours: number): Array<{ timestamp: number; affectedArea: number }> {
    const hazard = this.hazards.get(hazardId);
    if (!hazard) return [];

    const forecast: Array<{ timestamp: number; affectedArea: number }> = [];
    const hoursPerStep = 1;
    let currentRadius = hazard.location.radius;

    for (let i = 0; i <= hours; i += hoursPerStep) {
      const expandRate = 0.5; // km/hour
      currentRadius += expandRate * hoursPerStep;
      const area = Math.PI * Math.pow(currentRadius, 2);

      forecast.push({
        timestamp: hazard.startTime + i * 60 * 60 * 1000,
        affectedArea: Math.round(area),
      });
    }

    return forecast;
  }
}

export const environmentalAlertsService = new EnvironmentalAlertsServiceImpl();
