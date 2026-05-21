# Implementation Plan: Life Dashboard

## Overview

Implement a single-page personal productivity dashboard using plain HTML, CSS, and Vanilla JavaScript. The app is structured as three files (`index.html`, `css/style.css`, `js/app.js`) and runs entirely in the browser via the `file://` protocol. All state is persisted to `localStorage` under namespaced keys (`ld_tasks`, `ld_links`, `ld_name`, `ld_theme`, `ld_sort_order`). The implementation follows the module-per-widget architecture defined in the design, with a shared `Storage` utility and five independent widget modules wired together in a single `DOMContentLoaded` handler.

## Tasks

- [x] 1. Set up project structure and HTML skeleton
  - Create `index.html` with semantic HTML structure (`<header>`, `<main>`, `<section>`) for all five widget areas: Greeting, Focus Timer, To-Do List, Quick Links, and Theme Toggle
  - Create `css/style.css` with CSS custom properties for light/dark themes under `[data-theme="light"]` and `[data-theme="dark"]` selectors; apply base typographic scale (minimum 16px body font), card/section containers with visible boundaries, and responsive layout from 320px to 1920px
  - Create `js/app.js` with the top-level `DOMContentLoaded` initialization entry point
  - Ensure all interactive controls have a minimum 44×44 CSS pixel touch target size and sufficient spacing between adjacent controls
  - _Requirements: 7.3, 7.4, 8.1, 8.2, 8.3, 8.4, 8.5_

- [x] 2. Implement the Storage module
  - [x] 2.1 Implement the `Storage` module with `KEYS`, `get()`, `set()`, and `loadAll()` methods
    - `KEYS` object defines all five namespaced keys: `ld_tasks`, `ld_links`, `ld_name`, `ld_theme`, `ld_sort_order`
    - `get(key)` wraps `localStorage.getItem()` and `JSON.parse()` in try/catch, returning `null` on any failure
    - `set(key, value)` wraps `localStorage.setItem(key, JSON.stringify(value))` in try/catch; on failure dispatches a custom `storage:error` event on `document`
    - `loadAll()` reads all five keys and maps missing/invalid/null values to their defaults: tasks `[]`, links `[]`, name `""`, theme `"light"`, sortOrder `"date"`
    - Register a global `storage:error` listener on `document` that renders a non-blocking toast notification with the message "Could not save your changes. Storage may be full." that auto-dismisses after 5 seconds
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

  - [ ]* 2.2 Write property test for Storage serialization round-trip (Property 15)
    - **Property 15: Storage serialization round-trip**
    - Generate arbitrary valid state objects (tasks array, links array, name string, theme string), serialize via `Storage.set()`, deserialize via `Storage.get()`, verify structural equivalence with all fields preserved
    - **Validates: Requirements 6.1, 6.2**

  - [ ]* 2.3 Write property test for Storage recovery from corrupt data (Property 16)
    - **Property 16: Storage recovery from corrupt data**
    - Generate arbitrary corrupt JSON strings (and structurally invalid JSON) for each key, call `Storage.loadAll()`, verify the correct default value is returned for each key and no error is thrown
    - **Validates: Requirements 6.3**

- [x] 3. Implement the ThemeManager module
  - [x] 3.1 Implement `ThemeManager` with `THEMES`, `init(storedTheme)`, `toggle()`, `apply(theme)`, and `resolveTheme(value)` methods
    - `resolveTheme(value)` returns `"light"` for any value that is not exactly `"light"` or `"dark"`
    - `apply(theme)` sets `document.documentElement.setAttribute('data-theme', theme)` and persists to `ld_theme` via `Storage.set()`; the CSS custom property switch ensures the theme change completes within a single style recalculation (well within 100ms)
    - `init(storedTheme)` calls `resolveTheme()` on the stored value and calls `apply()` synchronously — this MUST run before any widget renders to prevent flash of wrong theme
    - Wire the theme toggle button to `ThemeManager.toggle()`
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.6_

  - [ ]* 3.2 Write property test for Theme persistence round-trip (Property 13)
    - **Property 13: Theme persistence round-trip**
    - Generate `"light"` and `"dark"` values, call `ThemeManager.apply(theme)`, read `ld_theme` from localStorage, verify the same value is returned
    - **Validates: Requirements 5.3**

  - [ ]* 3.3 Write property test for invalid theme defaulting to light (Property 14)
    - **Property 14: Invalid theme defaults to light**
    - Generate arbitrary non-theme strings, null, undefined, and empty string values, verify `resolveTheme()` returns `"light"` for all of them
    - **Validates: Requirements 5.4**

- [x] 4. Implement the GreetingWidget module
  - [x] 4.1 Implement pure helper functions: `getGreeting(hour)`, `getDisplayName(name)`, `formatTime(hour, minute)`, and `formatDate(date)`
    - `getGreeting(hour)` maps hour 0–23 to the correct greeting string: 5–11 → "Good morning", 12–17 → "Good afternoon", 18–21 → "Good evening", 22–23 and 0–4 → "Good night"
    - `getDisplayName(name)` returns `"Friend"` for empty string, null, or undefined; otherwise returns the trimmed name
    - `formatTime(hour, minute)` returns a zero-padded `"HH:MM"` string (e.g., `"09:05"`)
    - `formatDate(date)` returns `"Weekday, DD Month YYYY"` using English weekday and month names (e.g., `"Thursday, 21 May 2026"`)
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.9_

  - [ ]* 4.2 Write property test for greeting time-range correctness (Property 1)
    - **Property 1: Greeting time-range correctness**
    - Generate arbitrary hour values (0–23), verify `getGreeting(hour)` returns exactly one of the four greeting strings and maps to the correct range
    - **Validates: Requirements 1.3, 1.4, 1.5, 1.6**

  - [ ]* 4.3 Write property test for name fallback to "Friend" (Property 2)
    - **Property 2: Name fallback to "Friend"**
    - Generate empty strings, null, and undefined values, verify `getDisplayName()` returns `"Friend"` for all of them
    - **Validates: Requirements 1.9**

  - [ ]* 4.4 Write property test for time format correctness (Property 3)
    - **Property 3: Time format correctness**
    - Generate valid hour (0–23) and minute (0–59) values, verify `formatTime()` returns a zero-padded `"HH:MM"` string representing the input values exactly
    - **Validates: Requirements 1.1**

  - [ ]* 4.5 Write property test for date format correctness (Property 4)
    - **Property 4: Date format correctness**
    - Generate arbitrary valid `Date` objects, verify `formatDate()` returns a string matching `"<Weekday>, <DD> <Month> <YYYY>"` with correct English weekday and month names
    - **Validates: Requirements 1.2**

  - [x] 4.6 Implement `GreetingWidget` with `init(name)`, `setName(name)`, and `tick()` methods
    - `init(name)` renders the initial clock, date, and greeting using the helper functions; starts a 60-second `setInterval` calling `tick()`; fires the first tick immediately on init
    - `tick()` reads the current `Date`, updates the displayed time (HH:MM), date, and greeting text
    - `setName(name)` validates the input is 1–50 characters, updates the displayed name in the greeting, and persists to `ld_name` via `Storage.set()`
    - Wire the name input/edit control to `GreetingWidget.setName()`
    - _Requirements: 1.1, 1.2, 1.7, 1.8_

- [x] 5. Checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Implement the FocusTimer module
  - [x] 6.1 Implement `FocusTimer` with `init()`, `start()`, `stop()`, `reset()`, and `tick()` methods and the IDLE/RUNNING/PAUSED/EXPIRED state machine
    - IDLE: initial state with 1500 seconds (25:00) remaining
    - RUNNING → PAUSED on `stop()`; RUNNING → EXPIRED when remaining time reaches 0; RUNNING → IDLE on `reset()`
    - PAUSED → RUNNING on `start()`; PAUSED → IDLE on `reset()`
    - EXPIRED → IDLE on `reset()`
    - `tick()` is called by `setInterval` every 1000ms when RUNNING; computes remaining time as `endTime - Date.now()` to prevent drift from browser throttling; transitions to EXPIRED when remaining time ≤ 0
    - `reset()` calls `clearInterval` before any state update to prevent a final tick from firing after reset; restores remaining time to 1500 seconds and transitions to IDLE
    - Wire Start, Stop, and Reset buttons to the corresponding methods
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.10_

  - [x] 6.2 Implement control enable/disable logic for all four timer states
    - IDLE: Start enabled, Stop disabled
    - RUNNING: Start disabled, Stop enabled
    - PAUSED: Start enabled, Stop disabled
    - EXPIRED: Start disabled, Stop disabled (until Reset is activated)
    - Update button `disabled` attribute on every state transition
    - _Requirements: 2.7, 2.8, 2.9_

  - [ ]* 6.3 Write property test for Focus Timer control state invariant (Property 17)
    - **Property 17: Focus Timer control state invariant**
    - For each timer state {IDLE, RUNNING, PAUSED, EXPIRED}, verify the enabled/disabled state of Start and Stop controls matches the specification table
    - **Validates: Requirements 2.7, 2.8, 2.9**

  - [ ]* 6.4 Write property test for Focus Timer reset invariant (Property 18)
    - **Property 18: Focus Timer reset invariant**
    - Generate arbitrary timer states (RUNNING, PAUSED, EXPIRED) with arbitrary remaining time values, call `reset()`, verify transition to IDLE with exactly 1500 seconds remaining and any active interval cleared
    - **Validates: Requirements 2.5**

- [x] 7. Implement the TodoList module
  - [x] 7.1 Implement `TodoList` with `init(tasks, sortOrder)`, `addTask(description)`, `editTask(id, newDescription)`, `toggleComplete(id)`, `deleteTask(id)`, `render()`, and `persist()` methods
    - `addTask(description)` generates a UUID v4 `id` and `createdAt` timestamp (Date.now()); rejects empty or whitespace-only descriptions with an inline `<span class="error">` message; on success calls `render()` and `persist()`
    - `editTask(id, newDescription)` replaces the task's `<span>` with an `<input>` pre-filled with the current description; confirms on Enter or Save click, cancels on Escape; rejects empty or whitespace-only descriptions with an inline error; on success calls `render()` and `persist()`
    - `toggleComplete(id)` toggles the `completed` boolean and applies/removes strikethrough styling; calls `persist()`
    - `deleteTask(id)` removes the task from the array and calls `persist()`
    - `persist()` calls `Storage.set(KEYS.TASKS, tasks)` within 100ms of any mutation
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7_

  - [ ]* 7.2 Write property test for task addition round-trip (Property 5)
    - **Property 5: Task addition round-trip**
    - Generate valid task descriptions (1–200 non-whitespace chars), call `addTask()`, read `ld_tasks` from localStorage, verify the array contains exactly one entry with that description
    - **Validates: Requirements 3.2, 6.1**

  - [ ]* 7.3 Write property test for whitespace task rejection (Property 6)
    - **Property 6: Whitespace task rejection**
    - Generate strings composed entirely of whitespace characters (spaces, tabs, newlines), call `addTask()`, verify a validation error is returned and the task list in localStorage is unchanged
    - **Validates: Requirements 3.3**

  - [ ]* 7.4 Write property test for task completion toggle idempotence (Property 7)
    - **Property 7: Task completion toggle idempotence**
    - Generate tasks with arbitrary initial completion states, call `toggleComplete(id)` twice, verify the task returns to its original completion state and localStorage reflects that original state
    - **Validates: Requirements 3.6**

  - [x] 7.5 Implement sort logic and `setSortOrder(order)` with persistence
    - `'date'` sort: ascending by `createdAt` timestamp (default)
    - `'alpha'` sort: lexicographic ascending by `description`
    - `'completion'` sort: incomplete tasks first (`completed === false`), then completed
    - `setSortOrder(order)` updates the active sort, re-renders the list, and persists the selected order to `ld_sort_order` via `Storage.set()` immediately
    - Wire the sort control to `setSortOrder()`; on `init()` apply the restored sort order from storage
    - _Requirements: 3.8, 3.9, 3.10_

  - [ ]* 7.6 Write property test for sort order correctness (Property 8)
    - **Property 8: Sort order correctness**
    - Generate random task lists with arbitrary descriptions and completion states; sort by `"alpha"` and verify each description is lexicographically ≤ the next; sort by `"completion"` and verify all incomplete tasks precede all completed tasks
    - **Validates: Requirements 3.8**

  - [ ]* 7.7 Write property test for sort order persistence round-trip (Property 9)
    - **Property 9: Sort order persistence round-trip**
    - Generate valid sort order values (`"date"`, `"alpha"`, `"completion"`), call `setSortOrder()`, read `ld_sort_order` from localStorage, verify the same value is returned
    - **Validates: Requirements 3.10**

- [x] 8. Checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 9. Implement the QuickLinks module
  - [x] 9.1 Implement `QuickLinks` with `init(links)`, `addLink(label, url)`, `deleteLink(id)`, `render()`, `persist()`, and `validateUrl(url)` methods
    - `validateUrl(url)` returns true only if the URL matches `^https?:\/\/.+` and the `URL` constructor does not throw (ensuring a non-empty host is present)
    - `addLink(label, url)` validates: label is 1–50 chars, URL is valid format and ≤2048 chars, and collection size is < 20; rejects with inline error messages identifying which field failed and why; on success calls `render()` and `persist()`
    - Each Quick Link renders as a clickable `<a>` element with `target="_blank"` and `rel="noopener noreferrer"` that opens the URL in a new tab
    - `deleteLink(id)` removes the link from the array and calls `persist()`
    - `persist()` calls `Storage.set(KEYS.LINKS, links)` within 100ms of any mutation; storage failures are handled by the global `storage:error` toast (satisfying Requirement 4.7)
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8_

  - [ ]* 9.2 Write property test for Quick Link URL validation (Property 10)
    - **Property 10: Quick Link URL validation**
    - Generate arbitrary URL strings that do not match `^https?:\/\/.+` with a non-empty host, verify `validateUrl()` returns false and no write to localStorage occurs
    - **Validates: Requirements 4.3**

  - [ ]* 9.3 Write property test for Quick Link limit enforcement (Property 11)
    - **Property 11: Quick Link limit enforcement**
    - Generate Quick Links collections of exactly 20 entries, call `addLink()` with a valid label and URL, verify a limit-exceeded error is returned and the collection size in localStorage remains 20
    - **Validates: Requirements 4.8**

  - [ ]* 9.4 Write property test for Quick Link addition round-trip (Property 12)
    - **Property 12: Quick Link addition round-trip**
    - Generate valid label/URL pairs with collection size < 20, call `addLink()`, read `ld_links` from localStorage, verify the array contains an entry with that exact label and URL
    - **Validates: Requirements 4.2**

- [-] 10. Wire all modules together in `app.js` and finalize initialization
  - In the `DOMContentLoaded` handler: call `Storage.loadAll()` first to get all persisted state
  - Call `ThemeManager.init(state.theme)` immediately after — this MUST run before any widget renders to set `data-theme` on `<html>` and prevent flash of wrong theme
  - Initialize remaining widgets with their stored state: `GreetingWidget.init(state.name)`, `FocusTimer.init()`, `TodoList.init(state.tasks, state.sortOrder)`, `QuickLinks.init(state.links)`
  - Verify the complete initialization sequence matches the design's sequence diagram
  - _Requirements: 5.6, 6.2, 7.1, 7.4_

- [ ] 11. Apply WCAG 2.1 AA color contrast and accessibility polish
  - Verify color contrast ratios meet 4.5:1 for normal text and 3:1 for large text and UI components in both light and dark themes
  - Confirm all interactive controls are reachable and operable via Tab/Enter/Space keyboard navigation
  - Add `aria-label` or `aria-live` attributes where needed for dynamic content (timer display, toast notifications, inline validation errors)
  - Ensure semantic HTML elements (`<header>`, `<main>`, `<section>`, `<button>`) are used throughout for structural accessibility
  - _Requirements: 5.5, 8.5_

- [x] 12. Final checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests use [fast-check](https://github.com/dubzzz/fast-check) with a minimum of 100 iterations per property
- Unit tests use [Jest](https://jestjs.io/) with jsdom for DOM simulation
- Pure functions (`getGreeting`, `getDisplayName`, `formatTime`, `formatDate`, `validateUrl`, sort comparators, `resolveTheme`, `Storage.get/set/loadAll`) are extracted from DOM logic to enable isolated testing
- The app must work via the `file://` protocol — no build tools or bundlers are required; ES modules with `type="module"` are used for encapsulation (supported in all modern browsers without a server)

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["2.1"] },
    { "id": 1, "tasks": ["3.1", "4.1", "6.1", "7.1", "9.1"] },
    { "id": 2, "tasks": ["2.2", "2.3", "3.2", "3.3", "4.2", "4.3", "4.4", "4.5", "6.2", "7.5", "9.2", "9.3"] },
    { "id": 3, "tasks": ["4.6", "6.3", "6.4", "7.2", "7.3", "7.4", "7.6", "7.7", "9.4"] },
    { "id": 4, "tasks": ["3.2", "3.3"] }
  ]
}
```
