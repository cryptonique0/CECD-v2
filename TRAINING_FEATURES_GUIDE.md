# 🎓 Training & Simulation System - Complete Guide

## Overview

The CECD v2 platform includes a comprehensive training and simulation system that allows emergency responders to practice their skills, earn certifications, and improve response times through realistic scenario-based training.

## 🎯 Key Features

### 1. **Incident Simulation Mode**
Run realistic disaster simulations with:
- Pre-built scenarios (medical, fire, hazmat, earthquake, flood)
- Custom scenario creation
- Decision points with multiple-choice options
- Real-time event progression
- Adjustable difficulty levels (beginner → expert)

### 2. **Past Incident Replay**
Learn from real incidents by replaying them step-by-step:
- Convert any past incident into a training scenario
- Step through events at your own pace
- Adjustable playback speed (0.5x, 1x, 2x, 4x)
- Interactive decision points based on actual events
- Compare your decisions with what actually happened

### 3. **Training Scoring & Analytics**
Comprehensive performance measurement:
- Overall score (0-100) based on decision quality
- Average response time tracking (milliseconds)
- Correct vs incorrect decision breakdown
- Weak point identification with feedback
- Progress tracking over time
- Response time trend analysis (improving/degrading/stable)

### 4. **Certification System**
Earn and maintain certifications:
- Mandatory simulations for each certification
- Passing score requirements (typically 80%+)
- Automatic certification upon meeting requirements
- Expiration dates and renewal tracking
- Certification prerequisites and skill requirements

### 5. **Training Analytics Dashboard**
Organization-wide training insights:
- Leaderboards and top performers
- Completion rates and average scores
- Common weak areas across all trainees
- Most popular training scenarios
- Trend analysis and recommendations

---

## 📚 Quick Start Guide

### Starting a Simulation

```typescript
import { simulationService } from './services/simulationService';

// 1. Get available scenarios
const scenarios = simulationService.getAllScenarios();

// 2. Start a simulation
const run = simulationService.startSimulation(
  scenarioId: 'scenario-001',
  userId: 'user-123',
  userName: 'John Doe'
);

// 3. Record decisions during simulation
simulationService.recordDecision(
  runId: run.id,
  eventId: 'event-5',
  decision: 'Evacuate immediately',
  responseTimeMs: 5432
);

// 4. Get results when complete
const results = simulationService.getSimulationResults(run.id);
```

### Replaying a Past Incident

```typescript
import { simulationService } from './services/simulationService';
import { IncidentReplay } from './components/IncidentReplay';

// Convert past incident to training scenario
const incident = { /* actual incident data */ };
const replayScenario = simulationService.replayIncident(incident);

// Use the IncidentReplay component
<IncidentReplay
  incident={incident}
  onClose={() => console.log('Replay closed')}
  onComplete={(results) => {
    console.log('Score:', results.score);
    console.log('Weak points:', results.weakPoints);
  }}
/>
```

### Recording Training Scores

```typescript
import { trainingService } from './services/trainingService';

// Record score after simulation
trainingService.recordTrainingScore(
  simulationRunId: run.id,
  results: {
    score: 85,
    decisions: { total: 10, correct: 8, incorrect: 2 },
    avgResponseTimeMs: 6500,
    weakPoints: [
      { eventId: 'event-3', decision: 'Wait for backup', feedback: 'Should have acted immediately' }
    ]
  },
  userId: 'user-123'
);

// Check if certification earned
const progress = await trainingService.getUserProgress('user-123');
console.log('Certifications:', progress.certifications);
```

### Checking User Progress

```typescript
import { trainingService } from './services/trainingService';

// Get comprehensive user progress
const progress = await trainingService.getUserProgress('user-123');

console.log('Completed scenarios:', progress.completedScenarios.length);
console.log('Average score:', progress.averageScore);
console.log('Total training time:', progress.totalTrainingTimeHours, 'hours');
console.log('Certifications:', progress.certifications);
console.log('Recent scores:', progress.trainingScores.slice(0, 5));

// Get weak points analysis
const weakPoints = trainingService.identifyWeakPoints('user-123');
console.log('Most common mistakes:', weakPoints);

// Get response time analysis
const timeAnalysis = trainingService.getResponseTimeAnalysis('user-123');
console.log('Average response time:', timeAnalysis.averageMs, 'ms');
console.log('Trend:', timeAnalysis.trend); // 'improving', 'degrading', or 'stable'
```

---

## 🎮 Component Usage

### TrainingCenter Page

The main training hub where users can:
- Browse and filter scenarios by difficulty and category
- View their progress and statistics
- See earned certifications
- Access scheduled drills

```tsx
import TrainingCenter from './pages/TrainingCenter';

<TrainingCenter />
```

### SimulationControl Component

Interactive simulation player with:
- Play/pause controls
- Step-by-step navigation
- Decision point interactions
- Real-time scoring

```tsx
import SimulationControl from './components/SimulationControl';

<SimulationControl
  scenarioId="scenario-001"
  userId="user-123"
  onComplete={(results) => {
    console.log('Simulation complete!', results);
  }}
/>
```

### TrainingScoreboard Component

Display training results and analytics:
- Score breakdown
- Decision analysis
- Response time stats
- Weak points visualization

```tsx
import TrainingScoreboard from './components/TrainingScoreboard';

<TrainingScoreboard
  userId="user-123"
  limit={10}
/>
```

### IncidentReplay Component

Replay past incidents for training:
- Adjustable playback speed
- Interactive decision points
- Side-by-side comparison
- Performance scoring

```tsx
import { IncidentReplay } from './components/IncidentReplay';

<IncidentReplay
  incident={pastIncident}
  onClose={() => setShowReplay(false)}
  onComplete={(results) => {
    console.log('Replay completed with score:', results.score);
  }}
/>
```

### TrainingAnalytics Component

Organization-wide analytics dashboard:
- Key metrics and KPIs
- Leaderboards
- Weak area identification
- Trend analysis

```tsx
import { TrainingAnalytics } from './components/TrainingAnalytics';

<TrainingAnalytics />
```

---

## 🏆 Certification Requirements

### How Certifications Work

1. **Define Certification Requirements:**

```typescript
const hazmatCert: CertificationRequirement = {
  name: 'Hazmat Level 1',
  description: 'Basic hazardous materials response certification',
  requiredModules: ['hazmat-basics', 'decontamination', 'ppe-usage'],
  passingScore: 80,
  mandatorySimulations: ['hazmat-spill-001', 'chemical-leak-002'],
  expiresAfterDays: 365
};
```

2. **Complete Required Simulations:**
   - Users must complete all scenarios listed in `mandatorySimulations`
   - Must achieve at least the `passingScore` on each

3. **Automatic Certification:**
   - System automatically awards certification when requirements met
   - Certificate added to `UserProgress.certifications[]`
   - Expiration date set based on `expiresAfterDays`

4. **Renewal:**
   - Users receive alerts before certification expires
   - Must retake simulations to renew
   - Progress resets after expiration

### Example: Earning Hazmat Certification

```typescript
// User completes hazmat scenarios
const run1 = simulationService.startSimulation('hazmat-spill-001', 'user-123', 'John');
// ... user makes decisions ...
const results1 = simulationService.getSimulationResults(run1.id);

// Record score
trainingService.recordTrainingScore(run1.id, results1, 'user-123');

// If score >= 80% and all mandatory simulations complete:
// System automatically adds certification to user's profile

const progress = await trainingService.getUserProgress('user-123');
const hazmatCert = progress.certifications.find(c => c.name === 'Hazmat Level 1');

if (hazmatCert) {
  console.log('Certification earned!', hazmatCert.earnedAt);
  console.log('Expires:', hazmatCert.expiresAt);
}
```

---

## 📊 Scoring System

### How Scores Are Calculated

1. **Decision Accuracy (70% weight)**
   - Each decision point has an optimal response
   - Correct decisions: +10 points
   - Suboptimal decisions: +0 points
   - Score = (correct / total) × 70

2. **Response Time (20% weight)**
   - Faster responses earn more points
   - Optimal time window varies by scenario
   - Penalty for excessive delays
   - Score calculation:
     ```
     if (responseTime < optimalTime): +20 points
     elif (responseTime < maxTime): +10 points
     else: +0 points
     ```

3. **Completion (10% weight)**
   - Completing all steps: +10 points
   - Partial completion: proportional points

### Weak Points Identification

The system identifies weak areas by:
- Tracking incorrect decisions across scenarios
- Categorizing mistakes by topic
- Measuring frequency and impact
- Providing specific feedback for improvement

```typescript
// Example weak point
{
  eventId: 'event-7',
  decision: 'Wait for additional resources',
  feedback: 'In time-critical medical emergencies, immediate action is crucial. Consider initiating basic life support while waiting for advanced resources.'
}
```

---

## 🎬 Scenario Creation

### Pre-Built Scenarios

The system includes scenarios for:
- **Medical Emergencies:** Multi-victim triage, cardiac arrest, mass casualty
- **Fire Response:** Structure fires, wildfires, rescue operations
- **Hazmat Incidents:** Spills, leaks, decontamination
- **Natural Disasters:** Earthquakes, floods, hurricanes
- **Security Threats:** Active shooter, bomb threat, evacuation

### Creating Custom Scenarios

```typescript
import { simulationService } from './services/simulationService';

const customScenario = {
  id: 'custom-001',
  title: 'Warehouse Fire with Trapped Workers',
  description: 'Multi-alarm fire in industrial warehouse',
  category: 'fire',
  severity: 'critical',
  initialLocation: { lat: 40.7128, lng: -74.0060 },
  initialDescription: 'Heavy smoke visible from warehouse',
  estimatedDurationMins: 30,
  difficulty: 'advanced',
  requiredCertifications: ['Fire Level 2'],
  objectives: [
    'Establish incident command',
    'Locate and rescue trapped workers',
    'Contain fire spread',
    'Coordinate with utilities'
  ],
  events: [
    {
      id: 'event-1',
      timestamp: 0,
      type: 'incident_update',
      description: 'Dispatch receives 911 call reporting fire and screams for help',
      data: {}
    },
    {
      id: 'event-2',
      timestamp: 60000, // 1 minute
      type: 'decision_point',
      description: 'First unit arrives on scene. Heavy smoke, reports of people inside.',
      data: {
        options: [
          {
            text: 'Immediately enter building for rescue',
            isOptimal: false,
            feedback: 'Never enter without size-up and proper PPE'
          },
          {
            text: 'Conduct size-up, establish command, request additional resources',
            isOptimal: true,
            feedback: 'Correct! Proper incident management starts with size-up'
          },
          {
            text: 'Wait for more units before taking action',
            isOptimal: false,
            feedback: 'Delaying initial actions costs valuable time'
          }
        ]
      }
    },
    // ... more events ...
  ]
};

// Add to system
simulationService.scenarios.set(customScenario.id, customScenario);
```

---

## 📈 Analytics & Reporting

### Individual Progress Reports

```typescript
const summary = trainingService.getProgressSummary('user-123');

console.log(`
  Training Summary for User 123:
  - Total Scenarios: ${summary.totalScenarios}
  - Average Score: ${summary.averageScore}%
  - Total Hours: ${summary.totalHours}
  - Certifications: ${summary.certifications}
  - Last Training: ${summary.lastTraining}
`);
```

### Leaderboards

```typescript
const topPerformers = trainingService.getLeaderboard(20);

topPerformers.forEach((user, rank) => {
  console.log(`${rank + 1}. User ${user.userId}: ${user.averageScore}% avg`);
});
```

### Organizational Analytics

```typescript
import { TrainingAnalytics } from './components/TrainingAnalytics';

// Displays:
// - Total active trainees
// - Average organization score
// - Certification rates
// - Common weak areas
// - Trending scenarios
// - Progress over time

<TrainingAnalytics />
```

---

## 🔧 API Reference

### SimulationService

| Method | Parameters | Returns | Description |
|--------|-----------|---------|-------------|
| `getAllScenarios()` | - | `SimulationScenario[]` | Get all available scenarios |
| `startSimulation()` | `scenarioId`, `userId`, `userName` | `SimulationRun` | Start a new simulation |
| `pauseSimulation()` | `runId` | `boolean` | Pause active simulation |
| `resumeSimulation()` | `runId` | `boolean` | Resume paused simulation |
| `recordDecision()` | `runId`, `eventId`, `decision`, `responseTimeMs` | `boolean` | Record user decision |
| `getSimulationResults()` | `runId` | `SimulationResults` | Get final scoring and analysis |
| `replayIncident()` | `incident` | `SimulationScenario` | Convert past incident to scenario |

### TrainingService

| Method | Parameters | Returns | Description |
|--------|-----------|---------|-------------|
| `recordTrainingScore()` | `runId`, `results`, `userId` | `TrainingScore` | Save simulation results |
| `getUserProgress()` | `userId` | `UserProgress` | Get user's complete progress |
| `getUserScores()` | `userId`, `limit` | `TrainingScore[]` | Get user's recent scores |
| `getProgressSummary()` | `userId` | `ProgressSummary` | Get condensed progress stats |
| `getLeaderboard()` | `limit` | `LeaderboardEntry[]` | Get top performers |
| `identifyWeakPoints()` | `userId` | `WeakPoint[]` | Analyze common mistakes |
| `getResponseTimeAnalysis()` | `userId` | `ResponseTimeAnalysis` | Analyze response speed trends |

---

## 🎯 Best Practices

### For Trainees

1. **Start with Beginner Scenarios**
   - Build foundational skills before advanced scenarios
   - Master basics before attempting expert-level simulations

2. **Review Weak Points**
   - Study feedback from incorrect decisions
   - Retake scenarios where you struggled
   - Focus on improving specific skills

3. **Track Response Times**
   - Work on making faster decisions without sacrificing accuracy
   - Practice stress management techniques
   - Use the playback feature to review decision timing

4. **Maintain Certifications**
   - Set reminders for certification renewals
   - Complete refresher training regularly
   - Stay current with new scenarios

### For Training Coordinators

1. **Schedule Regular Drills**
   - Weekly or monthly team simulations
   - Mix difficulty levels
   - Rotate scenario categories

2. **Monitor Analytics**
   - Review organization-wide weak areas
   - Create targeted training for common struggles
   - Track improvement trends

3. **Create Realistic Scenarios**
   - Base scenarios on actual incidents
   - Include local geography and resources
   - Update scenarios based on new threats

4. **Recognize Top Performers**
   - Use leaderboards to motivate team
   - Reward consistent high performers
   - Share best practices from top scorers

---

## 🚀 Integration with Main Platform

### Dashboard Integration

```tsx
// Add training metrics to main dashboard
import { trainingService } from './services/trainingService';

const DashboardWidget: React.FC = () => {
  const [progress, setProgress] = useState(null);

  useEffect(() => {
    const loadProgress = async () => {
      const data = await trainingService.getUserProgress(currentUserId);
      setProgress(data);
    };
    loadProgress();
  }, []);

  return (
    <div>
      <h3>Your Training Progress</h3>
      <p>Average Score: {progress?.averageScore}%</p>
      <p>Certifications: {progress?.certifications.length}</p>
      <Link to="/training">View All Training →</Link>
    </div>
  );
};
```

### Incident Detail Integration

```tsx
// Add "Replay as Training" button to past incidents
import { IncidentReplay } from './components/IncidentReplay';

const IncidentDetail: React.FC = ({ incident }) => {
  const [showReplay, setShowReplay] = useState(false);

  return (
    <div>
      {/* ... incident details ... */}
      
      <button onClick={() => setShowReplay(true)}>
        🔁 Replay as Training
      </button>

      {showReplay && (
        <IncidentReplay
          incident={incident}
          onClose={() => setShowReplay(false)}
          onComplete={(results) => {
            console.log('Training complete:', results);
            setShowReplay(false);
          }}
        />
      )}
    </div>
  );
};
```

### Profile Integration

```tsx
// Show certifications and training stats on user profiles
import { trainingService } from './services/trainingService';

const ProfilePage: React.FC = ({ userId }) => {
  const [progress, setProgress] = useState(null);

  useEffect(() => {
    trainingService.getUserProgress(userId).then(setProgress);
  }, [userId]);

  return (
    <div>
      <h2>Training & Certifications</h2>
      
      <div className="certifications">
        {progress?.certifications.map(cert => (
          <div key={cert.name} className="cert-badge">
            🏆 {cert.name}
            <small>Earned: {new Date(cert.earnedAt).toLocaleDateString()}</small>
          </div>
        ))}
      </div>

      <div className="stats">
        <p>Average Score: {progress?.averageScore}%</p>
        <p>Training Hours: {progress?.totalTrainingTimeHours}</p>
        <p>Scenarios Completed: {progress?.completedScenarios.length}</p>
      </div>
    </div>
  );
};
```

---

## 📝 Example Workflows

### Workflow 1: New Responder Onboarding

1. User creates account
2. System recommends beginner scenarios
3. User completes basic training (CPR, First Aid, ICS-100)
4. System tracks progress and scores
5. User achieves passing scores (80%+)
6. System awards "Basic Responder" certification
7. User can now access intermediate scenarios

### Workflow 2: Certification Renewal

1. System alerts user 30 days before cert expiration
2. User accesses renewal simulations
3. User completes required scenarios
4. System verifies passing scores
5. Certification renewed with new expiration date

### Workflow 3: Incident Review & Training

1. Major incident occurs and is documented
2. Incident commander uses "Replay as Training"
3. Team members complete the replay simulation
4. System identifies decision patterns
5. Coordinator reviews analytics
6. Targeted training scheduled for weak areas

### Workflow 4: Team Drill Competition

1. Coordinator schedules team drill event
2. All team members notified
3. Participants complete scenario within time window
4. Leaderboard updates in real-time
5. Top performers recognized
6. Team reviews collective weak points
7. Follow-up training planned

---

## 🔍 Troubleshooting

### Common Issues

**Q: Simulation won't start**
- Verify scenario exists: `simulationService.getAllScenarios()`
- Check user permissions
- Ensure no other active simulation for user

**Q: Decisions not recording**
- Verify simulation is active (`isPaused === false`)
- Check event ID matches current event
- Ensure simulation not completed

**Q: Certification not awarded**
- Verify all mandatory simulations completed
- Check passing score met on all required scenarios
- Ensure certification requirements properly configured

**Q: Progress not showing**
- Check `recordTrainingScore()` called after simulation
- Verify user ID consistency
- Ensure proper async/await handling

---

## 📚 Additional Resources

- **Simulation Service Source:** [`services/simulationService.ts`](services/simulationService.ts)
- **Training Service Source:** [`services/trainingService.ts`](services/trainingService.ts)
- **Training Center Page:** [`pages/TrainingCenter.tsx`](pages/TrainingCenter.tsx)
- **Incident Replay Component:** [`components/IncidentReplay.tsx`](components/IncidentReplay.tsx)
- **Analytics Dashboard:** [`components/TrainingAnalytics.tsx`](components/TrainingAnalytics.tsx)

---

## 🎉 Summary

The CECD v2 Training & Simulation System provides:

✅ **Realistic training** through scenario-based simulations  
✅ **Past incident replay** for learning from real events  
✅ **Comprehensive scoring** with response time and decision tracking  
✅ **Automatic certifications** linked to required simulations  
✅ **Detailed analytics** for individuals and organizations  
✅ **Progress tracking** with weak point identification  
✅ **Leaderboards** and competitive elements  
✅ **Customizable scenarios** for any emergency type  

This system transforms emergency response training from theoretical to practical, providing measurable skills improvement and ensuring responders are prepared for real-world incidents.
