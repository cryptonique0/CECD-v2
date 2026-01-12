import { incidentEventPersistenceService } from '../services/incidentEventPersistenceService';
import { reliabilityService } from '../services/reliabilityService';
import { impactService } from '../services/impactService';

describe('Incident Event Persistence Integration', () => {
  it('should persist and replay incident events', () => {
    incidentEventPersistenceService.clearEvents();
    incidentEventPersistenceService.persistEvent('INC-TEST', 'create', { id: 'INC-TEST', title: 'Test Incident', status: 'Reported' });
    incidentEventPersistenceService.persistEvent('INC-TEST', 'update', { status: 'Resolved' });
    const replayed = incidentEventPersistenceService.replayIncident('INC-TEST');
    expect(replayed[0].status).toBe('Resolved');
  });
});

describe('Reliability Service Integration', () => {
  it('should isolate subsystem failures', () => {
    reliabilityService.setSubsystemHealth('SecureChat', 'down');
    reliabilityService.setSubsystemHealth('Dispatch', 'healthy');
    expect(reliabilityService.isIsolated('SecureChat')).toBe(true);
    expect(reliabilityService.getSubsystemHealth('Dispatch')?.status).toBe('healthy');
  });
});

describe('Impact Service Integration', () => {
  it('should add and retrieve incident impact summaries', () => {
    impactService.addIncidentImpact({
      incidentId: 'INC-IMPACT',
      title: 'Demo Impact',
      region: 'DemoRegion',
      livesAssisted: 10,
      responseTimeImprovement: 60,
      resourcesUsed: ['DemoResource'],
      narrative: 'Demo narrative',
      timestamp: Date.now()
    });
    const summary = impactService.getIncidentImpact('INC-IMPACT');
    expect(summary?.livesAssisted).toBe(10);
  });
});
