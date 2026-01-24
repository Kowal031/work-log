import type { SupabaseClient } from "@supabase/supabase-js";
import type { CreateTaskCommand, TaskResponseDto, UpdateTaskCommand } from "../../types";

/**
 * Create a new task for a user
 * @param supabase - Authenticated Supabase client
 * @param command - Task creation command with user_id, name, and optional description
 * @returns TaskResponseDto with the created task data (without user_id)
 * @throws Error if task creation fails
 */
export async function createTask(supabase: SupabaseClient, command: CreateTaskCommand): Promise<TaskResponseDto> {
  const { data, error } = await supabase
    .from("tasks")
    .insert({
      user_id: command.user_id,
      name: command.name,
      description: command.description,
      status: "active",
    })
    .select("id, name, description, status, created_at")
    .single();

  if (error) {
    throw new Error(`Failed to create task: ${error.message}`);
  }

  if (!data) {
    throw new Error("No data returned from task creation");
  }

  return data;
}

/**
 * Update an existing task
 * @param supabase - Authenticated Supabase client
 * @param command - Task update command with task_id, user_id, and optional fields to update
 * @returns TaskResponseDto with the updated task data (without user_id)
 * @throws Error if task update fails or task not found
 */
export async function updateTask(supabase: SupabaseClient, command: UpdateTaskCommand): Promise<TaskResponseDto> {
  // Build update object with only provided fields
  const updateData: Record<string, unknown> = {};
  if (command.name !== undefined) updateData.name = command.name;
  if (command.description !== undefined) updateData.description = command.description;
  if (command.status !== undefined) updateData.status = command.status;

  const { data, error } = await supabase
    .from("tasks")
    .update(updateData)
    .eq("id", command.task_id)
    .eq("user_id", command.user_id)
    .select("id, name, description, status, created_at")
    .single();

  if (error) {
    throw new Error(`Failed to update task: ${error.message}`);
  }

  if (!data) {
    throw new Error("Task not found or user not authorized");
  }

  return data;
}

/**
 * Get all tasks for a user
 * @param supabase - Authenticated Supabase client
 * @param userId - User ID to fetch tasks for
 * @returns Array of TaskResponseDto
 * @throws Error if fetching tasks fails
 */
export async function getTasks(supabase: SupabaseClient, userId: string): Promise<TaskResponseDto[]> {
  const { data, error } = await supabase
    .from("tasks")
    .select("id, name, description, status, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch tasks: ${error.message}`);
  }

  return data || [];
}


