import { Incident, User, Severity } from '../types';

export interface VolunteerScore {
  volunteerId: string;
  name: string;
  skills: string[];
  score: number;
  components: {
    skillMatch: number;      // 0-1: % of required skills covered
    proximity: number;       // 0-1: inverse distance (closer = higher)
    availability: number;    // 0-1: available > busy > offduty
    trustScore: number;      // 0-1: normalized trust (0-1 scale)
  };
  distanceKm: number;
}

export interface SuggestedSquad {
  squadId: string;
  volunteers: VolunteerScore[];
  totalScore: number;
  estimatedArrivalMin: number;
  skillCoverage: string[];
  gaps: string[];
  summary: string;
}

export interface HandoffSuggestion {
  fromVolunteerId: string;
  fromName: string;
  fromRegion: string;
  toVolunteerId: string;
  toName: string;
  toRegion: string;
  reason: string;
  incidentId: string;
}

const HAVERSINE_KM = (lat1: number, lng1: number, lat2: number, lng2: number) => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

export const volunteerOptimizationService = {
  /**
   * Score and rank volunteers for an incident based on skills, proximity, availability, and trust.
   */
  scoreVolunteersForIncident(incident: Incident, volunteers: User[], trustScores?: Record<string, number>): VolunteerScore[] {
    const requiredSkills = incident.category.toLowerCase().split(/\s+/).slice(0, 2);
    
    return volunteers
      .filter(v => v.lat && v.lng)
      .map(vol => {
        const distanceKm = HAVERSINE_KM(incident.lat, incident.lng, vol.lat!, vol.lng!);
        
        // Skill match: % of required skills the volunteer has
        const skillMatch = requiredSkills.length > 0
          ? requiredSkills.filter(skill => vol.skills.some(vs => vs.toLowerCase().includes(skill))).length / requiredSkills.length
          : 0.5;
        
        // Proximity: closer = higher (max 50km = score 0, 0km = score 1)
        const proximity = Math.max(0, 1 - distanceKm / 50);
        
        // Availability: available > busy > offduty
        const availability = vol.status === 'Available' ? 1 : vol.status === 'Busy' ? 0.5 : 0.1;
        
        // Trust score (0-1 scale, default 0.7)
        const trust = (trustScores?.[vol.id] ?? 0.7) / 1;
        
        // Weighted composite score
        const score = skillMatch * 0.35 + proximity * 0.3 + availability * 0.2 + trust * 0.15;
        
        return {
          volunteerId: vol.id,
          name: vol.name,
          skills: vol.skills,
          score,
          components: {
            skillMatch: Math.round(skillMatch * 100) / 100,
            proximity: Math.round(proximity * 100) / 100,
            availability,
            trustScore: Math.round(trust * 100) / 100
          },
          distanceKm: Math.round(distanceKm * 10) / 10
        };
      })
      .sort((a, b) => b.score - a.score);
  },

  /**
   * Generate suggested squads of complementary volunteers for an incident.
   */
  suggestSquads(incident: Incident, volunteers: User[], trustScores?: Record<string, number>): SuggestedSquad[] {
    const scored = this.scoreVolunteersForIncident(incident, volunteers, trustScores);
    const squads: SuggestedSquad[] = [];
    
    // Squad 1: Top scorer + 2 complementary volunteers
    if (scored.length >= 1) {
      const squad1 = [scored[0]];
      const squad1Skills = new Set(scored[0].skills);
      for (let i = 1; i < scored.length && squad1.length < 3; i++) {
        const newSkills = scored[i].skills.filter(s => !squad1Skills.has(s)).length;
        if (newSkills > 0 || squad1.length < 2) {
          squad1.push(scored[i]);
          scored[i].skills.forEach(s => squad1Skills.add(s));
        }
      }
      squads.push(this.buildSquad(squad1, incident));
    }
    
    // Squad 2: High-availability alternative
    const availableVols = scored.filter(v => v.components.availability >= 0.8);
    if (availableVols.length >= 2 && availableVols[0].volunteerId !== scored[0]?.volunteerId) {
      squads.push(this.buildSquad(availableVols.slice(0, 3), incident));
    }
    
    // Squad 3: High-trust backup
    const trustVols = scored.filter(v => v.components.trustScore >= 0.8);
    if (trustVols.length >= 2 && trustVols[0].volunteerId !== scored[0]?.volunteerId) {
      squads.push(this.buildSquad(trustVols.slice(0, 3), incident));
    }
    
    return squads.filter((s, i) => i === 0 || s.volunteers[0].volunteerId !== squads[0]?.volunteers[0]?.volunteerId);
  },

  /**
   * Build a single squad with analysis.
   */
  buildSquad(vols: VolunteerScore[], incident: Incident): SuggestedSquad {
    const allSkills = new Set(vols.flatMap(v => v.skills));
    const requiredSkills = incident.category.toLowerCase().split(/\s+/).slice(0, 2);
    const coveredSkills = requiredSkills.filter(s => Array.from(allSkills).some(vs => vs.toLowerCase().includes(s)));
    const gaps = requiredSkills.filter(s => !coveredSkills.includes(s));
    
    const totalScore = vols.reduce((sum, v) => sum + v.score, 0) / vols.length;
    const maxEta = Math.max(...vols.map(v => Math.ceil(v.distanceKm / 15))); // ~15 km/min avg
    
    const summary = `${vols.length}-person squad: ${vols.map(v => v.name).join(', ')}. ETA ${maxEta}m.`;
    
    return {
      squadId: `SQUAD-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      volunteers: vols,
      totalScore: Math.round(totalScore * 100) / 100,
      estimatedArrivalMin: maxEta,
      skillCoverage: coveredSkills,
      gaps,
      summary
    };
  },

  /**
   * Suggest handoffs when a volunteer is overloaded or when incidents occur across regions.
   */
  suggestHandoffs(
    assignedIncidents: Incident[],
    assignedVolunteer: User,
    unassignedIncidents: Incident[],
    allVolunteers: User[]
  ): HandoffSuggestion[] {
    const handoffs: HandoffSuggestion[] = [];
    
    // If volunteer has multiple assignments, suggest handing off the farthest/least-critical to another volunteer
    if (assignedIncidents.length > 2) {
      assignedIncidents.forEach(incident => {
        const candidates = allVolunteers.filter(v => v.id !== assignedVolunteer.id && v.status === 'Available');
        if (candidates.length === 0) return;
        
        const bestCandidate = candidates.reduce((best, curr) => {
          const currDist = HAVERSINE_KM(incident.lat, incident.lng, curr.lat || 0, curr.lng || 0);
          const bestDist = HAVERSINE_KM(incident.lat, incident.lng, best.lat || 0, best.lng || 0);
          return currDist < bestDist ? curr : best;
        });
        
        const origDist = HAVERSINE_KM(incident.lat, incident.lng, assignedVolunteer.lat || 0, assignedVolunteer.lng || 0);
        const newDist = HAVERSINE_KM(incident.lat, incident.lng, bestCandidate.lat || 0, bestCandidate.lng || 0);
        
        if (newDist < origDist * 0.7) {
          handoffs.push({
            fromVolunteerId: assignedVolunteer.id,
            fromName: assignedVolunteer.name,
            fromRegion: assignedVolunteer.location || 'Unknown',
            toVolunteerId: bestCandidate.id,
            toName: bestCandidate.name,
            toRegion: bestCandidate.location || 'Unknown',
            reason: `Better positioned (${Math.round(newDist)} km vs ${Math.round(origDist)} km). Frees up ${assignedVolunteer.name} for higher priority.`,
            incidentId: incident.id
          });
        }
      });
    }
    
    // Cross-region mutual aid: if a high-severity incident in one region has no nearby volunteers, suggest volunteers from adjacent regions
    unassignedIncidents
      .filter(inc => inc.severity === Severity.CRITICAL)
      .forEach(incident => {
        const nearby = allVolunteers.filter(v => HAVERSINE_KM(incident.lat, incident.lng, v.lat || 0, v.lng || 0) < 15);
        if (nearby.length === 0) {
          const distant = allVolunteers.filter(v => v.status === 'Available').sort((a, b) => {
            const aDist = HAVERSINE_KM(incident.lat, incident.lng, a.lat || 0, a.lng || 0);
            const bDist = HAVERSINE_KM(incident.lat, incident.lng, b.lat || 0, b.lng || 0);
            return aDist - bDist;
          })[0];
          
          if (distant) {
            const dist = HAVERSINE_KM(incident.lat, incident.lng, distant.lat || 0, distant.lng || 0);
            handoffs.push({
              fromVolunteerId: distant.id,
              fromName: distant.name,
              fromRegion: distant.location || 'Unknown',
              toVolunteerId: distant.id, // mutual aid: same volunteer offered
              toName: distant.name,
              toRegion: incident.locationName,
              reason: `Critical incident with no local responders. Mutual-aid handoff across regions.`,
              incidentId: incident.id
            });
          }
        }
      });
    
    return handoffs;
  }
};
