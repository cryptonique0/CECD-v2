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
