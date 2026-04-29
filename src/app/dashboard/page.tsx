"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { toggleHabitCompletion } from "@/lib/habits";
import { Storage } from "@/lib/storage";
import ProtectedRoute from "@/components/shared/ProtectedRoute";
import HabitForm from "@/components/habits/HabitForm";
import HabitCard from "@/components/habits/HabitCard";
import type { Habit } from "@/types/habit";

export default function DashboardPage() {
  const { session, logout } = useAuth();

  const [habits, setHabits] = useState<Habit[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);

  // Load this user's habits on mount
  useEffect(() => {
    if (!session) return;
    const all = Storage.getHabits();
    // eslint-disable-next-line
    setHabits(all.filter((h) => h.userId === session.userId));
  }, [session]);

 

  function handleSaveHabit(data: {
    name: string;
    description: string;
    frequency: "daily";
  }) {
    if (!session) return;

    let updatedAll: Habit[];

    if (editingHabit) {
 
      const updated: Habit = {
        ...editingHabit,
        name: data.name,
        description: data.description,
        frequency: data.frequency,
      };
      const all = Storage.getHabits();
      updatedAll = all.map((h) => (h.id === updated.id ? updated : h));
    } else {
      const newHabit: Habit = {
        id: crypto.randomUUID(),
        userId: session.userId,
        name: data.name,
        description: data.description,
        frequency: data.frequency,
        createdAt: new Date().toISOString(),
        completions: [],
      };
      updatedAll = [...Storage.getHabits(), newHabit];
    }

    Storage.saveHabits(updatedAll);
    setHabits(updatedAll.filter((h) => h.userId === session.userId));
    setShowForm(false);
    setEditingHabit(null);
  }

  function handleEditHabit(habit: Habit) {
    setEditingHabit(habit);
    setShowForm(true);
  }

  function handleDeleteHabit(habitId: string) {
    if (!session) return;
    const updatedAll = Storage.getHabits().filter((h) => h.id !== habitId);
    Storage.saveHabits(updatedAll);
    setHabits(updatedAll.filter((h) => h.userId === session.userId));
  }

  function handleToggleComplete(habit: Habit) {
    if (!session) return;
    const today = new Date().toISOString().split("T")[0];
    const updated = toggleHabitCompletion(habit, today);
    const updatedAll = Storage.getHabits().map((h) =>
      h.id === updated.id ? updated : h,
    );
    Storage.saveHabits(updatedAll);
    setHabits(updatedAll.filter((h) => h.userId === session.userId));
  }

  function handleCancelForm() {
    setShowForm(false);
    setEditingHabit(null);
  }

 

  return (
    <ProtectedRoute>
      <div className="page-wrapper" data-testid="dashboard-page">
        {/* Header */}
        <header className="dashboard-header">
          <div className="flex flex-col gap-0.5">
            <span className="text-lg brand">
              Habit<span className="brand-accent">Tracker</span>
            </span>
            <span className="max-w-[180px] text-faint-foreground text-xs truncate-1">
              {session?.email}
            </span>
          </div>

          <button
            onClick={logout}
            data-testid="auth-logout-button"
            className="text-sm btn btn-ghost"
            aria-label="Log out of your account"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            Log out
          </button>
        </header>

        {/* Main */}
        <main className="flex-1 py-6 page-container">
          {/* Toolbar */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="font-display font-semibold text-foreground text-xl">
              My Habits
            </h2>
            {!showForm && (
              <button
                onClick={() => setShowForm(true)}
                data-testid="create-habit-button"
                className="btn btn-primary"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  aria-hidden="true"
                >
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                New habit
              </button>
            )}
          </div>

          {/* Form — shown for both create and edit */}
          {showForm && (
            <div className="mb-6 animate-slide-up card card-body">
              <h3 className="mb-4 font-display font-semibold text-foreground">
                {editingHabit ? "Edit habit" : "Create a new habit"}
              </h3>
              <HabitForm
                initialHabit={editingHabit ?? undefined}
                onSave={handleSaveHabit}
                onCancel={handleCancelForm}
              />
            </div>
          )}

          {/* Habit list */}
          {habits.length === 0 && !showForm ? (
            <div className="empty-state" data-testid="empty-state">
              <p className="mb-4 text-4xl" aria-hidden="true">
                🌱
              </p>
              <h3 className="empty-state-title">No habits yet</h3>
              <p className="empty-state-body">
                Create your first habit to start building your streak.
              </p>
            </div>
          ) : (
            <ul className="flex flex-col gap-3" aria-label="Habits list">
              {habits.map((habit) => (
                <li key={habit.id}>
                  <HabitCard
                    habit={habit}
                    onEdit={handleEditHabit}
                    onDelete={handleDeleteHabit}
                    onToggleComplete={handleToggleComplete}
                  />
                </li>
              ))}
            </ul>
          )}
        </main>
      </div>
    </ProtectedRoute>
  );
}
