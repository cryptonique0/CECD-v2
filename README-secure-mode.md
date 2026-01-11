# Secure Mode & Privacy

This document summarizes the Whisper/secure mode upgrades.

## Features

- Per-incident secure rooms with ephemeral keys (TTL)
- Location redaction for sensitive cases (None / Coarse / Hidden)
- Delayed public disclosure (schedule/cancel/publish)
- All actions recorded in audit trail

## Services

- `services/secureRoomService.ts`
  - Create/get rooms, join/leave participants
  - Generate/validate ephemeral keys
  - Simulated encrypt/decrypt helpers
- `services/incidentPrivacyService.ts`
  - Set `isSensitive`, `locationRedaction`
  - Get redacted display location
- `services/disclosureService.ts`
  - Schedule/cancel/publish with audit logging
  - `tickAutoPublish()` to publish when time arrives

## UI Integration

- `pages/IncidentDetail.tsx`
  - Sensitive toggle + redaction selector
  - Secure room section: join and generate ephemeral key
  - Delayed disclosure section: datetime input, Schedule, Publish Now
  - Auto-publish interval runs every 10s

## Notes

- Encryption is simulated for demo
- Ephemeral tokens validate via TTL
- Audit trail records privacy-related actions
