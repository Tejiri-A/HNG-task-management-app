"use client";

import { useState } from "react";
import { getHabitSlug } from "@/lib/slug";
import { calculateCurrentStreak } from "@/lib/streaks";
import type { Habit } from "@/types/habit";

interface HabitCardProps {
  habit: Habit;
  onEdit: (habit: Habit) => void;
  onDelete: (habitId: string) => void;
  onToggleComplete: (habit: Habit) => void;
}

export default function HabitCard({
  habit,
  onEdit,
  onDelete,
  onToggleComplete,
}: HabitCardProps) {
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  const slug = getHabitSlug(habit.name);
  const today = new Date().toISOString().split("T")[0];
  const isCompletedToday = habit.completions.includes(today);
  const streak = calculateCurrentStreak(habit.completions);

  function handleDeleteConfirm() {
    onDelete(habit.id);
    setShowConfirmDelete(false);
  }

  return (
    <>
      <div
        data-testid={`habit-card-${slug}`}
        className={`habit-card card-body ${
          isCompletedToday ? "habit-card-completed" : ""
        }`}
      >
        <div className="flex items-start gap-3">
          {/* Completion toggle */}
          <button
            onClick={() => onToggleComplete(habit)}
            data-testid={`habit-complete-${slug}`}
            aria-label={
              isCompletedToday
                ? `Mark ${habit.name} incomplete`
                : `Mark ${habit.name} complete for today`
            }
            aria-pressed={isCompletedToday}
            className={`completion-toggle mt-0.5 shrink-0 ${
              isCompletedToday ? "completion-toggle-done" : ""
            }`}
          >
            {isCompletedToday && (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                aria-hidden="true"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            )}
          </button>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-center gap-2">
              <h3
                className={`font-display font-semibold text-base truncate-1 ${
                  isCompletedToday
                    ? "line-through text-muted-foreground"
                    : "text-foreground"
                }`}
              >
                {habit.name}
              </h3>

              {/* Edit / Delete */}
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => onEdit(habit)}
                  data-testid={`habit-edit-${slug}`}
                  aria-label={`Edit ${habit.name}`}
                  className="btn-icon"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    aria-hidden="true"
                  >
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                </button>

                <button
                  onClick={() => setShowConfirmDelete(true)}
                  data-testid={`habit-delete-${slug}`}
                  aria-label={`Delete ${habit.name}`}
                  className="hover:bg-destructive-surface text-destructive btn-icon"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    aria-hidden="true"
                  >
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                    <path d="M10 11v6M14 11v6" />
                    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                  </svg>
                </button>
              </div>
            </div>

            {habit.description && (
              <p className="mt-0.5 text-muted-foreground text-sm truncate-2">
                {habit.description}
              </p>
            )}

            {/* Footer */}
            <div className="flex items-center gap-3 mt-3">
              <span
                data-testid={`habit-streak-${slug}`}
                className={`streak-badge ${
                  streak > 0 ? "streak-badge-active" : ""
                }`}
              >
                🔥 {streak} {streak === 1 ? "day" : "days"}
              </span>
              <span className="pill-primary">Daily</span>
            </div>
          </div>
        </div>
      </div>

      {/* Delete confirmation modal */}
      {showConfirmDelete && (
        <div
          className="modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-modal-title"
        >
          <div className="modal-panel">
            <h2 id="delete-modal-title" className="modal-title">
              Delete habit
            </h2>
            <p className="modal-body">
              Are you sure you want to delete{" "}
              <strong className="text-foreground">{habit.name}</strong>? This
              action cannot be undone.
            </p>
            <div className="modal-actions">
              <button
                onClick={() => setShowConfirmDelete(false)}
                className="flex-1 btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                data-testid="confirm-delete-button"
                className="flex-1 btn-danger"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
