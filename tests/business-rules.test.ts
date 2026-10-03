import { describe, expect, it } from "vitest";
import { canManageElection, deriveElectionStatus, isRegistrationOpen } from "@/features/elections/rules";
import { canReviewRegistration } from "@/features/voters/rules";
import { toStoredTransactionStatus, transactionProgress } from "@/features/voting/transaction-state";

describe("role authorization", () => {
  it("allows admins globally and organizers only for owned elections", () => {
    expect(canManageElection("ADMIN", "admin", "someone")).toBe(true);
    expect(canManageElection("ORGANIZER", "owner", "owner")).toBe(true);
    expect(canManageElection("ORGANIZER", "other", "owner")).toBe(false);
    expect(canManageElection("VOTER", "owner", "owner")).toBe(false);
  });
});

describe("election and registration rules", () => {
  const now = new Date("2026-01-01T12:00:00Z");
  it("derives registration, active and closed states", () => {
    expect(deriveElectionStatus("2026-01-02", "2026-01-03", "REGISTRATION", now)).toBe("REGISTRATION");
    expect(deriveElectionStatus("2025-12-31", "2026-01-03", "REGISTRATION", now)).toBe("ACTIVE");
    expect(deriveElectionStatus("2025-12-30", "2025-12-31", "ACTIVE", now)).toBe("CLOSED");
    expect(deriveElectionStatus("2025-12-30", "2025-12-31", "DRAFT", now)).toBe("DRAFT");
  });
  it("permits registration only before start in registration state", () => {
    expect(isRegistrationOpen({ status: "REGISTRATION", start_time: "2026-01-02" }, now)).toBe(true);
    expect(isRegistrationOpen({ status: "ACTIVE", start_time: "2025-01-02" }, now)).toBe(false);
  });
  it("permits a single manager review transition", () => {
    expect(canReviewRegistration("PENDING", "APPROVED")).toBe(true);
    expect(canReviewRegistration("PENDING", "REJECTED")).toBe(true);
    expect(canReviewRegistration("APPROVED", "REJECTED")).toBe(false);
  });
});

describe("transaction state mapping", () => {
  it("maps UI lifecycle into persistent status", () => {
    expect(toStoredTransactionStatus("SUBMITTED")).toBe("PENDING");
    expect(toStoredTransactionStatus("CONFIRMED")).toBe("CONFIRMED");
    expect(toStoredTransactionStatus("FAILED")).toBe("FAILED");
    expect(transactionProgress("CONFIRMING")).toBeGreaterThan(transactionProgress("WAITING_FOR_WALLET"));
  });
});
