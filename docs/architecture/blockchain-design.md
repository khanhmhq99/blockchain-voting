# Blockchain Design

`VotingSystem` is one multi-election contract using OpenZeppelin `AccessControl`. `DEFAULT_ADMIN_ROLE` grants/revokes organizer accounts; `ORGANIZER_ROLE` authorizes election creation. The creating organizer and contract admins can configure, approve, and close that election.

An election stores organizer, start/end timestamps, closed state, candidate count, and existence. Nested mappings store candidate records, approved addresses, and `hasVoted`. Vote counts are updated only after all eligibility, time, duplication, and candidate checks pass.

Candidate metadata is a short JSON reference containing the application candidate UUID, name, and description. No voter personal data is written to the contract. `VoteCast` omits the voter address, although the sender and candidate remain visible through transaction calldata.

Events are designed for future idempotent indexing: `ElectionCreated`, `CandidateAdded`, `VoterApproved`, `VoteCast`, and `ElectionClosed`. Deployment produces a network-specific JSON record rather than hardcoding an address in source.

Security-critical invariants are tested in `blockchain/test/VotingSystem.test.ts`. Administrative role grants should use a hardware-backed key or multisig beyond the thesis prototype.
