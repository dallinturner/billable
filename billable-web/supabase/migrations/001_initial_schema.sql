-- ============================================================
-- Billable MVP - Initial Schema
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================================
-- ENUMS
-- ============================================================

create type user_role as enum ('admin', 'lawyer', 'individual');
create type entry_status as enum ('draft', 'submitted');
create type edit_request_status as enum ('pending', 'approved', 'denied');

-- ============================================================
-- TABLES
-- ============================================================

-- Firms
create table firms (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  billing_increment numeric not null default 0.1,
  created_at timestamptz not null default now()
);

-- Users (extends auth.users)
create table users (
  id uuid primary key references auth.users(id) on delete cascade,
  firm_id uuid references firms(id) on delete set null,
  full_name text not null,
  role user_role not null default 'individual',
  created_at timestamptz not null default now()
);

-- Clients / Matters
create table clients (
  id uuid primary key default uuid_generate_v4(),
  firm_id uuid not null references firms(id) on delete cascade,
  name text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Task Types
create table task_types (
  id uuid primary key default uuid_generate_v4(),
  firm_id uuid references firms(id) on delete cascade,
  name text not null,
  is_active boolean not null default true
);

-- Time Entries
create table time_entries (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references users(id) on delete cascade,
  client_id uuid not null references clients(id) on delete restrict,
  task_type_id uuid references task_types(id) on delete set null,
  started_at timestamptz not null,
  ended_at timestamptz,
  exact_duration_minutes numeric,
  billable_duration numeric,
  notes text,
  status entry_status not null default 'draft',
  created_at timestamptz not null default now()
);

-- Edit Requests
create table edit_requests (
  id uuid primary key default uuid_generate_v4(),
  time_entry_id uuid not null references time_entries(id) on delete cascade,
  requested_by uuid not null references users(id) on delete cascade,
  proposed_notes text,
  proposed_duration numeric,
  proposed_task_type_id uuid references task_types(id) on delete set null,
  status edit_request_status not null default 'pending',
  created_at timestamptz not null default now()
);

-- ============================================================
-- SEED DEFAULT TASK TYPES (global, firm_id = null)
-- ============================================================

insert into task_types (name, firm_id) values
  ('Research', null),
  ('Drafting', null),
  ('Client Call', null),
  ('Court Appearance', null),
  ('Deposition', null),
  ('Filing', null),
  ('Correspondence', null),
  ('Meeting', null),
  ('Document Review', null),
  ('Contract Negotiation', null);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table firms enable row level security;
alter table users enable row level security;
alter table clients enable row level security;
alter table task_types enable row level security;
alter table time_entries enable row level security;
alter table edit_requests enable row level security;

-- Helper: get current user's firm_id
create or replace function get_my_firm_id()
returns uuid
language sql
security definer
stable
as $$
  select firm_id from users where id = auth.uid()
$$;

-- Helper: get current user's role
create or replace function get_my_role()
returns user_role
language sql
security definer
stable
as $$
  select role from users where id = auth.uid()
$$;

-- ---- FIRMS ----
-- Users can read their own firm
create policy "Users can read their own firm"
  on firms for select
  using (id = get_my_firm_id());

-- Admins can update their own firm
create policy "Admins can update their firm"
  on firms for update
  using (id = get_my_firm_id() and get_my_role() = 'admin');

-- ---- USERS ----
-- Users can read themselves
create policy "Users can read themselves"
  on users for select
  using (id = auth.uid());

-- Admins can read all users in their firm
create policy "Admins can read firm users"
  on users for select
  using (firm_id = get_my_firm_id() and get_my_role() = 'admin');

-- Users can update themselves
create policy "Users can update themselves"
  on users for update
  using (id = auth.uid());

-- Allow insert during signup (service role handles this, but also allow self-insert)
create policy "Users can insert themselves"
  on users for insert
  with check (id = auth.uid());

-- ---- CLIENTS ----
-- All firm members can read active clients
create policy "Firm members can read clients"
  on clients for select
  using (firm_id = get_my_firm_id());

-- Admins can insert clients
create policy "Admins can insert clients"
  on clients for insert
  with check (firm_id = get_my_firm_id() and get_my_role() = 'admin');

-- Admins can update clients
create policy "Admins can update clients"
  on clients for update
  using (firm_id = get_my_firm_id() and get_my_role() = 'admin');

-- ---- TASK TYPES ----
-- All users can read global task types and their firm's task types
create policy "Users can read task types"
  on task_types for select
  using (firm_id is null or firm_id = get_my_firm_id());

-- Admins can insert task types for their firm
create policy "Admins can insert task types"
  on task_types for insert
  with check (firm_id = get_my_firm_id() and get_my_role() = 'admin');

-- Admins can update their firm's task types
create policy "Admins can update task types"
  on task_types for update
  using (firm_id = get_my_firm_id() and get_my_role() = 'admin');

-- ---- TIME ENTRIES ----
-- Lawyers/individuals can read their own entries
create policy "Users can read own time entries"
  on time_entries for select
  using (user_id = auth.uid());

-- Admins can read submitted entries for their firm
create policy "Admins can read firm submitted entries"
  on time_entries for select
  using (
    get_my_role() = 'admin'
    and status = 'submitted'
    and user_id in (
      select id from users where firm_id = get_my_firm_id()
    )
  );

-- Users can insert their own entries
create policy "Users can insert own time entries"
  on time_entries for insert
  with check (user_id = auth.uid());

-- Users can update their own draft entries
create policy "Users can update own draft entries"
  on time_entries for update
  using (user_id = auth.uid() and status = 'draft');

-- Admins can update submitted entries in their firm (e.g., approve edit requests)
create policy "Admins can update firm submitted entries"
  on time_entries for update
  using (
    get_my_role() = 'admin'
    and status = 'submitted'
    and user_id in (
      select id from users where firm_id = get_my_firm_id()
    )
  );

-- ---- EDIT REQUESTS ----
-- Users can read edit requests for their own entries
create policy "Users can read own edit requests"
  on edit_requests for select
  using (requested_by = auth.uid());

-- Admins can read all edit requests for their firm
create policy "Admins can read firm edit requests"
  on edit_requests for select
  using (
    get_my_role() = 'admin'
    and time_entry_id in (
      select id from time_entries
      where user_id in (
        select id from users where firm_id = get_my_firm_id()
      )
    )
  );

-- Users can insert edit requests for their own submitted entries
create policy "Users can insert edit requests"
  on edit_requests for insert
  with check (
    requested_by = auth.uid()
    and time_entry_id in (
      select id from time_entries where user_id = auth.uid() and status = 'submitted'
    )
  );

-- Admins can update (approve/deny) edit requests for their firm
create policy "Admins can update edit requests"
  on edit_requests for update
  using (
    get_my_role() = 'admin'
    and time_entry_id in (
      select id from time_entries
      where user_id in (
        select id from users where firm_id = get_my_firm_id()
      )
    )
  );

-- ============================================================
-- INDEXES
-- ============================================================

create index idx_users_firm_id on users(firm_id);
create index idx_clients_firm_id on clients(firm_id);
create index idx_task_types_firm_id on task_types(firm_id);
create index idx_time_entries_user_id on time_entries(user_id);
create index idx_time_entries_client_id on time_entries(client_id);
create index idx_time_entries_status on time_entries(status);
create index idx_time_entries_started_at on time_entries(started_at);
create index idx_edit_requests_time_entry_id on edit_requests(time_entry_id);
create index idx_edit_requests_status on edit_requests(status);
