# Training & Simulation System Integration Guide

Quick start guide for adding training scenarios to your CECD application.

---

## 🚀 Quick Integration

### 1. **Add Training Center to Navigation**

In your main navigation/menu component:

```tsx
import TrainingCenter from '../pages/TrainingCenter';
import { BookOpen } from 'lucide-react';

// Add to navigation
<NavLink to="/training" label="Training" icon={BookOpen} />

// Add to router
<Route path="/training" element={<TrainingCenter />} />
```

### 2. **Start a Simulation Programmatically**

```typescript
import { simulationService } from '../services/simulationService';
import { trainingService } from '../services/trainingService';

// Start simulation
const run = simulationService.startSimulation('scenario-heart-attack', userId);

// Run is available in simulation state
setActiveRun(run.id);

// When complete, record score
const results = simulationService.getSimulationResults(run.id);
trainingService.recordTrainingScore(run.id, results, userId);
```

### 3. **Check User Certifications**

```typescript
const certs = trainingService.getUserCertifications(userId);

// Check if user has EMT-P
const hasEMTP = certs.some(c => c.name === 'EMT-P' && c.isValid);

// Get expiry info
const emtp = certs.find(c => c.name === 'EMT-P');
if (emtp?.daysUntilExpiry && emtp.daysUntilExpiry < 90) {
  showWarning('EMT-P expires in ' + emtp.daysUntilExpiry + ' days');
}
```

### 4. **Display Training Progress**

```tsx
import TrainingScoreboard from '../components/TrainingScoreboard';

<TrainingScoreboard userId={currentUser.id} />
```

---

## 🎯 Creating Custom Scenarios

### Basic Custom Scenario

```typescript
import { simulationService, SimulationEvent, SimulationScenario } from '../services/simulationService';

const customScenario: SimulationScenario = {
  id: 'scenario-custom-001',
  title: 'Custom Multi-Vehicle Collision',
  description: '3-vehicle accident on highway with injuries',
  category: 'medical',
  severity: 'high',
  initialLocation: { lat: 40.7128, lng: -74.0060 },
  initialDescription: 'Multi-vehicle accident reported on I-95',
  estimatedDurationMins: 20,
  objectives: [
    'Triage 5 patients',
    'Request additional resources',
    'Establish scene safety',
    'Coordinate hospital transport'
  ],
  difficulty: 'intermediate',
  createdAt: Date.now(),
  createdBy: 'trainer-001',
  events: [
    {
      id: 'custom-1',
      timestamp: 0,
      type: 'incident_update',
      description: '3-vehicle accident on I-95 northbound',
      data: { vehicles: 3, injuries: 5, hazard: 'fuel leak' },
      incidentUpdates: {
        status: 'Reported',
        severity: 'high'
      }
    },
    {
      id: 'custom-2',
      timestamp: 30000,
      type: 'decision_point',
      description: 'Scene safety assessment. What is your priority?',
      data: {
        options: [
          'Control fuel leak first',
          'Triage patients immediately',
          'Call for additional units',
          'Stop traffic flow'
        ]
      }
    }
    // ... more events
  ],
  requiredCertifications: ['EMT-B'],
  events: []
};

// Add to system
simulationService.getAllScenarios(); // Would include this
```

### From Template

```typescript
const customScenario = simulationService.createScenarioFromTemplate(
  'template-medical',
  [
    {
      id: 'custom-add-1',
      timestamp: 240000,
      type: 'hazard_change',
      description: 'Patient goes into anaphylaxis',
      data: { reaction: 'severe' }
    }
  ]
);
```

---

## 📊 Accessing Training Data

### Get User Progress

```typescript
const progress = trainingService.getUserProgress(userId);

console.log(progress?.completedScenarios); // ['scenario-heart-attack', ...]
console.log(progress?.trainingScores); // [TrainingScore, ...]
console.log(progress?.certifications); // [{name: 'EMT-B', earnedAt: 123456, ...}]
console.log(progress?.averageScore); // 87
```

### Get Training Statistics

```typescript
const stats = trainingService.getTrainingStats(userId);

console.log(stats.totalScenarios); // 5
console.log(stats.averageScore); // 82
console.log(stats.totalHours); // 3
console.log(stats.certifications); // 2
console.log(stats.lastTraining); // Date object
```

### Identify Weak Points

```typescript
const weakPoints = trainingService.identifyWeakPoints(userId);

// Returns array like:
[
  {
    topic: 'Improper evacuation radius',
    frequency: 3,
    affectedScenarios: ['scenario-chemical-spill', 'scenario-hazmat-001', ...]
  },
  {
    topic: 'Wrong hospital selection',
    frequency: 2,
    affectedScenarios: ['scenario-heart-attack', 'scenario-trauma']
  }
]
```

### Response Time Analysis

```typescript
const analysis = trainingService.getResponseTimeAnalysis(userId);

console.log(analysis.averageMs); // 2300
console.log(analysis.medianMs); // 2100
console.log(analysis.fastestMs); // 800
console.log(analysis.slowestMs); // 6200
console.log(analysis.trend); // 'improving' | 'degrading' | 'stable'
```

### Leaderboard

```typescript
const leaderboard = trainingService.getLeaderboard(20);

leaderboard.forEach(entry => {
  console.log(entry.userId); // 'user-001'
  console.log(entry.averageScore); // 94
  console.log(entry.completedScenarios); // 12
  console.log(entry.certifications); // 4
});
```

---

## 🎮 Simulation Control Integration

### In a Page or Modal

```tsx
import SimulationControl from '../components/SimulationControl';

const handleSimulationComplete = (results: any) => {
  console.log('Simulation Results:', results);
  // Results include:
  // - scenarioId, scenarioTitle
  // - duration, score (0-100)
  // - decisions: {total, correct, incorrect}
  // - avgResponseTimeMs
  // - weakPoints: [{eventId, decision, feedback}, ...]
  
  // Record the score
  trainingService.recordTrainingScore(runId, results, userId);
};

<SimulationControl
  runId={activeRunId}
  onComplete={handleSimulationComplete}
/>
```

---

## 🏆 Certification Management

### Check Certification Eligibility

```typescript
const eligibility = trainingService.canCertify(userId, 'EMT-P');

if (!eligibility.canCertify) {
  eligibility.reasons.forEach(reason => {
    console.log('Missing:', reason);
    // "Missing required modules: module-emt-advanced"
    // "Simulation score too low: 76% (required 85%)"
  });
}
```

### Issue Certification

```typescript
const success = trainingService.issueCertification(userId, 'EMT-P');

if (success) {
  console.log('✓ EMT-P certification issued!');
  // Automatically set to expire in 2 years
} else {
  console.log('❌ User not eligible for EMT-P');
}
```

### Check Certification Status

```typescript
const certs = trainingService.getUserCertifications(userId);

certs.forEach(cert => {
  console.log(`${cert.name}:`);
  console.log(`  Valid: ${cert.isValid}`);
  console.log(`  Expires in: ${cert.daysUntilExpiry} days`);
  console.log(`  Earned: ${new Date(cert.earnedAt).toLocaleDateString()}`);
});
```

---

## 🧪 Testing Scenarios

### Test Scenario Execution

```typescript
const testScenario = () => {
  // 1. Start simulation
  const run = simulationService.startSimulation('scenario-heart-attack', 'test-user');
  console.log('Run ID:', run.id);

  // 2. Get next event
  let event = simulationService.getNextEvent(run.id);
  console.log('Event:', event?.description);

  // 3. Record decision
  simulationService.recordDecision(run.id, event!.id, 'Start CPR immediately', 1500);

  // 4. Move to next
  simulationService.nextEvent(run.id);
  event = simulationService.getNextEvent(run.id);
  console.log('Next event:', event?.description);

  // 5. Get results
  const results = simulationService.getSimulationResults(run.id);
  console.log('Results:', results);
};
```

### Test Training Score Recording

```typescript
const testTrainingScore = () => {
  const mockResults = {
    scenarioId: 'scenario-heart-attack',
    scenarioTitle: 'Heart Attack During Marathon',
    duration: 900000, // 15 minutes
    score: 87,
    decisions: { total: 8, correct: 7, incorrect: 1 },
    avgResponseTimeMs: 2300,
    weakPoints: [
      {
        eventId: 'he-4',
        decision: 'Continue CPR without shock',
        feedback: 'AED showed VFib - shock should be administered'
      }
    ]
  };

  const score = trainingService.recordTrainingScore(
    'run-12345',
    mockResults,
    'test-user'
  );

  console.log('Score recorded:', score.id);
  console.log('User avg now:', trainingService.getTrainingStats('test-user').averageScore);
};
```

---

## 🎯 Common Use Cases

### Display EMT Requirements for Role

```typescript
const role = 'paramedic';
const requiredCerts = {
  paramedic: ['EMT-P', 'ACLS'],
  dispatcher: ['EMT-B', 'Dispatch-101'],
  commander: ['ICS-100', 'ICS-200'],
  hazmat: ['HAZMAT', 'Chemistry-101']
};

const userCerts = trainingService.getUserCertifications(userId);
const required = requiredCerts[role] || [];

required.forEach(cert => {
  const has = userCerts.some(c => c.name === cert && c.isValid);
  console.log(`${cert}: ${has ? '✓' : '✗'}`);
});
```

### Alert User Before Cert Expires

```typescript
const certs = trainingService.getUserCertifications(userId);

certs.forEach(cert => {
  if (cert.daysUntilExpiry && cert.daysUntilExpiry < 30) {
    showWarning(
      `${cert.name} expires in ${cert.daysUntilExpiry} days. ` +
      `Complete refresher training now.`
    );
  }
});
```

### Find Training Scenarios for Weak Points

```typescript
const weakPoints = trainingService.identifyWeakPoints(userId);
const topWeakPoint = weakPoints[0];

const scenariosToRun = topWeakPoint.affectedScenarios;
console.log(`Review these scenarios to improve on "${topWeakPoint.topic}":`);
scenariosToRun.forEach(scenarioId => {
  const scenario = simulationService.getAllScenarios()
    .find(s => s.id === scenarioId);
  if (scenario) {
    console.log(`- ${scenario.title} (${scenario.difficulty})`);
  }
});
```

---

## 🔗 Integration Checklist

- [ ] Add Training Center to main navigation
- [ ] Add Training Center route to router
- [ ] Import simulation service in required pages
- [ ] Import training service in user profile
- [ ] Display user certifications in profile
- [ ] Show training status in dashboard
- [ ] Warn users before cert expiration
- [ ] Add "Request Training" button to incident pages
- [ ] Link to training from certification requirement pages
- [ ] Record simulation completion after incidents
- [ ] Test certification eligibility checking
- [ ] Test weak point identification

---

## 🚀 Next Steps

1. **Customize Scenarios**: Add organization-specific training scenarios
2. **Integration**: Wire up navigation and routing
3. **Customization**: Adjust passing scores and cert requirements
4. **Testing**: Run through full training workflow
5. **Deployment**: Deploy training system to production

**Your responders now have a complete training platform!** 📚
