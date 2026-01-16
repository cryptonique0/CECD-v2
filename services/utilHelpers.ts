/**
 * Utility Helpers - Common functions for UI and business logic
 */

import { Incident, Severity, IncidentStatus } from '../types';

/**
 * Format timestamp to readable date
 */
export const formatDate = (timestamp: number): string => {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;

  return date.toLocaleDateString();
};

/**
 * Format timestamp to time-only
 */
export const formatTime = (timestamp: number): string => {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
};

/**
 * Format timestamp to full date-time
 */
export const formatDateTime = (timestamp: number): string => {
  const date = new Date(timestamp);
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
};

/**
 * Calculate incident age in minutes
 */
export const getIncidentAgeMinutes = (timestamp: number): number => {
  return Math.floor((Date.now() - timestamp) / 60000);
};

/**
 * Get severity color class
 */
export const getSeverityClass = (severity: Severity): string => {
  const severityMap: Record<Severity, string> = {
    [Severity.LOW]: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    [Severity.MEDIUM]: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    [Severity.HIGH]: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    [Severity.CRITICAL]: 'bg-red-500/20 text-red-400 border-red-500/30'
  };
  return severityMap[severity] || severityMap[Severity.LOW];
};

/**
 * Get status badge color
 */
export const getStatusClass = (status: IncidentStatus): string => {
  const statusMap: Record<IncidentStatus, string> = {
    [IncidentStatus.REPORTED]: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
    [IncidentStatus.ACKNOWLEDGED]: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    [IncidentStatus.IN_PROGRESS]: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    [IncidentStatus.RESOLVED]: 'bg-green-500/20 text-green-400 border-green-500/30',
    [IncidentStatus.CLOSED]: 'bg-slate-500/20 text-slate-400 border-slate-500/30'
  };
  return statusMap[status] || statusMap[IncidentStatus.REPORTED];
};

/**
 * Calculate distance between two coordinates
 */
export const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLng = (lng2 - lng1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

/**
 * Format distance for display
 */
export const formatDistance = (km: number): string => {
  if (km < 1) {
    return `${Math.round(km * 1000)}m`;
  }
  return `${km.toFixed(1)}km`;
};

/**
 * Truncate text with ellipsis
 */
export const truncateText = (text: string, length: number = 50): string => {
  if (text.length <= length) return text;
  return text.substring(0, length) + '...';
};

/**
 * Debounce function
 */
export const debounce = <T extends (...args: any[]) => any>(fn: T, delay: number = 300) => {
  let timeoutId: ReturnType<typeof setTimeout>;

  return ((...args: any[]) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  }) as T;
};

/**
 * Throttle function
 */
export const throttle = <T extends (...args: any[]) => any>(fn: T, limit: number = 300) => {
  let inThrottle: boolean;

  return ((...args: any[]) => {
    if (!inThrottle) {
      fn(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  }) as T;
};

/**
 * Safe JSON parse
 */
export const safeParse = <T = any>(json: string, fallback?: T): T | undefined => {
  try {
    return JSON.parse(json);
  } catch {
    return fallback;
  }
};

/**
 * Check if value is empty
 */
export const isEmpty = (value: any): boolean => {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string') return value.trim().length === 0;
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object') return Object.keys(value).length === 0;
  return false;
};

/**
 * Deep clone object
 */
export const deepClone = <T>(obj: T): T => {
  return JSON.parse(JSON.stringify(obj));
};

/**
 * Check if arrays are equal
 */
export const arraysEqual = <T>(a: T[], b: T[]): boolean => {
  if (a.length !== b.length) return false;
  return a.every((val, index) => val === b[index]);
};

/**
 * Unique array values
 */
export const unique = <T>(arr: T[]): T[] => {
  return [...new Set(arr)];
};

/**
 * Group array by key
 */
export const groupBy = <T>(arr: T[], key: keyof T): Record<string, T[]> => {
  return arr.reduce((acc, item) => {
    const k = String(item[key]);
    if (!acc[k]) acc[k] = [];
    acc[k].push(item);
    return acc;
  }, {} as Record<string, T[]>);
};

/**
 * Get initials from name
 */
export const getInitials = (name: string): string => {
  return name
    .split(' ')
    .slice(0, 2)
    .map(word => word[0]?.toUpperCase())
    .join('');
};

/**
 * Convert to uppercase with spaces
 */
export const toTitleCase = (str: string): string => {
  return str
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

/**
 * Color contrast checker
 */
export const getContrastColor = (hex: string): 'white' | 'black' => {
  const r = parseInt(hex.substr(1, 2), 16);
  const g = parseInt(hex.substr(3, 2), 16);
  const b = parseInt(hex.substr(5, 2), 16);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 155 ? 'black' : 'white';
};

/**
 * Generate random color
 */
export const randomColor = (): string => {
  return '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
};

/**
 * Sleep/delay
 */
export const sleep = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * Retry with exponential backoff (utility)
 */
export const retryAsync = async <T>(
  fn: () => Promise<T>,
  maxAttempts: number = 3,
  delay: number = 1000
): Promise<T> => {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      if (attempt < maxAttempts - 1) {
        await sleep(delay * Math.pow(2, attempt));
      }
    }
  }

  throw lastError || new Error('Max retry attempts exceeded');
};

/**
 * Create a URL-safe slug
 */
export const slugify = (str: string): string => {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

/**
 * Parse query parameters
 */
export const parseQueryParams = (search: string): Record<string, string> => {
  const params = new URLSearchParams(search);
  const result: Record<string, string> = {};

  for (const [key, value] of params.entries()) {
    result[key] = value;
  }

  return result;
};

/**
 * Build query string
 */
export const buildQueryString = (params: Record<string, any>): string => {
  const query = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value !== null && value !== undefined) {
      query.set(key, String(value));
    }
  }

  return query.toString();
};

export default {
  formatDate,
  formatTime,
  formatDateTime,
  getIncidentAgeMinutes,
  getSeverityClass,
  getStatusClass,
  calculateDistance,
  formatDistance,
  truncateText,
  debounce,
  throttle,
  safeParse,
  isEmpty,
  deepClone,
  arraysEqual,
  unique,
  groupBy,
  getInitials,
  toTitleCase,
  getContrastColor,
  randomColor,
  sleep,
  retryAsync,
  slugify,
  parseQueryParams,
  buildQueryString
};
