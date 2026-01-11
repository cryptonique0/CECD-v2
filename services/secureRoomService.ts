import { Incident } from "../types";
import { auditTrailService } from "./auditTrailService";

export interface EphemeralKey {
  id: string;
  incidentId: string;
  createdBy: string;
  createdAt: number;
  expiresAt: number;
  token: string; // simulated
}

export interface SecureRoom {
  id: string;
  incidentId: string;
  createdAt: number;
  participants: Set<string>; // user ids or names
  ephemeralKeys: EphemeralKey[];
}

const rooms = new Map<string, SecureRoom>(); // key: incidentId

function simpleHash(data: string): string {
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16).padStart(16, '0');
}

export const secureRoomService = {
  createRoom(incidentId: string): SecureRoom {
    const existing = rooms.get(incidentId);
    if (existing) return existing;

    const room: SecureRoom = {
      id: `room_${incidentId}_${Date.now()}`,
      incidentId,
      createdAt: Date.now(),
      participants: new Set<string>(),
      ephemeralKeys: [],
    };
    rooms.set(incidentId, room);
    auditTrailService.recordEvent(incidentId, 'system', 'SECURE_ROOM_CREATED', `Room ${room.id}`);
    return room;
  },

  getRoom(incidentId: string): SecureRoom | undefined {
    return rooms.get(incidentId);
  },

  addParticipant(incidentId: string, participant: string): void {
    const room = this.getRoom(incidentId) || this.createRoom(incidentId);
    room.participants.add(participant);
    auditTrailService.recordEvent(incidentId, participant, 'SECURE_ROOM_JOINED', `Joined room ${room.id}`);
  },

  removeParticipant(incidentId: string, participant: string): void {
    const room = this.getRoom(incidentId);
    if (!room) return;
    room.participants.delete(participant);
    auditTrailService.recordEvent(incidentId, participant, 'SECURE_ROOM_LEFT', `Left room ${room.id}`);
  },

  generateEphemeralKey(
    incidentId: string,
    actor: string,
    ttlMs: number = 60 * 60 * 1000 // default 1h
  ): EphemeralKey {
    const room = this.getRoom(incidentId) || this.createRoom(incidentId);
    const key: EphemeralKey = {
      id: `key_${Date.now()}_${Math.random().toString(16).slice(2)}`,
      incidentId,
      createdBy: actor,
      createdAt: Date.now(),
      expiresAt: Date.now() + ttlMs,
      token: simpleHash(incidentId + actor + Date.now()),
    };
    room.ephemeralKeys.push(key);
    auditTrailService.recordEvent(incidentId, actor, 'EPHEMERAL_KEY_ISSUED', `Key ${key.id} (expires ${new Date(key.expiresAt).toISOString()})`);
    return key;
  },

  validateKey(incidentId: string, token: string): boolean {
    const room = this.getRoom(incidentId);
    if (!room) return false;
    const now = Date.now();
    return room.ephemeralKeys.some(k => k.token === token && k.expiresAt > now);
  },

  encrypt(incidentId: string, plaintext: string, token: string): string {
    if (!this.validateKey(incidentId, token)) {
      throw new Error('Invalid or expired key');
    }
    // Simulated: base64 + token suffix
    const encoded = Buffer.from(plaintext, 'utf-8').toString('base64');
    return `${encoded}.${token.slice(0, 8)}`;
  },

  decrypt(incidentId: string, ciphertext: string, token: string): string {
    if (!this.validateKey(incidentId, token)) {
      throw new Error('Invalid or expired key');
    }
    const [encoded] = ciphertext.split('.')
    return Buffer.from(encoded, 'base64').toString('utf-8');
  }
};
