import type { AppRole, Election, ElectionStatus } from "@/types/domain";

export function canManageElection(role: AppRole, userId: string, createdBy: string) {
  return role === "ADMIN" || (role === "ORGANIZER" && userId === createdBy);
}

export function deriveElectionStatus(startTime: string | Date, endTime: string | Date, current: ElectionStatus, now = new Date()): ElectionStatus {
  if (current === "CLOSED" || current === "DRAFT") return current;
  if (now >= new Date(endTime)) return "CLOSED";
  if (now >= new Date(startTime)) return "ACTIVE";
  return "REGISTRATION";
}

export function isRegistrationOpen(election: Pick<Election, "status" | "start_time">, now = new Date()) {
  return election.status === "REGISTRATION" && now < new Date(election.start_time);
}
