-- Dock appointments table
create table if not exists dock_appointments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations(id),
  created_by uuid not null references auth.users(id),
  dock_number integer not null,
  truck_id text not null,
  carrier_name text not null,
  type text not null check (type in ('arrival', 'departure')),
  scheduled_time timestamptz not null,
  status text not null default 'scheduled' check (status in ('scheduled', 'checked_in', 'checked_out', 'missed')),
  load_id uuid references loads(id),
  created_at timestamptz not null default now()
);

alter table dock_appointments enable row level security;

-- Yard managers can read/write appointments in their organization
create policy "Yard managers can read appointments"
  on dock_appointments for select to authenticated
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
        and profiles.role = 'yard'
    )
  );

create policy "Yard managers can insert appointments"
  on dock_appointments for insert to authenticated
  with check (
    created_by = auth.uid()
    and exists (
      select 1 from profiles
      where profiles.id = auth.uid()
        and profiles.role = 'yard'
    )
  );

create policy "Yard managers can update appointments"
  on dock_appointments for update to authenticated
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
        and profiles.role = 'yard'
    )
  );

-- Truck check-ins table
create table if not exists truck_checkins (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations(id),
  appointment_id uuid references dock_appointments(id),
  truck_id text not null,
  carrier_name text not null,
  checked_in_at timestamptz not null default now(),
  checked_out_at timestamptz,
  dock_number integer not null,
  notes text,
  created_at timestamptz not null default now()
);

alter table truck_checkins enable row level security;

create policy "Yard managers can read checkins"
  on truck_checkins for select to authenticated
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
        and profiles.role = 'yard'
    )
  );

create policy "Yard managers can insert checkins"
  on truck_checkins for insert to authenticated
  with check (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
        and profiles.role = 'yard'
    )
  );

create policy "Yard managers can update checkins"
  on truck_checkins for update to authenticated
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
        and profiles.role = 'yard'
    )
  );

-- Index for fast date-range lookups on the dock schedule
create index if not exists idx_dock_appointments_scheduled_time
  on dock_appointments (scheduled_time);
