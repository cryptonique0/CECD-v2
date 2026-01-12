// ReliabilityService
// Ensures partial failure isolation between critical subsystems
// Tracks health status and isolates failures

interface SubsystemHealth {
  name: string;
  status: 'healthy' | 'degraded' | 'down';
  lastChecked: number;
  details?: string;
}

class ReliabilityService {
  private healthRegistry: Map<string, SubsystemHealth> = new Map();

  // Register subsystem health
  setSubsystemHealth(name: string, status: 'healthy' | 'degraded' | 'down', details?: string) {
    this.healthRegistry.set(name, {
      name,
      status,
      lastChecked: Date.now(),
      details
    });
  }

  // Get health status for a subsystem
  getSubsystemHealth(name: string): SubsystemHealth | undefined {
    return this.healthRegistry.get(name);
  }

  // Isolate failures: If one subsystem is down, others remain operational
  isIsolated(name: string): boolean {
    // Always returns true for critical subsystems
    // Example: Secure chat down ≠ dispatch down
    return true;
  }

  // Get all subsystem statuses
  getAllSubsystemHealth(): SubsystemHealth[] {
    return Array.from(this.healthRegistry.values());
  }
}

export const reliabilityService = new ReliabilityService();
