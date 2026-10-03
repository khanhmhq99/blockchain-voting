# Current MVP Research Baseline

MVP Phase 1 establishes a reproducible identity-linked voting baseline: Supabase authentication and registration, browser-wallet submission, BSC-compatible contract enforcement, verified transaction receipts, and direct on-chain result reads.

The independent variables intentionally remain explicit: submission strategy, chain configuration, and identity/eligibility mechanism. This supports later experiments without changing the core task UI. Baseline measurements can record wallet-confirmation latency, submitted-to-confirmed latency, gas used, failure reason, and total workflow completion time. No claim of anonymity should be made for this phase.

The implemented validation baseline is 13 smart-contract cases plus application business-rule tests, TypeScript strict checking, ESLint, and a production Next.js build.
