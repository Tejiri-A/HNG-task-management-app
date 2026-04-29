import { Habit } from "@/types/habit";
import { User, Session } from "@/types/auth";
import { KEYS } from "./constants";


// Safely get data from local storage
const get = <T>(key: string, defaultValue: T): T => {
  if (typeof window === "undefined") return defaultValue;
  const stored = localStorage.getItem(key);
  try {
    return stored ? JSON.parse(stored) : defaultValue;
  } catch {
    return defaultValue;
  }
};

// Safely write data to local storage
const set = <T>(key: string, value: T): void => {
  if (typeof window === "undefined") return;
  if (value === null || value === undefined) {
    localStorage.removeItem(key);
  } else {
    localStorage.setItem(key, JSON.stringify(value));
  }
};

export const Storage = {
  getUsers: (): User[] => get<User[]>(KEYS.USERS, []),
  saveUsers: (users: User[]) => set(KEYS.USERS, users),

  getSession: (): Session | null => get<Session | null>(KEYS.SESSION, null),
  saveSession: (session: Session | null) => set(KEYS.SESSION, session),

  clearSession: () => set(KEYS.SESSION, null),

  getHabits: (): Habit[] => get<Habit[]>(KEYS.HABITS, []),
  saveHabits: (habits: Habit[]) => set(KEYS.HABITS, habits),
};
