# ChainBallot — Blockchain Voting MVP

ChainBallot is a Master's thesis research prototype for a privacy-aware, scalable electronic voting system. MVP Phase 1 combines Supabase email/password identity and registration workflows with an OpenZeppelin-based EVM contract that authoritatively enforces eligibility, time windows, one wallet/one vote, counts, and closure.

This phase intentionally does **not** implement gasless relaying, zero-knowledge proofs, indexing workers, AI fraud detection, or L2 benchmarking. Its boundaries are designed so those experiments can be added without replacing the UI or domain model.

## Implemented workflow

1. An `ADMIN` or `ORGANIZER` creates a draft election and adds at least two candidates.
2. The organizer provisions the election and candidates through an EVM wallet.
3. A signed-in voter registers an EVM wallet while registration is open.
4. The organizer approves that exact wallet with an on-chain transaction, or rejects the request off-chain.
5. During the voting window, an approved wallet casts one direct blockchain transaction.
6. The UI displays lifecycle state and transaction hash; receipt metadata is synchronized to Supabase without storing the selected candidate.
7. Results are read directly from the contract.

## Requirements

- Node.js 20.9 or newer (Node 22 LTS recommended)
- pnpm (Corepack can provide it)
- Git and an EVM browser wallet
- A hosted Supabase project
- Native BNB for gas on BSC Testnet, or the funded Hardhat test accounts locally

No local PostgreSQL, Docker, Redis, or separate backend is required.

## Quick start

```bash
corepack enable
pnpm install
cp .env.example .env.local
pnpm dev
```

On Windows PowerShell, use `Copy-Item .env.example .env.local` instead of `cp`.

## Environment variables

| Variable | Exposure | Purpose |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Browser-safe | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Browser-safe | Supabase anon/publishable key |
| `SUPABASE_SERVICE_ROLE_KEY` | Server only | Verified receipt synchronization |
| `NEXT_PUBLIC_CHAIN_ID` | Browser-safe | Expected EVM chain (`31337` local, `97` BSC testnet) |
| `NEXT_PUBLIC_RPC_URL` | Browser-safe | JSON-RPC used for reads and receipt verification |
| `NEXT_PUBLIC_VOTING_CONTRACT_ADDRESS` | Browser-safe | Deployed `VotingSystem` address |
| `NEXT_PUBLIC_BLOCK_EXPLORER_URL` | Browser-safe | Transaction-link base URL |
| `DEPLOYER_PRIVATE_KEY` | Server/deployment only | BSC deployment/admin signer |
| `BSC_TESTNET_RPC_URL` | Server/deployment only | BSC Testnet deployment RPC |
| `LOCALHOST_RPC_URL` | Server/deployment only | Local Hardhat RPC |
| `ORGANIZER_ADDRESS` | Server/deployment only | Address to receive the on-chain organizer role |

Never expose or commit `SUPABASE_SERVICE_ROLE_KEY` or `DEPLOYER_PRIVATE_KEY`.

## Configure Supabase

1. Create a hosted Supabase project.
2. Open SQL Editor and run `supabase/migrations/202610030001_mvp_schema.sql`.
3. Enable email/password authentication. Set the Site URL to `http://localhost:3000` for development and add `http://localhost:3000/auth/confirm` as a redirect URL.
4. Copy the project URL, anon key, and service-role key into `.env.local`.
5. Register users through `/register`. The database trigger creates each profile as `VOTER`.
6. In SQL Editor, promote development-only accounts:

```sql
update public.profiles set role = 'ADMIN' where id = '<admin-auth-user-uuid>';
update public.profiles set role = 'ORGANIZER' where id = '<organizer-auth-user-uuid>';
```

Create four Auth users for a demo: Admin, Organizer, Voter 1, and Voter 2. Keep demo passwords development-only. See `supabase/seed.sql`.

## Local blockchain

Terminal 1:

```bash
pnpm blockchain:compile
pnpm blockchain:test
pnpm blockchain:node
```

Terminal 2:

```bash
pnpm blockchain:deploy:local
```

Copy the address from `blockchain/deployments/localhost.json` into `.env.local`, set chain ID `31337`, RPC `http://127.0.0.1:8545`, and restart Next.js. Import a displayed Hardhat account into the browser wallet. The deployer already has admin and organizer roles. To authorize another wallet, set `ORGANIZER_ADDRESS` and run `pnpm blockchain:grant-organizer:local`.

## BSC Testnet deployment

1. Fund the deployment wallet with testnet BNB.
2. Set `DEPLOYER_PRIVATE_KEY` and `BSC_TESTNET_RPC_URL` in `.env.local`.
3. Run:

```bash
pnpm blockchain:deploy:testnet
```

4. Copy the generated address from `blockchain/deployments/bscTestnet.json` to `NEXT_PUBLIC_VOTING_CONTRACT_ADDRESS`; set chain ID `97`, a BSC Testnet read RPC, and `https://testnet.bscscan.com` as the explorer.
5. The deployer is the initial contract admin/organizer. For each additional organizer wallet, set `ORGANIZER_ADDRESS` and run `pnpm blockchain:grant-organizer:testnet` from the admin deployment key.
6. Restart or redeploy Next.js after changing browser-exposed variables.

## Validation

```bash
pnpm lint
pnpm typecheck
pnpm build
pnpm test
pnpm blockchain:test
```

The contract suite covers authorized/unauthorized creation, candidate creation and locking, approval, unapproved voting, approved voting, double voting, invalid candidates, time boundaries, result counts, and closure authorization. Application tests cover roles, registration/status rules, approval transitions, and transaction-state mapping.

## Repository map

```text
app/                    App Router pages, server actions entry points, APIs
components/             shared shadcn-style UI primitives and layout
features/               auth, elections, voters, voting, chain synchronization
lib/auth/               server authorization helpers
lib/supabase/           browser/server/admin clients and session proxy
lib/blockchain/         ABI, providers, reads, writes, strategy interface
blockchain/             Solidity contract, Hardhat scripts and tests
supabase/migrations/    PostgreSQL schema, triggers, grants and RLS
tests/                  application business-rule tests
docs/                   implementation and thesis architecture material
types/                  shared domain and database types
```

## Known MVP limitations

- Wallet addresses and transaction calldata make votes linkable; MVP 1 is not anonymous.
- One deployed contract hosts multiple elections, and organizers pay gas directly.
- Receipt synchronization is request-driven; there is no independent event indexer or reorg reconciliation worker yet.
- Database and on-chain provisioning are sequential, so a user can retry after partial completion.
- Admin role assignment and on-chain organizer grants are setup operations, not self-service UI.
- The system has not undergone a professional smart-contract security audit.

The exact recommended next step is Phase 2: add an EIP-712 vote request and `RelayedVoteStrategy`, a rate-limited `/api/relay` handler with nonce/replay validation, an ERC-2771 forwarder, and `_msgSender()`-aware contract evolution—while keeping `VotePanel` unchanged.

See [the implementation plan](docs/implementation-plan.md), [privacy model](docs/architecture/privacy-model.md), and [future roadmap](docs/thesis/future-roadmap.md).
