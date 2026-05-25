-- ============================================================================
-- 邀请码注册系统
-- - profiles：每个 auth.users 对应一条业务资料，含邀请码 + 邀请计数
-- - invitations：审计 + 防重复计数
-- - on_email_confirmed 触发器：邮箱验证完成后才把邀请人计数 +1
-- 每个邀请码最多成功邀请 100 个人，超出会被拒绝
-- ============================================================================

-- ---------------------------- 工具函数 --------------------------------------

-- 8 位 base32 邀请码，去掉易混字符 0/O/1/I/L
create or replace function public.gen_invite_code()
returns text
language plpgsql
as $$
declare
  alphabet text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  result text := '';
  i int;
begin
  for i in 1..8 loop
    result := result || substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1);
  end loop;
  return result;
end;
$$;

-- ---------------------------- profiles --------------------------------------

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  invite_code text not null unique,
  invited_by uuid references public.profiles(id) on delete set null,
  invited_count int not null default 0 check (invited_count >= 0 and invited_count <= 100),
  created_at timestamptz not null default now()
);

create index if not exists profiles_invite_code_idx on public.profiles (invite_code);
create index if not exists profiles_invited_by_idx on public.profiles (invited_by);

-- ---------------------------- invitations -----------------------------------

create table if not exists public.invitations (
  id uuid primary key default gen_random_uuid(),
  inviter_id uuid not null references public.profiles(id) on delete cascade,
  invitee_id uuid not null unique references public.profiles(id) on delete cascade,
  invite_code_used text not null,
  counted_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists invitations_inviter_idx on public.invitations (inviter_id);

-- ---------------------------- 邮箱验证触发器 --------------------------------

create or replace function public.on_email_confirmed()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  _inviter uuid;
begin
  -- 只在「从未验证 → 已验证」的瞬间触发
  if old.email_confirmed_at is null and new.email_confirmed_at is not null then
    update public.invitations
       set counted_at = now()
     where invitee_id = new.id and counted_at is null
     returning inviter_id into _inviter;

    if _inviter is not null then
      -- 二次兜底：触发器层面也卡 100 上限，防并发突破
      update public.profiles
         set invited_count = invited_count + 1
       where id = _inviter and invited_count < 100;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_on_email_confirmed on auth.users;
create trigger trg_on_email_confirmed
  after update of email_confirmed_at on auth.users
  for each row execute function public.on_email_confirmed();

-- ---------------------------- RLS -------------------------------------------

alter table public.profiles enable row level security;
alter table public.invitations enable row level security;

-- 用户只能读自己的 profile
drop policy if exists profiles_select_self on public.profiles;
create policy profiles_select_self on public.profiles
  for select using (auth.uid() = id);

-- profiles 的写入只走 service role（后端注册路由），前端没有 insert/update 权限
-- 不显式声明 policy = 默认拒绝

-- invitations 不开放给前端，仅 service role 可访问
-- 同样不声明 policy = 默认拒绝
