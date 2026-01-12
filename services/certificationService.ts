import { auditTrailService } from './auditTrailService';

export interface Certification {
  id: string;
  name: string;
  category: 'medical' | 'fire' | 'rescue' | 'hazmat' | 'leadership' | 'communications' | 'other';
  description: string;
  level: 'basic' | 'intermediate' | 'advanced' | 'expert';
  validityPeriod: number; // in milliseconds
  prerequisites: string[];
  renewalRequired: boolean;
}

export interface VolunteerCertification {
  id: string;
  volunteerId: string;
  volunteerName: string;
  certificationId: string;
  issuedBy: string;
  issuedAt: number;
  expiresAt: number;
  status: 'active' | 'expired' | 'suspended' | 'pending_renewal';
  verificationDocuments: string[];
  renewalHistory: {
    renewedAt: number;
    renewedBy: string;
    previousExpiryDate: number;
    newExpiryDate: number;
  }[];
}

export interface TrainingSession {
  id: string;
  certificationId: string;
  name: string;
  instructor: string;
  scheduledAt: number;
  durationHours: number;
  location: string;
  maxParticipants: number;
  enrolledParticipants: string[];
  completedParticipants: string[];
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
}

export interface SkillGapAnalysis {
  category: string;
  requiredCertifications: string[];
  currentCertifications: number;
  gap: number;
  criticalShortage: boolean;
}

const standardCertifications: Certification[] = [
  {
    id: 'cert-cpr',
    name: 'CPR & First Aid',
    category: 'medical',
    description: 'Basic life support and emergency medical response',
    level: 'basic',
    validityPeriod: 2 * 365 * 24 * 60 * 60 * 1000, // 2 years
    prerequisites: [],
    renewalRequired: true,
  },
  {
    id: 'cert-emt',
    name: 'EMT-Basic',
    category: 'medical',
    description: 'Emergency Medical Technician certification',
    level: 'intermediate',
    validityPeriod: 3 * 365 * 24 * 60 * 60 * 1000,
    prerequisites: ['cert-cpr'],
    renewalRequired: true,
  },
  {
    id: 'cert-fire',
    name: 'Firefighter I',
    category: 'fire',
    description: 'Basic structural firefighting',
    level: 'basic',
    validityPeriod: 5 * 365 * 24 * 60 * 60 * 1000,
    prerequisites: [],
    renewalRequired: true,
  },
  {
    id: 'cert-rescue',
    name: 'Technical Rescue',
    category: 'rescue',
    description: 'Rope rescue, confined space, and collapse operations',
    level: 'advanced',
    validityPeriod: 3 * 365 * 24 * 60 * 60 * 1000,
    prerequisites: ['cert-fire'],
    renewalRequired: true,
  },
  {
    id: 'cert-hazmat',
    name: 'Hazmat Operations',
    category: 'hazmat',
    description: 'Hazardous materials awareness and response',
    level: 'intermediate',
    validityPeriod: 3 * 365 * 24 * 60 * 60 * 1000,
    prerequisites: ['cert-cpr'],
    renewalRequired: true,
  },
  {
    id: 'cert-ics',
    name: 'ICS-100/200',
    category: 'leadership',
    description: 'Incident Command System basics',
    level: 'basic',
    validityPeriod: 5 * 365 * 24 * 60 * 60 * 1000,
    prerequisites: [],
    renewalRequired: false,
  },
];

export const certificationService = {
  certifications: new Map<string, Certification>(
    standardCertifications.map(c => [c.id, c])
  ),
  volunteerCerts: new Map<string, VolunteerCertification>(),
  trainingSessions: new Map<string, TrainingSession>(),

  issueCertification(
    volunteerId: string,
    volunteerName: string,
    certificationId: string,
    issuedBy: string,
    verificationDocuments: string[] = []
  ): VolunteerCertification {
    const cert = this.certifications.get(certificationId);
    if (!cert) throw new Error(`Certification ${certificationId} not found`);

    const now = Date.now();
    const volCert: VolunteerCertification = {
      id: `vol-cert-${Date.now()}`,
      volunteerId,
      volunteerName,
      certificationId,
      issuedBy,
      issuedAt: now,
      expiresAt: now + cert.validityPeriod,
      status: 'active',
      verificationDocuments,
      renewalHistory: [],
    };

    this.volunteerCerts.set(volCert.id, volCert);

    auditTrailService.recordEvent(
      'CERT_SYSTEM',
      issuedBy,
      'CERTIFICATION_ISSUED',
      `${cert.name} issued to ${volunteerName}`
    );

    return volCert;
  },

  renewCertification(volCertId: string, renewedBy: string): VolunteerCertification {
    const volCert = this.volunteerCerts.get(volCertId);
    if (!volCert) throw new Error(`Volunteer certification ${volCertId} not found`);

    const cert = this.certifications.get(volCert.certificationId);
    if (!cert) throw new Error(`Certification ${volCert.certificationId} not found`);

    const now = Date.now();
    const previousExpiry = volCert.expiresAt;
    const newExpiry = Math.max(now, previousExpiry) + cert.validityPeriod;

    volCert.renewalHistory.push({
      renewedAt: now,
      renewedBy,
      previousExpiryDate: previousExpiry,
      newExpiryDate: newExpiry,
    });

    volCert.expiresAt = newExpiry;
    volCert.status = 'active';

    this.volunteerCerts.set(volCertId, volCert);

    auditTrailService.recordEvent(
      'CERT_SYSTEM',
      renewedBy,
      'CERTIFICATION_RENEWED',
      `${cert?.name} renewed for ${volCert.volunteerName}`
    );

    return volCert;
  },

  checkExpiry(): VolunteerCertification[] {
    const now = Date.now();
    const thirtyDays = 30 * 24 * 60 * 60 * 1000;
    const expiringOrExpired: VolunteerCertification[] = [];

    for (const volCert of this.volunteerCerts.values()) {
      if (volCert.status !== 'active') continue;

      if (volCert.expiresAt < now) {
        volCert.status = 'expired';
        this.volunteerCerts.set(volCert.id, volCert);
        expiringOrExpired.push(volCert);
      } else if (volCert.expiresAt - now < thirtyDays) {
        volCert.status = 'pending_renewal';
        this.volunteerCerts.set(volCert.id, volCert);
        expiringOrExpired.push(volCert);
      }
    }

    return expiringOrExpired;
  },

  getVolunteerCertifications(volunteerId: string): VolunteerCertification[] {
    return Array.from(this.volunteerCerts.values()).filter(
      vc => vc.volunteerId === volunteerId
    );
  },

  hasActiveCertification(volunteerId: string, certificationId: string): boolean {
    const certs = this.getVolunteerCertifications(volunteerId);
    const match = certs.find(
      c => c.certificationId === certificationId && c.status === 'active'
    );
    return !!match;
  },

  createTrainingSession(
    certificationId: string,
    name: string,
    instructor: string,
    scheduledAt: number,
    durationHours: number,
    location: string,
    maxParticipants: number
  ): TrainingSession {
    const session: TrainingSession = {
      id: `train-${Date.now()}`,
      certificationId,
      name,
      instructor,
      scheduledAt,
      durationHours,
      location,
      maxParticipants,
      enrolledParticipants: [],
      completedParticipants: [],
      status: 'scheduled',
    };

    this.trainingSessions.set(session.id, session);

    auditTrailService.recordEvent(
      'CERT_SYSTEM',
      instructor,
      'TRAINING_SESSION_CREATED',
      `${name} scheduled for ${new Date(scheduledAt).toLocaleDateString()}`
    );

    return session;
  },

  enrollInTraining(sessionId: string, volunteerId: string): TrainingSession {
    const session = this.trainingSessions.get(sessionId);
    if (!session) throw new Error(`Training session ${sessionId} not found`);

    if (session.enrolledParticipants.length >= session.maxParticipants) {
      throw new Error('Training session is full');
    }

    if (session.enrolledParticipants.includes(volunteerId)) {
      throw new Error('Volunteer already enrolled');
    }

    session.enrolledParticipants.push(volunteerId);
    this.trainingSessions.set(sessionId, session);

    return session;
  },

  completeTraining(sessionId: string, volunteerId: string): TrainingSession {
    const session = this.trainingSessions.get(sessionId);
    if (!session) throw new Error(`Training session ${sessionId} not found`);

    if (!session.enrolledParticipants.includes(volunteerId)) {
      throw new Error('Volunteer not enrolled in this session');
    }

    if (!session.completedParticipants.includes(volunteerId)) {
      session.completedParticipants.push(volunteerId);
    }

    this.trainingSessions.set(sessionId, session);

    return session;
  },

  analyzeSkillGaps(volunteers: { id: string; name: string }[], requiredCerts: string[]): SkillGapAnalysis[] {
    const gaps: SkillGapAnalysis[] = [];

    for (const certId of requiredCerts) {
      const cert = this.certifications.get(certId);
      if (!cert) continue;

      const certified = volunteers.filter(v =>
        this.hasActiveCertification(v.id, certId)
      ).length;

      const gap = volunteers.length - certified;
      const criticalShortage = gap / volunteers.length > 0.5; // More than 50% uncertified

      gaps.push({
        category: cert.name,
        requiredCertifications: [certId],
        currentCertifications: certified,
        gap,
        criticalShortage,
      });
    }

    return gaps.sort((a, b) => b.gap - a.gap);
  },

  getUpcomingTrainingSessions(): TrainingSession[] {
    const now = Date.now();
    return Array.from(this.trainingSessions.values())
      .filter(s => s.scheduledAt > now && s.status === 'scheduled')
      .sort((a, b) => a.scheduledAt - b.scheduledAt);
  },

  getCertification(certId: string): Certification | undefined {
    return this.certifications.get(certId);
  },

  getTrainingSession(sessionId: string): TrainingSession | undefined {
    return this.trainingSessions.get(sessionId);
  },
};
