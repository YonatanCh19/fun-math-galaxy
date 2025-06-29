
-- Create profiles table to store public user data
create table public.profiles (
  id uuid not null primary key references auth.users on delete cascade,
  name text
);

-- Set up Row Level Security (RLS)
alter table public.profiles enable row level security;

-- Policy: Allow users to view their own profile
create policy "Users can view their own profile."
  on public.profiles for select
  using ( auth.uid() = id );

-- Policy: Allow users to update their own profile
create policy "Users can update their own profile."
  on public.profiles for update
  using ( auth.uid() = id );

-- Function to create a new profile for a new user
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, name)
  values (new.id, new.raw_user_meta_data->>'name');
  return new;
end;
$$;

-- Trigger to call the function when a new user signs up
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Create user_progress table
create table public.user_progress (
    id uuid not null primary key default gen_random_uuid(),
    user_id uuid not null references auth.users on delete cascade,
    correct integer not null default 0,
    total integer not null default 0,
    trophies integer not null default 0,
    coins integer not null default 0,
    created_at timestamp with time zone not null default now(),
    updated_at timestamp with time zone not null default now(),
    unique(user_id) -- Each user has one progress row
);

-- Set up RLS for user_progress
alter table public.user_progress enable row level security;

-- Policy: Allow users to view their own progress
create policy "Users can view their own progress."
    on public.user_progress for select
    using (auth.uid() = user_id);

-- Policy: Allow users to insert their own progress
create policy "Users can insert their own progress."
    on public.user_progress for insert
    with check (auth.uid() = user_id);

-- Policy: Allow users to update their own progress
create policy "Users can update their own progress."
    on public.user_progress for update
    using (auth.uid() = user_id);

-- Create leads table
create table public.leads (
  id uuid not null primary key default gen_random_uuid(),
  name text,
  email text,
  phone text,
  message text not null,
  created_at timestamp with time zone not null default now()
);

-- Set up RLS for leads
alter table public.leads enable row level security;

-- Policy: Allow anyone to insert a new lead
create policy "Allow public insert for leads"
  on public.leads for insert
  with check (true);
