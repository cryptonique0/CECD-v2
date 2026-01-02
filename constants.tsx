
import { IncidentCategory, Severity, IncidentStatus } from './types';

export const CATEGORY_ICONS: Record<IncidentCategory, string> = {
  [IncidentCategory.MEDICAL]: 'medical_services',
  [IncidentCategory.FIRE]: 'local_fire_department',
  [IncidentCategory.FLOOD]: 'flood',
  [IncidentCategory.STORM]: 'thunderstorm',
  [IncidentCategory.EARTHQUAKE]: 'landslide',
  [IncidentCategory.SECURITY]: 'security',
  [IncidentCategory.THEFT]: 'lock',
  [IncidentCategory.PUBLIC_HEALTH]: 'health_and_safety',
  [IncidentCategory.HAZARD]: 'warning',
  [IncidentCategory.KIDNAPPING]: 'person_alert',
  [IncidentCategory.OTHER]: 'category',
};

export const SEVERITY_COLORS: Record<Severity, string> = {
  [Severity.LOW]: 'text-accent-green bg-accent-green/10 border-accent-green/20',
  [Severity.MEDIUM]: 'text-accent-orange bg-accent-orange/10 border-accent-orange/20',
  [Severity.HIGH]: 'text-accent-red bg-accent-red/10 border-accent-red/20',
  [Severity.CRITICAL]: 'text-white bg-accent-red border-accent-red shadow-lg shadow-red-500/30',
};

export const STATUS_COLORS: Record<IncidentStatus, string> = {
  [IncidentStatus.REPORTED]: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
  [IncidentStatus.ACKNOWLEDGED]: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  [IncidentStatus.IN_PROGRESS]: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  [IncidentStatus.RESOLVED]: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  [IncidentStatus.CLOSED]: 'bg-slate-700/50 text-slate-500 border-slate-700/50',
};
