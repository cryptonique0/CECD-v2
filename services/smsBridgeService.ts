import { Incident, IncidentCategory, Severity, IncidentStatus, User } from '../types';

function mapCategory(input: string): IncidentCategory {
  const normalized = input.trim().toLowerCase();
  const match = Object.values(IncidentCategory).find(c => c.toLowerCase() === normalized);
  return match || IncidentCategory.OTHER;
}

function mapSeverity(input: string): Severity {
  const normalized = input.trim().toLowerCase();
  const match = Object.values(Severity).find(s => s.toLowerCase() === normalized);
  return match || Severity.LOW;
}

/**
 * Very simple parser for inbound SMS strings with key:value pairs.
 * Example: "CAT:Medical; SEV:High; LOC:Central Hospital; DESC:Multiple injured after crash"
 */
export function parseSmsPayload(text: string): {
  category?: IncidentCategory;
  severity?: Severity;
  locationName?: string;
  description?: string;
  title?: string;
} {
  const out: any = {};
  const parts = text.split(/;|\n/);
  for (const part of parts) {
    const [k, v] = part.split(/:/);
    if (!k || !v) continue;
    const key = k.trim().toLowerCase();
    const val = v.trim();
    if (key.startsWith('cat')) out.category = mapCategory(val);
    else if (key.startsWith('sev')) out.severity = mapSeverity(val);
    else if (key.startsWith('loc')) out.locationName = val;
    else if (key.startsWith('desc')) out.description = val;
    else if (key.startsWith('title')) out.title = val;
  }
  return out;
}

/**
 * Build an Incident object from an SMS/USSD payload. Intended for server/gateway ingestion,
 * but can be used locally for demos. Marks as pendingSync for store-and-forward.
 */
export function buildIncidentFromSms(
  text: string,
  fromNumber: string,
  reporter: User,
  fallbackCoords?: { lat: number; lng: number }
): Incident {
  const parsed = parseSmsPayload(text);
  const now = Date.now();
  const id = `SMS-${Math.floor(Math.random() * 900000) + 100000}`;

  return {
    id,
    title: parsed.title || `${parsed.category || IncidentCategory.OTHER} ALERT`,
    description: parsed.description || text,
    translatedDescription: undefined,
    category: parsed.category || IncidentCategory.OTHER,
    severity: parsed.severity || Severity.LOW,
    status: IncidentStatus.REPORTED,
    locationName: parsed.locationName || reporter.location || 'Unknown Sector',
    lat: reporter.lat ?? fallbackCoords?.lat ?? 0,
    lng: reporter.lng ?? fallbackCoords?.lng ?? 0,
    reporterId: reporter.id || fromNumber,
    timestamp: now,
    assignedResponders: [],
    confidenceScore: 0.5,
    isWhisperMode: false,
    blockNumber: undefined,
    hash: undefined,
    zkProof: undefined,
    pendingSync: true
  };
}
