-- migration: 20260124100000_init_schema.sql
-- description: sets up the initial database schema including tables for tasks and time entries,
--              along with necessary types, views, functions, and row-level security policies.

--
-- types
--

-- create the task_status enum type to represent the status of a task.
create type public.task_status as enum ('active', 'completed');

--
-- tables
--

-- create the tasks table to store task information.
-- this table will hold the details of tasks created by users.
create table public.tasks (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    name varchar(255) not null,
    description varchar(5000),
    status public.task_status not null default 'active',
    created_at timestamptz not null default now()
);

-- add comments to the columns of the tasks table.
comment on table public.tasks is 'stores tasks for users.';
comment on column public.tasks.id is 'unique identifier for the task.';
comment on column public.tasks.user_id is 'foreign key to the user who owns the task.';
comment on column public.tasks.name is 'name of the task.';
comment on column public.tasks.description is 'detailed description of the task.';
comment on column public.tasks.status is 'current status of the task (active or completed).';
comment on column public.tasks.created_at is 'timestamp when the task was created.';

-- create the time_entries table to store time tracking information for tasks.
-- each entry represents a block of time spent on a specific task.
create table public.time_entries (
    id uuid primary key default gen_random_uuid(),
    task_id uuid not null references public.tasks(id) on delete cascade,
    user_id uuid not null references auth.users(id) on delete cascade,
    start_time timestamptz not null,
    end_time timestamptz,
    created_at timestamptz not null default now(),
    check (end_time is null or end_time > start_time)
);

-- add comments to the columns of the time_entries table.
comment on table public.time_entries is 'stores time entries for tasks.';
comment on column public.time_entries.id is 'unique identifier for the time entry.';
comment on column public.time_entries.task_id is 'foreign key to the associated task.';
comment on column public.time_entries.user_id is 'foreign key to the user who owns the time entry.';
comment on column public.time_entries.start_time is 'timestamp when the time entry started.';
comment on column public.time_entries.end_time is 'timestamp when the time entry ended (null if active).';
comment on column public.time_entries.created_at is 'timestamp when the time entry was created.';

--
-- indexes
--

-- create indexes to improve query performance.
create index on public.tasks (user_id, status);
create index on public.time_entries (task_id, start_time);
create index on public.time_entries (user_id);

-- create a unique index to ensure a user can only have one active (non-ended) time entry at a time.
create unique index time_entries_user_id_active_idx on public.time_entries (user_id) where (end_time is null);

--
-- views
--

-- create a view to show details of currently active tasks.
-- an active task is one that has a time entry with a null end_time.
create view public.active_task_details as
select
    t.id as task_id,
    t.name as task_name,
    t.description as task_description,
    te.id as time_entry_id,
    te.start_time
from
    public.tasks t
join
    public.time_entries te on t.id = te.task_id
where
    te.end_time is null;

comment on view public.active_task_details is 'provides a view of tasks that are currently being tracked (have an active time entry).';

--
-- functions
--

-- create a function to get a daily summary of time spent on tasks for a given user and date.
-- timezone_offset_minutes: offset from UTC in minutes (e.g., 60 for UTC+1, -300 for UTC-5)
create function public.get_daily_summary(
    p_user_id uuid, 
    p_date date,
    p_timezone_offset_minutes integer default 0
)
returns table (task_id uuid, task_name varchar(255), total_duration interval) as $$
begin
    return query
    select
        t.id,
        t.name,
        sum(coalesce(te.end_time, now()) - te.start_time) as duration
    from
        public.tasks t
    join
        public.time_entries te on t.id = te.task_id
    where
        te.user_id = p_user_id and
        (
            -- session started on the specified local date
            ((te.start_time at time zone 'UTC') + (p_timezone_offset_minutes || ' minutes')::interval)::date = p_date
            or
            -- session ended on the specified local date (for sessions spanning multiple days)
            ((coalesce(te.end_time, now()) at time zone 'UTC') + (p_timezone_offset_minutes || ' minutes')::interval)::date = p_date
        )
    group by
        t.id, t.name;
end;
$$ language plpgsql stable;

comment on function public.get_daily_summary(uuid, date, integer) is 'returns a summary of total time spent per task for a specific user and local day, considering timezone offset.';

--
-- row level security (rls)
--

-- enable row level security for the tables.
alter table public.tasks enable row level security;
alter table public.time_entries enable row level security;

--
-- rls policies for tasks table
--

-- policy: authenticated users can select their own tasks.
-- this policy allows users to view only the tasks they have created.
create policy "allow authenticated select on own tasks"
on public.tasks for select
to authenticated
using (auth.uid() = user_id);

-- policy: authenticated users can insert new tasks for themselves.
-- this policy ensures that a user can only create tasks under their own user_id.
create policy "allow authenticated insert on own tasks"
on public.tasks for insert
to authenticated
with check (auth.uid() = user_id);

-- policy: authenticated users can update their own tasks.
-- this policy allows users to modify only the tasks they own.
create policy "allow authenticated update on own tasks"
on public.tasks for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- policy: authenticated users can delete their own tasks.
-- this policy allows users to delete only the tasks they own.
create policy "allow authenticated delete on own tasks"
on public.tasks for delete
to authenticated
using (auth.uid() = user_id);

--
-- rls policies for time_entries table
--

-- policy: authenticated users can select their own time entries.
-- this policy allows users to view only their own time tracking entries.
create policy "allow authenticated select on own time_entries"
on public.time_entries for select
to authenticated
using (auth.uid() = user_id);

-- policy: authenticated users can insert new time entries for themselves.
-- this policy ensures that a user can only create time entries under their own user_id.
create policy "allow authenticated insert on own time_entries"
on public.time_entries for insert
to authenticated
with check (auth.uid() = user_id);

-- policy: authenticated users can update their own time entries.
-- this policy allows users to modify only their own time tracking entries.
create policy "allow authenticated update on own time_entries"
on public.time_entries for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- policy: authenticated users can delete their own time entries.
-- this policy allows users to delete only their own time tracking entries.
create policy "allow authenticated delete on own time_entries"
on public.time_entries for delete
to authenticated
using (auth.uid() = user_id);
