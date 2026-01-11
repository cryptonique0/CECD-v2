/*
 * Hazard layers service: provides simple demo overlays for situational awareness.
 * In a production app, wire to live sources (weather radar tiles, flood GeoJSON,
 * AQI indexes, road closure feeds, and facility capacity APIs). Here we simulate
 * them with Leaflet shapes and markers for an interactive preview.
 */

import { Incident, User } from '../types';

export type LeafletLayer = any; // Leaflet layer type

function jitter(n: number) {
  return (Math.random() - 0.5) * n;
}

export const hazardLayersService = {
  addWeatherRadar(map: any, L: any, center?: { lat: number; lng: number }): LeafletLayer[] {
    const layers: LeafletLayer[] = [];
    const baseLat = center?.lat ?? 20;
    const baseLng = center?.lng ?? 0;
    for (let i = 0; i < 6; i++) {
      const lat = baseLat + jitter(2.5);
      const lng = baseLng + jitter(2.5);
      const radius = 50000 + Math.random() * 120000;
      const c = L.circle([lat, lng], {
        radius,
        color: 'transparent',
        fillColor: '#3b82f6',
        fillOpacity: 0.25,
        className: 'animate-pulse'
      }).addTo(map);
      layers.push(c);
    }
    return layers;
  },

  addFloodZones(map: any, L: any, center?: { lat: number; lng: number }): LeafletLayer[] {
    const layers: LeafletLayer[] = [];
    const baseLat = center?.lat ?? 20;
    const baseLng = center?.lng ?? 0;
    // Create 3 polygon zones
    for (let i = 0; i < 3; i++) {
      const lat = baseLat + jitter(1.5);
      const lng = baseLng + jitter(1.5);
      const poly = L.polygon([
        [lat + 0.12, lng - 0.08],
        [lat + 0.06, lng + 0.15],
        [lat - 0.09, lng + 0.06],
        [lat - 0.14, lng - 0.1]
      ], {
        color: '#0ea5e9',
        weight: 1.5,
        fillColor: '#06b6d4',
        fillOpacity: 0.2,
        dashArray: '6,3'
      }).addTo(map);
      layers.push(poly);
    }
    return layers;
  },

  addAQI(map: any, L: any, cities: Array<{ name: string; lat: number; lng: number; aqi: number }>): LeafletLayer[] {
    const layers: LeafletLayer[] = [];
    cities.forEach(c => {
      const color = c.aqi > 150 ? '#ef4444' : c.aqi > 80 ? '#f59e0b' : '#10b981';
      const circle = L.circle([c.lat, c.lng], {
        radius: 40000 + (c.aqi * 200),
        color: 'transparent',
        fillColor: color,
        fillOpacity: 0.25
      }).addTo(map);
      const label = L.marker([c.lat, c.lng], {
        icon: L.divIcon({
          className: 'aqi-label',
          html: `<div class="px-2 py-1 rounded bg-slate-800 border border-white/10 text-white text-[10px] font-bold">AQI ${c.aqi}</div>`
        })
      }).addTo(map);
      layers.push(circle, label);
    });
    return layers;
  },

  addRoadClosures(map: any, L: any, incidents: Incident[]): LeafletLayer[] {
    const layers: LeafletLayer[] = [];
    incidents.slice(0, 4).forEach(inc => {
      const offset = 0.15 + Math.random() * 0.25;
      const line = L.polyline([
        [inc.lat - offset, inc.lng - offset],
        [inc.lat, inc.lng],
        [inc.lat + offset, inc.lng + offset]
      ], {
        color: '#ef4444',
        weight: 3,
        dashArray: '8,6'
      }).addTo(map);
      line.bindPopup(`<div class="text-[10px] text-white">Road Closure near ${inc.locationName}</div>`);
      layers.push(line);
    });
    return layers;
  },

  addShelters(map: any, L: any, anchors: Array<{ lat: number; lng: number; name: string; capacity: number }>): LeafletLayer[] {
    const layers: LeafletLayer[] = [];
    anchors.forEach(a => {
      const icon = L.divIcon({
        className: 'shelter-marker',
        html: `<div class="px-2 py-1 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[10px] font-black flex items-center gap-1"><span class="material-symbols-outlined text-[12px]">home</span>${a.name} · ${a.capacity}</div>`
      });
      const marker = L.marker([a.lat, a.lng], { icon }).addTo(map);
      marker.bindPopup(`<div class="text-[10px] text-white">Shelter: ${a.name}<br/>Capacity: ${a.capacity}</div>`);
      layers.push(marker);
    });
    return layers;
  },

  addHospitals(map: any, L: any, anchors: Array<{ lat: number; lng: number; name: string; beds: number }>): LeafletLayer[] {
    const layers: LeafletLayer[] = [];
    anchors.forEach(a => {
      const icon = L.divIcon({
        className: 'hospital-marker',
        html: `<div class="px-2 py-1 rounded-xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 text-[10px] font-black flex items-center gap-1"><span class="material-symbols-outlined text-[12px]">local_hospital</span>${a.name} · ${a.beds}</div>`
      });
      const marker = L.marker([a.lat, a.lng], { icon }).addTo(map);
      marker.bindPopup(`<div class="text-[10px] text-white">Hospital: ${a.name}<br/>Beds Available: ${a.beds}</div>`);
      layers.push(marker);
    });
    return layers;
  },

  removeLayers(layers: LeafletLayer[]) {
    layers.forEach(l => {
      try { l.remove(); } catch {}
    });
  }
};
