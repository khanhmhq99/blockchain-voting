# Database Design

The migration defines five tables: `profiles`, `elections`, `candidates`, `voter_registrations`, and `blockchain_transactions`. PostgreSQL enums constrain roles and lifecycle values. Foreign keys preserve ownership, unique constraints stop duplicate registrations and transaction receipts, and checks validate time windows, addresses, receipt hashes, and coherent review/confirmation state.

`profiles.id` is the Supabase Auth UUID. A trigger creates a `VOTER` profile for each new Auth user; users cannot promote themselves. Election contract coordinates are all-null for a draft and all-present after provisioning. Candidate rows map to numeric on-chain IDs. Registration is unique per election/user. Transaction rows contain type, hash, chain, and state only—never the selected candidate.

RLS allows public reads of non-draft elections/candidates, self reads and safe profile updates, self-created pending registrations, and self transaction history. Organizers manage only owned elections and their applicants; admins manage all. Server authorization repeats these checks because RLS is defense in depth, not the sole business layer.
