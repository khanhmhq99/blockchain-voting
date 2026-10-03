import type { RegistrationStatus } from "@/types/domain";

const transitions: Record<RegistrationStatus, readonly RegistrationStatus[]> = {
  PENDING: ["APPROVED", "REJECTED"], APPROVED: [], REJECTED: [],
};
export function canReviewRegistration(current: RegistrationStatus, next: RegistrationStatus) {
  return transitions[current].includes(next);
}
