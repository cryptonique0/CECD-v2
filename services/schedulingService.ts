import { auditTrailService } from './auditTrailService';

export type ShiftType = 'day' | 'night' | 'emergency' | 'standby';
export type AvailabilityStatus = 'available' | 'on_duty' | 'off_duty' | 'on_leave' | 'unavailable';

export interface ShiftSchedule {
  id: string;
  volunteerId: string;
  volunteername: string;
  shiftType: ShiftType;
  startTime: number;
  endTime: number;
  location?: string;
  maxConsecutiveHours: number;
  createdAt: number;
  status: 'scheduled' | 'active' | 'completed' | 'cancelled';
}

export interface AvailabilitySlot {
  id: string;
  volunteerId: string;
  startTime: number;
  endTime: number;
  status: AvailabilityStatus;
  reason?: string;
  createdAt: number;
}

export interface ScheduleConflict {
  id: string;
  volunteerId: string;
  conflictType: 'double_booking' | 'excessive_hours' | 'rest_period_violation';
  description: string;
  affectedSchedules: string[];
  detectedAt: number;
  severity: 'low' | 'medium' | 'high';
}

export const schedulingService = {
  shifts: new Map<string, ShiftSchedule>(),
  availability: new Map<string, AvailabilitySlot[]>(),
  conflicts: new Map<string, ScheduleConflict[]>(),

  createShift(
    volunteerId: string,
    volunteername: string,
    shiftType: ShiftType,
    startTime: number,
    endTime: number,
    maxConsecutiveHours: number = 12,
    location?: string
  ): ShiftSchedule {
    const shift: ShiftSchedule = {
      id: `shift-${Date.now()}`,
      volunteerId,
      volunteername,
      shiftType,
      startTime,
      endTime,
      location,
      maxConsecutiveHours,
      createdAt: Date.now(),
      status: 'scheduled',
    };

    this.shifts.set(shift.id, shift);
    this.detectConflicts(volunteerId);
    return shift;
  },

  activateShift(shiftId: string, incidentId: string): ShiftSchedule {
    const shift = this.shifts.get(shiftId);
    if (!shift) throw new Error(`Shift ${shiftId} not found`);

    shift.status = 'active';
    this.shifts.set(shiftId, shift);

    auditTrailService.recordEvent(
      incidentId,
      shift.volunteername,
      'SHIFT_ACTIVATED',
      `Shift ${shiftId} activated for ${shift.volunteername}`
    );

    return shift;
  },

  completeShift(shiftId: string, incidentId: string, hoursWorked: number): ShiftSchedule {
    const shift = this.shifts.get(shiftId);
    if (!shift) throw new Error(`Shift ${shiftId} not found`);

    if (hoursWorked > shift.maxConsecutiveHours) {
      console.warn(
        `⚠️ Shift ${shiftId} exceeded max hours: ${hoursWorked}h > ${shift.maxConsecutiveHours}h`
      );
    }

    shift.status = 'completed';
    this.shifts.set(shiftId, shift);

    auditTrailService.recordEvent(
      incidentId,
      shift.volunteername,
      'SHIFT_COMPLETED',
      `${hoursWorked}h worked, fatigue risk: ${hoursWorked > 8 ? 'HIGH' : 'NORMAL'}`
    );

    return shift;
  },

  setAvailability(
    volunteerId: string,
    startTime: number,
    endTime: number,
    status: AvailabilityStatus,
    reason?: string
  ): AvailabilitySlot {
    const slot: AvailabilitySlot = {
      id: `avail-${Date.now()}`,
      volunteerId,
      startTime,
      endTime,
      status,
      reason,
      createdAt: Date.now(),
    };

    if (!this.availability.has(volunteerId)) {
      this.availability.set(volunteerId, []);
    }
    this.availability.get(volunteerId)!.push(slot);

    return slot;
  },

  getVolunteerAvailability(volunteerId: string, timestamp?: number): AvailabilityStatus {
    const now = timestamp || Date.now();
    const slots = this.availability.get(volunteerId) || [];

    // Find most recent applicable slot
    const applicable = slots
      .filter(s => s.startTime <= now && s.endTime >= now)
      .sort((a, b) => b.createdAt - a.createdAt)[0];

    return applicable?.status || 'available';
  },

  getVolunteerSchedule(volunteerId: string): ShiftSchedule[] {
    return Array.from(this.shifts.values()).filter(s => s.volunteerId === volunteerId);
  },

  getActiveShifts(volunteerId: string): ShiftSchedule[] {
    return this.getVolunteerSchedule(volunteerId).filter(s => s.status === 'active');
  },

  detectConflicts(volunteerId: string): ScheduleConflict[] {
    const conflicts: ScheduleConflict[] = [];
    const schedules = this.getVolunteerSchedule(volunteerId);

    // Check for double-booking
    for (let i = 0; i < schedules.length; i++) {
      for (let j = i + 1; j < schedules.length; j++) {
        const s1 = schedules[i];
        const s2 = schedules[j];

        // Check overlap
        if (
          (s1.startTime < s2.endTime && s1.endTime > s2.startTime) &&
          s1.status !== 'cancelled' &&
          s2.status !== 'cancelled'
        ) {
          const conflict: ScheduleConflict = {
            id: `conf-${Date.now()}-${Math.random()}`,
            volunteerId,
            conflictType: 'double_booking',
            description: `Overlap detected: Shift ${s1.id} and ${s2.id}`,
            affectedSchedules: [s1.id, s2.id],
            detectedAt: Date.now(),
            severity: 'high',
          };
          conflicts.push(conflict);
        }
      }
    }

    // Check for excessive consecutive hours
    for (const shift of schedules) {
      const hoursScheduled = (shift.endTime - shift.startTime) / (1000 * 60 * 60);
      if (hoursScheduled > shift.maxConsecutiveHours) {
        const conflict: ScheduleConflict = {
          id: `conf-${Date.now()}-${Math.random()}`,
          volunteerId,
          conflictType: 'excessive_hours',
          description: `Shift ${shift.id} exceeds max consecutive hours: ${hoursScheduled.toFixed(1)}h > ${shift.maxConsecutiveHours}h`,
          affectedSchedules: [shift.id],
          detectedAt: Date.now(),
          severity: 'medium',
        };
        conflicts.push(conflict);
      }
    }

    // Check for rest period violations (8-hour rest between shifts)
    const sortedSchedules = [...schedules].sort((a, b) => a.startTime - b.startTime);
    for (let i = 0; i < sortedSchedules.length - 1; i++) {
      const current = sortedSchedules[i];
      const next = sortedSchedules[i + 1];
      const restPeriod = (next.startTime - current.endTime) / (1000 * 60 * 60);

      if (restPeriod < 8 && current.status !== 'cancelled' && next.status !== 'cancelled') {
        const conflict: ScheduleConflict = {
          id: `conf-${Date.now()}-${Math.random()}`,
          volunteerId,
          conflictType: 'rest_period_violation',
          description: `Insufficient rest between shifts: only ${restPeriod.toFixed(1)}h (need 8h)`,
          affectedSchedules: [current.id, next.id],
          detectedAt: Date.now(),
          severity: 'medium',
        };
        conflicts.push(conflict);
      }
    }

    if (!this.conflicts.has(volunteerId)) {
      this.conflicts.set(volunteerId, []);
    }
    this.conflicts.set(volunteerId, conflicts);

    return conflicts;
  },

  getConflicts(volunteerId?: string): ScheduleConflict[] {
    if (!volunteerId) {
      return Array.from(this.conflicts.values()).flat();
    }
    return this.conflicts.get(volunteerId) || [];
  },

  suggestOptimalShift(volunteerId: string, duration: number): { startTime: number; endTime: number } | null {
    const availability = this.availability.get(volunteerId) || [];
    const shifts = this.getVolunteerSchedule(volunteerId);
    const now = Date.now();

    // Find first available window in next 7 days
    for (let day = 0; day < 7; day++) {
      for (let hour = 8; hour <= 20; hour++) {
        const startTime = now + day * 24 * 60 * 60 * 1000 + hour * 60 * 60 * 1000;
        const endTime = startTime + duration * 60 * 60 * 1000;

        // Check if available
        const slot = availability.find(
          s => s.startTime <= startTime && s.endTime >= endTime && s.status === 'available'
        );

        // Check no conflicts
        const hasConflict = shifts.some(
          s =>
            s.status !== 'cancelled' &&
            ((s.startTime < endTime && s.endTime > startTime))
        );

        if (slot && !hasConflict) {
          return { startTime, endTime };
        }
      }
    }

    return null;
  },

  getShift(shiftId: string): ShiftSchedule | undefined {
    return this.shifts.get(shiftId);
  },

  cancelShift(shiftId: string, reason: string): ShiftSchedule {
    const shift = this.shifts.get(shiftId);
    if (!shift) throw new Error(`Shift ${shiftId} not found`);

    shift.status = 'cancelled';
    this.shifts.set(shiftId, shift);

    return shift;
  },
};
