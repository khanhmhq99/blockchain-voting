# MVP Phase 1 Implementation Plan

## Current repository state

The workspace was empty at the start of implementation. This project is therefore created as a new, single-application repository under `blockchain-voting/`. There is no legacy code or database state to migrate.

## Target architecture

- Next.js App Router is the frontend and lightweight backend/BFF.
- Supabase Auth provides email/password sessions; hosted PostgreSQL stores profiles, descriptive election data, registrations, and transaction metadata.
- A Solidity contract is authoritative for election integrity, eligibility, one-voter-one-vote, counts, and closure.
- Browser wallets submit MVP vote and organizer transactions directly through ethers.js.
- UI/domain services depend on a `VoteSubmissionStrategy` interface so a relayed ERC-2771 strategy can replace direct submission later.

## Pages and routes

Public/authenticated voter pages:

- `/`, `/login`, `/register`, `/auth/confirm`
- `/elections`, `/elections/[id]`, `/elections/[id]/register`
- `/elections/[id]/vote`, `/elections/[id]/result`
- `/my-elections`, `/my-votes`

Admin/organizer pages:

- `/admin`, `/admin/elections`, `/admin/elections/new`
- `/admin/elections/[id]`, `/admin/elections/[id]/candidates`
- `/admin/elections/[id]/voters`

Route handlers are used for transaction synchronization and health checks. Mutating database operations use typed Server Actions with Zod validation and shared authorization helpers.

## Supabase schema

- `profiles`: auth-linked identity, role, display name, optional wallet.
- `elections`: descriptive metadata and deployed contract coordinates.
- `candidates`: descriptive candidate records mapped to numeric on-chain candidate IDs.
- `voter_registrations`: per-user registration and review workflow.
- `blockchain_transactions`: lifecycle metadata and transaction hashes; never vote selections.

Enums constrain roles, election states, registration states, transaction kinds, and transaction states. Unique constraints prevent duplicate registration, candidate mapping, and transaction hashes. Updated-at triggers and an auth-user profile trigger keep routine state consistent.

## RLS model

- Public users can read published/non-draft election and candidate metadata.
- Authenticated users can read their own profile, registration, and transaction metadata and can update only safe profile fields through an RLS-safe helper function.
- Voters can create only their own pending registrations and cannot review them.
- Organizers manage elections they created and related candidates/registrations.
- Admin access is determined by a non-user-editable role in `profiles`.
- Sensitive mutations also perform server-side role, ownership, state, and payload validation. A service-role client is limited to server-only transaction synchronization and documented setup tasks.

## Smart contract design

One `VotingSystem` contract uses OpenZeppelin `AccessControl` with `DEFAULT_ADMIN_ROLE` and `ORGANIZER_ROLE`. Each election stores organizer, time window, closed state, and candidate count. Separate mappings store candidates, approved voters, and vote state.

The contract enforces organizer authorization, valid windows, immutable candidates after start, approved-only voting, one vote per wallet, valid candidates, and organizer/admin closure. Events support future indexing. `VoteCast` identifies the election and candidate but deliberately omits the voter address; current calldata and contract state still make MVP voting linkable.

## Blockchain integration design

`lib/blockchain` owns provider creation, ABI/addresses, reads, writes, errors, and types. Feature components call those functions rather than construct contracts. Direct wallet vote submission implements a strategy interface with normalized transaction lifecycle callbacks. Deployment scripts write per-network metadata that can populate environment configuration without hardcoded addresses.

## Folder structure

```text
app/                    routes, layouts, route handlers
components/             shared UI and navigation
features/               domain-specific actions, schemas, services, UI
lib/supabase/           browser/server/admin clients and middleware
lib/auth/               authentication and authorization helpers
lib/blockchain/         contract-facing integration boundary
blockchain/             Solidity, Hardhat config, scripts, tests, deployments
supabase/migrations/    SQL schema, functions, constraints, and RLS
tests/                  application business-logic tests
docs/                   architecture and thesis documentation
types/                  shared database/domain types
```

## Implementation sequence

1. Establish strict Next.js/TypeScript/Tailwind configuration and shared UI.
2. Add Supabase clients, schema migration, generated-style database types, and middleware.
3. Implement authentication, profile creation, route protection, and server-side roles.
4. Implement and test the Solidity contract.
5. Add the blockchain abstraction and direct-wallet strategy.
6. Implement election/candidate management.
7. Implement registration and review workflows.
8. Implement voting transaction lifecycle, synchronization, and on-chain results.
9. Add admin/voter dashboards and participation history.
10. Add unit tests, validation, documentation, lint/typecheck/build/test verification.

## Security considerations

- Client role checks are presentational only; every protected mutation checks the authenticated server identity and role/ownership.
- Database policies prevent self-promotion and self-approval.
- Wallet ownership is demonstrated by the wallet signing the on-chain transaction. The saved profile wallet must match for registration/approval and vote UX.
- The contract, not Supabase, enforces eligibility, time windows, candidates, and double-vote prevention.
- Secrets are server-only and browser-safe variables are explicitly prefixed.
- Transaction synchronization accepts only known operations, validates hashes/addresses, and verifies receipts against the configured chain/contract before recording confirmation.

## Known assumptions

- One `VotingSystem` deployment can host multiple elections; each Supabase election stores the returned numeric contract election ID.
- Organizers perform contract writes from an EVM wallet holding `ORGANIZER_ROLE`; the web session and wallet remain separate identities.
- Creating database metadata and creating its on-chain election are two explicit steps because a browser wallet must confirm the latter.
- An administrator grants on-chain organizer roles with the deployment/admin wallet outside the UI for MVP.
- Supabase is remotely hosted; local PostgreSQL, Docker, Redis, and workers are not required.

## Future migration considerations

- Phase 2 adds a `RelayedVoteStrategy`, relay route, EIP-712 request model, nonce/replay checks, rate limiting, and ERC-2771-aware contract evolution.
- Phase 3 replaces address-based eligibility with identity commitments, Merkle membership, nullifiers, and proof verification while retaining descriptive application data off-chain.
- A future indexer consumes existing contract events into idempotent Supabase projections.
- Benchmark adapters make chain/provider selection explicit for BSC versus opBNB experiments.
- Fraud/anomaly analysis consumes derived telemetry and only flags activity; it never decides vote validity.
