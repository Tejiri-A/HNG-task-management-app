import { describe, it, expect } from "vitest";
import { toggleHabitCompletion } from "../../src/lib/habits";
import { Habit } from "../../src/types/habit";

describe("toggleHabitCompletion", () => {
  // Mock habit for testing
  const mockHabit: Habit = {
    id: "habit-123",
    userId: "user-456",
    name: "Drink Water",
    description: "8 glasses a day",
    frequency: "daily",
    createdAt: "2024-01-01T00:00:00Z",
    completions: ["2024-05-20"],
  };

  it("adds a completion date when the date is not present", () => {
    // Rule: if date does not exist, add it
    const testDate = "2024-05-21";
    const updatedHabit = toggleHabitCompletion(mockHabit, testDate);

    expect(updatedHabit.completions).toContain(testDate);
    expect(updatedHabit.completions.length).toBe(2);
  });

  it("removes a completion date when the date is present", () => {
    // Rule: if date already exists, remove it
    const testDate = "2024-05-20";
    const updatedHabit = toggleHabitCompletion(mockHabit, testDate);

    expect(updatedHabit.completions).not.toContain(testDate);
    expect(updatedHabit.completions.length).toBe(0);
  });
});
