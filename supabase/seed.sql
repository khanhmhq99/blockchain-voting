-- Application rows are normally created through the UI. Auth users cannot safely be
-- seeded with portable passwords in a migration. Create four users in Authentication
-- > Users, then promote development-only accounts with the following commands.
-- Replace UUIDs with Auth user IDs. Never use demo credentials in production.

-- update public.profiles set role = 'ADMIN' where id = '<admin-user-uuid>';
-- update public.profiles set role = 'ORGANIZER' where id = '<organizer-user-uuid>';
-- Voter 1 and Voter 2 retain the default VOTER role.
