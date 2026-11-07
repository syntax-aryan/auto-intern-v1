-- Apply before deploying real paid generation. No application data is deleted.
-- Stripe's existing service-role webhook retains its write permissions.
do $$
begin
  if to_regclass('public.subscriptions') is not null then
    -- An older migration allowed users to insert their own subscription rows.
    -- Browser clients must not be able to grant themselves a paid plan.
    revoke all on public.subscriptions from anon;
    revoke insert, update, delete, truncate, references, trigger
      on public.subscriptions from authenticated;
    grant select on public.subscriptions to authenticated;
    alter table public.subscriptions enable row level security;
    if not exists (
      select 1 from pg_policies where schemaname = 'public'
        and tablename = 'subscriptions' and policyname = 'Subscription owners can read billing'
    ) then
      create policy "Subscription owners can read billing"
        on public.subscriptions for select to authenticated
        using ((select auth.uid())::text = user_id::text);
    end if;
  end if;

  -- Protect legacy stored resumes. The new endpoint does not write copies here.
  if to_regclass('public.resume_enhancements') is not null then
    alter table public.resume_enhancements enable row level security;
    if not exists (
      select 1 from pg_policies where schemaname = 'public'
        and tablename = 'resume_enhancements' and policyname = 'Resume owners can read their history'
    ) then
      create policy "Resume owners can read their history"
        on public.resume_enhancements for select to authenticated
        using ((select auth.uid()) = user_id);
    end if;
  end if;
end;
$$;
