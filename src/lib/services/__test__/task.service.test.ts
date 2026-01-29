import { describe, it, expect, vi, beforeEach } from "vitest";
import { createTask, updateTask, getTasks, taskExists } from "../task.service";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { CreateTaskCommand, UpdateTaskCommand, TaskResponseDto } from "../../../types";

// Mock Supabase client
const createMockSupabaseClient = () => {
  const mockSelect = vi.fn();
  const mockSingle = vi.fn();
  const mockInsert = vi.fn();
  const mockUpdate = vi.fn();
  const mockEq = vi.fn();
  const mockOrder = vi.fn();

  return {
    from: vi.fn(() => ({
      insert: mockInsert,
      update: mockUpdate,
      select: mockSelect,
      eq: mockEq,
      order: mockOrder,
    })),
    _mocks: {
      select: mockSelect,
      single: mockSingle,
      insert: mockInsert,
      update: mockUpdate,
      eq: mockEq,
      order: mockOrder,
    },
  } as unknown as SupabaseClient & { _mocks: ReturnType<typeof createMockSupabaseClient>["_mocks"] };
};

describe("task.service", () => {
  describe("createTask", () => {
    let mockSupabase: ReturnType<typeof createMockSupabaseClient>;

    beforeEach(() => {
      mockSupabase = createMockSupabaseClient();
    });

    it("should create a task successfully with all fields", async () => {
      // Arrange
      const command: CreateTaskCommand = {
        user_id: "user-123",
        name: "New Task",
        description: "Task description",
      };

      const expectedResponse: TaskResponseDto = {
        id: "task-456",
        name: "New Task",
        description: "Task description",
        status: "active",
        created_at: "2026-01-29T00:00:00Z",
      };

      mockSupabase._mocks.insert.mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: expectedResponse,
            error: null,
          }),
        }),
      });

      // Act
      const result = await createTask(mockSupabase, command);

      // Assert
      expect(result).toEqual(expectedResponse);
      expect(mockSupabase.from).toHaveBeenCalledWith("tasks");
      expect(mockSupabase._mocks.insert).toHaveBeenCalledWith({
        user_id: "user-123",
        name: "New Task",
        description: "Task description",
        status: "active",
      });
    });

    it("should create a task without optional description", async () => {
      // Arrange
      const command: CreateTaskCommand = {
        user_id: "user-123",
        name: "Task without description",
      };

      const expectedResponse: TaskResponseDto = {
        id: "task-789",
        name: "Task without description",
        description: null,
        status: "active",
        created_at: "2026-01-29T00:00:00Z",
      };

      mockSupabase._mocks.insert.mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: expectedResponse,
            error: null,
          }),
        }),
      });

      // Act
      const result = await createTask(mockSupabase, command);

      // Assert
      expect(result).toEqual(expectedResponse);
      expect(mockSupabase._mocks.insert).toHaveBeenCalledWith({
        user_id: "user-123",
        name: "Task without description",
        description: undefined,
        status: "active",
      });
    });

    it("should throw error when database insert fails", async () => {
      // Arrange
      const command: CreateTaskCommand = {
        user_id: "user-123",
        name: "Failing Task",
      };

      mockSupabase._mocks.insert.mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: null,
            error: { message: "Database connection error" },
          }),
        }),
      });

      // Act & Assert
      await expect(createTask(mockSupabase, command)).rejects.toThrow(
        "Failed to create task: Database connection error"
      );
    });

    it("should throw error when no data is returned", async () => {
      // Arrange
      const command: CreateTaskCommand = {
        user_id: "user-123",
        name: "Task",
      };

      mockSupabase._mocks.insert.mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: null,
            error: null,
          }),
        }),
      });

      // Act & Assert
      await expect(createTask(mockSupabase, command)).rejects.toThrow("No data returned from task creation");
    });
  });

  describe("updateTask", () => {
    let mockSupabase: ReturnType<typeof createMockSupabaseClient>;

    beforeEach(() => {
      mockSupabase = createMockSupabaseClient();
    });

    it("should update task with all fields", async () => {
      // Arrange
      const command: UpdateTaskCommand = {
        task_id: "task-123",
        user_id: "user-456",
        name: "Updated Task",
        description: "Updated description",
        status: "completed",
      };

      const expectedResponse: TaskResponseDto = {
        id: "task-123",
        name: "Updated Task",
        description: "Updated description",
        status: "completed",
        created_at: "2026-01-20T00:00:00Z",
      };

      mockSupabase._mocks.update.mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: expectedResponse,
                error: null,
              }),
            }),
          }),
        }),
      });

      // Act
      const result = await updateTask(mockSupabase, command);

      // Assert
      expect(result).toEqual(expectedResponse);
      expect(mockSupabase._mocks.update).toHaveBeenCalledWith({
        name: "Updated Task",
        description: "Updated description",
        status: "completed",
      });
    });

    it("should update only specified fields", async () => {
      // Arrange
      const command: UpdateTaskCommand = {
        task_id: "task-123",
        user_id: "user-456",
        name: "Only Name Updated",
      };

      const expectedResponse: TaskResponseDto = {
        id: "task-123",
        name: "Only Name Updated",
        description: "Original description",
        status: "active",
        created_at: "2026-01-20T00:00:00Z",
      };

      mockSupabase._mocks.update.mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: expectedResponse,
                error: null,
              }),
            }),
          }),
        }),
      });

      // Act
      const result = await updateTask(mockSupabase, command);

      // Assert
      expect(result).toEqual(expectedResponse);
      expect(mockSupabase._mocks.update).toHaveBeenCalledWith({
        name: "Only Name Updated",
      });
    });

    it("should throw error when task not found", async () => {
      // Arrange
      const command: UpdateTaskCommand = {
        task_id: "non-existent-task",
        user_id: "user-456",
        name: "Updated Task",
      };

      mockSupabase._mocks.update.mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: null,
                error: null,
              }),
            }),
          }),
        }),
      });

      // Act & Assert
      await expect(updateTask(mockSupabase, command)).rejects.toThrow("Task not found or user not authorized");
    });

    it("should throw error when user not authorized", async () => {
      // Arrange
      const command: UpdateTaskCommand = {
        task_id: "task-123",
        user_id: "wrong-user",
        name: "Unauthorized Update",
      };

      mockSupabase._mocks.update.mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: null,
                error: { message: "Row not found", code: "PGRST116" },
              }),
            }),
          }),
        }),
      });

      // Act & Assert
      await expect(updateTask(mockSupabase, command)).rejects.toThrow("Failed to update task");
    });

    it("should handle empty update object when no fields provided", async () => {
      // Arrange
      const command: UpdateTaskCommand = {
        task_id: "task-123",
        user_id: "user-456",
      };

      const expectedResponse: TaskResponseDto = {
        id: "task-123",
        name: "Unchanged Task",
        description: "Unchanged description",
        status: "active",
        created_at: "2026-01-20T00:00:00Z",
      };

      mockSupabase._mocks.update.mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: expectedResponse,
                error: null,
              }),
            }),
          }),
        }),
      });

      // Act
      const result = await updateTask(mockSupabase, command);

      // Assert
      expect(result).toEqual(expectedResponse);
      expect(mockSupabase._mocks.update).toHaveBeenCalledWith({});
    });
  });

  describe("getTasks", () => {
    let mockSupabase: ReturnType<typeof createMockSupabaseClient>;

    beforeEach(() => {
      mockSupabase = createMockSupabaseClient();
    });

    it("should fetch all tasks for a user with default sorting", async () => {
      // Arrange
      const userId = "user-123";
      const expectedTasks: TaskResponseDto[] = [
        {
          id: "task-1",
          name: "Task 1",
          description: "Description 1",
          status: "active",
          created_at: "2026-01-29T00:00:00Z",
        },
        {
          id: "task-2",
          name: "Task 2",
          description: null,
          status: "completed",
          created_at: "2026-01-28T00:00:00Z",
        },
      ];

      mockSupabase._mocks.select.mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: expectedTasks,
            error: null,
          }),
        }),
      });

      // Act
      const result = await getTasks(mockSupabase, userId);

      // Assert
      expect(result).toEqual(expectedTasks);
      expect(mockSupabase.from).toHaveBeenCalledWith("tasks");
      expect(mockSupabase._mocks.select).toHaveBeenCalledWith("id, name, description, status, created_at");
    });

    it("should apply status filter when provided", async () => {
      // Arrange
      const userId = "user-123";
      const filters = { status: "active" as const };
      const expectedTasks: TaskResponseDto[] = [
        {
          id: "task-1",
          name: "Active Task",
          description: "Description",
          status: "active",
          created_at: "2026-01-29T00:00:00Z",
        },
      ];

      const mockEqChain = vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({
          data: expectedTasks,
          error: null,
        }),
      });

      mockSupabase._mocks.select.mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: mockEqChain,
        }),
      });

      // Act
      const result = await getTasks(mockSupabase, userId, filters);

      // Assert
      expect(result).toEqual(expectedTasks);
      expect(mockEqChain).toHaveBeenCalled();
    });

    it("should apply custom sorting", async () => {
      // Arrange
      const userId = "user-123";
      const filters = { sortBy: "name" as const, order: "asc" as const };
      const expectedTasks: TaskResponseDto[] = [
        {
          id: "task-1",
          name: "A Task",
          description: null,
          status: "active",
          created_at: "2026-01-29T00:00:00Z",
        },
        {
          id: "task-2",
          name: "B Task",
          description: null,
          status: "active",
          created_at: "2026-01-28T00:00:00Z",
        },
      ];

      const mockOrder = vi.fn().mockResolvedValue({
        data: expectedTasks,
        error: null,
      });

      mockSupabase._mocks.select.mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: mockOrder,
        }),
      });

      // Act
      const result = await getTasks(mockSupabase, userId, filters);

      // Assert
      expect(result).toEqual(expectedTasks);
      expect(mockOrder).toHaveBeenCalledWith("name", { ascending: true });
    });

    it("should return empty array when no tasks found", async () => {
      // Arrange
      const userId = "user-with-no-tasks";

      mockSupabase._mocks.select.mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: [],
            error: null,
          }),
        }),
      });

      // Act
      const result = await getTasks(mockSupabase, userId);

      // Assert
      expect(result).toEqual([]);
    });

    it("should return empty array when data is null", async () => {
      // Arrange
      const userId = "user-123";

      mockSupabase._mocks.select.mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: null,
            error: null,
          }),
        }),
      });

      // Act
      const result = await getTasks(mockSupabase, userId);

      // Assert
      expect(result).toEqual([]);
    });

    it("should throw error when database query fails", async () => {
      // Arrange
      const userId = "user-123";

      mockSupabase._mocks.select.mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: null,
            error: { message: "Connection timeout" },
          }),
        }),
      });

      // Act & Assert
      await expect(getTasks(mockSupabase, userId)).rejects.toThrow("Failed to fetch tasks: Connection timeout");
    });
  });

  describe("taskExists", () => {
    let mockSupabase: ReturnType<typeof createMockSupabaseClient>;

    beforeEach(() => {
      mockSupabase = createMockSupabaseClient();
    });

    it("should return true when task exists and belongs to user", async () => {
      // Arrange
      const taskId = "task-123";
      const userId = "user-456";

      mockSupabase._mocks.select.mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { id: taskId },
              error: null,
            }),
          }),
        }),
      });

      // Act
      const result = await taskExists(mockSupabase, taskId, userId);

      // Assert
      expect(result).toBe(true);
      expect(mockSupabase.from).toHaveBeenCalledWith("tasks");
      expect(mockSupabase._mocks.select).toHaveBeenCalledWith("id");
    });

    it("should return false when task not found (PGRST116 error)", async () => {
      // Arrange
      const taskId = "non-existent-task";
      const userId = "user-456";

      mockSupabase._mocks.select.mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { code: "PGRST116", message: "No rows found" },
            }),
          }),
        }),
      });

      // Act
      const result = await taskExists(mockSupabase, taskId, userId);

      // Assert
      expect(result).toBe(false);
    });

    it("should return false when task belongs to different user", async () => {
      // Arrange
      const taskId = "task-123";
      const userId = "wrong-user";

      mockSupabase._mocks.select.mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { code: "PGRST116", message: "No rows found" },
            }),
          }),
        }),
      });

      // Act
      const result = await taskExists(mockSupabase, taskId, userId);

      // Assert
      expect(result).toBe(false);
    });

    it("should throw error for non-PGRST116 database errors", async () => {
      // Arrange
      const taskId = "task-123";
      const userId = "user-456";

      mockSupabase._mocks.select.mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { code: "23505", message: "Database constraint violation" },
            }),
          }),
        }),
      });

      // Act & Assert
      await expect(taskExists(mockSupabase, taskId, userId)).rejects.toThrow(
        "Failed to check task existence: Database constraint violation"
      );
    });

    it("should handle edge case with empty string IDs", async () => {
      // Arrange
      const taskId = "";
      const userId = "";

      mockSupabase._mocks.select.mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { code: "PGRST116", message: "No rows found" },
            }),
          }),
        }),
      });

      // Act
      const result = await taskExists(mockSupabase, taskId, userId);

      // Assert
      expect(result).toBe(false);
    });
  });
});
