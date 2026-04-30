# Habit Tracker PWA

A mobile-first Progressive Web App for building and tracking daily habits.
Built as a Stage 3 HNG internship technical assessment, with a focus on
technical discipline, deterministic behaviour, and a rigorous test suite.

---

## Table of Contents

- [Project Overview](#project-overview)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Setup Instructions](#setup-instructions)
- [Run Instructions](#run-instructions)
- [Test Instructions](#test-instructions)
- [Local Persistence Structure](#local-persistence-structure)
- [PWA Implementation](#pwa-implementation)
- [Trade-offs and Limitations](#trade-offs-and-limitations)
- [Test File to Behaviour Map](#test-file-to-behaviour-map)

---

## Project Overview

Habit Tracker is an installable PWA that allows a user to:

- Sign up and log in with email and password
- Create, edit, and delete daily habits
- Mark a habit complete or incomplete for today
- View a live current streak for each habit
- Reload the app and retain all saved state
- Install the app on desktop or mobile
- Load the cached app shell offline after a first visit

All persistence is local — there is no remote database or external
authentication service. The app behaves as a real product within those
constraints.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| Persistence | localStorage (custom abstraction) |
| Unit & Integration Tests | Vitest + React Testing Library |
| End-to-End Tests | Playwright |

---

## Project Structure

```
src/
├── app/
│   ├── page.tsx                    # / — splash screen + redirect logic
│   ├── login/
│   │   └── page.tsx                # /login route
│   ├── signup/
│   │   └── page.tsx                # /signup route
│   └── dashboard/
│       └── page.tsx                # /dashboard route (protected)
├── components/
│   ├── auth/
│   │   ├── LoginForm.tsx
│   │   └── SignupForm.tsx
│   ├── habits/
│   │   ├── HabitCard.tsx
│   │   └── HabitForm.tsx
│   └── shared/
│       ├── ProtectedRoute.tsx
│       └── SplashScreen.tsx
├── lib/
│   ├── auth.tsx                    # Auth logic + AuthProvider + useAuth
│   ├── habits.ts                   # toggleHabitCompletion utility
│   ├── slug.ts                     # getHabitSlug utility
│   ├── storage.ts                  # localStorage abstraction
│   ├── streaks.ts                  # calculateCurrentStreak utility
│   └── validators.ts               # validateHabitName utility
├── styles/
│   └── globals.css                 # Tailwind v4 design system
└── types/
├── auth.ts                     # User, Session types
└── habit.ts                    # Habit type

tests/
├── unit/
│   ├── slug.test.ts
│   ├── validators.test.ts
│   ├── streaks.test.ts
│   └── habits.test.ts
├── integration/
│   ├── auth-flow.test.tsx
│   └── habit-form.test.tsx
├── e2e/
│   └── app.spec.ts
└── setup.ts                        # Vitest global setup

public/
├── manifest.json
├── sw.js
└── icons/
├── icon-192.png
└── icon-512.png
```

---

## Setup Instructions

### Prerequisites

- Node.js 18.17 or later
- pnpm 8 or later (`npm install -g pnpm`)

### Steps

1. Clone the repository:

```bash
git clone https://github.com/Tejiri-A/HNG-habit-tracker-app.git
cd HNG-habit-tracker-app
```

2. Install dependencies:

```bash
pnpm install
```

3. Install Playwright browsers (required for e2e tests):

```bash
pnpx playwright install
```

No environment variables are required. The app is fully client-side with
no external services.

---

## Run Instructions

### Development

```bash
pnpm dev
```

Opens at `http://localhost:3000`. Note: the service worker is **disabled**
in development mode by Next.js. To test PWA and offline behaviour, use
the production build.

### Production build

```bash
pnpm build
pnpm start
```

Opens at `http://localhost:3000` with the service worker active.

---

## Test Instructions

### Unit tests

Runs pure function tests for `src/lib/` utilities with coverage:

```bash
pnpm test:unit
```

Coverage report is written to `coverage/`. The minimum threshold is 80%
line coverage for all files inside `src/lib/`.

### Integration tests

Runs component-level tests using React Testing Library against a jsdom
environment:

```bash
pnpm test:integration
```

### End-to-end tests

Runs full browser automation tests using Playwright. Requires a
production build — the `webServer` config in `playwright.config.ts`
handles this automatically:

```bash
pnpm test:e2e
```

To run with the Playwright UI:

```bash
pnpx playwright test --ui
```

### Full suite

Runs unit, integration, and e2e tests in sequence:

```bash
pnpm test
```

---

## Local Persistence Structure

All data is stored in the browser's `localStorage` under three fixed keys.
The abstraction layer lives in `src/lib/storage.ts`.

### `habit-tracker-users`

Stores a JSON array of all registered users.

```json
[
  {
    "id": "uuid-string",
    "email": "user@example.com",
    "password": "plaintext-password",
    "createdAt": "2025-04-28T10:00:00.000Z"
  }
]
```

### `habit-tracker-session`

Stores the currently active session, or `null` when no user is logged in.

```json
{
  "userId": "uuid-string",
  "email": "user@example.com"
}
```

### `habit-tracker-habits`

Stores a JSON array of all habits across all users. Habits are filtered
by `userId` at read time so each user only sees their own.

```json
[
  {
    "id": "uuid-string",
    "userId": "uuid-string",
    "name": "Drink Water",
    "description": "8 glasses a day",
    "frequency": "daily",
    "createdAt": "2025-04-28T10:00:00.000Z",
    "completions": ["2025-04-27", "2025-04-28"]
  }
]
```

`completions` contains unique ISO calendar dates in `YYYY-MM-DD` format.
Duplicate dates are rejected at the utility layer by `toggleHabitCompletion`.

### Storage abstraction

The `Storage` object in `src/lib/storage.ts` is the only place in the
codebase that reads from or writes to `localStorage` directly. It includes:

- An SSR guard (`typeof window === "undefined"`) to prevent crashes during
  Next.js server-side rendering
- Safe JSON parsing with a `try/catch` and configurable default values
- Typed getters and setters for each key

---

## PWA Implementation

### Manifest

`public/manifest.json` declares the app's name, icons, colours, display
mode, and start URL. This enables the browser's "Add to Home Screen" /
"Install app" prompt on both desktop and mobile.

### Service Worker

`public/sw.js` is registered on the client inside a `useEffect` in the
root layout. It is only registered when `window` is available and the
browser supports service workers, preventing SSR or unsupported-browser
errors.

The service worker implements a split fetch strategy:

**App shell routes** (`/`, `/login`, `/signup`, `/dashboard`, manifest,
icons) are pre-cached during the `install` event. These are available
offline immediately after the first load.

**`/_next/static/` chunks** (JavaScript and CSS) use a cache-first
strategy. These files are content-hashed by Next.js, so serving a cached
version is always safe. On first access they are fetched from the network
and stored in the cache for subsequent offline use.

**Navigation requests** (HTML pages) use a network-first strategy with a
cache fallback. When online, the user always gets fresh HTML. When
offline, the cached app shell is returned instead of a hard crash.

**Activate event** cleans up caches from previous versions by deleting
any cache whose key does not match the current `CACHE_NAME`. `skipWaiting`
and `clients.claim()` ensure the new service worker takes control
immediately without waiting for existing tabs to close.

### Offline behaviour

After a user has visited the app at least once while online, the following
works offline:

- The app shell renders on all routes without crashing
- localStorage data (habits, session) is fully accessible since it is a
  browser API with no network dependency
- The user can read their habits and navigate between cached routes

Creating or editing habits while offline does write to localStorage
successfully, but those changes will not sync anywhere since the app has
no remote backend — which is consistent with the local-only persistence
model.

---

## Trade-offs and Limitations

**Passwords stored in plain text**
Passwords are stored as-is in `localStorage`. This is intentional for
the scope of this assessment (local, front-end-only auth) but would never
be acceptable in a production system. A real implementation would hash
passwords with bcrypt before storage and use HTTP-only cookies or JWTs
for sessions.

**No session expiry**
Once created, a session persists in localStorage indefinitely until the
user explicitly logs out. There is no token expiry or idle timeout.

**No cross-device or cross-tab sync**
localStorage is scoped to a single browser on a single device. Two tabs
open simultaneously will not stay in sync reactively — the second tab
reads a snapshot of localStorage on mount and does not respond to writes
from the first tab. A production system would use a remote database with
real-time subscriptions.

**Only daily frequency is supported**
The `Habit` type includes a `frequency` field typed as `'daily'` only.
The frequency select in `HabitForm` is intentionally disabled since no
other option is implemented. This is a spec constraint, not an oversight.

**Service worker disabled in development**
Next.js disables service workers in `next dev` mode. All PWA and offline
behaviour must be tested against `next build && next start`.

**`crypto.randomUUID()` in tests**
jsdom does not expose the Web Crypto API by default. A polyfill is added
in `tests/setup.ts` to make `crypto.randomUUID()` available in the test
environment without affecting production behaviour.

---

## Test File to Behaviour Map

| Test file | Behaviour verified |
|---|---|
| `tests/unit/slug.test.ts` | `getHabitSlug` correctly converts habit names to URL-safe, lowercase, hyphenated slugs used as `data-testid` values throughout the UI |
| `tests/unit/validators.test.ts` | `validateHabitName` rejects empty names and names over 60 characters, and returns a trimmed value when valid |
| `tests/unit/streaks.test.ts` | `calculateCurrentStreak` correctly counts consecutive calendar days backwards from today, returns 0 when today is not completed, and handles duplicates and gaps |
| `tests/unit/habits.test.ts` | `toggleHabitCompletion` adds a date when absent, removes it when present, never produces duplicates, and does not mutate the original habit object |
| `tests/integration/auth-flow.test.tsx` | Signup form creates a user and session in localStorage and redirects; duplicate email is rejected with the correct error message; login form reads an existing user and creates a session; wrong password shows the correct error message |
| `tests/integration/habit-form.test.tsx` | Empty habit name is rejected with a validation error; a new habit is created and rendered with the correct slug-based test id; editing preserves immutable fields (id, userId, createdAt, completions); delete requires confirmation before removal; toggling completion updates the streak counter immediately |
| `tests/e2e/app.spec.ts` | Full user journeys covering splash screen redirect logic, route protection, signup, login, habit CRUD, completion toggling, streak display, localStorage persistence across reloads, logout, and offline app shell rendering after a first load |