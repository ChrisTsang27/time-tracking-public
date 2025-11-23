-- Create a table for user profiles to store RPG stats
create table profiles (
  id uuid references auth.users not null primary key,
  email text,
  xp integer default 0,
  level integer default 1,
  current_streak integer default 0,
  last_log_date date,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Set up Row Level Security (RLS)
alter table profiles enable row level security;

create policy "Users can view their own profile"
  on profiles for select
  using ( auth.uid() = id );

create policy "Users can update their own profile"
  on profiles for update
  using ( auth.uid() = id );

create policy "Users can insert their own profile"
  on profiles for insert
  with check ( auth.uid() = id );

-- Function to handle new user signup (optional, but good for auto-creation)
-- For now, we will handle profile creation in the app if it doesn't exist.
