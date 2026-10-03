# System Overview

## Context

The browser renders the Next.js application, maintains a Supabase session, and uses an injected EVM wallet only for chain writes. Next.js is the BFF: Server Components query descriptive data, Server Actions validate workflow changes, and the transaction synchronization route independently verifies receipts. Supabase provides identity, PostgreSQL, and RLS. `VotingSystem` provides consensus-enforced vote validity.

```text
Browser UI ── session/forms ──> Next.js BFF ──> Supabase Auth/PostgreSQL
     │                              │
     └── signed EVM transaction ───>│── receipt verification ──> EVM RPC
                                    └── confirmed metadata ────> Supabase
```

## Ownership boundary

Supabase owns identity, roles, descriptive election/candidate metadata, registration reviews, and transaction receipts. The contract owns organizer permission, election windows, candidate immutability, address eligibility, one-vote state, counts, and closure. If these sources disagree about whether a vote is valid, the contract wins.

## Failure and retry model

Database drafts precede on-chain provisioning. Each successful chain write is synchronized idempotently by `(chain_id, transaction_hash)`. Candidate provisioning can resume from candidates without a contract ID. A chain transaction may succeed while synchronization fails; the hash remains an authoritative receipt and synchronization can be retried. A future event indexer will close that reconciliation gap.

## Research seams

`VoteSubmissionStrategy` separates vote UX from direct-wallet submission. Explicit chain ID, address, and RPC inputs support BSC/opBNB comparison. Address eligibility is isolated in the contract and registration boundary so commitments/nullifiers can replace it during the ZKP phase.
