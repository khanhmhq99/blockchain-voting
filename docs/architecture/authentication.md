# Authentication and Authorization

Supabase Auth provides email/password registration, email confirmation, cookie-backed sessions, login, and logout. `@supabase/ssr` creates separate browser and server clients; the Next.js proxy refreshes cookies. The service-role client is server-only.

Authentication and wallet identity are intentionally separate. A registration binds an EVM address to the profile. The organizer approves that address on-chain. Receipt synchronization verifies the transaction signer against the bound profile wallet; a manager's first verified write binds an unset wallet.

Every admin page requires `ADMIN` or `ORGANIZER`. Every election mutation additionally requires ownership unless the profile is `ADMIN`. Client-side visibility is only a convenience—the Server Action, RLS policy, receipt verifier, and contract each enforce their relevant boundary.
