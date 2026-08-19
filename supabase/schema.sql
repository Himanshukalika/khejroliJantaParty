-- ============================================================
-- Khejroli Janta Party — Supabase Database Schema
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- ── Elections ─────────────────────────────────────────────
create table if not exists elections (
  id              text primary key,
  name            text not null,
  type            text not null,
  date            date not null,
  constituency    text,
  state           text default 'राजस्थान',
  status          text not null default 'आगामी',
  voter_count     int  default 0,
  candidate_count int  default 0,
  created_at      timestamptz default now()
);

-- ── Parties ───────────────────────────────────────────────
create table if not exists parties (
  id           text primary key,
  name         text not null,
  abbreviation text,
  symbol       text,
  color        text,
  candidates   text[] default '{}',
  created_at   timestamptz default now()
);

-- ── News ──────────────────────────────────────────────────
create table if not exists news_items (
  id         text primary key,
  title      text not null,
  body       text,
  date       date,
  category   text default 'सामान्य',
  published  boolean default false,
  created_at timestamptz default now()
);

-- ── Voters ────────────────────────────────────────────────
create table if not exists voters (
  id             text primary key,   -- EPIC number (e.g. CFG2048858)
  name           text,
  family_head    text,
  booth          int,
  area           text,               -- Mohalla / क्षेत्र
  age            int,
  gender         text,
  ward           text,               -- ECI वार्ड number
  part           text,               -- ECI भाग number
  relation       text,               -- पति / पिता / माता
  house_no       text,               -- मकान संख्या
  mobile         text,               -- मोबाइल नंबर
  availability   text default 'उपलब्ध',  -- उपलब्ध / बाहर
  contact_status text default 'फिर संपर्क', -- संपर्क हुआ / फिर संपर्क / घर पर नहीं मिले / मीटिंग तय
  last_contact   date,               -- अंतिम संपर्क तिथि
  next_action    text,               -- अगला कार्य
  election_id    text references elections(id) on delete set null,
  created_at     timestamptz default now()
);

-- Migration: add CRM columns if table already exists
alter table voters add column if not exists mobile         text;
alter table voters add column if not exists availability   text default 'उपलब्ध';
alter table voters add column if not exists contact_status text default 'फिर संपर्क';
alter table voters add column if not exists last_contact   date;
alter table voters add column if not exists next_action    text;

create index if not exists voters_election_idx on voters(election_id);
create index if not exists voters_booth_idx    on voters(booth);
create index if not exists voters_area_idx     on voters(area);
create index if not exists voters_ward_idx     on voters(ward);

-- Ward-wise voter count view
create or replace view ward_voter_counts as
  select ward, count(*)::int as voter_count
  from voters
  where ward is not null and ward != ''
  group by ward;

-- ── Tasks ─────────────────────────────────────────────────
create table if not exists tasks (
  id          text primary key,
  title       text not null,
  description text,
  due_date    text,
  priority    text default 'सामान्य',
  done        boolean default false,
  created_at  timestamptz default now()
);

-- ── Team Members ──────────────────────────────────────────
create table if not exists team_members (
  id         text primary key,
  name       text not null,
  role       text,
  area       text,
  mobile     text,
  color      text default '#0f5e38',
  created_at timestamptz default now()
);

-- ── Row Level Security ─────────────────────────────────────
-- Allow all operations with anon key (add auth later)
alter table elections  enable row level security;
alter table parties    enable row level security;
alter table news_items enable row level security;
alter table voters     enable row level security;

drop policy if exists "allow_all_elections" on elections;
drop policy if exists "allow_all_parties"   on parties;
drop policy if exists "allow_all_news"      on news_items;
drop policy if exists "allow_all_voters"    on voters;

create policy "allow_all_elections"  on elections  for all using (true) with check (true);
create policy "allow_all_parties"    on parties    for all using (true) with check (true);
create policy "allow_all_news"       on news_items for all using (true) with check (true);
create policy "allow_all_voters"     on voters     for all using (true) with check (true);

alter table tasks enable row level security;
drop policy if exists "allow_all_tasks" on tasks;
create policy "allow_all_tasks" on tasks for all using (true) with check (true);

alter table team_members enable row level security;
drop policy if exists "allow_all_team_members" on team_members;
create policy "allow_all_team_members" on team_members for all using (true) with check (true);
