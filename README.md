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
