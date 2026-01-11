import { Incident, PlaybookPlan, PlaybookStep, Severity, User } from "../types";

const BASE_STEPS = [
  {
    title: "Stabilize and triage",
    requiredSkills: ["First Aid", "Medic"],
    resourcesNeeded: ["Medkit", "Vitals monitor"],
  },
  {
    title: "Secure perimeter and hazards",
    requiredSkills: ["Security", "Logistics"],
    resourcesNeeded: ["Barricades", "Cones", "Radio"],
  },
  {
    title: "Deploy response and route support",
    requiredSkills: ["Search & Rescue", "Driver"],
    resourcesNeeded: ["Vehicle", "Fuel", "Thermal camera"],
  },
  {
    title: "Comms + handoff",
    requiredSkills: ["Communication", "Coordination"],
    resourcesNeeded: ["Satellite comms", "Power"],
  },
];

const SEVERITY_MINUTES: Record<Severity, number[]> = {
  [Severity.CRITICAL]: [8, 15, 25, 35],
  [Severity.HIGH]: [12, 18, 28, 40],
  [Severity.MEDIUM]: [15, 25, 35, 50],
  [Severity.LOW]: [20, 30, 45, 60],
};

function pickOwner(requiredSkills: string[], incident: Incident, volunteers: User[]): string {
  const assigned = incident.assignedResponders
    .map(id => volunteers.find(v => v.id === id))
    .filter(Boolean) as User[];

  const skillMatch = [...assigned, ...volunteers].find(v =>
    requiredSkills.some(skill => v.skills.includes(skill))
  );
  if (skillMatch) return skillMatch.name;

  return assigned[0]?.name || volunteers[0]?.name || "Ops Lead";
}

function computeResourceGaps(requiredSkills: string[], volunteers: User[]): string[] {
  const volunteerSkills = new Set(volunteers.flatMap(v => v.skills));
  return requiredSkills.filter(skill => !volunteerSkills.has(skill));
}

function buildSteps(incident: Incident, volunteers: User[]): PlaybookStep[] {
  const now = Date.now();
  const durationProfile = SEVERITY_MINUTES[incident.severity] || SEVERITY_MINUTES[Severity.MEDIUM];
  let rollingEta = now;

  return BASE_STEPS.map((step, idx) => {
    const expected = durationProfile[idx] || durationProfile[durationProfile.length - 1];
    rollingEta += expected * 60 * 1000;

    return {
      id: `${incident.id}-pb-${idx + 1}`,
      title: step.title,
      owner: pickOwner(step.requiredSkills, incident, volunteers),
      expectedDurationMins: expected,
      dueAt: rollingEta,
      status: "Pending",
      requiredSkills: step.requiredSkills,
      resourcesNeeded: step.resourcesNeeded,
    };
  });
}

export const playbookService = {
  generatePlaybook(incident: Incident, volunteers: User[] = []): PlaybookPlan {
    const steps = buildSteps(incident, volunteers);
    const requiredSkills = Array.from(new Set(steps.flatMap(s => s.requiredSkills)));
    const resourceGaps = computeResourceGaps(requiredSkills, volunteers);

    return {
      steps,
      requiredSkills,
      resourceGaps,
      summary: `Auto-generated SOP for ${incident.title} (${incident.severity}). Tracks owners, timers, and gaps.`
    };
  }
};
