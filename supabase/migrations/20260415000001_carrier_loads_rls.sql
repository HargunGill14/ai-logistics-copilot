-- Allow authenticated carriers to read loads with active-like statuses.
-- The policy joins profiles to check the user's role.
create policy "Carriers can read active loads"
  on loads
  for select
  to authenticated
  using (
    status in ('active', 'pricing', 'negotiating')
    and exists (
      select 1 from profiles
      where profiles.id = auth.uid()
        and profiles.role = 'carrier'
    )
  );

-- Allow carriers to read their own profile.
-- (May already exist — will no-op if the policy name collides.)
do $$
begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'profiles' and policyname = 'Users can read own profile'
  ) then
    execute $policy$
      create policy "Users can read own profile"
        on profiles
        for select
        to authenticated
        using (id = auth.uid())
    $policy$;
  end if;
end$$;

-- Allow carriers to read and insert their own capacity_posts.
do $$
begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'capacity_posts' and policyname = 'Carriers can read own capacity posts'
  ) then
    execute $policy$
      create policy "Carriers can read own capacity posts"
        on capacity_posts
        for select
        to authenticated
        using (created_by = auth.uid())
    $policy$;
  end if;

  if not exists (
    select 1 from pg_policies
    where tablename = 'capacity_posts' and policyname = 'Carriers can insert capacity posts'
  ) then
    execute $policy$
      create policy "Carriers can insert capacity posts"
        on capacity_posts
        for insert
        to authenticated
        with check (created_by = auth.uid())
    $policy$;
  end if;
end$$;
