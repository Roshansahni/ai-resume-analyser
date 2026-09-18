begin;

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users (id) on delete cascade,
  full_name text,
  email text not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.resumes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  file_name text not null,
  file_url text not null,
  file_type text not null check (
    file_type in (
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    )
  ),
  file_size_bytes integer not null check (
    file_size_bytes > 0 and file_size_bytes <= 5242880
  ),
  raw_text text,
  parsed_data jsonb not null default '{}'::jsonb,
  processing_status text not null default 'uploaded' check (
    processing_status in ('uploaded', 'processing', 'completed', 'failed')
  ),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.analyses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  resume_id uuid not null references public.resumes (id) on delete cascade,
  ats_score smallint not null check (ats_score between 0 and 100),
  keyword_score smallint not null check (keyword_score between 0 and 100),
  skill_score smallint not null check (skill_score between 0 and 100),
  experience_score smallint not null check (experience_score between 0 and 100),
  education_score smallint not null check (education_score between 0 and 100),
  formatting_score smallint not null check (formatting_score between 0 and 100),
  project_score smallint not null check (project_score between 0 and 100),
  strengths jsonb not null default '[]'::jsonb,
  weaknesses jsonb not null default '[]'::jsonb,
  suggestions jsonb not null default '[]'::jsonb,
  analysis_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.job_descriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text,
  company text,
  description text not null,
  parsed_requirements jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.job_matches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  resume_id uuid not null references public.resumes (id) on delete cascade,
  job_description_id uuid not null references public.job_descriptions (id) on delete cascade,
  match_score smallint not null check (match_score between 0 and 100),
  matched_skills jsonb not null default '[]'::jsonb,
  missing_skills jsonb not null default '[]'::jsonb,
  partial_skills jsonb not null default '[]'::jsonb,
  recommendations jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.improvements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  resume_id uuid not null references public.resumes (id) on delete cascade,
  section text not null,
  original_text text not null,
  improved_text text not null,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists resumes_user_id_created_at_idx
  on public.resumes (user_id, created_at desc);

create index if not exists analyses_user_id_created_at_idx
  on public.analyses (user_id, created_at desc);

create index if not exists analyses_resume_id_idx
  on public.analyses (resume_id);

create index if not exists job_descriptions_user_id_created_at_idx
  on public.job_descriptions (user_id, created_at desc);

create index if not exists job_matches_user_id_created_at_idx
  on public.job_matches (user_id, created_at desc);

create index if not exists job_matches_resume_id_idx
  on public.job_matches (resume_id);

create index if not exists job_matches_job_description_id_idx
  on public.job_matches (job_description_id);

create index if not exists improvements_user_id_created_at_idx
  on public.improvements (user_id, created_at desc);

create index if not exists improvements_resume_id_idx
  on public.improvements (resume_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (user_id, full_name, email)
  values (
    new.id,
    nullif(new.raw_user_meta_data ->> 'full_name', ''),
    new.email
  )
  on conflict (user_id) do update
  set
    full_name = excluded.full_name,
    email = excluded.email,
    updated_at = timezone('utc', now());

  return new;
end;
$$;

revoke execute on function public.handle_new_user() from public;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute procedure public.handle_new_user();

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
  before update on public.profiles
  for each row
  execute procedure public.set_updated_at();

drop trigger if exists set_resumes_updated_at on public.resumes;
create trigger set_resumes_updated_at
  before update on public.resumes
  for each row
  execute procedure public.set_updated_at();

insert into public.profiles (user_id, full_name, email)
select
  id,
  nullif(raw_user_meta_data ->> 'full_name', ''),
  email
from auth.users
on conflict (user_id) do update
set
  full_name = excluded.full_name,
  email = excluded.email,
  updated_at = timezone('utc', now());

alter table public.profiles enable row level security;
alter table public.resumes enable row level security;
alter table public.analyses enable row level security;
alter table public.job_descriptions enable row level security;
alter table public.job_matches enable row level security;
alter table public.improvements enable row level security;

revoke all on table public.profiles from anon;
revoke all on table public.resumes from anon;
revoke all on table public.analyses from anon;
revoke all on table public.job_descriptions from anon;
revoke all on table public.job_matches from anon;
revoke all on table public.improvements from anon;

grant select, insert, update, delete on table public.profiles to authenticated;
grant select, insert, update, delete on table public.resumes to authenticated;
grant select, insert, update, delete on table public.analyses to authenticated;
grant select, insert, update, delete on table public.job_descriptions to authenticated;
grant select, insert, update, delete on table public.job_matches to authenticated;
grant select, insert, update, delete on table public.improvements to authenticated;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
  on public.profiles for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
  on public.profiles for insert to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "profiles_delete_own" on public.profiles;
create policy "profiles_delete_own"
  on public.profiles for delete to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "resumes_select_own" on public.resumes;
create policy "resumes_select_own"
  on public.resumes for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "resumes_insert_own" on public.resumes;
create policy "resumes_insert_own"
  on public.resumes for insert to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "resumes_update_own" on public.resumes;
create policy "resumes_update_own"
  on public.resumes for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "resumes_delete_own" on public.resumes;
create policy "resumes_delete_own"
  on public.resumes for delete to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "analyses_select_own" on public.analyses;
create policy "analyses_select_own"
  on public.analyses for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "analyses_insert_own" on public.analyses;
create policy "analyses_insert_own"
  on public.analyses for insert to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "analyses_update_own" on public.analyses;
create policy "analyses_update_own"
  on public.analyses for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "analyses_delete_own" on public.analyses;
create policy "analyses_delete_own"
  on public.analyses for delete to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "job_descriptions_select_own" on public.job_descriptions;
create policy "job_descriptions_select_own"
  on public.job_descriptions for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "job_descriptions_insert_own" on public.job_descriptions;
create policy "job_descriptions_insert_own"
  on public.job_descriptions for insert to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "job_descriptions_update_own" on public.job_descriptions;
create policy "job_descriptions_update_own"
  on public.job_descriptions for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "job_descriptions_delete_own" on public.job_descriptions;
create policy "job_descriptions_delete_own"
  on public.job_descriptions for delete to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "job_matches_select_own" on public.job_matches;
create policy "job_matches_select_own"
  on public.job_matches for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "job_matches_insert_own" on public.job_matches;
create policy "job_matches_insert_own"
  on public.job_matches for insert to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "job_matches_update_own" on public.job_matches;
create policy "job_matches_update_own"
  on public.job_matches for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "job_matches_delete_own" on public.job_matches;
create policy "job_matches_delete_own"
  on public.job_matches for delete to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "improvements_select_own" on public.improvements;
create policy "improvements_select_own"
  on public.improvements for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "improvements_insert_own" on public.improvements;
create policy "improvements_insert_own"
  on public.improvements for insert to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "improvements_update_own" on public.improvements;
create policy "improvements_update_own"
  on public.improvements for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "improvements_delete_own" on public.improvements;
create policy "improvements_delete_own"
  on public.improvements for delete to authenticated
  using ((select auth.uid()) = user_id);

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'resumes',
  'resumes',
  false,
  5242880,
  array[
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
)
on conflict (id) do update
set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

revoke all on table storage.objects from anon;
grant select, insert, update, delete on table storage.objects to authenticated;

drop policy if exists "resume_files_select_own" on storage.objects;
create policy "resume_files_select_own"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'resumes'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

drop policy if exists "resume_files_insert_own" on storage.objects;
create policy "resume_files_insert_own"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'resumes'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

drop policy if exists "resume_files_update_own" on storage.objects;
create policy "resume_files_update_own"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'resumes'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  )
  with check (
    bucket_id = 'resumes'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

drop policy if exists "resume_files_delete_own" on storage.objects;
create policy "resume_files_delete_own"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'resumes'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

commit;