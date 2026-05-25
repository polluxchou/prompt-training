-- ============================================================================
-- 即时生成历史 —— 把 localStorage 里的 gen-state-v1 升级到 Supabase
-- ============================================================================

create table if not exists public.generations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,

  -- 原始输入
  prompt              text not null default '',
  calibrated_prompt   text         default '',

  -- 生成结果
  title               text not null default '(未命名)',
  content             text not null default '',
  english_title       text         default '',
  english_content     text         default '',

  -- 元数据
  model               text         default null,
  token_usage         jsonb        default null,
  calibration_usage   jsonb        default null,
  task_type           jsonb        not null default '{}'::jsonb,
  industry_keywords   jsonb        not null default '[]'::jsonb,
  score               jsonb        default null,

  -- 状态时间戳
  used_at             timestamptz  default null,
  created_at          timestamptz  not null default now(),
  updated_at          timestamptz  not null default now()
);

create index if not exists generations_user_created_idx
  on public.generations (user_id, created_at desc);

create index if not exists generations_user_updated_idx
  on public.generations (user_id, updated_at desc);

-- updated_at 触发器
create or replace function public.touch_generations_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_generations_touch_updated on public.generations;
create trigger trg_generations_touch_updated
  before update on public.generations
  for each row execute function public.touch_generations_updated_at();

-- ============================================================================
-- RLS：每个用户只能读写自己的 generations
-- ============================================================================

alter table public.generations enable row level security;

drop policy if exists generations_select_own on public.generations;
create policy generations_select_own on public.generations
  for select using (auth.uid() = user_id);

drop policy if exists generations_insert_own on public.generations;
create policy generations_insert_own on public.generations
  for insert with check (auth.uid() = user_id);

drop policy if exists generations_update_own on public.generations;
create policy generations_update_own on public.generations
  for update using (auth.uid() = user_id)
              with check (auth.uid() = user_id);

drop policy if exists generations_delete_own on public.generations;
create policy generations_delete_own on public.generations
  for delete using (auth.uid() = user_id);
