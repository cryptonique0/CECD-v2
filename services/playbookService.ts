import { Incident, PlaybookPlan, PlaybookStep, Severity, User } from "../types";

export interface SquadMember {
  id: string;
  name: string;
  skills: string[];
}

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

function pickOwner(
  requiredSkills: string[],
  incident: Incident,
  volunteers: User[],
  squadMembers?: SquadMember[]
): string {
  // Priority 1: Squad members with matching skills
  if (squadMembers && squadMembers.length > 0) {
    const squadMatch = squadMembers.find(member =>
      requiredSkills.some(skill => member.skills.includes(skill))
    );
    if (squadMatch) return squadMatch.name;
  }

  // Priority 2: Already assigned responders with matching skills
  const assigned = incident.assignedResponders
    .map(id => volunteers.find(v => v.id === id))
    .filter(Boolean) as User[];

  const skillMatch = [...assigned, ...volunteers].find(v =>
    requiredSkills.some(skill => v.skills.includes(skill))
  );
  if (skillMatch) return skillMatch.name;

  // Fallback: First squad member, then assigned, then any volunteer
  return (
    squadMembers?.[0]?.name ||
    assigned[0]?.name ||
    volunteers[0]?.name ||
    "Ops Lead"
  );
}

function computeResourceGaps(requiredSkills: string[], volunteers: User[]): string[] {
  const volunteerSkills = new Set(volunteers.flatMap(v => v.skills));
  return requiredSkills.filter(skill => !volunteerSkills.has(skill));
}

function buildSteps(
  incident: Incident,
  volunteers: User[],
  squadMembers?: SquadMember[]
): PlaybookStep[] {
  const now = Date.now();
  const durationProfile = SEVERITY_MINUTES[incident.severity] || SEVERITY_MINUTES[Severity.MEDIUM];
  let rollingEta = now;

  return BASE_STEPS.map((step, idx) => {
    const expected = durationProfile[idx] || durationProfile[durationProfile.length - 1];
    rollingEta += expected * 60 * 1000;

    return {
      id: `${incident.id}-pb-${idx + 1}`,
      title: step.title,
      owner: pickOwner(step.requiredSkills, incident, volunteers, squadMembers),
      expectedDurationMins: expected,
      dueAt: rollingEta,
      status: "Pending",
      requiredSkills: step.requiredSkills,
      resourcesNeeded: step.resourcesNeeded,
    };
  });
}

export const playbookService = {
  generatePlaybook(
    incident: Incident,
    volunteers: User[] = [],
    squadMembers?: SquadMember[]
  ): PlaybookPlan {
    const steps = buildSteps(incident, volunteers, squadMembers);
    const requiredSkills = Array.from(new Set(steps.flatMap(s => s.requiredSkills)));
    const resourceGaps = computeResourceGaps(requiredSkills, volunteers);

    return {
      steps,
      requiredSkills,
      resourceGaps,
      summary: `Auto-generated SOP for ${incident.title} (${incident.severity}). ${
        squadMembers && squadMembers.length > 0
          ? `Assigned to ${squadMembers.map(m => m.name).join(', ')}.`
          : ""
      } Tracks owners, timers, and gaps.`,
    };
  }
};
