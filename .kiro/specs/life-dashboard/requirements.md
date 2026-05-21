# Requirements Document

## Introduction

The Life Dashboard is a single-page web application built with HTML, CSS, and Vanilla JavaScript. It provides a personal productivity hub accessible directly in the browser, requiring no backend or installation. The dashboard combines a contextual greeting, a focus timer, a to-do list, quick-access links, and a light/dark mode toggle — all persisted locally via the Browser Local Storage API.

## Glossary

- **Dashboard**: The single-page web application described in this document.
- **User**: The person using the Dashboard in their browser.
- **Task**: A to-do item created by the User, consisting of at minimum a text description and a completion state.
- **Quick Link**: A user-defined shortcut consisting of a label and a URL that opens a website.
- **Focus Timer**: A countdown timer preset to 25 minutes used to support focused work sessions.
- **Local_Storage**: The Browser Local Storage API used to persist all user data client-side.
- **Theme**: The visual color scheme of the Dashboard, either Light or Dark.
- **Greeting**: The time-sensitive welcome message displayed at the top of the Dashboard.

---

## Requirements

### Requirement 1: Greeting Widget

**User Story:** As a User, I want to see the current time, date, and a personalized greeting based on the time of day, so that I feel welcomed and oriented when I open the Dashboard.

#### Acceptance Criteria

1. THE Dashboard SHALL display the current local time in 24-hour HH:MM format, updated every 60 seconds.
2. THE Dashboard SHALL display the current local date in the exact format "Weekday, DD Month YYYY" (e.g., "Thursday, 21 May 2026").
3. WHEN the local time is between 05:00 and 11:59, THE Dashboard SHALL display the greeting "Good morning, [Name]".
4. WHEN the local time is between 12:00 and 17:59, THE Dashboard SHALL display the greeting "Good afternoon, [Name]".
5. WHEN the local time is between 18:00 and 21:59, THE Dashboard SHALL display the greeting "Good evening, [Name]".
6. WHEN the local time is between 22:00 and 04:59, THE Dashboard SHALL display the greeting "Good night, [Name]".
7. THE Dashboard SHALL allow the User to set a custom name of 1 to 50 characters for use in the greeting.
8. WHEN the User sets a custom name, THE Dashboard SHALL persist the name so that it is restored on subsequent page loads.
9. IF no custom name has been set, OR IF the stored name is an empty string, THEN THE Dashboard SHALL display the greeting using the placeholder "Friend" in place of [Name].

---

### Requirement 2: Focus Timer

**User Story:** As a User, I want a 25-minute countdown timer with Start, Stop, and Reset controls, so that I can manage focused work sessions without leaving the Dashboard.

#### Acceptance Criteria

1. THE Focus_Timer SHALL initialize with a countdown value of 25 minutes, displayed as "25:00" in MM:SS format.
2. WHEN the User activates the Start control while the Focus_Timer is in the initialized or reset state (25:00), THE Focus_Timer SHALL begin counting down in one-second intervals.
3. WHILE the Focus_Timer is counting down, THE Dashboard SHALL update the displayed MM:SS time every second.
4. WHEN the User activates the Stop control, THE Focus_Timer SHALL enter a paused state, halting the countdown at the current remaining time.
5. WHEN the User activates the Reset control while the Focus_Timer is in any state (counting, paused, or expired), THE Focus_Timer SHALL stop any active countdown and restore the displayed time to 25:00.
6. WHEN the countdown reaches 00:00, THE Focus_Timer SHALL stop automatically and enter an expired state.
7. WHILE the Focus_Timer is counting down, THE Dashboard SHALL disable the Start control and enable the Stop control.
8. WHILE the Focus_Timer is in the paused or reset state, THE Dashboard SHALL enable the Start control and disable the Stop control.
9. WHEN the Focus_Timer enters the expired state at 00:00, THE Dashboard SHALL disable both the Start control and the Stop control until the User activates the Reset control.
10. WHEN the User activates the Start control while the Focus_Timer is in the paused state, THE Focus_Timer SHALL resume counting down from the current remaining time.

---

### Requirement 3: To-Do List

**User Story:** As a User, I want to add, edit, complete, delete, and sort tasks, with all changes saved automatically, so that I can manage my daily to-dos without losing data between sessions.

#### Acceptance Criteria

1. THE To_Do_List SHALL provide an input field and a submit control for the User to add a new Task with a description of 1 to 200 characters.
2. WHEN the User submits a new Task with a non-empty description, THE To_Do_List SHALL add the Task to the list and persist it to Local_Storage.
3. WHEN the User attempts to submit a Task with an empty description, THE To_Do_List SHALL reject the submission and display an inline validation message.
4. WHEN the User activates the edit control on a Task, THE To_Do_List SHALL replace the Task's display text with an inline editable input field pre-filled with the current description.
5. WHEN the User confirms an edit (by pressing Enter or activating a save control), THE To_Do_List SHALL update the Task description and persist the change to Local_Storage; IF the confirmed edit results in an empty description, THE To_Do_List SHALL reject the change and display an inline validation message.
6. WHEN the User activates the complete control on a Task, THE To_Do_List SHALL toggle the Task's completion state and apply a strikethrough style to completed Tasks.
7. WHEN the User activates the delete control on a Task, THE To_Do_List SHALL remove the Task from the list and update Local_Storage.
8. THE To_Do_List SHALL provide a sort control that allows the User to order Tasks by: creation date (default), alphabetical order (A–Z), or completion state (incomplete first).
9. WHEN the Dashboard loads, THE To_Do_List SHALL restore all Tasks from Local_Storage and apply the sort order that was active when the page was last closed; IF no sort order has been stored, THE To_Do_List SHALL default to creation date order.
10. WHEN the User changes the sort order, THE To_Do_List SHALL persist the selected sort order to Local_Storage immediately.

---

### Requirement 4: Quick Links

**User Story:** As a User, I want to save and access favorite website links as buttons on the Dashboard, so that I can navigate to frequently visited sites with a single click.

#### Acceptance Criteria

1. THE Quick_Links widget SHALL provide an input form with a label field (1–50 characters) and a URL field (1–2048 characters) for the User to add a new Quick Link.
2. WHEN the User submits a new Quick Link with a non-empty label and a URL beginning with "http://" or "https://" followed by a non-empty host, AND the total number of saved Quick Links is fewer than 20, THE Quick_Links widget SHALL display the link as a clickable button and persist it to Local_Storage.
3. IF the User submits a Quick Link with an empty label, a label exceeding 50 characters, an invalid URL format, or a URL exceeding 2048 characters, THEN THE Quick_Links widget SHALL reject the submission and display an inline validation message identifying which field failed and why.
4. WHEN the User activates a Quick Link button, THE Dashboard SHALL open the associated URL in a new browser tab.
5. WHEN the User activates the delete control on a Quick Link, THE Quick_Links widget SHALL remove the link and update Local_Storage.
6. WHEN the Dashboard loads, THE Quick_Links widget SHALL restore all saved Quick Links from Local_Storage.
7. IF a Local_Storage read or write operation for Quick Links fails, THEN THE Quick_Links widget SHALL display a visible error message informing the User that data could not be saved or loaded.
8. WHEN the User attempts to add a Quick Link and the total number of saved Quick Links is already 20, THE Quick_Links widget SHALL reject the submission and display an inline message indicating the maximum limit has been reached.

---

### Requirement 5: Light / Dark Mode Toggle

**User Story:** As a User, I want to switch between a light and dark color scheme, so that I can use the Dashboard comfortably in different lighting conditions.

#### Acceptance Criteria

1. THE Dashboard SHALL provide a toggle control that switches the Theme between Light and Dark.
2. WHEN the User activates the Theme toggle, THE Dashboard SHALL apply the selected Theme to all visible UI elements within 100 milliseconds, without a loading state or page reload.
3. WHEN the User sets a Theme, THE Dashboard SHALL persist the selected Theme to Local_Storage so that it is restored on subsequent page loads.
4. IF no Theme preference has been stored, OR IF the stored Theme value is invalid or unrecognized, THEN THE Dashboard SHALL apply the Light Theme by default.
5. THE Dashboard SHALL ensure color contrast ratios meet WCAG 2.1 AA minimums (4.5:1 for normal text, 3:1 for large text and UI components) in both the Light and Dark Themes.
6. WHEN the Dashboard loads, THE Dashboard SHALL apply the persisted Theme before rendering visible content to prevent a flash of the wrong Theme.

---

### Requirement 6: Data Persistence and Storage

**User Story:** As a User, I want all my data to be saved automatically in my browser, so that my tasks, links, name, and preferences are available every time I open the Dashboard.

#### Acceptance Criteria

1. WHEN the Dashboard writes data, THE Dashboard SHALL store all User data (Tasks, Quick Links, custom name, Theme preference) as serialized JSON in Local_Storage under distinct, namespaced keys.
2. WHEN the Dashboard loads, THE Dashboard SHALL deserialize and restore all data from Local_Storage before rendering the UI.
3. IF Local_Storage data for a given key is missing, unparseable as JSON, or structurally invalid (e.g., Tasks key is not an array, Theme key is not "light" or "dark"), THEN THE Dashboard SHALL initialize that key with its default value (Tasks: empty array, Quick Links: empty array, custom name: empty string, Theme: "light") and continue loading without error.
4. WHEN the User performs any action that modifies data, THE Dashboard SHALL write the updated data to Local_Storage within 100 milliseconds of the action, without requiring an explicit save action from the User.
5. IF a Local_Storage write operation fails (e.g., due to storage quota exhaustion), THEN THE Dashboard SHALL display a visible, non-blocking error notification informing the User that the change could not be saved.

---

### Requirement 7: Cross-Browser Compatibility and Performance

**User Story:** As a User, I want the Dashboard to load quickly and work reliably across major browsers, so that I can use it regardless of my browser preference.

#### Acceptance Criteria

1. IF the Dashboard is loaded on a connection of 25 Mbps or faster, THEN THE Dashboard SHALL complete loading and have all visible UI elements fully painted and interactive within 2 seconds in Chrome, Firefox, Edge, and Safari.
2. WHEN the User performs an interaction (button click, input submission, or timer tick), THE Dashboard SHALL display a visible response within 100 milliseconds of the input event.
3. THE Dashboard SHALL consist of exactly one HTML file, one CSS file located in a `css/` directory, and one JavaScript file located in a `js/` directory.
4. IF the Dashboard is opened via the `file://` protocol directly from the local file system, THEN THE Dashboard SHALL operate without errors, with all features (timer countdown, task input, data display, theme toggle) functioning correctly without a web server.

---

### Requirement 8: Visual Design and Accessibility

**User Story:** As a User, I want a clean, readable, and visually organized interface, so that I can use the Dashboard efficiently without visual clutter or confusion.

#### Acceptance Criteria

1. THE Dashboard SHALL apply a consistent typographic scale with a minimum body font size of 16px and heading sizes proportionally larger to ensure readability.
2. THE Dashboard SHALL use visually distinct card or section containers with clear boundaries (e.g., borders, background color, or shadow) to separate each widget area.
3. THE Dashboard SHALL display all interactive controls (buttons, inputs, toggles) with a minimum touch target size of 44×44 CSS pixels and sufficient spacing between adjacent controls to prevent accidental activation.
4. THE Dashboard SHALL maintain a responsive layout that adapts to viewport widths from 320px to 1920px without horizontal scrolling or content overflow.
5. THE Dashboard SHALL use semantic HTML elements (e.g., `<header>`, `<main>`, `<section>`, `<button>`) to ensure structural accessibility for assistive technologies.
