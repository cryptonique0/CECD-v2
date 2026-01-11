import { Incident, User } from "../types";
import { playbookService } from "./playbookService";

export type AssetType = 'Vehicle' | 'Generator' | 'MedicalKit' | 'FuelTruck' | 'WaterPump';
export type AssetStatus = 'Available' | 'Assigned' | 'Maintenance' | 'LowFuel';

export interface Asset {
  id: string;
  name: string;
  type: AssetType;
  status: AssetStatus;
  locationName: string;
  lat?: number;
  lng?: number;
  fuelPct?: number; // vehicles/generators
  stockCount?: number; // kits
  capacity?: { people?: number; kW?: number; liters?: number };
  assignedIncidentId?: string;
  lastUpdated: number;
}

function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const R = 6371; // km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

const assets: Map<string, Asset> = new Map([
  ['A-V1', { id: 'A-V1', name: 'Responder Van 1', type: 'Vehicle', status: 'Available', locationName: 'New York, USA', lat: 40.71, lng: -74.0, fuelPct: 65, capacity: { people: 8 }, lastUpdated: Date.now() }],
  ['A-V2', { id: 'A-V2', name: 'Responder Truck', type: 'Vehicle', status: 'LowFuel', locationName: 'London, UK', lat: 51.50, lng: -0.12, fuelPct: 22, capacity: { people: 3 }, lastUpdated: Date.now() }],
  ['A-G1', { id: 'A-G1', name: 'Generator 5kW', type: 'Generator', status: 'Available', locationName: 'London, UK', lat: 51.51, lng: -0.13, fuelPct: 55, capacity: { kW: 5 }, lastUpdated: Date.now() }],
  ['A-M1', { id: 'A-M1', name: 'Medical Kit Alpha', type: 'MedicalKit', status: 'Available', locationName: 'Beijing, China', stockCount: 12, lastUpdated: Date.now() }],
  ['A-F1', { id: 'A-F1', name: 'Fuel Truck 10k L', type: 'FuelTruck', status: 'Available', locationName: 'New York, USA', lat: 40.70, lng: -74.02, capacity: { liters: 10000 }, lastUpdated: Date.now() }]
]);

export const resourceLogisticsService = {
  listAssets(): Asset[] {
    return Array.from(assets.values());
  },
  getAsset(id: string): Asset | undefined {
    return assets.get(id);
  },
  addAsset(asset: Asset): void {
    assets.set(asset.id, asset);
  },
  updateFuel(id: string, fuelPct: number): void {
    const asset = assets.get(id);
    if (!asset) return;
    asset.fuelPct = Math.max(0, Math.min(100, fuelPct));
    asset.status = (asset.fuelPct || 0) < 25 ? 'LowFuel' : asset.status === 'LowFuel' ? 'Available' : asset.status;
    asset.lastUpdated = Date.now();
  },
  updateStatus(id: string, status: AssetStatus): void {
    const asset = assets.get(id);
    if (!asset) return;
    asset.status = status;
    asset.lastUpdated = Date.now();
  },
  assignToIncident(id: string, incident: Incident): void {
    const asset = assets.get(id);
    if (!asset) return;
    asset.assignedIncidentId = incident.id;
    asset.status = 'Assigned';
    asset.lastUpdated = Date.now();
  },
  unassign(id: string): void {
    const asset = assets.get(id);
    if (!asset) return;
    asset.assignedIncidentId = undefined;
    asset.status = 'Available';
    asset.lastUpdated = Date.now();
  },
  getIncidentAssets(incidentId: string): Asset[] {
    return this.listAssets().filter(a => a.assignedIncidentId === incidentId);
  },

  /** Forecast shortages based on playbook resource needs vs assets */
  forecastShortages(incidents: Incident[], volunteers: User[]): Array<{ region: string; shortages: string[] }> {
    const results: Array<{ region: string; shortages: string[] }> = [];
    const byRegion = new Map<string, { incidents: Incident[]; assets: Asset[] }>();
    incidents.forEach(inc => {
      const region = inc.locationName;
      const entry = byRegion.get(region) || { incidents: [], assets: [] };
      entry.incidents.push(inc);
      byRegion.set(region, entry);
    });
    this.listAssets().forEach(a => {
      const entry = byRegion.get(a.locationName) || { incidents: [], assets: [] };
      entry.assets.push(a);
      byRegion.set(a.locationName, entry);
    });

    for (const [region, data] of byRegion.entries()) {
      const required = new Set<string>();
      data.incidents.slice(0, 5).forEach(inc => {
        const pb = playbookService.generatePlaybook(inc, volunteers);
        pb.steps.forEach(s => s.resourcesNeeded.forEach(r => required.add(r)));
      });
      const haveVehicles = data.assets.filter(a => a.type === 'Vehicle').length;
      const needVehicles = data.incidents.filter(i => i.severity !== undefined).length; // heuristic
      const shortages: string[] = [];
      if (needVehicles > haveVehicles) shortages.push('Vehicles');
      if (Array.from(required).some(r => r.toLowerCase().includes('fuel'))) {
        const avgFuel = data.assets.filter(a => a.fuelPct !== undefined).reduce((acc, a) => acc + (a.fuelPct || 0), 0) / Math.max(1, data.assets.filter(a => a.fuelPct !== undefined).length);
        if (avgFuel < 35) shortages.push('Fuel');
      }
      if (Array.from(required).some(r => r.toLowerCase().includes('med'))) {
        const kits = data.assets.filter(a => a.type === 'MedicalKit' && (a.stockCount || 0) > 0).length;
        if (kits < data.incidents.length) shortages.push('Medical Kits');
      }
      results.push({ region, shortages });
    }
    return results;
  },

  /** Pre-allocate resupply routes (simple nearest depot suggestion) */
  preallocateResupplyRoutes(incidents: Incident[]): Array<{ assetId: string; from: string; toIncidentId: string; distanceKm: number; note: string }> {
    const suggestions: Array<{ assetId: string; from: string; toIncidentId: string; distanceKm: number; note: string }> = [];
    const lowFuelAssets = this.listAssets().filter(a => (a.fuelPct || 100) < 30);
    for (const asset of lowFuelAssets) {
      // Find nearest incident to resupply or nearest fuel truck
      let nearest: { inc: Incident; dist: number } | null = null;
      for (const inc of incidents) {
        if (asset.lat !== undefined && asset.lng !== undefined) {
          const d = haversine(asset.lat!, asset.lng!, inc.lat, inc.lng);
          if (!nearest || d < nearest.dist) nearest = { inc, dist: d };
        }
      }
      if (nearest) {
        suggestions.push({ assetId: asset.id, from: asset.locationName, toIncidentId: nearest.inc.id, distanceKm: Math.round(nearest.dist * 10) / 10, note: 'Route fuel resupply pre-allocation' });
      }
    }
    return suggestions;
  }
};
