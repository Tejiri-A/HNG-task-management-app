import { Habit } from "@/types/habit";

export function toggleHabitCompletion(habit: Habit, date: string): Habit {
  const isCompleted = habit.completions.includes(date);

  let newCompletions: string[];

  if (isCompleted) {
    // Rule: if date already exists, remove it
    newCompletions = habit.completions.filter((d) => d !== date);
  } else {
    // Rule: if date does not exist, add it
    newCompletions = [...habit.completions, date];
  }

  // Rule: returned habit must not contain duplicate dates
  const uniqueCompletions = [...new Set(newCompletions)];

  // Return a new object to satisfy the non-mutation rule
  return {
    ...habit,
    completions: uniqueCompletions,
  };
}
