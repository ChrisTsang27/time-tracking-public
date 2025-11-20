alter table public.time_logs enable row level security;

-- Create policies
create policy "Users can view their own logs"
on public.time_logs for select
using (auth.uid() = user_id);

create policy "Users can insert their own logs"
on public.time_logs for insert
with check (auth.uid() = user_id);

create policy "Users can update their own logs"
on public.time_logs for update
using (auth.uid() = user_id);

create policy "Users can delete their own logs"
on public.time_logs for delete
using (auth.uid() = user_id);
