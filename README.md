<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1of-5q8XEFbmKKg4WNnLD5zlcNlBD0skO

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## New

- Predictive dispatch & routing: uses live incident + responder locations to suggest pre-positioning, fastest safe routes, and reroute-aware ETAs on the dashboard.
- Escalation playbooks: auto-generate SOPs per incident with owners, timers, skill needs, and gap alerts.
- Dynamic trust + reputation: verifiable, time-decaying trust scores with attestations from missions, peer reviews, and ZK-backed ID/skill proofs.
- Situational map layers: toggle overlays for weather radar, flood zones, AQI, road closures, shelters, and hospitals. Defaults adapt by role (Dispatcher/Analyst see more, Citizen sees essentials).

## Offline + SMS Bridge

- Offline-first capture: Reports are stored locally when offline and auto-synchronized when connectivity is restored. Pending items are marked and cleared after sync.
- On-device translation: If AI translation is available, translated text is stored with the incident; otherwise, translation is deferred to sync.
- SMS/USSD bridge (stub): Minimal text reports can be ingested via gateway parsing (see services/smsBridgeService.ts). Useful in low-connectivity contexts.

How it works:
- For demos, you can convert a simple SMS string to an incident via `buildIncidentFromSms()` and add it to the feed.
 
## Live Situational Layers (optional)

- Weather radar: NOAA NEXRAD WMS overlay (no key required).
- Flood zones: Provide a GeoJSON URL via `VITE_FLOOD_GEOJSON_URL`.
- Air Quality (AQI): WAQI API near your position; set `VITE_WAQI_TOKEN`.
- Road closures, shelters, hospitals: Queried via OpenStreetMap Overpass around your location.

Environment variables (create `.env.local`):

```
VITE_WAQI_TOKEN=your_waqi_token_here
VITE_FLOOD_GEOJSON_URL=https://example.com/flood-zones.geojson
```

If a source is unavailable, the app gracefully falls back to simulated overlays.
- The app detects online/offline events and queues incident payloads locally.
- When back online, queued items are processed and `pendingSync` is cleared.
- For demos, you can convert a simple SMS string to an incident via `buildIncidentFromSms()` and add it to the feed.
