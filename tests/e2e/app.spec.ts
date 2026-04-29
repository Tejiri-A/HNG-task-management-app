import { test, expect, type Page } from "@playwright/test";


const TEST_USER = {
  email: "testuser@example.com",
  password: "securepassword123",
};

const SECOND_USER = {
  email: "seconduser@example.com",
  password: "anotherpassword123",
};

const KEYS = {
  USERS: "habit-tracker-users",
  SESSION: "habit-tracker-session",
  HABITS: "habit-tracker-habits",
};



// Seed a user and session directly into localStorage
// so we can skip the signup flow when testing other features
async function seedUserAndSession(page: Page, user = TEST_USER) {
  await page.evaluate(
    ({ keys, u }) => {
      const userId = crypto.randomUUID();

      const users = JSON.parse(localStorage.getItem(keys.USERS) ?? "[]");
      users.push({
        id: userId,
        email: u.email,
        password: u.password,
        createdAt: new Date().toISOString(),
      });
      localStorage.setItem(keys.USERS, JSON.stringify(users));

      localStorage.setItem(
        keys.SESSION,
        JSON.stringify({ userId, email: u.email }),
      );

      return userId;
    },
    { keys: KEYS, u: user },
  );
}

// Seed a habit for the currently sessioned user
async function seedHabit(page: Page, name: string, completions: string[] = []) {
  await page.evaluate(
    ({ keys, habitName, habitCompletions }) => {
      const session = JSON.parse(localStorage.getItem(keys.SESSION) ?? "null");
      if (!session) throw new Error("No session found — seed user first");

      const habits = JSON.parse(localStorage.getItem(keys.HABITS) ?? "[]");
      habits.push({
        id: crypto.randomUUID(),
        userId: session.userId,
        name: habitName,
        description: "",
        frequency: "daily",
        createdAt: new Date().toISOString(),
        completions: habitCompletions,
      });
      localStorage.setItem(keys.HABITS, JSON.stringify(habits));
    },
    { keys: KEYS, habitName: name, habitCompletions: completions },
  );
}

// Complete the signup flow via the UI
async function signUpViaUI(page: Page, user = TEST_USER) {
  await page.goto("/signup");
  await page.getByTestId("auth-signup-email").fill(user.email);
  await page.getByTestId("auth-signup-password").fill(user.password);
  await page.getByTestId("auth-signup-submit").click();
  await page.waitForURL("/dashboard");
}

// Tests
test.describe("Habit Tracker app", () => {
  // Clear localStorage before each test so state never bleeds between tests
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => localStorage.clear());
  });

  //Splash screen & Routing

  test("shows the splash screen and redirects unauthenticated users to /login", async ({
    page,
  }) => {
    await page.goto("/");

    // Splash screen must be visible immediately
    await expect(page.getByTestId("splash-screen")).toBeVisible();

    // After splash duration, unauthenticated user lands on /login
    await page.waitForURL("/login", { timeout: 5000 });
    expect(page.url()).toContain("/login");
  });

  test("redirects authenticated users from / to /dashboard", async ({
    page,
  }) => {
    await page.goto("/");
    await page.evaluate(() => localStorage.clear());

    // Seed session before navigating to /
    await seedUserAndSession(page);
    await page.goto("/");

    // Splash visible first
    await expect(page.getByTestId("splash-screen")).toBeVisible();

    // Then redirects to dashboard
    await page.waitForURL("/dashboard", { timeout: 5000 });
    expect(page.url()).toContain("/dashboard");
  });

  test("prevents unauthenticated access to /dashboard", async ({ page }) => {
    // Navigate directly to dashboard with no session
    await page.goto("/dashboard");

    // Must end up on /login
    await page.waitForURL("/login", { timeout: 5000 });
    expect(page.url()).toContain("/login");
  });

  // Auth

  test("signs up a new user and lands on the dashboard", async ({ page }) => {
    await signUpViaUI(page);

    // Dashboard is rendered
    await expect(page.getByTestId("dashboard-page")).toBeVisible();

    // Session was persisted
    const session = await page.evaluate((key) => {
      return JSON.parse(localStorage.getItem(key) ?? "null");
    }, KEYS.SESSION);

    expect(session).not.toBeNull();
    expect(session.email).toBe(TEST_USER.email);
  });

  test("logs in an existing user and loads only that user's habits", async ({
    page,
  }) => {
    // Sign up both users and seed habits for each
    await signUpViaUI(page, TEST_USER);
    await seedHabit(page, "Test User Habit");

    // Log out first user
    await page.getByTestId("auth-logout-button").click();
    await page.waitForURL("/login");

    // Sign up second user
    await page.goto("/signup");
    await page.getByTestId("auth-signup-email").fill(SECOND_USER.email);
    await page.getByTestId("auth-signup-password").fill(SECOND_USER.password);
    await page.getByTestId("auth-signup-submit").click();
    await page.waitForURL("/dashboard");
    await seedHabit(page, "Second User Habit");

    // Log out second user and log back in as first
    await page.getByTestId("auth-logout-button").click();
    await page.waitForURL("/login");

    await page.getByTestId("auth-login-email").fill(TEST_USER.email);
    await page.getByTestId("auth-login-password").fill(TEST_USER.password);
    await page.getByTestId("auth-login-submit").click();
    await page.waitForURL("/dashboard");

    // Only first user's habit should be visible
    await expect(page.getByTestId("habit-card-test-user-habit")).toBeVisible();
    await expect(
      page.getByTestId("habit-card-second-user-habit"),
    ).not.toBeVisible();
  });

  // Habits

  test("creates a habit from the dashboard", async ({ page }) => {
    await signUpViaUI(page);

    // Open the form
    await page.getByTestId("create-habit-button").click();
    await expect(page.getByTestId("habit-form")).toBeVisible();

    // Fill in and submit
    await page.getByTestId("habit-name-input").fill("Drink Water");
    await page.getByTestId("habit-description-input").fill("8 glasses a day");
    await page.getByTestId("habit-save-button").click();

    // Card appears with correct slug-based test id
    await expect(page.getByTestId("habit-card-drink-water")).toBeVisible();

    // Persisted in localStorage
    const habits = await page.evaluate((key) => {
      return JSON.parse(localStorage.getItem(key) ?? "[]");
    }, KEYS.HABITS);

    expect(habits).toHaveLength(1);
    expect(habits[0].name).toBe("Drink Water");
    expect(habits[0].frequency).toBe("daily");
  });

  test("completes a habit for today and updates the streak", async ({
    page,
  }) => {
    await signUpViaUI(page);
    await seedHabit(page, "Drink Water");
    await page.reload();

    // Streak starts at 0
    await expect(page.getByTestId("habit-streak-drink-water")).toContainText(
      "0",
    );

    // Mark complete
    await page.getByTestId("habit-complete-drink-water").click();

    // Streak updates to 1
    await expect(page.getByTestId("habit-streak-drink-water")).toContainText(
      "1",
    );

    // Today's date in completions
    const today = new Date().toISOString().split("T")[0];
    const habits = await page.evaluate((key) => {
      return JSON.parse(localStorage.getItem(key) ?? "[]");
    }, KEYS.HABITS);

    expect(habits[0].completions).toContain(today);
  });

  // Persistence

  test("persists session and habits after page reload", async ({ page }) => {
    await signUpViaUI(page);
    await seedHabit(page, "Drink Water");
    await page.reload();

    // Still on dashboard — session survived reload
    await expect(page.getByTestId("dashboard-page")).toBeVisible();

    // Habit still rendered — habits survived reload
    await expect(page.getByTestId("habit-card-drink-water")).toBeVisible();
  });

  // Logout 

  test("logs out and redirects to /login", async ({ page }) => {
    await signUpViaUI(page);

    await page.getByTestId("auth-logout-button").click();

    // Redirected to login
    await page.waitForURL("/login", { timeout: 3000 });
    expect(page.url()).toContain("/login");

    // Session cleared from localStorage
    const session = await page.evaluate((key) => {
      return localStorage.getItem(key);
    }, KEYS.SESSION);

    expect(session).toBeNull();

    // Navigating back to dashboard redirects to login
    await page.goto("/dashboard");
    await page.waitForURL("/login", { timeout: 3000 });
  });

  //  PWA / Offline 
  test("loads the cached app shell when offline after the app has been loaded once", async ({
    page,
    context,
  }) => {
    // Load the app online — service worker installs and caches shell
    await signUpViaUI(page);

    // Visit all shell routes while online so they get cached
    await page.goto("/login");
    await page.goto("/signup");
    await page.goto("/dashboard");

    // Wait for service worker to activate and finish caching
    await page.waitForFunction(
      () => {
        return navigator.serviceWorker.controller !== null;
      },
      { timeout: 10000 },
    );

    // Go offline
    await context.setOffline(true);

    // App shell must load without a hard crash
    await page.goto("/login");
    await expect(page.getByTestId("auth-login-email")).toBeVisible();

    await page.goto("/signup");
    await expect(page.getByTestId("auth-signup-email")).toBeVisible();

    // Dashboard renders from cache — session is still in localStorage
    await page.goto("/dashboard");
    await expect(page.getByTestId("dashboard-page")).toBeVisible();

    // Restore connection
    await context.setOffline(false);
  });
});
