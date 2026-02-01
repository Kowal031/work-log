import { describe, it, expect, vi, beforeEach } from "vitest";
import { getDailySummary } from "../summary.service";
import type { SupabaseClient } from "@supabase/supabase-js";

// Mock Supabase client
const createMockSupabaseClient = () => {
  const mockSelect = vi.fn();
  const mockEq = vi.fn();
  const mockGte = vi.fn();
  const mockLte = vi.fn();
  const mockNot = vi.fn();
  const mockOrder = vi.fn();
  const mockIn = vi.fn();
  const mockRpc = vi.fn();

  return {
    from: vi.fn(() => ({
      select: mockSelect,
    })),
    rpc: mockRpc,
    _mocks: {
      select: mockSelect,
      eq: mockEq,
      gte: mockGte,
      lte: mockLte,
      not: mockNot,
      order: mockOrder,
      in: mockIn,
      rpc: mockRpc,
    },
  } as unknown as SupabaseClient & { _mocks: ReturnType<typeof createMockSupabaseClient>["_mocks"] };
};

describe("summary.service", () => {
  describe("getDailySummary - single day", () => {
    let mockSupabase: ReturnType<typeof createMockSupabaseClient>;

    beforeEach(() => {
      mockSupabase = createMockSupabaseClient();
    });

    it("should fetch summary for a single day using PostgreSQL function", async () => {
      // Arrange
      const userId = "user-123";
      const dateFrom = "2026-01-29T00:00:00.000Z";
      const dateTo = "2026-01-29T23:59:59.999Z";
      const timezoneOffset = 60; // UTC+1

      const mockSummaryData = [
        {
          task_id: "task-1",
          task_name: "Task 1",
          total_duration: "02:30:00", // 2h 30m = 9000s
        },
        {
          task_id: "task-2",
          task_name: "Task 2",
          total_duration: "01:15:00", // 1h 15m = 4500s
        },
      ];

      const mockTasksData = [
        { id: "task-1", status: "active" },
        { id: "task-2", status: "completed" },
      ];

      // Mock RPC call
      mockSupabase._mocks.rpc.mockResolvedValue({
        data: mockSummaryData,
        error: null,
      });

      // Mock tasks status query
      mockSupabase._mocks.select.mockReturnValue({
        in: vi.fn().mockResolvedValue({
          data: mockTasksData,
          error: null,
        }),
        eq: vi.fn(() => ({
          gte: vi.fn(() => ({
            lt: vi.fn().mockResolvedValue({
              data: [], // Mock entries count data
              error: null,
            }),
          })),
        })),
      });

      // Act
      const result = await getDailySummary(mockSupabase, userId, dateFrom, dateTo, timezoneOffset);

      // Assert
      expect(mockSupabase.rpc).toHaveBeenCalledWith("get_daily_summary", {
        p_user_id: userId,
        p_date: "2026-01-29",
        p_timezone_offset_minutes: timezoneOffset,
      });

      expect(result.date_from).toBe(dateFrom);
      expect(result.date_to).toBe(dateTo);
      expect(result.total_duration_seconds).toBe(13500); // 9000 + 4500
      expect(result.total_duration_formatted).toBe("03:45:00");
      expect(result.tasks).toHaveLength(2);
      expect(result.tasks[0].task_id).toBe("task-1");
      expect(result.tasks[0].duration_seconds).toBe(9000);
      expect(result.tasks[0].task_status).toBe("active");
    });

    it("should parse PostgreSQL interval with days", async () => {
      // Arrange
      const userId = "user-123";
      const dateFrom = "2026-01-29T00:00:00.000Z";
      const dateTo = "2026-01-29T23:59:59.999Z";
      const timezoneOffset = 0;

      const mockSummaryData = [
        {
          task_id: "task-1",
          task_name: "Long Task",
          total_duration: "2 days 03:45:12", // 2*24*3600 + 3*3600 + 45*60 + 12 = 186312s
        },
      ];

      const mockTasksData = [{ id: "task-1", status: "active" }];

      mockSupabase._mocks.rpc.mockResolvedValue({
        data: mockSummaryData,
        error: null,
      });

      mockSupabase._mocks.select.mockReturnValue({
        in: vi.fn().mockResolvedValue({
          data: mockTasksData,
          error: null,
        }),
        eq: vi.fn(() => ({
          gte: vi.fn(() => ({
            lt: vi.fn().mockResolvedValue({
              data: [], // Mock entries count data
              error: null,
            }),
          })),
        })),
      });

      // Act
      const result = await getDailySummary(mockSupabase, userId, dateFrom, dateTo, timezoneOffset);

      // Assert
      expect(result.tasks[0].duration_seconds).toBe(186312);
      expect(result.tasks[0].duration_formatted).toMatchInlineSnapshot(`"51:45:12"`);
    });

    it("should return empty summary when no data for single day", async () => {
      // Arrange
      const userId = "user-no-data";
      const dateFrom = "2026-01-29T00:00:00.000Z";
      const dateTo = "2026-01-29T23:59:59.999Z";
      const timezoneOffset = 0;

      mockSupabase._mocks.rpc.mockResolvedValue({
        data: [],
        error: null,
      });

      // Act
      const result = await getDailySummary(mockSupabase, userId, dateFrom, dateTo, timezoneOffset);

      // Assert
      expect(result.date_from).toBe(dateFrom);
      expect(result.date_to).toBe(dateTo);
      expect(result.total_duration_seconds).toBe(0);
      expect(result.total_duration_formatted).toBe("00:00:00");
      expect(result.tasks).toEqual([]);
    });

    it("should return empty summary when RPC returns null", async () => {
      // Arrange
      const userId = "user-123";
      const dateFrom = "2026-01-29T00:00:00.000Z";
      const dateTo = "2026-01-29T23:59:59.999Z";
      const timezoneOffset = 0;

      mockSupabase._mocks.rpc.mockResolvedValue({
        data: null,
        error: null,
      });

      // Act
      const result = await getDailySummary(mockSupabase, userId, dateFrom, dateTo, timezoneOffset);

      // Assert
      expect(result.tasks).toEqual([]);
      expect(result.total_duration_seconds).toBe(0);
    });

    it("should throw error when RPC call fails", async () => {
      // Arrange
      const userId = "user-123";
      const dateFrom = "2026-01-29T00:00:00.000Z";
      const dateTo = "2026-01-29T23:59:59.999Z";
      const timezoneOffset = 0;

      mockSupabase._mocks.rpc.mockResolvedValue({
        data: null,
        error: { message: "Function execution failed" },
      });

      // Act & Assert
      await expect(getDailySummary(mockSupabase, userId, dateFrom, dateTo, timezoneOffset)).rejects.toThrow(
        "Failed to fetch summary: Function execution failed"
      );
    });

    it("should throw error when fetching task statuses fails", async () => {
      // Arrange
      const userId = "user-123";
      const dateFrom = "2026-01-29T00:00:00.000Z";
      const dateTo = "2026-01-29T23:59:59.999Z";
      const timezoneOffset = 0;

      const mockSummaryData = [
        {
          task_id: "task-1",
          task_name: "Task 1",
          total_duration: "01:00:00",
        },
      ];

      mockSupabase._mocks.rpc.mockResolvedValue({
        data: mockSummaryData,
        error: null,
      });

      mockSupabase._mocks.select.mockReturnValue({
        in: vi.fn().mockResolvedValue({
          data: null,
          error: { message: "Failed to fetch tasks" },
        }),
      });

      // Act & Assert
      await expect(getDailySummary(mockSupabase, userId, dateFrom, dateTo, timezoneOffset)).rejects.toThrow(
        "Failed to fetch task statuses: Failed to fetch tasks"
      );
    });

    it("should default to 'active' status when task status not found", async () => {
      // Arrange
      const userId = "user-123";
      const dateFrom = "2026-01-29T00:00:00.000Z";
      const dateTo = "2026-01-29T23:59:59.999Z";
      const timezoneOffset = 0;

      const mockSummaryData = [
        {
          task_id: "task-orphan",
          task_name: "Orphaned Task",
          total_duration: "00:30:00",
        },
      ];

      mockSupabase._mocks.rpc.mockResolvedValue({
        data: mockSummaryData,
        error: null,
      });

      mockSupabase._mocks.select.mockReturnValue({
        in: vi.fn().mockResolvedValue({
          data: [], // No matching tasks
          error: null,
        }),
        eq: vi.fn(() => ({
          gte: vi.fn(() => ({
            lt: vi.fn().mockResolvedValue({
              data: [], // Mock entries count data
              error: null,
            }),
          })),
        })),
      });

      // Act
      const result = await getDailySummary(mockSupabase, userId, dateFrom, dateTo, timezoneOffset);

      // Assert
      expect(result.tasks[0].task_status).toBe("active");
    });

    it("should sort tasks by duration descending", async () => {
      // Arrange
      const userId = "user-123";
      const dateFrom = "2026-01-29T00:00:00.000Z";
      const dateTo = "2026-01-29T23:59:59.999Z";
      const timezoneOffset = 0;

      const mockSummaryData = [
        {
          task_id: "task-1",
          task_name: "Short Task",
          total_duration: "00:15:00", // 900s
        },
        {
          task_id: "task-2",
          task_name: "Long Task",
          total_duration: "03:00:00", // 10800s
        },
        {
          task_id: "task-3",
          task_name: "Medium Task",
          total_duration: "01:30:00", // 5400s
        },
      ];

      const mockTasksData = [
        { id: "task-1", status: "active" },
        { id: "task-2", status: "active" },
        { id: "task-3", status: "active" },
      ];

      mockSupabase._mocks.rpc.mockResolvedValue({
        data: mockSummaryData,
        error: null,
      });

      mockSupabase._mocks.select.mockReturnValue({
        in: vi.fn().mockResolvedValue({
          data: mockTasksData,
          error: null,
        }),
        eq: vi.fn(() => ({
          gte: vi.fn(() => ({
            lt: vi.fn().mockResolvedValue({
              data: [], // Mock entries count data
              error: null,
            }),
          })),
        })),
      });

      // Act
      const result = await getDailySummary(mockSupabase, userId, dateFrom, dateTo, timezoneOffset);

      // Assert
      expect(result.tasks[0].task_name).toBe("Long Task");
      expect(result.tasks[0].duration_seconds).toBe(10800);
      expect(result.tasks[1].task_name).toBe("Medium Task");
      expect(result.tasks[1].duration_seconds).toBe(5400);
      expect(result.tasks[2].task_name).toBe("Short Task");
      expect(result.tasks[2].duration_seconds).toBe(900);
    });
  });

  describe("getDailySummary - multi-day range", () => {
    let mockSupabase: ReturnType<typeof createMockSupabaseClient>;

    beforeEach(() => {
      mockSupabase = createMockSupabaseClient();
    });

    it("should fetch summary for multi-day range using direct query", async () => {
      // Arrange
      const userId = "user-123";
      const dateFrom = "2026-01-28T00:00:00.000Z";
      const dateTo = "2026-01-30T23:59:59.999Z";
      const timezoneOffset = 0;

      const mockEntries = [
        {
          task_id: "task-1",
          start_time: "2026-01-28T09:00:00Z",
          end_time: "2026-01-28T11:00:00Z",
          tasks: {
            name: "Task 1",
            status: "active",
          },
        },
        {
          task_id: "task-1",
          start_time: "2026-01-29T10:00:00Z",
          end_time: "2026-01-29T12:00:00Z",
          tasks: {
            name: "Task 1",
            status: "active",
          },
        },
        {
          task_id: "task-2",
          start_time: "2026-01-29T14:00:00Z",
          end_time: "2026-01-29T15:30:00Z",
          tasks: {
            name: "Task 2",
            status: "completed",
          },
        },
      ];

      const mockOrderResult = {
        data: mockEntries,
        error: null,
      };

      mockSupabase._mocks.select.mockReturnValue({
        eq: vi.fn().mockReturnValue({
          gte: vi.fn().mockReturnValue({
            lte: vi.fn().mockReturnValue({
              not: vi.fn().mockReturnValue({
                order: vi.fn().mockResolvedValue(mockOrderResult),
              }),
            }),
          }),
        }),
      });

      // Act
      const result = await getDailySummary(mockSupabase, userId, dateFrom, dateTo, timezoneOffset);

      // Assert
      expect(mockSupabase.from).toHaveBeenCalledWith("time_entries");
      expect(result.date_from).toBe(dateFrom);
      expect(result.date_to).toBe(dateTo);
      expect(result.tasks).toHaveLength(2);

      // Task 1: 2h + 2h = 4h = 14400s
      const task1 = result.tasks.find((t) => t.task_id === "task-1");
      expect(task1?.duration_seconds).toBe(14400);
      expect(task1?.entries_count).toBe(2);

      // Task 2: 1.5h = 5400s
      const task2 = result.tasks.find((t) => t.task_id === "task-2");
      expect(task2?.duration_seconds).toBe(5400);
      expect(task2?.entries_count).toBe(1);

      // Total: 14400 + 5400 = 19800s
      expect(result.total_duration_seconds).toBe(19800);
    });

    it("should return empty summary when no entries for multi-day range", async () => {
      // Arrange
      const userId = "user-no-data";
      const dateFrom = "2026-01-28T00:00:00.000Z";
      const dateTo = "2026-01-30T23:59:59.999Z";
      const timezoneOffset = 0;

      mockSupabase._mocks.select.mockReturnValue({
        eq: vi.fn().mockReturnValue({
          gte: vi.fn().mockReturnValue({
            lte: vi.fn().mockReturnValue({
              not: vi.fn().mockReturnValue({
                order: vi.fn().mockResolvedValue({
                  data: [],
                  error: null,
                }),
              }),
            }),
          }),
        }),
      });

      // Act
      const result = await getDailySummary(mockSupabase, userId, dateFrom, dateTo, timezoneOffset);

      // Assert
      expect(result.tasks).toEqual([]);
      expect(result.total_duration_seconds).toBe(0);
      expect(result.total_duration_formatted).toBe("00:00:00");
    });

    it("should return empty summary when entries data is null", async () => {
      // Arrange
      const userId = "user-123";
      const dateFrom = "2026-01-28T00:00:00.000Z";
      const dateTo = "2026-01-30T23:59:59.999Z";
      const timezoneOffset = 0;

      mockSupabase._mocks.select.mockReturnValue({
        eq: vi.fn().mockReturnValue({
          gte: vi.fn().mockReturnValue({
            lte: vi.fn().mockReturnValue({
              not: vi.fn().mockReturnValue({
                order: vi.fn().mockResolvedValue({
                  data: null,
                  error: null,
                }),
              }),
            }),
          }),
        }),
      });

      // Act
      const result = await getDailySummary(mockSupabase, userId, dateFrom, dateTo, timezoneOffset);

      // Assert
      expect(result.tasks).toEqual([]);
      expect(result.total_duration_seconds).toBe(0);
    });

    it("should throw error when multi-day query fails", async () => {
      // Arrange
      const userId = "user-123";
      const dateFrom = "2026-01-28T00:00:00.000Z";
      const dateTo = "2026-01-30T23:59:59.999Z";
      const timezoneOffset = 0;

      mockSupabase._mocks.select.mockReturnValue({
        eq: vi.fn().mockReturnValue({
          gte: vi.fn().mockReturnValue({
            lte: vi.fn().mockReturnValue({
              not: vi.fn().mockReturnValue({
                order: vi.fn().mockResolvedValue({
                  data: null,
                  error: { message: "Database timeout" },
                }),
              }),
            }),
          }),
        }),
      });

      // Act & Assert
      await expect(getDailySummary(mockSupabase, userId, dateFrom, dateTo, timezoneOffset)).rejects.toThrow(
        "Failed to fetch summary: Database timeout"
      );
    });

    it("should filter out entries with null tasks", async () => {
      // Arrange
      const userId = "user-123";
      const dateFrom = "2026-01-28T00:00:00.000Z";
      const dateTo = "2026-01-30T23:59:59.999Z";
      const timezoneOffset = 0;

      const mockEntries = [
        {
          task_id: "task-1",
          start_time: "2026-01-28T09:00:00Z",
          end_time: "2026-01-28T11:00:00Z",
          tasks: {
            name: "Task 1",
            status: "active",
          },
        },
        {
          task_id: "task-deleted",
          start_time: "2026-01-29T10:00:00Z",
          end_time: "2026-01-29T12:00:00Z",
          tasks: null, // Deleted task
        },
      ];

      mockSupabase._mocks.select.mockReturnValue({
        eq: vi.fn().mockReturnValue({
          gte: vi.fn().mockReturnValue({
            lte: vi.fn().mockReturnValue({
              not: vi.fn().mockReturnValue({
                order: vi.fn().mockResolvedValue({
                  data: mockEntries,
                  error: null,
                }),
              }),
            }),
          }),
        }),
      });

      // Act
      const result = await getDailySummary(mockSupabase, userId, dateFrom, dateTo, timezoneOffset);

      // Assert
      expect(result.tasks).toHaveLength(1);
      expect(result.tasks[0].task_id).toBe("task-1");
    });

    it("should aggregate multiple entries for the same task", async () => {
      // Arrange
      const userId = "user-123";
      const dateFrom = "2026-01-28T00:00:00.000Z";
      const dateTo = "2026-01-30T23:59:59.999Z";
      const timezoneOffset = 0;

      const mockEntries = [
        {
          task_id: "task-1",
          start_time: "2026-01-28T09:00:00Z",
          end_time: "2026-01-28T10:00:00Z", // 1h
          tasks: { name: "Task 1", status: "active" },
        },
        {
          task_id: "task-1",
          start_time: "2026-01-28T14:00:00Z",
          end_time: "2026-01-28T15:30:00Z", // 1.5h
          tasks: { name: "Task 1", status: "active" },
        },
        {
          task_id: "task-1",
          start_time: "2026-01-29T10:00:00Z",
          end_time: "2026-01-29T11:00:00Z", // 1h
          tasks: { name: "Task 1", status: "active" },
        },
      ];

      mockSupabase._mocks.select.mockReturnValue({
        eq: vi.fn().mockReturnValue({
          gte: vi.fn().mockReturnValue({
            lte: vi.fn().mockReturnValue({
              not: vi.fn().mockReturnValue({
                order: vi.fn().mockResolvedValue({
                  data: mockEntries,
                  error: null,
                }),
              }),
            }),
          }),
        }),
      });

      // Act
      const result = await getDailySummary(mockSupabase, userId, dateFrom, dateTo, timezoneOffset);

      // Assert
      expect(result.tasks).toHaveLength(1);
      expect(result.tasks[0].task_id).toBe("task-1");
      expect(result.tasks[0].duration_seconds).toBe(12600); // 1h + 1.5h + 1h = 3.5h = 12600s
      expect(result.tasks[0].entries_count).toBe(3);
      expect(result.tasks[0].duration_formatted).toBe("03:30:00");
    });

    it("should calculate duration correctly with millisecond precision", async () => {
      // Arrange
      const userId = "user-123";
      const dateFrom = "2026-01-28T00:00:00.000Z";
      const dateTo = "2026-01-30T23:59:59.999Z";
      const timezoneOffset = 0;

      const mockEntries = [
        {
          task_id: "task-1",
          start_time: "2026-01-28T09:00:00.123Z",
          end_time: "2026-01-28T09:00:05.789Z", // 5.666s, floor to 5s
          tasks: { name: "Task 1", status: "active" },
        },
      ];

      mockSupabase._mocks.select.mockReturnValue({
        eq: vi.fn().mockReturnValue({
          gte: vi.fn().mockReturnValue({
            lte: vi.fn().mockReturnValue({
              not: vi.fn().mockReturnValue({
                order: vi.fn().mockResolvedValue({
                  data: mockEntries,
                  error: null,
                }),
              }),
            }),
          }),
        }),
      });

      // Act
      const result = await getDailySummary(mockSupabase, userId, dateFrom, dateTo, timezoneOffset);

      // Assert
      expect(result.tasks[0].duration_seconds).toBe(5); // Floored
    });
  });

  describe("edge cases", () => {
    let mockSupabase: ReturnType<typeof createMockSupabaseClient>;

    beforeEach(() => {
      mockSupabase = createMockSupabaseClient();
    });

    it("should handle zero duration entries", async () => {
      // Arrange
      const userId = "user-123";
      const dateFrom = "2026-01-28T00:00:00.000Z";
      const dateTo = "2026-01-30T23:59:59.999Z";
      const timezoneOffset = 0;

      const mockEntries = [
        {
          task_id: "task-1",
          start_time: "2026-01-28T09:00:00Z",
          end_time: "2026-01-28T09:00:00Z", // 0 seconds
          tasks: { name: "Task 1", status: "active" },
        },
      ];

      mockSupabase._mocks.select.mockReturnValue({
        eq: vi.fn().mockReturnValue({
          gte: vi.fn().mockReturnValue({
            lte: vi.fn().mockReturnValue({
              not: vi.fn().mockReturnValue({
                order: vi.fn().mockResolvedValue({
                  data: mockEntries,
                  error: null,
                }),
              }),
            }),
          }),
        }),
      });

      // Act
      const result = await getDailySummary(mockSupabase, userId, dateFrom, dateTo, timezoneOffset);

      // Assert
      expect(result.tasks[0].duration_seconds).toBe(0);
      expect(result.tasks[0].duration_formatted).toBe("00:00:00");
    });

    it("should handle interval format '00:00:00'", async () => {
      // Arrange
      const userId = "user-123";
      const dateFrom = "2026-01-29T00:00:00.000Z";
      const dateTo = "2026-01-29T23:59:59.999Z";
      const timezoneOffset = 0;

      const mockSummaryData = [
        {
          task_id: "task-1",
          task_name: "Zero Duration Task",
          total_duration: "00:00:00",
        },
      ];

      const mockTasksData = [{ id: "task-1", status: "active" }];

      mockSupabase._mocks.rpc.mockResolvedValue({
        data: mockSummaryData,
        error: null,
      });

      mockSupabase._mocks.select.mockReturnValue({
        in: vi.fn().mockResolvedValue({
          data: mockTasksData,
          error: null,
        }),
        eq: vi.fn(() => ({
          gte: vi.fn(() => ({
            lt: vi.fn().mockResolvedValue({
              data: [], // No entries for this test
              error: null,
            }),
          })),
        })),
      });

      // Act
      const result = await getDailySummary(mockSupabase, userId, dateFrom, dateTo, timezoneOffset);

      // Assert
      expect(result.tasks[0].duration_seconds).toBe(0);
    });

    it("should handle negative timezone offset", async () => {
      // Arrange
      const userId = "user-123";
      const dateFrom = "2026-01-29T00:00:00.000Z";
      const dateTo = "2026-01-29T23:59:59.999Z";
      const timezoneOffset = -300; // UTC-5

      const mockSummaryData = [
        {
          task_id: "task-1",
          task_name: "Task 1",
          total_duration: "01:00:00",
        },
      ];

      const mockTasksData = [{ id: "task-1", status: "active" }];

      mockSupabase._mocks.rpc.mockResolvedValue({
        data: mockSummaryData,
        error: null,
      });

      mockSupabase._mocks.select.mockReturnValue({
        in: vi.fn().mockResolvedValue({
          data: mockTasksData,
          error: null,
        }),
        eq: vi.fn(() => ({
          gte: vi.fn(() => ({
            lt: vi.fn().mockResolvedValue({
              data: [], // No entries for this test
              error: null,
            }),
          })),
        })),
      });

      // Act
      const result = await getDailySummary(mockSupabase, userId, dateFrom, dateTo, timezoneOffset);

      // Assert
      expect(mockSupabase.rpc).toHaveBeenCalledWith("get_daily_summary", {
        p_user_id: userId,
        p_date: "2026-01-29",
        p_timezone_offset_minutes: -300,
      });
      expect(result.tasks).toHaveLength(1);
    });
  });
});
