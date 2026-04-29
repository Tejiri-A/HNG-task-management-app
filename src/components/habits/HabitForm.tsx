"use client";

import { useState } from "react";
import { validateHabitName } from "@/lib/validators";
import type { Habit } from "@/types/habit";
import { useAuth } from "@/lib/auth";

interface HabitFormProps {
  initialHabit?: Habit;
  onSave: (data: {
    userId:string | undefined;
    name: string;
    description: string;
    frequency: "daily";
  }) => void;
  onCancel: () => void;
}

export default function HabitForm({
  initialHabit,
  onSave,
  onCancel,
}: HabitFormProps) {
  const [name, setName] = useState(initialHabit?.name ?? "");
  const [description, setDescription] = useState(
    initialHabit?.description ?? "",
  );
  const [nameError, setNameError] = useState<string | null>(null);
  const {session} = useAuth()
  

  function handleSubmit(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();

    const validation = validateHabitName(name);
    if (!validation.valid) {
      setNameError(validation.error);
      return;
    }

    setNameError(null);
    onSave({
      userId:session?.userId,
      name: validation.value,
      description: description.trim(),
      frequency: "daily",
    });
  }

  return (
    <form data-testid="habit-form" onSubmit={handleSubmit} noValidate>
      {/* Name */}
      <div className="form-group">
        <label htmlFor="habit-name" className="form-label">
          Habit name <span aria-hidden="true">*</span>
        </label>
        <input
          id="habit-name"
          type="text"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            if (nameError) setNameError(null);
          }}
          placeholder="e.g. Drink Water"
          data-testid="habit-name-input"
          aria-describedby={nameError ? "habit-name-error" : undefined}
          aria-invalid={!!nameError}
          className={`form-input ${nameError ? "form-input-error" : ""}`}
        />
        {nameError && (
          <span id="habit-name-error" role="alert" className="field-error">
            {nameError}
          </span>
        )}
      </div>

      {/* Description */}
      <div className="form-group">
        <label htmlFor="habit-description" className="form-label">
          Description <span className="text-faint-foreground">(optional)</span>
        </label>
        <textarea
          id="habit-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What does this habit involve?"
          data-testid="habit-description-input"
          className="form-input form-textarea"
        />
      </div>

      {/* Frequency — daily only per spec */}
      <div className="form-group">
        <label htmlFor="habit-frequency" className="form-label">
          Frequency
        </label>
        <select
          id="habit-frequency"
          value="daily"
          data-testid="habit-frequency-select"
          className="cursor-not-allowed form-select"
          disabled
          aria-label="Frequency is set to daily"
        >
          <option value="daily">Daily</option>
        </select>
      </div>

      {/* Actions */}
      <div className="flex gap-3 mt-6">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 btn-secondary"
        >
          Cancel
        </button>
        <button
          type="submit"
          data-testid="habit-save-button"
          className="flex-1 btn btn-primary"
        >
          {initialHabit ? "Save changes" : "Create habit"}
        </button>
      </div>
    </form>
  );
}
