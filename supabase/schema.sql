-- QUIZ CLASH starter schema. Run in Supabase SQL Editor.
-- Prototype policies are permissive for easy testing; client-written scores are NOT cheat-proof.
create extension if not exists pgcrypto;
create table if not exists public.quiz_rooms (
 id uuid primary key default gen_random_uuid(),
 code text not null unique check (code ~ '^[A-Z0-9]{6}$'),
 host_id text not null,
 category text not null default 'Mixed' check(category in ('Mixed','Science','Gaming','General')),
 status text not null default 'waiting' check(status in ('waiting','playing','finished')),
 current_round integer not null default 0 check(current_round between 0 and 8),
 created_at timestamptz not null default now()
);
create table if not exists public.quiz_players (
 room_id uuid not null references public.quiz_rooms(id) on delete cascade,
 player_id text not null,
 display_name text not null check(char_length(display_name) between 1 and 18),
 score integer not null default 0 check(score >= 0),
 joined_at timestamptz not null default now(),
 primary key(room_id,player_id)
);
alter table public.quiz_rooms add column if not exists game_state jsonb not null default '{}'::jsonb;
alter table public.quiz_rooms enable row level security;
alter table public.quiz_players enable row level security;
grant select, insert, update on public.quiz_rooms to anon, authenticated;
grant select, insert, update on public.quiz_players to anon, authenticated;
drop policy if exists "rooms readable by clients" on public.quiz_rooms;
create policy "rooms readable by clients" on public.quiz_rooms for select to anon, authenticated using(true);
drop policy if exists "anyone can create a room" on public.quiz_rooms;
create policy "anyone can create a room" on public.quiz_rooms for insert to anon, authenticated with check(true);
drop policy if exists "clients can update room state" on public.quiz_rooms;
create policy "clients can update room state" on public.quiz_rooms for update to anon, authenticated using(true) with check(true);
drop policy if exists "players readable by clients" on public.quiz_players;
create policy "players readable by clients" on public.quiz_players for select to anon, authenticated using(true);
drop policy if exists "clients can join a room" on public.quiz_players;
create policy "clients can join a room" on public.quiz_players for insert to anon, authenticated with check(exists(select 1 from public.quiz_rooms r where r.id=room_id and r.status='waiting'));
drop policy if exists "clients can update player scores" on public.quiz_players;
create policy "clients can update player scores" on public.quiz_players for update to anon, authenticated using(true) with check(true);
do $$ begin alter publication supabase_realtime add table public.quiz_rooms; exception when duplicate_object then null; when undefined_object then null; end $$;
do $$ begin alter publication supabase_realtime add table public.quiz_players; exception when duplicate_object then null; when undefined_object then null; end $$;
create index if not exists quiz_rooms_code_status_idx on public.quiz_rooms(code,status);
create index if not exists quiz_players_room_score_idx on public.quiz_players(room_id,score desc);
