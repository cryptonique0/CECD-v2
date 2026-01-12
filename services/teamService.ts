export interface Team {
  id: string;
  name: string;
  description: string;
  leader: string; // userId
  members: TeamMember[];
  createdAt: number;
  specialization: string; // e.g., 'Medical', 'Fire', 'Search & Rescue'
  certifications: Certification[];
  activeIncidents: string[]; // incidentIds
  performanceScore: number; // 0-100
}

export interface TeamMember {
  userId: string;
  name: string;
  role: string;
  joinedAt: number;
  status: 'active' | 'inactive' | 'on-leave';
  skills: string[];
  certifications: string[];
  performanceRating: number; // 0-5 stars
  hoursContributed: number;
}

export interface Certification {
  id: string;
  name: string;
  issuer: string;
  expiryDate: number;
  verificationUrl?: string;
  earnedBy: string[]; // userIds
}

export interface TeamPerformance {
  teamId: string;
  totalIncidentsResponded: number;
  averageResponseTime: number; // minutes
  averageResolutionTime: number; // minutes
  successRate: number; // 0-100
  memberRetention: number; // 0-100
  certificationsValid: number;
  certificationsExpired: number;
  lastUpdated: number;
}

interface TeamService {
  createTeam(name: string, leader: string, specialization: string): Team;
  getTeam(id: string): Team | null;
  listTeams(specialization?: string): Team[];
  addMember(teamId: string, userId: string, name: string, role: string, skills: string[]): void;
  removeMember(teamId: string, userId: string): void;
  updateMemberStatus(teamId: string, userId: string, status: 'active' | 'inactive' | 'on-leave'): void;
  assignIncident(teamId: string, incidentId: string): void;
  completeIncident(teamId: string, incidentId: string): void;
  addCertification(teamId: string, certification: Omit<Certification, 'id'>): Certification;
  getTeamPerformance(teamId: string): TeamPerformance;
  updateMemberPerformanceRating(teamId: string, userId: string, rating: number): void;
  searchTeams(query: string): Team[];
  getTeamsBySpecialization(specialization: string): Team[];
}

class TeamServiceImpl implements TeamService {
  private teams: Map<string, Team> = new Map();
  private performances: Map<string, TeamPerformance> = new Map();
  private teamCounter = 0;
  private certCounter = 0;

  constructor() {
    this.initializeSampleTeams();
  }

  private initializeSampleTeams() {
    const medicalTeam = this.createTeam('Medical Rapid Response', 'user-1', 'Medical');
    this.addMember(medicalTeam.id, 'user-2', 'Sarah Chen', 'Paramedic Lead', ['Advanced Life Support', 'Trauma Care']);
    this.addMember(medicalTeam.id, 'user-3', 'Michael Santos', 'EMT', ['Basic Life Support', 'Patient Transport']);
    this.addMember(medicalTeam.id, 'user-4', 'Jasmine Roy', 'Nurse', ['Patient Assessment', 'Wound Management']);

    const fireTeam = this.createTeam('Fire & Rescue Squadron', 'user-5', 'Fire');
    this.addMember(fireTeam.id, 'user-6', 'James Murphy', 'Fire Captain', ['Firefighting', 'Rescue Operations']);
    this.addMember(fireTeam.id, 'user-7', 'Lisa Park', 'Firefighter', ['Firefighting', 'Hazmat']);

    const searchTeam = this.createTeam('Search & Rescue Team', 'user-8', 'Search & Rescue');
    this.addMember(searchTeam.id, 'user-9', 'David Okonkwo', 'SAR Lead', ['Search Techniques', 'GPS Navigation']);
  }

  createTeam(name: string, leader: string, specialization: string): Team {
    const team: Team = {
      id: `team-${++this.teamCounter}`,
      name,
      description: `${specialization} team`,
      leader,
      members: [],
      createdAt: Date.now(),
      specialization,
      certifications: [],
      activeIncidents: [],
      performanceScore: 75,
    };

    this.teams.set(team.id, team);
    this.performances.set(team.id, {
      teamId: team.id,
      totalIncidentsResponded: 0,
      averageResponseTime: 0,
      averageResolutionTime: 0,
      successRate: 0,
      memberRetention: 100,
      certificationsValid: 0,
      certificationsExpired: 0,
      lastUpdated: Date.now(),
    });

    return team;
  }

  getTeam(id: string): Team | null {
    return this.teams.get(id) || null;
  }

  listTeams(specialization?: string): Team[] {
    const all = Array.from(this.teams.values());
    if (!specialization) return all;
    return all.filter(t => t.specialization === specialization);
  }

  addMember(teamId: string, userId: string, name: string, role: string, skills: string[]): void {
    const team = this.teams.get(teamId);
    if (!team) return;

    team.members.push({
      userId,
      name,
      role,
      joinedAt: Date.now(),
      status: 'active',
      skills,
      certifications: [],
      performanceRating: 4.5,
      hoursContributed: 0,
    });
  }

  removeMember(teamId: string, userId: string): void {
    const team = this.teams.get(teamId);
    if (team) {
      team.members = team.members.filter(m => m.userId !== userId);
    }
  }

  updateMemberStatus(teamId: string, userId: string, status: 'active' | 'inactive' | 'on-leave'): void {
    const team = this.teams.get(teamId);
    if (!team) return;
    const member = team.members.find(m => m.userId === userId);
    if (member) {
      member.status = status;
    }
  }

  assignIncident(teamId: string, incidentId: string): void {
    const team = this.teams.get(teamId);
    if (team && !team.activeIncidents.includes(incidentId)) {
      team.activeIncidents.push(incidentId);
    }
  }

  completeIncident(teamId: string, incidentId: string): void {
    const team = this.teams.get(teamId);
    if (team) {
      team.activeIncidents = team.activeIncidents.filter(id => id !== incidentId);
      const perf = this.performances.get(teamId);
      if (perf) {
        perf.totalIncidentsResponded++;
      }
    }
  }

  addCertification(teamId: string, certification: Omit<Certification, 'id'>): Certification {
    const team = this.teams.get(teamId);
    if (!team) throw new Error('Team not found');

    const fullCert: Certification = {
      id: `cert-${++this.certCounter}`,
      ...certification,
    };

    team.certifications.push(fullCert);
    return fullCert;
  }

  getTeamPerformance(teamId: string): TeamPerformance {
    const perf = this.performances.get(teamId);
    if (!perf) throw new Error('Performance data not found');
    return perf;
  }

  updateMemberPerformanceRating(teamId: string, userId: string, rating: number): void {
    const team = this.teams.get(teamId);
    if (!team) return;
    const member = team.members.find(m => m.userId === userId);
    if (member) {
      member.performanceRating = Math.min(5, Math.max(0, rating));
    }
  }

  searchTeams(query: string): Team[] {
    const lower = query.toLowerCase();
    return Array.from(this.teams.values()).filter(t =>
      t.name.toLowerCase().includes(lower) ||
      t.specialization.toLowerCase().includes(lower) ||
      t.members.some(m => m.name.toLowerCase().includes(lower))
    );
  }

  getTeamsBySpecialization(specialization: string): Team[] {
    return Array.from(this.teams.values()).filter(t => t.specialization === specialization);
  }
}

export const teamService = new TeamServiceImpl();
