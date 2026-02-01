-- Migration: Enable Row Level Security policies for tasks and time_entries tables
-- Created: 2026-02-01 06:11:22 UTC
-- Purpose: Add comprehensive RLS policies for all CRUD operations on user-specific data
-- Affected tables: tasks, time_entries
-- Security consideration: All policies restrict access to records owned by the authenticated user

-- Enable RLS on tasks table
alter table public.tasks enable row level security;

-- Enable RLS on time_entries table
alter table public.time_entries enable row level security;

-- =============================================================================
-- TASKS TABLE POLICIES
-- =============================================================================

-- SELECT policies for tasks table
-- Allow authenticated users to read their own tasks
create policy "tasks_select_authenticated" on public.tasks
for select using (auth.uid() = user_id);

-- Allow anonymous users to read their own tasks (for potential future use)
create policy "tasks_select_anon" on public.tasks
for select using (auth.uid() = user_id);

-- INSERT policies for tasks table
-- Allow authenticated users to create their own tasks
create policy "tasks_insert_authenticated" on public.tasks
for insert with check (auth.uid() = user_id);

-- Allow anonymous users to create their own tasks (for potential future use)
create policy "tasks_insert_anon" on public.tasks
for insert with check (auth.uid() = user_id);

-- UPDATE policies for tasks table
-- Allow authenticated users to update their own tasks
create policy "tasks_update_authenticated" on public.tasks
for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Allow anonymous users to update their own tasks (for potential future use)
create policy "tasks_update_anon" on public.tasks
for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- DELETE policies for tasks table
-- Allow authenticated users to delete their own tasks
create policy "tasks_delete_authenticated" on public.tasks
for delete using (auth.uid() = user_id);

-- Allow anonymous users to delete their own tasks (for potential future use)
create policy "tasks_delete_anon" on public.tasks
for delete using (auth.uid() = user_id);

-- =============================================================================
-- TIME_ENTRIES TABLE POLICIES
-- =============================================================================

-- SELECT policies for time_entries table
-- Allow authenticated users to read their own time entries
create policy "time_entries_select_authenticated" on public.time_entries
for select using (auth.uid() = user_id);

-- Allow anonymous users to read their own time entries (for potential future use)
create policy "time_entries_select_anon" on public.time_entries
for select using (auth.uid() = user_id);

-- INSERT policies for time_entries table
-- Allow authenticated users to create their own time entries
create policy "time_entries_insert_authenticated" on public.time_entries
for insert with check (auth.uid() = user_id);

-- Allow anonymous users to create their own time entries (for potential future use)
create policy "time_entries_insert_anon" on public.time_entries
for insert with check (auth.uid() = user_id);

-- UPDATE policies for time_entries table
-- Allow authenticated users to update their own time entries
create policy "time_entries_update_authenticated" on public.time_entries
for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Allow anonymous users to update their own time entries (for potential future use)
create policy "time_entries_update_anon" on public.time_entries
for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- DELETE policies for time_entries table
-- Allow authenticated users to delete their own time entries
create policy "time_entries_delete_authenticated" on public.time_entries
for delete using (auth.uid() = user_id);

-- Allow anonymous users to delete their own time entries (for potential future use)
create policy "time_entries_delete_anon" on public.time_entries
for delete using (auth.uid() = user_id);