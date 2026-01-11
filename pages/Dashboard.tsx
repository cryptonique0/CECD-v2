import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Incident, Severity, IncidentStatus, IncidentCategory, User, Role } from '../types';
import { SEVERITY_COLORS, STATUS_COLORS, CATEGORY_ICONS } from '../constants';
import { useNavigate } from 'react-router-dom';
import { analyticsService } from '../services/analyticsService';
import { buildPredictiveDispatches, DispatchSuggestion } from '../services/routingService';
import { hazardLayersService, LeafletLayer } from '../services/hazardLayersService';
import { liveHazardsService } from '../services/liveHazardsService';

declare const L: any;

const LOCATION_COORDS: Record<string, [number, number]> = {
  'New York, USA': [40.7128, -74.0060],
  'London, UK': [51.5074, -0.1278],
  'Moscow, Russia': [55.7558, 37.6173],
  'Beijing, China': [39.9042, 116.4074]
};

interface DashboardProps {
  incidents: Incident[];
  volunteers?: User[];
  currentUser?: User;
}

const Dashboard: React.FC<DashboardProps> = ({ incidents, volunteers = [], currentUser }) => {
  const navigate = useNavigate();
  const mapRef = useRef<any>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const incidentClusterGroupRef = useRef<any>(null);
  
  // Storage for map objects to allow reactive updates without flickering
  const markersRef = useRef<{ [key: string]: any }>({});
  const volunteerMarkersRef = useRef<{ [key: string]: any }>({});
  const zonesRef = useRef<{ [key: string]: any }>({});
  const heatmapLayersRef = useRef<any[]>([]);
  const situationalLayersRef = useRef<Record<string, LeafletLayer[]>>({});
  
  const [riskAreas, setRiskAreas] = useState<any[]>([]);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const predictiveDispatches = useMemo<DispatchSuggestion[]>(() => buildPredictiveDispatches(incidents, volunteers), [incidents, volunteers]);
  const [visibleLayers, setVisibleLayers] = useState<{ weather: boolean; flood: boolean; aqi: boolean; roads: boolean; shelters: boolean; hospitals: boolean }>({ weather: false, flood: false, aqi: false, roads: false, shelters: false, hospitals: false });
  const [layerStatus, setLayerStatus] = useState<{ [K in keyof typeof visibleLayers]?: 'live' | 'simulated' }>(() => ({ }));
  const [lastRefresh, setLastRefresh] = useState<{ [K in keyof typeof visibleLayers]?: number }>({});
  
  // Tactical Modal State (Now used for explicit preview actions if needed, or can be removed)
  const [previewIncident, setPreviewIncident] = useState<Incident | null>(null);

  // Function to center map to user
  const handleCenterToUser = () => {
    if (mapRef.current && currentUser?.lat && currentUser?.lng) {
      mapRef.current.flyTo([currentUser.lat, currentUser.lng], 14, { duration: 1.5 });
    }
  };

  const handleCenterToCoords = (lat?: number, lng?: number) => {
    if (!mapRef.current || !lat || !lng) return;
    mapRef.current.flyTo([lat, lng], 12, { duration: 1.2 });
  };

  const getTimeAgo = (ts: number) => {
    const diff = Date.now() - ts;
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins === 1) return '1m ago';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    return `${hrs}h ago`;
  };

  const bustCacheAndRefresh = async (key: keyof typeof visibleLayers) => {
    // Toggle off to remove layers
    if (visibleLayers[key]) {
      if (situationalLayersRef.current[key]) {
        hazardLayersService.removeLayers(situationalLayersRef.current[key]);
        situationalLayersRef.current[key] = [];
      }
      setVisibleLayers(prev => ({ ...prev, [key]: false }));
    }
    // Wait a moment, then toggle back on to reload with fresh data
    await new Promise(r => setTimeout(r, 300));
    setVisibleLayers(prev => ({ ...prev, [key]: true }));
    // The toggleLayer effect will fire and reload
  };

  // 1. Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const initialLat = currentUser?.lat || 20;
    const initialLng = currentUser?.lng || 0;
    const initialZoom = currentUser?.lat ? 13 : 2;

    mapRef.current = L.map(mapContainerRef.current, {
      zoomControl: false,
      attributionControl: true
    }).setView([initialLat, initialLng], initialZoom);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; OpenStreetMap &copy; CARTO',
      subdomains: 'abcd',
      maxZoom: 20
    }).addTo(mapRef.current);

    // Initialize Incident Marker Cluster Group
    incidentClusterGroupRef.current = L.markerClusterGroup({
      showCoverageOnHover: false,
      zoomToBoundsOnClick: true,
      spiderfyOnMaxZoom: true,
      iconCreateFunction: (cluster: any) => {
        const markers = cluster.getAllChildMarkers();
        const count = markers.length;
        const hasCritical = markers.some((m: any) => m.options.incidentSeverity === Severity.CRITICAL);
        
        return L.divIcon({
          html: `<div class="flex items-center justify-center w-full h-full"><span>${count}</span></div>`,
          className: `tactical-cluster ${hasCritical ? 'tactical-cluster-critical' : ''}`,
          iconSize: L.point(40, 40)
        });
      }
    });
    mapRef.current.addLayer(incidentClusterGroupRef.current);

    L.control.zoom({ position: 'topright' }).addTo(mapRef.current);

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // 1b. Role-based default layers with localStorage persistence per role
  useEffect(() => {
    if (!currentUser?.role) return;
    const defaults: Record<Role, Partial<typeof visibleLayers>> = {
      [Role.CITIZEN]: { shelters: true, hospitals: true },
      [Role.VOLUNTEER]: { shelters: true, hospitals: true, roads: true },
      [Role.COMMUNITY_LEADER]: { shelters: true, hospitals: true, roads: true, flood: true },
      [Role.EMERGENCY_DESK]: { weather: true, roads: true, shelters: true, hospitals: true },
      [Role.DISPATCHER]: { weather: true, roads: true, shelters: true, hospitals: true, flood: true },
      [Role.ANALYST]: { weather: true, flood: true, aqi: true, roads: true, shelters: true, hospitals: true },
      [Role.FIELD_OPERATOR]: { roads: true, shelters: true, hospitals: true },
      [Role.OWNER]: { weather: true, flood: true, aqi: true, roads: true, shelters: true, hospitals: true }
    };
    try {
      const key = `cecd.layerPrefs.${currentUser.role}`;
      const persisted = localStorage.getItem(key);
      if (persisted) {
        setVisibleLayers(JSON.parse(persisted));
      } else {
        setVisibleLayers(prev => ({ ...prev, ...defaults[currentUser.role] } as any));
      }
    } catch {
      setVisibleLayers(prev => ({ ...prev, ...defaults[currentUser.role] } as any));
    }
  }, [currentUser?.role]);

  // 2. Sync User Location Marker
  useEffect(() => {
    if (!mapRef.current || !currentUser?.lat || !currentUser?.lng) return;

    const userId = 'current-user';
    const locName = currentUser.location || "Acquiring Position...";
    
    if (markersRef.current[userId]) {
      const marker = markersRef.current[userId];
      marker.setLatLng([currentUser.lat, currentUser.lng]);
      const el = marker.getElement();
      if (el) {
        const label = el.querySelector('.location-label-text');
        if (label) label.innerText = locName;
      }
    } else {
      const userIcon = L.divIcon({
        className: 'user-marker',
        html: `
          <div class="relative flex flex-col items-center justify-center">
            <div class="absolute bottom-full mb-4 px-3 py-1.5 bg-primary/95 backdrop-blur-md border border-white/20 rounded-xl shadow-glow-sm marker-label-floating whitespace-nowrap z-50">
              <p class="text-[9px] font-black text-white/60 uppercase tracking-widest leading-none mb-1">Current Sector</p>
              <p class="location-label-text text-[10px] font-black text-white uppercase italic leading-none">${locName}</p>
              <div class="absolute top-full left-1/2 -translate-x-1/2 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-primary/95"></div>
            </div>
            
            <div class="absolute size-14 bg-primary/30 rounded-full animate-ping"></div>
            <div class="size-9 bg-primary rounded-full border-[3px] border-white shadow-glow-lg flex items-center justify-center relative z-10 transition-transform hover:scale-110">
              <span class="material-symbols-outlined text-white text-[18px] filled">my_location</span>
            </div>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      });

      markersRef.current[userId] = L.marker([currentUser.lat, currentUser.lng], { icon: userIcon, zIndexOffset: 1000 }).addTo(mapRef.current);
      mapRef.current.flyTo([currentUser.lat, currentUser.lng], 14, { duration: 1.5 });
    }
  }, [currentUser?.lat, currentUser?.lng, currentUser?.location]);

  // 3. Sync Incident Markers within Cluster Group
  useEffect(() => {
    if (!mapRef.current || !incidentClusterGroupRef.current) return;

    // Remove obsolete markers from markersRef and clusterGroup
    Object.keys(markersRef.current).forEach(id => {
      if (id !== 'current-user' && !incidents.find(inc => inc.id === id && inc.status !== IncidentStatus.CLOSED)) {
        incidentClusterGroupRef.current.removeLayer(markersRef.current[id]);
        delete markersRef.current[id];
        
        if (zonesRef.current[id]) {
          zonesRef.current[id].remove();
          delete zonesRef.current[id];
        }
      }
    });

    incidents.forEach(incident => {
      if (incident.status === IncidentStatus.CLOSED) return;

      const isCritical = incident.severity === Severity.CRITICAL;
      const markerColor = isCritical ? '#ef4444' : incident.severity === Severity.HIGH ? '#f59e0b' : '#137fec';
      const iconName = CATEGORY_ICONS[incident.category] || 'emergency';
      const radius = { [Severity.CRITICAL]: 1000, [Severity.HIGH]: 500, [Severity.MEDIUM]: 250, [Severity.LOW]: 100 }[incident.severity] || 100;

      // Construct Tactical Popup Content
      const popupContent = `
        <div class="flex flex-col gap-3 p-1 min-w-[220px]">
          <div class="flex justify-between items-start gap-4">
            <h4 class="text-xs font-black text-white uppercase italic tracking-tighter leading-tight">${incident.title}</h4>
            <span class="text-[8px] font-mono text-primary font-black uppercase tracking-widest bg-primary/10 px-1.5 py-0.5 rounded border border-primary/20 shrink-0">${incident.id}</span>
          </div>
          <div class="flex items-center gap-2">
            <span class="px-1.5 py-0.5 rounded text-[7px] font-black uppercase border tracking-widest ${SEVERITY_COLORS[incident.severity]}">
              ${incident.severity}
            </span>
            <span class="text-[8px] font-bold text-text-secondary uppercase tracking-widest flex items-center gap-1">
              <span class="material-symbols-outlined text-[12px]">${iconName}</span>
              ${incident.category}
            </span>
          </div>
          <p class="text-[10px] text-slate-400 italic leading-relaxed border-l-2 border-primary/30 pl-2 line-clamp-3">
            "${incident.description.length > 90 ? incident.description.substring(0, 87) + '...' : incident.description}"
          </p>
          <div class="flex flex-col gap-2 pt-1">
            <button 
              onclick="window.location.hash='#/incidents/${incident.id}'"
              class="w-full py-2.5 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all shadow-sm flex items-center justify-center gap-2"
            >
              <span class="material-symbols-outlined text-[14px]">visibility</span>
              Access Command Center
            </button>
          </div>
        </div>
      `;

      if (markersRef.current[incident.id]) {
        const marker = markersRef.current[incident.id];
        marker.setLatLng([incident.lat, incident.lng]);
        marker.options.incidentSeverity = incident.severity;
        marker.setPopupContent(popupContent);
      } else {
        const icon = L.divIcon({
          className: 'incident-marker-container',
          html: `
            <div class="relative flex items-center justify-center cursor-pointer group">
              ${isCritical ? '<div class="absolute size-12 bg-red-500/20 rounded-full animate-pulse"></div>' : ''}
              <div class="size-8 rounded-xl border-2 border-white/60 flex items-center justify-center rotate-45 transition-all group-hover:scale-125 shadow-glow-sm" style="background-color: ${markerColor}">
                <span class="material-symbols-outlined text-white text-[14px] -rotate-45">${iconName}</span>
              </div>
            </div>
          `,
          iconSize: [32, 32],
          iconAnchor: [16, 16]
        });

        const marker = L.marker([incident.lat, incident.lng], { 
          icon, 
          incidentSeverity: incident.severity 
        });

        // Bind tactical popup instead of direct modal trigger
        marker.bindPopup(popupContent, {
          className: 'custom-tactical-popup',
          maxWidth: 280,
          closeButton: false,
          offset: L.point(0, -10)
        });

        incidentClusterGroupRef.current.addLayer(marker);
        markersRef.current[incident.id] = marker;
      }

      if (zonesRef.current[incident.id]) {
        zonesRef.current[incident.id].setLatLng([incident.lat, incident.lng]).setRadius(radius);
      } else {
        zonesRef.current[incident.id] = L.circle([incident.lat, incident.lng], {
          radius: radius, color: markerColor, fillColor: markerColor, fillOpacity: 0.1, weight: 1, dashArray: '5, 5'
        }).addTo(mapRef.current);
      }
    });
    
    incidentClusterGroupRef.current.refreshClusters();

  }, [incidents]);

  // 4. Sync Volunteer Locations
  useEffect(() => {
    if (!mapRef.current) return;

    Object.keys(volunteerMarkersRef.current).forEach(vId => {
      if (!volunteers.find(v => v.id === vId && v.lat && v.lng)) {
        volunteerMarkersRef.current[vId].remove();
        delete volunteerMarkersRef.current[vId];
      }
    });

    volunteers.forEach(volunteer => {
      if (volunteer.id === currentUser?.id || !volunteer.lat || !volunteer.lng) return;
      const statusColor = volunteer.status === 'Available' ? '#10b981' : volunteer.status === 'Busy' ? '#f59e0b' : '#94a3b8';
      const primarySkill = volunteer.skills[0] || 'General Responder';

      if (volunteerMarkersRef.current[volunteer.id]) {
        volunteerMarkersRef.current[volunteer.id].setLatLng([volunteer.lat, volunteer.lng]);
      } else {
        const volIcon = L.divIcon({
          className: 'volunteer-marker',
          html: `
            <div class="relative flex items-center justify-center group">
              ${volunteer.status === 'Available' ? `<div class="absolute size-6 rounded-full opacity-40 animate-ping" style="background-color: ${statusColor}"></div>` : ''}
              <div class="size-4 rounded-full border-2 border-white shadow-lg relative z-10 transition-transform hover:scale-150" style="background-color: ${statusColor}"></div>
              
              <div class="absolute bottom-full mb-3 bg-card-dark text-white text-[8px] font-black uppercase tracking-widest px-2 py-1.5 rounded-lg border border-border-dark opacity-0 group-hover:opacity-100 transition-all group-hover:-translate-y-1 pointer-events-none whitespace-nowrap shadow-2xl z-[1001] flex flex-col items-center min-w-[80px]">
                <span class="leading-none text-white">${volunteer.name}</span>
                <span class="text-[7px] text-primary mt-1 opacity-90 italic">${primarySkill}</span>
                <div class="absolute top-full left-1/2 -translate-x-1/2 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[4px] border-t-card-dark"></div>
              </div>
            </div>
          `,
          iconSize: [20, 20], 
          iconAnchor: [10, 10]
        });
        volunteerMarkersRef.current[volunteer.id] = L.marker([volunteer.lat, volunteer.lng], { icon: volIcon }).addTo(mapRef.current);
      }
    });
  }, [volunteers, currentUser?.id]);

  // 5. Risk Heatmap Overlay Logic
  useEffect(() => {
    if (!mapRef.current) return;

    heatmapLayersRef.current.forEach(layer => layer.remove());
    heatmapLayersRef.current = [];

    if (showHeatmap && riskAreas.length > 0) {
      riskAreas.forEach(area => {
        const coords = LOCATION_COORDS[area.location];
        if (coords) {
          const color = area.riskLevel === 'Critical' ? '#ef4444' : area.riskLevel === 'High' ? '#f59e0b' : '#137fec';
          const circle = L.circle(coords, {
            radius: area.riskLevel === 'Critical' ? 150000 : 80000,
            color: 'transparent',
            fillColor: color,
            fillOpacity: 0.3,
            className: 'animate-pulse'
          }).addTo(mapRef.current);
          
          heatmapLayersRef.current.push(circle);
        }
      });
    }
  }, [showHeatmap, riskAreas]);

  useEffect(() => {
    analyticsService.getRiskHeatmap().then(setRiskAreas);
  }, []);

  // 6. Situational Layers Toggle Logic
  const toggleLayer = async (key: keyof typeof visibleLayers) => {
    if (!mapRef.current) return;
    const next = { ...visibleLayers, [key]: !visibleLayers[key] };
    setVisibleLayers(next);
    // Persist per-role preferences
    try {
      if (currentUser?.role) {
        localStorage.setItem(`cecd.layerPrefs.${currentUser.role}`, JSON.stringify(next));
      }
    } catch {}
    // Remove existing
    if (situationalLayersRef.current[key]) {
      hazardLayersService.removeLayers(situationalLayersRef.current[key]);
      situationalLayersRef.current[key] = [];
    }
    // Add if now visible
    if (next[key]) {
      let layers: LeafletLayer[] = [];
      if (key === 'weather') {
        try {
          layers = liveHazardsService.addNOAARadarWMS(mapRef.current, L);
          setLayerStatus(prev => ({ ...prev, weather: 'live' }));
          setLastRefresh(prev => ({ ...prev, weather: Date.now() }));
        } catch {
          layers = hazardLayersService.addWeatherRadar(mapRef.current, L, currentUser?.lat && currentUser?.lng ? { lat: currentUser.lat!, lng: currentUser.lng! } : undefined);
          setLayerStatus(prev => ({ ...prev, weather: 'simulated' }));
        }
      } else if (key === 'flood') {
        const floodUrl = import.meta?.env?.VITE_FLOOD_GEOJSON_URL as string | undefined;
        try {
          layers = await liveHazardsService.addFloodGeoJSON(mapRef.current, L, floodUrl);
          setLayerStatus(prev => ({ ...prev, flood: 'live' }));
          setLastRefresh(prev => ({ ...prev, flood: Date.now() }));
        } catch {
          layers = hazardLayersService.addFloodZones(mapRef.current, L, currentUser?.lat && currentUser?.lng ? { lat: currentUser.lat!, lng: currentUser.lng! } : undefined);
          setLayerStatus(prev => ({ ...prev, flood: 'simulated' }));
        }
      } else if (key === 'aqi') {
        const token = import.meta?.env?.VITE_WAQI_TOKEN as string | undefined;
        try {
          layers = await liveHazardsService.addWAQI(mapRef.current, L, currentUser?.lat && currentUser?.lng ? { lat: currentUser.lat!, lng: currentUser.lng! } : undefined, token);
          setLayerStatus(prev => ({ ...prev, aqi: 'live' }));
          setLastRefresh(prev => ({ ...prev, aqi: Date.now() }));
        } catch {
          const cities = [
            { name: 'New York', lat: 40.7128, lng: -74.0060, aqi: 65 + Math.floor(Math.random() * 100) },
            { name: 'London', lat: 51.5074, lng: -0.1278, aqi: 40 + Math.floor(Math.random() * 120) },
            { name: 'Beijing', lat: 39.9042, lng: 116.4074, aqi: 80 + Math.floor(Math.random() * 150) }
          ];
          layers = hazardLayersService.addAQI(mapRef.current, L, cities);
          setLayerStatus(prev => ({ ...prev, aqi: 'simulated' }));
        }
      } else if (key === 'roads') {
        try {
          layers = await liveHazardsService.addRoadClosuresOverpass(mapRef.current, L, currentUser?.lat && currentUser?.lng ? { lat: currentUser.lat!, lng: currentUser.lng! } : undefined);
          setLayerStatus(prev => ({ ...prev, roads: 'live' }));
          setLastRefresh(prev => ({ ...prev, roads: Date.now() }));
        } catch {
          layers = hazardLayersService.addRoadClosures(mapRef.current, L, incidents);
          setLayerStatus(prev => ({ ...prev, roads: 'simulated' }));
        }
      } else if (key === 'shelters') {
        try {
          layers = await liveHazardsService.addOSMShelters(mapRef.current, L, currentUser?.lat && currentUser?.lng ? { lat: currentUser.lat!, lng: currentUser.lng! } : undefined);
          setLayerStatus(prev => ({ ...prev, shelters: 'live' }));
          setLastRefresh(prev => ({ ...prev, shelters: Date.now() }));
        } catch {
          const anchors = [
            { name: 'Community Shelter A', lat: (currentUser?.lat ?? 20) + 0.12, lng: (currentUser?.lng ?? 0) - 0.08, capacity: 120 },
            { name: 'Relief Center B', lat: (currentUser?.lat ?? 20) - 0.22, lng: (currentUser?.lng ?? 0) + 0.14, capacity: 60 }
          ];
          layers = hazardLayersService.addShelters(mapRef.current, L, anchors);
          setLayerStatus(prev => ({ ...prev, shelters: 'simulated' }));
        }
      } else if (key === 'hospitals') {
        try {
          layers = await liveHazardsService.addOSMHospitals(mapRef.current, L, currentUser?.lat && currentUser?.lng ? { lat: currentUser.lat!, lng: currentUser.lng! } : undefined);
          setLayerStatus(prev => ({ ...prev, hospitals: 'live' }));
          setLastRefresh(prev => ({ ...prev, hospitals: Date.now() }));
        } catch {
          const anchors = [
            { name: 'General Hospital', lat: (currentUser?.lat ?? 20) + 0.05, lng: (currentUser?.lng ?? 0) + 0.09, beds: 25 },
            { name: 'Trauma Center', lat: (currentUser?.lat ?? 20) - 0.1, lng: (currentUser?.lng ?? 0) - 0.12, beds: 12 }
          ];
          layers = hazardLayersService.addHospitals(mapRef.current, L, anchors);
          setLayerStatus(prev => ({ ...prev, hospitals: 'simulated' }));
        }
      }
      situationalLayersRef.current[key] = layers;
    }
  };

  const stats = [
    { label: 'Active Alerts', value: incidents.filter(i => i.status !== IncidentStatus.CLOSED).length, trend: '+2h', color: 'primary', icon: 'campaign' },
    { label: 'Global Responders', value: volunteers.length + 2440, trend: '+12%', color: 'accent-green', icon: 'groups' },
    { label: 'Avg Response', value: '8.2m', trend: '-15s', color: 'accent-orange', icon: 'timer' },
    { label: 'Base Node', value: '100%', trend: 'Stable', color: 'accent-green', icon: 'dns' }
  ];

  return (
    <div className="p-6 md:p-8 flex flex-col gap-6 relative h-full overflow-hidden">
      {/* Tactical Incident Preview Modal (Fallback/Manual Preview) */}
      {previewIncident && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-background-dark/80 backdrop-blur-md animate-in fade-in duration-300" onClick={() => setPreviewIncident(null)}></div>
          <div className="bg-card-dark border border-border-dark w-full max-w-lg rounded-[3rem] p-8 shadow-2xl relative z-10 animate-in fade-in zoom-in-95 duration-300 flex flex-col gap-6">
            <div className="flex justify-between items-start">
              <div className="flex gap-4">
                <div className="bg-primary/20 size-14 rounded-2xl flex items-center justify-center text-primary border border-primary/30">
                  <span className="material-symbols-outlined text-3xl">{CATEGORY_ICONS[previewIncident.category]}</span>
                </div>
                <div className="flex flex-col gap-1">
                  <h2 className="text-2xl font-black text-white italic tracking-tighter uppercase leading-none">{previewIncident.title}</h2>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] font-mono text-primary font-black uppercase tracking-widest">{previewIncident.id}</span>
                    <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase border tracking-widest ${SEVERITY_COLORS[previewIncident.severity]}`}>
                      {previewIncident.severity}
                    </span>
                  </div>
                </div>
              </div>
              <button onClick={() => setPreviewIncident(null)} className="size-10 rounded-full hover:bg-white/5 flex items-center justify-center border border-border-dark text-text-secondary transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2 text-text-secondary">
                <span className="material-symbols-outlined text-sm">location_on</span>
                <span className="text-[10px] font-black uppercase tracking-widest">{previewIncident.locationName}</span>
              </div>
              <p className="text-sm text-slate-300 leading-relaxed italic bg-background-dark/50 p-6 rounded-3xl border border-border-dark min-h-[80px]">
                "{previewIncident.description}"
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
               <button 
                onClick={() => setPreviewIncident(null)}
                className="py-4 rounded-2xl border border-border-dark text-text-secondary text-[11px] font-black uppercase tracking-widest hover:bg-white/5 transition-all"
               >
                 Dismiss Intel
               </button>
               <button 
                onClick={() => navigate(`/incidents/${previewIncident.id}`)}
                className="py-4 rounded-2xl bg-primary hover:bg-primary-dark text-white text-[11px] font-black uppercase tracking-widest shadow-glow active:scale-95 transition-all flex items-center justify-center gap-2"
               >
                 <span className="material-symbols-outlined text-sm">visibility</span>
                 Enter Room
               </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight italic uppercase">Global Command Center</h1>
          <div className="flex items-center gap-3 mt-1">
             <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-accent-green text-[9px] font-black uppercase">
                <span className="size-1.5 rounded-full bg-accent-green animate-pulse"></span> Node Verified: Protocol 2.5
             </div>
             <div className="text-[9px] text-text-secondary font-black uppercase opacity-60">Tracking {volunteers.filter(v => v.lat).length} Active Peers</div>
          </div>
        </div>
        <div className="flex gap-2">
          {stats.map((stat, i) => (
            <div key={i} className="bg-card-dark border border-border-dark px-4 py-3 rounded-2xl flex items-center gap-3 shadow-lg">
              <span className={`material-symbols-outlined text-lg text-${stat.color}`}>{stat.icon}</span>
              <div>
                <p className="text-[14px] font-black text-white leading-none">{stat.value}</p>
                <p className="text-[8px] text-text-secondary uppercase font-bold tracking-widest mt-0.5">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 min-h-0 relative flex flex-col xl:flex-row gap-6">
        <div className="flex-1 rounded-[3rem] border border-border-dark bg-slate-900 overflow-hidden relative shadow-2xl">
          <div ref={mapContainerRef} className="absolute inset-0 z-0"></div>

          <div className="absolute top-24 right-6 z-[1000] flex flex-col gap-2">
            <button 
              onClick={handleCenterToUser}
              className="bg-card-dark/95 backdrop-blur-xl border border-border-dark p-2 rounded-xl shadow-xl pointer-events-auto flex items-center justify-center text-primary hover:bg-primary hover:text-white transition-all group active:scale-95"
              title="Locate Current Position"
            >
              <span className="material-symbols-outlined text-xl filled group-hover:rotate-12 transition-transform">my_location</span>
            </button>
          </div>

          <div className="absolute top-6 left-6 z-[1000] pointer-events-none w-full max-w-sm">
            <div className="bg-card-dark/95 backdrop-blur-xl border border-border-dark p-4 rounded-[2.5rem] shadow-2xl pointer-events-auto">
               <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/30 w-fit">
                    <span className="material-symbols-outlined text-[12px] text-primary filled animate-pulse">radar</span>
                    <span className="text-[9px] font-black text-white uppercase tracking-widest">Base Signal Established</span>
                  </div>

                  <div className={`p-4 rounded-3xl border-2 transition-all duration-500 ${currentUser?.location && currentUser.location !== "Acquiring Secure Signal..." ? 'bg-slate-900/90 border-emerald-500/30 shadow-glow-sm' : 'bg-background-dark/80 border-border-dark opacity-80'}`}>
                    <div className="flex items-center gap-2 mb-2">
                       <span className={`material-symbols-outlined text-sm ${currentUser?.location && currentUser.location !== "Acquiring Secure Signal..." ? 'text-accent-green filled' : 'text-slate-500 animate-spin'}`}>
                         {currentUser?.location && currentUser.location !== "Acquiring Secure Signal..." ? 'verified' : 'sync'}
                       </span>
                       <span className="text-[10px] font-black text-white uppercase tracking-widest">{currentUser?.location && currentUser.location !== "Acquiring Secure Signal..." ? 'VERIFIED POSITION' : 'SYNCHRONIZING...'}</span>
                    </div>
                    <p className="text-sm font-black text-white italic truncate pr-4 h-5">{currentUser?.location || "Acquiring Secure Signal..."}</p>
                    <div className="mt-3 flex items-center gap-3">
                       <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                          <div className={`h-full bg-accent-green transition-all duration-1000 ${currentUser?.location ? 'w-full' : 'w-1/4'}`}></div>
                       </div>
                       <span className="text-[9px] font-mono text-slate-500 font-bold">{currentUser?.lat?.toFixed(5)}, {currentUser?.lng?.toFixed(5)}</span>
                    </div>
                  </div>
               </div>
            </div>
          </div>

          <div className="absolute top-6 right-6 z-[1000] pointer-events-none">
            <div className="bg-card-dark/95 backdrop-blur-xl border border-border-dark p-3 rounded-2xl shadow-xl pointer-events-auto flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <div className="size-2 rounded-full bg-accent-green"></div>
                <span className="text-[8px] font-black text-white uppercase tracking-widest">Available Peer</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="size-2 rounded-full bg-accent-orange"></div>
                <span className="text-[8px] font-black text-white uppercase tracking-widest">Engaged Peer</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="size-2 bg-red-500 rotate-45"></div>
                <span className="text-[8px] font-black text-white uppercase tracking-widest">Active Incident</span>
              </div>
            </div>
          </div>

          <div className="absolute bottom-8 left-8 z-[1000] bg-card-dark/95 backdrop-blur-xl p-6 rounded-[2.5rem] border border-border-dark w-64 shadow-2xl pointer-events-auto">
            <div className="flex items-center justify-between mb-5">
              <h4 className="text-[10px] font-black text-white uppercase tracking-widest italic flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-sm">analytics</span> Regional Threat Index
              </h4>
              <button 
                onClick={() => setShowHeatmap(!showHeatmap)}
                className={`flex items-center justify-center p-1.5 rounded-lg transition-all ${showHeatmap ? 'bg-primary text-white shadow-glow' : 'bg-slate-800 text-slate-500'}`}
                title="Toggle Risk Heatmap"
              >
                <span className="material-symbols-outlined text-[16px]">heat_pump</span>
              </button>
            </div>
            <div className="space-y-4">
              {riskAreas.map((area, idx) => (
                <div key={idx} className="flex flex-col gap-2">
                  <div className="flex justify-between text-[9px] font-black text-text-secondary uppercase">
                    <span>{area.location}</span>
                    <span className={area.riskLevel === 'Critical' ? 'text-accent-red' : 'text-accent-green'}>{area.riskLevel}</span>
                  </div>
                  <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-1000 ${area.riskLevel === 'Critical' ? 'bg-accent-red shadow-glow-red' : 'bg-accent-green'}`} style={{ width: area.riskLevel === 'Critical' ? '85%' : '25%' }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Situational Layers Toggle Panel */}
          <div className="absolute bottom-8 right-8 z-[1000] bg-card-dark/95 backdrop-blur-xl p-6 rounded-[2.5rem] border border-border-dark w-72 shadow-2xl pointer-events-auto">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-[10px] font-black text-white uppercase tracking-widest italic flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-sm">layers</span> Situational Layers
              </h4>
              <span className="text-[9px] text-text-secondary uppercase font-bold">Role: {currentUser?.role}</span>
            </div>
            <div className="flex flex-col gap-2">
              {([ 
                { key: 'weather', label: 'Weather Radar', icon: 'radar' },
                { key: 'flood', label: 'Flood Zones', icon: 'water' },
                { key: 'aqi', label: 'Air Quality', icon: 'air' },
                { key: 'roads', label: 'Road Closures', icon: 'sign' },
                { key: 'shelters', label: 'Shelters', icon: 'home' },
                { key: 'hospitals', label: 'Hospitals', icon: 'local_hospital' }
              ] as Array<{ key: keyof typeof visibleLayers; label: string; icon: string }>).map(item => (
                <div key={item.key as string} className="flex items-center gap-2">
                  <button
                    onClick={() => toggleLayer(item.key)}
                    className={`flex-1 flex items-center gap-2 px-3 py-2 rounded-xl text-[10px] font-bold uppercase border transition-all ${visibleLayers[item.key] ? 'bg-primary/10 border-primary/30 text-white' : 'bg-slate-800 border-border-dark text-white/60 hover:text-white'}`}
                  >
                    <span className="material-symbols-outlined text-[14px]">{item.icon}</span>
                    <span className="flex-1 flex items-center gap-1 text-left">
                      <span className="flex-1">{item.label}</span>
                      {visibleLayers[item.key] && (
                        <span className={`px-1 py-0.5 rounded text-[8px] font-black uppercase border whitespace-nowrap ${layerStatus[item.key] === 'live' ? 'bg-emerald-500/10 text-accent-green border-emerald-500/40' : 'bg-slate-700 text-white/80 border-slate-500/40'}`}>
                          {layerStatus[item.key] === 'live' ? 'Live' : 'Sim'}
                        </span>
                      )}
                    </span>
                  </button>
                  {visibleLayers[item.key] && (
                    <button
                      onClick={() => bustCacheAndRefresh(item.key)}
                      className="px-2 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-border-dark text-white/60 hover:text-white transition-all text-[10px]"
                      title={`Refresh ${item.label}`}
                    >
                      <span className="material-symbols-outlined text-[12px]">refresh</span>
                    </button>
                  )}
                </div>
              ))}
              {Object.keys(lastRefresh).length > 0 && (
                <div className="mt-2 pt-2 border-t border-border-dark text-[9px] text-text-secondary uppercase font-bold">
                  {([ 
                    { key: 'weather', label: 'Radar' },
                    { key: 'flood', label: 'Flood' },
                    { key: 'aqi', label: 'AQI' },
                    { key: 'roads', label: 'Roads' },
                    { key: 'shelters', label: 'Shelters' },
                    { key: 'hospitals', label: 'Hospitals' }
                  ] as Array<{ key: keyof typeof visibleLayers; label: string }>).map(item => 
                    visibleLayers[item.key] && lastRefresh[item.key] ? (
                      <div key={item.key as string} className="flex justify-between">
                        <span>{item.label}:</span>
                        <span className="text-white/60">{getTimeAgo(lastRefresh[item.key]!)}</span>
                      </div>
                    ) : null
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="w-full xl:w-80 shrink-0 flex flex-col gap-6">
          <div className="bg-card-dark border border-border-dark rounded-[3rem] p-6 shadow-xl flex flex-col gap-4">
            <h3 className="text-white text-sm font-black uppercase tracking-widest italic flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">broadcast_on_personal</span> Tactical Feed
            </h3>
            <div className="flex flex-col gap-3 overflow-y-auto max-h-[350px] custom-scrollbar pr-2">
              {incidents.filter(i => i.status !== IncidentStatus.CLOSED).slice(0, 8).map(inc => (
                <div key={inc.id} onClick={() => navigate(`/incidents/${inc.id}`)} className="p-3.5 bg-background-dark/50 border border-border-dark rounded-2xl hover:border-primary/50 cursor-pointer transition-all group hover:bg-card-hover">
                  <div className="flex justify-between items-start mb-1.5">
                    <span className="text-[9px] font-mono text-primary font-black uppercase">{inc.id}</span>
                    <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-lg border ${STATUS_COLORS[inc.status]}`}>{inc.status}</span>
                  </div>
                  <h4 className="text-xs font-bold text-white group-hover:text-primary transition-colors line-clamp-1">{inc.title}</h4>
                  <p className="text-[10px] text-text-secondary truncate mt-1.5 opacity-60 uppercase font-black">{inc.locationName}</p>
                </div>
              ))}
            </div>
            <button onClick={() => navigate('/incidents')} className="w-full py-4 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all mt-2">Access Global Ledger</button>
          </div>

          <div className="bg-card-dark border border-border-dark rounded-[3rem] p-6 shadow-xl flex flex-col gap-4 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-emerald-500/10 opacity-60"></div>
            <div className="relative flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">alt_route</span>
                <h3 className="text-white text-sm font-black uppercase tracking-widest italic">Predictive Dispatch</h3>
              </div>
              <span className="text-[10px] font-black text-text-secondary uppercase tracking-widest">Live</span>
            </div>

            <div className="relative flex flex-col gap-3 max-h-[360px] overflow-y-auto custom-scrollbar pr-1">
              {predictiveDispatches.length === 0 && (
                <div className="p-4 rounded-2xl border border-border-dark bg-background-dark/60 text-text-secondary text-[10px] font-black uppercase tracking-widest text-center">
                  No eligible responders online. Awaiting location sync.
                </div>
              )}

              {predictiveDispatches.map(dispatch => (
                <div key={dispatch.incidentId + dispatch.volunteerId} className="relative p-4 rounded-2xl border border-border-dark bg-background-dark/70 shadow-inner flex flex-col gap-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest border ${dispatch.priority === 'Critical' ? 'bg-accent-red/20 text-accent-red border-accent-red/40' : dispatch.priority === 'High' ? 'bg-accent-orange/20 text-accent-orange border-accent-orange/40' : 'bg-primary/20 text-primary border-primary/40'}`}>{dispatch.priority}</span>
                        <span className="text-[10px] font-mono text-primary">{dispatch.incidentId}</span>
                      </div>
                      <p className="text-white text-sm font-bold leading-tight line-clamp-2">{dispatch.incidentTitle}</p>
                      <p className="text-[10px] text-text-secondary uppercase font-black flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">pin_drop</span>
                        {dispatch.targetLocationName}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="text-[11px] font-black text-white">{dispatch.etaMinutes}m ETA</span>
                      <span className="text-[10px] font-mono text-text-secondary">{dispatch.distanceKm} km</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 text-[10px] font-black uppercase text-text-secondary">
                    <span className="px-2 py-1 rounded-lg bg-slate-800/80 border border-border-dark flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">diversity_3</span>
                      {dispatch.volunteerName} ({dispatch.volunteerStatus})
                    </span>
                    {dispatch.routePlan.riskFactors.map((risk, idx) => (
                      <span key={idx} className="px-2 py-1 rounded-lg bg-amber-500/10 text-amber-300 border border-amber-500/30">{risk}</span>
                    ))}
                  </div>

                  <div className="text-[11px] text-slate-200 leading-snug border-t border-border-dark pt-3 flex flex-col gap-2">
                    <span className="font-black uppercase tracking-widest text-[9px] text-text-secondary flex items-center gap-1">
                      <span className="material-symbols-outlined text-[12px]">route</span> Route Brief
                    </span>
                    <ul className="list-disc list-inside space-y-1 marker:text-primary">
                      {dispatch.routePlan.steps.slice(0, 3).map((step, idx) => (
                        <li key={idx} className="text-[11px] text-slate-300 leading-snug">{step}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleCenterToCoords(incidents.find(i => i.id === dispatch.incidentId)?.lat, incidents.find(i => i.id === dispatch.incidentId)?.lng)}
                      className="flex-1 py-2 rounded-xl bg-primary text-white text-[10px] font-black uppercase tracking-widest shadow-glow active:scale-95 transition-all flex items-center justify-center gap-1"
                    >
                      <span className="material-symbols-outlined text-[14px]">map</span>
                      Focus Incident
                    </button>
                    <button
                      onClick={() => handleCenterToCoords(volunteers.find(v => v.id === dispatch.volunteerId)?.lat, volunteers.find(v => v.id === dispatch.volunteerId)?.lng)}
                      className="flex-1 py-2 rounded-xl bg-slate-800 text-white text-[10px] font-black uppercase tracking-widest hover:bg-slate-700 transition-all flex items-center justify-center gap-1 border border-border-dark"
                    >
                      <span className="material-symbols-outlined text-[14px]">person_pin_circle</span>
                      Focus Responder
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-card-dark border border-border-dark rounded-[3rem] p-6 shadow-xl flex flex-col gap-4 relative overflow-hidden group">
            <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <h3 className="text-white text-sm font-black uppercase tracking-widest italic">Base Network</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3.5 bg-slate-900/50 rounded-2xl border border-border-dark">
                <span className="text-[10px] text-text-secondary uppercase font-bold">L2 Sequencer</span>
                <span className="text-[10px] font-black text-accent-green uppercase tracking-widest">Active</span>
              </div>
              <div className="flex items-center justify-between p-3.5 bg-slate-900/50 rounded-2xl border border-border-dark">
                <span className="text-[10px] text-text-secondary uppercase font-bold">Base Gas</span>
                <span className="text-[10px] font-black text-white uppercase tracking-widest">0.1 gwei</span>
              </div>
            </div>
            <button onClick={() => navigate('/admin')} className="w-full py-4 bg-primary text-white rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-glow active:scale-95 transition-all mt-2 flex items-center justify-center gap-2">
              <span className="material-symbols-outlined text-sm">settings_suggest</span> Diagnostics
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;