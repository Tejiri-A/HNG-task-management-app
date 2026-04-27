export type HabitTrackerUser = {
  id: string;
  email: string;
  password: string;
  createdAt: string;
};

export type HabitTrackerSession = {
  userId: string;
  email: string;
};
