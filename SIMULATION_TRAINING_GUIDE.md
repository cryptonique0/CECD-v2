# Simulation, Training & Certification System

## 🎓 Overview

CECD now includes a comprehensive **Simulation & Training Center** for responders to practice incident response skills in a safe, controlled environment. Features include:

✅ **Realistic Incident Simulations** - Step-by-step scenario walkthroughs  
✅ **Response Time Measurement** - Track decision-making speed  
✅ **Decision Scoring** - Identify optimal vs. suboptimal choices  
✅ **Weak Point Analysis** - Pinpoint training gaps  
✅ **Certification-Linked Training** - Mandatory simulations for certifications  
✅ **Training Drills** - Team-based training exercises  
✅ **Performance Leaderboards** - Competitive training environment  

---

## 🎯 Available Training Scenarios

### **Beginner Level**

#### Heart Attack During Marathon
- **Category**: Medical  
- **Duration**: 15 minutes  
- **Objectives**:
  - Identify patient condition within 2 minutes
  - Initiate CPR if necessary
  - Establish IV access
  - Transport to cardiac center within 10 minutes
- **Required Certifications**: EMT-P, ACLS  
- **Simulation Steps**:
  1. Incident reported - unresponsive male at mile 10
  2. Decision point: Initial vitals show cardiac arrest - do you start CPR?
  3. AED arrives at scene
  4. Decision point: AED shows VFib - administer shock?
  5. ALS unit arrives and transports patient

**What You'll Learn**: Patient assessment, CPR, AED usage, hospital selection

---

### **Advanced Level**

#### Industrial Chemical Spill
- **Category**: Hazmat  
- **Duration**: 30 minutes  
- **Severity**: Critical  
- **Objectives**:
  - Identify chemical substance within 5 minutes
  - Establish evacuation perimeter
  - Notify affected residents/businesses
  - Set up decontamination stations
  - Coordinate environmental cleanup
- **Required Certifications**: HAZMAT  
- **Simulation Steps**:
  1. 500-gallon chemical spill reported at industrial facility
  2. Decision point: Establish evacuation zone (500m, 1km, 2km?)
  3. HAZMAT team identifies substance as chlorine gas
  4. Decision point: 245 residents downwind - evacuation plan?
  5. EPA notification and remediation begins

**What You'll Learn**: Chemical identification, risk assessment, evacuation planning, hazard containment

---

#### Major Earthquake Response
- **Category**: Earthquake (Disaster)  
- **Duration**: 45 minutes  
- **Severity**: Critical  
- **Objectives**:
  - Establish ICS within 5 minutes
  - Allocate resources to 5+ simultaneous incidents
  - Coordinate mutual aid agencies
  - Manage resource shortages
  - Prioritize rescue operations
- **Required Certifications**: ICS-100, ICS-200  
- **Simulation Steps**:
  1. 6.8 magnitude earthquake strikes
  2. Multiple simultaneous incidents reported
  3. Decision point: Which incident is top priority?
  4. Resource allocation decisions
  5. Mutual aid coordination
  6. Public communications

**What You'll Learn**: Incident command system, resource management, decision-making under pressure, crisis leadership

---

## 🏆 Certification-Linked Training

Certifications **require** completing mandatory simulations with passing scores:

### **EMT-B (Basic)**
- **Required Training**: CPR Refresher module
- **Mandatory Simulation**: Heart Attack During Marathon
- **Passing Score**: 80%
- **Valid For**: 2 years
- **Renewal**: Complete simulation within 90 days before expiry

### **EMT-P (Paramedic)**
- **Prerequisites**: EMT-B certification
- **Required Training**: Advanced Trauma Management module
- **Mandatory Simulation**: Heart Attack During Marathon + Trauma scenario
- **Passing Score**: 85%
- **Valid For**: 2 years

### **HAZMAT Technician**
- **Required Training**: HAZMAT Response Certification module
- **Mandatory Simulation**: Industrial Chemical Spill
- **Passing Score**: 90% (higher bar for hazmat safety)
- **Valid For**: 1 year (annual recertification required)
- **Auto-Renewal**: Completed simulations don't auto-renew; must retrain annually

### **ICS-100 (Introduction)**
- **Mandatory Simulation**: None (knowledge-based)
- **Passing Score**: 80%
- **Valid For**: 3 years

### **ICS-200 (Line Officers)**
- **Prerequisites**: ICS-100 certification
- **Mandatory Simulation**: Major Earthquake Response
- **Passing Score**: 85%
- **Valid For**: 3 years

---

## 📊 Training Metrics & Scoring

### **Individual Simulation Score**

```
Final Score = (Correct Decisions / Total Decisions) × 100
```

**Example**: 12 correct out of 15 decisions = 80% score

### **Decision Quality Assessment**

Each decision is evaluated as:
- **✓ Optimal** - Best possible choice given information
- **✗ Suboptimal** - Acceptable but not ideal
- **✗ Incorrect** - Wrong choice leading to poor outcome

**Optimal decisions** depend on scenario context:
- **Medical**: Start CPR for cardiac arrest → Optimal
- **Hazmat**: 1km+ evacuation zone for unknown chemical → Optimal
- **Earthquake**: Prioritize largest victim count → Optimal

### **Response Time Analysis**

Tracks how quickly you make decisions:
- **Average Response Time**: Mean time across all decisions
- **Median Response Time**: Middle value
- **Fastest/Slowest**: Best and worst response times
- **Trend Analysis**: Are you improving or degrading?

**Fast ≠ Good**: Response time alone doesn't determine quality. A fast wrong decision scores lower than a thoughtful correct decision.

### **Weak Point Identification**

System automatically identifies recurring mistakes:
- Medical decisions across scenarios
- Resource allocation decisions
- Communication/notification timing
- Risk assessment choices

Example weak point report:
```
Topic: Improper evacuation radius
Frequency: Appeared in 3 scenarios
Affected Scenarios: Chemical Spill, Gas Leak, Hazmat Incident
Recommendation: Review hazmat distance calculation guidelines
```

---

## 🎮 How to Run a Simulation

### **Step 1: Select Scenario**

Visit **Training Center** > **Training Simulations**

```
Heart Attack During Marathon
├─ Difficulty: Intermediate
├─ Duration: 15 min
├─ Category: Medical
└─ Required Certs: EMT-P
```

### **Step 2: Start Simulation**

Click **"Start Simulation"**

The system initializes:
- Incident spawns in your location
- Initial briefing provided
- Clock starts (accelerated by default)
- First decision point appears

### **Step 3: Make Decisions**

When a **Decision Point** appears:

```
⚡ DECISION POINT
"Patient vitals: HR 0, BP 0/0, Not breathing. 
 What is your first action?"

○ Start CPR immediately
○ Check for responsiveness  
○ Call for AED
○ Request police to clear area
```

Select your response. **Response time is measured** from decision presentation to your selection.

### **Step 4: Receive Feedback**

After each decision:
```
✓ Decision recorded
  Response time: 3.2 seconds
  Status: Awaiting next event...
```

### **Step 5: Advance Timeline**

Use **Next Event** button to progress through simulation

Timeline can be accelerated:
- 1x: Real-time (slow but immersive)
- 2x, 5x, 10x, 60x: Accelerated for drills
- Pause: Stop for discussion/coaching

### **Step 6: Complete & Review**

When simulation ends:

```
✓ SIMULATION COMPLETE

Final Score: 87%
Decisions: 13/15 correct
Avg Response Time: 2.4s

Areas for Improvement:
• Evacuation zone calculation (appeared 2 times)
• Hospital selection criteria (appeared 1 time)
```

---

## 📈 Tracking Progress

### **Personal Dashboard**

Visit **Training Center** > **My Progress**

**Overview Section**:
- Average training score across all simulations
- Completed scenario count
- Active certifications
- Total training hours
- Last training date

**Response Time Analysis**:
```
Average:  2.3 seconds
Median:   2.1 seconds  
Fastest:  0.8 seconds
Slowest:  6.2 seconds
Trend:    ↓ Improving (getting faster)
```

**Recent Scores**:
- Latest 5 simulation attempts
- Scores and decision breakdown
- Timestamps

**Weak Points**:
- Topic: "Improper evacuation radius"
  Frequency: 3 scenarios affected
- Topic: "Wrong hospital selection"
  Frequency: 2 scenarios affected

### **Leaderboard**

See how you rank against other responders:

```
Rank  Name              Avg Score  Scenarios  Certs
#1    Paramedic-001     94%        12         4
#2    EMT-Williams      92%        11         3
#3    Analyst-Smith     89%        15         2
#4    You (Responder)   87%        8          2
```

### **Certification Progress**

View required simulations and passing status:

```
EMT-P (Paramedic)
├─ Required Score: 85%
├─ Mandatory Simulations:
│  ├─ ✓ Heart Attack (87%)
│  └─ ✗ Trauma Response (not started)
└─ Status: 50% Complete
```

---

## 🎓 Training Best Practices

### **Scenario Progression**

1. **Start Easy**: Begin with Beginner scenarios
2. **Build Confidence**: Run same scenario 2-3 times
3. **Increase Difficulty**: Move to Intermediate, then Advanced
4. **Specialize**: Focus on role-specific simulations
5. **Recertify**: Retrain before cert expiration

### **Improving Your Score**

**Weak Area**: Evacuation radius calculations
**Solution**:
1. Review scenario: Industrial Chemical Spill
2. Study: HAZMAT distance guidelines (EPA CAMEO)
3. Rerun simulation focusing on evacuation decisions
4. Track improvement in next attempts

**Weak Area**: Decision speed < 1 second
**Solution**:
1. You might be rushing - slow down slightly
2. Balance speed with accuracy
3. Target 2-3 seconds per decision
4. Practice similar scenarios repeatedly

### **Certification Preparation**

**30 Days Before Expiration**:
- Review current certification details
- Identify weak points from past simulations
- Schedule retraining: 2-3 scenarios
- Target 85%+ on renewal simulation

**Week Before Certification Exam**:
- Complete 1 full scenario run
- Review weak points
- Study regulatory guidelines
- Get adequate rest

---

## 🏢 Team Training Drills

Scenarios can be used for **team exercises**:

### **Drill Structure**

```
Drill: Earthquake Response Exercise
├─ Scenario: Major Earthquake Response
├─ Duration: 1 hour
├─ Team: Incident Commanders + Coordinators
├─ Date: January 15, 2026
└─ Participants: 8 responders
```

### **Real-Time Collaboration**

- **Single operator** controls incident progression
- **Team discusses** each decision point
- **Facilitator** provides guidance
- **Debrief** discusses choices and lessons

### **Post-Drill Analysis**

```
Drill Results: City Earthquake Response
├─ Completion: 87% (all objectives met)
├─ Key Lessons:
│  ├─ Communication delays with City Hall
│  ├─ Resource allocation was optimal
│  └─ Hospital surge capacity needed planning
└─ Improvements:
   ├─ Establish daily 9 AM EOC briefing
   ├─ Pre-position medical resources
   └─ Create mutual aid SOP document
```

---

## 🔍 Replay Past Incidents

Learn from real incidents by replaying them step-by-step:

### **Convert Live Incident to Training**

Select a past incident > **"Use as Training Scenario"**

System creates simulation from:
- Original incident description
- Timeline of events
- Actual decisions made
- Outcomes and lessons

### **Analysis Mode**

```
REPLAY: Apartment Complex Fire (Jan 8, 2026)

"Review the actual decision points made during 
this incident and compare to recommended practices."

Decision 1: Evacuation radius?
├─ Actual choice: 200m
├─ Recommended: 500m
└─ Outcome: 3 additional residents exposed

Decision 2: Water supply for firefighting?
├─ Actual choice: Municipal hydrant
├─ Recommended: Portable tanks + hydrant
└─ Outcome: Water pressure insufficient
```

---

## 📱 Simulation Features

### **Customizable Settings**

- **Time Scale**: 1x (real-time) to 60x (fast-forward)
- **Difficulty Modifiers**: Add/remove complications
- **Partial Info Mode**: Limited visibility (realistic comms delays)
- **New Responders Mode**: Tutorial hints and guidance

### **Event Types**

- **Incident Update**: Status changes (cardiac arrest, fire spread, etc.)
- **Resource Dispatch**: Unit arrival, equipment delivery
- **Victim Update**: Changed vitals, new injuries discovered
- **Decision Point**: Requires responder input
- **Communication**: Dispatch radio messages, alerts
- **Hazard Change**: New chemical identified, fire expansion
- **Scenario Twist**: Complication (secondary injuries, weather change)

### **Scoring Breakdown**

After each simulation:

```
DETAILED DECISION BREAKDOWN

Decision 1: Patient Assessment
├─ Event ID: he-2
├─ Your choice: Start CPR immediately
├─ Response time: 2.1 seconds
├─ Was optimal: ✓ YES
└─ Feedback: Correct choice - immediate CPR for cardiac arrest

Decision 2: AED Usage  
├─ Event ID: he-4
├─ Your choice: Continue CPR without shock
├─ Response time: 4.3 seconds
├─ Was optimal: ✗ NO
└─ Feedback: AED showed VFib - shock should be administered

Overall Statistics:
├─ Total Decisions: 8
├─ Correct Decisions: 7
├─ Incorrect Decisions: 1
├─ Final Score: 87%
└─ Avg Response Time: 2.8 seconds
```

---

## 🚀 Advanced Features

### **Personalized Training Plans**

System recommends scenarios based on:
- Your role (EMT, Paramedic, Commander, Hazmat)
- Current certifications
- Weak points identified
- Certification prerequisites

**Example recommendation for Paramedic with EMT-B**:
1. Complete: Advanced Trauma Management (prerequisite for EMT-P)
2. Run: Heart Attack During Marathon (85%+ required)
3. Then: Eligible for EMT-P certification

### **Progressive Difficulty**

First run of scenario → Easier
Second run → Standard difficulty
Third+ run → Advanced modifiers

Modifiers increase realism:
- Delayed communications
- Conflicting information
- Resource shortages
- Secondary complications

### **Competitive Drills**

Team competition mode:
- Same scenario, different teams
- Scoring: Speed × Accuracy
- Leaderboard updates in real-time
- Can identify training disparities

---

## ⚠️ Important Notes

1. **Simulation ≠ Reality**: Simulations are approximations. Real incidents are more chaotic.
2. **Certification Valid Only**: Simulations help prepare for certification but don't guarantee success.
3. **Recertification**: Pass scores don't carry forward. Some certs require annual retraining.
4. **Weak Points**: Suggestions are AI-based; some judgment calls in real incidents differ.
5. **Training Gaps**: If avg score < passing score, focus on weak point scenarios before certification exam.

---

## 📞 Support

**Having trouble**?
- Slow computer? Use 10x or 60x time scale
- Unsure about decision? Review scenario objectives first
- Want scenario explanation? Visit scenario briefing
- Need certification help? Check your training plan

**Report Issues**:
- Bug in simulation? Contact training team
- Unrealistic scenario? Provide feedback
- Certification question? Ask administrator

**Resources**:
- EMT Study Guide: `docs/emt-training.pdf`
- HAZMAT Manual: `docs/hazmat-procedures.pdf`
- ICS-100 Course: Online at FEMA.gov
- Local SOP Updates: Check quarterly memo

---

**Your training record is maintained confidentially and only visible to you and administrators.**

**Ready to improve your emergency response skills? Start with a scenario today!** 🚀
