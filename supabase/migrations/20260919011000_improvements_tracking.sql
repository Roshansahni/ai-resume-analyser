begin;

alter table public.improvements
  add column if not exists analysis_id uuid
    references public.analyses(id)
    on delete cascade;

alter table public.improvements
  add column if not exists status text not null default 'pending'
    check (status in ('pending', 'completed'));

alter table public.improvements
  add column if not exists completed_at timestamptz;

create index if not exists improvements_user_status_idx
  on public.improvements (user_id, status, created_at desc);

create index if not exists improvements_analysis_id_idx
  on public.improvements (analysis_id);

commit;