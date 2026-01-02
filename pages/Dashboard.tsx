
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Incident, Severity, IncidentStatus, IncidentCategory, User } from '../types';
import { SEVERITY_COLORS, STATUS_COLORS, CATEGORY_ICONS } from '../constants';
import { useNavigate } from 'react-router-dom';
import { analyticsService } from '../services/analyticsService';

declare const L: any;

interface DashboardProps {
  incidents: Incident[];
  volunteers?: User[];
  currentUser?: User;
}

const Dashboard: React.FC<DashboardProps> = ({ incidents, volunteers = [], currentUser }) => {
  const navigate = useNavigate();
  const mapRef = useRef<any>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  
  // Storage for map objects to allow reactive updates without flickering
  const markersRef = useRef<{ [key: string]: any }>({});
  const volunteerMarkersRef = useRef<{ [key: string]: any }>({});
  const zonesRef = useRef<{ [key: string]: any }>({});
  
  const [riskAreas, setRiskAreas] = useState<any[]>([]);

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

    L.control.zoom({ position: 'topright' }).addTo(mapRef.current);

    // Event delegation for popup buttons
    mapRef.current.on('popupopen', (e: any) => {
      const container = e.popup._container;
      const btn = container.querySelector('.view-details-btn');
      if (btn) {
        btn.onclick = () => {
          const id = btn.getAttribute('data-id');
          if (id) navigate(`/incidents/${id}`);
        };
      }
    });

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [navigate]);

  // 2. Sync User Location Marker with Real-time Location Name Label
  useEffect(() => {
    if (!mapRef.current || !currentUser?.lat || !currentUser?.lng) return;

    const userId = 'current-user';
    const locName = currentUser.location || "Acquiring Position...";
    
    if (markersRef.current[userId]) {
      const marker = markersRef.current[userId];
      marker.setLatLng([currentUser.lat, currentUser.lng]);
      // Update marker label text dynamically
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
            <!-- Location Label -->
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

  // 3. Sync Incident Markers & Strategic Zones
  useEffect(() => {
    if (!mapRef.current) return;

    // Clean up markers and zones for incidents that are gone or closed
    Object.keys(markersRef.current).forEach(id => {
      if (id !== 'current-user' && !incidents.find(inc => inc.id === id && inc.status !== IncidentStatus.CLOSED)) {
        markersRef.current[id].remove();
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

      // RADIUS LOGIC for Incident Zones
      const radiusMap = {
        [Severity.CRITICAL]: 1000,
        [Severity.HIGH]: 500,
        [Severity.MEDIUM]: 250,
        [Severity.LOW]: 100
      };
      const radius = radiusMap[incident.severity] || 100;

      // Popup Content Template
      const popupHtml = `
        <div class="p-1 min-w-[200px] flex flex-col gap-3">
          <div class="flex items-center gap-2 mb-1">
            <span class="material-symbols-outlined text-primary text-sm">${iconName}</span>
            <h4 class="text-xs font-black text-white uppercase tracking-tighter line-clamp-1">${incident.title}</h4>
          </div>
          <div class="flex gap-2">
            <span class="px-2 py-0.5 rounded text-[8px] font-black uppercase border border-white/10 ${STATUS_COLORS[incident.status]}">${incident.status}</span>
            <span class="px-2 py-0.5 rounded text-[8px] font-black uppercase border border-white/10 ${SEVERITY_COLORS[incident.severity]}">${incident.severity}</span>
          </div>
          <p class="text-[10px] text-text-secondary line-clamp-2 leading-tight italic">
            ${incident.description}
          </p>
          <button data-id="${incident.id}" class="view-details-btn mt-2 w-full py-2 bg-primary hover:bg-primary-dark text-white rounded-lg text-[9px] font-black uppercase tracking-widest shadow-glow transition-all active:scale-95 flex items-center justify-center gap-2">
            <span class="material-symbols-outlined text-xs">open_in_new</span>
            Enter Command Room
          </button>
        </div>
      `;

      // Update or Create Marker
      if (markersRef.current[incident.id]) {
        const marker = markersRef.current[incident.id];
        marker.setLatLng([incident.lat, incident.lng]);
        marker.getPopup().setContent(popupHtml);
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

        const marker = L.marker([incident.lat, incident.lng], { icon }).addTo(mapRef.current);
        marker.bindPopup(popupHtml, {
          className: 'custom-tactical-popup',
          closeButton: false,
          offset: [0, -10]
        });
        markersRef.current[incident.id] = marker;
      }

      // Update or Create Impact Zone
      if (zonesRef.current[incident.id]) {
        zonesRef.current[incident.id].setLatLng([incident.lat, incident.lng]);
        zonesRef.current[incident.id].setRadius(radius);
      } else {
        const zone = L.circle([incident.lat, incident.lng], {
          radius: radius,
          color: markerColor,
          fillColor: markerColor,
          fillOpacity: 0.1,
          weight: 1,
          dashArray: '5, 5'
        }).addTo(mapRef.current);
        zonesRef.current[incident.id] = zone;
      }
    });
  }, [incidents, navigate]);

  // 4. Sync Volunteer Locations Reactively
  useEffect(() => {
    if (!mapRef.current) return;

    // Filter out volunteers who are no longer in the list or don't have coordinates
    Object.keys(volunteerMarkersRef.current).forEach(vId => {
      if (!volunteers.find(v => v.id === vId && v.lat && v.lng)) {
        volunteerMarkersRef.current[vId].remove();
        delete volunteerMarkersRef.current[vId];
      }
    });

    volunteers.forEach(volunteer => {
      // Don't show current user again (already handled by user marker)
      if (volunteer.id === currentUser?.id) return;
      if (!volunteer.lat || !volunteer.lng) return;

      const statusColor = volunteer.status === 'Available' ? '#10b981' : volunteer.status === 'Busy' ? '#f59e0b' : '#94a3b8';
      const isMoving = volunteer.status === 'Available';

      if (volunteerMarkersRef.current[volunteer.id]) {
        volunteerMarkersRef.current[volunteer.id].setLatLng([volunteer.lat, volunteer.lng]);
      } else {
        const volIcon = L.divIcon({
          className: 'volunteer-marker',
          html: `
            <div class="relative flex items-center justify-center group">
              ${isMoving ? `<div class="absolute size-6 rounded-full opacity-40 animate-ping" style="background-color: ${statusColor}"></div>` : ''}
              <div class="size-4 rounded-full border-2 border-white shadow-lg relative z-10 transition-transform hover:scale-150" style="background-color: ${statusColor}"></div>
              <div class="absolute bottom-full mb-2 bg-card-dark text-white text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded-md border border-border-dark opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                ${volunteer.name}
              </div>
            </div>
          `,
          iconSize: [20, 20],
          iconAnchor: [10, 10]
        });

        const marker = L.marker([volunteer.lat, volunteer.lng], { icon: volIcon }).addTo(mapRef.current);
        volunteerMarkersRef.current[volunteer.id] = marker;
      }
    });
  }, [volunteers, currentUser?.id]);

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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight italic uppercase">Global Command Center</h1>
          <div className="flex items-center gap-3 mt-1">
             <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-accent-green text-[9px] font-black uppercase">
                <span className="size-1.5 rounded-full bg-accent-green animate-pulse"></span>
                Node Verified: Protocol 2.5
             </div>
             <div className="text-[9px] text-text-secondary font-black uppercase opacity-60">
               Tracking {volunteers.filter(v => v.lat).length} Active Peers
             </div>
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

          {/* Location Overlay - Exact Location Name Displayed Here Too */}
          <div className="absolute top-6 left-6 z-[1000] pointer-events-none w-full max-w-sm">
            <div className="bg-card-dark/95 backdrop-blur-xl border border-border-dark p-4 rounded-[2.5rem] shadow-2xl pointer-events-auto transition-all duration-500">
               <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/30 w-fit">
                    <span className="material-symbols-outlined text-[12px] text-primary filled animate-pulse">radar</span>
                    <span className="text-[9px] font-black text-white uppercase tracking-widest">Base Signal Established</span>
                  </div>

                  <div className={`p-4 rounded-3xl border-2 transition-all duration-500 ${
                    currentUser?.location && currentUser.location !== "Acquiring Secure Signal..." 
                    ? 'bg-slate-900/90 border-emerald-500/30 shadow-glow-sm' 
                    : 'bg-background-dark/80 border-border-dark opacity-80'
                  }`}>
                    <div className="flex items-center gap-2 mb-2">
                       <span className={`material-symbols-outlined text-sm ${currentUser?.location && currentUser.location !== "Acquiring Secure Signal..." ? 'text-accent-green filled' : 'text-slate-500 animate-spin'}`}>
                         {currentUser?.location && currentUser.location !== "Acquiring Secure Signal..." ? 'verified' : 'sync'}
                       </span>
                       <span className="text-[10px] font-black text-white uppercase tracking-widest">
                         {currentUser?.location && currentUser.location !== "Acquiring Secure Signal..." ? 'VERIFIED POSITION' : 'SYNCHRONIZING...'}
                       </span>
                    </div>
                    <p className="text-sm font-black text-white italic truncate pr-4 h-5">
                      {currentUser?.location || "Acquiring Secure Signal..."}
                    </p>
                    <div className="mt-3 flex items-center gap-3">
                       <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                          <div className={`h-full bg-accent-green transition-all duration-1000 ${currentUser?.location ? 'w-full' : 'w-1/4'}`}></div>
                       </div>
                       <span className="text-[9px] font-mono text-slate-500 font-bold">
                         {currentUser?.lat?.toFixed(5)}, {currentUser?.lng?.toFixed(5)}
                       </span>
                    </div>
                  </div>
               </div>
            </div>
          </div>

          {/* Map Legend */}
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
            <h4 className="text-[10px] font-black text-white uppercase tracking-widest mb-5 italic flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-sm">analytics</span>
              Regional Threat Index
            </h4>
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
              <span className="material-symbols-outlined text-primary">broadcast_on_personal</span>
              Tactical Feed
            </h3>
            <div className="flex flex-col gap-3 overflow-y-auto max-h-[350px] custom-scrollbar pr-2">
              {incidents.filter(i => i.status !== IncidentStatus.CLOSED).slice(0, 8).map(inc => (
                <div 
                  key={inc.id}
                  onClick={() => navigate(`/incidents/${inc.id}`)}
                  className="p-3.5 bg-background-dark/50 border border-border-dark rounded-2xl hover:border-primary/50 cursor-pointer transition-all group hover:bg-card-hover"
                >
                  <div className="flex justify-between items-start mb-1.5">
                    <span className="text-[9px] font-mono text-primary font-black uppercase">{inc.id}</span>
                    <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-lg border ${STATUS_COLORS[inc.status]}`}>{inc.status}</span>
                  </div>
                  <h4 className="text-xs font-bold text-white group-hover:text-primary transition-colors line-clamp-1">{inc.title}</h4>
                  <p className="text-[10px] text-text-secondary truncate mt-1.5 opacity-60 uppercase font-black">{inc.locationName}</p>
                </div>
              ))}
            </div>
            <button 
              onClick={() => navigate('/incidents')}
              className="w-full py-4 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all mt-2 active:scale-95"
            >
              Access Global Ledger
            </button>
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
            <button 
              onClick={() => navigate('/admin')}
              className="w-full py-4 bg-primary text-white rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-glow active:scale-95 transition-all mt-2 flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-sm">settings_suggest</span>
              Diagnostics
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
