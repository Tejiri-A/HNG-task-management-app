import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import DashboardPage from "@/app/dashboard/page";
import { KEYS } from "@/lib/constants";
import type { Habit } from "@/types/habit";

// ─── Mock next/navigation
const mockPush = vi.fn();
const mockReplace = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, replace: mockReplace }),
}));

// ─── Constants
const TEST_USER_ID = "test-user-id";
const MOCK_TODAY = new Date().toISOString().split("T")[0];

// ─── Mock useAuth — fixed test session
const MOCK_SESSION = { userId: TEST_USER_ID, email: "test@example.com" };

vi.mock("@/lib/auth", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/auth")>();
  return {
    ...actual,
    useAuth: () => ({
      session: MOCK_SESSION,
      isLoading: false,
      logout: vi.fn(),
      setSession: vi.fn(),
    }),
  };
});

// ─── Mock ProtectedRoute — render children directly
vi.mock("@/components/shared/ProtectedRoute", () => ({
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// ─── localStorage mock 
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(globalThis, "localStorage", {
  value: localStorageMock,
  writable: true,
});



// ─── Helper — seed a habit into localStorage
function seedHabit(overrides: Partial<Habit> = {}): Habit {
  const habit: Habit = {
    id: crypto.randomUUID(),
    userId: TEST_USER_ID,
    name: "Drink Water",
    description: "8 glasses a day",
    frequency: "daily",
    createdAt: new Date().toISOString(),
    completions: [],
    ...overrides,
  };
  const existing: Habit[] = JSON.parse(
    localStorage.getItem(KEYS.HABITS) ?? "[]",
  );
  localStorage.setItem(KEYS.HABITS, JSON.stringify([...existing, habit]));
  return habit;
}

// ─── Tests
describe("habit form", () => {
  beforeEach(() => {
    localStorage.clear();
    mockPush.mockReset();
    mockReplace.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("shows a validation error when habit name is empty", async () => {
    const user = userEvent.setup();
    render(<DashboardPage />);

    // Open the form
    await user.click(screen.getByTestId("create-habit-button"));

    // Submit without filling in name
    await user.click(screen.getByTestId("habit-save-button"));

    await waitFor(() => {
      // Spec-mandated message from validateHabitName
      expect(screen.getByText("Habit name is required")).toBeInTheDocument();
    });

    // No habit was created
    const stored: Habit[] = JSON.parse(
      localStorage.getItem(KEYS.HABITS) ?? "[]",
    );
    expect(stored).toHaveLength(0);
  });

  it("creates a new habit and renders it in the list", async () => {
    const user = userEvent.setup();
    render(<DashboardPage />);

    await user.click(screen.getByTestId("create-habit-button"));

    await user.type(screen.getByTestId("habit-name-input"), "Read Books");
    await user.type(
      screen.getByTestId("habit-description-input"),
      "30 minutes daily",
    );
    await user.click(screen.getByTestId("habit-save-button"));

    await waitFor(() => {
      // Slug-based test id — "Read Books" → "read-books"
      expect(screen.getByTestId("habit-card-read-books")).toBeInTheDocument();
    });

    // Persisted with correct shape
    const stored: Habit[] = JSON.parse(
      localStorage.getItem(KEYS.HABITS) ?? "[]",
    );
    expect(stored).toHaveLength(1);
    expect(stored[0].name).toBe("Read Books");
    expect(stored[0].userId).toBe(TEST_USER_ID);
    expect(stored[0].frequency).toBe("daily");
    expect(stored[0].completions).toEqual([]);
  });

  it("edits an existing habit and preserves immutable fields", async () => {
    const original = seedHabit({
      name: "Drink Water",
      completions: ["2025-04-27"],
    });

    const user = userEvent.setup();
    render(<DashboardPage />);

    // Open edit form
    await user.click(screen.getByTestId("habit-edit-drink-water"));

    // Update the name
    const nameInput = screen.getByTestId("habit-name-input");
    await user.clear(nameInput);
    await user.type(nameInput, "Drink More Water");

    await user.click(screen.getByTestId("habit-save-button"));

    await waitFor(() => {
      expect(
        screen.getByTestId("habit-card-drink-more-water"),
      ).toBeInTheDocument();
      expect(
        screen.queryByTestId("habit-card-drink-water"),
      ).not.toBeInTheDocument();
    });

    // Immutable fields must be unchanged
    const stored: Habit[] = JSON.parse(
      localStorage.getItem(KEYS.HABITS) ?? "[]",
    );
    expect(stored[0].id).toBe(original.id);
    expect(stored[0].userId).toBe(original.userId);
    expect(stored[0].createdAt).toBe(original.createdAt);
    expect(stored[0].completions).toEqual(original.completions);
  });

  it("deletes a habit only after explicit confirmation", async () => {
    seedHabit({ name: "Drink Water" });

    const user = userEvent.setup();
    render(<DashboardPage />);

    // Habit is visible
    expect(screen.getByTestId("habit-card-drink-water")).toBeInTheDocument();

    // Click delete — must not delete yet
    await user.click(screen.getByTestId("habit-delete-drink-water"));

    // Confirmation dialog appears, habit still in DOM
    expect(screen.getByTestId("confirm-delete-button")).toBeInTheDocument();
    expect(screen.getByTestId("habit-card-drink-water")).toBeInTheDocument();

    // Confirm deletion
    await user.click(screen.getByTestId("confirm-delete-button"));

    await waitFor(() => {
      expect(
        screen.queryByTestId("habit-card-drink-water"),
      ).not.toBeInTheDocument();
    });

    // Empty state now visible
    expect(screen.getByTestId("empty-state")).toBeInTheDocument();

    // Removed from localStorage
    const stored: Habit[] = JSON.parse(
      localStorage.getItem(KEYS.HABITS) ?? "[]",
    );
    expect(stored).toHaveLength(0);
  });

  it("toggles completion and updates the streak display", async () => {
    seedHabit({ name: "Drink Water", completions: [] });

    const user = userEvent.setup();
    render(<DashboardPage />);

    // Streak starts at 0
    expect(screen.getByTestId("habit-streak-drink-water")).toHaveTextContent(
      "0",
    );

    // Toggle complete for today
    await user.click(screen.getByTestId("habit-complete-drink-water"));

    await waitFor(() => {
      expect(screen.getByTestId("habit-streak-drink-water")).toHaveTextContent(
        "1",
      );
    });

    // Today's date in completions
    const stored: Habit[] = JSON.parse(
      localStorage.getItem(KEYS.HABITS) ?? "[]",
    );
    expect(stored[0].completions).toContain(MOCK_TODAY);

    // Toggle off — streak returns to 0
    await user.click(screen.getByTestId("habit-complete-drink-water"));

    await waitFor(() => {
      expect(screen.getByTestId("habit-streak-drink-water")).toHaveTextContent(
        "0",
      );
    });

    const storedAfter: Habit[] = JSON.parse(
      localStorage.getItem(KEYS.HABITS) ?? "[]",
    );
    expect(storedAfter[0].completions).not.toContain(MOCK_TODAY);
  });
});
