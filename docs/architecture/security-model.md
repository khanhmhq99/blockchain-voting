# Security Model

The browser, URL parameters, form data, and claimed wallet are untrusted. Zod validates server inputs. Server authorization uses the Supabase user retrieved from Auth, not a client-provided user ID. RLS prevents cross-user reads/writes and privilege escalation. The service key and deployer key never enter browser bundles.

Receipt synchronization requires a confirmed successful transaction on the configured chain, exact target contract, expected ABI method, matching election ID, matching profile signer, and operation-specific metadata. Creation also verifies timestamps; candidate synchronization verifies the complete metadata payload; approvals verify the applicant wallet. Transaction upserts are idempotent.

The contract prevents unauthorized creation, invalid windows, candidate mutation after start, unapproved voting, double voting, invalid candidates, voting outside the window, and unauthorized closure. OpenZeppelin `AccessControl` replaces custom role logic.

Residual risks include key compromise, RPC censorship/inconsistency, chain reorganizations before sufficient confirmations, metadata/contract partial provisioning, public wallet linkage, and unaudited contract code. Production hardening should add multisig administration, confirmation-depth policy, independent indexing/reconciliation, monitoring, CSP/rate limits, secret rotation, and an external audit.
