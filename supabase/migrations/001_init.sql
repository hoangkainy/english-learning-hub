-- English Learning Hub - initial schema
create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  current_level text not null default 'A2',
  target_level text not null default 'C1',
  daily_minutes integer not null default 60 check (daily_minutes between 15 and 240),
  created_at timestamptz not null default now()
);

create table if not exists public.learning_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  start_date date not null,
  current_week integer not null default 1 check (current_week between 1 and 52),
  status text not null default 'active' check (status in ('active','completed','archived')),
  created_at timestamptz not null default now()
);
create index if not exists learning_plans_user_idx on public.learning_plans(user_id, status);

create table if not exists public.learning_days (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  plan_id uuid not null references public.learning_plans(id) on delete cascade,
  week_number integer not null check (week_number between 1 and 52),
  day_number integer not null check (day_number between 1 and 7),
  date date not null,
  topic text not null,
  objective text not null,
  difficulty text not null,
  status text not null default 'scheduled' check (status in ('scheduled','in_progress','completed','skipped')),
  created_at timestamptz not null default now(),
  unique(plan_id, week_number, day_number),
  unique(plan_id, date)
);
create index if not exists learning_days_plan_date_idx on public.learning_days(plan_id, date);

create table if not exists public.content_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  learning_day_id uuid not null references public.learning_days(id) on delete cascade,
  title text not null,
  source text,
  source_url text,
  duration_seconds integer check (duration_seconds is null or duration_seconds >= 0),
  transcript text,
  content_type text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
create index if not exists content_items_day_idx on public.content_items(learning_day_id, is_active);

create table if not exists public.listening_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  learning_day_id uuid not null references public.learning_days(id) on delete cascade,
  attempt_type text not null check (attempt_type in ('first','transcript','final','checkpoint')),
  comprehension_score integer not null check (comprehension_score between 0 and 100),
  subtitle_used boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists listening_attempts_day_idx on public.listening_attempts(learning_day_id, created_at);

create table if not exists public.chunks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  learning_day_id uuid references public.learning_days(id) on delete set null,
  phrase text not null,
  meaning text,
  source_sentence text,
  personal_sentence text,
  status text not null default 'new' check (status in ('new','learning','mature')),
  exported_to_anki boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists chunks_user_status_idx on public.chunks(user_id, status);

create table if not exists public.speaking_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  learning_day_id uuid not null references public.learning_days(id) on delete cascade,
  duration_seconds integer not null default 0 check (duration_seconds >= 0),
  retell_duration_seconds integer not null default 0 check (retell_duration_seconds >= 0),
  self_score integer check (self_score between 1 and 5),
  no_sub_score integer check (no_sub_score between 1 and 5),
  notes text,
  created_at timestamptz not null default now()
);
create index if not exists speaking_sessions_day_idx on public.speaking_sessions(learning_day_id, created_at);

create table if not exists public.daily_completion (
  learning_day_id uuid primary key references public.learning_days(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  anki_done boolean not null default false,
  first_listen_done boolean not null default false,
  transcript_done boolean not null default false,
  final_listen_done boolean not null default false,
  chunks_done boolean not null default false,
  speaking_done boolean not null default false,
  completed boolean not null default false,
  updated_at timestamptz not null default now()
);

create table if not exists public.weekly_checkpoints (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  plan_id uuid not null references public.learning_plans(id) on delete cascade,
  week_number integer not null check (week_number between 1 and 52),
  first_listen_score integer check (first_listen_score between 0 and 100),
  retell_seconds integer check (retell_seconds >= 0),
  active_chunks_used integer not null default 0 check (active_chunks_used >= 0),
  recommendation text not null default 'hold' check (recommendation in ('hold','difficulty_up','repeat_week')),
  created_at timestamptz not null default now(),
  unique(plan_id, week_number)
);

create table if not exists public.anki_exports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  item_count integer not null check (item_count >= 0),
  format text not null default 'tsv',
  created_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1)))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

revoke all on function public.handle_new_user() from public;
revoke all on function public.handle_new_user() from anon;
revoke all on function public.handle_new_user() from authenticated;

create or replace function public.bootstrap_learning_plan()
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  plan_uuid uuid;
  today_local date := (now() at time zone 'Asia/Ho_Chi_Minh')::date;
  monday date := date_trunc('week', (now() at time zone 'Asia/Ho_Chi_Minh'))::date;
  g integer;
  wk integer;
  dn integer;
  topic_value text;
  objective_value text;
  difficulty_value text;
begin
  if uid is null then
    raise exception 'Authentication required';
  end if;

  select id into plan_uuid
  from public.learning_plans
  where user_id = uid and status = 'active'
  order by created_at desc
  limit 1;

  if plan_uuid is not null then
    return plan_uuid;
  end if;

  insert into public.learning_plans(user_id, name, start_date, current_week, status)
  values(uid, 'Native Input · 4 Week Foundation', monday, 1, 'active')
  returning id into plan_uuid;

  for g in 0..27 loop
    wk := floor(g / 7)::integer + 1;
    dn := mod(g, 7) + 1;

    topic_value := case dn
      when 1 then 'Technology / Product Review'
      when 2 then 'Travel / Exploration'
      when 3 then 'Science Explainer'
      when 4 then 'Story / Documentary'
      when 5 then 'Tech + Work Communication'
      when 6 then 'Movie / Series Scene'
      else 'Weekly Checkpoint'
    end;

    objective_value := case dn
      when 1 then 'Notice opinion phrases, comparisons, and product-spec language.'
      when 2 then 'Understand place descriptions, reactions, directions, and travel chunks.'
      when 3 then 'Track cause/effect language and explanations in clear native speech.'
      when 4 then 'Follow sequencing, narrative transitions, and story retelling.'
      when 5 then 'Transfer this week''s chunks into software and workplace communication.'
      when 6 then 'Train conversational rhythm, reduced speech, and shadowing.'
      else 'Test unseen listening, retelling, and active chunk recall without coaching.'
    end;

    difficulty_value := case wk
      when 1 then 'Clear native speech · 3–5 min · strong visual context'
      when 2 then '5–7 min · slightly faster · fewer transcript checks'
      when 3 then '7–10 min · less visual support · longer retelling'
      else '10–15 min · spontaneous speaking · A2→B1 readiness'
    end;

    insert into public.learning_days(
      user_id, plan_id, week_number, day_number, date, topic, objective, difficulty, status
    ) values(
      uid, plan_uuid, wk, dn, monday + g, topic_value, objective_value, difficulty_value,
      case when monday + g = today_local then 'in_progress' else 'scheduled' end
    );
  end loop;

  insert into public.daily_completion(learning_day_id, user_id)
  select id, uid from public.learning_days where plan_id = plan_uuid
  on conflict (learning_day_id) do nothing;

  return plan_uuid;
end;
$$;

grant execute on function public.bootstrap_learning_plan() to authenticated;

grant select, insert, update, delete on public.profiles to authenticated;
grant select, insert, update, delete on public.learning_plans to authenticated;
grant select, insert, update, delete on public.learning_days to authenticated;
grant select, insert, update, delete on public.content_items to authenticated;
grant select, insert, update, delete on public.listening_attempts to authenticated;
grant select, insert, update, delete on public.chunks to authenticated;
grant select, insert, update, delete on public.speaking_sessions to authenticated;
grant select, insert, update, delete on public.daily_completion to authenticated;
grant select, insert, update, delete on public.weekly_checkpoints to authenticated;
grant select, insert, update, delete on public.anki_exports to authenticated;

alter table public.profiles enable row level security;
alter table public.learning_plans enable row level security;
alter table public.learning_days enable row level security;
alter table public.content_items enable row level security;
alter table public.listening_attempts enable row level security;
alter table public.chunks enable row level security;
alter table public.speaking_sessions enable row level security;
alter table public.daily_completion enable row level security;
alter table public.weekly_checkpoints enable row level security;
alter table public.anki_exports enable row level security;

do $$
declare
  t text;
begin
  foreach t in array array[
    'learning_plans','learning_days','content_items','listening_attempts','chunks',
    'speaking_sessions','daily_completion','weekly_checkpoints','anki_exports'
  ] loop
    execute format('drop policy if exists %I on public.%I', t || '_owner_all', t);
    execute format(
      'create policy %I on public.%I for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()))',
      t || '_owner_all', t
    );
  end loop;
end $$;

drop policy if exists profiles_owner_all on public.profiles;
create policy profiles_owner_all on public.profiles
for all to authenticated
using (id = (select auth.uid()))
with check (id = (select auth.uid()));
