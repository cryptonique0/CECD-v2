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

function bboxFromCenter(lat: number, lng: number, delta = 0.2) {
  return `${lat - delta},${lng - delta},${lat + delta},${lng + delta}`;
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
    const res = await fetch(url);
    if (!res.ok) throw new Error('Flood GeoJSON fetch failed');
    const data = await res.json();
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
    const url = `https://api.waqi.info/feed/geo:${center.lat};${center.lng}/?token=${token}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('WAQI fetch failed');
    const json = await res.json();
    const aqi = json?.data?.aqi ?? 50;
    const color = aqi > 150 ? '#ef4444' : aqi > 80 ? '#f59e0b' : '#10b981';
    const circle = L.circle([center.lat, center.lng], { radius: 40000 + (aqi * 200), color: 'transparent', fillColor: color, fillOpacity: 0.25 }).addTo(map);
    const label = L.marker([center.lat, center.lng], { icon: L.divIcon({ className: 'aqi-label', html: `<div class=\"px-2 py-1 rounded bg-slate-800 border border-white/10 text-white text-[10px] font-bold\">AQI ${aqi}</div>` }) }).addTo(map);
    return [circle, label];
  },

  async addRoadClosuresOverpass(map: any, L: any, center?: { lat: number; lng: number }): Promise<LeafletLayer[]> {
    if (!center) throw new Error('Missing center for Overpass');
    const bbox = bboxFromCenter(center.lat, center.lng, 0.15);
    const query = `data=[out:json];way[\"highway\"=\"construction\"](${bbox});out body;>;out skel qt;`;
    const res = await fetch('https://overpass-api.de/api/interpreter', { method: 'POST', body: query, headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });
    if (!res.ok) throw new Error('Overpass road closures fetch failed');
    const data = await res.json();
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
    const res = await fetch('https://overpass-api.de/api/interpreter', { method: 'POST', body: query, headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });
    if (!res.ok) throw new Error('Overpass shelters fetch failed');
    const data = await res.json();
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
    const res = await fetch('https://overpass-api.de/api/interpreter', { method: 'POST', body: query, headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });
    if (!res.ok) throw new Error('Overpass hospitals fetch failed');
    const data = await res.json();
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
