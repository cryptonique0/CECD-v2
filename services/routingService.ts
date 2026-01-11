import { Incident, IncidentStatus, Severity, User } from "../types";

interface RoutePlan {
  from: string;
  to: string;
  distanceKm: number;
  etaMinutes: number;
  steps: string[];
  riskFactors: string[];
  advisory: string;
}

export interface DispatchSuggestion {
  incidentId: string;
  incidentTitle: string;
  targetLocationName: string;
  volunteerId: string;
  volunteerName: string;
  volunteerStatus: User["status"];
  distanceKm: number;
  etaMinutes: number;
  priority: "Critical" | "High" | "Medium";
  routePlan: RoutePlan;
}

const EARTH_RADIUS_KM = 6371;

const weatherFactors = [
  { label: "Clear", multiplier: 1, advisory: "Routes nominal." },
  { label: "Heavy Rain", multiplier: 1.25, advisory: "Avoid low-lying underpasses; expect reduced visibility." },
  { label: "High Winds", multiplier: 1.2, advisory: "Watch for debris and power lines." },
  { label: "Flooded Roads", multiplier: 1.35, advisory: "Reroute around known flood zones; do not cross standing water." },
  { label: "Snow/Ice", multiplier: 1.4, advisory: "Use chains where applicable; extend braking distance." }
];

const trafficFactors = [
  { label: "Free Flow", multiplier: 1 },
  { label: "Moderate", multiplier: 1.15 },
  { label: "Heavy", multiplier: 1.3 },
  { label: "Incident Nearby", multiplier: 1.2 },
  { label: "Checkpoint", multiplier: 1.1 }
];

const severityPriority: Record<Severity, DispatchSuggestion["priority"]> = {
  [Severity.CRITICAL]: "Critical",
  [Severity.HIGH]: "High",
  [Severity.MEDIUM]: "Medium",
  [Severity.LOW]: "Medium"
};

function toRadians(deg: number) {
  return (deg * Math.PI) / 180;
}

function haversineDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_KM * c;
}

function buildRoutePlan(from: User, incident: Incident): RoutePlan {
  const weather = weatherFactors[Math.floor(Math.random() * weatherFactors.length)];
  const traffic = trafficFactors[Math.floor(Math.random() * trafficFactors.length)];

  const baseDistance = haversineDistanceKm(from.lat || 0, from.lng || 0, incident.lat, incident.lng);
  const distanceKm = parseFloat(baseDistance.toFixed(2));

  // Assume average 60 km/h baseline, apply multipliers for conditions
  const etaBaseMinutes = (distanceKm / 60) * 60;
  const etaMinutes = Math.max(3, Math.round(etaBaseMinutes * weather.multiplier * traffic.multiplier));

  const midpointLat = ((from.lat || 0) + incident.lat) / 2;
  const midpointLng = ((from.lng || 0) + incident.lng) / 2;

  const steps = [
    `Depart current position (${from.location || "Field"}) and head toward staging corridor (${distanceKm} km total).`,
    `Maintain ${weather.label.toLowerCase()} protocol; ${weather.advisory}`,
    `${traffic.label} traffic expected near corridor midpoint (${midpointLat.toFixed(3)}, ${midpointLng.toFixed(3)}).`,
    `Final approach: switch to local access routes for ${incident.locationName}.`
  ];

  const riskFactors = [weather.label, traffic.label];

  return {
    from: from.location || "Field",
    to: incident.locationName,
    distanceKm,
    etaMinutes,
    steps,
    riskFactors,
    advisory: weather.advisory
  };
}

function pickVolunteer(volunteers: User[], incident: Incident): User | null {
  const eligible = volunteers.filter(v => v.lat && v.lng && v.status !== "OffDuty");
  if (eligible.length === 0) return null;

  let best: { user: User; distance: number } | null = null;

  eligible.forEach(v => {
    if (v.lat === undefined || v.lng === undefined) return;
    const dist = haversineDistanceKm(v.lat, v.lng, incident.lat, incident.lng);
    if (!best || dist < best.distance) {
      best = { user: v, distance: dist };
    }
  });

  return best?.user || null;
}

export function buildPredictiveDispatches(incidents: Incident[], volunteers: User[]): DispatchSuggestion[] {
  const activeIncidents = incidents.filter(i => i.status !== IncidentStatus.CLOSED);

  const suggestions: DispatchSuggestion[] = [];

  activeIncidents.forEach(incident => {
    const volunteer = pickVolunteer(volunteers, incident);
    if (!volunteer) return;

    const routePlan = buildRoutePlan(volunteer, incident);

    suggestions.push({
      incidentId: incident.id,
      incidentTitle: incident.title,
      targetLocationName: incident.locationName,
      volunteerId: volunteer.id,
      volunteerName: volunteer.name,
      volunteerStatus: volunteer.status,
      distanceKm: routePlan.distanceKm,
      etaMinutes: routePlan.etaMinutes,
      priority: severityPriority[incident.severity],
      routePlan
    });
  });

  // Order by priority then fastest ETA
  return suggestions
    .sort((a, b) => {
      const priorityRank = { Critical: 0, High: 1, Medium: 2 } as const;
      if (priorityRank[a.priority] !== priorityRank[b.priority]) {
        return priorityRank[a.priority] - priorityRank[b.priority];
      }
      return a.etaMinutes - b.etaMinutes;
    })
    .slice(0, 6);
}
