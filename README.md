<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1of-5q8XEFbmKKg4WNnLD5zlcNlBD0skO

## Run Locally

**Prerequisites:** Node.js

1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Features

### 1. Predictive Dispatch & Routing
- Uses live incident + responder locations to suggest pre-positioning, fastest safe routes, and reroute-aware ETAs on the dashboard.

### 2. Escalation Playbooks
- Auto-generate SOPs per incident with owners, timers, skill needs, and gap alerts.

### 3. Dynamic Trust + Reputation
- Verifiable, time-decaying trust scores with attestations from missions, peer reviews, and ZK-backed ID/skill proofs.

### 4. Situational Map Layers
- Toggle overlays for weather radar, flood zones, AQI, road closures, shelters, and hospitals.
- Defaults adapt by role (Dispatcher/Analyst see more, Citizen sees essentials).

### 5. Offline + SMS Bridge
- **Offline-first capture**: Reports are stored locally when offline and auto-synchronized when connectivity is restored. Pending items are marked and cleared after sync.
- **On-device translation**: If AI translation is available, translated text is stored with the incident; otherwise, translation is deferred to sync.
- **SMS/USSD bridge (stub)**: Minimal text reports can be ingested via gateway parsing (see `services/smsBridgeService.ts`). Useful in low-connectivity contexts.

How it works:
- For demos, you can convert a simple SMS string to an incident via `buildIncidentFromSms()` and add it to the feed.

### 6. Live Situational Layers (optional)
- **Weather radar**: NOAA NEXRAD WMS overlay (no key required).
- **Flood zones**: Provide a GeoJSON URL via `VITE_FLOOD_GEOJSON_URL`.
- **Air Quality (AQI)**: WAQI API near your position; set `VITE_WAQI_TOKEN`.
- **Road closures, shelters, hospitals**: Queried via OpenStreetMap Overpass around your location.

**Environment variables** (create `.env.local`):
```
VITE_WAQI_TOKEN=your_waqi_token_here
VITE_FLOOD_GEOJSON_URL=https://example.com/flood-zones.geojson
```

If a source is unavailable, the app gracefully falls back to simulated overlays.
- The app detects online/offline events and queues incident payloads locally.
- When back online, queued items are processed and `pendingSync` is cleared.
- For demos, you can convert a simple SMS string to an incident via `buildIncidentFromSms()` and add it to the feed.

### 7. Pending Sync Badges & Auto-Translation
- **Pending Sync**: Incidents captured offline display a "Pending Sync" badge until connectivity is restored.
- **Auto-translate on reconnect**: When coming back online, queued incidents are automatically translated (if not already translated locally) before being sent to the server.

### 8. Volunteer Optimization: Skill-Based Matching & Load Balancing

**Purpose**: Intelligently allocate responders to incidents based on skills, proximity, availability, and trust—preventing burnout through cross-region mutual-aid handoffs.

**Scoring Algorithm** (`services/volunteerOptimizationService.ts`):
- **Skill Match** (35%): Extracts required skills from incident category; scores match against volunteer capabilities.
- **Proximity** (30%): Haversine distance; closer volunteers rank higher.
- **Availability** (20%): Volunteer status (Active/OnDuty/Resting); prioritizes available responders.
- **Trust Score** (15%): Dynamic trust from `trustService` (mission history, peer reviews, ZK proofs).
- **Composite Score**: Normalized 0–1, combining all factors.

**Squad Suggestions**:
- Generates 3 distinct squads for each incident (2–3 volunteers per squad):
  1. **Top Scorer**: Highest composite score + complementary skills.
  2. **Availability-First**: Prioritizes available volunteers, even if lower skill match.
  3. **Trust-First**: Highest trust ratings, strongest peer reputation.
- Per-squad display: volunteer names, skills, distance, ETA, skill gaps, and composite score.
- Deploy buttons assign squad members to the incident and trigger playbook generation.

**Load-Balancing Handoffs**:
- Detects overload: volunteers with >2 active incidents.
- Detects coverage gaps: critical (High/Critical severity) incidents with no nearby responders.
- Suggests handoffs: transfer load to better-positioned responders in adjacent regions.
- Mutual-aid flow: responders can approve/reject handoff suggestions; accepted handoffs update incident assignments.

**UI Integration**:
- **Incident Detail** page displays:
  - 3 suggested squads in a grid (left to right: Squad 1/2/3).
  - Per-squad volunteer cards with avatar, name, role, skills, proximity/ETA.
  - Skill coverage bar and gap warnings (e.g., "Gaps: Advanced Life Support").
  - "Deploy Squad N" button to activate the squad.
  - Handoff suggestions below, with Approve/Reject actions.

**Example Workflow**:
1. High-severity incident reported → `volunteerOptimizationService.suggestSquads()` ranks volunteers.
2. Dispatcher views 3 squads on Incident Detail page.
3. Dispatcher clicks "Deploy Squad 2" → Squad members assigned, playbook generated with squad as primary owners.
4. If Squad 2's EMT becomes overloaded, load-balancing detects >2 incidents → suggests handoff to nearby available EMT in adjacent region.
5. Dispatcher approves handoff → new responder assigned, load balanced.

**Notes**:
- Scoring weights (skill 35%, proximity 30%, availability 20%, trust 15%) can be tuned in `volunteerOptimizationService.ts`.
- Squad generation is deterministic; same incident + volunteer set always yields same 3 squads.
- No external API calls; all logic runs on-device for sub-100ms response.

### 9. Chain-of-Custody & Audit Trail: Immutable Incident Timeline

**Purpose**: Create a tamper-proof record of all incident actions with cryptographic anchoring to blockchain and multi-sig approval flows for critical decisions.

**Key Components**:

1. **Immutable Incident Timeline** (`services/auditTrailService.ts`):
   - Records all incident events (status changes, actions, approvals) with cryptographic signatures
   - Merkle tree root hash ensures tamper-detection (modify any event → root hash changes)
   - On-chain anchoring: timeline root hash can be recorded on blockchain for permanent immutability
   - Verifiable export for legal/compliance reports

2. **Signed Evidence Uploads** (`services/evidenceService.ts`):
   - Cryptographically sign all evidence (photos, documents, audio, video)
   - Chain-of-custody tracking: immutable log of who handled evidence and when
   - Evidence categories: photo, video, document, audio, other
   - Verification checks integrity and custody chain validity
   - Archive action (immutable marking) for concluded evidence

3. **Enhanced Multi-Sig Approvals** (`services/multiSigService.ts`):
   - Critical actions require multi-sig consensus (default: 3-of-3):
     - **Fund Release**: Unlock donations for verified responders
     - **Evacuation**: Authorize mass evacuation (requires multiple authorized signers)
     - **Lockdown**: Trigger incident lockdown (prevent entry/exit)
   - Each signer is recorded with timestamp and signature
   - Auto-execute when all signatures collected
   - Integrated with audit trail: every approval is immutably logged

**UI Features** (`pages/IncidentDetail.tsx`):
- **Immutable Timeline Section**:
  - Live event feed (last 10 actions)
  - "Anchor to Chain" button to record root hash on-chain (simulated)
  - "Verify Timeline" button to check integrity
  - "Export Report" button to generate compliant report

- **Evidence & Chain-of-Custody Section**:
  - Upload form with category selection (photo/video/document/audio/other)
  - Recent evidence list (clickable)
  - Detailed custody view: who accessed, when, what action
  - "Verify Integrity" button
  - "Archive" button for evidence closure

- **Critical Action Approvals Section**:
  - Pending proposals with signature progress bar
  - Signers displayed with green checkmark
  - "Sign Approval" button (prevents double-signing)
  - Status: Pending → Approved → Executed
  - Proposed actions recorded in audit trail

- **Proposal Buttons**:
  - "Propose Fund Release" (with amount)
  - "Propose Evacuation"

**Example Workflow**:
1. Dispatcher uploads photo of damage (evidence)
2. Photo is signed, chain-of-custody initialized
3. Dispatcher proposes $10K fund release for repairs
4. Multi-sig proposal created (1/3 signatures)
5. Two more authorized responders sign → proposal auto-executes
6. All actions (upload, proposal, signatures) recorded in audit trail
7. Timeline root hash anchored to blockchain
8. Legal report exported for compliance audit

**Scoring Impact**:
- **Transparency**: 100% traceable incident history
- **Accountability**: Every action signed and timestamped
- **Compliance**: Exportable audit trail for regulators
- **Trust**: On-chain immutability prevents tampering
- **Critical Action Safety**: Multi-sig prevents rogue fund releases or unauthorized evacuations

**Notes**:
- Merkle tree hash uses simulated hashing (production: keccak256)
- Signatures are simulated (production: ECDSA with web3.js)
- On-chain anchoring simulated (production: contract interaction on Base)
- Evidence metadata immutable; file storage separate (IPFS/Arweave in production)

### 10. Donations to Actions: Step Micro-Grants

**Purpose**: Enable directed micro-grants for specific playbook steps (e.g., fuel, PPE, tools), show impact receipts, and disburse funds only after milestone verification for strong transparency and trust.

**Key Components**:
- **Step Donations Service** ([services/stepDonationsService.ts](services/stepDonationsService.ts)):
  - `pledgeDonation()`: Record pledges tied to an incident step with item, amount, currency, and optional note
  - `addReceipt()`: Attach impact receipts (proof of spend, images/notes) to pledges
  - `verifyMilestoneAndDisburse()`: On step completion, verify milestone and route disbursements on Base (simulated via vault service)
  - `getTotals()`: Aggregate pledged totals per currency for quick visibility
- **Audit Trail Integration** ([services/auditTrailService.ts](services/auditTrailService.ts)):
  - Pledge and disbursement events recorded in the immutable timeline for end-to-end traceability

**UI Features** ([pages/IncidentDetail.tsx](pages/IncidentDetail.tsx)):
- Per-playbook step section shows:
  - Quick pledge buttons for common resource items (e.g., fuel, PPE)
  - Custom pledge input (amount, currency, note)
  - Totals by currency for the step
  - "Verify Milestone & Disburse" appears when the step status is Done (runs verification + disbursement)
- Receipts are displayed after disbursement with timestamps and references

**Example Workflow**:
1. Dispatcher identifies a step requiring resources (e.g., "Fuel for transport")
2. Supporters pledge micro-grants for the step via UI
3. Step owner completes the task → mark status Done
4. Click "Verify Milestone & Disburse" → funds are routed (simulated), receipts recorded
5. Audit trail logs pledges and disbursement; totals update

**Notes**:
- Disbursement uses `baseVaultService` simulation (production: Base contract interaction)
- Receipts can include references to uploads/evidence; attach via `addReceipt()`
- Totals are per-step; aggregation across incident is supported via service helpers

### 11. Secure Mode: End-to-End Encrypted Private Chat

**Purpose**: Enable confidential discussions for sensitive situations (missing persons, security threats, medical privacy) with end-to-end encryption and self-destructing messages.

**Key Components**:
- **Secure Chat Service** ([services/secureChatService.ts](services/secureChatService.ts)):
  - AES-256-GCM encryption with per-conversation symmetric keys
  - Self-destructing messages (auto-delete after configurable TTL)
  - Encrypted file attachments support
  - Participant management with role-based access (admin, member, viewer)
  - Message editing and soft-deletion with audit trail
  - Read receipts and typing indicators (encrypted)

**Security Features**:
- End-to-end encryption (keys never leave client)
- Optional self-destruct timers (5min to 24hr)
- Encrypted metadata (subject, participants)
- Secure key derivation (PBKDF2 with salt)
- Forward secrecy support

**UI Integration** ([pages/IncidentDetail.tsx](pages/IncidentDetail.tsx)):
- "Enable Secure Mode" button creates encrypted conversation
- Encrypted chat interface with:
  - Message composer with encryption indicator
  - Self-destruct timer selector
  - Encrypted file upload
  - Participant list with roles
  - Typing indicators
  - Read receipts
- Visual indicators for encrypted messages (lock icon, timer countdown)

**Example Workflow**:
1. Dispatcher enables secure mode for sensitive incident
2. Encrypted conversation created with authorized participants
3. Messages sent with optional 1hr self-destruct timer
4. Sensitive documents uploaded (encrypted)
5. Messages auto-delete after timer expires
6. All activity logged in audit trail (metadata only, content encrypted)

### 12. Real-Time Analytics & Decision Intelligence

**Purpose**: Provide command-level insights with predictive models, resource optimization recommendations, and real-time operational metrics.

**Key Components**:
- **Analytics Service** ([services/analyticsService.ts](services/analyticsService.ts)):
  - **Predictive Models**: Forecast incident duration, resource needs, escalation probability
  - **Resource Optimization**: Identify bottlenecks, suggest reallocation, detect gaps
  - **Response Metrics**: Track response times, resolution rates, volunteer utilization
  - **Trend Analysis**: Pattern detection across incidents, seasonal trends, hotspot identification
  - **Real-time Dashboards**: Live KPI tracking with configurable refresh intervals

**Analytics Capabilities**:
- Machine learning-based duration prediction (±30min accuracy)
- Resource demand forecasting (personnel, equipment, supplies)
- Bottleneck detection with suggested mitigation
- Response time analysis (dispatch → arrival → resolution)
- Volunteer burnout prediction (workload, fatigue scoring)
- Incident clustering by location/type/severity

**UI Integration** ([pages/IncidentDetail.tsx](pages/IncidentDetail.tsx)):
- Analytics dashboard with:
  - Predicted duration and confidence interval
  - Resource needs forecast (skill requirements, equipment)
  - Escalation risk score with contributing factors
  - Response timeline visualization
  - Optimization recommendations
- Real-time metric cards (active incidents, avg response time, resolution rate)

**Example Workflow**:
1. New high-severity incident reported
2. Analytics predicts 4-6hr duration with 85% confidence
3. Forecasts need for 2 EMTs, 1 rescue specialist, medical supplies
4. Identifies 65% escalation risk due to resource gap
5. Recommends pre-positioning additional responders
6. Dashboard tracks actual vs predicted metrics
7. Post-incident analysis validates accuracy for model improvement

### 13. Resource Logistics & Inventory Management

**Purpose**: Track equipment, supplies, and vehicles with real-time availability, maintenance scheduling, and automated restocking.

**Key Components**:
- **Logistics Service** ([services/logisticsService.ts](services/logisticsService.ts)):
  - **Inventory Tracking**: Real-time stock levels, location tracking, expiry monitoring
  - **Equipment Management**: Usage history, maintenance schedules, condition tracking
  - **Vehicle Fleet**: Assignment, fuel levels, service intervals, GPS integration
  - **Automated Restocking**: Low-stock alerts, auto-reorder triggers, supply chain optimization
  - **Deployment Planning**: Resource allocation to incidents with conflict detection

**Inventory Features**:
- Multi-location warehouse management
- Category-based organization (medical, rescue, shelter, communications)
- Quantity tracking with min/max thresholds
- Expiry date monitoring with advance alerts
- Usage analytics (consumption rates, waste reduction)

**Equipment Lifecycle**:
- Condition tracking (operational, needs_maintenance, out_of_service)
- Maintenance scheduling with service history
- Assignment tracking (who has what, when)
- Depreciation and replacement planning

**Vehicle Management**:
- Fleet overview (ambulances, rescue trucks, logistics vehicles)
- Fuel level monitoring with refuel alerts
- Service interval tracking (last service, next due)
- Assignment to incidents with GPS tracking

**UI Integration** ([pages/IncidentDetail.tsx](pages/IncidentDetail.tsx)):
- Resource allocation panel showing:
  - Available equipment by category
  - Assigned vehicles with status
  - Supply levels with low-stock warnings
  - "Assign Resources" workflow
  - Maintenance alerts
- Inventory dashboard with:
  - Stock levels by category
  - Items needing restock
  - Equipment maintenance due
  - Vehicle service schedules

**Example Workflow**:
1. Dispatcher assigns rescue equipment to incident
2. System checks availability, condition, location
3. Alerts if maintenance due or low stock
4. Assigns vehicle with sufficient fuel
5. Tracks deployment duration
6. On return, updates usage hours, fuel consumed
7. Triggers restock order if supplies depleted below threshold
8. Schedules maintenance if service interval reached

### 14. Communications Copilot: AI-Assisted Situational Reports

**Purpose**: Convert radio chatter and voice transcripts into structured reports, generate shift summaries, and provide AI-powered briefing assistance.

**Key Components**:
- **Comms Copilot Service** ([services/commsCopilotService.ts](services/commsCopilotService.ts)):
  - **Voice-to-Text**: Real-time transcription of radio communications
  - **Structured Parsing**: Extract key info (who, what, where, when, resources) from unstructured chatter
  - **Shift Summaries**: Auto-generate end-of-shift reports with highlights
  - **30-Second Briefs**: Concise incident summaries for rapid situational awareness
  - **Smart Alerts**: Detect urgent keywords (fire, medical emergency, officer down)

**AI Capabilities**:
- Natural language understanding for incident extraction
- Named entity recognition (locations, personnel, resources)
- Sentiment analysis (urgency detection)
- Timeline construction from transcript segments
- Context-aware report generation

**UI Integration** ([pages/IncidentDetail.tsx](pages/IncidentDetail.tsx)):
- Comms panel with:
  - Live transcript feed
  - "Parse Transcript" button → structured report
  - Key info extraction (actors, actions, resources, timeline)
  - "Generate Shift Summary" for incidents since timestamp
  - "Last 30 Brief" for quick situational awareness
  - Urgent keyword highlighting

**Example Workflow**:
1. Radio chatter transcribed in real-time
2. Dispatcher clicks "Parse Transcript"
3. AI extracts: "Unit 7 reports structure fire at Main St, requesting 2 engines, 1 ladder"
4. Structured report generated with actors, location, resources needed
5. End of shift: "Generate Shift Summary" creates report of all incidents handled
6. Incoming commander requests brief: "Last 30" provides 30-second overview

### 15. Automated Incident Escalation Engine

**Purpose**: Continuously monitor incidents against configurable rules and automatically escalate based on severity, duration, resource gaps, or other criteria.

**Key Components**:
- **Escalation Service** ([services/escalationService.ts](services/escalationService.ts)):
  - **Rule Engine**: Configurable escalation rules with conditions and actions
  - **Auto-Monitoring**: Continuous evaluation of active incidents
  - **Action Handlers**: Automated responses (notifications, resource dispatch, protocol activation)
  - **Escalation History**: Audit trail of all triggered escalations

**Escalation Rules**:
- Severity-based (High/Critical incidents auto-escalate)
- Duration-based (incidents open >1hr trigger escalation)
- Resource-based (gaps ≥3 trigger additional dispatch)
- Custom rules with AND/OR logic

**Automated Actions**:
- `notify_command`: Alert command staff
- `dispatch_additional`: Auto-request backup resources
- `escalate_level`: Increase incident severity
- `activate_protocol`: Trigger emergency protocols

**UI Integration** ([pages/IncidentDetail.tsx](pages/IncidentDetail.tsx)):
- Escalation Monitor panel showing:
  - Active escalation rules
  - Triggered events with timestamps
  - Automated actions taken
  - "Check Rules" manual evaluation
  - Event history log

**Example Workflow**:
1. High-severity fire reported
2. Escalation engine evaluates rules
3. Matches "High Severity" rule → triggers "notify_command"
4. Incident duration reaches 1hr → matches "Duration" rule → triggers "dispatch_additional"
5. Resource gap detected (3 missing personnel) → triggers "escalate_level"
6. All actions logged in audit trail
7. Command staff receives notifications
8. Additional resources automatically dispatched

### 16. Safety Protocol & Pre-Deployment Checklists

**Purpose**: Enforce mandatory safety checks before deploying responders with category-specific protocols and critical checkpoint validation.

**Key Components**:
- **Safety Protocol Service** ([services/safetyProtocolService.ts](services/safetyProtocolService.ts)):
  - **Protocol Templates**: Pre-defined checklists for incident categories (Fire, Flood, Earthquake, Hazmat)
  - **Critical Checkpoints**: Mandatory items that block deployment if incomplete
  - **Checklist Lifecycle**: Creation, checkpoint completion, sign-off validation
  - **Deployment Blocker**: Prevent deployment without critical safety checks

**Safety Protocols**:
- Fire: PPE verification, SCBA check, evacuation routes, water supply, accountability system
- Flood: Water rescue gear, flotation devices, communication equipment, hazard zones
- Earthquake: Structural assessment, aftershock monitoring, collapse zones, rescue equipment
- Hazmat: Protective suits, detection equipment, decontamination setup, evacuation perimeter

**Checkpoint Types**:
- Critical (blocks deployment if incomplete)
- Standard (recommended but not blocking)
- Optional (nice-to-have)

**UI Integration** ([pages/IncidentDetail.tsx](pages/IncidentDetail.tsx)):
- Safety Protocols panel showing:
  - "Start Checklist" for incident category
  - Progress bar (completed/total checkpoints)
  - Checkbox list with critical flags
  - "Sign Off Checklist" validation
  - Deployment blocker alerts

**Example Workflow**:
1. Fire incident reported
2. Dispatcher clicks "Start Fire Checklist"
3. Checklist created with 10 checkpoints (5 critical)
4. Responders verify: PPE ✓, SCBA ✓, routes ✓...
5. Attempt deployment with 1 critical incomplete → blocked
6. Complete final critical checkpoint → deployment allowed
7. Sign-off recorded in audit trail
8. Checklist archived with incident

### 17. Incident Handoff & Transfer Workflow

**Purpose**: Structured incident transfer between responders/shifts with signature validation, briefing notes, and critical context preservation.

**Key Components**:
- **Handoff Service** ([services/handoffService.ts](services/handoffService.ts)):
  - **Multi-Stage Workflow**: Proposed → Acknowledged → In Progress → Completed
  - **Critical Context**: Briefing notes, situation summary, resources on-scene, hazard warnings
  - **Signature Validation**: Digital signatures from both parties
  - **Completeness Checks**: Ensure all required handoff fields present

**Handoff Stages**:
1. **Proposed**: Initiating responder proposes transfer
2. **Acknowledged**: Receiving responder accepts handoff
3. **In Progress**: Active briefing/transition
4. **Completed**: Both parties sign off, incident transferred

**Required Information**:
- Briefing notes (current situation)
- Critical context (key decisions, ongoing actions)
- Resource inventory (personnel, equipment on-scene)
- Hazard warnings (safety concerns, environmental risks)
- Action items (pending tasks for receiving responder)

**UI Integration** ([pages/IncidentDetail.tsx](pages/IncidentDetail.tsx)):
- Incident Handoff panel showing:
  - "Initiate Handoff" button
  - Status progression indicators
  - Acknowledge/Begin/Complete workflow buttons
  - Critical context display (grid layout)
  - Hazard warnings (highlighted)
  - Signature validation

**Example Workflow**:
1. Day shift commander initiates handoff to night shift
2. Provides briefing: "Active search, 2 still missing, resources deployed"
3. Lists critical context: hazmat cleared, evacuation in sector B
4. Warns: unstable structures in north quadrant
5. Night shift commander acknowledges handoff
6. Reviews briefing, asks clarifying questions
7. Begins active transition
8. Both sign off → incident transferred
9. Handoff logged in audit trail

### 18. Volunteer Scheduling & Shift Management

**Purpose**: Manage volunteer shifts with conflict detection, fatigue monitoring, and optimal shift suggestions.

**Key Components**:
- **Scheduling Service** ([services/schedulingService.ts](services/schedulingService.ts)):
  - **Shift Management**: Create, activate, complete shifts with duration tracking
  - **Conflict Detection**: Identify double-booking, excessive hours, rest period violations
  - **Availability Windows**: Track volunteer availability slots
  - **Fatigue Monitoring**: Detect excessive consecutive hours, insufficient rest
  - **Optimal Shift Suggestion**: AI-powered shift recommendations based on availability

**Conflict Types**:
- **Double Booking**: Volunteer assigned to overlapping shifts
- **Excessive Hours**: Total hours exceed configured max (default: 12hr)
- **Rest Period Violation**: <8hr between shifts (fatigue risk)

**Shift States**:
- `scheduled`: Future shift, not yet active
- `active`: Currently in progress
- `completed`: Finished, hours logged
- `cancelled`: Shift cancelled before start

**UI Integration** ([pages/IncidentDetail.tsx](pages/IncidentDetail.tsx)):
- Scheduling panel showing:
  - "Add Emergency Shift" button
  - Conflict warnings (highlighted alerts)
  - Shift list with status badges
  - Duration and volunteer assignment
  - Conflict details (type, severity)

**Example Workflow**:
1. Dispatcher creates emergency shift for EMT (8hr)
2. System checks volunteer availability
3. Detects conflict: EMT already scheduled 6hr shift
4. Warns: "Excessive Hours - Total 14hr exceeds max 12hr"
5. Dispatcher adjusts shift duration to 6hr
6. Conflict cleared
7. Shift activated, volunteer deployed
8. After 6hr, shift completed, hours logged
9. System checks rest period before next assignment
10. Blocks new assignment if <8hr rest remaining

### 19. Post-Incident Debrief & Lessons Learned

**Purpose**: Conduct structured post-incident reviews with multi-participant questionnaires, action item tracking, and comprehensive reporting.

**Key Components**:
- **Debrief Service** ([services/debriefService.ts](services/debriefService.ts)):
  - **Structured Sessions**: Multi-section questionnaires (response effectiveness, resources, coordination, lessons, safety)
  - **Multi-Participant**: Multiple responders contribute responses
  - **Action Item Tracking**: Capture improvements with owners and deadlines
  - **Report Generation**: Export comprehensive debrief summary

**Debrief Sections**:
1. **Response Effectiveness**: What worked well, what didn't
2. **Resource Allocation**: Adequate resources, gaps, waste
3. **Team Coordination**: Communication quality, command clarity
4. **Lessons Learned**: Key takeaways, training needs
5. **Safety**: Safety issues, near-misses, protocol adherence

**Question Types**:
- Open-ended (narrative responses)
- Multiple choice
- Rating scales (1-5)
- Yes/No with explanation

**UI Integration** ([pages/IncidentDetail.tsx](pages/IncidentDetail.tsx)):
- Debrief panel (only visible when incident resolved):
  - "Start Debrief" button
  - Session status (active/completed)
  - Participant count
  - Response count
  - "Finalize Debrief" to complete
  - Report export

**Example Workflow**:
1. Incident resolved, status changed to "Resolved"
2. Incident commander clicks "Start Debrief"
3. Debrief session created with 11 questions across 5 sections
4. Participants submit responses:
   - "Communication delays caused 15min response lag"
   - "Need more thermal cameras for night operations"
   - "Training needed on new PPE equipment"
5. Commander adds action items:
   - "Review communication protocols" (Owner: Training Chief, Due: 2 weeks)
   - "Purchase 3 thermal cameras" (Owner: Logistics, Due: 1 month)
6. All participants reviewed → "Finalize Debrief"
7. Comprehensive report generated
8. Report exported for archival and training purposes
9. Action items tracked to completion

### 20. Certification & Training Management

**Purpose**: Track volunteer certifications, monitor expiry, manage training sessions, and identify skill gaps across the volunteer pool.

**Key Components**:
- **Certification Service** ([services/certificationService.ts](services/certificationService.ts)):
  - **Certification Lifecycle**: Issue, renew, track expiry
  - **Training Sessions**: Create, enroll, track completion
  - **Skill Gap Analysis**: Identify missing certifications across incidents
  - **Expiry Monitoring**: Alert on upcoming expirations (30-day warning)

**Standard Certifications**:
- CPR/First Aid (2yr validity)
- EMT Basic (2yr validity)
- Firefighter I (3yr validity)
- Technical Rescue (3yr validity)
- Hazmat Operations (1yr validity)
- ICS-100/200 (no expiry)

**Training Features**:
- Session scheduling with max capacity
- Enrollment management
- Completion tracking with certificates
- Skill validation
- Renewal credit application

**Skill Gap Analysis**:
- Analyze incidents by required skills
- Identify certification gaps in volunteer pool
- Prioritize training needs
- Generate training recommendations

**Example Workflow**:
1. New volunteer joins
2. System issues CPR certification (valid 2 years)
3. Volunteer enrolls in EMT training session
4. Completes training → EMT certification issued
5. 23 months later: system alerts "CPR expiring in 30 days"
6. Volunteer renews CPR certification
7. Analytics show gap: only 2 volunteers have Technical Rescue
8. System recommends: "Schedule Technical Rescue training"
9. Incident requires Hazmat → system identifies 3 certified volunteers
10. Skill gap report: need more Hazmat-certified personnel

### 21. Identity, Access & Governance

**Purpose**: Establish formal governance and access control layers with role-based permissions, delegated authority for shift changes and emergencies, and protocol governance for system-wide decisions.

**Key Components**:

1. **Role-Based Access Control (RBAC) with Policy Engine**:
   - Define roles with granular permissions
   - Enforce access policies at operation level
   - Policy templates for common roles
   - Dynamic role assignment during incidents

   **Standard Roles**:
   - **Dispatcher**: Deploy squads, reassign resources, authorize fund releases
   - **Analyst**: View incidents, generate reports, cannot deploy or authorize spending
   - **Incident Commander**: Propose escalations, override safety protocols, delegate authority
   - **Responder**: Update status, report incidents, upload evidence
   - **Administrator**: Configure system, manage roles, audit logs
   - **Volunteer**: Create incident reports, view assignments, offline capture

   **Permission Matrix**:
   ```
   Dispatcher:
     - can:deploy_squad, reassign_incident, authorize_funds, propose_escalation
     - cannot: change_system_config, manage_roles
   
   Analyst:
     - can: view_all_incidents, generate_reports, view_analytics, export_data
     - cannot: deploy_squad, authorize_funds, modify_incidents
   
   Incident Commander:
     - can: override_safety_protocols, propose_escalation, delegate_authority, modify_incidents
     - cannot: change_system_config, manage_roles
   ```

2. **Delegated Authority**:
   - Temporary authority transfer during shift changes
   - Emergency delegation with auto-revocation
   - Authority chain tracking (who delegated to whom)
   - Immutable delegation audit trail

   **Delegation Types**:
   - **Shift Handoff**: Transfer authority for 8-12 hour period during shift change
   - **Emergency Override**: Temporary elevation (5-30 min) during critical incidents
   - **Cross-Region**: Allow regional dispatcher to manage adjacent regions during resource shortage

   **Example Workflows**:
   - Day shift dispatcher delegates authority to night shift (immutably logged)
   - During flood emergency, Commander delegates temporary authority to 3 responders to approve fund releases independently
   - Authority auto-revokes after incident closure or time expiry

3. **Governance Proposals & Voting**:
   - Propose protocol changes, rule modifications, escalation threshold adjustments
   - Multi-tier voting by verified roles
   - Transparent proposal history and audit trail
   - Time-locked execution for critical changes

   **Proposal Types**:
   - **Protocol Upgrades**: System configuration changes (requires 3/5 admin votes)
   - **Rule Changes**: Escalation thresholds, dispatch algorithms (requires 2/3 dispatcher votes)
   - **Governance Evolution**: New roles, permission modifications (requires 5/7 commander + admin votes)
   - **Resource Policies**: Budget changes, equipment procurement rules (requires financial manager + 2 commanders)

   **Voting Rules**:
   - Minimum quorum: depends on proposal type
   - Voting period: 24-48 hours
   - Early execution if unanimous before deadline
   - Vote visibility: transparent to all stakeholders
   - Delegation of votes supported (authorized voters can delegate to proxy)

   **Example Proposals**:
   - "Increase auto-escalation threshold from 30 min to 45 min response time" (dispatch rule change)
   - "Add IoT responder certification requirement" (role permission change)
   - "Implement dynamic fee structure for mutual-aid transfers" (budget policy change)
   - "Upgrade auth to multi-factor with FIDO2" (protocol upgrade)

4. **Access Control Enforcement**:
   - Permission checks at API/service layer
   - Deny by default, allow explicit
   - Context-aware permissions (role + incident severity + region)
   - Real-time permission updates during delegation

   **Context Examples**:
   - Analyst can view High severity incidents, not Critical
   - Responder can only update own assignment status, not others
   - Dispatcher can deploy squads within service area, not outside region
   - Commander can override thresholds only during declared emergency

**UI Integration** (planned components):
- **Access Control Dashboard**: View assigned roles, active delegations, pending proposals
- **Role Management Panel**: (Admin only) Create/modify roles, assign permissions
- **Delegation Interface**: Request/approve authority transfers with duration and scope
- **Governance Portal**: View/vote on proposals, track voting history
- **Permission Matrix Viewer**: Visualize who can do what with interactive role explorer

**Service Integration** ([services/governance/](services/governance/) namespace - future):
- `rbacService.ts` - Role definition, permission enforcement
- `delegationService.ts` - Authority transfer, delegation lifecycle
- `governanceService.ts` - Proposal management, voting, execution

**Security Guarantees**:
- Permission changes immutably logged
- Delegation auto-revokes on time/event expiry
- No silent permission escalation (all changes logged + notified)
- Voting transparent and tamper-proof
- Critical operations require multi-sig + governance approval

**Example Governance Scenario**:
1. High-severity flood → Incident Commander proposes "Emergency Fund Release Authority" delegation to 3 senior dispatchers (5-hour duration)
2. Proposal created, all stakeholders notified
3. 2 administrators approve within 30 minutes
4. Authority delegated immediately with immutable record
5. Dispatchers can now approve fund releases independently (logged per-dispatch)
6. After incident, authority auto-revokes
7. Full audit trail available: who proposed, who approved, how authority was used

---

## Service Architecture

All features are implemented as modular services in [services/](services/) directory:

### Core Services
- `celoService.ts` - Blockchain integration (Base/Celo)
- `web3Service.ts` - Web3 wallet and contract interactions
- `aiService.ts` - Gemini AI integration for translations and analysis
- `notificationService.ts` - Multi-channel notifications (SMS, email, push)
- `offlineService.ts` - Offline-first data sync and queueing

### Trust & Security
- `trustService.ts` - Dynamic trust scoring and reputation
- `zkService.ts` - Zero-knowledge proofs for identity/credentials
- `multiSigService.ts` - Multi-signature approval workflows
- `auditTrailService.ts` - Immutable event logging and chain-of-custody
- `evidenceService.ts` - Cryptographically signed evidence management
- `secureChatService.ts` - End-to-end encrypted communications

### Resource Management
- `volunteerOptimizationService.ts` - Skill-based matching and load balancing
- `logisticsService.ts` - Inventory, equipment, and vehicle management
- `schedulingService.ts` - Shift scheduling with conflict detection
- `certificationService.ts` - Certification lifecycle and training

### Operational Intelligence
- `analyticsService.ts` - Predictive models and decision intelligence
- `workflowService.ts` - Playbook generation and task orchestration
- `escalationService.ts` - Automated incident escalation
- `safetyProtocolService.ts` - Pre-deployment safety checklists
- `commsCopilotService.ts` - AI-assisted situational reports

### Incident Lifecycle
- `handoffService.ts` - Structured incident transfer workflow
- `debriefService.ts` - Post-incident reviews and lessons learned
- `stepDonationsService.ts` - Micro-grants tied to playbook steps
- `baseVaultService.ts` - Smart contract fund management

---

## Technology Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS
- **AI**: Google Gemini API
- **Blockchain**: Base (Ethereum L2) + Celo
- **Maps**: Leaflet with multiple overlay sources
- **State Management**: React hooks
- **Build**: Vite (fast HMR, optimized production builds)

---

## Development

### Project Structure
```
/services     - All service layer modules (20+ services)
/pages        - React page components (Dashboard, IncidentDetail, etc.)
/components   - Reusable UI components (Header, Sidebar, AiAssistant)
/types.ts     - TypeScript type definitions
/constants.tsx - App constants and configuration
/mockData.ts  - Sample data for development/demo
```

### Key Files
- [App.tsx](App.tsx) - Main app component with routing
- [index.tsx](index.tsx) - App entry point
- [vite.config.ts](vite.config.ts) - Vite configuration
- [tsconfig.json](tsconfig.json) - TypeScript configuration

### Building
```bash
npm run build  # Production build
npm run preview # Preview production build
```

### Environment Variables
Create `.env.local`:
```
VITE_GEMINI_API_KEY=your_gemini_key_here
VITE_WAQI_TOKEN=your_waqi_token_here
VITE_FLOOD_GEOJSON_URL=https://example.com/flood-zones.geojson
```

---

## License

MIT License - See LICENSE file for details
