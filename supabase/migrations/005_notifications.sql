-- ─────────────────────────────────────────────────────────────────────────────
-- 005_notifications.sql
-- Persistent notifications: admin-to-user direct messages + smart auto alerts
-- ─────────────────────────────────────────────────────────────────────────────

-- Main notifications table
create table if not exists public.notifications (
  id           uuid        primary key default gen_random_uuid(),
  user_id      uuid        references auth.users(id) on delete cascade, -- null = global (all users)
  stock_symbol text,
  message      text        not null,
  type         text        not null check (type in ('admin', 'auto')),
  category     text        check (category in ('insider', 'bulk', 'fii', 'pump_dump', 'promoter_selling', 'weak_fundamentals')),
  is_read      boolean     not null default false,
  created_at   timestamptz not null default now()
);

-- Tracks which users have read global (user_id IS NULL) notifications
create table if not exists public.notification_reads (
  notification_id uuid        not null references public.notifications(id) on delete cascade,
  user_id         uuid        not null references auth.users(id) on delete cascade,
  read_at         timestamptz not null default now(),
  primary key (notification_id, user_id)
);

-- ── Indexes ────────────────────────────────────────────────────────────────
-- Fast fetch for a specific user's notifications
create index if not exists idx_notifications_user_created
  on public.notifications(user_id, created_at desc);

-- Fast fetch for global notifications (most recent first)
create index if not exists idx_notifications_global_created
  on public.notifications(created_at desc)
  where user_id is null;

-- Deduplication: same stock + category within recent window
create index if not exists idx_notifications_stock_cat_time
  on public.notifications(stock_symbol, category, created_at desc);

-- Fast lookup per user in reads table
create index if not exists idx_notif_reads_user
  on public.notification_reads(user_id, notification_id);

-- ── Row Level Security ─────────────────────────────────────────────────────
alter table public.notifications      enable row level security;
alter table public.notification_reads enable row level security;

-- Users can SELECT their own + global notifications
create policy "notif_select"
  on public.notifications for select
  using (user_id is null or auth.uid() = user_id);

-- Users can UPDATE (mark read) their own non-global notifications only
create policy "notif_update_own"
  on public.notifications for update
  using (auth.uid() = user_id);

-- Users can select their own reads
create policy "reads_select"
  on public.notification_reads for select
  using (auth.uid() = user_id);

-- Users can insert their own reads
create policy "reads_insert"
  on public.notification_reads for insert
  with check (auth.uid() = user_id);

-- ── Cleanup: auto-delete old global alerts (keeps table lean) ─────────────
-- Optional: run manually or via pg_cron if available
-- delete from public.notifications where user_id is null and created_at < now() - interval '7 days';
