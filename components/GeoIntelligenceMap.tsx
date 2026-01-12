import React, { useEffect, useState } from 'react';
import { geospatialIntelligenceService, DroneFeed, SatelliteImage, HazardDetection } from '../services/geospatialIntelligenceService';
import { MapContainer, TileLayer, Marker, Popup, ImageOverlay, Circle } from 'react-leaflet';

export const GeoIntelligenceMap: React.FC = () => {
  const [droneFeeds, setDroneFeeds] = useState<DroneFeed[]>([]);
  const [satImages, setSatImages] = useState<SatelliteImage[]>([]);
  const [hazards, setHazards] = useState<HazardDetection[]>([]);

  useEffect(() => {
    setDroneFeeds(geospatialIntelligenceService.getDroneFeeds());
    setSatImages(geospatialIntelligenceService.getSatelliteImages());
    setHazards(geospatialIntelligenceService.getHazardDetections());
  }, []);

  return (
    <div style={{ height: '80vh', width: '100%', margin: '32px auto', maxWidth: 1200 }}>
      <MapContainer center={[37.7749, -122.4194]} zoom={10} style={{ height: '100%', width: '100%' }}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        {/* Satellite overlays */}
        {satImages.map(img => (
          <ImageOverlay
            key={img.id}
            url={img.imageUrl}
            bounds={img.bounds}
            opacity={0.5}
          />
        ))}
        {/* Drone feeds */}
        {droneFeeds.map(feed => (
          <Marker key={feed.id} position={[feed.lat, feed.lng]}>
            <Popup>
              <div>
                <b>Drone Feed</b><br />
                <a href={feed.streamUrl} target="_blank" rel="noopener noreferrer">View Live Stream</a><br />
                Altitude: {feed.altitude}m<br />
                Time: {new Date(feed.timestamp).toLocaleString()}
              </div>
            </Popup>
          </Marker>
        ))}
        {/* Hazard detections */}
        {hazards.map(h => (
          <Circle
            key={h.id}
            center={[h.location.lat, h.location.lng]}
            radius={h.severity * 10}
            color={h.type === 'fire' ? '#ef4444' : h.type === 'flood' ? '#3b82f6' : '#f59e0b'}
            fillOpacity={0.4}
          >
            <Popup>
              <div>
                <b>Hazard: {h.type}</b><br />
                Severity: {h.severity}/100<br />
                Detected by: {h.detectedBy}<br />
                Time: {new Date(h.timestamp).toLocaleString()}
              </div>
            </Popup>
          </Circle>
        ))}
      </MapContainer>
    </div>
  );
};
