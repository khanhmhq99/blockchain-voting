# Privacy Model

## On-chain

The contract stores election timestamps and organizer, candidate metadata references/counts, approved wallet addresses, whether an address voted, vote totals, and closure state. Transactions expose sender, method calldata, time, and gas data. Events expose election/candidate IDs; `VoteCast` intentionally omits the voter address.

## Off-chain

Supabase stores email, display name, application role, wallet address, descriptive election/candidate data, registration decisions, and transaction receipt metadata. It does not store a voter's selected candidate. Full names, email, phone, government ID, IP address, and device fingerprints are never placed on-chain by this application.

## MVP limitations

MVP 1 is integrity-focused, not anonymous. An observer can correlate a wallet with an approval event and inspect `castVote(electionId,candidateId)` calldata. Supabase administrators can associate accounts and wallets. Omitting the address from `VoteCast` avoids an extra direct event linkage but does not provide ballot secrecy. Network and hosting providers may retain their own operational logs.

## ZKP migration

Phase 3 replaces approved-address mappings with identity commitments in a Merkle tree. A voter proves membership without revealing the leaf and publishes an election-scoped nullifier to prevent duplicates. Semaphore or a Circom/snarkjs circuit can supply the proof system. The contract verifies proof, root, signal/election binding, and unused nullifier; Supabase continues to hold only application identity/workflow data.
