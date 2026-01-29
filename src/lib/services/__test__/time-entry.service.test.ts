import { describe, it, expect, vi, beforeEach } from "vitest";
import { startTimeEntry, stopTimeEntry, hasActiveTimer, getActiveTimer } from "../time-entry.service";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { StartTimeEntryCommand, StopTimeEntryCommand } from "../../../types";

// Mock Supabase client
const createMockSupabaseClient = () => {
  const mockSelect = vi.fn();
  const mockInsert = vi.fn();
  const mockUpdate = vi.fn();
  const mockEq = vi.fn();
  const mockGte = vi.fn();
  const mockLte = vi.fn();
  const mockIs = vi.fn();
  const mockNot = vi.fn();
  const mockOrder = vi.fn();
  const mockIn = vi.fn();
  const mockSingle = vi.fn();

  return {
    from: vi.fn(() => ({
      select: mockSelect,
      insert: mockInsert,
      update: mockUpdate,
    })),
    _mocks: {
      select: mockSelect,
      insert: mockInsert,
      update: mockUpdate,
      eq: mockEq,
      gte: mockGte,
      lte: mockLte,
      is: mockIs,
      not: mockNot,
      order: mockOrder,
      in: mockIn,
      single: mockSingle,
    },
  } as unknown as SupabaseClient & { _mocks: ReturnType<typeof createMockSupabaseClient>["_mocks"] };
};

describe("time-entry.service", () => {
  describe("hasActiveTimer", () => {
    let mockSupabase: ReturnType<typeof createMockSupabaseClient>;

    beforeEach(() => {
      mockSupabase = createMockSupabaseClient();
    });

    it("should return true when task has active timer", async () => {
      const taskId = "task-123";

      mockSupabase._mocks.select.mockReturnValue({
        eq: vi.fn().mockReturnValue({
          is: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { id: "entry-1" },
              error: null,
            }),
          }),
        }),
      });

      const result = await hasActiveTimer(mockSupabase, taskId);

      expect(result).toBe(true);
      expect(mockSupabase.from).toHaveBeenCalledWith("time_entries");
    });

    it("should return false when task has no active timer", async () => {
      const taskId = "task-123";

      mockSupabase._mocks.select.mockReturnValue({
        eq: vi.fn().mockReturnValue({
          is: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { code: "PGRST116" },
            }),
          }),
        }),
      });

      const result = await hasActiveTimer(mockSupabase, taskId);

      expect(result).toBe(false);
    });

    it("should throw error when query fails", async () => {
      const taskId = "task-123";

      mockSupabase._mocks.select.mockReturnValue({
        eq: vi.fn().mockReturnValue({
          is: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { code: "OTHER_ERROR", message: "Query failed" },
            }),
          }),
        }),
      });

      await expect(hasActiveTimer(mockSupabase, taskId)).rejects.toThrow("Failed to check active timer: Query failed");
    });
  });

  describe("getActiveTimer", () => {
    let mockSupabase: ReturnType<typeof createMockSupabaseClient>;

    beforeEach(() => {
      mockSupabase = createMockSupabaseClient();
    });

    it("should return active timer when user has one", async () => {
      const userId = "user-123";
      const mockTimer = { id: "entry-1", task_id: "task-1", start_time: "2026-01-29T10:00:00Z" };

      mockSupabase._mocks.select.mockReturnValue({
        eq: vi.fn().mockReturnValue({
          is: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockTimer,
              error: null,
            }),
          }),
        }),
      });

      const result = await getActiveTimer(mockSupabase, userId);

      expect(result).toEqual(mockTimer);
    });

    it("should return null when user has no active timer", async () => {
      const userId = "user-123";

      mockSupabase._mocks.select.mockReturnValue({
        eq: vi.fn().mockReturnValue({
          is: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { code: "PGRST116" },
            }),
          }),
        }),
      });

      const result = await getActiveTimer(mockSupabase, userId);

      expect(result).toBe(null);
    });

    it("should throw error when query fails", async () => {
      const userId = "user-123";

      mockSupabase._mocks.select.mockReturnValue({
        eq: vi.fn().mockReturnValue({
          is: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { code: "OTHER_ERROR", message: "Query failed" },
            }),
          }),
        }),
      });

      await expect(getActiveTimer(mockSupabase, userId)).rejects.toThrow("Failed to get active timer: Query failed");
    });
  });

  describe("startTimeEntry", () => {
    let mockSupabase: ReturnType<typeof createMockSupabaseClient>;

    beforeEach(() => {
      mockSupabase = createMockSupabaseClient();
    });

    it("should successfully start a new time entry", async () => {
      const command: StartTimeEntryCommand = {
        user_id: "user-123",
        task_id: "task-1",
        start_time: "2026-01-29T10:00:00Z",
      };

      const mockResponse = {
        id: "entry-1",
        task_id: "task-1",
        start_time: "2026-01-29T10:00:00Z",
        end_time: null,
      };

      mockSupabase._mocks.insert.mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: mockResponse,
            error: null,
          }),
        }),
      });

      const result = await startTimeEntry(mockSupabase, command);

      expect(result).toEqual(mockResponse);
      expect(mockSupabase.from).toHaveBeenCalledWith("time_entries");
    });

    it("should throw error when insertion fails", async () => {
      const command: StartTimeEntryCommand = {
        user_id: "user-123",
        task_id: "task-1",
        start_time: "2026-01-29T10:00:00Z",
      };

      mockSupabase._mocks.insert.mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: null,
            error: { message: "Insertion failed" },
          }),
        }),
      });

      await expect(startTimeEntry(mockSupabase, command)).rejects.toThrow(
        "Failed to start time entry: Insertion failed"
      );
    });

    it("should throw error when no data returned", async () => {
      const command: StartTimeEntryCommand = {
        user_id: "user-123",
        task_id: "task-1",
        start_time: "2026-01-29T10:00:00Z",
      };

      mockSupabase._mocks.insert.mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: null,
            error: null,
          }),
        }),
      });

      await expect(startTimeEntry(mockSupabase, command)).rejects.toThrow("No data returned from time entry creation");
    });
  });

  describe("stopTimeEntry", () => {
    let mockSupabase: ReturnType<typeof createMockSupabaseClient>;

    beforeEach(() => {
      mockSupabase = createMockSupabaseClient();
    });

    it("should successfully stop an active time entry", async () => {
      const command: StopTimeEntryCommand = {
        user_id: "user-123",
        time_entry_id: "entry-1",
        end_time: "2026-01-29T12:00:00Z",
        timezone_offset: 60,
      };

      const mockCurrentEntry = { start_time: "2026-01-29T10:00:00Z" };
      const mockUpdatedEntry = {
        id: "entry-1",
        task_id: "task-1",
        start_time: "2026-01-29T10:00:00Z",
        end_time: "2026-01-29T12:00:00Z",
      };

      // Mock fetch current entry
      mockSupabase._mocks.select.mockReturnValueOnce({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            is: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: mockCurrentEntry,
                error: null,
              }),
            }),
          }),
        }),
      });

      // Mock update
      mockSupabase._mocks.update.mockImplementation(() => ({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            is: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: mockUpdatedEntry,
                  error: null,
                }),
              }),
            }),
          }),
        }),
      }));

      // Mock validateDailyTimeCapacity query (no existing entries)
      mockSupabase._mocks.select.mockReturnValueOnce({
        eq: vi.fn().mockReturnValue({
          not: vi.fn().mockReturnValue({
            neq: vi.fn().mockReturnValue({
              lte: vi.fn().mockReturnValue({
                gte: vi.fn().mockResolvedValue({
                  data: [],
                  error: null,
                }),
              }),
            }),
          }),
        }),
      });

      const result = await stopTimeEntry(mockSupabase, command);

      expect(result).toEqual(mockUpdatedEntry);
    });

    it("should throw TIME_ENTRY_NOT_FOUND when entry does not exist", async () => {
      const command: StopTimeEntryCommand = {
        user_id: "user-123",
        time_entry_id: "entry-1",
        end_time: "2026-01-29T12:00:00Z",
        timezone_offset: 60,
      };

      // Mock fetch fails with PGRST116, and check also fails
      mockSupabase._mocks.select.mockReturnValueOnce({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            is: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: null,
                error: { code: "PGRST116" },
              }),
            }),
          }),
        }),
      });

      mockSupabase._mocks.select.mockReturnValueOnce({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { code: "PGRST116" },
            }),
          }),
        }),
      });

      await expect(stopTimeEntry(mockSupabase, command)).rejects.toThrow("TIME_ENTRY_NOT_FOUND");
    });

    it("should throw TIME_ENTRY_ALREADY_STOPPED when entry is already stopped", async () => {
      const command: StopTimeEntryCommand = {
        user_id: "user-123",
        time_entry_id: "entry-1",
        end_time: "2026-01-29T12:00:00Z",
        timezone_offset: 60,
      };

      // Mock fetch fails with PGRST116, but check shows entry exists and is stopped
      mockSupabase._mocks.select.mockReturnValueOnce({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            is: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: null,
                error: { code: "PGRST116" },
              }),
            }),
          }),
        }),
      });

      mockSupabase._mocks.select.mockReturnValueOnce({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { id: "entry-1", end_time: "2026-01-29T11:00:00Z" },
              error: null,
            }),
          }),
        }),
      });

      await expect(stopTimeEntry(mockSupabase, command)).rejects.toThrow("TIME_ENTRY_ALREADY_STOPPED");
    });

    it("should throw error when update fails", async () => {
      const command: StopTimeEntryCommand = {
        user_id: "user-123",
        time_entry_id: "entry-1",
        end_time: "2026-01-29T12:00:00Z",
        timezone_offset: 60,
      };

      const mockCurrentEntry = { start_time: "2026-01-29T10:00:00Z" };

      // Mock fetch current entry
      mockSupabase._mocks.select.mockReturnValueOnce({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            is: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: mockCurrentEntry,
                error: null,
              }),
            }),
          }),
        }),
      });

      // Mock update fails
      mockSupabase._mocks.update.mockImplementation(() => ({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            is: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: null,
                  error: { message: "Update failed" },
                }),
              }),
            }),
          }),
        }),
      }));

      // Mock validateDailyTimeCapacity query
      mockSupabase._mocks.select.mockReturnValueOnce({
        eq: vi.fn().mockReturnValue({
          not: vi.fn().mockReturnValue({
            neq: vi.fn().mockReturnValue({
              lte: vi.fn().mockReturnValue({
                gte: vi.fn().mockResolvedValue({
                  data: [],
                  error: null,
                }),
              }),
            }),
          }),
        }),
      });

      await expect(stopTimeEntry(mockSupabase, command)).rejects.toThrow("Failed to stop time entry: Update failed");
    });
  });
});
