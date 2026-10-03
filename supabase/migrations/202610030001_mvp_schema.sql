-- ChainBallot MVP Phase 1 schema. Run in the Supabase SQL editor or with the Supabase CLI.
create extension if not exists pgcrypto;

create type public.app_role as enum ('ADMIN', 'ORGANIZER', 'VOTER');
create type public.election_status as enum ('DRAFT', 'REGISTRATION', 'ACTIVE', 'CLOSED');
create type public.registration_status as enum ('PENDING', 'APPROVED', 'REJECTED');
create type public.transaction_type as enum ('CREATE_ELECTION', 'ADD_CANDIDATE', 'APPROVE_VOTER', 'CAST_VOTE', 'CLOSE_ELECTION');
create type public.transaction_status as enum ('PENDING', 'CONFIRMED', 'FAILED');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  display_name text not null check (char_length(display_name) between 2 and 80),
  role public.app_role not null default 'VOTER',
  wallet_address text check (wallet_address is null or wallet_address ~ '^0x[0-9a-fA-F]{40}$'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index profiles_wallet_unique on public.profiles (lower(wallet_address)) where wallet_address is not null;

create table public.elections (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 3 and 120),
  description text not null default '' check (char_length(description) <= 4000),
  start_time timestamptz not null,
  end_time timestamptz not null,
  status public.election_status not null default 'DRAFT',
  contract_election_id bigint,
  contract_address text check (contract_address is null or contract_address ~ '^0x[0-9a-fA-F]{40}$'),
  chain_id integer check (chain_id is null or chain_id > 0),
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint valid_election_window check (start_time < end_time),
  constraint complete_contract_coordinates check (
    (contract_election_id is null and contract_address is null and chain_id is null)
    or (contract_election_id is not null and contract_address is not null and chain_id is not null)
  )
);

create unique index election_contract_mapping_unique on public.elections (chain_id, lower(contract_address), contract_election_id) where contract_election_id is not null;

create table public.candidates (
  id uuid primary key default gen_random_uuid(),
  election_id uuid not null references public.elections(id) on delete cascade,
  contract_candidate_id bigint,
  name text not null check (char_length(name) between 1 and 120),
  description text not null default '' check (char_length(description) <= 2000),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (election_id, contract_candidate_id)
);

create table public.voter_registrations (
  id uuid primary key default gen_random_uuid(),
  election_id uuid not null references public.elections(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  status public.registration_status not null default 'PENDING',
  reviewed_by uuid references public.profiles(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (election_id, user_id),
  constraint coherent_review check (
    (status = 'PENDING' and reviewed_by is null and reviewed_at is null)
    or (status <> 'PENDING' and reviewed_by is not null and reviewed_at is not null)
  )
);

create table public.blockchain_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id),
  election_id uuid not null references public.elections(id) on delete cascade,
  type public.transaction_type not null,
  transaction_hash text not null check (transaction_hash ~ '^0x[0-9a-fA-F]{64}$'),
  chain_id integer not null check (chain_id > 0),
  status public.transaction_status not null default 'PENDING',
  created_at timestamptz not null default now(),
  confirmed_at timestamptz,
  unique (chain_id, transaction_hash),
  constraint coherent_confirmation check ((status = 'CONFIRMED' and confirmed_at is not null) or status <> 'CONFIRMED')
);

create or replace function public.set_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;
create trigger profiles_updated_at before update on public.profiles for each row execute function public.set_updated_at();
create trigger elections_updated_at before update on public.elections for each row execute function public.set_updated_at();
create trigger registrations_updated_at before update on public.voter_registrations for each row execute function public.set_updated_at();

create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, display_name, role)
  values (new.id, coalesce(new.email, ''), coalesce(nullif(new.raw_user_meta_data->>'display_name', ''), split_part(coalesce(new.email, 'voter'), '@', 1)), 'VOTER');
  return new;
end;
$$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

create or replace function public.current_app_role() returns public.app_role
language sql stable security definer set search_path = public as $$
  select role from public.profiles where id = auth.uid()
$$;
create or replace function public.can_manage_election(target_election uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists(select 1 from public.elections e where e.id = target_election and (e.created_by = auth.uid() or public.current_app_role() = 'ADMIN'))
$$;

create or replace function public.prevent_profile_privilege_escalation() returns trigger
language plpgsql as $$
begin
  if auth.role() <> 'service_role' and (new.role <> old.role or new.email <> old.email or new.id <> old.id) then
    raise exception 'role, email and id cannot be changed by this operation';
  end if;
  return new;
end;
$$;
create trigger profiles_no_privilege_escalation before update on public.profiles for each row execute function public.prevent_profile_privilege_escalation();

alter table public.profiles enable row level security;
alter table public.elections enable row level security;
alter table public.candidates enable row level security;
alter table public.voter_registrations enable row level security;
alter table public.blockchain_transactions enable row level security;

create policy "profiles read own admin or managed applicants" on public.profiles for select using (
  id = auth.uid() or public.current_app_role() = 'ADMIN'
  or exists(select 1 from public.voter_registrations r where r.user_id = profiles.id and public.can_manage_election(r.election_id))
);
create policy "profiles update own safe fields" on public.profiles for update using (id = auth.uid()) with check (id = auth.uid());

create policy "published elections are readable" on public.elections for select using (status <> 'DRAFT' or created_by = auth.uid() or public.current_app_role() = 'ADMIN');
create policy "managers create elections" on public.elections for insert with check (created_by = auth.uid() and public.current_app_role() in ('ADMIN', 'ORGANIZER'));
create policy "owners update elections" on public.elections for update using (created_by = auth.uid() or public.current_app_role() = 'ADMIN') with check (created_by = auth.uid() or public.current_app_role() = 'ADMIN');
create policy "owners delete draft elections" on public.elections for delete using (status = 'DRAFT' and (created_by = auth.uid() or public.current_app_role() = 'ADMIN'));

create policy "candidates are readable" on public.candidates for select using (exists(select 1 from public.elections e where e.id = election_id and (e.status <> 'DRAFT' or e.created_by = auth.uid() or public.current_app_role() = 'ADMIN')));
create policy "managers create candidates" on public.candidates for insert with check (public.can_manage_election(election_id));
create policy "managers update candidates" on public.candidates for update using (public.can_manage_election(election_id)) with check (public.can_manage_election(election_id));
create policy "managers delete candidates" on public.candidates for delete using (public.can_manage_election(election_id));

create policy "registrations read own or manager" on public.voter_registrations for select using (user_id = auth.uid() or public.can_manage_election(election_id));
create policy "voters create own pending registration" on public.voter_registrations for insert with check (user_id = auth.uid() and status = 'PENDING' and reviewed_by is null and reviewed_at is null);
create policy "managers review registrations" on public.voter_registrations for update using (public.can_manage_election(election_id)) with check (public.can_manage_election(election_id));

create policy "transactions read own or manager" on public.blockchain_transactions for select using (user_id = auth.uid() or public.can_manage_election(election_id));

grant usage on schema public to anon, authenticated;
grant select on public.elections, public.candidates to anon;
grant select, update on public.profiles to authenticated;
grant select, insert, update, delete on public.elections, public.candidates to authenticated;
grant select, insert, update on public.voter_registrations to authenticated;
grant select on public.blockchain_transactions to authenticated;
grant execute on function public.current_app_role() to authenticated;
grant execute on function public.can_manage_election(uuid) to authenticated;
