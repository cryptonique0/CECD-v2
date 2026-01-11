
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Incident, Severity, IncidentStatus, IncidentCategory, User } from '../types';
import { SEVERITY_COLORS, STATUS_COLORS, CATEGORY_ICONS } from '../constants';
import { useNavigate } from 'react-router-dom';
import { analyticsService } from '../services/analyticsService';
import { buildPredictiveDispatches, DispatchSuggestion } from '../services/routingService';

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
  
  const [riskAreas, setRiskAreas] = useState<any[]>([]);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const predictiveDispatches = useMemo<DispatchSuggestion[]>(() => buildPredictiveDispatches(incidents, volunteers), [incidents, volunteers]);
  
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
