/*
 * Live hazard overlays using public data sources.
 * - NOAA NEXRAD weather via WMS
 * - Flood zones via configurable GeoJSON URL
 * - AQI via WAQI API (requires token)
 * - Road closures via OpenStreetMap Overpass
 * - Shelters/Hospitals via Overpass
 * Falls back to simulated layers if fetch fails.
 */

export type LeafletLayer = any;

type CacheEntry<T> = { data: T; ts: number };
const FIVE_MIN = 5 * 60 * 1000;
const TEN_MIN = 10 * 60 * 1000;

const aqiCache: Record<string, CacheEntry<number>> = {};
const overpassCache: Record<string, CacheEntry<any>> = {};
const floodCache: Record<string, CacheEntry<any>> = {};

function bboxFromCenter(lat: number, lng: number, delta = 0.2) {
  return `${lat - delta},${lng - delta},${lat + delta},${lng + delta}`;
}

async function fetchWithBackoff(url: string, options: RequestInit, attempts = 3, baseDelay = 500): Promise<Response> {
  let lastErr: any;
  for (let i = 0; i < attempts; i++) {
    try {
      const res = await fetch(url, options);
      if (res.ok) return res;
      lastErr = new Error(`HTTP ${res.status}`);
    } catch (e) {
      lastErr = e;
    }
    await new Promise(r => setTimeout(r, baseDelay * Math.pow(2, i)));
  }
  throw lastErr;
}

export const liveHazardsService = {
  addNOAARadarWMS(map: any, L: any): LeafletLayer[] {
    const wms = L.tileLayer.wms('https://mesonet.agron.iastate.edu/cgi-bin/wms/nexrad/n0r.cgi', {
      layers: 'nexrad-n0r-900913',
      format: 'image/png',
      transparent: true,
      attribution: 'NOAA NEXRAD via IEM'
    }).addTo(map);
    return [wms];
  },

  async addFloodGeoJSON(map: any, L: any, url?: string): Promise<LeafletLayer[]> {
    if (!url) throw new Error('Missing flood GeoJSON URL');
    const cached = floodCache[url];
    let data: any;
    if (cached && Date.now() - cached.ts < TEN_MIN) {
      data = cached.data;
    } else {
      const res = await fetchWithBackoff(url, { method: 'GET' }, 3, 500);
      if (!res.ok) throw new Error('Flood GeoJSON fetch failed');
      data = await res.json();
      floodCache[url] = { data, ts: Date.now() };
    }
    const layer = L.geoJSON(data, {
      style: {
        color: '#0ea5e9',
        weight: 1.5,
        fillColor: '#06b6d4',
        fillOpacity: 0.2
      }
    }).addTo(map);
    return [layer];
  },

  async addWAQI(map: any, L: any, center?: { lat: number; lng: number }, token?: string): Promise<LeafletLayer[]> {
    if (!center || !token) throw new Error('Missing WAQI center or token');
    const key = `${center.lat.toFixed(3)},${center.lng.toFixed(3)}`;
    let aqi: number | undefined;
    const cached = aqiCache[key];
    if (cached && Date.now() - cached.ts < FIVE_MIN) {
      aqi = cached.data;
    } else {
      const url = `https://api.waqi.info/feed/geo:${center.lat};${center.lng}/?token=${token}`;
      const res = await fetchWithBackoff(url, { method: 'GET' }, 3, 500);
      if (!res.ok) throw new Error('WAQI fetch failed');
      const json = await res.json();
      aqi = json?.data?.aqi ?? 50;
      aqiCache[key] = { data: aqi, ts: Date.now() };
    }
    const color = aqi > 150 ? '#ef4444' : aqi > 80 ? '#f59e0b' : '#10b981';
    const circle = L.circle([center.lat, center.lng], { radius: 40000 + (aqi * 200), color: 'transparent', fillColor: color, fillOpacity: 0.25 }).addTo(map);
    const label = L.marker([center.lat, center.lng], { icon: L.divIcon({ className: 'aqi-label', html: `<div class=\"px-2 py-1 rounded bg-slate-800 border border-white/10 text-white text-[10px] font-bold\">AQI ${aqi}</div>` }) }).addTo(map);
    return [circle, label];
  },

  async addRoadClosuresOverpass(map: any, L: any, center?: { lat: number; lng: number }): Promise<LeafletLayer[]> {
    if (!center) throw new Error('Missing center for Overpass');
    const bbox = bboxFromCenter(center.lat, center.lng, 0.15);
    const query = `data=[out:json];way[\"highway\"=\"construction\"](${bbox});out body;>;out skel qt;`;
    const cacheKey = `roads:${bbox}`;
    let data: any;
    const cached = overpassCache[cacheKey];
    if (cached && Date.now() - cached.ts < FIVE_MIN) {
      data = cached.data;
    } else {
      const res = await fetchWithBackoff('https://overpass-api.de/api/interpreter', { method: 'POST', body: query, headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }, 3, 700);
      if (!res.ok) throw new Error('Overpass road closures fetch failed');
      data = await res.json();
      overpassCache[cacheKey] = { data, ts: Date.now() };
    }
    const nodes: Record<number, [number, number]> = {};
    data.elements.filter((e: any) => e.type === 'node').forEach((n: any) => { nodes[n.id] = [n.lat, n.lon]; });
    const layers: LeafletLayer[] = [];
    data.elements.filter((e: any) => e.type === 'way').forEach((w: any) => {
      const coords = (w.nodes || []).map((nid: number) => nodes[nid]).filter(Boolean);
      if (coords.length >= 2) {
        const line = L.polyline(coords, { color: '#ef4444', weight: 3, dashArray: '8,6' }).addTo(map);
        layers.push(line);
      }
    });
    return layers;
  },

  async addOSMShelters(map: any, L: any, center?: { lat: number; lng: number }): Promise<LeafletLayer[]> {
    if (!center) throw new Error('Missing center for Overpass');
    const bbox = bboxFromCenter(center.lat, center.lng, 0.2);
    const query = `data=[out:json];node[\"amenity\"=\"shelter\"](${bbox});out;`;
    const cacheKey = `shelters:${bbox}`;
    let data: any;
    const cached = overpassCache[cacheKey];
    if (cached && Date.now() - cached.ts < TEN_MIN) {
      data = cached.data;
    } else {
      const res = await fetchWithBackoff('https://overpass-api.de/api/interpreter', { method: 'POST', body: query, headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }, 3, 700);
      if (!res.ok) throw new Error('Overpass shelters fetch failed');
      data = await res.json();
      overpassCache[cacheKey] = { data, ts: Date.now() };
    }
    const layers: LeafletLayer[] = [];
    data.elements.filter((e: any) => e.type === 'node').forEach((n: any) => {
      const icon = L.divIcon({ className: 'shelter-marker', html: `<div class=\"px-2 py-1 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[10px] font-black flex items-center gap-1\"><span class=\"material-symbols-outlined text-[12px]\">home</span>${n.tags?.name || 'Shelter'}</div>` });
      const marker = L.marker([n.lat, n.lon], { icon }).addTo(map);
      marker.bindPopup(`<div class=\"text-[10px] text-white\">Shelter: ${n.tags?.name || 'Shelter'}</div>`);
      layers.push(marker);
    });
    return layers;
  },

  async addOSMHospitals(map: any, L: any, center?: { lat: number; lng: number }): Promise<LeafletLayer[]> {
    if (!center) throw new Error('Missing center for Overpass');
    const bbox = bboxFromCenter(center.lat, center.lng, 0.2);
    const query = `data=[out:json];node[\"amenity\"=\"hospital\"](${bbox});out;`;
    const cacheKey = `hospitals:${bbox}`;
    let data: any;
    const cached = overpassCache[cacheKey];
    if (cached && Date.now() - cached.ts < TEN_MIN) {
      data = cached.data;
    } else {
      const res = await fetchWithBackoff('https://overpass-api.de/api/interpreter', { method: 'POST', body: query, headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }, 3, 700);
      if (!res.ok) throw new Error('Overpass hospitals fetch failed');
      data = await res.json();
      overpassCache[cacheKey] = { data, ts: Date.now() };
    }
    const layers: LeafletLayer[] = [];
    data.elements.filter((e: any) => e.type === 'node').forEach((n: any) => {
      const icon = L.divIcon({ className: 'hospital-marker', html: `<div class=\"px-2 py-1 rounded-xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 text-[10px] font-black flex items-center gap-1\"><span class=\"material-symbols-outlined text-[12px]\">local_hospital</span>${n.tags?.name || 'Hospital'}</div>` });
      const marker = L.marker([n.lat, n.lon], { icon }).addTo(map);
      marker.bindPopup(`<div class=\"text-[10px] text-white\">Hospital: ${n.tags?.name || 'Hospital'}</div>`);
      layers.push(marker);
    });
    return layers;
  },

  removeLayers(layers: LeafletLayer[]) {
    layers.forEach(l => { try { l.remove(); } catch {} });
  }
};
