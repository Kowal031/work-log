import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { EditTaskModal } from "../EditTaskModal";
import type { TaskViewModel, TimeEntryResponseDto } from "@/types";

// Mock external dependencies
vi.mock("@/lib/api/tasks.api", () => ({
  getTimeEntries: vi.fn(),
  updateTimeEntry: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

// Mock child components
vi.mock("../TaskForm", () => ({
  TaskForm: ({ onSubmit, onCancel, initialData }: any) => (
    <div data-testid="task-form">
      <button data-testid="task-form-submit" onClick={() => onSubmit(initialData)}>
        Submit Task
      </button>
      <button data-testid="task-form-cancel" onClick={onCancel}>
        Cancel Task
      </button>
    </div>
  ),
}));

vi.mock("../SessionHistoryList", () => ({
  SessionHistoryList: ({ sessions, onEditSession, highlightedSessionId }: any) => (
    <div data-testid="session-history-list">
      {sessions.map((session: TimeEntryResponseDto) => (
        <div key={session.id} data-testid={`session-${session.id}`}>
          <button data-testid={`edit-session-${session.id}`} onClick={() => onEditSession(session)}>
            Edit Session {session.id}
          </button>
          {highlightedSessionId === session.id && <span data-testid="highlighted">Highlighted</span>}
        </div>
      ))}
    </div>
  ),
}));

vi.mock("@/components/shared/EditSessionModal", () => ({
  EditSessionModal: ({ isOpen, session, onClose, onSave }: any) => {
    const [error, setError] = React.useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = React.useState(false);

    const handleSave = async () => {
      if (!session) return;
      setIsSubmitting(true);
      setError(null);
      try {
        await onSave(session.id, { start_time: "2024-01-01T10:00:00Z", end_time: "2024-01-01T11:00:00Z" });
        onClose();
      } catch (err) {
        const message = err instanceof Error ? err.message : "Nie udało się zaktualizować sesji";
        setError(message);
      } finally {
        setIsSubmitting(false);
      }
    };

    return (
      <div data-testid="edit-session-modal" data-open={isOpen}>
        {isOpen && session && (
          <div>
            <span data-testid="modal-session-id">{session.id}</span>
            <button data-testid="save-session" onClick={handleSave} disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save Session"}
            </button>
            <button data-testid="close-session-modal" onClick={onClose}>
              Close Modal
            </button>
            {error && <div data-testid="session-error">{error}</div>}
          </div>
        )}
      </div>
    );
  },
}));

// Mock UI components
vi.mock("@/components/ui/dialog", () => ({
  Dialog: ({ open, onOpenChange, children }: any) =>
    open ? (
      <div data-testid="dialog" data-open={open}>
        <button data-testid="dialog-close" onClick={() => onOpenChange(false)}>
          Close Dialog
        </button>
        {children}
      </div>
    ) : null,
  DialogContent: ({ children }: any) => <div data-testid="dialog-content">{children}</div>,
  DialogDescription: ({ children }: any) => <div data-testid="dialog-description">{children}</div>,
  DialogHeader: ({ children }: any) => <div data-testid="dialog-header">{children}</div>,
  DialogTitle: ({ children }: any) => <div data-testid="dialog-title">{children}</div>,
}));

vi.mock("@/components/ui/separator", () => ({
  Separator: () => <hr data-testid="separator" />,
}));

import * as tasksApi from "@/lib/api/tasks.api";
import { toast } from "sonner";

const mockGetTimeEntries = vi.mocked(tasksApi.getTimeEntries);
const mockUpdateTimeEntry = vi.mocked(tasksApi.updateTimeEntry);
const mockToastError = vi.mocked(toast.error);
const mockToastSuccess = vi.mocked(toast.success);

// Mock sessionStorage
const mockSessionStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, "sessionStorage", {
  value: mockSessionStorage,
  writable: true,
});

describe("EditTaskModal", () => {
  const mockTask: TaskViewModel = {
    id: "task-1",
    name: "Test Task",
    description: "Test Description",
    status: "active",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
    isBeingEdited: false,
    total_time: "1h 30m",
  };

  const mockSessions: TimeEntryResponseDto[] = [
    {
      id: "session-1",
      task_id: "task-1",
      start_time: "2024-01-01T09:00:00Z",
      end_time: "2024-01-01T10:30:00Z",
      updated_at: "2024-01-01T10:30:00Z",
    },
    {
      id: "session-2",
      task_id: "task-1",
      start_time: "2024-01-01T11:00:00Z",
      end_time: null, // Active session
      updated_at: "2024-01-01T11:00:00Z",
    },
  ];

  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    onSave: vi.fn(),
    task: mockTask,
    hasActiveTimer: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockSessionStorage.getItem.mockReturnValue(null);
    mockGetTimeEntries.mockResolvedValue(mockSessions);
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  describe("Rendering", () => {
    it("should render modal when isOpen is true", () => {
      render(<EditTaskModal {...defaultProps} />);

      expect(screen.getByTestId("dialog")).toBeInTheDocument();
      expect(screen.getByTestId("dialog-title")).toHaveTextContent("Edytuj zadanie");
    });

    it("should not render modal when isOpen is false", () => {
      render(<EditTaskModal {...defaultProps} isOpen={false} />);

      expect(screen.queryByTestId("dialog")).not.toBeInTheDocument();
    });

    it("should render task form when hasActiveTimer is false", () => {
      render(<EditTaskModal {...defaultProps} />);

      expect(screen.getByTestId("task-form")).toBeInTheDocument();
    });

    it("should render blocked message when hasActiveTimer is true", () => {
      render(<EditTaskModal {...defaultProps} hasActiveTimer={true} />);

      expect(screen.getByText("Edycja szczegółów jest zablokowana podczas aktywnego timera")).toBeInTheDocument();
      expect(screen.queryByTestId("task-form")).not.toBeInTheDocument();
    });

    it("should render session history section", async () => {
      render(<EditTaskModal {...defaultProps} />);

      expect(screen.getByText("Historia sesji")).toBeInTheDocument();

      // Wait for sessions to load and loading state to disappear
      await waitFor(() => {
        expect(screen.getByTestId("session-history-list")).toBeInTheDocument();
      });
    });

    it("should show loading state while fetching sessions", async () => {
      mockGetTimeEntries.mockImplementation(() => new Promise(() => {})); // Never resolves

      render(<EditTaskModal {...defaultProps} />);

      expect(screen.getByText("Ładowanie...")).toBeInTheDocument();
    });
  });

  describe("Session fetching", () => {
    it("should fetch sessions when modal opens", async () => {
      render(<EditTaskModal {...defaultProps} />);

      await waitFor(() => {
        expect(mockGetTimeEntries).toHaveBeenCalledWith(mockTask.id);
      });

      expect(screen.getByTestId("session-session-1")).toBeInTheDocument();
      expect(screen.getByTestId("session-session-2")).toBeInTheDocument();
    });

    it("should refetch sessions when task.id changes", async () => {
      const { rerender } = render(<EditTaskModal {...defaultProps} />);

      await waitFor(() => {
        expect(mockGetTimeEntries).toHaveBeenCalledTimes(1);
      });

      const newTask = { ...mockTask, id: "task-2" };
      rerender(<EditTaskModal {...defaultProps} task={newTask} />);

      await waitFor(() => {
        expect(mockGetTimeEntries).toHaveBeenCalledTimes(2);
        expect(mockGetTimeEntries).toHaveBeenLastCalledWith("task-2");
      });
    });

    it("should show error toast when session fetching fails", async () => {
      const error = new Error("API Error");
      mockGetTimeEntries.mockRejectedValue(error);

      render(<EditTaskModal {...defaultProps} />);

      await waitFor(() => {
        expect(mockToastError).toHaveBeenCalledWith("Błąd", {
          description: "Nie udało się załadować historii sesji",
        });
      });
    });
  });

  describe("Highlighted session handling", () => {
    it("should set highlighted session from sessionStorage on open", async () => {
      mockSessionStorage.getItem.mockReturnValue("session-1");

      render(<EditTaskModal {...defaultProps} />);

      await waitFor(() => {
        expect(mockSessionStorage.getItem).toHaveBeenCalledWith("highlightSessionId");
        expect(mockSessionStorage.removeItem).toHaveBeenCalledWith("highlightSessionId");
      });

      expect(screen.getByTestId("highlighted")).toBeInTheDocument();
    });

    it("should auto-open edit modal for highlighted stopped session", async () => {
      mockSessionStorage.getItem.mockReturnValue("session-1");

      render(<EditTaskModal {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByTestId("edit-session-modal")).toHaveAttribute("data-open", "true");
        expect(screen.getByTestId("modal-session-id")).toHaveTextContent("session-1");
      });
    });

    it("should not auto-open edit modal for highlighted active session", async () => {
      mockSessionStorage.getItem.mockReturnValue("session-2"); // Active session (no end_time)

      render(<EditTaskModal {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByTestId("edit-session-modal")).toHaveAttribute("data-open", "false");
      });
    });

    it("should clear highlighted session after successful save", async () => {
      mockSessionStorage.getItem.mockReturnValue("session-1");
      mockUpdateTimeEntry.mockResolvedValue(mockSessions[0]);

      render(<EditTaskModal {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByTestId("edit-session-modal")).toHaveAttribute("data-open", "true");
      });

      await userEvent.click(screen.getByTestId("save-session"));

      await waitFor(() => {
        expect(mockUpdateTimeEntry).toHaveBeenCalledWith(mockTask.id, "session-1", {
          start_time: "2024-01-01T10:00:00Z",
          end_time: "2024-01-01T11:00:00Z",
        });
        expect(mockToastSuccess).toHaveBeenCalledWith("Sukces", {
          description: "Sesja została zaktualizowana",
        });
        expect(screen.getByTestId("edit-session-modal")).toHaveAttribute("data-open", "false");
      });
    });
  });

  describe("Session editing", () => {
    it("should open edit session modal when edit button is clicked", async () => {
      render(<EditTaskModal {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByTestId("session-session-1")).toBeInTheDocument();
      });

      await userEvent.click(screen.getByTestId("edit-session-session-1"));

      expect(screen.getByTestId("edit-session-modal")).toHaveAttribute("data-open", "true");
      expect(screen.getByTestId("modal-session-id")).toHaveTextContent("session-1");
    });

    it("should close edit session modal", async () => {
      render(<EditTaskModal {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByTestId("session-session-1")).toBeInTheDocument();
      });

      await userEvent.click(screen.getByTestId("edit-session-session-1"));
      expect(screen.getByTestId("edit-session-modal")).toHaveAttribute("data-open", "true");

      await userEvent.click(screen.getByTestId("close-session-modal"));
      expect(screen.getByTestId("edit-session-modal")).toHaveAttribute("data-open", "false");
    });

    it("should successfully save session changes", async () => {
      mockUpdateTimeEntry.mockResolvedValue({
        ...mockSessions[0],
        start_time: "2024-01-01T10:00:00Z",
        end_time: "2024-01-01T11:00:00Z",
      });

      render(<EditTaskModal {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByTestId("session-session-1")).toBeInTheDocument();
      });

      await userEvent.click(screen.getByTestId("edit-session-session-1"));
      await userEvent.click(screen.getByTestId("save-session"));

      await waitFor(() => {
        expect(mockUpdateTimeEntry).toHaveBeenCalledWith(mockTask.id, "session-1", {
          start_time: "2024-01-01T10:00:00Z",
          end_time: "2024-01-01T11:00:00Z",
        });
        expect(mockToastSuccess).toHaveBeenCalledWith("Sukces", {
          description: "Sesja została zaktualizowana",
        });
        expect(mockGetTimeEntries).toHaveBeenCalledTimes(2); // Initial + refresh
      });
    });

    it("should handle save session error", async () => {
      const error = new Error("Update failed");
      mockUpdateTimeEntry.mockRejectedValue(error);

      render(<EditTaskModal {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByTestId("session-session-1")).toBeInTheDocument();
      });

      await userEvent.click(screen.getByTestId("edit-session-session-1"));
      await userEvent.click(screen.getByTestId("save-session"));

      await waitFor(() => {
        expect(mockUpdateTimeEntry).toHaveBeenCalled();
        expect(screen.getByTestId("session-error")).toHaveTextContent("Update failed");
        // Modal should remain open after error
        expect(screen.getByTestId("edit-session-modal")).toHaveAttribute("data-open", "true");
      });
    });
  });

  describe("Task editing", () => {
    it("should call onSave when task form is submitted", async () => {
      render(<EditTaskModal {...defaultProps} />);

      await userEvent.click(screen.getByTestId("task-form-submit"));

      expect(defaultProps.onSave).toHaveBeenCalledWith({
        name: mockTask.name,
        description: mockTask.description,
      });
    });

    it("should call onClose when task form is cancelled", async () => {
      render(<EditTaskModal {...defaultProps} />);

      await userEvent.click(screen.getByTestId("task-form-cancel"));

      expect(defaultProps.onClose).toHaveBeenCalled();
    });

    it("should call onClose when dialog close button is clicked", async () => {
      render(<EditTaskModal {...defaultProps} />);

      await userEvent.click(screen.getByTestId("dialog-close"));

      expect(defaultProps.onClose).toHaveBeenCalled();
    });
  });

  describe("Business rules", () => {
    it("should show correct description when timer is active", () => {
      render(<EditTaskModal {...defaultProps} hasActiveTimer={true} />);

      expect(screen.getByTestId("dialog-description")).toHaveTextContent(
        "Zatrzymaj timer aby edytować szczegóły zadania"
      );
    });

    it("should show correct description when timer is not active", () => {
      render(<EditTaskModal {...defaultProps} hasActiveTimer={false} />);

      expect(screen.getByTestId("dialog-description")).toHaveTextContent(
        "Zaktualizuj informacje o zadaniu i zarządzaj historią sesji"
      );
    });

    it("should prevent task editing when timer is active", () => {
      render(<EditTaskModal {...defaultProps} hasActiveTimer={true} />);

      expect(screen.queryByTestId("task-form")).not.toBeInTheDocument();
      expect(screen.getByText("Edycja szczegółów jest zablokowana podczas aktywnego timera")).toBeInTheDocument();
    });
  });
});
