# Future Research Roadmap

## Phase 2 — Gasless voting

Add EIP-712 typed vote requests, nonce and deadline fields, replay protection, relayer validation/rate limits, an ERC-2771 forwarder, and a `RelayedVoteStrategy`. Preserve the voting UI and compare direct-wallet versus relayed latency, cost payer, failure rate, and usability.

## Phase 3 — Anonymous eligibility

Generate an identity secret and commitment, maintain an approved commitment Merkle tree, anchor roots on-chain, and submit a membership proof plus election-scoped nullifier. Evaluate Semaphore first; use Circom/snarkjs if a custom circuit is academically justified. Measure proof generation/verification cost and anonymity properties against the address-linked baseline.

## Phase 4 — Event indexing

Build an idempotent, reorg-aware consumer for existing contract events. Persist block/transaction/log identity, confirmation depth, and derived projections in Supabase. Dashboards should read projections while preserving the chain as authority.

## Phase 5 — Anomaly detection

Combine application, relayer, and chain telemetry; derive timing, frequency, failure, gas, and relationship features; and evaluate Isolation Forest and One-Class SVM (optional autoencoder). Models only score, flag, and alert. They never accept or reject a valid vote.

## Phase 6 — BSC versus opBNB

Deploy the same versioned contract and workload to both testnets. Capture transaction latency, gas cost converted consistently, throughput, failure rate, and confirmation time under controlled runs. Record RPC, contract bytecode, compiler settings, timestamps, and sample sizes for reproducibility.

## Exact next step

Define the Phase 2 EIP-712 request schema and threat model, then implement `RelayedVoteStrategy` behind the existing interface with an ERC-2771-aware test contract and relay route. Do not begin ZKP work until direct and relayed behavior have equivalent invariant coverage.
