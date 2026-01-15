/**
 * Local Storage Service - Persistent user preferences and data
 */

export interface StorageKey {
  userPreferences: 'user_prefs';
  incidentFilters: 'incident_filters';
  volunteerFilters: 'volunteer_filters';
  appSettings: 'app_settings';
  recentSearches: 'recent_searches';
  customDashboard: 'custom_dashboard';
  accessibilitySettings: 'accessibility_settings';
}

interface UserPreferences {
  theme?: 'dark' | 'light';
  language?: string;
  notifications?: boolean;
  minimumSeverityFilter?: string;
  lastSeenIncident?: string;
  favoriteIncidents?: string[];
}

interface AppSettings {
  mapZoom?: number;
  defaultLocation?: { lat: number; lng: number };
  autoRefresh?: boolean;
  refreshInterval?: number;
}

class LocalStorageService {
  private prefix = 'cecd_';
  private enableLogging = false;

  private getStorageKey(key: string): string {
    return `${this.prefix}${key}`;
  }

  private log(message: string, data?: any) {
    if (this.enableLogging) {
      console.log(`[LocalStorage] ${message}`, data);
    }
  }

  /**
   * Save data to localStorage
   */
  save<T>(key: string, data: T): boolean {
    try {
      const storageKey = this.getStorageKey(key);
      const serialized = JSON.stringify(data);
      localStorage.setItem(storageKey, serialized);
      this.log(`Saved: ${key}`, data);
      return true;
    } catch (error) {
      console.error(`[LocalStorage] Failed to save ${key}:`, error);
      return false;
    }
  }

  /**
   * Retrieve data from localStorage
   */
  get<T>(key: string, defaultValue?: T): T | null {
    try {
      const storageKey = this.getStorageKey(key);
      const item = localStorage.getItem(storageKey);

      if (item === null) {
        this.log(`Not found: ${key}`);
        return defaultValue || null;
      }

      const parsed = JSON.parse(item) as T;
      this.log(`Retrieved: ${key}`, parsed);
      return parsed;
    } catch (error) {
      console.error(`[LocalStorage] Failed to get ${key}:`, error);
      return defaultValue || null;
    }
  }

  /**
   * Remove data from localStorage
   */
  remove(key: string): boolean {
    try {
      const storageKey = this.getStorageKey(key);
      localStorage.removeItem(storageKey);
      this.log(`Removed: ${key}`);
      return true;
    } catch (error) {
      console.error(`[LocalStorage] Failed to remove ${key}:`, error);
      return false;
    }
  }

  /**
   * Clear all app data
   */
  clearAll(): boolean {
    try {
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(this.prefix)) {
          keysToRemove.push(key);
        }
      }

      keysToRemove.forEach(key => localStorage.removeItem(key));
      this.log(`Cleared all app data (${keysToRemove.length} items)`);
      return true;
    } catch (error) {
      console.error('[LocalStorage] Failed to clear all:', error);
      return false;
    }
  }

  /**
   * Get all stored keys
   */
  getAllKeys(): string[] {
    const keys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(this.prefix)) {
        keys.push(key.replace(this.prefix, ''));
      }
    }
    return keys;
  }

  /**
   * Save user preferences
   */
  saveUserPreferences(prefs: Partial<UserPreferences>): boolean {
    const existing = this.get<UserPreferences>('user_prefs') || {};
    return this.save('user_prefs', { ...existing, ...prefs });
  }

  /**
   * Get user preferences
   */
  getUserPreferences(): UserPreferences {
    return this.get<UserPreferences>('user_prefs', {}) || {};
  }

  /**
   * Save app settings
   */
  saveAppSettings(settings: Partial<AppSettings>): boolean {
    const existing = this.get<AppSettings>('app_settings') || {};
    return this.save('app_settings', { ...existing, ...settings });
  }

  /**
   * Get app settings
   */
  getAppSettings(): AppSettings {
    return this.get<AppSettings>('app_settings', {}) || {};
  }

  /**
   * Save incident filters
   */
  saveIncidentFilters(filters: Record<string, any>): boolean {
    return this.save('incident_filters', filters);
  }

  /**
   * Get incident filters
   */
  getIncidentFilters(): Record<string, any> {
    return this.get<Record<string, any>>('incident_filters', {}) || {};
  }

  /**
   * Add to recent searches
   */
  addRecentSearch(search: string): boolean {
    const searches = this.get<string[]>('recent_searches', []) || [];

    // Remove duplicates and keep only unique searches
    const updated = [search, ...searches.filter(s => s !== search)].slice(0, 20);

    return this.save('recent_searches', updated);
  }

  /**
   * Get recent searches
   */
  getRecentSearches(): string[] {
    return this.get<string[]>('recent_searches', []) || [];
  }

  /**
   * Clear recent searches
   */
  clearRecentSearches(): boolean {
    return this.remove('recent_searches');
  }

  /**
   * Save favorite incident
   */
  addFavoriteIncident(incidentId: string): boolean {
    const favorites = this.get<string[]>('favorite_incidents', []) || [];

    if (!favorites.includes(incidentId)) {
      favorites.push(incidentId);
      return this.save('favorite_incidents', favorites);
    }

    return true;
  }

  /**
   * Remove favorite incident
   */
  removeFavoriteIncident(incidentId: string): boolean {
    const favorites = this.get<string[]>('favorite_incidents', []) || [];
    const updated = favorites.filter(id => id !== incidentId);
    return this.save('favorite_incidents', updated);
  }

  /**
   * Get favorite incidents
   */
  getFavoriteIncidents(): string[] {
    return this.get<string[]>('favorite_incidents', []) || [];
  }

  /**
   * Check if incident is favorite
   */
  isFavorite(incidentId: string): boolean {
    const favorites = this.getFavoriteIncidents();
    return favorites.includes(incidentId);
  }

  /**
   * Save accessibility settings
   */
  saveAccessibilitySettings(settings: Record<string, any>): boolean {
    return this.save('accessibility_settings', settings);
  }

  /**
   * Get accessibility settings
   */
  getAccessibilitySettings(): Record<string, any> {
    return this.get<Record<string, any>>('accessibility_settings', {}) || {};
  }

  /**
   * Get storage size (approximate)
   */
  getStorageSize(): number {
    let size = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(this.prefix)) {
        const item = localStorage.getItem(key);
        if (item) {
          size += item.length + (key.length * 2);
        }
      }
    }
    return size;
  }

  /**
   * Watch for changes (using storage events)
   */
  watch(callback: (key: string, newValue: any) => void) {
    const listener = (event: StorageEvent) => {
      if (event.key && event.key.startsWith(this.prefix)) {
        const key = event.key.replace(this.prefix, '');
        const newValue = event.newValue ? JSON.parse(event.newValue) : null;
        callback(key, newValue);
      }
    };

    window.addEventListener('storage', listener);

    return () => {
      window.removeEventListener('storage', listener);
    };
  }
}

export const localStorageService = new LocalStorageService();
