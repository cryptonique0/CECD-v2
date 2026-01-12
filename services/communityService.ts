import { CommunityMetrics, VolunteerStats, Achievement, User } from '../types';

class CommunityService {
  private volunteerStats: Map<string, VolunteerStats> = new Map();
  private achievements: Map<string, Achievement> = new Map();
  private communityMetrics: CommunityMetrics;
  private leaderboard: Array<{ userId: string; score: number; rank: string }> = [];

  constructor() {
    this.initializeAchievements();
    this.communityMetrics = this.getDefaultMetrics();
  }

  private initializeAchievements() {
    const achievements: Achievement[] = [
      {
        id: 'ach-001',
        title: 'First Response',
        description: 'Respond to your first incident',
        icon: '🚨',
        criteria: 'Respond to 1 incident'
      },
      {
        id: 'ach-002',
        title: 'Lifesaver',
        description: 'Successfully resolve a critical incident',
        icon: '❤️',
        criteria: 'Resolve critical incident'
      },
      {
        id: 'ach-003',
        title: 'Night Shift Warrior',
        description: 'Complete 10 shifts between 10 PM and 6 AM',
        icon: '🌙',
        criteria: 'Complete 10 night shifts'
      },
      {
        id: 'ach-004',
        title: 'Speed Responder',
        description: 'Average response time under 5 minutes for 5 incidents',
        icon: '⚡',
        criteria: 'Avg response time < 5 min'
      },
      {
        id: 'ach-005',
        title: 'Trusted Mentor',
        description: 'Receive 50+ helpful votes from peers',
        icon: '👨‍🏫',
        criteria: '50+ helpful votes'
      },
      {
        id: 'ach-006',
        title: '100 Hour Mark',
        description: 'Complete 100 hours of service',
        icon: '⏰',
        criteria: '100 hours service'
      },
      {
        id: 'ach-007',
        title: 'Perfect Record',
        description: 'Achieve 100% success rate on incidents',
        icon: '⭐',
        criteria: '100% success rate'
      },
      {
        id: 'ach-008',
        title: 'Community Leader',
        description: 'Become a top contributor in community',
        icon: '👑',
        criteria: 'Top 10 contributor'
      },
      {
        id: 'ach-009',
        title: 'Skills Master',
        description: 'Complete all beginner level certifications',
        icon: '📚',
        criteria: 'All beginner certs'
      },
      {
        id: 'ach-010',
        title: 'Responder of the Month',
        description: 'Win responder of the month award',
        icon: '🏆',
        criteria: 'Monthly award winner'
      }
    ];

    achievements.forEach(ach => {
      this.achievements.set(ach.id, ach);
    });
  }

  private getDefaultMetrics(): CommunityMetrics {
    return {
      totalVolunteers: 0,
      activeToday: 0,
      totalIncidentsResolved: 0,
      averageResponseTime: 0,
      communityTrustScore: 0,
      topContributors: [],
      recentMilestones: []
    };
  }

  /**
   * Initialize volunteer stats
   */
  initializeVolunteerStats(user: User): void {
    if (!this.volunteerStats.has(user.id)) {
      this.volunteerStats.set(user.id, {
        volunteerId: user.id,
        incidentsResponded: 0,
        successRate: 100,
        totalHoursServed: 0,
        achievements: [],
        certifications: [],
        communityScore: Math.floor(Math.random() * 5000),
        rank: 'Volunteer'
      });
    }
  }

  /**
   * Record incident response
   */
  recordIncidentResponse(volunteerId: string, successful: boolean, durationMinutes: number): void {
    let stats = this.volunteerStats.get(volunteerId);
    if (!stats) {
      stats = {
        volunteerId,
        incidentsResponded: 0,
        successRate: 100,
        totalHoursServed: 0,
        achievements: [],
        certifications: [],
        communityScore: 0,
        rank: 'Volunteer'
      };
      this.volunteerStats.set(volunteerId, stats);
    }

    const totalIncidents = stats.incidentsResponded + 1;
    const currentSuccesses = Math.floor((stats.successRate / 100) * stats.incidentsResponded);
    const newSuccesses = successful ? currentSuccesses + 1 : currentSuccesses;

    stats.incidentsResponded = totalIncidents;
    stats.successRate = (newSuccesses / totalIncidents) * 100;
    stats.totalHoursServed += durationMinutes / 60;
    stats.communityScore += successful ? 50 : 10;

    this.checkAchievements(volunteerId, stats);
    this.updateRank(volunteerId, stats);
  }

  /**
   * Check and unlock achievements
   */
  private checkAchievements(volunteerId: string, stats: VolunteerStats): void {
    const newAchievements: Achievement[] = [];

    // First Response
    if (stats.incidentsResponded === 1) {
      const ach = this.achievements.get('ach-001');
      if (ach && !stats.achievements.find(a => a.id === 'ach-001')) {
        newAchievements.push({ ...ach, unlockedAt: Date.now() });
      }
    }

    // 100 Hour Mark
    if (stats.totalHoursServed >= 100) {
      const ach = this.achievements.get('ach-006');
      if (ach && !stats.achievements.find(a => a.id === 'ach-006')) {
        newAchievements.push({ ...ach, unlockedAt: Date.now() });
      }
    }

    // Perfect Record
    if (stats.successRate === 100 && stats.incidentsResponded >= 5) {
      const ach = this.achievements.get('ach-007');
      if (ach && !stats.achievements.find(a => a.id === 'ach-007')) {
        newAchievements.push({ ...ach, unlockedAt: Date.now() });
      }
    }

    stats.achievements.push(...newAchievements);
  }

  /**
   * Update volunteer rank based on stats
   */
  private updateRank(volunteerId: string, stats: VolunteerStats): void {
    const score = stats.communityScore;
    
    if (score >= 5000) {
      stats.rank = '🏆 Elite Responder';
    } else if (score >= 3000) {
      stats.rank = '⭐ Senior Responder';
    } else if (score >= 1500) {
      stats.rank = '💪 Experienced Responder';
    } else if (score >= 500) {
      stats.rank = '📈 Growing Responder';
    } else {
      stats.rank = '🌱 Community Volunteer';
    }
  }

  /**
   * Get volunteer stats
   */
  getVolunteerStats(volunteerId: string): VolunteerStats | undefined {
    return this.volunteerStats.get(volunteerId);
  }

  /**
   * Get all volunteer stats
   */
  getAllVolunteerStats(): VolunteerStats[] {
    return Array.from(this.volunteerStats.values());
  }

  /**
   * Get leaderboard
   */
  getLeaderboard(limit: number = 10): VolunteerStats[] {
    return Array.from(this.volunteerStats.values())
      .sort((a, b) => b.communityScore - a.communityScore)
      .slice(0, limit);
  }

  /**
   * Get volunteer achievements
   */
  getVolunteerAchievements(volunteerId: string): Achievement[] {
    const stats = this.volunteerStats.get(volunteerId);
    return stats?.achievements || [];
  }

  /**
   * Award badge/certification
   */
  addCertification(volunteerId: string, certificationName: string): void {
    const stats = this.volunteerStats.get(volunteerId);
    if (stats && !stats.certifications.includes(certificationName)) {
      stats.certifications.push(certificationName);
      stats.communityScore += 100;
      this.updateRank(volunteerId, stats);
    }
  }

  /**
   * Calculate community metrics
   */
  calculateCommunityMetrics(users: User[], incidents: any[]): CommunityMetrics {
    const stats = Array.from(this.volunteerStats.values());
    const activeUsers = users.filter(u => u.status === 'Available' || u.status === 'Busy').length;
    const resolvedIncidents = incidents.filter((i: any) => i.status === 'Resolved').length;
    
    const totalResponseTime = stats.reduce((sum, s) => {
      return sum + (s.totalHoursServed > 0 ? s.totalHoursServed / Math.max(s.incidentsResponded, 1) : 0);
    }, 0);

    const avgResponseTime = stats.length > 0 ? (totalResponseTime / stats.length) * 60 : 0; // in minutes

    const topContributors = Array.from(this.volunteerStats.values())
      .sort((a, b) => b.communityScore - a.communityScore)
      .slice(0, 5)
      .map(s => ({ userId: s.volunteerId, score: s.communityScore }));

    const recentMilestones: string[] = [];
    if (resolvedIncidents % 100 === 0 && resolvedIncidents > 0) {
      recentMilestones.push(`Reached ${resolvedIncidents} incidents resolved!`);
    }
    if (activeUsers > 50) {
      recentMilestones.push('50+ volunteers active!');
    }

    this.communityMetrics = {
      totalVolunteers: users.length,
      activeToday: activeUsers,
      totalIncidentsResolved: resolvedIncidents,
      averageResponseTime: Math.round(avgResponseTime),
      communityTrustScore: Math.min(100, Math.round((topContributors.reduce((s, c) => s + c.score, 0) / 50000) * 100)),
      topContributors,
      recentMilestones
    };

    return this.communityMetrics;
  }

  /**
   * Get community metrics
   */
  getCommunityMetrics(): CommunityMetrics {
    return this.communityMetrics;
  }

  /**
   * Get achievements
   */
  getAllAchievements(): Achievement[] {
    return Array.from(this.achievements.values());
  }

  /**
   * Add custom peer review/recognition
   */
  addPeerRecognition(volunteerId: string, recognitionPoints: number): void {
    const stats = this.volunteerStats.get(volunteerId);
    if (stats) {
      stats.communityScore += recognitionPoints;
      this.updateRank(volunteerId, stats);
    }
  }

  /**
   * Get volunteer rank
   */
  getVolunteerRank(volunteerId: string): string {
    return this.volunteerStats.get(volunteerId)?.rank || 'Newcomer';
  }

  /**
   * Check if volunteer qualifies for award
   */
  qualifiesForAward(volunteerId: string): boolean {
    const stats = this.volunteerStats.get(volunteerId);
    if (!stats) return false;
    return stats.communityScore >= 1000 && stats.successRate >= 85;
  }
}

export const communityService = new CommunityService();
