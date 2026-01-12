// geospatialIntelligenceService.ts
// Live drone feeds, satellite imagery, AI-based hazard detection, mapping overlays

export interface DroneFeed {
  id: string;
  streamUrl: string;
  lat: number;
  lng: number;
  altitude: number;
  timestamp: number;
}

export interface SatelliteImage {
  id: string;
  imageUrl: string;
  bounds: [[number, number], [number, number]]; // [[southWest], [northEast]]
  type: 'fire' | 'flood' | 'general';
  confidence: number;
  timestamp: number;
}

export interface HazardDetection {
  id: string;
  type: 'fire' | 'flood' | 'chemical' | 'earthquake';
  location: { lat: number; lng: number };
  severity: number; // 0-100
  detectedBy: 'ai' | 'human' | 'satellite' | 'drone';
  timestamp: number;
}

class GeospatialIntelligenceService {
  private droneFeeds: DroneFeed[] = [];
  private satelliteImages: SatelliteImage[] = [];
  private hazardDetections: HazardDetection[] = [];

  addDroneFeed(feed: DroneFeed) {
    this.droneFeeds.push(feed);
  }
  getDroneFeeds(): DroneFeed[] {
    return this.droneFeeds;
  }

  addSatelliteImage(img: SatelliteImage) {
    this.satelliteImages.push(img);
  }
  getSatelliteImages(): SatelliteImage[] {
    return this.satelliteImages;
  }

  addHazardDetection(hazard: HazardDetection) {
    this.hazardDetections.push(hazard);
  }
  getHazardDetections(): HazardDetection[] {
    return this.hazardDetections;
  }
}

export const geospatialIntelligenceService = new GeospatialIntelligenceService();
